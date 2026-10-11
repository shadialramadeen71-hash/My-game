// Director: plays episodes shot by shot, with stock anime segments (OP, title card, transformation, preview).
import * as E from './engine.js';
import { CFG } from './engine.js';
import { THREE, V, lerp, sm, eo, ei, seg, clamp, scene, camera, look, composer, emit, ring, flash, lines, petalsOn, makeBeam, setBeam, glow, starTex, setTod, env, tick, clearParticles } from './engine.js';
import { makeHikari, makeMina, makeYomi, makeKon, makeBeast, Pose, setFace, updateFace, swayTails, reset } from './chars.js';
import { SPOT, setStage, setNight, tickWorld, darkStar, realmMoon, cloudM } from './world.js';
import { Sound, Voice, init as audioInit } from './audio.js';

const $ = id => document.getElementById(id);
const C = {hikari:makeHikari(), mina:makeMina(), kon:makeKon(), yomi:makeYomi()};
const beasts = [makeBeast(1), makeBeast(1), makeBeast(1.9)];
const ACTORS = [...Object.values(C), ...beasts];
const BC = {star:0xff9ad0, gold:0xffd75e, dark:0x9a3cff, mina:0x7ee0a8, ...CFG.beams};
const beams = {star:makeBeam(BC.star,.35), gold:makeBeam(BC.gold,.3), dark:makeBeam(BC.dark,.4), mina:makeBeam(BC.mina,.25), ice:makeBeam(0x9ad8ff,.4)};
const pendant = glow(0xffe08a, .9, 1, starTex); scene.add(pendant); pendant.visible = false;
const swirl = new THREE.Group(); scene.add(swirl);
for(let i=0;i<5;i++){ const m = new THREE.Mesh(new THREE.TorusGeometry(1.1+i*.12,.035,6,48), E.basic([0xff9ad0,0xffd75e,0xffffff,0x9ad8ff,0xff9ad0][i],{transparent:true, opacity:.8, blending:THREE.AdditiveBlending, depthWrite:false})); m.rotation.x = Math.PI/2; swirl.add(m); }
swirl.visible = false;
let shake = 0; const WHITE = new THREE.Color(0xffffff);

const WHO = {hikari:['ヒカリ','var(--sakura)'], mina:['ミナ','var(--mina)'], kon:['コン','var(--kon)'], yomi:['ヨミ','var(--yomi)'], narr:['ナレーション','var(--muted)'], ...CFG.names};
const TITLE = {ja:'星光少女ヒカリ', en:'Starlight Girl Hikari', ar:'فتاة ضوء النجوم هيكاري', ...CFG.title};
const HAIR = C.hikari.o.hair, SUPER_HAIR = CFG.cast?.hikari?.superHair ?? 0xffd0ea, KEY = CFG.key || 'hikari-tr';
let trLang = 'ar'; try { trLang = localStorage.getItem(CFG.key || 'hikari-tr') || 'ar'; } catch(e) {}

