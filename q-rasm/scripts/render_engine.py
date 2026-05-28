import sys
import regex
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from fontTools.ttLib import TTFont
import uharfbuzz as hb
from fontTools.pens.basePen import BasePen

# Constants - Update these paths if necessary
ARABIC_TYPESETTING_PATH = r"C:\Windows\Fonts\arabtype.ttf"

# Robustly find the Hafs font
KFGQPC_HAFS_PATH_DEFAULT = r"C:\Windows\Fonts\UthmanicHafs1Ver18.ttf"
KFGQPC_HAFS_PATH_ALT = r"C:\Users\sdd\.openclaw\workspace\skills\quran-rasm-exact-replica\assets\fonts\KFGQPC_Uthmanic_Hafs.ttf"

if os.path.exists(KFGQPC_HAFS_PATH_DEFAULT):
    KFGQPC_HAFS_PATH = KFGQPC_HAFS_PATH_DEFAULT
elif os.path.exists(KFGQPC_HAFS_PATH_ALT):
    KFGQPC_HAFS_PATH = KFGQPC_HAFS_PATH_ALT
else:
    # Fallback to current dir if any Hafs font is there
    import glob as pyglob
    matches = pyglob.glob("*Hafs*.ttf")
    KFGQPC_HAFS_PATH = matches[0] if matches else KFGQPC_HAFS_PATH_DEFAULT

# Colors
COLOR_CREAM = HexColor("#FCFAF5")
COLOR_NAVY = HexColor("#0C194C")
COLOR_GREY = HexColor("#969696")

# Ligature pattern for Floating Hamza (ٱلۡءَا)
# In the Madinah Mushaf, this sequence produces a special ligature where
# the Hamza hovers between Lam and Alef.
PATTERN = "ٱلۡءَا"

class CanvasPen(BasePen):
    """
    Custom pen that draws fonttools glyph outlines onto a ReportLab PDFPathObject.
    Converts quadratic curves to cubic Bézier splines for PDF compatibility.
    """
    def __init__(self, path_obj, glyph_set, scale, x_offset, y_offset):
        BasePen.__init__(self, glyph_set)
        self.path = path_obj
        self.scale = scale
        self.x_offset = x_offset
        self.y_offset = y_offset

    def _moveTo(self, p):
        self.path.moveTo(self.x_offset + p[0] * self.scale, self.y_offset + p[1] * self.scale)

    def _lineTo(self, p):
        self.path.lineTo(self.x_offset + p[0] * self.scale, self.y_offset + p[1] * self.scale)

    def _curveToOne(self, p1, p2, p3):
        self.path.curveTo(
            self.x_offset + p1[0] * self.scale, self.y_offset + p1[1] * self.scale,
            self.x_offset + p2[0] * self.scale, self.y_offset + p2[1] * self.scale,
            self.x_offset + p3[0] * self.scale, self.y_offset + p3[1] * self.scale
        )

    def _qCurveToOne(self, p1, p2):
        curr = self._getCurrentPoint()
        # Quadratic to Cubic Bézier conversion:
        # C1 = P0 + 2/3(CP - P0)
        # C2 = P1 + 2/3(CP - P1)
        c1 = (curr[0] + 2/3 * (p1[0] - curr[0]), curr[1] + 2/3 * (p1[1] - curr[1]))
        c2 = (p2[0] + 2/3 * (p1[0] - p2[0]), p2[1] + 2/3 * (p1[1] - p2[1]))
        self._curveToOne(c1, c2, p2)

    def _closePath(self):
        self.path.close()

