// Sets: Japanese town street, school rooftop, shrine, Mt. Fuji backdrop, and Yomi's shadow realm.
import { THREE, V, part, toon, basic, flat, glow, scene, rnd } from './engine.js';

const town = new THREE.Group(), realm = new THREE.Group(), far = new THREE.Group();
scene.add(town, realm, far);
export const SPOT = {street:V(0,0,0), roof:V(-34,9,-14), shrine:V(30,0,-34), realm:V(0,0,0)};

function box(w,h,d,mat,parent,p,r=null,shadow=true){ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(...p); if(r) m.rotation.set(...r); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
const winMat = basic(0xbfe6ff), winNight = 0xffd88a, winDay = 0xbfe6ff;
export function setNight(on){ winMat.color.setHex(on ? winNight : winDay); vend.material.color.setHex(on ? 0xffffff : 0xe8f4ff); }

// ground & road
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500,500), toon(0x9ccf8a)); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; town.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(220,8), toon(0x6a6f86)); road.rotation.x = -Math.PI/2; road.position.y = .02; road.receiveShadow = true; town.add(road);
for(let x=-100;x<100;x+=6){ const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4,.18), basic(0xf4f4f4)); d.rotation.x = -Math.PI/2; d.position.set(x,.03,0); town.add(d); }
for(const z of [-5.2,5.2]){ const s = new THREE.Mesh(new THREE.PlaneGeometry(220,2.4), toon(0xd8d0c8)); s.rotation.x = -Math.PI/2; s.position.set(0,.04,z); s.receiveShadow = true; town.add(s); }

// houses
const walls = [0xfff4e4,0xf6e8ff,0xe8f6ff,0xfff0f0,0xf0ffe8], roofs = [0x3a4a7a,0x8a3a3a,0x3a6a5a,0x5a4a6a,0x2f3550];
function house(x, z, rot){
  const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = rot; town.add(g);
  const w = 5+rnd()*2.5, h = 3.6+rnd()*2.4, d = 5+rnd()*2;
  box(w,h,d,toon(walls[Math.floor(rnd()*5)]),g,[0,h/2,0]);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.78, 2.2, 4), toon(roofs[Math.floor(rnd()*5)])); roof.position.y = h+1.1; roof.rotation.y = Math.PI/4; roof.scale.set(w/Math.max(w,d)*1.05,1,d/Math.max(w,d)*1.05); roof.castShadow = true; g.add(roof);
  for(const wx of [-w/4, w/4]){ const win = new THREE.Mesh(new THREE.PlaneGeometry(1,.9), winMat); win.position.set(wx, h*.6, d/2+.01); g.add(win); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1,1.8), toon(0x7a5a3a)); door.position.set(0,.9,d/2+.01); g.add(door);
}
for(let x=-80;x<80;x+=9){ if(Math.abs(x-30)<9 || Math.abs(x+34)<20) { } else house(x+rnd()*2, -11-rnd()*2, 0); house(x+rnd()*2, 11+rnd()*2, Math.PI); }

// sakura trees
const trunkM = toon(0x6a4230), pinks = [toon(0xffb7d5), toon(0xff9cc6), toon(0xffc9e0)];
export function sakura(parent, x, z, s=1){
  const g = new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s); parent.add(g);
  part(new THREE.CylinderGeometry(.25,.4,3,8), trunkM, g, [0,1.5,0]);
  part(new THREE.CylinderGeometry(.12,.18,1.6,6), trunkM, g, [.6,3.1,0], null, [0,0,-.6]);
  for(let i=0;i<6;i++){ const a = i/6*Math.PI*2; part(new THREE.SphereGeometry(1.2+rnd()*.5,14,10), pinks[i%3], g, [Math.cos(a)*1.3, 3.8+rnd()*1.2, Math.sin(a)*1.3]); }
  part(new THREE.SphereGeometry(1.6,16,12), pinks[0], g, [0,4.9,0]);
  return g;
}
for(let x=-70;x<70;x+=14) for(const z of [-7.2,7.2]) if(Math.abs(x)>3) sakura(town, x+(z>0?5:0), z, .9);

