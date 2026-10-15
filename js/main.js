// =============================================
//  ユキダマッチ  画面と試合の進行（CPU戦・あいことば対戦・観戦）
// =============================================
(function () {
  const C = YD.C, $ = id => document.getElementById(id), In = YD.In, S = YD.S;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  if (In.kind === 'touch') document.body.classList.add('touch');
  function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
  const R = new YD.Render($('view')); In.bindCanvas(R.r.domElement);
  YD._debug = { R };
  YD.KO_WAIT = 7000;
  const LVN = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい' };
  // 試合の進行用の乱数（3D表示が使う乱数とは別にしておく）
  const RND = YD.rng((Math.random() * 1e9) | 0);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RND() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- 特技えらび ----------
  let mySkill = ls.get('yd_skill', 'dash'); if (!C.SKILLS[mySkill]) mySkill = 'dash';
  function skillUI() {
    $('sk-row').innerHTML = Object.entries(C.SKILLS).map(([k, v]) => `<button class="sk ${k === mySkill ? 'on' : ''}" data-k="${k}"><span>${v.icon}</span>${v.name}</button>`).join('');
    $('sk-desc').textContent = C.SKILLS[mySkill].desc + `（${C.SKILLS[mySkill].cd}秒ごと）`;
    $('sk-row').querySelectorAll('.sk').forEach(b => b.onclick = () => { mySkill = b.dataset.k; ls.set('yd_skill', mySkill); S.ui(); skillUI(); });
    $('sk-ic').textContent = $('tsk-ic').textContent = C.SKILLS[mySkill].icon;
  }
  skillUI();
  let myAv = ls.get('yd_av', 'male-a'); if (!YD.AV.includes(myAv)) myAv = 'male-a';
  function avUI() {
    $('av-row').innerHTML = YD.AV.map(k => `<button class="av ${k === myAv ? 'on' : ''}" data-k="${k}"><img src="${YD.url('th/' + k + '.webp')}" alt=""></button>`).join('');
    $('av-row').querySelectorAll('.av').forEach(b => b.onclick = () => { myAv = b.dataset.k; ls.set('yd_av', myAv); S.ui(); avUI(); if (idle) R.setAvatars([myAv, idle.av1]); });
    const row = $('av-row'), on = row.querySelector('.on'); if (on) requestAnimationFrame(() => { row.scrollLeft = Math.max(0, on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2); });
  }
  avUI();
  // ---------- だれかと対戦（ランダム対戦） ----------
  QM.setup({
    game: 'yukidama', ver: 'v1', name: 'ユキダマッチ',
    getDb, anchor: '#btn-online', anchorUp: 1, wrapClass: 'row2', anchorWhere: 'before', btnClass: 'btn on-btn', nextClass: 'btn', nameKey: 'yd_name',
    join: (code, name) => {
      // ランダム対戦のあいことばで、いつものあいことばを上書きしないようにもどす
      const keep = ls.get('yd_code', '');
      $('in-name').value = name; $('in-code').value = code; $('btn-join').click();
      setTimeout(() => { ls.set('yd_code', keep); $('in-code').value = keep; }, 60);
    },
    cpu: () => document.querySelector('.lv[data-lv="normal"]').click(), cpuLabel: 'CPU（ふつう）と遊びながら待つ',
    quit: () => toTitle(),
    colors: { main: 'var(--cta)', alt: 'var(--blue)', bg: '#f7fbff', fg: 'var(--ink)' },
  });
  QM.resultSlot('#ov-result .card', '#btn-title');
  // 素材の読みこみ
  const lvBtns = [...document.querySelectorAll('.lv'), $('btn-online'), $('qm-btn')]; lvBtns.forEach(b => { b.disabled = true; });
  YD.onAssetProg = p => { $('load-p').textContent = Math.round(p * 100) + '%'; };
  const assetsP = YD.loadAssets().then(() => { R.useAssets(); R.setAvatars([myAv, otherAv(myAv)]); idle = null; $('loading').classList.add('done'); lvBtns.forEach(b => { b.disabled = false; }); });
  setTimeout(() => { lvBtns.forEach(b => { b.disabled = false; }); $('loading').classList.add('done'); }, 15000);
  function otherAv(a) { const L = YD.AV.filter(k => k !== a); return L[(RND() * L.length) | 0]; }
  // 最初にさわったら音を出せるようにして、タイトルの曲
  const firstTouch = () => { YD.audio(); if (!G) YD.bgm.start('title'); removeEventListener('pointerdown', firstTouch); removeEventListener('keydown', firstTouch); };
  addEventListener('pointerdown', firstTouch); addEventListener('keydown', firstTouch);
  YD.onStep = p => { if (!G || !G.w) return; const mine = p.slot === G.me && !p.decoy; S.step(mine ? 0.8 : volOf(p.x, p.z) * 0.9, mine ? null : panOf(p.x, p.z)); };

  // ---------- 試合の状態 ----------
  let G = null, room = null, idle = null;
  const G0 = { names: [null, null] };
  const enemyOf = () => G && G.me >= 0 ? 1 - G.me : -1;
  function enterGame() { show('s-game'); document.body.classList.add('playing'); In.active = G.me >= 0; In.clear(); YD.audio(); YD.bgm.start('bgm'); R.setAvatars(G.avs || [myAv, otherAv(myAv)]); ['ov-result', 'ov-pause'].forEach(id => $(id).classList.remove('show')); idle = null; }
  function startCpu(lv) {
    G = { mode: 'cpu', lv, me: 0, sc: [0, 0], round: 0, stats: { hit: 0, dmg: 0, taken: 0 }, thAll: 0, paused: false, stOrder: shuffle(YD.STAGE_KEYS), cpuSkill: shuffle(Object.keys(C.SKILLS))[0], names: ['あなた', 'CPU（' + LVN[lv] + '）'], avs: [myAv, otherAv(myAv)] };
    enterGame(); newRound({ seed: (RND() * 1e9) | 0, st: G.stOrder[0], round: 1 });
    lockPointer();
  }
  function newRound(o) {
    if (G.w && G.me >= 0) G.thAll += G.w.players[G.me].stats.th;
    G.round = o.round;
    const auth = G.mode === 'cpu' ? [true, true] : [G.me === 0, G.me === 1];
    const w = new YD.World(o.seed, auth, o.st);
    if (G.me >= 0) w.players[G.me].skill = mySkill;
    if (G.mode === 'cpu') { w.players[1].skill = G.cpuSkill; G.cpu = new YD.Cpu(1, G.lv, o.seed); }
    if (G.mode === 'net') { w.net = netHooks(w); G.buf = { 0: [], 1: [] }; G.sendT = 0; }
    G.w = w; G.yaw = G.me >= 0 ? w.players[G.me].yaw : 0; G.pitch = -0.05; G.phase = 'count'; G.koT = 0; G.hs = 0; G.lastCount = 4;
    G.snaps = []; G.snapHits = []; G.rp = null; G.rpDone = false; G.spawned = {}; G.warnPair = null; G.koDone = false; G.resultPending = null;
    R.build(w); R.pivY = null; document.body.classList.remove('replay'); $('rp-tag').classList.remove('show');
    $('h-round').textContent = 'ラウンド' + G.round; pips();
    const W1 = C.WIN - 1, mine = G.me >= 0 ? G.sc[G.me] : -1, his = G.me >= 0 ? G.sc[1 - G.me] : -1;
    banner('ラウンド' + G.round, w.map.name + '　' + (G.sc[0] === W1 && G.sc[1] === W1 ? 'これで決まる！' : mine === W1 ? 'あと1本！' : his === W1 ? 'あとがない！' : ''), 1500);
    YD.bgm.start('bgm'); YD.bgm.mode('play');
    $('names').classList.toggle('show', G.mode === 'net'); $('names').innerHTML = `<span>${esc(G.names[0] || '')}</span><span>${esc(G.names[1] || '')}</span>`;
    document.body.classList.toggle('watch', G.me < 0);
  }
  function pips() { for (const [id, s] of [['pips-me', 0], ['pips-foe', 1]]) $(id).innerHTML = Array.from({ length: C.WIN }, (_, i) => `<i class="${i < G.sc[s] ? 'on' : ''}"></i>`).join(''); }
  function lockPointer() { if (In.kind !== 'touch' && G && G.me >= 0) { try { const r = R.r.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} } }

  // ---------- 表示の小物 ----------
  let banTm = 0, msgTm = 0;
  function banner(t, sub, ms = 1300) { const b = $('banner'); b.innerHTML = esc(t) + (sub ? `<small>${esc(sub)}</small>` : ''); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); clearTimeout(banTm); banTm = setTimeout(() => b.classList.remove('show'), ms); }
  function msg(t) { const m = $('msg'); m.textContent = t; m.classList.add('show'); clearTimeout(msgTm); msgTm = setTimeout(() => m.classList.remove('show'), 1700); }
  YD.toast = msg;
  let popN = 0;
  function pop(x, y, z, text, cls) { const p = R.project(x, y, z); if (!p.on) return; const el = document.createElement('div'); el.className = 'pop ' + (cls || ''); el.textContent = text; el.style.left = p.x + ((popN++ % 5) - 2) * 7 + 'px'; el.style.top = p.y + 'px'; $('pops').appendChild(el); setTimeout(() => el.remove(), 800); }
  function flash(id, ms) { const e = $(id); if (!e) return; e.style.transition = 'none'; e.style.opacity = 1; void e.offsetWidth; e.style.transition = ''; setTimeout(() => { e.style.opacity = 0; }, ms || 60); }
  function hitmark(ar) { const h = $('hitmark'); h.classList.toggle('ar', !!ar); h.classList.remove('show'); void h.offsetWidth; h.classList.add('show'); }
  const ammoEl = $('ammo'); ammoEl.innerHTML = Array.from({ length: C.MAG }, (_, i) => { const a = -Math.PI / 2 + (i - (C.MAG - 1) / 2) * 0.32 + Math.PI; return `<b style="transform:translate(${Math.cos(a) * 24}px,${Math.sin(a) * 24}px)"></b>`; }).join('');
  const panOf = (x, z) => { const e = R.cam.matrixWorld.elements, rx = e[0], rz = e[2], dx = x - R.camPos.x, dz = z - R.camPos.z, d = Math.hypot(dx, dz) || 1; return (dx * rx + dz * rz) / d * 0.8; };
  const volOf = (x, z) => Math.max(0.15, 1 - Math.hypot(x - R.camPos.x, z - R.camPos.z) / 40);

  // ---------- ねらい ----------
  function aimPoint(w, me) {
    const p = R.camPos, f = R.camFwd, st = 3.9, far = 90;
    const ax = p.x + f.x * st, ay = p.y + f.y * st, az = p.z + f.z * st, bx = p.x + f.x * far, by = p.y + f.y * far, bz = p.z + f.z * far;
    const r = YD.ray(w.map, ax, ay, az, bx, by, bz, w.t);
    let pt = { x: ax + (bx - ax) * r.t, y: ay + (by - ay) * r.t, z: az + (bz - az) * r.t }, lock = false;
    In.slowK = 1; G.pull = null;
    // 吸いつく相手：本物＋にせ雪だるま（見分けはつかない）
    const cands = [w.players[1 - me.slot]].concat(w.decoys.filter(d => d.own !== me.slot));
    let best = null, bang = C.ASSIST[In.kind] || C.ASSIST.mouse;
    for (const q of cands) {
      if (!q.alive) continue;
      const fc = q.chest(), dx = fc.x - p.x, dy = fc.y - p.y, dz = fc.z - p.z, d = Math.hypot(dx, dy, dz);
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * f.x + dy * f.y + dz * f.z) / d))) * 180 / Math.PI;
      if (ang < bang && d < 60 && Math.hypot(pt.x - p.x, pt.y - p.y, pt.z - p.z) > d - 1.5 && YD.los(w.map, me.hand(), fc, w.t)) { bang = ang; best = { q, fc, dx, dy, dz, d }; }
    }
    if (best) {
      const { q, fc } = best, B = me.ice > 0 ? C.ICE : C.BALL, tt = Math.hypot(fc.x - me.x, fc.z - me.z) / B.v;
      pt = { x: fc.x + q.vx * tt * 0.75, y: fc.y, z: fc.z + q.vz * tt * 0.75 }; lock = true;
      if (In.kind !== 'mouse') { In.slowK = 0.55; G.pull = best; }
    }
    return { pt, lock };
  }

  // ---------- 1コマ ----------
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const rdt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G || !G.w) { idleFrame(rdt); return; }
    if (G.paused) { R.frame(G.w, view(), 0); return; }
    if (G.rp) { replayFrame(rdt); return; }
    const w = G.w, me = G.me >= 0 ? w.players[G.me] : null;
    // スロー（KO・もこもこが割れた瞬間）。オンラインは時間を止められないので、ゆれと光だけ
    if (G.phase === 'ko') G.koT += rdt;
    let ts = 1;
    if (G.mode === 'cpu') { if (G.phase === 'ko' && G.koT < 0.9) ts = 0.3; if (G.hs > 0) { G.hs -= rdt; ts = Math.min(ts, 0.25); } }
    const dt = rdt * ts;
    // 入力
    const raw = In.read(rdt);
    let I = null, A = { pt: null, lock: false };
    if (me) {
      G.yaw += raw.dyaw; G.pitch = YD.clamp(G.pitch + raw.dpitch, -1.05, 0.95);
      A = aimPoint(w, me);
      if (raw.fire && G.pull && G.phase === 'play') { const want = Math.atan2(-G.pull.dx, -G.pull.dz); let d = want - G.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; G.yaw += d * Math.min(1, rdt * 2.5); }
      $('cross').classList.toggle('lock', A.lock);
      const playing = G.phase === 'play';
      I = { mx: playing ? raw.mx : 0, mz: playing ? raw.mz : 0, yaw: G.yaw, pitch: G.pitch, fire: raw.fire && playing, firePress: raw.firePress, jump: raw.jump && playing, jumpHeld: raw.jumpHeld, slide: raw.slide && playing, heal: raw.heal && playing, reload: raw.reload, skill: raw.skill && playing, aim: A.pt };
      if (raw.firePress && me.alive && playing && me.mag <= 0 && me.ice <= 0 && me.reload > 0) S.empty();
      if (raw.skill && playing && me.cd > 0) { S.no(); msg('特技はあと ' + Math.ceil(me.cd) + ' 秒'); }
      if (YD._debug.auto) { if (!G.cpu0 || G.cpu0.w0 !== w) { G.cpu0 = new YD.Cpu(G.me, YD._debug.auto, 11 + G.me); G.cpu0.w0 = w; } I = G.cpu0.input(w, dt); if (G.phase !== 'play') { I.fire = false; I.mx = I.mz = 0; I.skill = false; } if (YD._debug.smooth) { let d = I.yaw - G.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; G.yaw += d * Math.min(1, rdt * YD._debug.smooth); G.pitch += (I.pitch * 0.5 - 0.06 - G.pitch) * Math.min(1, rdt * 4); } else { G.yaw = I.yaw; G.pitch = I.pitch; } }
    }
    const ins = [null, null];
    if (me) ins[G.me] = I;
    if (G.mode === 'cpu') { const ci = G.cpu.input(w, dt); if (G.phase !== 'play') { ci.fire = false; ci.mx = ci.mz = 0; ci.skill = false; } ins[1] = ci; }
    // 時間（オンラインは、ふたりとも同じ時計から計算する）
    const t0 = w.t;
    if (G.mode === 'net') { remoteApply(w); w.t = (room.now() - G.startAt) / 1000 - C.COUNT; }
    const sdt = G.mode === 'net' ? Math.max(0, Math.min(0.1, w.t - t0)) : dt;
    w.update(sdt, ins);
    if (G.mode === 'cpu') w.t += sdt;
    // カウント
    if (G.phase === 'count') {
      const n = Math.ceil(-w.t); if (n !== G.lastCount && n >= 1 && n <= 3) { G.lastCount = n; banner(String(n), '', 700); S.count(); }
      if (w.t >= 0) { G.phase = 'play'; banner('ファイト！', '', 700); S.go(); }
    }
    worldSounds(w, t0);
    events(w);
    if (G.mode === 'net' && me) { G.sendT -= rdt; if (G.sendT <= 0) { G.sendT = 1 / 15; room.sendState(me); } }
    if (w.over && !G.koDone) { G.koDone = true; G.phase = 'ko'; G.koT = 0; onKo(w.over.loser); }
    if (G.phase === 'play' || (G.phase === 'ko' && G.koT < 1)) snap(w);
    if (G.phase === 'ko' && G.koT > 1.15 && !G.rpDone) startReplay();
    hud(w, me);
    R.frame(w, view(), sdt || dt);
    bars(w);
  }
  function view() { const w = G.w, me = G.me >= 0 ? w.players[G.me] : null; return me ? { me, yaw: G.yaw, pitch: G.pitch, dead: !me.alive } : { free: true }; }
  function idleFrame(dt) {
    // タイトルの後ろ：CPUどうしが遊んでいる
    if (!idle) { const st = YD.STAGE_KEYS[(RND() * 3) | 0]; idle = { av1: (R.avs && R.avs[1]) || otherAv(myAv), w: new YD.World((RND() * 1e6) | 0, [true, true], st), c: [new YD.Cpu(0, 'normal', 3), new YD.Cpu(1, 'normal', 4)] }; idle.w.t = 0; idle.w.players[0].skill = 'decoy'; idle.w.players[1].skill = 'wall'; R.setAvatars([myAv, idle.av1]); R.build(idle.w); }
    const w = idle.w; w.update(dt, [idle.c[0].input(w, dt), idle.c[1].input(w, dt)]); w.t += dt; w.fx.length = 0;
    if (w.over || w.t > 70) { idle = null; return; }
    R.frame(w, { free: true }, dt);
  }

  // ---------- リプレイ（決着の前の2秒を、ゆっくり別の角度から） ----------
  function snap(w) {
    const P = w.players.map(p => ({ x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, vx: p.vx, vy: p.vy, vz: p.vz, hp: p.hp, ar: p.ar, alive: p.alive, slide: p.slide, heal: p.heal ? { k: p.heal.k } : null, climb: !!p.climb, ground: p.ground, reload: p.reload, throwN: p.throwN, ice: p.ice, mag: p.mag }));
    const B = w.balls.map(b => ({ id: b.id, x: b.x, y: b.y, z: b.z, ice: b.ice }));
    const D = w.decoys.map(d => ({ id: d.id, own: d.own, x: d.x, y: d.y, z: d.z, yaw: d.yaw, vx: d.vx, vz: d.vz, alive: d.alive, showHp: d.showHp, showAr: d.showAr, decoy: true, pitch: 0, ground: true, throwN: 0, mag: 6, hp: d.hp, ar: 0 }));
    G.snaps.push({ t: w.t, P, B, D, H: G.snapHits, sm: w.map.smokes.slice() }); G.snapHits = [];
    while (G.snaps.length > 2 && G.snaps[G.snaps.length - 1].t - G.snaps[0].t > 3.2) G.snaps.shift();
  }
  function startReplay() {
    G.rpDone = true;
    const sn = G.snaps; if (sn.length < 10) { endReplay(); return; }
    const koT = G.w.over ? G.w.over.t : sn[sn.length - 1].t, t0 = Math.max(sn[0].t, koT - 2.0), t1 = Math.min(sn[sn.length - 1].t, koT + 0.6);
    const loser = G.w.over ? G.w.over.loser : 1, ghosts = [0, 1].map(s => Object.assign(Object.create(YD.Player.prototype), G.w.players[s]));
    let i = 0; while (i < sn.length - 2 && sn[i + 1].t <= t0) i++;
    G.rp = { t: t0, t0, t1, i, loser, ghosts, shooter: 1 - loser };
    R.hideLiveBalls(); R.cineSnap = true; document.body.classList.add('replay'); $('rp-tag').classList.add('show'); In.unlock();
    $('foebars').innerHTML = ''; $('foeheal').style.display = 'none';
  }
  function replayFrame(rdt) {
    const rp = G.rp, w = G.w; rp.t += rdt * 0.5;
    if (rp.t >= rp.t1) { endReplay(); return; }
    const sn = G.snaps; while (rp.i < sn.length - 2 && sn[rp.i + 1].t <= rp.t) { rp.i++; for (const h of sn[rp.i].H) { R.parts.burst(h.x, h.y, h.z, 18, { sp: 4.5, sz: 0.08, c: h.ice ? '#bff0ff' : '#ffffff', life: 0.6 }); S.splat(0.6); } }
    const s = sn[rp.i];
    s.P.forEach((p, i) => Object.assign(rp.ghosts[i], p, { climb: p.climb ? {} : null, slot: i }));
    const fake = { t: s.t, map: w.map, players: rp.ghosts, balls: [], decoys: s.D, taken: w.taken, pending: {}, fx: [] };
    R.replayBalls(s.B);
    const v = rp.ghosts[rp.loser], k = rp.ghosts[rp.shooter], dx = v.x - k.x, dz = v.z - k.z, d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d;
    const side = (rp.t - rp.t0) * 0.35 + 0.6, span = Math.min(d, 14);
    const at = { x: v.x - nx * span * 0.25, y: v.y + 1.0, z: v.z - nz * span * 0.25 };
    // かべにじゃまされない位置をさがす（横・反対の横・高い所）
    if (!rp.cam || rp.camT <= 0) {
      rp.camT = 0.6; const sideK = rp.cam && rp.cam.k ? rp.cam.k : 1; rp.cam = null;
      for (const [k, up, back] of [[sideK, 2.4, 1], [-sideK, 2.4, 1], [sideK, 4.5, 0.8], [-sideK, 4.5, 0.8], [0, 7, 0.6]]) {
        const f = { x: v.x - nx * (span * 0.45 + 2.5) * back - nz * k * Math.cos(side) * 4.5, y: v.y + up, z: v.z - nz * (span * 0.45 + 2.5) * back + nx * k * Math.cos(side) * 4.5 };
        f.x = YD.clamp(f.x, -18.5, 18.5); f.z = YD.clamp(f.z, -18.5, 18.5);
        if (YD.los(w.map, f, { x: v.x, y: v.y + 1, z: v.z }, s.t)) { rp.cam = { k, up, back }; break; }
      }
      if (!rp.cam) rp.cam = { k: 0, up: 7, back: 0.6 };
    }
    rp.camT -= rdt;
    const c = rp.cam, sw = c.k ? Math.cos(side) * c.k : 0;
    const from = { x: v.x - nx * (span * 0.45 + 2.5) * c.back - nz * sw * 4.5, y: v.y + c.up, z: v.z - nz * (span * 0.45 + 2.5) * c.back + nx * sw * 4.5 };
    from.x = YD.clamp(from.x, -18.5, 18.5); from.z = YD.clamp(from.z, -18.5, 18.5);
    R.frame(fake, { cine: { from, at }, decoys: s.D, smokes: s.sm }, rdt * 0.5);
  }
  function endReplay() {
    if (!G) return;
    G.rp = null; R.clearReplayBalls(); document.body.classList.remove('replay'); $('rp-tag').classList.remove('show');
    if (G.mode === 'cpu') { const g = G; setTimeout(() => { if (G !== g) return; if (Math.max(G.sc[0], G.sc[1]) >= C.WIN) result(); else newRound({ seed: (RND() * 1e9) | 0, st: G.stOrder[G.round % G.stOrder.length], round: G.round + 1 }); }, 450); }
    else if (G.resultPending) { const r = G.resultPending; G.resultPending = null; result(r); }
    else if (G.mode === 'net') banner('つぎのラウンドへ', '', 1200);
  }
  $('rp-tag').onclick = () => { if (G && G.rp) endReplay(); };
  R.r.domElement.addEventListener('pointerdown', () => { if (G && G.rp) endReplay(); });
  $('touch').addEventListener('touchstart', () => { if (G && G.rp) endReplay(); });

  // ---------- 溶ける・わく音 ----------
  function worldSounds(w, t0) {
    const t = w.t;
    for (const o of w.map.obs) {
      if (o.tm == null || o.dyn) continue;
      if (t0 < o.tm - C.MELT_WARN && t >= o.tm - C.MELT_WARN && o.pair !== G.warnPair) { G.warnPair = o.pair; S.warn(volOf(o.x, o.z)); }
      if (t0 < o.tm && t >= o.tm) S.melt(volOf(o.x, o.z) * 0.7);
    }
    for (const pk of w.map.picks) if (t0 < pk.t - C.PICK_WARN && t >= pk.t - C.PICK_WARN && !G.spawned[pk.t]) { G.spawned[pk.t] = 1; S.spawn(); msg({ cocoa: '☕ ココアが出るよ', kairo: '🔥 カイロが出るよ', ice: '❄ 氷玉が出るよ（まん中あたり）' }[pk.kind]); }
    if (t0 < C.ROUND_T && t >= C.ROUND_T) { banner('サドンデス', '寒さで少しずつ削れる！', 1500); S.cold(); YD.bgm.mode('hot'); }
    if (t0 < C.ROUND_T - 10 && t >= C.ROUND_T - 10) msg('あと10秒で寒さがくる');
  }
  // ---------- 起きたこと ----------
  function events(w) {
    const meS = G.me, me = meS >= 0 ? w.players[meS] : null;
    if (YD._debug.evlog) for (const e of w.fx) YD._debug.evlog.push(e.k + ':' + (e.s ?? '') + ':' + (e.kind || '') + (e.broke ? ':broke' : '') + (e.by != null ? ':by' + e.by : '') + (e.pop ? ':pop' : ''));
    for (const e of w.fx) {
      const mine = e.s === meS;
      switch (e.k) {
        case 'throw': if (mine) (e.b.ice ? S.throwIce : S.throw)(1); else (e.b.ice ? S.throwIce : S.throw)(0.6 * volOf(e.b.x, e.b.z), panOf(e.b.x, e.b.z)); R.ball(e.b); break;
        case 'splat': (e.ice ? S.splatIce : S.splat)(volOf(e.x, e.z) * 0.8, panOf(e.x, e.z)); R.parts.burst(e.x, e.y + 0.05, e.z, e.ice ? 10 : 14, { sp: 3.2, sz: 0.07, c: e.ice ? '#bff0ff' : '#ffffff', life: 0.5 }); break;
        case 'puff': R.parts.burst(e.x, e.y, e.z, 10, { sp: 3, sz: 0.07 }); break;
        case 'hit': {
          const col = e.ice ? '#bff0ff' : '#ffffff';
          R.parts.burst(e.x, e.y, e.z, 18, { sp: 4.5, sz: 0.08, c: col, life: 0.6 }); G.snapHits.push({ x: e.x, y: e.y, z: e.z, ice: e.ice });
          if (e.a > 0) R.parts.burst(e.x, e.y, e.z, 6, { sp: 3, sz: 0.06, c: '#8fe3ff', life: 0.4 });
          if (e.broke) { R.parts.burst(e.x, e.y, e.z, 40, { sp: 7, sz: 0.1, c: '#8fe3ff', life: 0.9 }); G.hs = 0.32; R.shake = Math.min(1.2, R.shake + 0.8); flash('brk', 120); }
          if (e.by === meS) { // 当てた
            G.stats.hit++; G.stats.dmg += e.d; hitmark(e.a > 0); S.marker(); (e.a > 0 ? S.hitArmor : S.hitFoe)(panOf(e.x, e.z));
            pop(e.x, e.y + 0.4, e.z, e.d, e.a > 0 ? 'ar' : ''); if (e.broke) { pop(e.x, e.y + 0.9, e.z, 'パリン！', 'big'); S.broke(); }
          } else if (mine) { // 当てられた
            G.stats.taken += e.d; S.hitMe(); flash('hurt', 80); R.shake = Math.min(1, R.shake + 0.5);
            if (Math.random() < 0.6) flash('splat', 250);
            if (e.broke) { S.broke(); msg('もこもこが割れた！'); }
            const sx = -Math.sin(e.dir), sz = -Math.cos(e.dir), fx = -Math.sin(G.yaw), fz = -Math.cos(G.yaw), rx = Math.cos(G.yaw), rz = -Math.sin(G.yaw);
            const a = Math.atan2(sx * rx + sz * rz, sx * fx + sz * fz); $('dir').style.transform = `rotate(${a}rad)`; flash('dir', 500);
          } else { S.hitFoe(panOf(e.x, e.z)); if (e.broke) S.broke(); }
          break;
        }
        case 'ko': S.ko(); R.shake = 1; break;
        case 'jump': if (mine) S.jump(); break;
        case 'pad': S.pad(); break;
        case 'land': if (mine) S.land(e.v); break;
        case 'slide': if (mine) S.slide(); break;
        case 'climb': if (mine) S.climb(); break;
        case 'reload': if (mine && !e.quiet) S.reload(); break;
        case 'reloaded': if (mine) S.reloaded(); break;
        case 'pick': if (mine) { S.pick(e.kind); msg({ cocoa: '☕ ココアを拾った（回復ボタンで飲む）', kairo: '🔥 カイロを拾った（回復ボタンで使う）', ice: '❄ 氷玉！ 6発だけ強い' }[e.kind]); R.parts.burst(e.x, e.y + 0.6, e.z, 16, { sp: 3, sz: 0.06, c: '#ffe08a', g: -2 }); } else S.pickFoe(); break;
        case 'healStart': if (mine) S.healStart(); else if (e.s === enemyOf()) { const f = w.players[e.s]; S.healFoe(volOf(f.x, f.z), panOf(f.x, f.z)); msg(e.kind === 'cocoa' ? '☕ 相手がココアを飲んでいる！ いまがチャンス' : '🔥 相手がカイロをあてている！ いまがチャンス'); } break;
        case 'healDone': if (mine) S.healDone(e.kind); break;
        case 'healNo': if (mine) { S.no(); msg(me.bag.cocoa + me.bag.kairo ? 'いまは回復しなくて大丈夫' : '回復アイテムを持っていない'); } break;
        case 'skill': {
          const sk = C.SKILLS[e.kind];
          if (e.kind === 'wall') { S.wall(volOf(e.o.x, e.o.z)); R.parts.burst(e.o.x, 0.3, e.o.z, 30, { sp: 4, sz: 0.1, life: 0.7 }); }
          if (e.kind === 'smoke') S.smoke(e.sm ? volOf(e.sm.x, e.sm.z) : 1);
          if (e.kind === 'decoy' && mine) S.decoy();
          if (e.kind === 'dash') { if (mine) S.dash(1); else { const p = w.players[e.s]; S.dash(volOf(p.x, p.z) * 0.6); } }
          if (mine) msg(sk.icon + ' ' + sk.name + '！');
          break;
        }
        case 'decoyHit':
          if (e.pop) { R.parts.burst(e.x, e.y, e.z, e.fade ? 20 : 40, { sp: e.fade ? 3 : 6, sz: 0.11, life: 0.9 }); if (!e.fade) S.decoyPop(volOf(e.x, e.z)); }
          if (e.own !== meS && meS >= 0 && !e.fade) { pop(e.x, e.y + 0.6, e.z, e.pop ? 'にせもの！' : 'ん…？', 'big'); hitmark(false); S.marker(); }
          else if (e.own === meS && e.pop && !e.fade) msg('⛄ にせ雪だるまが割られた');
          break;
      }
    }
    w.fx.length = 0;
  }
  function onKo(loser) {
    if (G.mode === 'cpu') { G.sc[1 - loser]++; pips(); }
    if (G.mode === 'net' && room && G.me === loser) room.ko(loser);
    const meS = G.me, g = G;
    setTimeout(() => {
      if (G !== g) return;
      if (meS < 0) banner((G.names[1 - loser] || '') + ' が1本', '', 1400);
      else banner(loser !== meS ? 'ゆきだま！' : 'やられた…', loser !== meS ? '1本とった！' : '1本とられた', 1400);
    }, 350);
  }
  function result(o) {
    G.phase = 'over'; In.active = false; In.unlock(); YD.bgm.stop();
    const sc = o ? o.sc : G.sc, meS = G.me;
    if (meS < 0) { $('res-title').textContent = (sc[0] > sc[1] ? G.names[0] : G.names[1]) + ' の勝ち'; $('res-title').className = 'res-title win'; S.win(); }
    else { const win = sc[meS] > sc[1 - meS]; (win ? S.win : S.lose)(); $('res-title').textContent = win ? 'かち！' : 'まけ…'; $('res-title').className = 'res-title ' + (win ? 'win' : 'lose'); }
    $('res-sc').textContent = sc[0] + ' - ' + sc[1];
    const th = G.thAll + (meS >= 0 && G.w ? G.w.players[meS].stats.th : 0);
    $('res-st').innerHTML = meS < 0 ? esc((G.names[0] || '') + ' vs ' + (G.names[1] || '')) : `${G.mode === 'cpu' ? 'CPU：' + LVN[G.lv] + '<br>' : ''}当てた数 ${G.stats.hit}（命中率 ${th ? Math.round(G.stats.hit / th * 100) : 0}%）<br>あたえた雪 ${G.stats.dmg} ／ くらった雪 ${G.stats.taken}`;
    $('btn-again').style.display = meS < 0 ? 'none' : ''; $('res-wait').textContent = meS < 0 ? 'ふたりが「もう一回」をおすと、次の試合を観戦できます' : '';
    $('ov-result').classList.add('show');
  }

  // ---------- HUD ----------（変わった時だけ書きかえる＝軽い）
  const _c = {};
  const txt = (id, v) => { v = String(v); if (_c['t' + id] !== v) { _c['t' + id] = v; $(id).textContent = v; } };
  const wid = (id, v) => { v = Math.round(v) + '%'; if (_c['w' + id] !== v) { _c['w' + id] = v; $(id).style.width = v; } };
  const tog = (el, cls, on) => { const k = 'c' + (el.id || el.className) + cls; if (_c[k] !== !!on) { _c[k] = !!on; el.classList.toggle(cls, !!on); } };
  function hud(w, me) {
    const t = Math.max(0, w.t);
    tog($('tbox'), 'cold', w.t > C.ROUND_T);
    txt('h-time', w.t < 0 ? '0' : w.t > C.ROUND_T ? '寒い！' : String(Math.ceil(C.ROUND_T - t)));
    let next = null; for (const o of w.map.obs) if (o.tm != null && !o.dyn && o.tm > w.t && (!next || o.tm < next.tm)) next = o;
    const melt = next && w.t >= 0 && next.tm - w.t < 6; if (melt) txt('h-melt', '❄ かべが溶ける ' + Math.ceil(next.tm - w.t)); tog($('h-melt'), 'show', melt);
    const cold = w.t > C.ROUND_T ? '0.8' : '0'; if (_c.cold !== cold) { _c.cold = cold; $('cold').style.opacity = cold; }
    if (!me) return;
    wid('b-hp', me.hp / C.HP * 100); wid('b-ar', me.ar / C.ARMOR * 100); txt('v-hp', Math.ceil(me.hp)); txt('v-ar', Math.ceil(me.ar));
    for (const k of ['cocoa', 'kairo']) { txt('n-' + k, me.bag[k]); tog($('it-' + k), 'zero', !me.bag[k]); }
    txt('n-ice', me.ice); const iceOn = me.ice ? '' : 'none'; if (_c.ice !== iceOn) { _c.ice = iceOn; $('it-ice').style.display = iceOn; }
    const sk = C.SKILLS[me.skill]; tog($('it-sk'), 'wait', me.cd > 0); txt('sk-cd', me.cd > 0 ? Math.ceil(me.cd) : (In.kind === 'mouse' ? 'Q' : 'OK'));
    const hc = Math.round(me.cd / sk.cd * 20) * 5 + '%'; if (_c.tsk !== hc) { _c.tsk = hc; $('tsk-cd').style.height = hc; }
    const bs = ammoEl.children; for (let i = 0; i < bs.length; i++) { const c = me.ice > 0 ? (i < me.ice ? 'ice' : 'off') : (i < me.mag && me.reload <= 0 ? '' : 'off'); if (bs[i].className !== c) bs[i].className = c; }
    const rl = $('rl'); if (me.reload > 0) { const u = Math.round((1 - me.reload / C.RELOAD) * 24) / 24; tog(rl, 'on', true); if (_c.rl !== u) { _c.rl = u; rl.style.background = `conic-gradient(#fff ${u * 360}deg, rgba(255,255,255,.15) 0)`; rl.style.webkitMask = rl.style.mask = 'radial-gradient(circle, transparent 18px, #000 19px)'; } } else tog(rl, 'on', false);
    const hb = $('healbar'); tog(hb, 'show', !!me.heal); if (me.heal) { txt('heal-name', me.heal.k === 'cocoa' ? '☕ ココアを飲んでいる…（受ける雪 2割へる）' : '🔥 カイロをあてている…（受ける雪 2割へる）'); wid('heal-p', me.heal.t / me.heal.T * 100); }
    const low = me.hp <= C.HP * 0.3 && me.alive; tog($('hurt'), 'low', low);
    if (low) $('hurt').style.opacity = (0.35 + 0.2 * Math.sin(performance.now() / 200)).toFixed(2); else if (_c.low) $('hurt').style.opacity = 0;
    _c.low = low;
  }
  // 相手の頭の上のゲージ（にせ雪だるまにも出す＝見分けがつかない）
  function bars(w) {
    const list = [], meS = G.me, nm = s => (G.mode === 'net' && meS < 0 ? G.names[s] || '' : '');
    for (const p of w.players) if (p.slot !== meS && p.alive) list.push({ q: p, hp: p.hp, ar: p.ar, name: nm(p.slot) });
    for (const d of w.decoys) if (d.own !== meS && d.alive) list.push({ q: d, hp: d.showHp, ar: d.showAr, name: nm(d.own) });
    const box = $('foebars');
    while (box.children.length < list.length) { const el = document.createElement('div'); el.innerHTML = '<em></em><div class="ar"><i></i></div><div class="hp"><i></i></div>'; box.appendChild(el); }
    [...box.children].forEach((el, i) => {
      const it = list[i]; if (!it) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
      const q = it.q, p = R.project(q.x, q.y + (q.top || C.PH) + 0.45, q.z);
      if (!p.on || !YD.los(w.map, R.camPos, q.chest(), w.t)) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
      if (el.style.display !== 'flex') el.style.display = 'flex';
      el.style.transform = `translate(${p.x | 0}px, ${p.y | 0}px) translate(-50%, -100%)`;
      if (el.children[0].textContent !== it.name) el.children[0].textContent = it.name;
      const a1 = Math.round(it.ar / C.ARMOR * 100) + '%', h1 = Math.round(it.hp / C.HP * 100) + '%';
      if (el.children[1].firstChild.style.width !== a1) el.children[1].firstChild.style.width = a1; if (el.children[2].firstChild.style.width !== h1) el.children[2].firstChild.style.width = h1;
    });
    // 回復中マーク（かべの向こうでも）
    const fh = $('foeheal'); let shown = false;
    for (const f of w.players) {
      if (f.slot === meS || !f.alive || !f.heal || Math.hypot(f.x - R.camPos.x, f.z - R.camPos.z) > 40) continue;
      const q = R.project(f.x, f.y + f.top + 0.95, f.z); if (!q.on) continue;
      fh.style.display = 'flex'; fh.style.left = q.x + 'px'; fh.style.top = q.y + 'px'; $('fh-ic').textContent = f.heal.k === 'cocoa' ? '☕' : '🔥'; $('fh-p').style.width = (f.heal.t / f.heal.T * 100) + '%';
      fh.classList.toggle('wall', !YD.los(w.map, R.camPos, f.chest(), w.t)); shown = true; break;
    }
    if (!shown && fh.style.display !== 'none') fh.style.display = 'none';
  }

  // ---------- オンライン ----------
  function netHooks(w) {
    const ok = () => G && G.w === w && room;
    return {
      sendThrow: b => ok() && room.sendThrow(b),
      sendHit: (to, d, dir, ice, x, y, z) => ok() && room.sendHit(to, d, dir, ice, x, y, z),
      sendSkill: (k, a) => ok() && room.sendSkill(k, a),
      sendDecoyHit: (id, d) => ok() && room.sendDecoyHit(id, d),
      claim: (pk, slot) => room.claim(pk, slot, res => { if (!(G && G.w === w)) return; if (res) w.givePick(pk, slot); else w.claimFailed(pk); })
    };
  }
  // 相手のようすを、少し前の時刻で補間して表示
  function remoteApply(w) {
    const rt = room.now() - 120;
    for (const s of [0, 1]) {
      if (s === G.me) continue;
      const B = G.buf[s]; if (!B.length) continue;
      while (B.length > 2 && B[1][0] <= rt) B.shift();
      const a = B[0], b = B[1] || B[0]; let u = 0;
      if (b !== a && b[0] > a[0]) u = Math.max(0, Math.min(1, (rt - a[0]) / (b[0] - a[0])));
      const p = w.players[s], L = i => a[i] + (b[i] - a[i]) * u;
      const ex = rt > b[0] ? Math.min(0.15, (rt - b[0]) / 1000) : 0;
      p.x = L(1) + b[6] * ex; p.y = L(2); p.z = L(3) + b[8] * ex;
      let dy = b[4] - a[4]; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; p.yaw = a[4] + dy * u; p.pitch = L(5);
      p.vx = b[6]; p.vy = b[7]; p.vz = b[8];
      const hp = b[9], ar = b[10]; if (p.predT > 0) { p.hp = Math.min(p.hp, hp); p.ar = Math.min(p.ar, ar); } else { p.hp = hp; p.ar = ar; }
      const fl = b[11]; p.ground = !!(fl & 1); p.slide = fl & 2 ? 0.5 : 0; p.climb = fl & 4 ? {} : null; p.reload = fl & 8 ? 0.5 : 0;
      if (!(fl & 16) && p.alive && w.t > 0 && !w.over) w.ko(p, 1 - s);
      const hk = b[12];
      if (hk) { const k = hk === 1 ? 'cocoa' : 'kairo', T = k === 'cocoa' ? C.COCOA.t : C.KAIRO.t; if (!p.heal || p.heal.k !== k) { p.heal = { k, t: 0, T }; w.emit({ k: 'healStart', s, kind: k }); } p.heal.t = (b[18] || 0) * T; } else p.heal = null;
      p.ice = b[13]; p.mag = b[14]; p.throwN = b[15]; p.bag.cocoa = b[16]; p.bag.kairo = b[17];
    }
  }
  const roomCb = {
    onPeople(pp) {
      G0.names = pp.names; $('on-n0').textContent = pp.names[0] || '…'; $('on-n1').textContent = pp.names[1] || '…';
      if (G && G.mode === 'net') G.names = pp.names;
      $('on-st').textContent = pp.watching ? '観戦します。試合が始まるのを待っています…' : (pp.names[0] && pp.names[1] ? 'まもなく始まります！' : '相手を待っています…（同じあいことばを入れてもらってね）');
    },
    onWatchers(n) { $('on-w').textContent = n ? '観戦 ' + n + '人' : ''; },
    onRound(info) {
      if (!G || G.mode !== 'net' || G.m !== info.m) {
        G = { mode: 'net', me: info.watching ? -1 : info.slot, m: info.m, sc: [0, 0], round: 0, stats: { hit: 0, dmg: 0, taken: 0 }, thAll: 0, names: G0.names.slice(), avs: info.avs || ['male-a', 'female-b'] };
        QM.started({ code: room && room.code, watch: !!info.watching });
        enterGame(); lockPointer();
      }
      G.sc = info.sc; G.startAt = info.startAt; if (info.avs) { G.avs = info.avs; R.setAvatars(G.avs); }
      newRound({ seed: info.seed, st: info.st, round: info.r });
    },
    onState(s, a) { if (G && G.mode === 'net' && G.buf) { const B = G.buf[s]; if (!B.length || a[0] > B[B.length - 1][0]) B.push(a); if (B.length > 30) B.shift(); } },
    onEv(s, v) {
      if (!G || G.mode !== 'net' || !G.w) return; const w = G.w, lag = Math.max(0, (room.now() - (v.s || room.now())) / 1000);
      if (v.t === 'th') w.addRemoteBall({ id: v.i, own: s, ice: !!v.k, x: v.p[0], y: v.p[1], z: v.p[2], vx: v.v[0], vy: v.v[1], vz: v.v[2], lag });
      else if (v.t === 'hit') { if (v.to === G.me) w.remoteHit(v.to, v.d, s, v.dr, !!v.k, v.p[0], v.p[1], v.p[2]); else w.emit({ k: 'hit', s: v.to, by: s, x: v.p[0], y: v.p[1], z: v.p[2], d: v.d, a: 0, ice: !!v.k, dir: v.dr }); }
      else if (v.t === 'sk') w.applySkill(s, v.k, v.a || {}, Math.min(0.5, lag));
      else if (v.t === 'dh') w.remoteDecoyHit(v.i, v.d);
    },
    onPicks(map) {
      if (!G || G.mode !== 'net' || !G.w) return; const w = G.w;
      for (const id in map) { if (w.taken[id] != null || map[id] === G.me) continue; const pk = w.map.picks[id]; if (!pk) continue; w.taken[id] = map[id]; delete w.pending[id]; w.emit({ k: 'pick', s: map[id], kind: pk.kind, id: pk.id, x: pk.x, y: pk.y || 0, z: pk.z }); }
    },
    onKo(l) {
      if (!G || G.mode !== 'net' || !G.w) return; const w = G.w;
      if (!w.over) { const p = w.players[l]; p.hp = 0; w.ko(p, 1 - l); }
      if (G.koCounted !== G.round) { G.koCounted = G.round; G.sc[1 - l]++; pips(); }
    },
    onOver(o) {
      if (!G || G.mode !== 'net' || o.gone) return;
      G.sc = o.sc; pips();
      if (G.rp || (G.phase === 'ko' && !G.rpDone)) G.resultPending = o; else result(o);
    },
    onLeft() {
      // ランダム対戦：相手が抜けたら、残った人の勝ち
      if (QM.isRandom() && room && room.slot >= 0) {
        if (G && G.mode === 'net' && G.phase !== 'over') {
          G.phase = 'over'; In.active = false; In.unlock(); YD.bgm.stop(); $('ov-pause').classList.remove('show');
          S.win(); $('res-title').textContent = 'かち！'; $('res-title').className = 'res-title win';
          $('res-sc').textContent = G.sc[0] + ' - ' + G.sc[1]; $('res-st').textContent = '相手が抜けたので、あなたの勝ち！';
          $('btn-again').style.display = 'none'; $('res-wait').textContent = ''; $('ov-result').classList.add('show');
        } else { $('res-wait').textContent = '相手が部屋から出ました'; $('btn-again').style.display = 'none'; }
        return;
      }
      msg(G && G.me < 0 ? 'プレイヤーが部屋から出ました' : '相手が部屋から出ました');
      if (G && G.mode === 'net') { G = null; document.body.classList.remove('playing', 'replay', 'watch'); ['ov-result', 'ov-pause'].forEach(id => $(id).classList.remove('show')); In.active = false; In.unlock(); YD.bgm.stop(); show('s-online'); $('on-form').style.display = 'none'; $('on-wait').style.display = ''; }
      if (room && room.slot >= 0) room.rematch();
      $('on-st').textContent = room && room.watching ? '観戦します。試合が始まるのを待っています…' : '相手を待っています…（同じあいことばを入れてもらってね）';
    }
  };
  function loadScript(src) { return new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = () => rej(new Error('通信できませんでした。電波のよいところでもう一度ためしてください')); document.head.appendChild(el); }); }
  async function getDb() {
    if (YD._db) return YD._db;
    const v = '10.12.2';
    if (!window.firebase || !firebase.database) { await loadScript('https://www.gstatic.com/firebasejs/' + v + '/firebase-app-compat.js'); await loadScript('https://www.gstatic.com/firebasejs/' + v + '/firebase-database-compat.js'); }
    if (!firebase.apps.length) firebase.initializeApp(YD.FIREBASE_CONFIG);
    return YD._db = firebase.database();
  }
  $('in-name').value = ls.get('yd_name', ''); $('in-code').value = ls.get('yd_code', '');
  $('btn-online').onclick = () => { S.ui(); show('s-online'); $('on-form').style.display = ''; $('on-wait').style.display = 'none'; };
  $('btn-join').onclick = async () => {
    const name = $('in-name').value.trim(), code = YD.cleanCode($('in-code').value);
    if (!code) { msg('あいことばを入れてください'); return; }
    ls.set('yd_name', name); ls.set('yd_code', $('in-code').value);
    $('btn-join').disabled = true; YD.audio();
    try {
      const db = await getDb(); if (room) room.leave();
      room = new YD.Room(db, code, name, roomCb, myAv); const r = await room.join();
      $('on-form').style.display = 'none'; $('on-wait').style.display = '';
      if (r.watching) $('on-st').textContent = '観戦します。試合が始まるのを待っています…';
    } catch (e) { msg(e.message || '入れませんでした'); room = null; }
    $('btn-join').disabled = false;
  };
  $('btn-on-back').onclick = () => { QM.ended(); if (room) { room.leave(); room = null; } show('s-title'); };

  // ---------- ボタン ----------
  document.querySelectorAll('.lv').forEach(b => b.onclick = () => { S.ui(); if (room) { room.leave(); room = null; } startCpu(b.dataset.lv); });
  $('btn-howto').onclick = () => $('ov-howto').classList.add('show');
  $('btn-howto-close').onclick = () => $('ov-howto').classList.remove('show');
  $('snd-name').textContent = YD.mute() ? 'なし' : 'あり';
  $('btn-snd').onclick = () => { const m = !YD.mute(); YD.mute(m); $('snd-name').textContent = m ? 'なし' : 'あり'; };
  $('in-sens').value = In.sens; $('sens-v').textContent = In.sens.toFixed(1);
  $('in-sens').oninput = e => { In.setSens(parseFloat(e.target.value)); $('sens-v').textContent = In.sens.toFixed(1); };
  function pause(on) {
    if (!G || G.phase === 'over') return;
    if (G.mode === 'cpu') G.paused = on;
    $('ov-pause').classList.toggle('show', on); In.clear();
    $('btn-quit').textContent = G.mode === 'net' ? '部屋を出る' : 'タイトルへ';
    if (!on) lockPointer();
  }
  $('btn-pause').onclick = () => pause(true);
  $('btn-resume').onclick = () => pause(false);
  In.onLock = locked => { if (!locked && G && !G.paused && G.phase !== 'over' && !G.rp && In.kind === 'mouse' && G.me >= 0) pause(true); };
  function toTitle() { QM.ended(); if (room) { room.leave(); room = null; } G = null; In.active = false; In.unlock(); YD.bgm.start('title'); document.body.classList.remove('playing', 'replay', 'watch'); ['ov-pause', 'ov-result'].forEach(id => $(id).classList.remove('show')); idle = null; show('s-title'); }
  $('btn-quit').onclick = toTitle; $('btn-title').onclick = toTitle;
  $('btn-again').onclick = () => {
    if (G && G.mode === 'net' && room) { room.rematch(); $('res-wait').textContent = '相手を待っています…'; $('btn-again').style.display = 'none'; return; }
    const lv = G.lv; $('ov-result').classList.remove('show'); startCpu(lv);
  };
  addEventListener('touchstart', () => { if (In.kind !== 'touch') { In.kind = 'touch'; document.body.classList.add('touch'); } }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.phase !== 'over' && G.mode === 'cpu') pause(true); });
  YD._debug.G = () => G; YD._debug.room = () => room; YD._debug.startCpu = startCpu;
  requestAnimationFrame(loop);
})();
