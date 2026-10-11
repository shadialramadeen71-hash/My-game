// Original music in Japanese scales (In / Yo / pentatonic) with synthesized koto, shakuhachi, taiko and shamisen.
// Everything is generated live in Web Audio, so there is no third-party recording and no copyright issue.
let ctx = null, master, music, sfx, vbus, rev, noiseBuf, muted = false, shaper;
let mood = null, pending, step = 0, nextT = 0;
const mtof = n => 440*Math.pow(2,(n-69)/12);
const mel = list => { const a = Array(64).fill(null); let p = 0; for(const [n,d] of list){ if(n != null) a[p] = {n,d}; p += d; } return a; };
const ROYAL = {chords:[[65,69,72],[67,71,74],[64,67,71],[69,72,76]], roots:[41,43,40,45]};  // IV-V-iii-vi, the classic anime progression
const MOODS = {
  op:{tempo:168, ...ROYAL, bass:[0,null,0,null,12,null,0,null,0,null,0,null,12,null,0,12], power:true, leadInst:'lead',
    lead:mel([[81,2],[79,2],[81,2],[84,4],[81,2],[79,2],[76,2],[74,2],[76,2],[79,4],[74,2],[76,2],[79,2],[81,2],[79,2],[76,2],[74,2],[76,2],[79,4],[81,4],[84,4],[81,2],[79,2],[76,4],[74,2],[76,2]]),
    kick:'x...x...x...x...', snare:'....x.......x...', hat:'x.x.x.x.x.x.x.x.', taiko:'', arp:null},
  daily:{tempo:112, chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], roots:[48,45,41,43], bass:[0,null,null,null,null,null,null,null,7,null,null,null,null,null,null,null], leadInst:'flute', arpInst:'koto', arp:[0,2,4,7,9,12,9,7],
    lead:mel([[76,2],[79,2],[81,4],[79,2],[76,2],[74,4],[72,4],[74,2],[76,2],[79,6],[null,2],[81,2],[79,2],[76,2],[74,2],[72,4],[74,4],[76,4],[74,2],[72,2],[69,4],[72,4]]),
    kick:'x.......x.......', snare:'....x.......x...', hat:'..x...x...x...x.', taiko:''},
  calm:{tempo:70, chords:[[57,60,64],[53,57,60],[52,55,59],[57,60,64]], roots:[45,41,40,45], bass:[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null], leadInst:'flute', arpInst:'koto', arp:[0,1,5,7,8,12,8,7], scaleIn:true, pad:true,
    lead:mel([[76,8],[77,4],[76,4],[72,8],[71,8],[69,4],[71,4],[72,4],[76,4],[71,8],[69,8]]),
    kick:'', snare:'', hat:'', taiko:'x...............'},
  tension:{tempo:96, chords:[[50,53,57],[46,50,53],[43,46,50],[45,49,52]], roots:[38,34,31,33], bass:[0,null,0,null,1,null,0,null,0,null,0,null,7,null,6,null], bassInst:'shamisen', leadInst:'flute', pad:true,
    lead:mel([[74,6],[75,2],[74,8],[70,8],[69,8],[67,4],[69,4],[70,4],[74,4],[75,8],[74,8]]),
    kick:'', snare:'', hat:'', taiko:'x..x..x.x...o.o.'},
  battle:{tempo:150, chords:[[52,55,59],[48,52,55],[50,54,57],[52,55,59]], roots:[40,36,38,40], bass:[0,null,12,0,null,0,12,null,0,null,12,0,null,0,12,0], power:true, leadInst:'shamisen',
    lead:mel([[76,2],[79,2],[81,2],[83,2],[81,2],[79,2],[76,2],[74,2],[76,2],[79,2],[76,2],[72,2],[76,4],[79,4],[74,2],[78,2],[81,2],[86,2],[81,2],[78,2],[74,4],[76,4],[83,4],[81,2],[79,2],[76,4]]),
    kick:'x...x...x...x.x.', snare:'....x.......x...', hat:'xxxxxxxxxxxxxxxx', taiko:'x.....x...x.....'},
  transform:{tempo:128, ...ROYAL, bass:[0,null,null,null,0,null,null,null,0,null,null,null,0,null,12,null], pad:true, arpInst:'bell', arp:[0,4,7,12,16,12,7,4], arp16:true, leadInst:'bell',
    lead:mel([[84,4],[81,4],[77,4],[81,4],[86,4],[83,4],[79,4],[83,4],[88,4],[83,4],[79,4],[76,4],[81,4],[84,4],[88,8]]),
    kick:'x...x...x...x...', snare:'', hat:'..x...x...x...x.', taiko:''},
  sad:{tempo:66, chords:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], roots:[45,41,36,43], bass:[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null], leadInst:'flute', arpInst:'piano', arp:[0,4,7,12,7,4,0,4], pad:true,
    lead:mel([[81,6],[79,2],[76,8],[77,6],[76,2],[72,8],[76,4],[74,4],[72,4],[76,4],[74,16]]),
    kick:'', snare:'', hat:'', taiko:''},
  ed:{tempo:84, ...ROYAL, bass:[0,null,null,null,null,null,7,null,0,null,null,null,null,null,7,null], leadInst:'flute', arpInst:'koto', arp:[0,4,7,12,16,12,7,4], pad:true,
    lead:mel([[81,4],[79,2],[76,2],[79,8],[74,4],[76,2],[79,2],[81,8],[79,4],[76,4],[74,4],[72,4],[76,8],[74,4],[72,4]]),
    kick:'x.......x.......', snare:'........x.......', hat:'', taiko:''},
};
function impulse(sec){ const len = ctx.sampleRate*sec, b = ctx.createBuffer(2,len,ctx.sampleRate); for(let c=0;c<2;c++){ const d = b.getChannelData(c); for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/len, 2.2); } return b; }
export function init(){
  if(ctx){ ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = .85;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  music = ctx.createGain(); music.gain.value = .45; music.connect(master);
  sfx = ctx.createGain(); sfx.gain.value = .8; sfx.connect(master);
  vbus = ctx.createGain(); vbus.gain.value = 1.2; vbus.connect(master);
  rev = ctx.createConvolver(); rev.buffer = impulse(2.6); const wet = ctx.createGain(); wet.gain.value = .32; rev.connect(wet); wet.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
  shaper = ctx.createWaveShaper(); const cv = new Float32Array(256); for(let i=0;i<256;i++){ const x = i/128-1; cv[i] = Math.tanh(x*3); } shaper.curve = cv; const sg = ctx.createGain(); sg.gain.value = .5; shaper.connect(sg); sg.connect(music);
  nextT = ctx.currentTime + .05; setInterval(sched, 25);
}
function env(g, t, a, d, vol){ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+a); g.gain.exponentialRampToValueAtTime(.0008,t+a+d); }
function osc(type, f, t, dur, vol, a, d, cut=4000, dest=music, send=false, det=0){
  const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f,t); o.detune.value = det; fl.type = 'lowpass'; fl.frequency.value = cut;
  env(g, t, a, d, vol); o.connect(fl); fl.connect(g); g.connect(dest); if(send) g.connect(rev);
  o.start(t); o.stop(t+a+d+.05); return {o, g, fl};
}
function nz(t, dur, type, freq, vol, q=1, dest=sfx){
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq,t); f.Q.value = q;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001, t+dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t+dur+.05); return {f,g};
}
const INST = {
  koto(n,t,d){ const f = mtof(n); const a = osc('triangle', f*1.004, t, d, .11, .003, Math.max(.5,d*1.2), 5000, music, true); a.o.frequency.exponentialRampToValueAtTime(f, t+.05); osc('sawtooth', f, t, d, .035, .002, .35, 2600, music, true); nz(t,.03,'highpass',3000,.05,1,music); },
  piano(n,t,d){ const f = mtof(n); osc('triangle', f, t, d, .1, .004, Math.max(.8,d*1.5), 3000, music, true); osc('sine', f*2, t, d, .03, .003, .5, 4000, music, true); },
  bell(n,t,d){ const f = mtof(n); osc('sine', f, t, d, .07, .002, .9, 8000, music, true); osc('sine', f*2.76, t, d, .025, .002, .4, 9000, music, true); },
  shamisen(n,t,d){ const f = mtof(n); const s = osc('sawtooth', f, t, d, .09, .002, .28, 3200, music, true); s.fl.type = 'bandpass'; s.fl.Q.value = 2.5; s.fl.frequency.value = f*3; osc('square', f, t, d, .025, .002, .15, 1800); },
  flute(n,t,d){ const f = mtof(n), o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f*.94, t); o.frequency.exponentialRampToValueAtTime(f, t+.12);
    l.frequency.value = 5.2; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*.012, t+Math.min(.6,d)); l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.085,t+.09); g.gain.setValueAtTime(.075,t+Math.max(.1,d-.08)); g.gain.linearRampToValueAtTime(0,t+d+.12);
    o.connect(g); g.connect(music); g.connect(rev); o.start(t); o.stop(t+d+.2); l.start(t); l.stop(t+d+.2);
    const b = nz(t, d+.1, 'bandpass', f*2, .03, 6, music); b.g.gain.setValueAtTime(.035,t+.02); },
  lead(n,t,d){ osc('square', mtof(n), t, d, .05, .01, d+.1, 2800, music, true); osc('sawtooth', mtof(n), t, d, .035, .01, d+.1, 3200, music, false, 8); },
};
function playStep(s, t){
  const M = MOODS[mood], bar = s>>4, st = s&15, spb = 60/M.tempo/4, ch = M.chords[bar], root = M.roots[bar];
  if(st === 0 && M.pad) ch.forEach(n => { osc('sawtooth', mtof(n-12), t, spb*15, .022, .5, spb*15, 900, music, true, -7); osc('sawtooth', mtof(n-12), t, spb*15, .022, .5, spb*15, 900, music, false, 7); });
  const b = M.bass[st];
  if(b != null){ if(M.bassInst === 'shamisen') INST.shamisen(root+b+12, t, spb*2); else { osc('sawtooth', mtof(root+b), t, spb*1.5, .11, .005, spb*1.6, 600); osc('sine', mtof(root+b), t, spb*1.5, .12, .005, spb*1.6, 400); } }
  if(M.power && st%4 === 0){ for(const iv of [0,7,12]){ const p = osc('sawtooth', mtof(root+24+iv), t, spb*3, .06, .005, spb*3, 2400, shaper); } }
  if(M.arp && (M.arp16 || st%2 === 0)){ const k = M.arp16 ? st%8 : (st>>1)%8; INST[M.arpInst](ch[0]+12+M.arp[k] - (M.scaleIn ? 0 : 0), t, spb*1.8); }
  const e = M.lead && M.lead[s]; if(e) INST[M.leadInst](e.n, t, e.d*spb*.95);
  if(M.kick[st] === 'x'){ const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+.12); env(g,t,.002,.3,.7); o.connect(g); g.connect(music); o.start(t); o.stop(t+.35); }
  if(M.snare[st] === 'x'){ nz(t,.16,'bandpass',1900,.28,.7,music); osc('triangle',200,t,.05,.1,.002,.08,3000); }
  if(M.hat[st] === 'x') nz(t,.045,'highpass',8500,.05,1,music);
  const tk = M.taiko[st];
  if(tk){ const big = tk === 'x', o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(big ? 95 : 190, t); o.frequency.exponentialRampToValueAtTime(big ? 48 : 120, t+.25); env(g, t, .003, big ? .9 : .25, big ? .9 : .35); o.connect(g); g.connect(music); g.connect(rev); o.start(t); o.stop(t+1); nz(t, big ? .12 : .05, 'lowpass', big ? 800 : 2000, big ? .4 : .2, 1, music); }
}
function sched(){
  if(!ctx || ctx.state !== 'running') return;
  if(nextT < ctx.currentTime) nextT = ctx.currentTime + .02;
  while(nextT < ctx.currentTime + .12){
    if(pending !== undefined && step%4 === 0){ mood = pending; pending = undefined; step = 0; }
    const M = MOODS[mood];
    if(M) playStep(step, nextT);
    nextT += M ? 60/M.tempo/4 : .1; step = (step+1)%64;
  }
}
export const Sound = {
  get ctx(){ return ctx; },
  setMood(m){ if(m === mood && pending === undefined) return; pending = m; },
  pause(){ ctx && ctx.suspend(); }, resume(){ ctx && ctx.resume(); },
  toggleMute(){ muted = !muted; if(master) master.gain.value = muted ? 0 : .85; return muted; },
  duck(on){ if(music) music.gain.setTargetAtTime(on ? .17 : .45, ctx.currentTime, .15); },
  playClip(buf){ const s = ctx.createBufferSource(); s.buffer = buf; s.connect(vbus); s.connect(rev); s.start(); return s; },
  sparkle(){ if(!ctx) return; const t = ctx.currentTime; [84,88,91,96,100,103,108].forEach((n,i) => osc('sine', mtof(n), t+i*.05, .1, .06, .002, .5, 9000, sfx, true)); },
  whoosh(){ if(!ctx) return; const t = ctx.currentTime, n = nz(t,.6,'bandpass',300,.5,1.2); n.f.frequency.exponentialRampToValueAtTime(3200,t+.3); n.f.frequency.exponentialRampToValueAtTime(500,t+.6); },
  impact(big=false){ if(!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(30,t+.6); env(g,t,.002,big?1.4:.7,big?1.1:.8); o.connect(g); g.connect(sfx); o.start(t); o.stop(t+1.5); nz(t,big?1.4:.6,'lowpass',big?1200:900,big?.9:.6); },
  beam(dur=1.5){ if(!ctx) return; const t = ctx.currentTime; [0,7,12].forEach(i => { const a = osc('sawtooth', mtof(72+i), t, dur, .05, .08, dur, 3000, sfx, true); a.o.frequency.exponentialRampToValueAtTime(mtof(84+i), t+dur); }); nz(t,dur,'highpass',4000,.08); },
  growl(){ if(!ctx) return; const t = ctx.currentTime, a = osc('sawtooth', 70, t, 1.2, .25, .1, 1.2, 500, sfx); a.o.frequency.linearRampToValueAtTime(48, t+1.2); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 18; lg.gain.value = 15; l.connect(lg); lg.connect(a.o.frequency); l.start(t); l.stop(t+1.3); nz(t,1,'lowpass',400,.4); },
  chime(){ if(!ctx) return; const t = ctx.currentTime; [76,79,84,88].forEach((n,i) => INST.bell(n, t+i*.12, .4)); },
  shine(){ if(!ctx) return; const t = ctx.currentTime; for(let i=0;i<14;i++) osc('sine', mtof(72+i*2), t+i*.06, .15, .05, .002, .4, 9000, sfx, true); },
  dark(){ if(!ctx) return; const t = ctx.currentTime; const a = osc('sawtooth', 220, t, 1.6, .12, .2, 1.6, 900, sfx, true); a.o.frequency.exponentialRampToValueAtTime(55, t+1.6); nz(t,1.6,'lowpass',500,.3); },
};

/* recorded voice clips (anime/voices.js) */
const bank = window.ANIME_VOICES || {}, bufs = {};
let src = null, who = null, loading = null, vn = 0;
function load(){ if(loading || !ctx) return loading; loading = Promise.all(Object.entries(bank).map(async ([k,b64]) => { const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); try { bufs[k] = await ctx.decodeAudioData(bin.buffer); } catch(e) {} })); return loading; }
function play(k, buf, id){ if(id !== vn) return; if(src){ try { src.stop(); } catch(e) {} } const me = src = Sound.playClip(buf); who = k; Sound.duck(true); me.onended = () => { if(src === me){ src = null; who = null; Sound.duck(false); } }; }
export const Voice = {
  get who(){ return who; },
  unlock(){ load(); },
  say(k, text){ const key = k+'|'+text, id = ++vn; if(bufs[key]) play(k, bufs[key], id); else { const l = load(); l && l.then(() => bufs[key] && play(k, bufs[key], id)); } },
  stop(){ vn++; if(src){ try { src.stop(); } catch(e) {} src = null; } who = null; if(ctx) Sound.duck(false); },
};
