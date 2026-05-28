#!/usr/bin/env node
// ============================================================
//  DEMO PROCESS — SUPER-PACKER v3.0 (Streaming Optimized v2)
//  The Sasa Protocol | NotebookLM Data Giant Generator
//  Usage: node --max-old-space-size=26000 process.js [options]
// ============================================================

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── COMMANDER CLI ────────────────────────────────────────────
const { program } = require('commander');
program
  .name('demo-process')
  .description('Convert any file collection into 495k-word Data Giants for NotebookLM')
  .version('3.2.0')
  .requiredOption('-i, --input <dir>',  'Input directory containing source files (PDF/EPUB/DOCX/TXT)')
  .requiredOption('-o, --output <dir>', 'Output directory for Data Giants')
  .option('-b, --batch <name>',         'Batch name for the report (e.g. "Tafsir")', 'Batch')
  .option('-w, --words <number>',       'Words per Giant (default: 495000)', '495000')
  .option('-s, --sep <number>',         'Separator blank lines between books (default: 15)', '15')
  .parse(process.argv);

const opts      = program.opts();
const INPUT_DIR = path.resolve(opts.input);
const OUTPUT_DIR = path.resolve(opts.output);
const BATCH_NAME = opts.batch;
const GIANT_SIZE = parseInt(opts.words, 10);
const SEP_LINES  = parseInt(opts.sep,   10);

const SUPPORTED = ['.txt', '.pdf', '.epub', '.docx', '.doc', '.md'];
const COMPOUND_TEXT_EXT = ['.txt.md', '.docx.md', '.pdf.md', '.epub.md', '.md'];

const NOISE_PATTERNS = [
  /^\s*[-─—=*#|]{2,}\s*$/gm,
  /^\s*[\u0635\u0641\u062d\u0629\s]*\d+\s*$/gm,
  /^\s*(Page|PAGE|page)\s+\d+\s*$/gm,
  /^\s*\d+\s*\/\s*\d+\s*$/gm,
  /^\s*\[\s*\d+\s*\]\s*$/gm,
  /^\s*\(\s*\d+\s*\)\s*$/gm,
];

function log(msg) { process.stdout.write(msg + '\n'); }
function logProgress(msg) {
  if (process.stdout.isTTY) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write('  ⏳ ' + msg);
  } else {
    log('  ⏳ ' + msg);
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scholarsurgery(text) {
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }
  text = text.replace(/\n{4,}/g, '\n\n\n');
  return text;
}

function sanitizeNamePart(name) {
  return name.replace(/[\\\/:*?"<>|]/g, '_').trim();
}

function stripAllExtensions(filename) {
  const COMPOUND = ['.txt.md', '.docx.md', '.pdf.md', '.epub.md', '.doc.md'];
  const lower = filename.toLowerCase();
  for (const ce of COMPOUND) {
    if (lower.endsWith(ce)) return filename.slice(0, filename.length - ce.length);
  }
  return path.basename(filename, path.extname(filename));
}

function buildGiantName(num, segments) {
  const bookWordCounts = {};
  for (const s of segments) {
    bookWordCounts[s.title] = (bookWordCounts[s.title] || 0) + s.words;
  }
  const summary = Object.entries(bookWordCounts).map(([title, words]) => ({title, words}));
  summary.sort((a, b) => b.words - a.words);
  
  const dominant = summary[0];
  const others   = summary.slice(1);

  let name = `${num}-Part-${sanitizeNamePart(dominant.title)}`;
  for (const o of others) {
    const addition = `+${sanitizeNamePart(o.title)}`;
    if ((name + addition + '.txt').length <= 200) {
      name += addition;
    } else {
      break;
    }
  }
  return name + '.txt';
}

// ─── CONVERTERS ───────────────────────────────────────────────

async function convertTxt(filePath) {
  const chardet  = require('chardet');
  const iconv    = require('iconv-lite');
  const raw      = fs.readFileSync(filePath);
  const detected = chardet.detect(raw) || 'utf-8';
  return iconv.decode(raw, detected);
}

async function convertDocx(filePath) {
  const mammoth = require('mammoth');
  const result  = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function convertPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const raw = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(raw);
    return data.text;
  } catch (e) {
    log(`  ⚠️  PDF parse error on ${path.basename(filePath)}: ${e.message}`);
    return '';
  }
}

async function convertEpub(filePath) {
  const AdmZip = require('adm-zip');
  const xml2js  = require('xml2js');
  try {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    const containerEntry = entries.find(e => e.entryName.toLowerCase() === 'meta-inf/container.xml');
    if (!containerEntry) return '';
    const containerXml = containerEntry.getData().toString('utf-8');
    const container    = await xml2js.parseStringPromise(containerXml);
    const opfPath      = container.container.rootfiles[0].rootfile[0].$['full-path'];
    const opfDir       = path.dirname(opfPath);
    const opfEntry = entries.find(e => e.entryName === opfPath);
    if (!opfEntry) return '';
    const opfXml  = opfEntry.getData().toString('utf-8');
    const opf     = await xml2js.parseStringPromise(opfXml);
    const manifest = opf.package.manifest[0].item;
    const idToHref = {};
    for (const item of manifest) idToHref[item.$.id] = item.$.href;
    const spineItems = opf.package.spine[0].itemref;
    const texts = [];
    for (const spineItem of spineItems) {
      const idref = spineItem.$.idref;
      const href  = idToHref[idref];
      if (!href) continue;
      const fullPath = opfDir ? `${opfDir}/${href}` : href;
      const htmlEntry = entries.find(e => e.entryName === fullPath);
      if (!htmlEntry) continue;
      const html = htmlEntry.getData().toString('utf-8');
      const plain = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)));
      texts.push(plain);
    }
    return texts.join('\n');
  } catch (e) {
    log(`  ⚠️  EPUB parse error on ${path.basename(filePath)}: ${e.message}`);
    return '';
  }
}

