---
name: scounter
description: Quranic syllable analysis and filtering. Use this skill to count syllables in Quranic verses or phrases between stopping symbols (Waqf).
---

# Scounter: Quranic Syllable Analyzer

Analyze and filter Quranic verses based on precise phonological syllable counting rules.

## Core Workflow

Before performing any analysis, you **MUST** guide the user through the following 4-step requirement gathering phase:

1.  **Syllable Target**: Ask the user for the target syllable count (or range).
2.  **Target Mode**: Ask "Are you targeting verses, phrases, or both?"
3.  **Linguistic Rule**: Ask "Are you targeting any specific rule?" (e.g., Full Assimilation/Idgham Kamil).
4.  **Red Lines**: Ask "What are the red lines that cannot be in the output?" (e.g., Iqlab, Madd Lazim). These represent exclusions that disqualify an entire instance if present.

### Execution Mode

- **Verse Mode**: Counts syllables for the entire Ayah.
- **Phrase Mode**: Breaks the Ayah into segments based on Waqf symbols (ۖ, ۗ, ۘ, ۚ, ۛ, ۜ).
- **Both Mode**: Combines Full Verses and Phrase Segments.

### Formatting & Rules

- **Default Output**: Saves results to a CSV file with full context.
- **Chat Output**: (When requested) Lists only `Text (Surah:Ayah)` grouped by syllable count.
- **Waqf Logic**: Explicitly ignores the "No Stop" symbol `\u06d9` (ۙ).
- **Phonological Collapse**: Correctly handles Uthmani overlaps (e.g., Fatha + Superscript Alif counts as 1).
- **Red Line Integrity**: If a "Red Line" rule is detected anywhere in a verse or phrase, that entire instance MUST be excluded from the results.

### Basic Usage

**Mode 1: Full Verse Analysis**
```powershell
python <path-to-skill>/scripts/scount.py <corpus_path> 5 --mode verse
```

**Mode 2: Phrase Segment Analysis**
```powershell
python <path-to-skill>/scripts/scount.py <corpus_path> 8 --mode phrase
```

**Mode 3: Combined Analysis (Both)**
```powershell
python <path-to-skill>/scripts/scount.py <corpus_path> 4 --mode both
```

### Options
- `--mode`: `verse`, `phrase`, or `both` (default: `verse`).
- `--output`: Path to save results as a CSV.

## Phonological Rules (Summary)

- **Waqf Symbols**: The following symbols are used as phrase boundaries: ۖ, ۗ, ۘ, ۚ, ۛ, ۜ.
- **Waqf Rule**: Drop the final short vowel at the end of a verse or phrase (decreases count by 1).
- **Onset Rule**: Every syllable starts with a consonant (including implicit Hamzatul Wasl).
- **Shadda**: Geminates mark syllable boundaries (CVC | CV).
- **Implicit Vowels**: Handles implicit long 'ā' in "Allah" and initial Hamzatul Wasl.

For a detailed breakdown of rules and examples, see [references/rules.md](references/rules.md).
