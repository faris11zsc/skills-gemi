---
name: sasa-research-machine
description: High-integrity text processing for Shafi'i Fiqh and Islamic scholarly works. Implements the Sasa Protocol for NotebookLM optimization, metadata scrubbing, and saturated data packing.
---

# Sasa Research Machine 🛡️⚡

This skill implements the **Sasa Protocol**, a high-integrity workflow for preparing massive Islamic scholarly libraries for AI research (specifically NotebookLM).

## Core Features

- **Super-Packer**: Merges texts into saturated 495,000-word "Data Giants".
- **Scholar's Surgery**: Surgically removes digital noise while preserving 100% of scholarly text and Arabic diacritics.
- **Shrink-Machine**: Purifies libraries by removing unuseful books and re-saturating files.

## Workflows

### 1. Process a New Category
To process a folder of research books:
1. Locate the source `.txt` files.
2. Run the packer script:
   ```bash
   node scripts/sasa_final_packer.js [input_dir] [output_dir] [batch_name]
   ```
3. Review the `Process_Report.txt` in the output directory.

### 2. Purify and Shrink
To remove specific books and re-saturate:
1. Identify books to delete from the `Process_Report.txt`.
2. Run the shrink script:
   ```bash
   node scripts/shrink_files.js [processed_dir] "Book1,Book2" [purified_dir]
   ```

## References
- See [sasa_protocol.md](references/sasa_protocol.md) for full protocol details.

## Technical Notes
- **Memory**: For large batches, use `node --max-old-space-size=26624`.
- **Integrity**: Never allow summarization or grammar fixes. 100% copy-paste fidelity is mandatory.
