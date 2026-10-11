// Story script for 『桜花少女サクラ』 (Sakura Blossom Girl), a one-episode special in the Blender-style render.
// Cast slots reuse the engine's names: hikari = Sakura, mina = Haruka, kon = Tama (cat spirit), yomi = Fubuki (snow witch).
// Lines: [time, speaker, Japanese, Arabic, English, seconds on screen]
window.ANIME_EPISODES = function(A){
const {V, lerp, sm, eo, ei, seg, C, beasts, beams, Pose, setFace, place, camPath, call, emit, ring, flash, lines, setBeam, Sound, SPOT, THREE} = A;
const ST = SPOT.shrine, SB = [ST.x, 0, ST.z];
const sh = (dx=0,dz=0,dy=0) => [ST.x+dx, dy, ST.z+dz];
const off = (b, keys) => keys.map(([t,p,q]) => [t,[p[0]+b[0],p[1]+b[1],p[2]+b[2]],[q[0]+b[0],q[1]+b[1],q[2]+b[2]]]);
const L = (t, who, ja, ar, en, d) => [t, who, ja, ar, en, d];
function beam(name, from, to, lt, a, b, fx=0xffb7d5){ if(lt >= a && lt < b){ setBeam(beams[name], from, to, 1 + Math.sin(lt*30)*.15); if(Math.random() < .7) emit(to, fx, 3, 4, .6, .6, -2, 'petal'); } else beams[name].visible = false; }
function petalStorm(from, to, n=4){ for(let i=0;i<n;i++){ const p = from.clone().lerp(to, Math.random()).add(V((Math.random()-.5)*1.5,(Math.random()-.5)*1.5,(Math.random()-.5)*1.5)); emit(p, 0xffc4dc, 1, 3, .9, .7, -1, 'petal'); } }
function boom(p, big=false){ emit(p, 0xffc4dc, big?60:30, big?9:6, 1.2, .9, -2, 'petal'); emit(p, 0xffffff, big?40:20, big?8:5, 1, .9, -2); ring(p, 0xffd0e6, big?12:7, .9, false); flash(big?.8:.4); A.shake(big?.8:.4); Sound.impact(big); }
function dissolve(b, p, lt, t0){ const k = seg(lt, t0, t0+1.2); b.root.scale.setScalar(b.root.userData.s0*(1-k)); if(k > 0 && k < 1 && Math.random() < .7) emit(p, 0xd8f0ff, 3, 3, 1, .8, 2); b.root.visible = k < 1; }

// ice crystal that freezes Haruka (child of her body so it hides with her)
const ice = new THREE.Mesh(new THREE.IcosahedronGeometry(1,1), new THREE.MeshPhysicalMaterial({color:0xbfeaff, roughness:.08, transmission:.6, thickness:.6, transparent:true, opacity:.6, clearcoat:1}));
ice.position.y = 1.55; ice.scale.set(.85,1.7,.85); ice.visible = false; C.mina.root.add(ice);
const freeze = (on, k=1) => { ice.visible = on && k > .01; ice.scale.set(.85*k,1.7*k,.85*k); };
// glow for the shrine's sacred cherry tree
const treeGlow = A.glow(0xff9cc6, 10, .0); treeGlow.position.set(ST.x-6, 5, ST.z-1); A.scene.add(treeGlow);
const treeLight = (k) => { treeGlow.material.opacity = k*.75; treeGlow.scale.setScalar(9 + Math.sin(performance.now()/300)*.6); };
const shout = {ja:'サクラ・ブルーム・チェンジ！', ar:'تحوّل تفتّح الكرز!', en:'Sakura Bloom Change!'};

const ep = {no:1, ja:'春を呼ぶ少女', ar:'الفتاة التي تستدعي الربيع', en:'The Girl Who Calls the Spring', titleSay:'第一話、春を呼ぶ少女',
  next:{ja:'桜花少女サクラ、見てくれてありがとう！また会おうね！', ar:'شكراً لمشاهدتكم «فتاة زهر الكرز ساكورا»! إلى اللقاء!', en:'Thanks for watching Sakura Blossom Girl! See you again!'}};
ep.shots = [ A.OP(), A.TITLE(ep),
{ dur:9, stage:'street', tod:'day', mood:'daily',
  run(lt){ freeze(false); treeLight(0); const x = lerp(-8, -1, lt/9);
    const h = place('hikari', [x,0,2.4], Math.PI/2, 'walk', lt), m = place('mina', [x+.2,0,3.5], Math.PI/2, 'walk', lt);
    if(lt > 3.8){ Pose.cheer(h, lt); h.root.rotation.y = Math.PI*.15; }
    setFace(h, lt > 3.8 ? 'happy' : 'normal', 'smile'); setFace(m, 'happy', lt < 3.5 ? 'open' : 'smile');
    camPath(lt, [[0,[x+4,2.2,9],[x,2.2,3]], [9,[-1+4,2.4,8.6],[-1,2.4,3]]]); },
  lines:[L(.6,'mina','サクラ、見て！桜が満開だよ！','ساكورا، انظري! أزهار الكرز متفتحة بالكامل!','Look, Sakura! The cherry blossoms are in full bloom!',3), L(4,'hikari','本当だ！やっぱり春って大好き！','صحيح! أحبّ الربيع كثيراً!','They really are! I just love spring!',3)], ev:[] },
{ dur:10.5, stage:'street', tod:'snow', todFrom:'day', mood:'tension', snow:true,
  run(lt){ freeze(false);
    const h = place('hikari', [-1,0,2.4], Math.PI*.9, lt < 3.4 ? 'idle' : 'surprised', lt), m = place('mina', [.4,0,3], -Math.PI*.9, 'surprised', lt);
    if(lt < 3.4){ h.head.rotation.x = -.4; h.armR.rotation.set(-1,0,-.2); }
    setFace(h, 'surprised', 'o'); setFace(m, 'surprised', 'o');
    const y = place('yomi', [0, lerp(9,3.2,eo(seg(lt,2.6,4.4))), -2.5], 0, 'float', lt); y.root.visible = lt > 2.6; setFace(y, 'normal', lt > 6.4 ? 'smirk' : 'smile');
    camPath(lt, [[0,[0,1.6,9],[0,6,-6]], [3.4,[0,1.8,9.5],[0,4.6,-3]], [6.4,[0,2.2,9.5],[0,4.6,-2.5]], [6.41,[.7,5.6,1.2],[0,5.6,-2.5]], [10.5,[.6,5.7,.8],[0,5.7,-2.5]]]); },
  lines:[L(.8,'hikari','え…雪？春なのに…？','ماذا... ثلج؟ في الربيع...؟',"Huh... snow? But it's spring...?",2.6), L(3.8,'yomi','春なんて、いらないわ。','الربيع؟ لا حاجة لنا به.','Spring? Who needs it.',2.4), L(6.6,'yomi','この町を、永遠の冬に閉じ込めてあげる！','سأحبس هذه المدينة في شتاء أبدي!',"I'll lock this town in eternal winter!",3.4)],
  ev:[[2.6, () => Sound.dark()]] },
{ dur:8.5, stage:'street', tod:'snow', mood:'tension', snow:true,
  run(lt){ const y = place('yomi', [0,3.2,-2.5], 0, lt < 2.4 ? 'cast' : 'float', lt); setFace(y, 'normal', 'smirk');
    const m = place('mina', [.4,0,3], -Math.PI*.9, 'surprised', Math.min(lt, 2.2)); setFace(m, 'surprised', 'o'); freeze(lt > 2.2, eo(seg(lt,2.2,2.8)));
    const h = place('hikari', [-1,0,2.4], Math.PI*.6, lt > 2.4 ? 'shout' : 'surprised', lt); setFace(h, lt > 4.4 ? 'angry' : 'surprised', lt > 2.4 && lt < 4 ? 'shout' : 'frown');
    beam('ice', A.hand('yomi'), A.hp('mina',1.5), lt, 1, 2.2, 0xd8f0ff);
    camPath(lt, [[0,[-3,2.6,8],[0,2.6,1]], [2.4,[-2.6,2.4,7.6],[0,2,2.4]], [4.3,[-2.6,2.4,7.4],[0,2,2.4]], [4.31,[1,5.4,1],[0,5.6,-2.5]], [8.5,[.9,5.5,.6],[0,5.6,-2.5]]]); },
  lines:[L(.3,'mina','きゃっ！','كياه!','Kyah!',1), L(2.6,'hikari','ハルカ！','هاروكا!','Haruka!',1.6), L(4.4,'yomi','ふふ、春の花は、みんな凍ってしまえばいい。','هههه، فلتتجمّد كل أزهار الربيع.','Heh. Let every spring flower freeze.',3.6)],
  ev:[[1, () => Sound.beam(1.2)], [2.2, () => { Sound.impact(); emit(V(.4,1.5,3), 0xd8f0ff, 30, 4, .8, .7); }]] },
{ dur:10, stage:'street', tod:'snow', mood:'calm', snow:true,
  run(lt, dt){ treeLight(seg(lt,1,2.6)); const z = lerp(14, 2.5, sm(seg(lt,0,1.8)));
    const h = place('hikari', sh(0,z), Math.PI, lt < 1.8 ? 'run' : 'idle', lt);
    if(lt > 1.8){ h.root.rotation.y = Math.PI*1.25; h.head.rotation.x = -.25; }
    if(lt > 7.4) Pose.surprised(h, lt);
    setFace(h, lt > 7.4 ? 'surprised' : lt > 1.8 ? 'surprised' : 'angry', lt > 7.4 ? 'open' : 'o');
    if(lt > 4.6){ const k = place('kon', sh(.9,1.4), -.6, 'idle', lt); k.root.scale.setScalar(k.root.userData.s0*eo(seg(lt,4.6,5.1))); setFace(k, 'happy', 'smile'); if(lt < 5.1 && dt) emit(A.hp('kon',.8), 0xff9cc6, 4, 2, .8, .5, 0, 'petal'); }
    camPath(lt, off(SB, [[0,[0,2.5,22],[0,2,8]], [1.8,[1.6,1.9,1.2],[-6,4.6,-1]], [4.5,[1.2,2.2,.8],[-6,4.6,-1]], [4.51,[1,1.5,4.8],[.6,1.2,1.6]], [10,[.9,1.7,5],[.4,1.4,1.8]]])); },
  lines:[L(2,'hikari','神社の桜が…光ってる！','شجرة الكرز في المعبد... تتوهّج!',"The shrine's cherry tree... it's glowing!",2.8), L(5,'kon','待ってたニャ、サクラ！','كنت أنتظركِ يا ساكورا، مياو!',"I've been waiting for you, Sakura, nya!",2.4), L(7.6,'hikari','ね、猫がしゃべった！？','ق-قطة تتكلم؟!','A t-talking cat!?',2.2)],
  ev:[[1, () => Sound.chime()], [4.6, () => Sound.sparkle()]] },
{ dur:10.5, stage:'street', tod:'snow', mood:'calm', snow:true,
  run(lt, dt){ treeLight(1);
    const h = place('hikari', sh(0,2.5), -.4, lt > 6 ? 'hold' : 'idle', lt); setFace(h, lt > 7.6 ? 'angry' : 'normal', lt > 7.6 ? 'open' : 'smile');
    const k = place('kon', sh(.9,1.4), -.6, 'idle', lt); setFace(k, lt < 3.8 ? 'normal' : 'happy', 'smile');
    const u = seg(lt,4,6); A.pendant.visible = lt > 4; A.pendant.material.color.setHex(0xff9cc6); A.pendant.scale.setScalar(.8 + Math.sin(lt*8)*.12);
    A.pendant.position.copy(V(ST.x-6, 5, ST.z-1)).lerp(A.hp('hikari',1.7).add(V(.1,0,-.45)), sm(u));
    if(lt > 4 && lt < 6 && dt) emit(A.pendant.position, 0xffc4dc, 2, 1, .8, .5, 0, 'petal');
    camPath(lt, off(SB, [[0,[1.2,1.4,4.2],[.9,1.3,1.4]], [3.8,[1.1,1.5,4],[.9,1.3,1.4]], [3.81,[1.4,2,1.2],[-6,4.6,-1]], [6.2,[1,2.6,5.8],[0,1.8,2.5]], [6.21,[-.8,2.6,5.4],[.1,2.2,2.2]], [10.5,[-.6,2.6,4.9],[.1,2.3,2.3]]])); },
  lines:[L(.3,'kon','ボクはタマ。桜の木を守る精霊だニャ。','أنا تاما، روح تحرس شجرة الكرز، مياو.',"I'm Tama, a spirit who guards the cherry tree, nya.",3.4), L(4,'kon','桜の木が、君に春の力を貸してくれるニャ！','شجرة الكرز ستمنحكِ قوة الربيع!','The cherry tree will lend you the power of spring, nya!',3.5), L(7.8,'hikari','ハルカを助けられるなら…やる！','إن كان بإمكاني إنقاذ هاروكا... سأفعلها!',"If it means saving Haruka... I'll do it!",2.6)],
  ev:[[4, () => Sound.shine()]] },
A.TRANSFORM(shout, 'heroPose'),
{ dur:12, stage:'street', tod:'snow', mood:'battle', outfit:'hero', snow:true,
  enter(){ beasts[0].root.userData.s0 = 1; },
  run(lt, dt){ treeLight(0); const b = beasts[0]; b.root.visible = lt < 11;
    const charge = seg(lt,3.6,5.0); b.root.position.set(0, 0, lerp(-1.5, 3, ei(charge))); b.root.rotation.y = 0;
    const jump = seg(lt,4.4,7.8), hy = Math.sin(Math.min(1,jump*1.6)*Math.PI/2)*5*(1 - seg(lt,9.6,10.6));
    const h = place('hikari', [-2.5, hy, 4.5], Math.PI*.85, 'heroPose', lt);
    if(lt > 4.4 && lt < 7.4) Pose.hover(h, lt); if(lt >= 7.4 && lt < 9.6){ Pose.cast(h, lt); h.root.rotation.y = Math.PI*.9; h.rig.rotation.x = .35; }
    setFace(h, lt > 9.8 ? 'happy' : lt > 7.4 ? 'angry' : 'normal', lt > 7.4 && lt < 9.6 ? 'shout' : 'smile');
    const k = place('kon', [-5, 0, 6], Math.PI*.8, 'idle', lt); setFace(k, lt > 10 ? 'happy' : 'normal', lt > 10 ? 'open' : 'smile');
    beam('star', A.wandTip(), A.hp(b, 1.2), lt, 8.2, 9.5); if(lt > 8.2 && lt < 9.5 && dt) petalStorm(A.wandTip(), A.hp(b,1.2), 5);
    if(lt > 9.5) dissolve(b, A.hp(b, 1.2), lt, 9.5);
    call(lt > 7.6 && lt < 9.8 ? 'さくら吹雪アタック！' : '');
    lines.mode = lt > 4.4 && lt < 5.4 ? 'speed' : lt > 8.2 && lt < 9.5 ? 'focus' : null; lines.color = '255,255,255'; lines.amount = 1;
    camPath(lt, [[0,[-2.2,2.6,8.5],[-2.5,2.4,4.5]], [3.4,[-1.6,2.4,7.8],[-2.5,2.4,4.5]], [3.6,[6,2.5,9],[-1,2,2]], [5,[7,3.5,10],[-1,3,2]], [7.4,[-6,5,11],[-1,4,1]], [8.2,[-5,3.5,10],[-1,2.5,0]], [9.6,[-4,3,11],[-1,2,1]], [12,[-3.6,2.5,9],[-2.5,2,4.5]]]); },
  lines:[L(.3,'hikari','春の戦士、桜花少女サクラ、参上！','محاربة الربيع، فتاة زهر الكرز ساكورا، حاضرة!','Warrior of spring, Sakura Blossom Girl, is here!',3.3), L(7.6,'hikari','さくら吹雪アタック！','هجوم عاصفة الكرز!','Sakura Blizzard Attack!',1.9), L(10.3,'kon','やったニャ！','نجحتِ، مياو!','You did it, nya!',1.5)],
  ev:[[3.6, () => Sound.growl()], [4.4, () => Sound.whoosh()], [5, () => { A.shake(.6); Sound.impact(); ring(V(0,.2,3),0x9ad8ff,6); }], [8.2, () => Sound.beam(1.3)], [9.5, () => boom(A.hp(beasts[0],1.2), true)]] },
{ dur:12, stage:'street', tod:'snow', mood:'battle', outfit:'hero', snow:true,
  run(lt){ const y = place('yomi', [0,3,-3], 0, lt > 3.4 && lt < 5 ? 'cast' : 'float', lt); setFace(y, 'angry', lt < 3 ? 'open' : 'smirk');
    const hit = seg(lt,4.8,5.4); const h = place('hikari', [0,0,2.5+eo(hit)*1.8], Math.PI, lt < 4.8 ? 'heroPose' : lt < 6 ? 'hurt' : 'kneel', lt);
    setFace(h, lt < 4.8 ? 'angry' : lt < 8 ? 'sad' : 'angry', lt > 8.2 ? 'open' : 'frown');
    const k = place('kon', [-1.6,0,5.4], Math.PI*.9, 'idle', lt); setFace(k, lt > 6.2 ? 'surprised' : 'normal', lt > 6.2 && lt < 7.6 ? 'open' : 'smile');
    beam('ice', A.hand('yomi'), A.hp('hikari',1.5), lt, 3.6, 5, 0xd8f0ff);
    lines.mode = lt > 4.8 && lt < 5.4 ? 'focus' : null; lines.color = '160,220,255'; lines.amount = 1;
    camPath(lt, [[0,[.9,5.6,0],[0,5.6,-3]], [3.3,[.8,5.6,-.4],[0,5.6,-3]], [3.31,[5,3,8],[0,2.6,0]], [5.4,[4.5,2.8,9],[0,2,2.5]], [6.2,[1.8,1.8,8.6],[0,1.4,4.3]], [8.1,[1.6,1.8,8.4],[0,1.4,4.3]], [8.11,[-.6,1.6,6.6],[0,1.6,4.3]], [12,[-.5,1.7,6.3],[0,1.7,4.3]]]); },
  lines:[L(.4,'yomi','その程度の花びらで、私の氷は溶けないわ！','بتلات كهذه لن تُذيب جليدي!',"Petals like that won't melt my ice!",3), L(6.4,'kon','サクラ！','ساكورا!','Sakura!',1.4), L(8.2,'hikari','ハルカと見る春を…あきらめない！','لن أتخلّى... عن الربيع الذي سأراه مع هاروكا!',"I won't give up... on the spring I'll see with Haruka!",3.6)],
  ev:[[3.6, () => Sound.beam(1.4)], [4.9, () => { Sound.impact(true); A.shake(.9); flash(.4); }]] },
{ dur:10.5, stage:'street', tod:'snow', mood:'transform', outfit:'hero', snow:true, petals:0xffc4dc,
  run(lt, dt){ const up = sm(seg(lt,.4,2.4));
    const h = place('hikari', [0, up*1.5, 4.3 - up*1.5], Math.PI, lt < .4 ? 'kneel' : lt < 3 ? 'wandUp' : 'cast', lt); setFace(h, 'angry', lt > 3 && lt < 5.6 ? 'shout' : 'frown');
    if(lt > .4 && lt < 3 && dt) emit(A.hp('hikari', 2).add(V((Math.random()-.5)*3, Math.random()*2, (Math.random()-.5)*3)), 0xffc4dc, 2, 1.5, 1, .7, 1, 'petal');
    const blown = seg(lt,7.4,8.6); const y = place('yomi', [0, 3 + blown*4, -3 - blown*10], 0, lt > 7.4 ? 'hurt' : 'float', lt); setFace(y, lt > 5 ? 'surprised' : 'angry', lt > 7.4 ? 'shout' : 'frown'); y.root.visible = lt < 9.4;
    beam('star', A.wandTip(), A.hp('yomi',2), lt, 3.6, 7.6); if(lt > 3.6 && lt < 7.6 && dt) petalStorm(A.wandTip(), A.hp('yomi',2), 8);
    call(lt > 3 && lt < 6.2 ? '満開・桜光斬！' : '');
    lines.mode = lt > 3.6 && lt < 7.6 ? 'focus' : null; lines.color = '255,200,225'; lines.amount = 1;
    camPath(lt, [[0,[-.6,1.6,7.2],[0,1.6,4.3]], [2.4,[-2,3,8],[0,3,2]], [3.6,[-4,3.6,9],[0,3.4,0]], [7.4,[6,4,6],[0,3.4,-1]], [9,[0,4,10],[0,5,-6]], [10.5,[0,3.4,9.5],[0,4,-4]]]); },
  lines:[L(.4,'hikari','桜よ、力を貸して！','يا زهر الكرز، امنحني قوتك!','Cherry blossoms, lend me your power!',2.4), L(3.2,'hikari','満開・桜光斬！','تفتّح كامل: ضربة نور الكرز!','Full Bloom: Sakura Light Slash!',2.4), L(7.9,'yomi','きゃあああっ！','كياااه!','Kyaaah!',1.6)],
  ev:[[.4, () => Sound.shine()], [3.6, () => Sound.beam(4)], [7.6, () => boom(V(0,5,-3), true)]] },
{ dur:9, stage:'street', tod:'day', todFrom:'snow', mood:'ed',
  run(lt, dt){ const y = place('yomi', [0,6,-10], 0, 'float', lt); setFace(y, 'angry', 'frown'); y.root.visible = lt < 3.2; if(lt > 2.4 && lt < 3.2 && dt) emit(A.hp('yomi',1.6), 0xd8f0ff, 6, 3, 1, .9, 1);
    const m = place('mina', [.4,0,3], -Math.PI*.9, lt < 4 ? 'surprised' : 'idle', lt < 4 ? 2.2 : lt); freeze(lt < 4.6, 1 - seg(lt,3.4,4.6)); setFace(m, lt < 4.6 ? 'surprised' : 'normal', lt > 5 ? 'open' : 'o');
    if(lt > 3.4 && lt < 4.6 && dt) emit(A.hp('mina',1.5), 0xd8f0ff, 3, 3, .8, .6, -3);
    const h = place('hikari', [-1,0,2.4], -Math.PI*.3, 'idle', lt); setFace(h, 'happy', 'smile');
    camPath(lt, [[0,[1.6,6.4,-4],[0,6.6,-10]], [3.2,[1.4,6.4,-4.4],[0,6.6,-10]], [3.21,[-2.6,2.4,8],[0,1.8,2.8]], [9,[-2.2,2.5,7.4],[0,2,2.8]]]); },
  lines:[L(.4,'yomi','この冬は…まだ終わらないわ…！',"هذا الشتاء... لم ينتهِ بعد...!","This winter... isn't over yet...!",2.8), L(5.2,'mina','あれ…雪は？','هاه... أين الثلج؟','Huh... where did the snow go?',2)], ev:[[3.4, () => Sound.chime()]] },
{ dur:9.5, stage:'street', tod:'day', mood:'ed',
  run(lt){ freeze(false); const h = place('hikari', [-.6,0,2.4], .4, lt > 5.6 ? 'peace' : 'idle', lt), m = place('mina', [.7,0,2.4], -.4, lt > 2.8 && lt < 5.6 ? 'cheer' : 'idle', lt);
    setFace(h, 'happy', 'smile'); setFace(m, 'happy', 'smile');
    const k = place('kon', [0,0,3.3], 0, 'idle', lt); setFace(k, 'happy', 'smile');
    camPath(lt, [[0,[0,2.3,7],[0,2.1,2.4]], [9.5,[0,2.5,6.2],[0,2.2,2.4]]]); },
  lines:[L(.4,'hikari','もう春だよ、ハルカ！',"لقد عاد الربيع يا هاروكا!","It's spring again, Haruka!",2.3), L(3,'mina','うん！一緒にお花見しよう！','نعم! لنتأمّل أزهار الكرز معاً!',"Yeah! Let's go flower-viewing together!",2.8), L(6.2,'kon','一件落着だニャ！','انتهى كل شيء على خير، مياو!',"All's well that ends well, nya!",2.2)], ev:[] },
A.NEXT(ep, true) ];
return [ep];
};
