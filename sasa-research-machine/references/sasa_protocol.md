# Sasa Protocol: High-Integrity Scholarly Text Processing

The Sasa Protocol is a specialized framework for preparing massive Islamic research libraries for ingestion into NotebookLM. It prioritizes data integrity, scholarly diacritics, and maximum token saturation.

## 1. Super-Packer Logic
- **Continuous Stream**: Books are treated as a continuous UTF-8 river.
- **15-Line Separators**: Every book in the stream is separated by exactly 15 empty lines to signal context shifts to the AI.
- **Saturation Rule**: Each "Data Giant" file must be packed to exactly 495,000 words to guarantee 99% NotebookLM source saturation.
- **Sequential Refilling**: During purification (deleting books), subsequent text must be pulled forward to ensure all files except the final one remain fully saturated.

## 2. Scholar's Surgery
- **Metadata Scrubbing**: Standalone digital noise (page/part stamps, digital headers) must be removed.
- **Retention Priority**: If a line contains *any* scholarly text alongside metadata, it must be KEPT. "If in doubt, KEEP IT."
- **Diacritic Integrity**: 100% preservation of Arabic diacritics (Harakat) and special characters.

## 3. Safe-Split Algorithm
- **Whitespace Boundary**: All file splits must occur strictly at whitespace or newline boundaries.
- **Character Safety**: Never slice an Arabic character or a diacritic. Use stream-aware splitting.

## 4. Dominant-Naming Convention
- **Format**: `[Part #]-[Dominant Book Name]-[Included Titles].txt`
- **Limit**: Max 255 characters.

## 5. Transition-Aware Reporting
- Every batch must include a `Process_Report.txt` featuring:
    - **Saturation Proof**: Confirmation of word counts.
    - **Full Index**: Title and Author of all included works.
    - **Content Map**: Start and end points for major texts.

## 6. Technical Execution
- **Node.js Heap**: Scale to 8GB-26GB using `--max-old-space-size=26624` to handle high-volume research.
- **UTF-8 Stream**: All processing must use UTF-8 encoding.
