// Anime characters: 3D bodies with hand-drawn 2D faces (canvas textures), like cel-shaded anime.
import { THREE, V, part, toon, basic, flat, glow, starTex, scene, lerp } from './engine.js';

/* ---------- 2D anime face painter ---------- */
const FACE = 512;
function eye(g, cx, cy, side, o, kind){
  const ink = '#2a1426';
  g.lineCap = 'round'; g.lineJoin = 'round';
  if(kind === 'blink' || kind === 'happy'){
    g.strokeStyle = ink; g.lineWidth = 9; g.beginPath();
    if(kind === 'happy'){ g.moveTo(cx-40,cy+10); g.quadraticCurveTo(cx,cy-38,cx+40,cy+10); }
    else { g.moveTo(cx-42,cy); g.quadraticCurveTo(cx,cy+22,cx+42,cy); }
    g.stroke(); return;
  }
  const W = kind === 'surprised' ? 46 : 42, H = kind === 'surprised' ? 62 : 56;
  g.save(); g.beginPath(); g.ellipse(cx, cy, W, H, 0, 0, Math.PI*2); g.fillStyle = '#fff'; g.fill(); g.clip();
  const ir = kind === 'surprised' ? .62 : 1, ix = 34*ir, iy = 46*ir, ic = cy + (kind === 'surprised' ? 0 : 8);
  const gr = g.createLinearGradient(0, ic-iy, 0, ic+iy); gr.addColorStop(0, o.eyeDark); gr.addColorStop(.55, o.eye); gr.addColorStop(1, o.eyeLight);
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, ic, ix, iy, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = o.evil ? '#1a0008' : '#1d0f2a'; g.beginPath();
  if(o.evil) g.ellipse(cx, ic, 6*ir, 30*ir, 0, 0, Math.PI*2); else g.ellipse(cx, ic+4, 15*ir, 22*ir, 0, 0, Math.PI*2);
  g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx-12*side, ic-16*ir, 13*ir, 15*ir, -.4, 0, Math.PI*2); g.fill();
  g.beginPath(); g.arc(cx+12*side, ic+20*ir, 6*ir, 0, Math.PI*2); g.fill();
  if(kind === 'angry'){ g.fillStyle = o.skin; g.beginPath(); g.moveTo(cx-60*side, cy-70); g.lineTo(cx+60*side, cy-70); g.lineTo(cx+60*side, cy-34); g.lineTo(cx-60*side, cy+2); g.closePath(); g.fill(); }
  if(kind === 'sad'){ g.fillStyle = o.skin; g.beginPath(); g.moveTo(cx-60, cy-70); g.lineTo(cx+60, cy-70); g.lineTo(cx+60*side, cy-14); g.lineTo(cx-60*side, cy-40); g.closePath(); g.fill(); }
  g.restore();
  // lashes
  g.strokeStyle = ink; g.lineWidth = 11; g.beginPath();
  if(kind === 'angry'){ g.moveTo(cx-46*side, cy+2); g.lineTo(cx+48*side, cy-36); }
  else if(kind === 'sad'){ g.moveTo(cx-46*side, cy-40); g.lineTo(cx+46*side, cy-16); }
  else { g.moveTo(cx-48*side, cy-24); g.quadraticCurveTo(cx-6*side, cy-H-10, cx+50*side, cy-30); }
  g.stroke();
  if(o.lashes){ g.lineWidth = 7; g.beginPath(); g.moveTo(cx+46*side, cy-30); g.lineTo(cx+62*side, cy-42); g.stroke(); }
  g.lineWidth = 4; g.beginPath(); g.moveTo(cx-24, cy+H-4); g.quadraticCurveTo(cx, cy+H+4, cx+24, cy+H-4); g.stroke();
}
function brows(g, cx, side, kind, o){
  g.strokeStyle = o.brow; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath();
  const y = 150;
  if(kind === 'angry'){ g.moveTo(cx-40*side, y-18); g.lineTo(cx+38*side, y+16); }
  else if(kind === 'sad' || kind === 'worried'){ g.moveTo(cx-40*side, y+14); g.lineTo(cx+38*side, y-12); }
  else if(kind === 'surprised'){ g.moveTo(cx-34, y-22); g.quadraticCurveTo(cx, y-40, cx+34, y-22); }
  else { g.moveTo(cx-36, y-4); g.quadraticCurveTo(cx, y-16, cx+36, y-4); }
  g.stroke();
}
function mouth(g, kind, o){
  const x = 256, y = 410; g.lineCap = 'round'; g.strokeStyle = '#5a1a2a'; g.lineWidth = 6;
  if(kind === 'open' || kind === 'shout'){ const s = kind === 'shout' ? 1.5 : 1; g.fillStyle = '#7a1a30'; g.beginPath(); g.moveTo(x-22*s, y-8); g.quadraticCurveTo(x, y+36*s, x+22*s, y-8); g.closePath(); g.fill(); g.fillStyle = '#ff8aa8'; g.beginPath(); g.ellipse(x, y+12*s, 11*s, 7*s, 0, 0, Math.PI*2); g.fill(); }
  else if(kind === 'o'){ g.fillStyle = '#7a1a30'; g.beginPath(); g.ellipse(x, y+4, 10, 14, 0, 0, Math.PI*2); g.fill(); }
  else if(kind === 'frown'){ g.beginPath(); g.moveTo(x-20, y+10); g.quadraticCurveTo(x, y-8, x+20, y+10); g.stroke(); }
  else if(kind === 'smirk'){ g.beginPath(); g.moveTo(x-22, y); g.quadraticCurveTo(x+4, y+12, x+26, y-10); g.stroke(); }
  else if(kind === 'w'){ g.beginPath(); g.moveTo(x-26, y-4); g.quadraticCurveTo(x-13, y+16, x, y); g.quadraticCurveTo(x+13, y+16, x+26, y-4); g.stroke(); }
  else { g.beginPath(); g.moveTo(x-18, y); g.quadraticCurveTo(x, y+14, x+18, y); g.stroke(); }
}
function paintFace(o, eyes, m){
  const c = document.createElement('canvas'); c.width = c.height = FACE; const g = c.getContext('2d');
  if(o.dotEyes){
    for(const s of [-1,1]){ const cx = 256+s*92; g.fillStyle = '#1d0f2a'; g.beginPath();
      if(eyes === 'happy' || eyes === 'blink'){ g.strokeStyle = '#1d0f2a'; g.lineWidth = 12; g.lineCap = 'round'; g.moveTo(cx-30, 270); g.quadraticCurveTo(cx, eyes === 'happy' ? 230 : 290, cx+30, 270); g.stroke(); }
      else { g.ellipse(cx, 262, eyes === 'surprised' ? 30 : 26, eyes === 'surprised' ? 40 : 36, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx-8, 248, 10, 0, Math.PI*2); g.fill(); } }
    g.fillStyle = '#2a1426'; g.beginPath(); g.ellipse(256, 330, 16, 11, 0, 0, Math.PI*2); g.fill();
    mouth(g, m === 'smile' ? 'w' : m, o);
  } else {
    if(o.blush){ g.fillStyle = 'rgba(255,110,150,.35)'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(256+s*120, 345, 42, 18, 0, 0, Math.PI*2); g.fill(); } }
    for(const s of [-1,1]){ const cx = 256 + s*92; eye(g, cx, 262, s, o, eyes); brows(g, cx, s, o.evil && eyes === 'normal' ? 'angry' : eyes, o); }
    if(eyes === 'sad' && !o.evil){ g.fillStyle = 'rgba(140,200,255,.85)'; g.beginPath(); g.ellipse(256+130, 350, 9, 16, 0, 0, Math.PI*2); g.fill(); }
    mouth(g, m, o);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ---------- body ---------- */
function bow(color, parent, p, s=1){
  const g = new THREE.Group(); g.position.set(...p); g.scale.setScalar(s); parent.add(g);
  const m = toon(color);
  part(new THREE.ConeGeometry(.09,.2,10), m, g, [.1,0,0], null, [0,0,Math.PI/2]);
  part(new THREE.ConeGeometry(.09,.2,10), m, g, [-.1,0,0], null, [0,0,-Math.PI/2]);
  part(new THREE.SphereGeometry(.05,12,10), m, g);
  part(new THREE.ConeGeometry(.04,.18,8), m, g, [.04,-.12,0], null, [0,0,.3]);
  part(new THREE.ConeGeometry(.04,.18,8), m, g, [-.04,-.12,0], null, [0,0,-.3]);
  return g;
}
export function starShape(r=.2, inner=.45){ const s = new THREE.Shape(); for(let i=0;i<10;i++){ const a = i*Math.PI/5 + Math.PI/2, rr = i%2 ? r*inner : r; i ? s.lineTo(Math.cos(a)*rr, Math.sin(a)*rr) : s.moveTo(Math.cos(a)*rr, Math.sin(a)*rr); } return new THREE.ExtrudeGeometry(s, {depth:.05, bevelEnabled:true, bevelSize:.015, bevelThickness:.015, bevelSegments:1}); }

function makeGirl(o){
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const skin = toon(o.skin);
  const H = {root, rig, o, faces:{}, faceKey:'', eyes:'normal', mouth:'smile', talking:false, blinkAt:2, outfits:{}, tails:[], seed:Math.random()*6};
  // legs
  H.legs = [1,-1].map(sd => { const p = new THREE.Group(); p.position.set(.12*sd, 1.3, 0); rig.add(p);
    part(new THREE.CapsuleGeometry(.09,1.0,6,14), skin, p, [0,-.6,0]); return p; });
  [H.legL, H.legR] = H.legs;
  const torso = new THREE.Group(); torso.position.y = 1.3; rig.add(torso); H.torso = torso;
  part(new THREE.CylinderGeometry(.06,.07,.2,12), skin, torso, [0,1.02,0]);
  H.arms = [1,-1].map(sd => { const p = new THREE.Group(); p.position.set(.31*sd, 2.12, 0); rig.add(p);
    part(new THREE.CapsuleGeometry(.065,.55,6,12), skin, p, [0,-.36,0]); const hand = part(new THREE.SphereGeometry(.085,14,12), skin, p, [0,-.72,0]); p.userData.hand = hand; return p; });
  [H.armL, H.armR] = H.arms;
  // head
  const head = new THREE.Group(); head.position.y = 2.62; rig.add(head); H.head = head;
  const R = .44;
  part(new THREE.SphereGeometry(R,40,28), skin, head, [0,0,0], [1,1.04,.98]);
  H.facePatch = new THREE.Mesh(new THREE.SphereGeometry(R*1.012, 40, 24, Math.PI/2-.82, 1.64, 1.0, 1.32), basic(0xffffff,{transparent:true, depthWrite:false}));
  H.facePatch.scale.set(1,1.04,.98); H.facePatch.renderOrder = 2; head.add(H.facePatch);
  for(const s of [1,-1]) part(new THREE.SphereGeometry(.07,10,8), skin, head, [R*.96*s,-.04,0], [.6,1,1]);
  // hair
  const hm = toon(o.hair); H.hairMat = hm;
  part(new THREE.SphereGeometry(R*1.09,40,20,0,Math.PI*2,0,1.08), hm, head, [0,.03,-.01]);
  part(new THREE.SphereGeometry(R*1.08,40,24,Math.PI,Math.PI,0,o.hairBack||2.0), hm, head, [0,.02,-.02], null, null, false);
  const bangs = o.bangs || [[-.3,.1],[-.15,.0],[0,.06],[.15,0],[.3,.1]];
  for(const [x,dy] of bangs) part(new THREE.ConeGeometry(.12,.4,8), hm, head, [x*1.05,.2+dy*.3,R*.86 - Math.abs(x)*.25], null, [Math.PI-.25, 0, x*.9]);
  for(const s of [1,-1]) part(new THREE.ConeGeometry(.1,o.sideLock||.6,8), hm, head, [.4*s,-.08,.12], null, [Math.PI, 0, -.08*s]);
  o.hairExtra && o.hairExtra(head, hm, H);
  // outfits
  for(const [name, build] of Object.entries(o.outfits)){ const g = new THREE.Group(); rig.add(g); build(g, H); H.outfits[name] = g; }
  H.setOutfit = name => { for(const [k,g] of Object.entries(H.outfits)) g.visible = k === name; H.outfit = name; };
  H.setOutfit(Object.keys(o.outfits)[0]);
  root.traverse(m => { if(m.isMesh && !m.userData.outline && m !== H.facePatch) m.castShadow = true; });
  scene.add(root);
  return H;
}
function uniform(collar, skirt, ribbon){
  return (g, H) => {
    const shirt = toon(0xffffff), nav = toon(collar), sk = toon(skirt);
    part(new THREE.CapsuleGeometry(.22,.45,8,18), shirt, g, [0,1.83,0], [1.08,1,.9]);
    part(new THREE.TorusGeometry(.17,.06,8,20), nav, g, [0,2.24,.02], null, [Math.PI/2+.35,0,0]);
    part(new THREE.BoxGeometry(.56,.42,.04), nav, g, [0,2.04,-.22], null, [.18,0,0]);
    bow(ribbon, g, [0,2.08,.23], 1.1);
    part(flat(new THREE.CylinderGeometry(.27,.56,.5,14,1,true)), sk, g, [0,1.2,0]).material.side = THREE.DoubleSide;
    for(const leg of H.legs){ part(new THREE.CapsuleGeometry(.1,.42,6,12), toon(0x1e2448), leg, [0,-.96,0]); part(new THREE.SphereGeometry(.12,14,10), toon(0x5a3424), leg, [0,-1.28,.05], [1,.7,1.5]); }
    for(const arm of H.arms) part(new THREE.CapsuleGeometry(.085,.18,6,12), shirt, arm, [0,-.12,0]);
  };
}
function heroDress(g, H){
  const white = toon(0xfffafc), pink = toon(0xff7eb6), gold = toon(0xffd75e), deep = toon(0xe0458e);
  part(new THREE.CapsuleGeometry(.22,.45,8,18), white, g, [0,1.83,0], [1.08,1,.9]);
  part(new THREE.CylinderGeometry(.235,.25,.3,18), pink, g, [0,1.62,0]);
  part(new THREE.TorusGeometry(.245,.035,8,24), gold, g, [0,1.47,0], null, [Math.PI/2,0,0], false);
  bow(0xe0458e, g, [0,2.02,.24], 1.8);
  part(new THREE.SphereGeometry(.05,10,8), gold, g, [0,2.02,.3]);
  part(flat(new THREE.CylinderGeometry(.27,.6,.42,16,1,true)), pink, g, [0,1.26,0]).material.side = THREE.DoubleSide;
  part(flat(new THREE.CylinderGeometry(.5,.72,.25,20,1,true)), white, g, [0,1.0,0]).material.side = THREE.DoubleSide;
  bow(0xff7eb6, g, [0,1.5,-.26], 2.6);
  for(const arm of H.arms){ part(new THREE.SphereGeometry(.13,16,12), pink, arm, [0,-.04,0]); part(new THREE.CapsuleGeometry(.075,.25,6,12), white, arm, [0,-.55,0]); part(new THREE.TorusGeometry(.08,.025,6,16), gold, arm, [0,-.42,0], null, [Math.PI/2,0,0], false); }
  for(const leg of H.legs){ part(new THREE.CapsuleGeometry(.105,.5,6,12), white, leg, [0,-.92,0]); part(new THREE.TorusGeometry(.11,.03,6,16), deep, leg, [0,-.66,0], null, [Math.PI/2,0,0], false); part(new THREE.SphereGeometry(.13,14,10), pink, leg, [0,-1.28,.05], [1,.7,1.5]); }
  const tiara = part(starShape(.13), gold, H.head, [0,.4,.33], null, [-.4,0,0], false); tiara.visible = false; H.tiara = tiara;
  const tg = glow(0xffe08a, .8, .9); tg.position.set(0,.42,.38); H.head.add(tg); tg.visible = false; H.tiaraGlow = tg;
  // wand in right hand
  const wand = new THREE.Group(); wand.position.set(0,-.74,.05); wand.rotation.x = Math.PI/2; H.armR.add(wand);
  part(new THREE.CylinderGeometry(.025,.025,.6,8), white, wand, [0,.25,0]);
  part(starShape(.16), gold, wand, [0,.62,-.025]);
  const wg = glow(0xffd75e, 1.1, .9); wg.position.set(0,.62,0); wand.add(wg);
  wand.visible = false; H.wand = wand;
  // wings (super form)
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256; const w2 = wc.getContext('2d');
  const gr = w2.createLinearGradient(0,0,256,0); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(1,'rgba(255,170,220,.0)');
  w2.fillStyle = gr; w2.beginPath(); w2.moveTo(0,128); w2.bezierCurveTo(60,10,200,0,256,20); w2.bezierCurveTo(200,90,170,120,256,150); w2.bezierCurveTo(170,170,120,230,0,140); w2.fill();
  const wt = new THREE.CanvasTexture(wc);
  H.wings = new THREE.Group(); H.wings.position.set(0,2.0,-.2); H.rig.add(H.wings); H.wings.visible = false;
  for(const s of [1,-1]){ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6), basic(0xffffff,{map:wt, transparent:true, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending})); m.geometry.translate(.8,0,0); m.scale.x = s; m.rotation.y = s*.5; H.wings.add(m); }
}
function twinTails(head, hm, H){
  for(const s of [1,-1]){
    const p = new THREE.Group(); p.position.set(.42*s,.22,-.12); head.add(p);
    part(new THREE.SphereGeometry(.15,16,12), hm, p);
    const t = new THREE.Group(); p.add(t);
    part(new THREE.CapsuleGeometry(.15,.5,8,14), hm, t, [0,-.42,0], [1,1,.85]);
    part(new THREE.ConeGeometry(.15,.75,12), hm, t, [0,-1.0,0], null, [Math.PI,0,0]);
    t.rotation.z = .35*s; t.userData.s = s; H.tails.push(t);
    bow(0xe0458e, p, [0,.06,.08*0+.02], .9).rotation.y = s*.6;
  }
}

