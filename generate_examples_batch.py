#!/usr/bin/env python3
"""Generate example sentence audio for a subset of words (by index range)."""
import asyncio, os, re, sys, edge_tts

VOICE = "ar-EG-SalmaNeural"
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
WORDS_FILE = os.path.join(os.path.dirname(__file__), "src", "data", "words.js")
CONCURRENCY = 8

def extract_words(js_path):
    with open(js_path, encoding="utf-8") as f:
        content = f.read()
    words = []
    blocks = re.split(r'\{(?=\s*id:)', content)
    for block in blocks:
        id_m = re.search(r"id:\s*'([^']+)'", block)
        ex_m = re.search(r"example:\s*\{[^}]*ar:\s*'([^']+)'", block)
        if id_m and ex_m:
            words.append({"id": id_m.group(1), "ar": ex_m.group(1)})
    return words

async def generate_one(semaphore, word, total, idx):
    out_path = os.path.join(AUDIO_DIR, f"{word['id']}_example.mp3")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 100:
        return True
    async with semaphore:
        try:
            communicate = edge_tts.Communicate(word["ar"], VOICE)
            await communicate.save(out_path)
            print(f"  [ok] {idx}/{total} {word['id']}", flush=True)
            return True
        except Exception as e:
            print(f"  [ERR] {word['id']}: {e}", file=sys.stderr, flush=True)
            return False

async def main(start, end):
    os.makedirs(AUDIO_DIR, exist_ok=True)
    words = extract_words(WORDS_FILE)[start:end]
    print(f"Batch {start}-{end}: {len(words)} words", flush=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[generate_one(sem, w, len(words), i+1) for i, w in enumerate(words)])
    print(f"Batch {start}-{end} done: {sum(results)} ok, {len(results)-sum(results)} failed", flush=True)

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--start", type=int, default=0)
    p.add_argument("--end", type=int, default=9999)
    args = p.parse_args()
    asyncio.run(main(args.start, args.end))
