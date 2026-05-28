# "Bible" 8-Item Grid Spec 📐

This reference defines the visual standards for Quranic mission replicas.

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Background** | `#FCFAF5` | Cream color for the page. |
| **Verse Color** | `#0C194C` | Navy blue for the main Arabic text. |
| **Metadata Color**| `#969696` | Grey for item numbers, references, and dividers. |
| **Items per Page**| 8 | Maximum slots per A4 page. |
| **Item Height** | `0.11 × textheight` | Height of each item slot. |
| **Verse Font Size**| 32 pt | Size for the main Quranic verse. |
| **Ref Font Size** | 14 pt | Size for the Surah and Ayah reference. |
| **ID Font Size**  | 10 pt | Size for the #Number metadata. |
| **Divider** | 0.3 pt | Grey horizontal rule after each item. |

## Layout Logic

1. **ID Position:** Top of the slot (`y_top - 15pt`).
2. **Verse Position:** Center of the slot (`y_center - 2pt`).
3. **Reference Position:** Bottom of the slot (`y_bottom + 12pt`).
4. **Alignment:** Perfectly centered horizontally using the visual LTR logic.
