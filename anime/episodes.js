// Story script for 『星光少女ヒカリ』 (Starlight Girl Hikari), 5 episodes.
// Lines: [time, speaker, Japanese, Arabic, English, seconds on screen]
window.ANIME_EPISODES = function(A){
const {V, lerp, sm, eo, ei, seg, C, beasts, beams, Pose, setFace, place, camPath, call, emit, ring, flash, lines, setBeam, Sound, SPOT} = A;
const R = SPOT.roof, ST = SPOT.shrine;
const rf = (dx=0,dz=0,dy=0) => [R.x+dx, R.y+.3+dy, R.z+dz];
const sh = (dx=0,dz=0,dy=0) => [ST.x+dx, dy, ST.z+dz];
const off = (b, keys) => keys.map(([t,p,q]) => [t,[p[0]+b[0],p[1]+b[1],p[2]+b[2]],[q[0]+b[0],q[1]+b[1],q[2]+b[2]]]);
const RB = [R.x, R.y+.3, R.z], SB = [ST.x, 0, ST.z], O = [0,0,0];
const L = (t, who, ja, ar, en, d) => [t, who, ja, ar, en, d];
function beam(name, from, to, lt, a, b){ if(lt >= a && lt < b){ setBeam(beams[name], from, to, 1 + Math.sin(lt*30)*.15); if(Math.random() < .6) emit(to, 0xffd75e, 3, 4, .5, .6, -2, 'star'); } else beams[name].visible = false; }
function boom(p, big=false){ emit(p, 0xffd75e, big?60:30, big?9:6, 1, 1, -2, 'star'); emit(p, 0xff9ad0, big?50:25, big?8:5, 1, .9, -2); ring(p, 0xffffff, big?12:7, .9, false); flash(big?.9:.5); A.shake(big?.8:.4); Sound.impact(big); }
function dissolve(b, p, lt, t0){ const k = seg(lt, t0, t0+1.2); b.root.scale.setScalar(b.root.userData.s0*(1-k)); if(k > 0 && k < 1 && Math.random() < .7) emit(p, 0x9a3cff, 3, 3, 1, .8, 2); b.root.visible = k < 1; }
const shout = {ja:'スターライト・チェンジ！', ar:'تحوّل ضوء النجوم!', en:'Starlight Change!'};

/* =============== EPISODE 1 =============== */
const ep1 = {no:1, ja:'星が落ちた夜', ar:'الليلة التي سقطت فيها نجمة', en:'The Night a Star Fell', titleSay:'第一話、星が落ちた夜',
  next:{ja:'次回、星光少女ヒカリ「影の女王ヨミ」。お楽しみに！', ar:'في الحلقة القادمة: «ملكة الظلال يومي». ترقّبوها!', en:'Next time on Starlight Girl Hikari: "Yomi, Queen of Shadows." See you then!'}};
ep1.shots = [ A.OP(), A.TITLE(ep1),
{ dur:8.5, stage:'street', tod:'night', todFrom:'sunset', mood:'calm',
  run(lt){ const h = place('hikari', rf(0,3.5), Math.PI, 'idle', lt); h.head.rotation.x = -.35; setFace(h, lt > 4 ? 'sad' : 'normal', 'smile');
    if(lt > 4){ h.root.rotation.y = 0; h.head.rotation.x = .1; }
    camPath(lt, off(RB, [[0,[0,2,8],[0,7,-10]], [4,[0,2.5,7.5],[0,4,-10]], [4.01,[.5,3.2,6.2],[0,3,3.5]], [8.5,[.3,3.1,5.4],[0,3,3.5]]])); },
  lines:[L(.8,'hikari','今日も普通の一日だったなあ…','كان يوماً عادياً آخر...','Just another ordinary day...',3), L(4.3,'hikari','私も、何か特別なことができたらいいのに。','ليتني أستطيع فعل شيء مميز أنا أيضاً.','I wish I could do something special too.',3.8)], ev:[] },
{ dur:6.5, stage:'street', tod:'night', mood:'calm',
  run(lt, dt){ const h = place('hikari', rf(0,3.5), Math.PI, lt < 1.4 ? 'idle' : 'surprised', lt); setFace(h, lt < 1.4 ? 'normal' : 'surprised', lt < 1.4 ? 'smile' : 'o');
    const u = seg(lt, .8, 4.6), p = V(lerp(R.x+60, ST.x, u), lerp(R.y+50, 2, ei(u)), lerp(R.z-80, ST.z-4, u));
    if(lt > .8 && lt < 4.6){ A.pendant.visible = true; A.pendant.position.copy(p); A.pendant.scale.setScalar(3); if(dt) emit(p, 0xffe08a, 4, 1, 1.2, 1.4, 0, 'star'); } else A.pendant.visible = false;
    camPath(lt, off(RB, [[0,[0,2.4,7],[0,3,3.5]], [1.4,[1.5,2,8],[10,14,-30]], [6.5,[1.5,2,8],[40,4,-30]]])); },
  lines:[L(1.6,'hikari','あっ、流れ星！','آه، نجمة تهوي!','Ah, a shooting star!',2), L(3.9,'hikari','神社の方に落ちた！？','سقطت نحو المعبد؟!','It fell toward the shrine!?',2.4)],
  ev:[[.8, () => Sound.shine()], [4.6, () => { flash(.6); Sound.impact(); }]] },
{ dur:9.5, stage:'street', tod:'night', mood:'calm',
  run(lt, dt){ const z = lerp(14, 2.5, sm(seg(lt,0,1.8))), h = place('hikari', sh(0,z), Math.PI, lt < 1.8 ? 'run' : 'idle', lt);
    if(lt > 1.8 && lt < 4.4){ Pose.hold(h, lt); h.head.rotation.x = .3; }
    if(lt > 6.6) Pose.surprised(h, lt);
    setFace(h, lt > 6.6 ? 'surprised' : 'normal', lt > 6.6 ? 'open' : 'o');
    A.pendant.visible = lt > 1.8; A.pendant.scale.setScalar(.9 + Math.sin(lt*6)*.15); A.pendant.position.copy(A.hp('hikari', 1.6)).add(V(0,0,-.5));
    if(lt > 4.3){ const k = place('kon', sh(.9, 1.5), -.6, 'idle', lt); k.root.scale.setScalar(k.root.userData.s0*eo(seg(lt,4.3,4.8))); setFace(k, 'happy', 'smile'); if(lt < 4.8 && dt) emit(A.hp('kon',.8), 0xffd75e, 4, 2, .8, .5, 0, 'star'); }
    camPath(lt, off(SB, [[0,[0,2.5,22],[0,2,8]], [1.8,[2.5,2.4,7],[0,1.8,2.5]], [4.3,[2,2.6,6.5],[.4,1.6,2]], [9.5,[1.5,2.8,6.8],[.4,1.8,2]]])); },
  lines:[L(2,'hikari','光ってる…これは何？','إنها تلمع... ما هذا؟',"It's glowing... what is this?",2.6), L(4.8,'kon','やっと見つけたコン！','أخيراً وجدتُكِ كون!','Finally found you, kon!',2.2), L(7,'hikari','き、キツネがしゃべった！？','ث-ثعلب يتكلم؟!','A t-talking fox!?',2.4)],
  ev:[[4.3, () => Sound.sparkle()]] },
{ dur:9.5, stage:'street', tod:'night', mood:'calm',
  run(lt){ const h = place('hikari', sh(0,2.5), -.4, 'idle', lt); setFace(h, lt > 7.3 ? 'surprised' : 'normal', 'smile'); if(lt > 7.3) Pose.hold(h, lt);
    const k = place('kon', sh(.9,1.5), -.6, 'idle', lt); setFace(k, lt < 4 ? 'normal' : 'happy', 'smile');
    camPath(lt, off(SB, [[0,[1.6,1.6,4],[.9,1.6,1.5]], [4,[1.4,1.7,3.8],[.9,1.6,1.5]], [4.01,[-.8,2.6,5.2],[.4,2,1.8]], [9.5,[-.6,2.7,4.8],[.3,2.2,2]]])); },
  lines:[L(.3,'kon','ボクはコン。星の国から来た使者だコン。','أنا كون، رسول من مملكة النجوم.',"I'm Kon, a messenger from the Star Kingdom.",3.8), L(4.4,'kon','そのペンダントは、君を選んだんだコン！','تلك القلادة اختارتكِ أنتِ!','That pendant chose you!',3), L(7.6,'hikari','私を…？','اختارتني أنا...؟','Chose me...?',1.8)], ev:[] },
{ dur:9, stage:'street', tod:'night', mood:'tension',
  enter(){ beasts[0].root.userData.s0 = 1; },
  run(lt){ const b = beasts[0]; b.root.visible = true; b.root.position.set(0, lerp(-3,0,eo(seg(lt,0,1.6))), -1.5); b.root.rotation.y = 0;
    const h = place('hikari', [lerp(-9,-2.5,sm(seg(lt,2.8,4.2))),0,4], lt < 4.2 ? Math.PI/2 : Math.PI*.85, lt < 4.2 ? 'run' : 'idle', lt); setFace(h, 'angry', lt > 4.4 && lt < 6.6 ? 'open' : 'frown');
    const k = place('kon', [h.root.position.x+.9, 0, 4.4], Math.PI*.85, 'idle', lt); setFace(k, 'surprised', 'o');
    lines.mode = lt < 1.6 ? 'focus' : null; lines.color = '120,40,160'; lines.amount = 1;
    camPath(lt, [[0,[0,2,9],[0,2.2,-1.5]], [2.8,[0,2.6,10],[0,2.2,-1.5]], [2.81,[-1.5,2.2,8.5],[-2.5,2,4]], [9,[-1,2.4,8],[-1.5,2.1,2]]]); },
  lines:[L(.8,'kon','影獣だコン！ヨミの手下だコン！','إنه وحش الظلال! من أتباع يومي!',"A shadow beast! One of Yomi's minions!",3), L(4.4,'hikari','街のみんなが危ない！','أهل المدينة في خطر!','Everyone in town is in danger!',2.2), L(6.8,'kon','ペンダントを握って叫ぶんだコン！','أمسكي القلادة واصرخي!','Hold the pendant and shout!',2.2)],
  ev:[[.1, () => Sound.growl()]] },
A.TRANSFORM(shout, 'heroPose'),
{ dur:12, stage:'street', tod:'night', mood:'battle', outfit:'hero',
  enter(){ beasts[0].root.userData.s0 = 1; },
  run(lt, dt){ const b = beasts[0]; b.root.visible = lt < 11;
    const charge = seg(lt,3.6,5.0); b.root.position.set(0, 0, lerp(-1.5, 3, ei(charge))); b.root.rotation.y = 0;
    const jump = seg(lt,4.4,7.8), hx = -2.5, hy = Math.sin(Math.min(1,jump*1.6)*Math.PI/2)*5*(1 - seg(lt,9.6,10.6));
    const h = place('hikari', [hx, hy, 4.5], Math.PI*.85, 'heroPose', lt);
    if(lt > 4.4 && lt < 7.4) Pose.hover(h, lt); if(lt >= 7.4 && lt < 9.6){ Pose.cast(h, lt); h.root.rotation.y = Math.PI*.9; h.rig.rotation.x = .35; }
    setFace(h, lt > 9.8 ? 'happy' : lt > 7.4 ? 'angry' : 'normal', lt > 7.4 && lt < 9.6 ? 'shout' : 'smile');
    place('kon', [-5, 0, 6], Math.PI*.8, 'idle', lt);
    beam('star', A.wandTip(), A.hp(b, 1.2), lt, 8.2, 9.5);
    if(lt > 9.5) dissolve(b, A.hp(b, 1.2), lt, 9.5);
    call(lt > 7.6 && lt < 9.8 ? 'スターライト・アロー！' : '');
    lines.mode = lt > 4.4 && lt < 5.4 ? 'speed' : lt > 8.2 && lt < 9.5 ? 'focus' : null; lines.color = '255,255,255'; lines.amount = 1;
    camPath(lt, [[0,[-2.2,2.6,8.5],[-2.5,2.4,4.5]], [3.4,[-1.6,2.4,7.8],[-2.5,2.4,4.5]], [3.6,[6,2.5,9],[-1,2,2]], [5,[7,3.5,10],[-1,3,2]], [7.4,[-6,5,11],[-1,4,1]], [8.2,[-5,3.5,10],[-1,2.5,0]], [9.6,[-4,3,11],[-1,2,1]], [12,[-3.6,2.5,9],[-2.5,2,4.5]]]); },
  lines:[L(.3,'hikari','光の戦士、星光少女ヒカリ、参上！','محاربة النور، فتاة ضوء النجوم هيكاري، حاضرة!','Warrior of light, Starlight Girl Hikari, is here!',3.3), L(6.6,'kon','今だコン！','الآن!','Now, kon!',1), L(7.6,'hikari','スターライト・アロー！','سهم ضوء النجوم!','Starlight Arrow!',1.8), L(10.4,'hikari','やった…！','نجحت...!','I did it...!',1.6)],
  ev:[[3.6, () => Sound.growl()], [4.4, () => Sound.whoosh()], [5, () => { A.shake(.6); Sound.impact(); ring(V(0,.2,3),0xb06bff,6); }], [8.2, () => Sound.beam(1.3)], [9.5, () => boom(A.hp(beasts[0],1.2), true)]] },
{ dur:7, stage:'street', tod:'night', mood:'tension',
  run(lt){ const y = place('yomi', [14, 8.2, -6], -.7, 'float', lt); setFace(y, lt > 4.7 ? 'happy' : 'normal', 'smirk'); y.rig.position.y = .3 + Math.sin(lt*1.5)*.1;
    camPath(lt, [[0,[9,7.5,2],[14,10,-6]], [7,[11.5,9.6,-2.2],[14,10.6,-6]]]); },
  lines:[L(.8,'yomi','ふふふ…星の力を持つ娘が現れたか。','هههه... ظهرت فتاة تملك قوة النجوم إذن.','Heh heh... so a girl with the power of the stars has appeared.',3.8), L(4.8,'yomi','面白い…','مثير للاهتمام...','Interesting...',2)], ev:[] },
A.NEXT(ep1) ];

/* =============== EPISODE 2 =============== */
const ep2 = {no:2, ja:'影の女王ヨミ', ar:'ملكة الظلال يومي', en:'Yomi, Queen of Shadows', titleSay:'第二話、影の女王ヨミ',
  next:{ja:'次回、星光少女ヒカリ「親友を取り戻せ！」。お楽しみに！', ar:'في الحلقة القادمة: «استعيدي صديقتي المقرّبة!». ترقّبوها!', en:'Next time on Starlight Girl Hikari: "Take Back My Best Friend!" See you then!'}};
ep2.shots = [ A.OP(), A.TITLE(ep2),
{ dur:14, stage:'street', tod:'day', mood:'daily',
  run(lt){ const h = place('hikari', rf(-.7,2), .5, 'idle', lt), m = place('mina', rf(.7,2), -.5, 'idle', lt);
    setFace(h, lt > 3.6 && lt < 6.4 ? 'happy' : lt > 11.9 ? 'surprised' : 'normal', 'smile'); setFace(m, lt > 6.8 ? 'normal' : 'happy', 'smile');
    if(lt > 11.9) Pose.surprised(h, lt);
    camPath(lt, off(RB, [[0,[0,2.6,6.5],[0,2.2,2]], [6.6,[.5,2.6,6],[0,2.2,2]], [6.61,[-1.6,2.6,4.6],[.7,2.4,2]], [11.8,[-1.5,2.6,4.4],[.7,2.4,2]], [11.81,[1.4,2.6,4.6],[-.7,2.4,2]], [14,[1.2,2.6,4.3],[-.7,2.5,2]]])); },
  lines:[L(.5,'mina','ヒカリ、最近なんだか眠そうだね。','هيكاري، تبدين نعسانة مؤخراً.',"Hikari, you've looked sleepy lately.",2.9), L(3.6,'hikari','えへへ、ちょっと夜ふかししちゃって。','هيهي، سهرتُ قليلاً فقط.','Hehe, I stayed up a little late.',3), L(6.8,'mina','ねえ、知ってる？夜の街に怪物が出るって噂。','هل سمعتِ؟ يقولون إن وحشاً يظهر في المدينة ليلاً.','Did you hear? They say a monster appears in town at night.',3.9), L(12,'hikari','そ、そうなんだ〜…','ح-حقاً؟...','R-really...?',2)], ev:[] },
{ dur:11, stage:'street', tod:'dark', todFrom:'day', mood:'tension',
  run(lt){ const h = place('hikari', rf(-.7,2), Math.PI*.9, 'surprised', lt), m = place('mina', rf(.7,2), -Math.PI*.9, 'surprised', lt); setFace(h,'surprised','o'); setFace(m,'surprised','o');
    const y = place('yomi', rf(0,-3,lerp(8,2.5,eo(seg(lt,0,2.2)))), 0, 'float', lt); setFace(y, 'normal', lt > 1 ? 'smirk' : 'smile');
    camPath(lt, off(RB, [[0,[0,2,8],[0,6,-3]], [1.2,[0,2.4,7],[0,4.4,-3]], [4.2,[0,2.8,7],[0,4.4,-3]], [4.21,[.8,4.6,-.4],[0,4.8,-3]], [11,[.6,4.7,-.8],[0,4.9,-3]]])); },
  lines:[L(1.2,'yomi','初めまして、星の娘。','تشرّفتُ بلقائكِ يا فتاة النجوم.','Nice to meet you, daughter of the stars.',2.9), L(4.4,'yomi','私は影の女王ヨミ。この世界を永遠の夜にする者。','أنا ملكة الظلال يومي، التي ستجعل هذا العالم ليلاً أبدياً.','I am Yomi, Queen of Shadows. I will cover this world in eternal night.',4.4)],
  ev:[[.1, () => Sound.dark()]] },
{ dur:8, stage:'street', tod:'dark', mood:'tension',
  enter(){ beasts[2].root.userData.s0 = 1.9; },
  run(lt){ const h = place('hikari', rf(-.7,2), Math.PI*.9, 'idle', lt); setFace(h, 'angry', lt < 1.6 ? 'shout' : 'frown');
    const m = place('mina', rf(1,2.4), 0, 'lie', lt);
    const y = place('yomi', rf(0,-3,2.5), 0, 'float', lt); setFace(y, 'happy', 'smirk');
    const b = beasts[2]; b.root.visible = lt > 3.2; b.root.position.set(...rf(0,-1.5, lerp(-4,0,eo(seg(lt,3.2,4.6))))); 
    place('kon', rf(-1.8,2.6), Math.PI*.9, 'idle', lt);
    camPath(lt, off(RB, [[0,[-1.6,2.6,5.2],[-.4,2.2,2.2]], [3.2,[-1.4,2.6,5.4],[0,2.2,1]], [3.21,[-2,2.2,7.8],[0,3,-1.5]], [8,[-2.4,2.6,8.6],[0,3.2,-1.5]]])); },
  lines:[L(.2,'hikari','ミナ！','مينا!','Mina!',1.3), L(1.8,'yomi','眠っているだけよ。さあ、遊びましょう。','إنها نائمة فقط. هيا، لنلعب.',"She's only sleeping. Now, let's play.",3.3), L(6.1,'kon','ヒカリ、変身だコン！','هيكاري، تحوّلي!','Hikari, transform!',2)],
  ev:[[3.2, () => Sound.growl()]] },
A.TRANSFORM(shout, 'heroPose'),
{ dur:12.5, stage:'street', tod:'dark', mood:'battle', outfit:'hero',
  enter(){ beasts[2].root.userData.s0 = 1.9; },
  run(lt){ const b = beasts[2]; b.root.visible = true; b.root.position.set(...rf(0,-1.5)); b.rig.rotation.x = lt > 4.6 && lt < 5.2 ? .4 : 0;
    const knock = seg(lt,5,5.6), hz = lerp(2, 4.6, eo(knock));
    const h = place('hikari', rf(-.5,hz), Math.PI, 'heroPose', lt);
    if(lt < 2.4) Pose.cast(h, lt); else if(lt > 5 && lt < 6.2) Pose.hurt(h, lt); else if(lt >= 6.2 && lt < 10) Pose.kneel(h, lt); else if(lt >= 10) Pose.idle(h, lt);
    setFace(h, lt > 5 && lt < 10 ? 'sad' : 'angry', lt < 2.4 ? 'shout' : lt > 10 ? 'frown' : 'frown');
    place('mina', rf(1.2,3.2), 0, 'lie', lt); place('kon', rf(-2,3.4), Math.PI*.9, 'idle', lt);
    const y = place('yomi', rf(1.5,-3.5,3), -.2, 'float', lt); setFace(y, 'happy', 'smirk');
    beam('star', A.wandTip(), A.hp(b, 2), lt, .9, 2.3);
    call(lt > .5 && lt < 2.4 ? 'スターライト・アロー！' : '');
    camPath(lt, off(RB, [[0,[-3,2.4,5.5],[0,2.5,0]], [2.6,[-2.6,2.6,6],[0,2.8,-.5]], [4.6,[2.5,3,7.5],[0,2.4,1.5]], [6.2,[2,2.5,8],[-.5,1.6,4]], [9.8,[-.8,1.6,7.2],[-.5,1.6,4.6]], [12.5,[-.6,1.8,7.4],[-.5,1.9,4.6]]]));
    lines.mode = lt > 5 && lt < 5.6 ? 'focus' : null; lines.color = '160,60,200'; lines.amount = 1; },
  lines:[L(.5,'hikari','スターライト・アロー！','سهم ضوء النجوم!','Starlight Arrow!',1.6), L(3,'kon','効いてないコン！','لم يتأثر!',"It's not working!",1.7), L(7,'yomi','その程度？がっかりね。','هل هذا كل شيء؟ يا للخيبة.','Is that all? How disappointing.',2.8), L(10,'hikari','まだ…負けない…！','لن... أخسر... بعد!',"I... won't lose... yet!",2.4)],
  ev:[[.9, () => Sound.beam(1.3)], [2.3, () => { emit(A.hp(beasts[2],2), 0x9a3cff, 30, 5, .8, .8); Sound.growl(); }], [5, () => { A.shake(.9); Sound.impact(true); flash(.4); }]] },
{ dur:10.5, stage:'street', tod:'dark', mood:'transform', outfit:'hero',
  enter(){ beasts[2].root.userData.s0 = 1.9; },
  run(lt, dt){ const b = beasts[2]; b.root.visible = lt < 9.4; b.root.position.set(...rf(0,-1.5));
    const h = place('hikari', rf(-.5,4.6, lt > 6 ? 1.2*sm(seg(lt,6,6.6)) : 0), Math.PI, lt < 1 ? 'kneel' : lt < 6 ? 'hold' : 'wandUp', lt);
    setFace(h, lt < 3.3 ? 'angry' : lt < 6 ? 'normal' : 'angry', lt > 6 && lt < 8.5 ? 'shout' : 'frown');
    place('mina', rf(1.2,3.2), 0, 'lie', lt); place('kon', rf(-2,3.4), Math.PI*.9, 'idle', lt);
    if(lt > 1 && lt < 6){ A.pendant.visible = true; A.pendant.position.copy(A.hp('hikari',1.95)).add(V(0,0,-.45)); A.pendant.scale.setScalar(1 + Math.sin(lt*10)*.3 + seg(lt,1,6)); if(dt) emit(A.pendant.position, 0xff9ad0, 2, 2, .7, .4, 0, 'star'); } else A.pendant.visible = false;
    if(lt > 6.6 && lt < 9.4 && dt) for(let i=0;i<4;i++) emit(V(R.x+(Math.random()-.5)*8, R.y+9, R.z-1.5+(Math.random()-.5)*4), [0xff9ad0,0xffd75e][i%2], 1, 2, 1.2, .9, -12, 'star');
    beam('gold', A.wandTip(), A.hp(b, 2), lt, 7.4, 9.2);
    if(lt > 9.2) dissolve(b, A.hp(b,2), lt, 9.2);
    call(lt > 6.4 && lt < 9 ? 'スターライト・ハート・シャワー！' : '');
    lines.mode = lt > 6.4 && lt < 9.2 ? 'focus' : null; lines.color = '255,200,230'; lines.amount = 1;
    camPath(lt, off(RB, [[0,[-.6,2,7.4],[-.5,1.6,4.6]], [3.3,[-.6,2.6,6.8],[-.5,2.4,4.6]], [6,[-.2,2.8,6.4],[-.5,2.6,4.6]], [6.6,[-4,4,8],[0,4,-.5]], [10.5,[-3,3.5,9],[0,3,0]]])); },
  lines:[L(.3,'hikari','ミナを守るんだ。友達だから！','سأحمي مينا، لأنها صديقتي!',"I'll protect Mina. Because she's my friend!",3), L(3.5,'kon','ペンダントが新しい力を…！','القلادة تمنح قوة جديدة...!','The pendant is giving you a new power...!',2.6), L(6.4,'hikari','スターライト・ハート・シャワー！','وابل قلب ضوء النجوم!','Starlight Heart Shower!',2.4)],
  ev:[[1, () => Sound.shine()], [7.4, () => Sound.beam(1.8)], [9.2, () => boom(A.hp(beasts[2],2), true)]] },
{ dur:7.5, stage:'street', tod:'day', todFrom:'dark', mood:'ed',
  run(lt, dt){ const y = place('yomi', rf(1.5,-3.5,3), -.2, 'float', lt); setFace(y, 'angry', 'frown'); y.root.visible = lt < 3.4; if(lt > 2.6 && lt < 3.4 && dt) emit(A.hp('yomi',1.6), 0x9a3cff, 6, 3, 1, .9, 1);
    const h = place('hikari', rf(-.2,3.6), .3, 'idle', lt); setFace(h, 'happy', 'smile');
    const m = place('mina', rf(1.2,3.2), 0, lt < 4 ? 'lie' : 'kneel', lt); setFace(m, lt < 4 ? 'blink' : 'normal', 'o');
    camPath(lt, off(RB, [[0,[1.5,4.5,2],[1.5,4.6,-3.5]], [3.4,[1.4,4.4,1.6],[1.5,4.6,-3.5]], [3.41,[-1.5,2.3,7.4],[.5,1.2,3.2]], [7.5,[-1.2,2.4,7],[.5,1.4,3.2]]])); },
  lines:[L(.5,'yomi','くっ…次はこうはいかないわよ。',"تشه... لن تكون المرة القادمة بهذه السهولة.","Tch... it won't go this way next time.",2.8), L(4,'mina','う…ん、ヒカリ…？','أمم... هيكاري...؟','Mm... Hikari...?',2)], ev:[] },
A.NEXT(ep2) ];



/* =============== EPISODE 3 =============== */
const ep3 = {no:3, ja:'親友を取り戻せ！', ar:'استعيدي صديقتي المقرّبة!', en:'Take Back My Best Friend!', titleSay:'第三話、親友を取り戻せ！',
  next:{ja:'次回、星光少女ヒカリ「消えた光」。お楽しみに！', ar:'في الحلقة القادمة: «النور الذي اختفى». ترقّبوها!', en:'Next time on Starlight Girl Hikari: "The Vanished Light." See you then!'}};
const minaDark = (m, on) => { m.root.userData.dark = on; };
ep3.shots = [ A.OP(), A.TITLE(ep3),
{ dur:8.5, stage:'street', tod:'sunset', mood:'daily',
  run(lt){ const x = lerp(-6, 1, lt/8.5);
    const h = place('hikari', [x,0,2.6], Math.PI/2, 'walk', lt), m = place('mina', [x,0,3.6], Math.PI/2, 'walk', lt);
    if(lt > 3.4 && lt < 6.2){ Pose.surprised(h, lt); h.root.rotation.y = Math.PI*.7; }
    setFace(h, lt > 3.4 && lt < 6.2 ? 'surprised' : 'normal', lt > 3.4 && lt < 6.2 ? 'open' : 'smile'); setFace(m, lt > 6.2 ? 'sad' : 'normal', lt > 6.2 ? 'frown' : 'smile');
    if(lt > 6.2) m.head.rotation.x = .25;
    camPath(lt, [[0,[x+4.5,2.4,8.5],[x,2.2,3]], [8.5,[1+4,2.4,8],[1,2.3,3]]]); },
  lines:[L(.5,'mina','ヒカリ、何か隠してるでしょ？','هيكاري، أنتِ تخفين شيئاً، صحيح؟',"Hikari, you're hiding something, aren't you?",2.9), L(3.6,'hikari','え！？な、何も隠してないよ！','ماذا؟! ل-لا أخفي شيئاً!',"Huh!? I-I'm not hiding anything!",2.6), L(6.7,'mina','…そっか。','...فهمت.','...I see.',1.8)], ev:[] },
{ dur:8.5, stage:'street', tod:'dark', todFrom:'sunset', mood:'tension',
  run(lt, dt){ const y = place('yomi', [3, 4, -2], -.5, 'float', lt); setFace(y, 'normal', 'smirk'); y.root.visible = lt > .3;
    const up = sm(seg(lt,3.2,5)); const m = place('mina', [1,up*1.8,3.6], -Math.PI/2*.2, lt > 3.2 ? 'float' : 'surprised', lt);
    setFace(m, lt > 4.6 ? 'angry' : 'surprised', lt > 4.6 ? 'frown' : 'open');
    const h = place('hikari', [-.8,0,2.8], .8, lt > 5 ? 'shout' : 'surprised', lt); setFace(h, 'surprised', 'shout');
    beam('dark', A.hp('yomi',2), A.hp('mina',1.8), lt, 2.6, 4.8);
    if(lt > 4.8 && dt && Math.random() < .5) emit(A.hp('mina', 1.5), 0x9a3cff, 2, 2, 1, .9, 1);
    lines.mode = lt > 3 && lt < 4.8 ? 'focus' : null; lines.color = '140,50,190'; lines.amount = 1;
    camPath(lt, [[0,[-1,2.4,9],[1,2.6,1]], [2.6,[-.5,2.8,9],[2,3,0]], [4.8,[2.2,3.4,7.5],[1,3.2,3.6]], [8.5,[2,3.6,7],[.2,3,3.2]]]); },
  lines:[L(.4,'yomi','その寂しい心、いただくわ。','سآخذ ذلك القلب الوحيد.',"I'll take that lonely heart.",2.6), L(3.3,'mina','きゃあああっ！','كياااه!','Kyaaah!',1.5), L(5.4,'hikari','ミナー！','ميناااا!','Minaaa!',1.8)],
  ev:[[.2, () => Sound.dark()], [2.6, () => Sound.beam(2)]] },
A.TRANSFORM(shout, 'heroPose'),
{ dur:12, stage:'street', tod:'dark', mood:'battle', outfit:'hero',
  run(lt){ const m = place('mina', [1, 1.6, -1], 0, 'float', lt); Pose.cast(m, lt); m.rig.position.y = .3 + Math.sin(lt*2)*.1; setFace(m, 'angry', lt < 6 ? 'open' : 'frown');
    const dodge = Math.sin(seg(lt,1.4,2.2)*Math.PI)*2.2;
    const hit = seg(lt,6.2,6.8);
    const h = place('hikari', [-1.2+dodge - eo(hit)*1.5, 0, 3.4+eo(hit)*1.2], Math.PI*.95, 'idle', lt);
    if(lt > 6.2 && lt < 7) Pose.hurt(h, lt); if(lt > 7) Pose.hold(h, lt);
    setFace(h, lt < 6.2 ? 'surprised' : lt < 10.5 ? 'sad' : 'blink', lt > 7 && lt < 10.4 ? 'open' : 'frown');
    beam('mina', A.hand('mina'), lt < 3 ? A.hp('hikari',1.4).add(V(-1.6,0,0)) : A.hp('hikari',1.4), lt, lt < 3 ? 1.4 : 5.8, lt < 3 ? 2.4 : 6.8);
    camPath(lt, [[0,[-3,2.4,9],[0,2.4,1]], [3.6,[-2.6,2.6,8.5],[0,2.4,1]], [3.61,[2.5,3,3],[1,3.2,-1]], [6,[2.2,3,3.3],[1,3.2,-1]], [6.01,[-3,2.4,8],[-1.5,2,3.6]], [7,[-2.6,2.6,7.4],[-1.8,2.6,4]], [12,[-2.2,2.7,7],[-1.6,2.8,4]]]); },
  lines:[L(.4,'mina','ヒカリはいつも一人で全部背負って…！','هيكاري، تحملين كل شيء وحدكِ دائماً...!','You always carry everything by yourself...!',3.2), L(3.8,'mina','私じゃ頼りにならないの！？','ألستُ جديرة بثقتكِ؟!',"Can't you rely on me!?",2.3), L(7.1,'hikari','ちがう！ミナを巻き込みたくなかっただけ！','لا! فقط لم أُرِد أن أورّطكِ!',"No! I just didn't want to drag you into this!",3.4), L(10.6,'hikari','ごめんね…','آسفة...',"I'm sorry...",1.4)],
  ev:[[1.4, () => Sound.whoosh()], [5.8, () => Sound.beam(1)], [6.4, () => { Sound.impact(); A.shake(.5); flash(.3); }]] },
{ dur:10.5, stage:'street', tod:'dark', mood:'sad', outfit:'hero',
  run(lt, dt){ const fall = sm(seg(lt,6,7.2));
    const m = place('mina', [1, 1.6*(1-fall), -.2], 0, 'float', lt); if(lt > 6) Pose.idle(m, lt); setFace(m, lt < 5.2 ? 'angry' : lt < 7 ? 'surprised' : 'happy', lt > 7.4 ? 'open' : 'frown');
    const walk = sm(seg(lt,0,3.8)); const h = place('hikari', [lerp(-1.5,.55,walk), 0, lerp(3.6,.6,walk)], Math.PI*.95, lt < 3.8 ? 'walk' : 'hold', lt); setFace(h, lt < 4.6 ? 'normal' : 'blink', 'smile');
    if(lt > 5.2 && lt < 6.6 && dt){ emit(A.hp('mina',1.6), 0x9a3cff, 6, 5, 1, 1, 2); emit(A.hp('hikari',1.6), 0xff9ad0, 3, 4, .9, .7, 0, 'star'); }
    call(lt > 5.2 && lt < 7 ? 'スターライト・ハグ！' : '');
    camPath(lt, [[0,[-3,2.6,7],[-.5,2.4,2]], [4.6,[-2,2.6,4.5],[.7,2.6,.4]], [7,[1.5,2.4,4.8],[.7,2.4,.4]], [10.5,[1.4,2.5,3.8],[.8,2.5,.3]]]); },
  lines:[L(.2,'hikari','私の秘密、全部話すよ。だから帰ってきて、ミナ！','سأخبركِ بكل أسراري. لذا عودي يا مينا!',"I'll tell you all my secrets. So come back, Mina!",4.2), L(5.2,'hikari','スターライト・ハグ！','عناق ضوء النجوم!','Starlight Hug!',1.8), L(7.6,'mina','ヒカリ…ありがとう。','هيكاري... شكراً.','Hikari... thank you.',2.4)],
  ev:[[5.2, () => { Sound.shine(); flash(.9); ring(V(.8,1.6,.4),0xff9ad0,9,1.2,false); }], [6.2, () => Sound.dark()]] },
{ dur:8.5, stage:'street', tod:'night', todFrom:'dark', mood:'ed',
  run(lt){ const h = place('hikari', [-.6,0,1.5], .4, lt > 5.4 ? 'peace' : 'idle', lt), m = place('mina', [.7,0,1.5], -.4, lt < 3 ? 'surprised' : lt > 5.4 ? 'peace' : 'idle', lt); m.armL.rotation.z = lt > 5.4 ? 2.2 : m.armL.rotation.z;
    setFace(h, 'happy', 'smile'); setFace(m, lt < 3 ? 'surprised' : 'happy', lt < 3 ? 'open' : 'smile');
    const k = place('kon', [0,0,2.4], 0, 'idle', lt); setFace(k, 'happy', 'smile');
    camPath(lt, [[0,[0,2.3,6.6],[0,2.1,1.5]], [8.5,[0,2.5,5.8],[0,2.2,1.5]]]); },
  lines:[L(.4,'mina','ヒカリが魔法少女だったなんて！','لم أتخيّل أن هيكاري فتاة سحرية!',"I can't believe you're a magical girl, Hikari!",2.9), L(3.4,'kon','ナイショだコン！','إنه سرّ يا كون!',"It's a secret, kon!",1.8), L(5.6,'mina','うん、二人だけの秘密ね！','نعم، سرّ بيننا نحن الاثنتين!','Yeah, a secret just between us!',2.7)], ev:[] },
{ dur:6.5, stage:'realm', tod:'dark', mood:'sad', petals:false,
  run(lt){ const y = place('yomi', [0,0,4], Math.PI*.85, 'float', lt); setFace(y, lt > 3.4 ? 'sad' : 'normal', 'frown'); y.head.rotation.x = -.3;
    camPath(lt, [[0,[2,2,10],[0,3,4]], [3.3,[2,2.6,9],[0,3,4]], [3.31,[-.8,3.2,6.6],[0,3.3,4]], [6.5,[-.7,3.3,6.2],[0,3.4,4]]]); },
  lines:[L(.6,'yomi','友達…？くだらない。','أصدقاء...؟ سخافة.','Friends...? How foolish.',2.6), L(3.5,'yomi','…光なんて、大嫌い。','...أكره النور.','...I hate the light.',2.6)], ev:[] },
A.NEXT(ep3) ];

/* =============== EPISODE 4 =============== */
const ep4 = {no:4, ja:'消えた光', ar:'النور الذي اختفى', en:'The Vanished Light', titleSay:'第四話、消えた光',
  next:{ja:'次回、星光少女ヒカリ最終話「最後の流れ星」。お楽しみに！', ar:'في الحلقة الأخيرة: «الشهاب الأخير». ترقّبوها!', en:'Next time, the final episode of Starlight Girl Hikari: "The Last Shooting Star." See you then!'}};
const superShout = {ja:'スーパー・スターライト・チェンジ！', ar:'التحوّل الخارق لضوء النجوم!', en:'Super Starlight Change!'};
ep4.shots = [ A.OP(), A.TITLE(ep4),
{ dur:8.5, stage:'street', tod:'night', mood:'calm',
  run(lt){ const k = place('kon', sh(0,1.8), 0, 'idle', lt); setFace(k, lt < 3.6 ? 'sad' : 'normal', lt < 3.6 ? 'frown' : 'smile');
    const h = place('hikari', sh(-1,2.6), .4, 'idle', lt), m = place('mina', sh(1,2.6), -.4, lt > 3.6 && lt < 6.4 ? 'peace' : 'idle', lt);
    setFace(h, lt > 7.6 ? 'happy' : 'normal', 'smile'); setFace(m, lt > 3.6 ? 'happy' : 'normal', 'smile');
    camPath(lt, off(SB, [[0,[0,1.8,6],[0,1.4,2]], [8.5,[0,2.2,6.6],[0,1.8,2]]])); },
  lines:[L(.4,'kon','ヨミの力がどんどん強くなってるコン…','قوة يومي تزداد يوماً بعد يوم...',"Yomi's power keeps getting stronger...",3.2), L(3.8,'mina','大丈夫。ヒカリには私たちがいるもん！','لا تقلق. هيكاري لديها نحن!',"Don't worry. Hikari has us!",2.6), L(7.7,'hikari','うん！','نعم!','Yeah!',1.4)], ev:[] },
{ dur:11.5, stage:'street', tod:'dark', todFrom:'night', mood:'tension',
  run(lt, dt){ const y = place('yomi', sh(0,-2,2.4), 0, 'float', lt); setFace(y, lt > 5.6 ? 'happy' : 'normal', 'smirk'); if(lt < 1.6) Pose.cast(y, lt);
    const h = place('hikari', sh(-1,2.6), Math.PI*.95, lt < 1.6 ? 'hold' : 'surprised', lt); setFace(h, 'surprised', lt > 3.8 ? 'open' : 'o');
    const m = place('mina', sh(1,2.6), -Math.PI*.95, 'surprised', lt); setFace(m, 'surprised', 'o');
    const k = place('kon', sh(0,1.8), Math.PI, 'idle', lt); if(lt > 4.5){ k.rig.position.y = .1; k.rig.rotation.z = 1.4; setFace(k, 'blink', 'frown'); }
    const u = sm(seg(lt,1.5,3.5)); A.pendant.visible = lt < 3.6; A.pendant.scale.setScalar(1);
    A.pendant.position.copy(A.hp('hikari',1.95).add(V(0,0,-.45))).lerp(A.hp('yomi',3), u);
    beam('dark', A.hp('yomi',2.2), A.hp('hikari',1.9), lt, .4, 1.6);
    camPath(lt, off(SB, [[0,[-2.5,2.2,7],[0,2.6,0]], [3.6,[-2,2.6,7.5],[0,3.6,-1]], [3.61,[-1.4,2.5,.3],[-1,2.3,2.6]], [5.5,[-1.3,2.5,.5],[-1,2.3,2.6]], [5.51,[.8,4.8,1.6],[0,4.6,-2]], [11.5,[.6,4.9,1],[0,4.7,-2]]])); },
  lines:[L(.4,'yomi','その星の力、もらっていくわ！','سآخذ قوة النجمة تلك!',"I'll be taking that star power!",2.5), L(3.8,'hikari','ペンダントが…！','القلادة...!','My pendant...!',1.6), L(5.7,'yomi','これで世界は永遠の夜。さようなら、星の娘。','الآن سيغرق العالم في ليل أبدي. وداعاً يا فتاة النجوم.','Now the world will be in eternal night. Farewell, star girl.',3.6)],
  ev:[[.4, () => Sound.dark()], [1.5, () => Sound.whoosh()], [5.6, () => Sound.dark()]] },
{ dur:9.5, stage:'street', tod:'dark', mood:'sad',
  enter(){ A.setNight(false); },
  run(lt){ const h = place('hikari', [0,0,2], 0, 'kneel', lt); setFace(h, 'sad', lt < 4.4 ? 'open' : 'frown');
    const k = place('kon', [1,0,2.6], -.4, 'idle', lt); setFace(k, 'sad', 'frown');
    const m = place('mina', [lerp(-4,-1,sm(seg(lt,5.6,6.6))),0,2.6], .6, lt > 5.6 && lt < 6.6 ? 'run' : 'idle', lt); m.root.visible = lt > 5.6; setFace(m, 'angry', 'open');
    camPath(lt, [[0,[0,8,14],[0,0,0]], [4,[0,3.5,9],[0,1.2,2]], [4.01,[.6,1.8,4.6],[0,1.6,2]], [9.5,[.4,1.9,4.2],[0,1.7,2]]]); },
  lines:[L(.5,'hikari','変身できない…私、もう何もできないの…？','لا أستطيع التحوّل... هل أصبحتُ عاجزة...؟',"I can't transform... Is there nothing I can do now...?",4.2), L(5,'kon','ヒカリ…','هيكاري...','Hikari...',1.4), L(6.8,'mina','そんなことない！','هذا غير صحيح!',"That's not true!",2)], ev:[] },
{ dur:10.5, stage:'street', tod:'dark', mood:'ed',
  run(lt, dt){ A.setNight(lt > 4.2);
    const h = place('hikari', [0,0,2], 0, lt < 7.4 ? 'kneel' : 'hold', lt); if(lt > 7.4) h.rig.position.y = 0; setFace(h, lt < 4 ? 'sad' : lt < 7.4 ? 'surprised' : 'blink', 'smile');
    const m = place('mina', [-1,0,2.6], .6, 'kneel', lt); m.armR.rotation.x = -1.3; setFace(m, 'happy', 'smile');
    const k = place('kon', [1,0,2.6], -.4, 'idle', lt); setFace(k, lt > 4.2 ? 'happy' : 'sad', 'smile');
    if(lt > 4.2 && dt) for(let i=0;i<3;i++){ const p = V((Math.random()-.5)*60, 2+Math.random()*6, -10-Math.random()*6); emit(p, [0xffd75e,0xff9ad0,0x9ad8ff][i], 1, .4, 1.6, .7, 2.5, 'star'); }
    if(lt > 7.4 && dt) emit(A.hp('hikari',1.9), 0xffd75e, 3, 2.5, .8, .6, 0, 'star');
    camPath(lt, [[0,[-1.6,1.9,5],[-.4,1.7,2.2]], [4.2,[-1.2,2,5.2],[-.3,1.6,2.2]], [4.21,[0,2.4,8],[0,5,-12]], [7.3,[0,2.8,9],[0,4,-8]], [7.31,[0,1.9,4.6],[0,1.8,2]], [10.5,[0,2,4.2],[0,1.9,2]]]); },
  lines:[L(.2,'mina','ヒカリはペンダントがなくても、ずっと私のヒーローだよ。','حتى بدون القلادة، أنتِ دائماً بطلتي يا هيكاري.',"Even without the pendant, you've always been my hero.",3.8), L(4.4,'kon','見て！街のみんなの心の光だコン！','انظري! إنه نور قلوب أهل المدينة!',"Look! It's the light in everyone's hearts!",3), L(7.75,'hikari','みんなの光…感じる！','نور الجميع... أشعر به!',"Everyone's light... I can feel it!",2.6)],
  ev:[[4.2, () => Sound.chime()], [7.4, () => Sound.shine()]] },
A.TRANSFORM(superShout, 'heroPose', true),
{ dur:11.5, stage:'street', tod:'dark', mood:'battle', outfit:'hero', wings:true,
  run(lt, dt){ const y = place('yomi', [0,3,-4], 0, 'float', lt); setFace(y, lt < 2.4 ? 'surprised' : 'angry', lt < 2.4 ? 'o' : 'open'); if(lt > 4.8 && lt < 8.5) Pose.cast(y, lt);
    const blown = seg(lt,8.5,9.4); y.root.position.add(V(0, blown*3, -blown*8)); y.root.visible = lt < 10.8;
    const fly = sm(seg(lt,2.2,4.8)); const h = place('hikari', [0, lerp(0,3,fly), lerp(4,1.5,fly)], Math.PI, lt < 2.2 ? 'heroPose' : lt < 4.8 ? 'hover' : 'cast', lt);
    setFace(h, 'angry', lt > 6.8 && lt < 8.5 ? 'shout' : 'frown');
    const mid = V(0, 4.6, -1.2 + Math.sin(lt*7)*.3 - seg(lt,7.6,8.5)*2.5);
    beam('gold', A.wandTip(), mid, lt, 4.9, 8.5); beam('dark', A.hp('yomi',1.8), mid, lt, 4.9, 8.5);
    if(lt > 4.9 && lt < 8.5 && dt) emit(mid, Math.random() < .5 ? 0xffd75e : 0x9a3cff, 6, 6, .5, .7, 0, 'star');
    lines.mode = lt > 4.9 && lt < 8.5 ? 'speed' : null; lines.color = '255,230,250'; lines.amount = 1;
    camPath(lt, [[0,[0,2.2,9],[0,3,-2]], [2.2,[3,3,9],[0,3,0]], [4.8,[7,4.5,1.5],[0,4.2,-1]], [8.5,[6.5,4.8,1],[0,4.5,-1.5]], [9.4,[0,4,9],[0,5,-6]], [11.5,[0,3.5,8.5],[0,4,-1]]]); },
  lines:[L(.4,'yomi','な…その姿は！？','م-ما هذا الشكل؟!','Wh-what is that form!?',1.8), L(2.4,'hikari','これがみんなの光の力！','هذه قوة نور الجميع!',"This is the power of everyone's light!",2.5), L(5.2,'yomi','消えなさい！','اختفي!','Disappear!',1.4), L(6.8,'hikari','いっけええええ！','هيااااا!','Gooooo!',1.8), L(9.4,'yomi','覚えてなさい…！','تذكّري هذا...!',"You'll regret this...!",1.8)],
  ev:[[2.2, () => Sound.whoosh()], [4.9, () => Sound.beam(3.5)], [8.5, () => boom(V(0,4.4,-3), true)]] },
{ dur:8.5, stage:'street', tod:'night', todFrom:'dark', mood:'ed', outfit:'hero', wings:true,
  run(lt){ const h = place('hikari', [0,0,1.5], 0, 'hold', lt); setFace(h, lt < 5.2 ? 'happy' : 'sad', 'smile');
    A.pendant.visible = true; A.pendant.scale.setScalar(.45); A.pendant.position.copy(A.hp('hikari',1.75)).add(V(0,0,.4));
    const m = place('mina', [-1.1,0,1.8], .5, lt < 3 ? 'cheer' : 'idle', lt); setFace(m, 'happy', 'open');
    const k = place('kon', [1,0,2.2], -.5, 'idle', lt); setFace(k, 'happy', 'smile');
    camPath(lt, [[0,[0,2.4,6],[0,2,1.5]], [5,[0,2.4,5.4],[0,2.1,1.5]], [5.01,[.6,2.6,3.6],[0,2.6,1.5]], [8.5,[.5,2.7,3.3],[0,2.7,1.5]]]); },
  lines:[L(.5,'kon','ペンダントが戻ってきたコン！','عادت القلادة!','The pendant came back!',2.2), L(3,'hikari','ありがとう、みんな。','شكراً لكم جميعاً.','Thank you, everyone.',2.1), L(5.3,'hikari','でも…ヨミ、なんだか悲しそうだった。','لكن... بدت يومي حزينة نوعاً ما.','But... Yomi looked kind of sad.',3)], ev:[] },
A.NEXT(ep4) ];

/* =============== EPISODE 5 =============== */
const ep5 = {no:5, ja:'最後の流れ星', ar:'الشهاب الأخير', en:'The Last Shooting Star', titleSay:'最終話、最後の流れ星',
  next:{ja:'星光少女ヒカリ、これでおしまい！みんな、見てくれてありがとう！', ar:'هنا تنتهي «فتاة ضوء النجوم هيكاري»! شكراً لكم جميعاً على المشاهدة!', en:"That's the end of Starlight Girl Hikari! Thank you all for watching!"}};
ep5.shots = [ A.OP(), A.TITLE(ep5),
{ dur:8, stage:'realm', tod:'dark', mood:'tension', outfit:'hero', wings:true, petals:false,
  run(lt){ const d = 1 - sm(seg(lt,0,2.4));
    place('hikari', [0, d*6, 9], Math.PI, d > 0 ? 'hover' : 'idle', lt); setFace(A.C.hikari, 'normal', 'frown');
    const m = place('mina', [-1.3, d*6, 9.6], Math.PI*.9, 'idle', lt); setFace(m, 'surprised', 'o');
    place('kon', [1.2, d*6, 9.6], Math.PI*1.1, 'idle', lt);
    camPath(lt, [[0,[0,10,22],[0,6,8]], [2.6,[0,3,15],[0,2,8]], [8,[0,6,18],[0,4,-6]]]); },
  lines:[L(.5,'narr','ヒカリたちは、ヨミの住む影の国へ向かった。','توجّهت هيكاري ورفاقها إلى مملكة الظلال حيث تعيش يومي.','Hikari and her friends set out for the Shadow Realm, where Yomi lives.',4.4), L(5,'mina','ここが影の国…','هذه هي مملكة الظلال...','So this is the Shadow Realm...',2.4)], ev:[] },
{ dur:9.5, stage:'realm', tod:'dark', mood:'tension', outfit:'hero', wings:true, petals:false,
  run(lt){ const y = place('yomi', [0,2.4,-4], 0, 'float', lt); setFace(y, lt > 7.3 ? 'angry' : 'normal', lt > 7.3 ? 'shout' : 'smirk');
    const h = place('hikari', [0,0,5], Math.PI, 'idle', lt); setFace(h, 'normal', 'smile');
    place('mina', [-1.3,0,5.6], Math.PI*.9, 'idle', lt); place('kon', [1.2,0,5.6], Math.PI*1.1, 'idle', lt);
    camPath(lt, [[0,[2,3,10],[0,4.5,-4]], [3.6,[1,4,4],[0,4.8,-4]], [3.61,[-.8,3,9],[0,2.4,5]], [7.1,[-.6,3,8.4],[0,2.5,5]], [7.11,[.5,5.6,-1.2],[0,5.1,-4]], [9.5,[.4,5.5,-1.6],[0,5.1,-4]]]); },
  lines:[L(.4,'yomi','よく来たわね。ここで終わりにしましょう。','أهلاً بكِ. لننهِ الأمر هنا.',"So you came. Let's end this here.",3.2), L(4.4,'hikari','ヨミ、どうしてそんなに光を嫌うの？','يومي، لماذا تكرهين النور إلى هذا الحد؟','Yomi, why do you hate the light so much?',3), L(7.3,'yomi','…黙りなさい！','...اصمتي!','...Be quiet!',1.8)], ev:[[7.3, () => Sound.dark()]] },
{ dur:12.5, stage:'realm', tod:'dark', mood:'battle', outfit:'hero', wings:true, petals:false,
  enter(){ beasts[0].root.userData.s0 = 1; beasts[1].root.userData.s0 = 1; },
  run(lt, dt){ const y = place('yomi', [0,2.4,-4], 0, lt > 5.8 && lt < 7.2 ? 'cast' : 'float', lt); setFace(y, 'angry', lt < 1.8 || (lt > 6 && lt < 7.4) ? 'shout' : 'frown');
    const bp = [[-3,0,0],[3,0,0]];
    beasts.slice(0,2).forEach((b,i) => { b.root.visible = lt > .8; b.root.position.set(bp[i][0], lerp(-3,0,eo(seg(lt,.8,2))), bp[i][2]); if(lt > 4.6) dissolve(b, A.hp(b,1.2), lt, 4.6); });
    const hit = seg(lt,7,7.6); const h = place('hikari', [0, 0, 5 + eo(hit)*1.5], Math.PI, lt < 2.8 ? 'idle' : lt < 4.6 ? 'cast' : lt < 7 ? 'idle' : lt < 10.5 ? 'kneel' : 'heroPose', lt);
    setFace(h, lt > 7 && lt < 10.4 ? 'sad' : 'angry', lt > 2.8 && lt < 4.6 ? 'shout' : 'frown');
    const m = place('mina', [-1.5,0,6.6], Math.PI*.9, 'surprised', lt); setFace(m, 'surprised', lt > 9 ? 'shout' : 'o');
    place('kon', [1.4,0,6.6], Math.PI*1.1, 'idle', lt);
    beam('star', A.wandTip(), A.hp(beasts[0],1.2), lt, 3.2, 4.6); beam('gold', A.wandTip(), A.hp(beasts[1],1.2), lt, 3.2, 4.6);
    beam('dark', A.hp('yomi',2), A.hp('hikari',1.5), lt, 6.4, 7.4);
    call(lt > 3 && lt < 4.8 ? 'スターライト・アロー！' : lt > 6.1 && lt < 7.6 ? 'ダーク・エクリプス！' : '');
    lines.mode = lt > 6.4 && lt < 7.4 ? 'focus' : null; lines.color = '150,60,200'; lines.amount = 1;
    camPath(lt, [[0,[0,4,13],[0,2,0]], [2.8,[-3.5,3,9.5],[0,2,1]], [4.8,[-3,3,10],[0,2,1]], [5.8,[1.5,4.2,1.5],[0,4,-4]], [7,[0,3,11],[0,2.5,2]], [9,[-1.5,1.9,9.4],[0,1.4,6.4]], [12.5,[-1.2,2.2,9.2],[0,2,6.4]]]); },
  lines:[L(.5,'yomi','影獣たちよ！','يا وحوش الظلال!','Shadow beasts!',1.7), L(3,'hikari','スターライト・アロー！','سهم ضوء النجوم!','Starlight Arrow!',1.5), L(6,'yomi','ダーク・エクリプス！','الكسوف المظلم!','Dark Eclipse!',1.5), L(9,'mina','ヒカリー！','هيكاريييي!','Hikariii!',1.5), L(10.6,'hikari','大丈夫…！','أنا بخير...!',"I'm okay...!",1.8)],
  ev:[[.8, () => Sound.growl()], [3.2, () => Sound.beam(1.4)], [4.6, () => { boom(A.hp(beasts[0],1.2)); boom(A.hp(beasts[1],1.2)); }], [6.4, () => Sound.dark()], [7, () => { Sound.impact(true); A.shake(.8); flash(.5); }]] },
{ dur:12, stage:'realm', tod:'dark', mood:'sad', outfit:'hero', wings:true, petals:false,
  run(lt){ const y = place('yomi', [0,2.4,-4], 0, 'float', lt); setFace(y, lt < 3 ? 'normal' : 'sad', 'frown'); y.head.rotation.x = .2;
    A.darkStar.scale.setScalar(1 + Math.sin(lt*2)*.08);
    camPath(lt, [[0,[0,6,6],[0,8,-10]], [3,[0,5.5,4],[0,9,-10]], [3.01,[.9,5.3,-.6],[0,5.1,-4]], [12,[.7,5.3,-1.3],[0,5.15,-4]]]); },
  lines:[L(.5,'yomi','私もかつては星だった。','كنتُ أنا أيضاً نجمة يوماً ما.','I was once a star too.',2.5), L(3.2,'yomi','でも、空から落ちた私を、誰も見つけてくれなかった。','لكن عندما سقطتُ من السماء، لم يجدني أحد.','But when I fell from the sky, no one ever found me.',4), L(8.2,'yomi','暗くて、寒くて…ずっと一人だった。','كان المكان مظلماً وبارداً... وكنتُ وحيدة دائماً.','It was dark and cold... I was always alone.',3.8)], ev:[] },
{ dur:10, stage:'realm', tod:'dark', mood:'ed', outfit:'hero', wings:true, petals:false,
  run(lt){ const walk = sm(seg(lt,0,3)); const h = place('hikari', [0, 0, lerp(5,-1.2,walk)], Math.PI, lt < 3 ? 'walk' : 'idle', lt); setFace(h, 'happy', 'smile');
    if(lt > 3.4){ h.armR.rotation.set(-1.3,0,.1); }
    const y = place('yomi', [0, lerp(2.4,.6,sm(seg(lt,5,8))), -3.2], 0, 'float', lt); setFace(y, lt < 6.2 ? 'sad' : 'surprised', lt > 6.2 ? 'o' : 'frown');
    camPath(lt, [[0,[-3,3,4],[0,2.6,-2]], [3.4,[-2.6,2.8,1.6],[0,2.6,-2]], [3.41,[1.5,3.3,-3.9],[0,2.8,-1.2]], [6.2,[1.4,3.3,-3.7],[0,2.8,-1.2]], [6.21,[-1.7,3.5,1.6],[0,3,-3.2]], [10,[-1.5,3.4,1.1],[0,3,-3.2]]]); },
  lines:[L(.4,'hikari','じゃあ、今度は私が見つけたよ。','إذن، هذه المرة أنا وجدتُكِ.','Then this time, I found you.',3), L(3.6,'hikari','ヨミ、私たちと友達になろう！','يومي، لنصبح صديقات!',"Yomi, let's be friends!",2.6), L(6.4,'yomi','友達…？私と…？','صديقات...؟ معي أنا...؟','Friends...? With me...?',3)], ev:[] },
{ dur:10.5, stage:'realm', tod:'magic', todFrom:'dark', mood:'transform', outfit:'hero', wings:true, petals:0xffe08a,
  run(lt, dt){ const h = place('hikari', [0,0,1.6], Math.PI, lt < 3 ? 'hold' : 'wandUp', lt); setFace(h, lt < 5.5 ? 'angry' : 'happy', lt > 3 && lt < 5.5 ? 'shout' : 'smile');
    const m = place('mina', [-1,0,2.2], Math.PI, 'wandUp', lt), k = place('kon', [1,0,2.2], Math.PI, 'idle', lt); setFace(m, 'happy', 'smile'); setFace(k, 'happy', 'smile');
    const y = place('yomi', [0,.6,-3.2], 0, 'float', lt); setFace(y, lt > 6 ? 'happy' : 'surprised', lt > 6 ? 'smile' : 'o');
    A.darkStar.visible = true; A.darkStar.userData.core.material.color.setHex(lt > 5.5 ? 0xfff2b0 : 0x1a0828); A.darkStar.userData.glow.material.color.setHex(lt > 5.5 ? 0xffd75e : 0x9a3cff);
    beam('star', A.wandTip(), A.darkStar.position, lt, 3.6, 5.5); beam('gold', A.hp('mina',3), A.darkStar.position, lt, 3.8, 5.5); beam('mina', A.hp('kon',1), A.darkStar.position, lt, 4, 5.5);
    if(lt > 5.5 && dt) emit(V((Math.random()-.5)*30, Math.random()*12, -6+(Math.random()-.5)*20), 0xffd75e, 2, .6, 1.4, .8, 1, 'star');
    call(lt > 3.2 && lt < 5.6 ? 'スターライト・ハーモニー！' : '');
    lines.mode = lt > 3.6 && lt < 5.5 ? 'focus' : null; lines.color = '255,240,200'; lines.amount = 1;
    camPath(lt, [[0,[0,2.4,7],[0,2.4,1.6]], [3.4,[0,2.6,6.4],[0,2.8,0]], [5.5,[4,4,7],[0,6,-6]], [7.4,[2,3,3],[0,2.8,-3.2]], [10.5,[1.4,3,1.6],[0,3,-3.2]]]); },
  lines:[L(.5,'hikari','みんなの光を一つに！',"لنجمع نور الجميع في واحد!","Let's unite everyone's light!",2.5), L(3.2,'hikari','スターライト・ハーモニー！','تناغم ضوء النجوم!','Starlight Harmony!',2.2), L(7,'yomi','あたたかい…','دافئ...','So warm...',2.2)],
  ev:[[3.6, () => Sound.beam(1.9)], [5.5, () => { flash(1); Sound.shine(); ring(V(0,9,-10),0xffd75e,18,1.4,false); A.shake(.5); }]] },
{ dur:12.5, stage:'street', tod:'dawn', todFrom:'night', mood:'ed', yomiGood:true,
  run(lt){ const h = place('hikari', rf(-1,1), .2, lt > 3 && lt < 6.2 ? 'peace' : 'idle', lt), y = place('yomi', rf(.4,.6), -.1, 'idle', lt), m = place('mina', rf(1.7,1.4), -.3, 'idle', lt);
    y.rig.position.y = 0; setFace(h, 'happy', 'smile'); setFace(y, lt < 2.6 ? 'normal' : 'happy', 'smile'); setFace(m, 'happy', 'smile');
    const k = place('kon', rf(-.2,2.2), 0, 'idle', lt); setFace(k, 'happy', 'smile');
    camPath(lt, off(RB, [[0,[0,2.6,7],[.2,2.4,1]], [8.8,[0,2.6,6.2],[.2,2.5,1]], [9,[0,2,8],[0,8,-30]], [12.5,[0,2.4,9],[0,10,-30]]])); },
  lines:[L(.6,'yomi','ありがとう、ヒカリ。','شكراً يا هيكاري.','Thank you, Hikari.',2.2), L(3,'hikari','これからはずっと友達だよ！','من الآن فصاعداً سنبقى صديقات دائماً!',"From now on, we'll always be friends!",3), L(6.4,'kon','一件落着だコン！','انتهى كل شيء على خير!',"All's well that ends well, kon!",2.4), L(9,'narr','こうして、街に再び朝が来た。','وهكذا، جاء الصباح من جديد إلى المدينة.','And so, morning came to the town once again.',3.4)], ev:[] },
A.NEXT(ep5, true) ];

return [ep1, ep2, ep3, ep4, ep5];
};