// electric poles & wires (very Japanese street)
const poleM = toon(0x8a8a92), poles = [];
for(let x=-84;x<=84;x+=12){ const p = part(new THREE.CylinderGeometry(.13,.16,8,8), poleM, town, [x,4,-6.6]); box(1.6,.12,.12,poleM,town,[x,7.4,-6.6]); poles.push(x); }
const wireM = new THREE.LineBasicMaterial({color:0x2a2a35});
for(const dz of [-.7,0,.7]){ const pts = []; for(let i=0;i<poles.length-1;i++){ for(let k=0;k<=8;k++){ const u = k/8, x = poles[i]+(poles[i+1]-poles[i])*u; pts.push(V(x, 7.4 - Math.sin(u*Math.PI)*.6, -6.6+dz*.0+dz)); } } town.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM)); }
// vending machine
const vend = box(1.2,2,1,basic(0xe8f4ff),town,[6,1,-6.4]);
box(1.3,2.1,1.05,toon(0xd8303a),town,[6,1.05,-6.55]);
const vg = glow(0xbfe6ff, 3, .35); vg.position.set(6,1.2,-5.7); town.add(vg);

// school with rooftop
{
  const sx = SPOT.roof.x, sz = SPOT.roof.z - 2;
  box(34,9,10,toon(0xfff6ea),town,[sx,4.5,sz]);
  for(let i=0;i<10;i++) for(let j=0;j<2;j++){ const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.6), winMat); w.position.set(sx-14+i*3.1, 2.3+j*3.6, sz+5.01); town.add(w); }
  const clock = new THREE.Mesh(new THREE.CircleGeometry(1,32), basic(0xffffff)); clock.position.set(sx,7.6,sz+5.02); town.add(clock);
  const hand = box(.08,.7,.02,basic(0x222222),town,[sx,7.85,sz+5.04],null,false);
  box(34.4,.4,10.4,toon(0xd8d0c8),town,[sx,9.1,sz]);
  const fenceM = toon(0x6aa88a);
  for(let i=0;i<=24;i++){ const x = sx-17+i*34/24; for(const z of [sz-5,sz+5]) box(.08,1.4,.08,fenceM,town,[x,9.9,z],null,false); }
  for(const z of [sz-5,sz+5]) box(34,.1,.1,fenceM,town,[sx,10.55,z],null,false);
  for(const x of [sx-17,sx+17]) box(.1,.1,10,fenceM,town,[x,10.55,sz],null,false);
  part(new THREE.CylinderGeometry(1.2,1.2,2,16), toon(0xc8d8e8), town, [sx+12,10.3,sz-2]);
}
// shrine: torii path, hall, stone lanterns
{
  const {x:cx, z:cz} = SPOT.shrine, red = toon(0xe0402a), blk = toon(0x2a2020);
  for(let i=0;i<4;i++){ const z = cz+10-i*3.2, g = new THREE.Group(); g.position.set(cx,0,z); town.add(g);
    for(const s of [1,-1]) part(new THREE.CylinderGeometry(.22,.26,5,12), red, g, [1.9*s,2.5,0]);
    box(5.2,.3,.4,red,g,[0,4.2,0]); const top = box(6,.35,.55,blk,g,[0,5.0,0]); box(4.6,.3,.35,red,g,[0,4.65,0]);
  }
  const hall = new THREE.Group(); hall.position.set(cx,0,cz-6); town.add(hall);
  box(8,.8,6,toon(0xb8a890),hall,[0,.4,0]); box(6.4,3.2,4.6,toon(0x8a3a2a),hall,[0,2.4,0]);
  const r = new THREE.Mesh(new THREE.ConeGeometry(6.2,2.6,4), toon(0x3a3a4a)); r.rotation.y = Math.PI/4; r.position.y = 5.2; r.scale.set(1.1,1,.85); r.castShadow = true; hall.add(r);
  part(new THREE.TorusGeometry(1.6,.12,8,24,Math.PI), toon(0xe8d8a8), hall, [0,3.6,2.35], null, [0,0,Math.PI]);
  for(const s of [1,-1]) for(const dz of [4,9]){ const l = new THREE.Group(); l.position.set(cx+3.2*s,0,cz+dz); town.add(l);
    part(new THREE.CylinderGeometry(.25,.35,1.2,6), toon(0xb0aca4), l, [0,.6,0]); part(new THREE.BoxGeometry(.8,.7,.8), toon(0xc8c4bc), l, [0,1.5,0]);
    const lg = glow(0xffc070, 1.6, .7); lg.position.y = 1.5; l.add(lg); part(new THREE.ConeGeometry(.7,.6,4), toon(0x9a968e), l, [0,2.1,0], null, [0,Math.PI/4,0]); }
  sakura(town, cx-6, cz-1, 1.2); sakura(town, cx+6.5, cz+1, 1.1);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(10,24), toon(0xd8ccb0)); gp.rotation.x = -Math.PI/2; gp.position.set(cx,.03,cz+3); gp.receiveShadow = true; town.add(gp);
}
export const cloudM = basic(0xffffff,{fog:false});
// far backdrop: Mt. Fuji, clouds, moon
{
  const fuji = new THREE.Mesh(new THREE.ConeGeometry(110,80,48,1,true), basic(0x6a7ab8,{fog:false})); fuji.position.set(-20,32,-300); far.add(fuji);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(38,27.6,48), basic(0xffffff,{fog:false})); cap.position.set(-20,58.2,-299); far.add(cap);
  for(const s of [-1,1]){ const hill = new THREE.Mesh(new THREE.SphereGeometry(70,24,12,0,Math.PI*2,0,Math.PI/2), basic(0x7aa890,{fog:false})); hill.scale.y = .25; hill.position.set(s*110,-2,-230); far.add(hill); }
  cloudM.transparent = true; cloudM.opacity = .92;
  for(let i=0;i<9;i++){ const g = new THREE.Group(); const a = -1.2 + i*.3; g.position.set(Math.sin(a)*240, 70+rnd()*40, -Math.cos(a)*240); far.add(g); for(let k=0;k<5;k++){ const s = new THREE.Mesh(new THREE.SphereGeometry(8+rnd()*8,14,10), cloudM); s.position.set((k-2)*9, rnd()*4, rnd()*4); g.add(s); } g.lookAt(0,g.position.y,0); }
}
export const moon = new THREE.Mesh(new THREE.SphereGeometry(16,32,16), basic(0xfff4d0,{fog:false})); moon.position.set(90,110,-260); far.add(moon);
const mg = glow(0xfff0c8, 90, .4); mg.material.fog = false; moon.add(mg);
export const realmMoon = new THREE.Mesh(new THREE.SphereGeometry(30,32,16), basic(0xff3a5a,{fog:false})); realmMoon.position.set(-40,120,-260); realm.add(realmMoon);
const rmg = glow(0xff3a5a, 160, .45); rmg.material.fog = false; realmMoon.add(rmg);

