# DEMO PROCESS — SUPER-PACKER v3.0
### The Sasa Protocol | NotebookLM Data Giant Generator

---

## What It Does

Converts any collection of files (PDF, EPUB, DOCX, TXT) into **Data Giants** — maximum-density `.txt` files calibrated to exactly **495,000 words** each — for NotebookLM upload. Cheats NotebookLM's source-count limit by maximizing data per file.

---

## The 7 Laws

1. **River of Text** — All books merge into a single endless stream, separated by 15 blank lines
2. **495,000-Word Giants** — Every giant (except the tail) is filled to exactly 495k words
3. **The Tail** — The last file is the only one allowed to have spare space
4. **Safe-Split** — Splits ONLY on word boundaries. Never mid-word, never mid-diacritic
5. **Scholar's Surgery** — Strips standalone metadata noise (page stamps, etc.), preserves 100% of actual content and diacritics
6. **Dominant-Naming** — `{N}-Part-{DominantBook}+{OtherBooks}.txt` (255-char limit)
7. **Process_Report.txt** — Saturation Audit + Full Index + Management Map per giant

---

## Installation (one time only)

```bash
cd D:\skills\demo-process
npm install
```

---

## Usage

### From command line:
```bash
node --max-old-space-size=26000 process.js -i "D:\books\Tafsir" -o "D:\processed\Tafsir" -b "Tafsir"
```

### From the launcher:
```
run.bat -i "D:\books\Tafsir" -o "D:\processed\Tafsir" -b "Tafsir"
```

---

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input` | Input directory (required) | — |
| `-o, --output` | Output directory (required) | — |
| `-b, --batch` | Batch name for the report | `Batch` |
| `-w, --words` | Words per Giant | `495000` |
| `-s, --sep` | Blank lines between books | `15` |

---

## Supported Formats

- `.txt` — Direct read (auto-detects encoding: UTF-8, Windows-1256, etc.)
- `.pdf` — pdf-parse
- `.epub` — Native ZIP/OPF parser (no Calibre required)
- `.docx` / `.doc` — mammoth

---

## Output Structure

```
OUTPUT_DIR/
├── 1-Part-{DominantBook}.txt          ← Full Giant (495,000 words)
├── 2-Part-{DominantBook}.txt          ← Full Giant
├── ...
├── N-Part-{DominantBook}+{Other}.txt  ← Tail (partial, last file)
└── Process_Report.txt                 ← Full report
```

---

## Memory

The script runs with `--max-old-space-size=26000` (26 GB heap cap).  
Adjust in `run.bat` or your command if needed (minimum recommended: 8 GB).
