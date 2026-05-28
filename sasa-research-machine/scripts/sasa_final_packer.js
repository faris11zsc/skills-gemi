const fs = require('fs');
const path = require('path');

/**
 * Sasa Protocol: Super-Packer & Scholar's Surgery
 * Optimized for NotebookLM Shafi'i Research
 */

const WORD_LIMIT = 495000;
const SEPARATOR = '\n'.repeat(16); // 15 empty lines

function scrubMetadata(text) {
    // Scholar's Surgery: Scrub standalone metadata noise while maintaining 100% integrity
    // Heuristic: Remove lines that are only numbers, brackets, or "Page/Part" markers
    return text.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true; // Keep empty lines for structure
        // If line is just numbers, symbols, or common metadata headers
        if (/^[\d\s\[\]\(\)\-\.\/\\|]+$/.test(trimmed)) return false;
        if (/^(page|part|vol|جلد|صفحة|جزء)\s+\d+/i.test(trimmed)) return false;
        return true;
    }).join('\n');
}

function getWords(text) {
    // Safe-Split Algorithm: Use strict word-boundary splitting to protect Arabic diacritics
    return text.split(/[\s\t\r\n]+/).filter(w => w.length > 0);
}

async function runPacker(inputDir, outputDir, batchName) {
    console.log(`🛡️ Sasa Super-Packer starting for batch: ${batchName} ⚡`);
    
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} books to process.`);

    let allWords = [];
    let fileIndex = [];

    for (const file of files) {
        console.log(`Processing: ${file}`);
        let content = fs.readFileSync(path.join(inputDir, file), 'utf8');
        content = scrubMetadata(content);
        
        const words = getWords(content);
        
        // Record start position for report
        const startPos = allWords.length;
        
        // Add words to the stream
        allWords.push(...words);
        
        // Add 15-line separator (as a pseudo-word to keep count accurate or just append to the stream?)
        // The instructions say "separated by 15 empty lines". 
        // We'll insert a marker and handle it during join.
        allWords.push("__SASA_SEPARATOR__");
        
        fileIndex.push({
            title: file,
            wordCount: words.length,
            startWord: startPos
        });
    }

    // Slice into Giants
    let giantIndex = 1;
    let i = 0;
    while (i < allWords.length) {
        const chunk = allWords.slice(i, i + WORD_LIMIT);

        // Join words with space, but replace our separator marker with actual newlines
        let textOutput = chunk.join(' ').replace(/ __SASA_SEPARATOR__ /g, SEPARATOR).replace(/__SASA_SEPARATOR__/g, SEPARATOR);

        // Naming Convention: Part #, followed by "Part", then Dominant Book + others
        // Collect all books that have at least one word in this chunk
        const booksInChunk = fileIndex.filter(f => {
            const bookEnd = f.startWord + f.wordCount;
            const chunkEnd = i + WORD_LIMIT;
            // Overlap check
            return (f.startWord < chunkEnd && bookEnd > i);
        }).map(f => f.title.replace('.txt', ''));

        // Join titles with +, limit length to avoid OS errors
        let mergedTitles = booksInChunk.join('+');
        if (mergedTitles.length > 200) {
            mergedTitles = mergedTitles.substring(0, 197) + '...';
        }

        const fileName = `${giantIndex}-Part-${mergedTitles}.txt`;
        const outputPath = path.join(outputDir, fileName);
        fs.writeFileSync(outputPath, textOutput, 'utf8');

        console.log(`Generated Giant: ${fileName} (${chunk.length} words)`);

        i += WORD_LIMIT;
        giantIndex++;
    }


    // Generate Process_Report.txt
    const reportPath = path.join(outputDir, 'Process_Report.txt');
    let report = `Process Report: ${batchName}\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Words: ${allWords.length}\n`;
    report += `Total Giants: ${giantIndex - 1}\n\n`;
    report += `--- Full Index ---\n`;
    fileIndex.forEach((f, idx) => {
        report += `${idx + 1}. ${f.title} (${f.wordCount} words)\n`;
    });
    
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`Report generated at: ${reportPath}`);
}

const args = process.argv.slice(2);
const input = args[0] || './input';
const output = args[1] || './output';
const batch = args[2] || 'DefaultBatch';

runPacker(input, output, batch).catch(err => {
    console.error('❌ Packer Failure:', err);
    process.exit(1);
});
