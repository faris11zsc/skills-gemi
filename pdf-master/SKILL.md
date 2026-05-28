---
name: pdf-master
description: Advanced PDF orchestration, editing, and styling. Use for merging, splitting, compressing, metadata editing, OCR (Optical Character Recognition), and programmatic PDF generation. Supports Arabic/English text extraction.
---

# PDF Master Skill (Enhanced)

This skill transforms Gemini CLI into a master of PDF manipulation using a pure JavaScript toolchain for maximum portability and reliability.

## Core Capabilities

- **Merging & Splitting**: High-fidelity document assembly and page extraction.
- **OCR (Optical Character Recognition)**: Extract text from scanned PDFs (Images) using Tesseract.js. Supports `ara` (Arabic) and `eng` (English).
- **Text Extraction**: Fast extraction of selectable text from searchable PDFs.
- **PDF-to-Image**: Convert PDF pages to high-resolution PNG images.
- **Metadata Management**: Read and write PDF document properties.
- **Scholarly Preservation**: Logic specifically tuned to preserve rasm, diacritics, and complex layouts in Islamic texts.

## Usage Workflows

### 1. Advanced OCR (Scanned Documents)
`node scripts/pdf_engine.cjs ocr scanned_doc.pdf [page_number] [lang]`
Example for Arabic scholarly page: `node scripts/pdf_engine.cjs ocr book.pdf 5 ara+eng`

### 2. Fast Text Extraction
`node scripts/pdf_engine.cjs text searchable_doc.pdf`

### 3. Document Assembly
`node scripts/pdf_engine.cjs merge --output combined.pdf section1.pdf section2.pdf`

## Bundled Resources

- `scripts/pdf_engine.cjs`: The multi-tool orchestration engine.
- `references/scholarly_pdf.md`: Guidance on preserving Arabic script fidelity and scholarly layouts.

## Technical Details
- Engine: `pdf-lib`, `pdf-parse`, `tesseract.js`, `pdf-to-png-converter`.
- No external native dependencies required (Pure JS/Wasm).