/* ---------- cast ---------- */
export function makeHikari(){
  return makeGirl({skin:0xffe2d2, hair:0xff8ac2, eye:'#ff5fa8', eyeDark:'#7a1f5a', eyeLight:'#ffc1e0', brow:'#c9407e', blush:true, lashes:true,
    hairExtra:twinTails, outfits:{uniform:uniform(0x2a3a7a, 0x2a3a7a, 0xe0304a), hero:heroDress}});
}
export function makeMina(){
  return makeGirl({skin:0xffe0c8, hair:0x6a4028, eye:'#3fb97a', eyeDark:'#13502e', eyeLight:'#a8f0c8', brow:'#4a2a18', blush:true, lashes:true, hairBack:2.2, sideLock:.45,
    bangs:[[-.32,.12],[-.18,0],[-.04,.04],[.1,0],[.26,.08]],
    hairExtra:(head) => { part(starShape(.07), toon(0x7ee0a8), head, [.3,.3,.3], null, [0,.5,.3], false); },
    outfits:{uniform:uniform(0x2a3a7a, 0x2a3a7a, 0x2aa86a)}});
}
export function makeYomi(){
  return makeGirl({skin:0xeadcf4, hair:0x2a1240, eye:'#ff3060', eyeDark:'#5a0018', eyeLight:'#ffb0c0', brow:'#2a1240', evil:true, lashes:true, hairBack:2.6, sideLock:1.1,
    hairExtra:(head, hm) => {
      part(new THREE.CapsuleGeometry(.36,1.5,8,16), hm, head, [0,-.95,-.28], [1.05,1,.45]);
      const gold = toon(0x9a7cff);
      part(new THREE.TorusGeometry(.38,.03,6,24), gold, head, [0,.38,-.02], null, [Math.PI/2-.1,0,0], false);
      for(let i=0;i<5;i++){ const a = (i-2)*.38; part(new THREE.ConeGeometry(.045,.28,6), gold, head, [Math.sin(a)*.37,.5,Math.cos(a)*.35-.02], null, [.15,0,-a*.4], false); }
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.06), basic(0xff3060)); gem.position.set(0,.5,.36); head.add(gem);
    },
    outfits:{dress:(g, H) => {
      const d = toon(0x3a1660), d2 = toon(0x1a0a2e), trim = toon(0x9a7cff);
      part(new THREE.CapsuleGeometry(.22,.45,8,18), d, g, [0,1.83,0], [1.05,1,.9]);
      part(flat(new THREE.CylinderGeometry(.26,1.0,1.75,18,1,true)), d2, g, [0,.9,0]).material.side = THREE.DoubleSide;
      part(new THREE.TorusGeometry(.27,.03,6,24), trim, g, [0,1.6,0], null, [Math.PI/2,0,0], false);
      for(const s of [1,-1]) part(new THREE.ConeGeometry(.12,.45,6), d2, g, [.28*s,2.32,-.08], null, [0,0,-.5*s]);
      for(const arm of H.arms) part(new THREE.CapsuleGeometry(.08,.5,6,12), d2, arm, [0,-.38,0]);
      const aura = glow(0x9a3cff, 4.5, .35); aura.position.y = 1.6; g.add(aura); H.aura = aura;
    }}});
}
export function makeKon(){
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const fur = toon(0xff9a3c), white = toon(0xfff4e8), dark = toon(0x5a2a10);
  const H = {root, rig, o:{dotEyes:true, skin:'#ff9a3c'}, faces:{}, faceKey:'', eyes:'normal', mouth:'smile', talking:false, blinkAt:1, seed:1, fox:true};
  part(new THREE.SphereGeometry(.28,24,18), fur, rig, [0,.3,0], [1,.95,1.1]);
  part(new THREE.SphereGeometry(.18,18,14), white, rig, [0,.26,.14], [1,1,.8], null, false);
  const head = new THREE.Group(); head.position.y = .72; rig.add(head); H.head = head;
  part(new THREE.SphereGeometry(.3,28,20), fur, head, [0,0,0], [1.1,1,1]);
  part(new THREE.SphereGeometry(.13,16,12), white, head, [0,-.08,.22], [1.2,.8,1]);
  H.facePatch = new THREE.Mesh(new THREE.SphereGeometry(.3*1.03, 32, 20, Math.PI/2-.9, 1.8, 1.0, 1.4), basic(0xffffff,{transparent:true, depthWrite:false}));
  H.facePatch.scale.set(1.1,1,1); H.facePatch.renderOrder = 2; head.add(H.facePatch);
  for(const s of [1,-1]){ const e = part(new THREE.ConeGeometry(.12,.32,4), fur, head, [.17*s,.27,0], null, [0,0,-.35*s]); part(new THREE.ConeGeometry(.06,.18,4), dark, e, [0,.05,.035], null, null, false); }
  const star = new THREE.Mesh(starShape(.06), basic(0xffd75e)); star.position.set(0,.18,.27); head.add(star);
  H.tail = new THREE.Group(); H.tail.position.set(0,.3,-.25); rig.add(H.tail);
  part(new THREE.SphereGeometry(.2,18,14), fur, H.tail, [0,.25,-.2], [1,1.6,1]);
  part(new THREE.SphereGeometry(.12,14,10), white, H.tail, [0,.55,-.32], [1,1.3,1]);
  for(const s of [1,-1]) part(new THREE.SphereGeometry(.08,10,8), fur, rig, [.13*s,.06,.08]);
  const g = glow(0xffd75e, 1.6, .35); g.position.y = .5; rig.add(g);
  scene.add(root);
  return H;
}
export function makeBeast(scale=1){
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const m = toon(0x2a0f3e), m2 = toon(0x16061f);
  const body = part(new THREE.SphereGeometry(1,28,20), m, rig, [0,1.1,0], [1.1,1,1]);
  for(let i=0;i<9;i++){ const a = i/9*Math.PI*2; part(new THREE.ConeGeometry(.18,.7,6), m2, rig, [Math.cos(a)*.7,1.75+Math.sin(i)*.1,Math.sin(a)*.5-.2], null, [Math.sin(a)*.6,0,-Math.cos(a)*.6]); }
  for(const s of [1,-1]){ part(new THREE.CapsuleGeometry(.2,.5,6,10), m2, rig, [.75*s,.5,.2], null, [0,0,.3*s]); const e = new THREE.Mesh(new THREE.SphereGeometry(.16,12,10), basic(0xff2050)); e.position.set(.35*s,1.35,.86); e.scale.set(1.3,.7,.5); e.rotation.z = -.3*s; rig.add(e); const eg = glow(0xff2050,.9,.9); eg.position.copy(e.position).add(V(0,0,.1)); rig.add(eg); }
  const mouthM = new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,16,Math.PI), basic(0xff2050)); mouthM.position.set(0,.85,.9); mouthM.rotation.z = Math.PI; rig.add(mouthM);
  const aura = glow(0x8a2aff, 5, .35); aura.position.y = 1.2; rig.add(aura);
  root.scale.setScalar(scale); scene.add(root);
  return {root, rig, body, beast:true, seed:Math.random()*6};
}

