# FOURTH QUARTER — مسلسل قصير عن NFL (5 حلقات)

مسلسل باللغة الإنجليزية بصيغة فيديو شورت عمودي (1080×1920، 30fps). الشخصيات بأجسام كاملة تمشي من مكان لمكان،
مع حوار صوتي بين الأطراف وترجمة متزامنة كلمة بكلمة، وموسيقى ومؤثرات (جمهور، صافرة، خطوات، ومضات كاميرات).

**الشخصيات:** Marcus Reed #7 (لاعب الوسط المبتدئ)، Coach Ray Dawson، وعائلة ماركوس: الأم Denise، الأخت الصغيرة Kayla،
الجد Grandpa Earl، وزوجة المدرب Linda — مع مشاهد كوميدية للعائلة. ولكل شخصية صوت مختلف.

A 5-episode English-language vertical short series about an NFL rookie quarterback.

| # | Episode | Length | Locations | File |
|---|---------|--------|-----------|------|
| 1 | The Call | 86s | Coach's office → Driving home at night (phone call with Mom) → Reed family house | `episodes/FourthQuarter_Ep1_TheCall.mp4` |
| 2 | Film Room | 86s | Film room → Practice field (Linda visits) → Stadium tunnel | `episodes/FourthQuarter_Ep2_FilmRoom.mp4` |
| 3 | Pick Six | 85s | Family minivan (Grandpa drives slowly) → Live play → Stands → Sideline | `episodes/FourthQuarter_Ep3_PickSix.mp4` |
| 4 | The Scar | 64s | Team bench → Family in the stands → Live broadcast | `episodes/FourthQuarter_Ep4_TheScar.mp4` |
| 5 | Fourth and Goal | 86s | Broadcast → Sideline → Stands → Live play → Celebration → Press conference | `episodes/FourthQuarter_Ep5_FourthAndGoal.mp4` |

Motion: characters walk with accelerating/decelerating (trapezoidal) velocity, lean into their movement,
move in depth through each room or field (perspective scaling), and jump on gravity arcs; cars drive with
spinning wheels, suspension bounce and parallax scrolling backgrounds.

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
