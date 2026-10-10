"""Synthesize every line with neural voices and save word timings."""
import asyncio, json, os, sys
import certifi
if os.path.exists("/root/.ccr/ca-bundle.crt"):
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
from script import EPISODES, VOICES

OUT = sys.argv[1] if len(sys.argv) > 1 else "build/tts"

async def synth(text, spk, path):
    v = VOICES[spk]
    c = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append(dict(w=ch["text"], t=ch["offset"] / 1e7, d=ch["duration"] / 1e7))
    open(path + ".mp3", "wb").write(audio)
    json.dump(words, open(path + ".json", "w"))

async def main():
    os.makedirs(OUT, exist_ok=True)
    for ep in EPISODES:
        for i, (spk, text, _) in enumerate(ep["lines"]):
            p = f"{OUT}/ep{ep['num']}_{i:02d}"
            if not os.path.exists(p + ".json"):
                await synth(text, spk, p)
                print("ok", p, spk, text[:40])

asyncio.run(main())
