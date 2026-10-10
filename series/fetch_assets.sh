#!/usr/bin/env bash
# Downloads the royalty-free music (Kevin MacLeod, CC BY 4.0) and fonts (OFL) used by the renderer.
set -e
A=${1:-assets}
mkdir -p "$A/music" "$A/fonts"
for f in "Rising Game" "Hitman" "Volatile Reaction" "Impact Prelude" "Five Armies"; do
  curl -sSfL -o "$A/music/${f// /_}.mp3" "https://incompetech.com/music/royalty-free/mp3-royaltyfree/${f// /%20}.mp3"
done
curl -sSfL -o "$A/fonts/Anton.ttf" https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf
for w in Black Bold SemiBold; do cp "/usr/share/fonts/opentype/inter/Inter-$w.otf" "$A/fonts/" 2>/dev/null || true; done