/* ---------- helpers given to the episode scripts ---------- */
function camPath(lt, keys){
  let i = 0; while(i < keys.length-2 && lt >= keys[i+1][0]) i++;
  const a = keys[i], b = keys[Math.min(i+1, keys.length-1)], u = a === b ? 0 : sm((lt-a[0])/(b[0]-a[0]));
  const ev = v => typeof v === 'function' ? v(lt) : v, pa = ev(a[1]), pb = ev(b[1]), ta = ev(a[2]), tb = ev(b[2]);
  camera.position.set(lerp(pa[0],pb[0],u), lerp(pa[1],pb[1],u), lerp(pa[2],pb[2],u));
  look.set(lerp(ta[0],tb[0],u), lerp(ta[1],tb[1],u), lerp(ta[2],tb[2],u));
}
function place(k, p, ry=0, pose='idle', t=0){ const h = C[k] || k; h.root.visible = true; h.root.position.set(p[0],p[1],p[2]); h.root.rotation.y = ry; if(pose) Pose[pose](h, t); return h; }
let callKey = '';
function call(text){ if(text === callKey) return; callKey = text; const el = $('call'); if(text){ el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); } else el.classList.remove('on'); }
let cardKey = '';
function card(on, k='', h='', p='', bg=''){ const key = on ? k+h+p+bg : ''; if(key === cardKey) return; cardKey = key; const el = $('card'); if(on){ el.querySelector('.k').textContent = k; el.querySelector('h2').textContent = h; el.querySelector('p').textContent = p; el.style.setProperty('--cardbg', bg || 'transparent'); el.classList.add('on'); } else el.classList.remove('on'); }
const tr = o => trLang === 'none' ? '' : (o[trLang] || '');
const A = {scene, glow, THREE, V, lerp, sm, eo, ei, seg, clamp, C, beasts, beams, pendant, swirl, Pose, setFace, swayTails, reset, SPOT, setTod, setNight, emit, ring, flash, lines, petalsOn, setBeam, camPath, place, call, card, tr, Sound, Voice, darkStar, realmMoon, camera, look, env,
  shake(v){ shake = Math.max(shake, v); }, hp(k, dy=0){ const h = C[k] || k; return h.root.position.clone().add(V(0,dy,0)); }, hand(k){ const h = C[k]; const v = V(); h.armR.userData.hand.getWorldPosition(v); return v; }, wandTip(){ const v = V(0,.62,0); C.hikari.wand.localToWorld(v); return v; }};

/* ---------- stock segments ---------- */
A.OP = () => ({ dur:10, stage:'street', tod:'sunset', mood:'op', night:false,
  enter(){ C.hikari.setOutfit('hero'); C.hikari.wand.visible = C.hikari.tiara.visible = C.hikari.tiaraGlow.visible = true; },
  run(lt){ const r = SPOT.roof;
    place('hikari', [r.x, r.y+.3, r.z], .2, 'heroPose', lt); setFace(C.hikari, lt > 2 && lt < 2.3 ? 'blink' : 'happy', 'open');
    place('kon', [r.x+1.3, r.y+.3, r.z+.4], -.3, 'idle', lt); setFace(C.kon, 'happy', 'smile');
    const a = .3 + lt*.12; camPath(lt, [[0,[r.x+Math.sin(.3)*7, r.y+1.5, r.z+Math.cos(.3)*7],[r.x,r.y+2.2,r.z]],[10,[r.x+Math.sin(1.5)*5.5, r.y+2.6, r.z+Math.cos(1.5)*5.5],[r.x,r.y+2.4,r.z]]]);
    card(lt > 1.2 && lt < 8.8, TITLE.en, TITLE.ja, tr(TITLE));
    if(Math.random() < .3) emit(V(r.x+(Math.random()-.5)*6, r.y+Math.random()*4, r.z+(Math.random()-.5)*4), 0xffd75e, 1, .5, 1.2, .5, 0, 'star'); },
  lines:[], ev:[[.1, () => Sound.sparkle()]] });
A.TITLE = ep => ({ dur:4, stage:'void', tod:'magic', mood:null,
  run(lt){ card(true, `第${ep.no}話`, ep.ja, tr(ep), 'linear-gradient(135deg,#ff7eb6 0%,#ffb86b 50%,#7fd3ff 100%)'); camera.position.set(0,2,10); look.set(0,2,0); },
  lines:[], ev:[[.3, () => { Sound.chime(); Voice.say('narr', ep.titleSay); }]] });
