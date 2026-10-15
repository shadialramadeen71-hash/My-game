#!/usr/bin/env python3
"""Generate the voice lines for the shorts with Piper TTS.

usage: voices.py LINES_JSON MODELS_DIR OUT_DIR
LINES_JSON is a list of {"who", "text", "rate"} objects (written by render.js).
Writes OUT_DIR/NNN.wav for each line plus OUT_DIR/durations.json.
"""
import json
import subprocess
import sys
from pathlib import Path

# character -> (piper voice, length scale, pitch ratio)
CAST = {
    "Gary":         ("en_US-ryan-high",       0.95, 0.90),
    "Donna":        ("en_US-amy-medium",      0.95, 1.06),
    "Tyler":        ("en_US-joe-medium",      0.90, 1.30),
    "Mr. Whiskers": ("en_GB-alan-medium",     1.05, 0.97),
    "Brenda":       ("en_US-kristin-medium",  1.12, 0.96),
    "Announcer":    ("en_US-hfc_male-medium", 1.00, 0.94),
}


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def main():
    lines = json.loads(Path(sys.argv[1]).read_text())
    models, out = Path(sys.argv[2]), Path(sys.argv[3])
    out.mkdir(parents=True, exist_ok=True)
    durations = {}
    for i, ln in enumerate(lines):
        voice, length, pitch = CAST[ln["who"]]
        if ln.get("rate"):
            length /= ln["rate"]
        raw, wav = out / f"{i:03d}_raw.wav", out / f"{i:03d}.wav"
        subprocess.run([sys.executable, "-m", "piper", "-m", str(models / f"{voice}.onnx"),
                        "--length-scale", f"{length:.3f}", "-f", str(raw)],
                       input=ln["text"], text=True, check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af",
                        f"rubberband=pitch={pitch},silenceremove=start_periods=1:start_threshold=-50dB,"
                        "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-15",
                        "-ar", "44100", "-ac", "1", str(wav)], check=True)
        raw.unlink()
        durations[f'{ln["who"]}|{ln["text"]}'] = {"file": wav.name, "dur": round(duration(wav), 3)}
        print(f'{ln["who"]:>12}: {ln["text"]}  ({durations[ln["who"] + "|" + ln["text"]]["dur"]}s)')
    (out / "durations.json").write_text(json.dumps(durations, indent=1))


if __name__ == "__main__":
    main()
