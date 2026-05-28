const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');

async function merge(output, files) {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
        const bytes = fs.readFileSync(file);
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const bytes = await mergedPdf.save();
    fs.writeFileSync(output, bytes);
    console.log(`Merged ${files.length} files into ${output}`);
}

async function split(input, output, range) {
    const bytes = fs.readFileSync(input);
    const pdf = await PDFDocument.load(bytes);
    const newPdf = await PDFDocument.create();
    
    let indices = [];
    if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        for (let i = start - 1; i < end; i++) indices.push(i);
    } else {
        indices = range.split(',').map(n => Number(n) - 1);
    }

    const copiedPages = await newPdf.copyPages(pdf, indices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    
    const outBytes = await newPdf.save();
    fs.writeFileSync(output, outBytes);
    console.log(`Extracted pages ${range} from ${input} to ${output}`);
}

async function extractText(input) {
    const bytes = fs.readFileSync(input);
    const data = await pdfParse(bytes);
    console.log('--- TEXT CONTENT ---');
    console.log(data.text);
}

async function ocr(input, pageNum = 1, lang = 'ara+eng') {
    console.log(`Converting page ${pageNum} to image...`);
    const pngPages = await pdfToPng(input, {
        pagesToProcess: [pageNum],
        viewportScale: 2.0
    });
    
    const pngBuffer = pngPages[0].content;
    console.log(`Running OCR (lang: ${lang})...`);
    const { data: { text } } = await Tesseract.recognize(pngBuffer, lang);
    console.log('--- OCR RESULT ---');
    console.log(text);
}

async function metadata(input) {
    const bytes = fs.readFileSync(input);
    const pdf = await PDFDocument.load(bytes);
    console.log('Title:', pdf.getTitle());
    console.log('Author:', pdf.getAuthor());
    console.log('Subject:', pdf.getSubject());
    console.log('Page Count:', pdf.getPageCount());
}

async function replaceFirstWithImage(pdfPath, imgPath, outputPath) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const imgBytes = fs.readFileSync(imgPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newPdfDoc = await PDFDocument.create();

    let image;
    if (imgPath.toLowerCase().endsWith('.png')) {
        image = await newPdfDoc.embedPng(imgBytes);
    } else {
        image = await newPdfDoc.embedJpg(imgBytes);
    }
    
    const { width, height } = image.scale(1);
    const firstPage = newPdfDoc.addPage([width, height]);
    firstPage.drawImage(image, { x: 0, y: 0, width, height });

    const pagesCount = pdfDoc.getPageCount();
    if (pagesCount > 1) {
        const pagesToCopy = Array.from({ length: pagesCount - 1 }, (_, i) => i + 1);
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
        copiedPages.forEach((p) => newPdfDoc.addPage(p));
    }

    const resultBytes = await newPdfDoc.save();
    fs.writeFileSync(outputPath, resultBytes);
    console.log(`Successfully replaced first page with image. Output: ${outputPath}`);
}

async function imageToPdf(imgPath, outputPath) {
    const imgBytes = fs.readFileSync(imgPath);
    const pdfDoc = await PDFDocument.create();

    let image;
    if (imgPath.toLowerCase().endsWith('.png')) {
        image = await pdfDoc.embedPng(imgBytes);
    } else {
        image = await pdfDoc.embedJpg(imgBytes);
    }
    
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });

    const resultBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, resultBytes);
    console.log(`Successfully converted image to PDF. Output: ${outputPath}`);
}

const [,, command, ...args] = process.argv;

(async () => {
    try {
        if (command === 'merge') {
            const outIndex = args.indexOf('--output');
            const output = args[outIndex + 1];
            const files = args.filter((a, i) => a !== '--output' && i !== outIndex + 1 && !a.startsWith('--'));
            await merge(output, files);
        } else if (command === 'split') {
            const input = args[args.indexOf('--input') + 1];
            const output = args[args.indexOf('--output') + 1];
            const range = args[args.indexOf('--pages') + 1];
            await split(input, output, range);
        } else if (command === 'image-to-pdf') {
            const img = args[args.indexOf('--img') + 1];
            const output = args[args.indexOf('--output') + 1];
            await imageToPdf(img, output);
        } else if (command === 'replace-first-with-image') {
            const pdf = args[args.indexOf('--pdf') + 1];
            const img = args[args.indexOf('--img') + 1];
            const output = args[args.indexOf('--output') + 1];
            await replaceFirstWithImage(pdf, img, output);
        } else if (command === 'text') {
            await extractText(args[0]);
        } else if (command === 'ocr') {
            const input = args[0];
            const page = args[1] ? parseInt(args[1]) : 1;
            const lang = args[2] || 'ara+eng';
            await ocr(input, page, lang);
        } else if (command === 'info') {
            await metadata(args[0]);
        } else {
            console.log('Usage:');
            console.log('  node pdf_engine.cjs merge --output final.pdf file1.pdf file2.pdf');
            console.log('  node pdf_engine.cjs split --input doc.pdf --output split.pdf --pages 1-5');
            console.log('  node pdf_engine.cjs text doc.pdf');
            console.log('  node pdf_engine.cjs ocr doc.pdf [page] [lang]');
            console.log('  node pdf_engine.cjs info doc.pdf');
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
