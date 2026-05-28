---
name: demo-process
description: Super-Packer v3.0 for the Sasa Protocol. Converts collections of files (PDF, EPUB, DOCX, TXT) into 495,000-word "Data Giants" optimized for NotebookLM.
---

# DEMO PROCESS — SUPER-PACKER v3.0

The high-performance engine for the **Sasa Protocol**. Calibrated to maximize NotebookLM's source-count limit by creating maximum-density "Data Giants".

## The 7 Laws of the Sasa Protocol
1. **River of Text**: Books merge into a single stream with 15-line separations.
2. **495,000-Word Giants**: Saturated files for maximum efficiency.
3. **The Tail**: Only the final file contains spare space.
4. **Safe-Split**: Splitting occurs strictly on word boundaries.
5. **Scholar's Surgery**: Removes metadata noise while preserving 100% text/diacritics.
6. **Dominant-Naming**: Intelligent file naming based on content.
7. **Process_Report.txt**: Full saturation audit and management map.

## Core Commands

### Pack a Directory
```bash
node --max-old-space-size=26000 C:\Users\sdd\.gemini-account-6\.gemini\skills\demo-process\process.js -i "[INPUT_DIR]" -o "[OUTPUT_DIR]" -b "[BATCH_NAME]"
```

### Options
- `-i, --input`: Input directory path.
- `-o, --output`: Output directory path.
- `-b, --batch`: Batch name for the report (default: `Batch`).
- `-w, --words`: Words per Giant (default: `495000`).
- `-s, --sep`: Blank lines between books (default: `15`).

## Supported Formats
- **PDF**: Surgical text extraction.
- **EPUB**: Native ZIP/OPF parsing.
- **DOCX/DOC**: via Mammoth.
- **TXT**: Multi-encoding support (UTF-8, Windows-1256).

## Requirements
- Node.js
- Dependencies: `npm install` (already handled in skill folder).