class FontRenderer:
    """
    Handles HarfBuzz shaping and glyph extraction for a specific font.
    """
    def __init__(self, font_path):
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"Required font not found: {font_path}")
        self.font_path = font_path
        self.ttfont = TTFont(font_path)
        with open(font_path, 'rb') as f:
            self.font_data = f.read()
        self.face = hb.Face(self.font_data)
        self.font = hb.Font(self.face)
        self.upem = self.ttfont['head'].unitsPerEm
        self.glyph_set = self.ttfont.getGlyphSet()

    def shape(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        buf.direction = 'rtl'
        buf.script = 'Arab'
        buf.language = 'ar'
        # Enable Required Ligatures (rlig) for the floating Hamza
        features = {"rlig": True, "kern": True, "liga": True}
        hb.shape(self.font, buf, features)
        return buf

def segment_text(text):
    """
    Splits text into segments based on the floating-Hamza pattern.
    The pattern itself is kept as a separate segment to trigger the font switch.
    """
    parts = regex.split(f"({PATTERN})", text)
    return [p for p in parts if p]

def draw_arabic_line(c, text, at_renderer, kf_renderer, center_x, baseline_y, pt, color):
    """
    Renders a line of Arabic text with pixel-perfect font switching and HarfBuzz shaping.
    Perfectly centers the text by drawing from Left to Right (Visual Order).
    """
    segments = segment_text(text)
    
    shaped_segments = []
    total_width_pts = 0
    
    for seg in segments:
        # Switch font for the floating-Hamza ligature
        renderer = kf_renderer if seg == PATTERN else at_renderer
        buf = renderer.shape(seg)
        scale = pt / renderer.upem
        
        # In HarfBuzz RTL with buf.direction='rtl', glyphs are reordered
        # to visual order and advances are typically positive (moving LTR).
        seg_width_units = sum(pos.x_advance for pos in buf.glyph_positions)
        seg_width_pts = abs(seg_width_units * scale)
        
        shaped_segments.append({
            "buf": buf,
            "renderer": renderer,
            "width": seg_width_pts,
            "scale": scale
        })
        total_width_pts += seg_width_pts

    # To CENTER: Start drawing from the LEFT boundary (center_x - total_width / 2)
    # We move RIGHT because HarfBuzz has visually reordered the glyphs.
    curr_x = center_x - (total_width_pts / 2)
    
    c.saveState()
    c.setFillColor(color)
    
    # IMPORTANT: Segments are in logical order (Right-to-Left in the sentence).
    # To draw visually from Left to Right, we must process segments in REVERSE.
    for seg_data in reversed(shaped_segments):
        buf = seg_data["buf"]
        renderer = seg_data["renderer"]
        scale = seg_data["scale"]
        
        infos = buf.glyph_infos
        positions = buf.glyph_positions
        
        # HarfBuzz buffer for RTL is already in visual LTR order.
        for info, pos in zip(infos, positions):
            glyph_name = renderer.ttfont.getGlyphName(info.codepoint)
            
            gx = curr_x + pos.x_offset * scale
            gy = baseline_y + pos.y_offset * scale
            
            p = c.beginPath()
            pen = CanvasPen(p, renderer.glyph_set, scale, gx, gy)
            renderer.glyph_set[glyph_name].draw(pen)
            c.drawPath(p, fill=1, stroke=0)
            
            # Move right for the next glyph
            curr_x += pos.x_advance * scale
            
    c.restoreState()


class ArabicPDFBuilder:
    def __init__(self, output_path):
        self.output_path = output_path
        self.at_renderer = FontRenderer(ARABIC_TYPESETTING_PATH)
        self.kf_renderer = FontRenderer(KFGQPC_HAFS_PATH)
        self.items = []

    def add(self, verse, surah, ayah, num=None):
        self.items.append({
            "verse": verse,
            "surah": surah,
            "ayah": ayah,
            "num": num or (len(self.items) + 1)
        })

    def build(self):
        c = canvas.Canvas(self.output_path, pagesize=A4)
        width, height = A4
        
        # Grid Specs
        margin = 50
        textheight = height - 2 * margin
        item_height = 0.11 * textheight
        items_per_page = 8
        
        num_pages = (len(self.items) + items_per_page - 1) // items_per_page
        
        for p in range(num_pages):
            # Background
            c.setFillColor(COLOR_CREAM)
            c.rect(0, 0, width, height, fill=1, stroke=0)
            
            page_items = self.items[p*items_per_page : (p+1)*items_per_page]
            
            for i, item in enumerate(page_items):
                # Calculate item boundaries
                y_top = height - margin - i * item_height
                y_bottom = y_top - item_height
                y_center = (y_top + y_bottom) / 2
                
                # Metadata (Number) - Top of the slot
                c.setFont("Helvetica", 10)
                c.setFillColor(COLOR_GREY)
                c.drawCentredString(width/2, y_top - 15, f"#{item['num']}")
                
                # Verse - Centered in the slot with padding from ID and Reference
                verse_text = item["verse"].replace("\u0652", "\u06E1") # Sukun normalization
                draw_arabic_line(
                    c, verse_text, 
                    self.at_renderer, self.kf_renderer,
                    width/2, y_center - 2, # Centered baseline
                    pt=32, color=COLOR_NAVY
                )
                
                # Reference - Bottom of the slot
                ref_text = f"({item['surah']} {item['ayah']})"
                draw_arabic_line(
                    c, ref_text,
                    self.at_renderer, self.kf_renderer,
                    width/2, y_bottom + 12, # Enough space from divider
                    pt=14, color=COLOR_GREY
                )
                
                # Divider
                c.setStrokeColor(COLOR_GREY)
                c.setLineWidth(0.3)
                c.line(margin, y_bottom, width - margin, y_bottom)
                
            c.showPage()
        c.save()
        print(f"PDF saved to {self.output_path}")


def main():
    output_name = sys.argv[1] if len(sys.argv) > 1 else "arabic_output.pdf"
    builder = ArabicPDFBuilder(output_name)
    
    # Sample Data
    builder.add("وَلَلۡءَاخِرَةُ خَيۡرٌ لَّكَ مِنَ ٱلۡأُولَىٰ", "الضحى", "٤")
    builder.add("ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ", "الفاتحة", "٢")
    builder.add("إِنَّآ أَعۡطَيۡنَٰكَ ٱلۡكَوۡثَرَ", "الكوثر", "١")
    builder.add("فَصَلِّ لِرَبِّكَ وَٱنۡحَرۡ", "الكوثر", "٢")
    builder.add("إِنَّ شَانِئَكَ هُوَ ٱلۡأَبۡتَرُ", "الكوثر", "٣")
    builder.add("قُلۡ أَعُوذُ بِرَبِّ ٱلۡفَلَقِ", "الفلق", "١")
    builder.add("مِن شَرِّ مَا خَلَقَ", "الفلق", "٢")
    builder.add("وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", "الفلق", "٣")
    builder.add("وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلۡعُقَدِ", "الفلق", "٤") # Tests Floating Hamza pattern elsewhere if any
    
    builder.build()

if __name__ == "__main__":
    main()
