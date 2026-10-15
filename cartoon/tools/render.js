#!/usr/bin/env node
/*
 * Export the shorts as vertical 1080x1920 MP4 files (30 fps) with voices, music and sfx.
 *
 *   node cartoon/tools/render.js <piper-models-dir> [outDir] [episodes...]
 *
 * Needs: playwright (Chromium), ffmpeg (with rubberband), python3 + piper-tts.
 * Pass 1 runs each short to collect its dialogue, voices.py renders every line with Piper,
 * pass 2 re-runs the short with the real line lengths, grabbing every frame, and finally the
 * music/sfx (replayed through an OfflineAudioContext) and the voice clips are mixed in.
 */
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, LIMIT = 40, TAIL = 1.5;
const ROOT = path.resolve(__dirname, '..');
const [models, outDir = path.join(ROOT, 'videos'), ...eps] = process.argv.slice(2);
if (!models) { console.error('usage: render.js <piper-models-dir> [outDir] [episodes...]'); process.exit(1); }
const episodes = eps.length ? eps.map(Number) : [1, 2, 3];
const NAMES = { 1: 'the-ticket', 2: 'millionaire-town', 3: 'half-off' };
const work = path.join(outDir, '.work');
fs.mkdirSync(work, { recursive: true });

function wavFile(pcmB64, file) {
  const pcm = Buffer.from(pcmB64, 'base64'), h = Buffer.alloc(44), sr = 44100;
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}

async function openShort(browser, ep, voiceDur) {
  const page = await browser.newPage({ viewport: { width: 540, height: 1000 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html') + '?record=1');
  await page.evaluate(async () => { await document.fonts.load("40px Lobster"); await document.fonts.load("40px 'Luckiest Guy'"); await document.fonts.ready; });
  await page.evaluate(([d, n]) => { window.VOICE_DUR = d; window.recStart(n); }, [voiceDur, ep - 1]);
  return page;
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const ep of episodes) {
    const dir = path.join(work, `ep${ep}`); fs.mkdirSync(dir, { recursive: true });
    // ---- pass 1: collect the dialogue
    let page = await openShort(browser, ep, {});
    await page.evaluate(async lim => {
      for (let i = 0; i < lim * 30; i++) { const r = recStep(1 / 30, false); if (r.finished) break; await new Promise(r => setTimeout(r, 0)); }
    }, LIMIT);
    const lines = (await page.evaluate(() => recLogs().voiceLog)).map(l => ({ who: l.who, text: l.text, rate: l.rate }));
    await page.close();
    const linesFile = path.join(dir, 'lines.json');
    fs.writeFileSync(linesFile, JSON.stringify(lines, null, 1));
    const vdir = path.join(dir, 'voices');
    const py = spawnSync('python3', [path.join(__dirname, 'voices.py'), linesFile, models, vdir], { stdio: 'inherit' });
    if (py.status) throw new Error('voices.py failed');
    const vd = JSON.parse(fs.readFileSync(path.join(vdir, 'durations.json')));
    const durMap = Object.fromEntries(Object.entries(vd).map(([k, v]) => [k, v.dur]));

    // ---- pass 2: render frames
    page = await openShort(browser, ep, durMap);
    const silent = path.join(dir, 'video.mp4');
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
    let frames = 0, endAt = null;
    while (frames < LIMIT * FPS) {
      const [r, jpg] = await page.evaluate(() => { const r = recStep(1 / 30, true); return [r, recFrame(0.92)]; });
      const buf = Buffer.from(jpg.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res));
      frames++;
      if (r.finished && endAt === null) endAt = frames + TAIL * FPS;
      if (endAt !== null && frames >= endAt) break;
      if (frames % 150 === 0) process.stdout.write(`  ep${ep}: ${(frames / FPS).toFixed(0)}s\n`);
    }
    ff.stdin.end();
    await new Promise(res => ff.on('close', res));
    const dur = frames / FPS;
    const { voiceLog } = await page.evaluate(() => recLogs());
    const music = path.join(dir, 'music.wav');
    wavFile(await page.evaluate(d => recAudio(d), dur), music);
    await page.close();

    // ---- mix and mux
    const args = ['-y', '-v', 'error', '-i', silent, '-i', music];
    const filt = ['[1:a]volume=0.85[m]'], mixIn = ['[m]'];
    voiceLog.forEach((l, i) => {
      args.push('-i', path.join(vdir, vd[`${l.who}|${l.text}`].file));
      const ms = Math.round(l.t * 1000);
      filt.push(`[${i + 2}:a]adelay=${ms}|${ms},volume=1.6[v${i}]`); mixIn.push(`[v${i}]`);
    });
    filt.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=longest,alimiter=limit=0.95,atrim=0:${dur}[a]`);
    const out = path.join(outDir, `the-buckleys-short-${ep}-${NAMES[ep]}.mp4`);
    args.push('-filter_complex', filt.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', '-shortest', out);
    const mux = spawnSync('ffmpeg', args, { stdio: 'inherit' });
    if (mux.status) throw new Error('ffmpeg mux failed');
    console.log(`✔ ${path.basename(out)}  (${dur.toFixed(1)}s)`);
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
