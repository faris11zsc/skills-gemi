---
name: q-rasm
description: High-fidelity Quranic Arabic PDF rendering with Madinah Mushaf (Uthman Taha) calligraphy. Use when typesetting Quran verses, creating mission replicas, or rendering pixel-perfect Arabic with floating-Ḥamza ligatures.
---

# qRasm 🛡️⚡

qRasm provides a specialized engine for rendering Quranic Arabic text into high-fidelity PDFs. It solves complex typographic challenges like the floating-Ḥamza ligature (ٱلۡءَا) and ensures perfect centering of RTL text.

## Core Capabilities

1. **Pixel-Perfect Typography**: Automates font switching between `Arabic Typesetting` and `KFGQPC Uthmanic Script Hafs` for exact calligraphy.
2. **Visual Centering**: Implements a robust centering algorithm that accounts for HarfBuzz's RTL visual reordering.
3. **Mission Replica Generation**: Builds 8-item-per-page grid documents following the "Bible" spec.

## Workflows

### 1. Render a Mission Replica
To process a dataset into a standard 8-item-per-page PDF:
1. Prepare your data in the format: `Num. Ref_Num, Surah — Text`.
2. Use the mission builder script:
   ```powershell
   python q-rasm/scripts/mission_builder.py [output_path.pdf]
   ```

### 2. Custom Verse Rendering
To render specific verses with custom styling, use the `ArabicPDFBuilder` class in `scripts/render_engine.py`:
```python
from q_rasm.scripts.render_engine import ArabicPDFBuilder

builder = ArabicPDFBuilder("output.pdf")
builder.add(verse="ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ", surah="الفاتحة", ayah="٢")
builder.build()
```

## Typographic Rules

- **Floating Hamza**: The sequence `ٱلۡءَا` must trigger a switch to the `KFGQPC Hafs` font with `rlig` (Required Ligatures) enabled.
- **Sukun Normalization**: Standard sukun (`\u0652`) should be converted to Uthmani sukun (`\u06E1`) before rendering.
- **RTL Centering**: Always calculate the total width of all segments first. Start drawing from `center_x - (total_width / 2)` and move Right (Visual LTR).

## References

- **Grid Standards**: See [grid_spec.md](references/grid_spec.md) for precise layout measurements and colors.

## Technical Requirements

- **Fonts**: Requires `C:\Windows\Fonts\arabtype.ttf` and `KFGQPC_Uthmanic_Hafs.ttf`.
- **Packages**: `reportlab`, `fonttools`, `uharfbuzz`, `arabic-reshaper`, `regex`.