A.TRANSFORM = (shout, pose, sup=false) => ({ dur:9.5, stage:'void', tod:'magic', mood:'transform', petals:0xffe08a,
  enter(){ C.hikari.setOutfit('uniform'); C.hikari.wand.visible = false; },
  run(lt, dt){ const h = C.hikari, y = 2*sm(seg(lt,1.4,4.2)) - 2*sm(seg(lt,6.4,7.4));
    place('hikari', [0, y, 0], lt > 1.4 && lt < 6.4 ? lt*6 : 0, null);
    if(lt < 1.4){ Pose.hold(h, lt); setFace(h, 'normal', 'shout'); pendant.visible = true; pendant.position.copy(A.hp('hikari', 1.95)).add(V(0,0,.45)); pendant.scale.setScalar(.9 + Math.sin(lt*20)*.2); }
    else if(lt < 6.4){ pendant.visible = false; Pose.wandUp(h, lt); h.armL.rotation.z = 2.4; setFace(h, 'blink', 'smile'); }
    else { Pose[pose](h, lt); setFace(h, 'normal', 'smile'); }
    if(lt > 4 && h.outfit !== 'hero'){ h.setOutfit('hero'); h.wand.visible = h.tiara.visible = h.tiaraGlow.visible = true; h.wings.visible = sup; if(sup) h.hairMat.color.setHex(SUPER_HAIR); }
    swirl.visible = lt > 1.4 && lt < 6.4; swirl.position.set(0, y + 1.6 + Math.sin(lt*3)*.8, 0); swirl.rotation.y = lt*4; swirl.rotation.z = Math.sin(lt*2)*.4; swirl.scale.setScalar(1 + Math.sin(lt*5)*.15);
    if(dt && lt > 1.4 && lt < 6.4) emit(V((Math.random()-.5)*3, y+Math.random()*3.2, (Math.random()-.5)*3), [0xffd75e,0xff9ad0,0xffffff][Math.floor(Math.random()*3)], 2, 1.5, 1, .55, 0, 'star');
    lines.mode = lt > 1.4 && lt < 6.4 ? 'focus' : null; lines.amount = 1; lines.color = '255,255,255';
    call(lt > 6.5 ? shout.ja : '');
    camPath(lt, [[0,[0,2.2,3.2],[0,2.1,0]], [1.4,[0,2.4,4.5],[0,2.4,0]], [4,[3.5,4,6],[0,3.5,0]], [6.4,[-2,3,7],[0,3,0]], [9.5,[0,2.2,7.5],[0,2,0]]]); },
  lines:[[.2,'hikari',shout.ja,shout.ar,shout.en,1.6]], ev:[[1.4, () => Sound.shine()], [4, () => { flash(1); Sound.sparkle(); ring(V(0,2,0),0xffd75e,8,1,false); }], [6.5, () => Sound.chime()]] });
A.NEXT = (ep, last=false) => ({ dur:last ? 12 : 10.5, stage:'street', tod:last ? 'dawn' : 'night', mood:'ed', night:!last,
  enter(){ C.hikari.setOutfit('uniform'); },
  run(lt){ const r = SPOT.roof;
    place('hikari', [r.x-.6, r.y+.3, r.z], -.2, last ? 'peace' : 'idle', lt); setFace(C.hikari, last ? 'happy' : 'normal', 'smile');
    place('kon', [r.x+.6, r.y+.3, r.z+.3], .2, 'idle', lt);
    if(last){ place('mina', [r.x+1.6, r.y+.3, r.z-.2], .3, 'cheer', lt); setFace(C.mina, 'happy', 'open'); }
    camPath(lt, [[0,[r.x, r.y+1.5, r.z+9],[r.x, r.y+5, r.z-20]], [last ? 12 : 10.5,[r.x, r.y+2.4, r.z+5.5],[r.x, r.y+2.2, r.z]]]);
    if(last) card(lt > 6.5, '', 'おわり', tr({ar:'النهاية · شكراً لمشاهدتكم!', en:'The End · Thanks for watching!'}));
    else card(lt > 6.8, '', 'つづく', tr({ar:'يتبع...', en:'To be continued...'})); },
  lines:[[.8,'hikari',ep.next.ja,ep.next.ar,ep.next.en,5.6]], ev:[] });

/* ---------- episodes ---------- */
const EPISODES = window.ANIME_EPISODES(A);
for(const ep of EPISODES){ let acc = 0; for(const s of ep.shots){ s.start = acc; acc += s.dur; } ep.total = acc; }

