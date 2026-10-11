// Render engine: anime cel shading, ink outlines, bloom, sky dome, particles, 2D speed lines.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { THREE };

export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export const clamp = (x,a=0,b=1) => Math.min(b,Math.max(a,x));
export const lerp = (a,b,t) => a+(b-a)*t;
export const sm = t => { t = clamp(t); return t*t*(3-2*t); };
export const eo = t => { t = clamp(t); return 1-Math.pow(1-t,3); };
export const ei = t => { t = clamp(t); return t*t*t; };
export const seg = (lt,a,b) => clamp((lt-a)/(b-a));
let seed = 7;
export const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1|seed); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; };

export const canvas = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xffd9e8, 60, 220);
export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
export const look = V();
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(256,256), .55, .45, .86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- cel shading: two hard tones like hand-painted anime ----
const grad = new THREE.DataTexture(new Uint8Array([150,150,150,255, 150,150,150,255, 255,255,255,255, 255,255,255,255]), 4, 1);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
export const toon = (color, o={}) => new THREE.MeshToonMaterial({color, gradientMap:grad, ...o});
export const basic = (color, o={}) => new THREE.MeshBasicMaterial({color, ...o});
export const outlineMat = new THREE.ShaderMaterial({
  uniforms:{thick:{value:.022}},
  vertexShader:'uniform float thick; void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position+normal*thick,1.0); }',
  fragmentShader:'void main(){ gl_FragColor = vec4(0.16,0.08,0.18,1.0); }',
  side:THREE.BackSide
});
export function part(geo, mat, parent, p=[0,0,0], s=null, r=null, outline=true){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p); if(s) m.scale.set(...s); if(r) m.rotation.set(...r);
  m.castShadow = true; parent.add(m);
  if(outline){ const o = new THREE.Mesh(geo, outlineMat); o.userData.outline = true; m.add(o); }
  return m;
}
export const flat = g => { g = g.toNonIndexed(); g.computeVertexNormals(); return g; };

function resize(){
  const w = innerWidth, h = innerHeight, a = w/h;
  renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  camera.aspect = a; camera.fov = a < .8 ? 68 : a < 1.2 ? 56 : 45; camera.updateProjectionMatrix();
  fx.width = w; fx.height = h;
}
const fx = document.getElementById('fx'), fxc = fx.getContext('2d');
addEventListener('resize', resize); resize();

// ---- sky dome with anime gradient ----
export const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{top:{value:new THREE.Color()}, mid:{value:new THREE.Color()}, bot:{value:new THREE.Color()}},
  vertexShader:'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top,mid,bot; varying vec3 p; void main(){ float h = p.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, h)) : mix(mid, bot, smoothstep(0.0, 0.2, -h)); gl_FragColor = vec4(c,1.0); }'
}));
scene.add(sky);
export const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7aa8, 1.2); scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(20,40,25); sun.castShadow = true; sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera, {left:-30,right:30,top:30,bottom:-30,near:1,far:120}); sun.shadow.bias = -.0006;
scene.add(sun); scene.add(sun.target);