// shadow realm
export const realmRocks = [];
{
  const g = new THREE.Mesh(new THREE.CircleGeometry(60,64), toon(0x2a1240)); g.rotation.x = -Math.PI/2; g.receiveShadow = true; realm.add(g);
  const rune = new THREE.Mesh(new THREE.RingGeometry(7,7.4,64), basic(0xb06bff,{transparent:true, opacity:.8})); rune.rotation.x = -Math.PI/2; rune.position.y = .03; realm.add(rune);
  const rockM = toon(0x3a1a56), crys = basic(0xc08aff);
  for(let i=0;i<26;i++){ const a = rnd()*Math.PI*2, r = 14+rnd()*40; const rock = part(new THREE.DodecahedronGeometry(1+rnd()*3,0), rockM, realm, [Math.cos(a)*r, 3+rnd()*22, Math.sin(a)*r-10]); rock.userData.f = rnd()*6; realmRocks.push(rock); }
  for(let i=0;i<14;i++){ const a = rnd()*Math.PI*2, r = 10+rnd()*20; const c = new THREE.Mesh(new THREE.OctahedronGeometry(.6+rnd(),0), crys); c.scale.y = 2.5; c.position.set(Math.cos(a)*r, 1.2, Math.sin(a)*r - 6); realm.add(c); const cg = glow(0xb06bff, 3, .5); cg.position.copy(c.position); realm.add(cg); }
}
// the dark star (Yomi's heart) for the finale
export const darkStar = new THREE.Group();
{ const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1), toon(0x1a0828)); darkStar.add(core); const g = glow(0x9a3cff, 8, .7); darkStar.add(g); darkStar.userData.core = core; darkStar.userData.glow = g; darkStar.position.set(0,9,-10); realm.add(darkStar); }


export function setStage(name){
  town.visible = far.visible = name !== 'realm' && name !== 'void';
  realm.visible = name === 'realm';
  moon.visible = name !== 'realm';
}
export function tickWorld(t){ for(const r of realmRocks){ r.position.y += Math.sin(t*.8 + r.userData.f)*.004; r.rotation.y += .002; } darkStar.rotation.y = t*.4; }
