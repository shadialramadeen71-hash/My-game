# FOURTH QUARTER — مسلسل قصير عن NFL (5 حلقات)

مسلسل باللغة الإنجليزية بصيغة فيديو شورت عمودي (1080×1920، 30fps)، فيه حوار صوتي بين الطرفين
(لاعب الوسط المبتدئ **Marcus Reed #7** والمدرب **Coach Ray Dawson**) بالإضافة إلى معلّق المباراة،
مع ترجمة نصية متزامنة كلمة بكلمة، وموسيقى ومؤثرات صوتية (جمهور، صافرة، ضربات).

A 5-episode English-language vertical short series about an NFL rookie quarterback.

| # | Episode | Length | File |
|---|---------|--------|------|
| 1 | The Call | 57s | `episodes/FourthQuarter_Ep1_TheCall.mp4` |
| 2 | Film Room | 52s | `episodes/FourthQuarter_Ep2_FilmRoom.mp4` |
| 3 | Pick Six | 54s | `episodes/FourthQuarter_Ep3_PickSix.mp4` |
| 4 | The Scar | 49s | `episodes/FourthQuarter_Ep4_TheScar.mp4` |
| 5 | Fourth and Goal | 56s | `episodes/FourthQuarter_Ep5_FourthAndGoal.mp4` |

**Story:** the starter tears his ACL and rookie Marcus Reed must start on prime time against the
Wolves. Coach Dawson teaches him to read safety #24 Darius King, Marcus throws a pick six, learns
his coach's own story of failure, and wins the game on the final play.

## Credits
- **Music:** Kevin MacLeod (incompetech.com) — "Rising Game", "Hitman", "Volatile Reaction",
  "Impact Prelude", "Five Armies". Licensed under Creative Commons: By Attribution 4.0
  (http://creativecommons.org/licenses/by/4.0/). Keep this credit in the video description when posting.
- **Voices:** AI neural text-to-speech (Microsoft Edge voices via `edge-tts`).
- Teams, characters and logos are fictional; no official NFL marks are used.

## Rebuild
```bash
pip install edge-tts scipy numpy pillow   # ffmpeg required
./fetch_assets.sh assets
cd src
python3 tts.py ../build/tts
python3 render.py ../build ../assets/fonts ../assets/music ../episodes
```
Edit `src/script.py` to change dialogue, voices, or music.
