#!/usr/bin/env python3
"""
Pre-generate MP3 audio for all Arabic words using ar-EG-SalmaNeural
(Egyptian Arabic - no tanwin, consistent across all platforms)
Output: public/audio/{wordId}.mp3
"""
import asyncio
import os
import re
import sys
import edge_tts

VOICE = "ar-EG-SalmaNeural"  # Egyptian Arabic, female, no tanwin
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
WORDS_FILE = os.path.join(os.path.dirname(__file__), "src", "data", "words.js")
CONCURRENCY = 5  # parallel requests

def extract_words(js_path):
    """Extract {id, arabic} pairs from words.js"""
    with open(js_path, encoding="utf-8") as f:
        content = f.read()

    words = []
    # Find all word blocks by locating id + arabic fields
    # Pattern: id: 'xxx', ... arabic: 'yyy'
    blocks = re.split(r'\{(?=\s*id:)', content)
    for block in blocks:
        id_m = re.search(r"id:\s*'([^']+)'", block)
        ar_m = re.search(r"arabic:\s*'([^']+)'", block)
        if id_m and ar_m:
            words.append({"id": id_m.group(1), "arabic": ar_m.group(1)})
    return words

async def generate_one(semaphore, word, total, idx):
    out_path = os.path.join(AUDIO_DIR, f"{word['id']}.mp3")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 100:
        print(f"  [skip] {idx}/{total} {word['id']}")
        return True
    async with semaphore:
        try:
            communicate = edge_tts.Communicate(word["arabic"], VOICE)
            await communicate.save(out_path)
            print(f"  [ok]   {idx}/{total} {word['id']} → {word['arabic']}")
            return True
        except Exception as e:
            print(f"  [ERR]  {idx}/{total} {word['id']}: {e}", file=sys.stderr)
            return False

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    words = extract_words(WORDS_FILE)
    print(f"Found {len(words)} words. Generating audio with {VOICE}...")
    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = [generate_one(semaphore, w, len(words), i+1) for i, w in enumerate(words)]
    results = await asyncio.gather(*tasks)
    ok = sum(results)
    fail = len(results) - ok
    print(f"\nDone: {ok} generated, {fail} failed.")
    if fail > 0:
        print("Run again to retry failed ones.")

if __name__ == "__main__":
    asyncio.run(main())
