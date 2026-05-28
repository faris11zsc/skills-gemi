# Scholarly PDF Guidelines

Handling Islamic scholarly works and Quranic texts requires specific attention to detail.

## 1. Rasm and Diacritics
- Ensure that fonts used for PDF generation support specialized glyphs (e.g., Uthmani script).
- When extracting text, use libraries that handle Unicode normalization correctly (NFC vs NFD) to avoid breaking shadda, fatha, etc.

## 2. Metadata for Scholars
- **Title**: Use the full title of the work, including the author's name if customary.
- **Author**: Use the full name and any honorifics if preferred.
- **Keywords**: Include terms like 'Fiqh', 'Hadith', 'Shafi'i', etc., for better searchability.

## 3. Visual Styling
- **Margins**: Traditional texts often require wider margins for annotations (Hashiya).
- **Page Numbering**: Ensure page numbering matches the physical edition if reproducing a specific print.

## 4. Rasm Fidelity
When modifying replicas (like `mission_replica_hafs.pdf`), always use high-fidelity embedding to prevent losing shadda or shadda-fatha combinations which can be fragile in lower-quality PDF processors.
