const fs = require('fs');
const path = require('path');

/**
 * Sasa Protocol: Shrink & Purify
 * Removes unuseful books and re-saturates the giants.
 */

const WORD_LIMIT = 495000;
const SEPARATOR = '\n'.repeat(16);

function getWords(text) {
    return text.split(/[\s\t\r\n]+/).filter(w => w.length > 0);
}

async function runShrink(processedDir, booksToDelete, outputDir) {
    console.log(`🛡️ Sasa Shrink-Machine starting ⚡`);
    console.log(`Books to delete: ${booksToDelete.join(', ')}`);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Step 1: Read all processed giants and reconstruct the word stream, 
    // but skip content belonging to deleted books.
    
    // This is tricky because the giants are merged. 
    // We should ideally use the Process_Report.txt to identify boundaries.
    
    const reportPath = path.join(processedDir, 'Process_Report.txt');
    if (!fs.existsSync(reportPath)) {
        console.error("❌ Process_Report.txt not found. Cannot shrink safely.");
        process.exit(1);
    }

    const reportContent = fs.readFileSync(reportPath, 'utf8');
    const giants = fs.readdirSync(processedDir).filter(f => f.endsWith('.txt') && f !== 'Process_Report.txt');
    
    // We'll read ALL text from ALL giants into one stream, then split by SEPARATOR
    // to identify original books.
    let fullText = "";
    for (const giant of giants.sort((a, b) => parseInt(a) - parseInt(b))) {
        fullText += fs.readFileSync(path.join(processedDir, giant), 'utf8') + SEPARATOR;
    }

    // Split by SEPARATOR to get books
    let books = fullText.split(SEPARATOR).filter(b => b.trim().length > 0);
    console.log(`Found ${books.length} books in giants.`);

    // Filter out unuseful books
    // Since we don't have the original titles in the text easily, 
    // we'll use the report to match by order if possible, or just look for keywords.
    // For now, we'll assume the user provides keywords or indices.
    
    let filteredBooks = books.filter(book => {
        const isUnuseful = booksToDelete.some(keyword => book.includes(keyword));
        return !isUnuseful;
    });

    console.log(`Books remaining after purification: ${filteredBooks.length}`);

    // Step 2: Re-pack the filtered books into saturated giants
    let allWords = [];
    let fileIndex = [];
    filteredBooks.forEach((bookContent, idx) => {
        const words = getWords(bookContent);
        const startPos = allWords.length;
        allWords.push(...words);
        allWords.push("__SASA_SEPARATOR__");
        fileIndex.push({
            title: `Book-${idx + 1}`, // We don't have original titles here, but we can keyword match if we had the report.
            wordCount: words.length,
            startWord: startPos
        });
    });

    let giantIndex = 1;
    let i = 0;
    while (i < allWords.length) {
        const chunk = allWords.slice(i, i + WORD_LIMIT);
        let textOutput = chunk.join(' ').replace(/ __SASA_SEPARATOR__ /g, SEPARATOR).replace(/__SASA_SEPARATOR__/g, SEPARATOR);
        
        const booksInChunk = fileIndex.filter(f => {
            const bookEnd = f.startWord + f.wordCount;
            const chunkEnd = i + WORD_LIMIT;
            return (f.startWord < chunkEnd && bookEnd > i);
        }).map(f => f.title);

        let mergedTitles = booksInChunk.join('+');
        if (mergedTitles.length > 200) mergedTitles = mergedTitles.substring(0, 197) + '...';

        const fileName = `${giantIndex}-Part-Purified-${mergedTitles}.txt`;
        const outputPath = path.join(outputDir, fileName);
        fs.writeFileSync(outputPath, textOutput, 'utf8');
        
        console.log(`Generated Purified Giant: ${fileName} (${chunk.length} words)`);
        
        i += WORD_LIMIT;
        giantIndex++;
    }

    console.log(`✅ Shrink complete. Total Giants: ${giantIndex - 1}`);
}

const args = process.argv.slice(2);
const processed = args[0] || './processed';
const toDelete = (args[1] || '').split(',').map(s => s.trim()).filter(s => s);
const output = args[2] || './purified';

runShrink(processed, toDelete, output).catch(err => {
    console.error('❌ Shrink Failure:', err);
    process.exit(1);
});
