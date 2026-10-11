# My-game

- `index.html`: Superman vs Batman fighting game
- `series.html`: **Star Squad**, a 3D animated superhero series (Episode 1: The Crystal of Light)
  - Heroes: Bolt ⚡ (speed), Boulder 🪨 (strength), Breeze 🌪️ (wind), and the villain Doctor Darkness
  - Blender-style 3D rendering: PBR materials, environment lighting, soft shadows, bloom, AgX tone mapping
  - Full voice acting: every line is a recorded neural-voice clip (`voices.js`), with a different voice per character
  - Music and sound effects generated in the browser (Web Audio)
  - Open the file in a browser and press "Watch the episode"
- `anime.html` + `anime/`: **『星光少女ヒカリ』 Starlight Girl Hikari**, a 5-episode Japanese anime made entirely in code
  - Magical-girl heroine Hikari, her best friend Mina, Kon the star fox, and Yomi, Queen of Shadows
  - Cel-shaded anime look with hand-painted 2D faces, speed lines, sakura petals, transformation sequence
  - Japanese voice acting (`anime/voices.js`, recorded neural voices) with Arabic / English subtitles
  - Original music in Japanese scales (koto, shakuhachi, taiko, shamisen) synthesized live, so there is no copyright
  - Needs to be served over http (for example GitHub Pages or `npx http-server`), because it uses ES modules
- `sakura.html`: **『桜花少女サクラ』 Sakura Blossom Girl**, a one-episode anime special in the Blender-style render
  - Same anime engine (`anime/`) switched to physically based materials, environment lighting and sculpted 3D eyes via `window.ANIME_CONFIG`
  - Story in `anime/sakura-episode.js`, Japanese voices in `anime/sakura-voices.js`, Arabic / English subtitles, original Japanese-scale music