let mode = 'menu', epI = 0, T = 0, cur = -1, prevLt = -1, paused = false, ended = false, menuT = 0, clock = 0;
const show = (id, on) => { $(id).hidden = !on; };
function hideAll(){
  for(const a of ACTORS){ a.root.visible = false; a.root.scale.setScalar(a.root.userData.s0 ?? (a.root.userData.s0 = a.root.scale.x)); a.root.rotation.set(0,0,0); if(a.talking !== undefined) a.talking = false; }
  for(const b of Object.values(beams)) b.visible = false; pendant.visible = swirl.visible = false;
  const h = C.hikari; h.wings.visible = false; h.hairMat.color.setHex(HAIR);
  lines.mode = null; call(''); card(false); clearParticles(); shake = 0; darkStar.visible = true; darkStar.scale.setScalar(1);
  for(const k in C) setFace(C[k], 'normal', 'smile');
}
function enterShot(i){
  cur = i; prevLt = -1; hideAll();
  const s = EPISODES[epI].shots[i];
  setStage(s.stage); setTod(s.tod, s.todFrom || null); setNight(s.night ?? (s.tod === 'night' || s.tod === 'dark'));
  petalsOn.v = s.petals !== false && s.stage !== 'realm'; petalsOn.tint = typeof s.petals === 'number' ? s.petals : 0xffffff;
  if(s.mood !== undefined) Sound.setMood(s.mood);
  C.hikari.setOutfit(s.outfit || 'uniform'); const hero = (s.outfit || 'uniform') === 'hero';
  C.hikari.wand.visible = C.hikari.tiara.visible = C.hikari.tiaraGlow.visible = hero;
  if(s.wings){ C.hikari.wings.visible = true; C.hikari.hairMat.color.setHex(SUPER_HAIR); }
  petalsOn.snow = !!s.snow; if(s.snow) petalsOn.tint = 0xffffff;
  const good = !!s.yomiGood; if(C.yomi.o.evil === good){ C.yomi.o.evil = !good; C.yomi.faces = {}; C.yomi.faceKey = ''; C.yomi.aura.material.color.setHex(good ? 0xff9ad0 : (CFG.cast?.yomi?.aura ?? 0x9a3cff)); }
  s.st = {}; s.enter && s.enter.call(s, s.st);
}
function startEp(i){
  audioInit(); Voice.unlock(); Voice.stop(); epI = i; mode = 'episode'; T = 0; cur = -1; paused = false; ended = false; setPauseIcon();
  show('menu',false); show('endS',false); show('hud',true); show('ctrl',true); setSub(null);
  $('chip').textContent = `第${EPISODES[i].no}話 ${EPISODES[i].ja}`;
}
function toMenu(){
  Voice.stop(); mode = 'menu'; menuT = 0; paused = false; Sound.resume(); hideAll(); setSub(null);
  show('menu',true); show('endS',false); show('hud',false); show('ctrl',false); renderMenu();
  setStage('street'); setTod('sunset'); setNight(false); petalsOn.v = true; petalsOn.tint = 0xffffff; Sound.setMood(Sound.ctx ? 'op' : null);
}
let subKey = '';
function setSub(l){
  const key = l ? l[1]+l[2] : ''; if(key === subKey) return; subKey = key; const el = $('sub');
  if(!l){ el.hidden = true; return; }
  const [name, col] = WHO[l[1]]; el.querySelector('b').textContent = name; el.style.setProperty('--who', col);
  el.querySelector('.ja').textContent = l[2]; const t = trLang === 'ar' ? l[3] : trLang === 'en' ? l[4] : ''; el.querySelector('.tr').textContent = t || ''; el.querySelector('.tr').hidden = !t;
  el.hidden = false; if(mode === 'episode') Voice.say(l[1], l[2]);
}
function renderMenu(){
  $('eps').innerHTML = EPISODES.map((e,i) => `<button class="ep" data-i="${i}"><b>第${e.no}話</b><span>${e.ja}</span><small dir="auto">${trLang === 'none' ? '' : (e[trLang] || '')}</small></button>`).join('');
  for(const b of $('eps').querySelectorAll('.ep')) b.onclick = () => startEp(+b.dataset.i);
}
function setPauseIcon(){ $('pIcon').setAttribute('d', paused ? 'M7 4v16l13-8z' : 'M6 4h4v16H6zm8 0h4v16h-4z'); }
$('trSel').value = trLang;
$('trSel').onchange = e => { trLang = e.target.value; try { localStorage.setItem(KEY, trLang); } catch(err) {} renderMenu(); };
$('bStart').onclick = () => startEp(0);
$('eNext').onclick = () => startEp(Math.min(epI+1, EPISODES.length-1));
$('eAgain').onclick = () => startEp(epI);
$('eMenu').onclick = toMenu; $('bHome').onclick = toMenu; $('bRestart').onclick = () => startEp(epI);
$('bPause').onclick = () => { if(ended) return; paused = !paused; paused ? Sound.pause() : Sound.resume(); setPauseIcon(); };
$('bNext').onclick = () => { const sh = EPISODES[epI].shots; if(cur < sh.length-1){ Voice.stop(); T = sh[cur+1].start; if(paused){ paused = false; Sound.resume(); setPauseIcon(); } } };
$('bMute').onclick = () => { const m = Sound.toggleMute(); $('mIcon').setAttribute('d', m ? 'M3 9v6h4l5 5V4L7 9zm16.6 3 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4z' : 'M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z'); };
addEventListener('keydown', e => { if(mode === 'episode' && e.code === 'Space'){ e.preventDefault(); $('bPause').click(); } });
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); };