// times of day: sky top, horizon, ground, fog, light colour/intensity, hemi intensity, stars
export const TOD = {
  day:    {top:0x4aa8ff, mid:0xc8ecff, bot:0xa8d8a0, fog:0xd8f0ff, sun:0xffffff, si:2.4, hi:1.25, stars:0},
  sunset: {top:0x6a4bc4, mid:0xffa27a, bot:0x7a5a8a, fog:0xffb59a, sun:0xffc08a, si:2.0, hi:1.0,  stars:.2},
  night:  {top:0x0a0f35, mid:0x2a3a7a, bot:0x101530, fog:0x1d2550, sun:0x9ab0ff, si:1.1, hi:.75, stars:1},
  dark:   {top:0x12001f, mid:0x5a1050, bot:0x14001c, fog:0x2a0830, sun:0xd08aff, si:.9,  hi:.6,  stars:.4},
  magic:  {top:0xff7eb6, mid:0xffe1f0, bot:0xb48cff, fog:0xffd1ea, sun:0xffffff, si:2.2, hi:1.4,  stars:.6},
  dawn:   {top:0x7ab8ff, mid:0xffd2a8, bot:0xc0b0d0, fog:0xffe0c8, sun:0xffe2b0, si:2.2, hi:1.15, stars:0},
};
const cA = new THREE.Color(), cB = new THREE.Color();
export const env = {from:'day', to:'day', k:1};
export function setTod(name, fromName=null){ env.from = fromName || name; env.to = name; env.k = fromName ? 0 : 1; }
const starGeo = new THREE.BufferGeometry(); { const a = []; for(let i=0;i<600;i++){ const th = rnd()*Math.PI*2, ph = rnd()*Math.PI*.42, R = 300; a.push(R*Math.sin(ph)*Math.cos(th), R*Math.cos(ph), R*Math.sin(ph)*Math.sin(th)); } starGeo.setAttribute('position', new THREE.Float32BufferAttribute(a,3)); }
export const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xffffff, size:1.6, transparent:true, fog:false, depthWrite:false})); scene.add(stars);
function mixC(key, k){ cA.setHex(TOD[env.from][key]); cB.setHex(TOD[env.to][key]); return cA.lerp(cB, k); }
export function applyTod(){
  const k = sm(env.k), F = TOD[env.from], T = TOD[env.to];
  sky.material.uniforms.top.value.copy(mixC('top',k)); sky.material.uniforms.mid.value.copy(mixC('mid',k)); sky.material.uniforms.bot.value.copy(mixC('bot',k));
  scene.fog.color.copy(mixC('fog',k)); sun.color.copy(mixC('sun',k));
  sun.intensity = lerp(F.si, T.si, k); hemi.intensity = lerp(F.hi, T.hi, k);
  stars.material.opacity = lerp(F.stars, T.stars, k);
  sky.position.copy(camera.position); stars.position.copy(camera.position);
}

// ---- sprites & particles ----
function tex(draw, s=64){ const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export const dotTex = tex((g,s) => { const r = g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); r.addColorStop(0,'#fff'); r.addColorStop(.35,'rgba(255,255,255,.55)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0,0,s,s); });
export const starTex = tex((g,s) => { g.translate(s/2,s/2); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 8; g.beginPath(); for(let i=0;i<10;i++){ const a = i*Math.PI/5 - Math.PI/2, r = i%2 ? s*.17 : s*.42; g.lineTo(Math.cos(a)*r, Math.sin(a)*r); } g.closePath(); g.fill(); });
export const petalTex = tex((g,s) => { g.translate(s/2,s/2); g.fillStyle = '#ffc4dc'; g.beginPath(); g.moveTo(0,-s*.4); g.bezierCurveTo(s*.38,-s*.3,s*.3,s*.3,0,s*.42); g.bezierCurveTo(-s*.3,s*.3,-s*.38,-s*.3,0,-s*.4); g.fill(); g.fillStyle = '#ff9cc4'; g.beginPath(); g.ellipse(0,s*.1,s*.08,s*.2,0,0,7); g.fill(); });
export const glow = (color, s, op=1, map=dotTex) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map, color, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false})); sp.scale.set(s,s,1); return sp; };

