import csv
import sys
import re
import argparse

# Arabic Unicode constants
FATHA = '\u064e'
KASRA = '\u0650'
DAMMA = '\u064f'
SUKUN = '\u0652'
SHADDA = '\u0651'
FATHATAN = '\u064b'
KASRATAN = '\u064d'
DAMMATAN = '\u064c'
SUPERSCRIPT_ALIF = '\u0670'
SMALL_WAW = '\u06e5'
SMALL_YA = '\u06e6'
HAMZAT_WASL = '\u0671'

# Waqf (Stopping) Symbols
WAQF_SYMBOLS = [
    '\u06d6', # ۖ (Sila)
    '\u06d7', # ۗ (Qila)
    '\u06d8', # ۘ (Meem)
    '\u06da', # ۚ (Ja'iz)
    '\u06db', # ۛ (Triple Dots)
    '\u06dc'  # ۜ (Saktah)
]

VOWELS = [FATHA, KASRA, DAMMA, FATHATAN, KASRATAN, DAMMATAN, SUPERSCRIPT_ALIF, SMALL_WAW, SMALL_YA]

def count_syllables(text):
    if not text:
        return 0
    text = text.strip()
    
    # Remove any Waqf symbols for accurate counting of the phrase content
    for sym in WAQF_SYMBOLS:
        text = text.replace(sym, "")
    
    # Uthmani Phonological Collapse:
    # In Uthmani script, a short vowel is sometimes followed by a superscript/small vowel extension.
    # These represent a single long vowel nucleus and should only be counted once.
    # We collapse them into the short vowel for counting purposes.
    
    # 1. Fatha + (optional support Alif/Ya) + Superscript Alif -> 1 nucleus
    text = re.sub(f'{FATHA}[اى]?{SUPERSCRIPT_ALIF}', FATHA, text)
    # 2. Kasra + (optional support Ya) + Small Ya -> 1 nucleus
    text = re.sub(f'{KASRA}[ي]?{SMALL_YA}', KASRA, text)
    # 3. Damma + (optional support Waw) + Small Waw -> 1 nucleus
    text = re.sub(f'{DAMMA}[و]?{SMALL_WAW}', DAMMA, text)
    
    nuclei_count = 0
    for char in text:
        if char in VOWELS:
            nuclei_count += 1
            
    # Adjustment for specific common Uthmani omissions:
    if "للَّه" in text and SUPERSCRIPT_ALIF not in text:
        nuclei_count += 1
    
    if text.startswith(HAMZAT_WASL):
        nuclei_count += 1
        
    # Rule 3: Waqf Rule
    # Drop the final short vowel or tanwin.
    # We check the end of the string, ignoring non-vowel diacritics like Maddah or Sukun.
    clean_end = re.sub(r'[\u0652\u0653\u0640]+$', '', text)
    if len(clean_end) > 0 and clean_end[-1] in [FATHA, KASRA, DAMMA, FATHATAN, KASRATAN, DAMMATAN]:
        nuclei_count -= 1
        
    return nuclei_count

def get_phrase_segments(text):
    """
    Splits an ayah into meaningful phrases based on Waqf symbols.
    Returns list of segments.
    """
    segments = []
    # Create regex pattern for any waqf symbol
    pattern = "[" + "".join(WAQF_SYMBOLS) + "]"
    
    # Split text while keeping delimiters
    parts = re.split(f"({pattern})", text)
    
    current_phrase = ""
    temp_text = ""
    for i in range(len(parts)):
        if parts[i] in WAQF_SYMBOLS:
            phrase = temp_text.strip()
            if phrase:
                segments.append(phrase)
            temp_text = ""
        else:
            temp_text += parts[i]
            
    final_phrase = temp_text.strip()
    if final_phrase:
        segments.append(final_phrase)
        
    return segments

def main():
    parser = argparse.ArgumentParser(description='Quranic Syllable Counter')
    parser.add_argument('input', help='Input CSV file path')
    parser.add_argument('count', type=int, help='Syllable count to filter for')
    parser.add_argument('--mode', choices=['verse', 'phrase', 'both'], default='verse', help='Search in "verse", "phrase", or "both"')
    parser.add_argument('--output', help='Output CSV file path')
    args = parser.parse_args()

    try:
        with open(args.input, mode='r', encoding='utf-8') as f_in:
            reader = csv.DictReader(f_in)
            verse_results = []
            phrase_results = []
            
            for row in reader:
                ayah_text = row['ayah']
                surah_no = row['surah_no']
                ayah_no = row['ayah_no_surah']
                surah_name = row['surah_name']
                
                # Check Verse
                if args.mode in ['verse', 'both']:
                    if count_syllables(ayah_text) == args.count:
                        verse_results.append({
                            'surah': surah_name,
                            'surah_no': surah_no,
                            'ayah_no': ayah_no,
                            'type': 'Full Verse',
                            'text': ayah_text,
                            'context': ayah_text
                        })
                
                # Check Phrases
                if args.mode in ['phrase', 'both']:
                    segments = get_phrase_segments(ayah_text)
                    is_split = len(segments) > 1
                    
                    for i, seg in enumerate(segments):
                        if count_syllables(seg) == args.count:
                            label = f"Segment {i+1}/{len(segments)}" if is_split else "Full Verse (No Waqf)"
                            phrase_results.append({
                                'surah': surah_name,
                                'surah_no': surah_no,
                                'ayah_no': ayah_no,
                                'type': label,
                                'text': seg,
                                'context': ayah_text
                            })

            results = verse_results + phrase_results

            if args.output:
                with open(args.output, mode='w', encoding='utf-8', newline='') as f_out:
                    fieldnames = ['surah', 'ayah_no', 'type', 'text', 'context']
                    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
                    writer.writeheader()
                    # We filter out 'surah_no' for the CSV to keep it as before, or keep it if helpful.
                    # The user didn't specify CSV format changes, only chat output.
                    csv_results = [{k: v for k, v in r.items() if k != 'surah_no'} for r in results]
                    writer.writerows(csv_results)
                print(f"Found {len(results)} matches ({len(verse_results)} verses, {len(phrase_results)} segments). Saved to {args.output}")
            else:
                # User's requested chat format: Targeted text (Chapter:Verse)
                for res in results:
                    print(f"{res['text']} ({res['surah_no']}:{res['ayah_no']})")


    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