let last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const real = Math.min(.25, (now-last)/1000), rdt = Math.min(.05, real); last = now;
  const dt = (mode === 'episode' && paused) ? 0 : rdt; clock += dt;
  for(const k in C) C[k].talking = false;
  if(mode === 'episode'){
    const ep = EPISODES[epI];
    if(!paused) T += real;
    const tt = Math.min(T, ep.total - .001);
    let i = ep.shots.findIndex(s => tt >= s.start && tt < s.start + s.dur); if(i < 0) i = ep.shots.length-1;
    if(i !== cur) enterShot(i);
    const s = ep.shots[i], lt = (T >= ep.total ? T : tt) - s.start;
    for(const [t, fn] of s.ev) if(t > prevLt && t <= lt && dt) fn(s.st);
    if(dt || prevLt < 0) prevLt = lt;
    s.run.call(s, lt, dt, s.st);
    const ls = s.lines, li = ls.findIndex((l,j) => lt >= l[0] && lt < l[0] + (l[5] ?? 3.2) && !(ls[j+1] && lt >= ls[j+1][0]));
    setSub(li >= 0 ? ls[li] : null);
    $('prog').firstElementChild.style.width = (Math.min(T,ep.total)/ep.total*100) + '%';
    $('time').textContent = fmt(Math.min(T,ep.total)) + ' / ' + fmt(ep.total);
    if(T >= ep.total && !ended){ ended = true; setSub(null); show('ctrl',false); show('endS',true); show('eNext', epI < EPISODES.length-1); }
  } else {
    menuT += dt; const r = SPOT.roof;
    camPath(0, [[0,[r.x+Math.sin(menuT*.1)*6, r.y+2, r.z+Math.cos(menuT*.1)*6+1],[r.x, r.y+2.6, r.z]]]);
    place('hikari', [r.x, r.y+.3, r.z], 0, 'idle', menuT); setFace(C.hikari, 'normal', 'smile');
    place('kon', [r.x+1.1, r.y+.3, r.z+.3], -.4, 'idle', menuT);
  }
  if(Voice.who && C[Voice.who]) C[Voice.who].talking = true;
  for(const k in C){ updateFace(C[k], clock); swayTails(C[k], clock); }
  for(const b of beasts) if(b.root.visible && !b.held) Pose.idle(b, clock + b.seed);
  if(swirl.visible) swirl.children.forEach((m,i) => { m.rotation.z += dt*(3+i); m.position.y = Math.sin(clock*4+i)*.6; });
  if(C.yomi.aura) C.yomi.aura.material.opacity = .3 + Math.sin(clock*3)*.1;
  E.tick(clock, dt); tickWorld(clock); cloudM.color.copy(scene.fog.color).lerp(WHITE, .5);
  shake *= Math.pow(.03, dt);
  camera.position.x += (Math.random()-.5)*shake; camera.position.y += (Math.random()-.5)*shake;
  camera.lookAt(look);
  composer.render();
}
toMenu(); $('msg').hidden = true;
requestAnimationFrame(frame);