/* ---------- faces & poses ---------- */
export function setFace(H, eyes, m){ if(eyes) H.eyes = eyes; if(m) H.mouth = m; }
export function updateFace(H, t){
  if(!H.facePatch) return;
  let e = H.eyes, m = H.mouth;
  if(e === 'normal' || e === 'angry' || e === 'surprised'){ if(t > H.blinkAt){ e = 'blink'; if(t > H.blinkAt + .12) H.blinkAt = t + 2 + Math.random()*3; } }
  if(H.talking) m = Math.sin(t*14) > 0 ? (H.mouth === 'shout' ? 'shout' : 'open') : (H.mouth === 'open' || H.mouth === 'shout' ? 'o' : H.mouth);
  const key = e + '|' + m;
  if(key === H.faceKey) return;
  H.faceKey = key; H.faces[key] ||= paintFace(H.o, e, m);
  H.facePatch.material.map = H.faces[key]; H.facePatch.material.needsUpdate = true;
}
export function reset(H){
  H.rig.position.set(0,0,0); H.rig.rotation.set(0,0,0);
  if(H.fox || H.beast) return;
  H.armL.rotation.set(0,0,.1); H.armR.rotation.set(0,0,-.1); H.legL.rotation.set(0,0,0); H.legR.rotation.set(0,0,0); H.head.rotation.set(0,0,0); H.torso.rotation.set(0,0,0);
}
export const Pose = {
  idle(H,t){ reset(H); if(H.fox){ H.rig.position.y = .9 + Math.sin(t*2.5)*.08; H.tail.rotation.z = Math.sin(t*3)*.4; return; } if(H.beast){ H.rig.scale.set(1+Math.sin(t*3)*.04, 1-Math.sin(t*3)*.04, 1); return; }
    const b = Math.sin(t*2+H.seed); H.rig.position.y = b*.012; H.armL.rotation.z = .1+b*.03; H.armR.rotation.z = -.1-b*.03; H.head.rotation.z = Math.sin(t*.7+H.seed)*.05; },
  float(H,t){ Pose.idle(H,t); if(!H.fox && !H.beast){ H.rig.position.y = .5+Math.sin(t*1.6)*.12; H.armL.rotation.z = .5; H.armR.rotation.z = -.5; } },
  walk(H,t,f=7){ reset(H); const s = Math.sin(t*f); H.legL.rotation.x = s*.5; H.legR.rotation.x = -s*.5; H.armL.rotation.x = -s*.4; H.armR.rotation.x = s*.4; H.rig.position.y = Math.abs(Math.cos(t*f))*.05; },
  run(H,t,f=13){ reset(H); const s = Math.sin(t*f); H.legL.rotation.x = s*1.0; H.legR.rotation.x = -s*1.0; H.armL.rotation.x = -s*1.0; H.armR.rotation.x = s*1.0; H.rig.rotation.x = .25; H.rig.position.y = Math.abs(Math.cos(t*f))*.12; },
  fly(H,t){ reset(H); H.rig.rotation.x = 1.1; H.rig.position.y = 1; H.armR.rotation.x = -2.9; H.armL.rotation.set(.3,0,.3); H.legL.rotation.x = .2; H.legR.rotation.x = .5+Math.sin(t*3)*.1; },
  hover(H,t){ reset(H); const s = Math.sin(t*2.4+H.seed); H.rig.position.y = s*.1; H.armL.rotation.z = .7+s*.05; H.armR.rotation.z = -.7-s*.05; H.legL.rotation.x = .1; H.legR.rotation.x = .5; },
  cast(H,t){ reset(H); H.armR.rotation.set(-1.55,0,.1); H.armL.rotation.set(-.3,0,.35); H.legL.rotation.x = -.25; H.legR.rotation.x = .25; H.rig.rotation.y = -.15; },
  wandUp(H,t){ reset(H); H.armR.rotation.set(-.2,0,-2.85); H.armL.rotation.set(0,0,.5); H.legR.rotation.x = .5; H.head.rotation.x = -.2; },
  heroPose(H,t){ reset(H); H.armR.rotation.set(-.3,0,-2.5); H.armL.rotation.set(-.4,0,.9); H.legL.rotation.set(.15,0,.05); H.legR.rotation.set(.7,0,-.15); H.rig.rotation.z = .06; H.head.rotation.z = .12; H.rig.position.y = Math.sin(t*2)*.02; },
  peace(H,t){ reset(H); H.armR.rotation.set(-.4,0,-2.2); H.armL.rotation.set(0,0,.25); H.head.rotation.z = .15; H.legR.rotation.x = .2; },
  surprised(H,t){ reset(H); H.armL.rotation.set(-.6,0,.9); H.armR.rotation.set(-.6,0,-.9); H.rig.rotation.x = -.12; H.rig.position.y = Math.abs(Math.sin(t*20))*.02; },
  sad(H,t){ reset(H); H.head.rotation.x = .35; H.armL.rotation.set(-.3,0,-.1); H.armR.rotation.set(-.3,0,.1); H.rig.rotation.x = .08; },
  cheer(H,t,ph=0){ reset(H); const j = Math.abs(Math.sin(t*5+ph)); H.rig.position.y = j*.5; H.armL.rotation.z = 2.7; H.armR.rotation.z = -2.7; H.legL.rotation.x = -j*.5; H.legR.rotation.x = j*.3; },
  hurt(H,t){ reset(H); H.rig.rotation.x = -.35; H.armL.rotation.set(.5,0,.8); H.armR.rotation.set(.5,0,-.8); H.head.rotation.x = -.3; },
  kneel(H,t){ reset(H); H.rig.position.y = -.55; H.legL.rotation.x = -1.4; H.legR.rotation.x = .3; H.armL.rotation.set(-.4,0,.2); H.armR.rotation.set(-.6,0,-.1); H.head.rotation.x = .3; },
  lie(H,t){ reset(H); H.rig.rotation.x = -1.5; H.rig.position.set(0,.25,-1.4); H.armL.rotation.z = .5; H.armR.rotation.z = -.5; },
  hold(H,t){ reset(H); H.armL.rotation.set(-1.2,0,-.5); H.armR.rotation.set(-1.2,0,.5); },
  laugh(H,t){ reset(H); const s = Math.sin(t*14); H.armL.rotation.set(-.6,0,.4); H.armR.rotation.set(-1.2,0,.3); H.rig.rotation.x = -.15; H.head.rotation.x = -.25; H.rig.position.y = .5 + Math.abs(s)*.04; },
  shout(H,t){ reset(H); H.armL.rotation.set(.3,0,.4); H.armR.rotation.set(.3,0,-.4); H.rig.rotation.x = .1; H.head.rotation.x = -.15; },
};
export function swayTails(H, t, k=1){ for(const tl of H.tails || []) tl.rotation.z = (.35 + Math.sin(t*2.2+tl.userData.s)*.07*k)*tl.userData.s - H.rig.rotation.z*.5; for(const tl of H.tails || []) tl.rotation.x = H.rig.rotation.x > .6 ? H.rig.rotation.x*.9 : Math.sin(t*1.7)*.05*k; }