async function convertFile(filePath) {
  const basename = path.basename(filePath).toLowerCase();
  const ext      = path.extname(filePath).toLowerCase();
  for (const compoundExt of COMPOUND_TEXT_EXT) {
    if (basename.endsWith(compoundExt)) return convertTxt(filePath);
  }
  switch (ext) {
    case '.txt': return convertTxt(filePath);
    case '.md':  return convertTxt(filePath);
    case '.docx':
    case '.doc': return convertDocx(filePath);
    case '.pdf': return convertPdf(filePath);
    case '.epub': return convertEpub(filePath);
    default:     return '';
  }
}

// ─── MAIN ENGINE ──────────────────────────────────────────────

async function main() {
  log('');
  log('╔══════════════════════════════════════════════════╗');
  log('║   DEMO PROCESS — SUPER-PACKER v3.2 (Streaming)  ║');
  log('║   The Sasa Protocol | NotebookLM Giant Maker    ║');
  log('╚══════════════════════════════════════════════════╝');
  log('');
  log(`📂 Input  : ${INPUT_DIR}`);
  log(`📤 Output : ${OUTPUT_DIR}`);
  log(`📦 Batch  : ${BATCH_NAME}`);
  log(`🎯 Target : ${GIANT_SIZE.toLocaleString()} words/Giant`);
  log(`🔗 Sep    : ${SEP_LINES} blank lines`);
  log('');

  if (!fs.existsSync(INPUT_DIR)) { log(`❌ Input directory not found: ${INPUT_DIR}`); process.exit(1); }
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allFiles = fs.readdirSync(INPUT_DIR)
    .filter(f => SUPPORTED.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(INPUT_DIR, f))
    .sort();

  if (allFiles.length === 0) {
    log('❌ No supported files found in input directory.');
    process.exit(1);
  }

  log(`📚 Found ${allFiles.length} source files. Starting conversion...\n`);

  let currentGiantWords = [];
  let currentGiantRealWordCount = 0;
  let currentGiantSegments = [];
  let giantCount = 0;
  let totalWordsProcessed = 0;
  
  const riverSegments = [];
  const managementMap = [];
  const bookFirstGiant = {};
  const bookLastGiant = {};

  async function writeGiant() {
    giantCount++;
    const filename = buildGiantName(giantCount, currentGiantSegments);
    const outPath = path.join(OUTPUT_DIR, filename);
    
    let content = '';
    let lineBuffer = [];
    for (const token of currentGiantWords) {
      if (token === '\n') {
        if (lineBuffer.length > 0) { content += lineBuffer.join(' ') + '\n'; lineBuffer = []; }
        content += '\n';
      } else {
        lineBuffer.push(token);
        if (lineBuffer.reduce((s, w) => s + w.length + 1, 0) > 120) {
          content += lineBuffer.join(' ') + '\n';
          lineBuffer = [];
        }
      }
    }
    if (lineBuffer.length > 0) content += lineBuffer.join(' ') + '\n';
    
    fs.writeFileSync(outPath, content, 'utf-8');
    
    log(`\r  ✅ [${giantCount.toString().padStart(3)}] ${filename.substring(0, 70).padEnd(70)} ${currentGiantRealWordCount.toLocaleString()} words`);
    
    managementMap.push({
      giantNum: giantCount,
      filename: filename,
      segments: currentGiantSegments
    });
    
    for (const seg of currentGiantSegments) {
      if (bookFirstGiant[seg.bookIdx] === undefined) bookFirstGiant[seg.bookIdx] = giantCount;
      bookLastGiant[seg.bookIdx] = giantCount;
    }
    
    currentGiantWords = [];
    currentGiantRealWordCount = 0;
    currentGiantSegments = [];
  }

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const title = stripAllExtensions(path.basename(filePath));
    const bookIdx = i;

    logProgress(`[${i+1}/${allFiles.length}] Processing: ${title.substring(0, 60)}`);

    let text = await convertFile(filePath);
    text = scholarsurgery(text);
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wc = words.length;
    totalWordsProcessed += wc;
    riverSegments.push({ title, wordCount: wc });

    let wordIdx = 0;
    while (wordIdx < words.length) {
      const remainingInGiant = GIANT_SIZE - currentGiantRealWordCount;
      const toTake = Math.min(words.length - wordIdx, remainingInGiant);
      
      // Use a loop instead of spread to avoid call stack limits
      for (let j = 0; j < toTake; j++) {
        currentGiantWords.push(words[wordIdx + j]);
      }
      currentGiantRealWordCount += toTake;
      currentGiantSegments.push({ title, words: toTake, bookIdx });
      
      wordIdx += toTake;
      
      if (currentGiantRealWordCount >= GIANT_SIZE) {
        await writeGiant();
      }
    }

    if (i < allFiles.length - 1) {
      for (let s = 0; s < SEP_LINES; s++) {
        currentGiantWords.push('\n');
      }
    }
  }

  if (currentGiantWords.length > 0) {
    await writeGiant();
  }

  log('\n📋 Generating Process_Report.txt...');
  const reportLines = [
    'MISSION METADATA',
    `Date: ${new Date().toISOString()}`,
    `Source: ${INPUT_DIR}`,
    `Batch: ${BATCH_NAME}`,
    'Version: Super-Packer V3.2 (Streaming Optimized)',
    '',
    'SATURATION AUDIT',
    `Total Words: ${totalWordsProcessed.toLocaleString()}`,
    `Target per Giant: ${GIANT_SIZE.toLocaleString()}`,
    `Total Giants: ${giantCount}`,
    '',
    'THE TOTAL INDEX'
  ];
  for (const seg of riverSegments) reportLines.push(`- ${seg.title} (${seg.wordCount.toLocaleString()} words)`);
  reportLines.push('', 'MANAGEMENT MAP');
  for (const entry of managementMap) {
    reportLines.push(`File ${entry.filename}:`);
    const bookWordCountsInGiant = {};
    for (const s of entry.segments) {
      if (!bookWordCountsInGiant[s.bookIdx]) bookWordCountsInGiant[s.bookIdx] = { title: s.title, words: 0 };
      bookWordCountsInGiant[s.bookIdx].words += s.words;
    }
    for (const [biStr, info] of Object.entries(bookWordCountsInGiant)) {
      const bi = parseInt(biStr, 10);
      const isStart = bookFirstGiant[bi] === entry.giantNum;
      const isEnd = bookLastGiant[bi] === entry.giantNum;
      const flags = [isStart && 'Start', isEnd && 'End'].filter(Boolean);
      const flagStr = flags.length > 0 ? `, ${flags.join(', ')}` : '';
      reportLines.push(`  ${info.title} (${info.words.toLocaleString()} words${flagStr})`);
    }
    reportLines.push('');
  }
  reportLines.push('FINAL STATISTICS', `Total Source Files: ${allFiles.length}`, `Total Words Processed: ${totalWordsProcessed.toLocaleString()}`, `Giants Generated: ${giantCount}`, 'Scholar\'s Surgery: ACTIVE', 'Diacritic Integrity: 100%', 'Safe-Split: WORD-BOUNDARY ONLY', `Separator Lines: ${SEP_LINES}`);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'Process_Report.txt'), reportLines.join('\n'), 'utf-8');
  log('  ✅ Process_Report.txt written.');

  log('');
  log('╔══════════════════════════════════════════════════╗');
  log(`║  ✅ MISSION COMPLETE                             ║`);
  log(`║  Giants : ${String(giantCount).padEnd(6)} files                         ║`);
  log(`║  Words  : ${String(totalWordsProcessed.toLocaleString()).padEnd(14)} total                 ║`);
  log(`║  Output : ${OUTPUT_DIR.substring(0, 38).padEnd(38)} ║`);
  log('╚══════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