const PN = 360, parts = []; let pi = 0;
for(let i=0;i<PN;i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false})); s.visible = false; scene.add(s); parts.push({s, life:0, max:1, v:V(), g:0, size:1, spin:0}); }
export function emit(pos, color, n, spd=3, life=.8, size=.5, grav=-3, kind='dot'){
  for(let k=0;k<n;k++){
    const p = parts[pi = (pi+1)%PN], m = p.s.material;
    m.map = kind === 'star' ? starTex : kind === 'petal' ? petalTex : dotTex;
    m.blending = kind === 'petal' ? THREE.NormalBlending : THREE.AdditiveBlending; m.needsUpdate = true;
    p.s.position.copy(pos); m.color.setHex(color); p.s.visible = true;
    p.v.set(Math.random()-.5, Math.random()-.5, Math.random()-.5).normalize().multiplyScalar(spd*(.35+Math.random()*.65));
    p.life = p.max = life*(.6+Math.random()*.4); p.g = grav; p.size = size; p.spin = (Math.random()-.5)*6;
  }
}
export function clearParticles(){ for(const p of parts){ p.life = 0; p.s.visible = false; } }
function updateParticles(dt){
  for(const p of parts){
    if(p.life <= 0) continue;
    p.life -= dt; if(p.life <= 0){ p.s.visible = false; continue; }
    p.v.y += p.g*dt; p.s.position.addScaledVector(p.v, dt); p.s.material.rotation += p.spin*dt;
    const k = p.life/p.max; p.s.material.opacity = Math.min(1, k*1.5); const sc = p.size*(.5+.5*k); p.s.scale.set(sc,sc,1);
  }
}
// falling sakura petals around the camera
const petals = [];
for(let i=0;i<70;i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map:petalTex, transparent:true, depthWrite:false})); s.scale.set(.35,.35,1); s.userData = {o:V((rnd()-.5)*40, rnd()*18, (rnd()-.5)*40), sp:.6+rnd()*.8, ph:rnd()*9}; scene.add(s); petals.push(s); }
export const petalsOn = {v:true, tint:0xffffff};
function updatePetals(t){
  for(const s of petals){ s.visible = petalsOn.v; if(!s.visible) continue; const u = s.userData;
    const y = 18 - ((t*u.sp + u.ph*3) % 18);
    s.position.set(camera.position.x + u.o.x + Math.sin(t*.8+u.ph)*1.5, y, camera.position.z + u.o.z - 8);
    s.material.rotation = t*u.sp*2 + u.ph; s.material.color.setHex(petalsOn.tint); }
}
const rings = Array.from({length:6}, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.85,1,48), basic(0xffffff,{transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide})); m.visible = false; scene.add(m); return {m, t:1, dur:1, r:1}; });
let ri = 0;
export function ring(pos, color, r=6, dur=.8, flatRing=true){ const q = rings[ri = (ri+1)%rings.length]; q.m.position.copy(pos); q.m.rotation.set(flatRing ? -Math.PI/2 : 0, 0, 0); if(!flatRing) q.m.lookAt(camera.position); q.m.material.color.setHex(color); q.t = 0; q.dur = dur; q.r = r; q.m.visible = true; }
function updateRings(dt){ for(const q of rings){ if(!q.m.visible) continue; q.t += dt; const u = q.t/q.dur; if(u >= 1){ q.m.visible = false; continue; } const s = lerp(.3,q.r,eo(u)); q.m.scale.set(s,s,s); q.m.material.opacity = 1-u; } }
export function makeBeam(color, r){
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 20, 1, true), basic(color,{transparent:true, opacity:.6, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide})));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r*.4, r*.4, 1, 12, 1, true), basic(0xffffff,{transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false})));
  g.visible = false; scene.add(g); return g;
}
const UP = V(0,1,0), _d = V();
export function setBeam(b, a, c, w=1){ _d.subVectors(c,a); const len = _d.length(); b.position.copy(a).addScaledVector(_d,.5); b.scale.set(w,len,w); b.quaternion.setFromUnitVectors(UP, _d.normalize()); b.visible = true; }

// ---- 2D overlay: anime speed lines / focus lines ----
export const lines = {mode:null, color:'255,255,255', amount:0};
let lineSeed = 0;
function drawLines(t){
  const w = fx.width, h = fx.height, on = !!lines.mode && lines.amount > 0;
  if(fx.hidden === on) fx.hidden = !on;
  if(!on) return;
  fxc.clearRect(0,0,w,h);
  if(Math.floor(t*20) !== lineSeed){ lineSeed = Math.floor(t*20); }
  let s = lineSeed*977; const r = () => { s = (s*16807) % 2147483647; return s/2147483647; };
  fxc.fillStyle = `rgba(${lines.color},${.55*lines.amount})`;
  const cx = w/2, cy = h/2, R = Math.hypot(w,h)/2;
  if(lines.mode === 'focus'){
    for(let i=0;i<110;i++){ const a = r()*Math.PI*2, inner = R*(.45+r()*.25), wd = .006+r()*.012;
      fxc.beginPath(); fxc.moveTo(cx+Math.cos(a)*R*1.1, cy+Math.sin(a)*R*1.1); fxc.lineTo(cx+Math.cos(a-wd)*inner, cy+Math.sin(a-wd)*inner); fxc.lineTo(cx+Math.cos(a+wd)*R*1.1, cy+Math.sin(a+wd)*R*1.1); fxc.fill(); }
  } else {
    for(let i=0;i<60;i++){ const y = r()*h, len = w*(.2+r()*.5), x = r()*w, th = 1+r()*3; fxc.fillRect(x-len/2, y, len, th); }
  }
}
export function flash(op=1){ const f = document.getElementById('flash'); f.style.transition = 'none'; f.style.opacity = op; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; }); }

export function tick(t, dt){
  updateParticles(dt); updateRings(dt); updatePetals(t);
  if(env.k < 1) env.k = Math.min(1, env.k + dt*.4);
  applyTod(); drawLines(t);
}
