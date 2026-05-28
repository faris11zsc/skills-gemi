import sys
import re
from arabic_pdf_renderer import ArabicPDFBuilder

RAW_DATA = """
1. 20:28, طه — يَفۡقَهُوا۟ قَوۡلِى
2. 20:30, طه — هَٰرُونَ أَخِى
3. 30:2, الروم — غُلِبَتِ ٱلرُّومُ
4. 44:44, الدخان — طَعَامُ ٱلۡأَثِيمِ
5. 44:46, الدخان — كَغَلۡىِ ٱلۡحَمِيمِ
6. 52:3, الطور — فِى رَقٍّۢ مَّنشُورٍۢ
7. 52:4, الطور — وَٱلۡبَيۡتِ ٱلۡمَعۡمُورِ
8. 52:5, الطور — وَٱلسَّقۡفِ ٱلۡمَرۡفُوعِ
9. 52:6, الطور — وَٱلۡبَحۡرِ ٱلۡمَسۡجُورِ
10. 55:2, الرحمن — عَلَّمَ ٱلۡقُرۡءَانَ
11. 55:3, الرحمن — خَلَقَ ٱلۡإِنسَٰنَ
12. 55:48, الرحمن — ذَوَاتَآ أَفۡنَانٍۢ
13. 56:28, الواقعة — فِى سِدۡرٍۢ مَّخۡضُودٍۢ
14. 56:29, الواقعة — وَطَلۡحٍۢ مَّنضُودٍۢ
15. 56:30, الواقعة — وَظِلٍّۢ مَّمۡدُودٍۢ
16. 56:31, الواقعة — وَمَآءٍۢ مَّسۡكُوبٍۢ
17. 68:18, القلم — وَلَا يَسۡتَثۡنُونَ
18. 70:22, المعارج — إِلَّا ٱلۡمُصَلِّينَ
19. 74:32, المدثر — كَلَّا وَٱلۡقَمَرِ
20. 74:41, المدثر — عَنِ ٱلۡمُجۡرِمِينَ
21. 75:11, القيامة — كَلَّا لَا وَزَرَ
22. 75:27, القيامة — وَقِيلَ مَنۡ ۜ رَاقٍۢ
23. 77:6, المرسلات — عُذۡرًا أَوۡ نُذۡرًا
24. 83:5, المطففين — لِيَوۡمٍ عَظِيمٍۢ
25. 83:9, المطففين — كِتَٰبٌۭ مَّرۡقُومٌۭ
26. 83:20, المطففين — كِتَٰبٌۭ مَّرۡقُومٌۭ
27. 85:2, البروج — وَٱلۡيَوۡمِ ٱلۡمَوۡعُودِ
28. 85:15, البروج — ذُو ٱلۡعَرۡشِ ٱلۡمَجِيدُ
29. 85:22, البروج — فِى لَوۡحٍۢ مَّحۡفُوظٍۭ
30. 86:3, الطارق — ٱلنَّجۡمُ ٱلثَّاقِبُ
31. 89:2, الفجر — وَلَيَالٍ عَشۡرٍۢ
32. 89:3, الفجر — وَٱلشَّفۡعِ وَٱلۡوَتۡرِ
33. 90:13, البلد — فَكُّ رَقَبَةٍ
34. 95:2, التين — وَطُورِ سِينِينَ
35. 101:11, القارعة — نَارٌ حَامِيَةٌۢ
36. 112:2, الإخلاص — ٱللَّهُ ٱلصَّمَدُ
"""

def parse_data(raw_text):
    items = []
    # Pattern: num. surah:ayah, surah_name — text
    # Note: Using regex to handle the specific separator and Arabic characters
    pattern = r"(\d+)\.\s*(\d+:\d+),\s*(.*?)\s*[—–]\s*(.*)"
    
    for line in raw_text.strip().splitlines():
        if not line.strip():
            continue
        match = re.search(pattern, line)
        if match:
            num = match.group(1)
            ref_num = match.group(2)
            surah_name = match.group(3).strip()
            verse_text = match.group(4).strip()
            
            # Reformat reference to: SurahName AyahNum
            # Example: 20:28, طه -> (طه ٢٨)
            ayah_num = ref_num.split(":")[1]
            
            # Convert ayah numbers to Arabic numerals for the reference
            def to_arabic_num(n_str):
                arabic_digits = "٠١٢٣٤٥٦٧٨٩"
                return "".join(arabic_digits[int(d)] for d in n_str)
            
            ref_formatted = f"{surah_name} {to_arabic_num(ayah_num)}"
            
            items.append({
                "num": num,
                "verse": verse_text,
                "surah": surah_name,
                "ayah": to_arabic_num(ayah_num)
            })
        else:
            print(f"Warning: Could not parse line: {line}")
    return items

def main():
    output_name = sys.argv[1] if len(sys.argv) > 1 else "mission_replica_full.pdf"
    builder = ArabicPDFBuilder(output_name)
    parsed_items = parse_data(RAW_DATA)
    
    for item in parsed_items:
        builder.add(
            verse=item["verse"],
            surah=item["surah"],
            ayah=item["ayah"],
            num=item["num"]
        )
    
    builder.build()

if __name__ == "__main__":
    main()
