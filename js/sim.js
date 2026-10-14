// =============================================
//  ユキダマッチ  ルール本体（画面なしでも動く）
//  ・自分の手元で動かす人（自分・CPU）は auth=true。体の動き・体力はその手元が決める
//  ・雪玉の当たりは「投げた側の画面」で決める（オンラインでズレても当てた感が残る）
// =============================================
(function () {
  const C = YD.C;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const fwd = yaw => [-Math.sin(yaw), -Math.cos(yaw)];
  const rgt = yaw => [Math.cos(yaw), -Math.sin(yaw)];

  class Player {
    constructor(slot, sp) {
      this.slot = slot; this.x = sp.x; this.z = sp.z; this.y = 0; this.vx = this.vy = this.vz = 0; this.yaw = sp.yaw; this.pitch = -0.05;
      this.ground = true; this.hp = C.HP; this.ar = C.ARMOR; this.mag = C.MAG; this.reload = 0; this.fireT = 0; this.ice = 0;
      this.bag = { cocoa: 0, kairo: 0 }; this.heal = null; this.slide = 0; this.slideCD = 0; this.climb = null; this.alive = true;
      this.skill = 'dash'; this.cd = 0; this.dashT = 0; this.noFire = 0; this.sinceJump = 9; this.throwN = 0; this.landV = 0; this.stats = { th: 0, hit: 0, dmg: 0 }; this.lastHurt = -9; this.cold = 0;
    }
    get top() { return this.slide > 0 ? C.PH_SLIDE : C.PH; }
    speedH() { return Math.hypot(this.vx, this.vz); }
    hand() { const [rx, rz] = rgt(this.yaw), [fx, fz] = fwd(this.yaw); return { x: this.x + rx * 0.3 + fx * 0.25, y: this.y + (this.slide > 0 ? 0.85 : 1.42), z: this.z + rz * 0.3 + fz * 0.25 }; }
    eye() { return { x: this.x, y: this.y + (this.slide > 0 ? 0.85 : 1.5), z: this.z }; }
    chest() { return { x: this.x, y: this.y + (this.slide > 0 ? 0.6 : 1.1), z: this.z }; }
  }

  // 放物線で to にとどく速さベクトル（低い弾道）
  function launch(o, to, v, g) {
    const dx = to.x - o.x, dz = to.z - o.z, dy = to.y - o.y, d = Math.hypot(dx, dz);
    if (d < 0.05) return { x: 0, y: dy >= 0 ? v : -v, z: 0 };
    const v2 = v * v, disc = v2 * v2 - g * (g * d * d + 2 * dy * v2);
    const th = disc >= 0 ? Math.atan((v2 - Math.sqrt(disc)) / (g * d)) : Math.PI / 4;
    const c = Math.cos(th); return { x: dx / d * v * c, y: v * Math.sin(th), z: dz / d * v * c };
  }
  // ダメージ：もこもこ（アーマー）が先に減る
  function damage(p, d) {
    if (p.heal) d = Math.round(d * C.HEAL_GUARD);   // 回復中は少しかたい
    const a = Math.min(p.ar, d), had = p.ar > 0; p.ar -= a; p.hp = Math.max(0, p.hp - (d - a));
    return { d, a, broke: had && p.ar <= 0, ko: p.hp <= 0 };
  }

  class World {
    constructor(seed, auth, stage) {
      this.seed = seed; this.map = YD.makeMap(seed, stage); this.t = -C.COUNT; this.auth = auth || [true, true];
      this.players = [0, 1].map(s => new Player(s, this.map.spawns[s]));
      this.balls = []; this.ballN = 0; this.decoys = []; this.decoyN = 0; this.map.smokes = []; this.taken = {}; this.pending = {}; this.fx = []; this.over = null; this.net = null;
    }
    emit(e) { this.fx.push(e); }
    // ---------- 体の動き ----------
    stepPlayer(p, I, dt) {
      const t = this.t, M = this.map;
      p.yaw = I.yaw; p.pitch = I.pitch;
      if (!p.alive) return;
      p.fireT -= dt; p.slideCD -= dt; p.sinceJump += dt;
      if (t < 0) { p.vx = p.vz = 0; return; }   // カウント中
      p.cd = Math.max(0, p.cd - dt);
      if (I.skill && p.cd <= 0 && !p.climb) this.useSkill(p, I);
      // 回復
      if (I.heal && !p.heal && !p.climb) {
        const k = (p.ar < C.ARMOR && p.bag.kairo > 0 && !(p.hp <= C.HP / 2 && p.bag.cocoa > 0 && p.ar > 0)) ? 'kairo' : (p.hp < C.HP && p.bag.cocoa > 0) ? 'cocoa' : (p.ar < C.ARMOR && p.bag.kairo > 0) ? 'kairo' : null;
        if (k) { p.heal = { k, t: 0, T: k === 'cocoa' ? C.COCOA.t : C.KAIRO.t }; p.reload = 0; this.emit({ k: 'healStart', s: p.slot, kind: k }); }
        else this.emit({ k: 'healNo', s: p.slot });
      } else if (p.heal && (I.heal || I.jump || I.slide || I.firePress)) { p.heal = null; this.emit({ k: 'healCancel', s: p.slot }); }
      if (p.heal) {
        p.heal.t += dt;
        if (p.heal.t >= p.heal.T) {
          const k = p.heal.k; p.bag[k]--; if (k === 'cocoa') p.hp = Math.min(C.HP, p.hp + C.COCOA.hp); else p.ar = Math.min(C.ARMOR, p.ar + C.KAIRO.ar);
          p.heal = null; this.emit({ k: 'healDone', s: p.slot, kind: k });
        }
      }
      // よじ登り中
      if (p.climb) {
        const c = p.climb; c.t += dt; const u = Math.min(1, c.t / c.T), e = u < 0.6 ? u / 0.6 : 1, h = u < 0.6 ? 0 : (u - 0.6) / 0.4;
        p.y = c.y0 + (c.y1 - c.y0) * Math.sin(e * Math.PI / 2); p.x = c.x0 + (c.x1 - c.x0) * h; p.z = c.z0 + (c.z1 - c.z0) * h;
        p.vx = p.vy = p.vz = 0;
        if (u >= 1) { p.climb = null; p.ground = true; const [fx, fz] = fwd(p.yaw); p.vx = fx * 2; p.vz = fz * 2; }
        this.reloadStep(p, dt); return;
      }
      // 行きたい向き
      const [fx, fz] = fwd(p.yaw), [rx, rz] = rgt(p.yaw);
      let wx = fx * I.mz + rx * I.mx, wz = fz * I.mz + rz * I.mx; const wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; }
      const sp = C.RUN * (p.heal ? C.HEAL_SPEED : 1);
      // スライディング
      if (I.slide && p.ground && p.slide <= 0 && p.slideCD <= 0 && !p.heal) {
        let dx = p.vx, dz = p.vz, s = Math.hypot(dx, dz);
        if (s < C.SLIDE_MIN && wl > 0.2) { dx = wx; dz = wz; s = 1; }
        if (s >= 0.5 || wl > 0.2) { const v = Math.max(Math.hypot(p.vx, p.vz), C.SLIDE_V); const l = Math.hypot(dx, dz) || 1; p.vx = dx / l * v; p.vz = dz / l * v; p.slide = C.SLIDE_T; this.emit({ k: 'slide', s: p.slot }); }
      }
      if (p.slide > 0) {
        p.slide -= dt; const s = Math.hypot(p.vx, p.vz), ns = Math.max(0, s - C.SLIDE_DEC * dt);
        if (s > 0) { p.vx *= ns / s; p.vz *= ns / s; }
        // 少しだけ曲がれる
        p.vx += wx * 6 * dt; p.vz += wz * 6 * dt;
        if (p.slide <= 0 || ns < C.RUN * 0.6) { p.slide = 0; p.slideCD = C.SLIDE_CD; }
      } else if (p.dashT > 0) {
        p.dashT -= dt;
      } else if (p.ground) {
        const tx = wx * sp, tz = wz * sp, ax = tx - p.vx, az = tz - p.vz, al = Math.hypot(ax, az), m = C.GND_ACC * dt;
        if (al <= m) { p.vx = tx; p.vz = tz; } else { p.vx += ax / al * m; p.vz += az / al * m; }
      } else {
        const s0 = Math.hypot(p.vx, p.vz); p.vx += wx * C.AIR_ACC * dt; p.vz += wz * C.AIR_ACC * dt;
        const s1 = Math.hypot(p.vx, p.vz), lim = Math.max(s0, sp); if (s1 > lim) { p.vx *= lim / s1; p.vz *= lim / s1; }
      }
      // ジャンプ（スライディング中でも勢いを残して跳べる）
      if (I.jump && p.ground) {
        let onPad = null; for (const pd of M.pads) if (Math.hypot(p.x - pd.x, p.z - pd.z) < pd.r + 0.2) onPad = pd;
        p.vy = C.JUMP; p.ground = false; p.sinceJump = 0; if (p.slide > 0) { p.slide = 0; p.slideCD = C.SLIDE_CD; }
        this.emit({ k: 'jump', s: p.slot });
        if (onPad) { p.vy = C.PAD; this.emit({ k: 'pad', s: p.slot }); }
      }
      // ジャンプ台は乗るだけでも跳ねる
      if (p.ground) for (const pd of M.pads) if (Math.hypot(p.x - pd.x, p.z - pd.z) < pd.r && p.y < 0.05) { p.vy = C.PAD; p.ground = false; p.sinceJump = 0; const s = Math.max(4, Math.hypot(p.vx, p.vz)); const l = Math.hypot(p.vx, p.vz) || 1; p.vx = p.vx / l * s; p.vz = p.vz / l * s; this.emit({ k: 'pad', s: p.slot }); }
      p.vy -= C.GRAV * dt;
      // 動かす（横）
      const pos = { x: p.x + p.vx * dt, z: p.z + p.vz * dt };
      const hit = YD.pushOut(M, pos, C.PR, t, p.y, p.ground ? C.STEP : 0.05);
      if (hit && !hit.wall) {
        // かべに当たったら、その向きの速さを消す
        const vn = p.vx * hit.nx + p.vz * hit.nz; if (vn < 0) { p.vx -= vn * hit.nx; p.vz -= vn * hit.nz; }
        // よじ登り：空中で、かべに向かって進んでいて、跳んでから少しの間
        const into = -(wx * hit.nx + wz * hit.nz), up = hit.h - p.y;
        if (!p.ground && (I.jumpHeld || p.sinceJump < 0.55) && into > 0.35 && up > C.STEP && up <= C.CLIMB_MAX + (p.y > 0.3 ? 0.4 : 0)) {
          const dx = pos.x - hit.nx * (C.PR + 0.22), dz = pos.z - hit.nz * (C.PR + 0.22);
          if (YD.groundAt(M, dx, dz, C.PR * 0.55, t) >= hit.h - 0.05) {
            p.climb = { t: 0, T: C.CLIMB_T * (0.6 + 0.4 * up / 2.2), x0: pos.x, z0: pos.z, y0: p.y, x1: dx, z1: dz, y1: hit.h + 0.01 };
            p.heal = null; p.slide = 0; p.x = pos.x; p.z = pos.z; this.emit({ k: 'climb', s: p.slot }); return;
          }
        }
      } else if (hit && hit.wall) { const vn = p.vx * hit.nx + p.vz * hit.nz; if (vn < 0) { p.vx -= vn * hit.nx; p.vz -= vn * hit.nz; } }
      p.x = pos.x; p.z = pos.z;
      // たて
      const g = YD.groundAt(M, p.x, p.z, C.PR * 0.55, t), wasG = p.ground;
      p.y += p.vy * dt;
      if (p.y <= g) {
        if (!wasG && p.vy < -6) this.emit({ k: 'land', s: p.slot, v: -p.vy });
        p.y = g; p.vy = 0; p.ground = true;
      } else if (wasG && p.y - g < C.STEP && p.vy <= 0) { p.y = g; p.vy = 0; p.ground = true; }   // 下り坂・とけた所に張りつく
      else p.ground = false;
      this.reloadStep(p, dt);
      // 投げる
      if (I.fire && p.fireT <= 0 && !p.heal && I.aim) {
        if (p.ice > 0 || (p.mag > 0 && p.reload <= 0)) this.throwBall(p, I.aim);
        else if (p.mag <= 0 && p.reload <= 0) this.startReload(p);
      }
      if (I.reload && p.mag < C.MAG && p.reload <= 0 && !p.heal) this.startReload(p);
      p.noFire = I.fire ? 0 : p.noFire + dt;
      if (p.noFire > C.AUTO_RELOAD && p.mag < C.MAG && p.reload <= 0 && !p.heal) this.startReload(p, true);
    }
    startReload(p, quiet) { p.reload = C.RELOAD; this.emit({ k: 'reload', s: p.slot, quiet }); }
    reloadStep(p, dt) { if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.reload = 0; p.mag = C.MAG; this.emit({ k: 'reloaded', s: p.slot }); } } }
    throwBall(p, aim) {
      const ice = p.ice > 0, B = ice ? C.ICE : C.BALL, o = p.hand(), v = launch(o, aim, B.v, B.g);
      if (ice) p.ice--; else { p.mag--; }
      p.fireT = B.rate; p.throwN++; p.stats.th++;
      const b = { id: p.slot + ':' + (this.ballN++), own: p.slot, ice, x: o.x, y: o.y, z: o.z, vx: v.x + p.vx * 0.15, vy: v.y, vz: v.z + p.vz * 0.15, g: B.g, r: B.r, dmg: B.dmg, auth: true, age: 0 };
      this.balls.push(b); this.emit({ k: 'throw', s: p.slot, b });
      if (!ice && p.mag <= 0) this.startReload(p);
      if (this.net) this.net.sendThrow(b);
      return b;
    }
    // ネットから来た雪玉（見た目だけ。当たりは投げた側が決める）
    addRemoteBall(o) {
      const b = { id: o.id, own: o.own, ice: o.ice, x: o.x, y: o.y, z: o.z, vx: o.vx, vy: o.vy, vz: o.vz, g: o.ice ? C.ICE.g : C.BALL.g, r: o.ice ? C.ICE.r : C.BALL.r, dmg: 0, auth: false, age: 0 };
      this.emit({ k: 'throw', s: o.own, b, remote: true });
      let a = Math.min(0.4, Math.max(0, o.lag || 0)); while (a > 0 && !b.dead) { const d = Math.min(a, 1 / 60); this.stepBall(b, d); a -= d; }
      if (!b.dead) this.balls.push(b);
    }
    stepBall(b, dt) {
      const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy, b.vz) * dt / 0.3)), h = dt / n;
      for (let i = 0; i < n && !b.dead; i++) {
        const nx = b.x + b.vx * h, ny = b.y + b.vy * h - 0.5 * b.g * h * h, nz = b.z + b.vz * h;
        // 人
        for (const q of this.players) {
          if (q.slot === b.own || !q.alive) continue;
          if (segCap(b.x, b.y, b.z, nx, ny, nz, q, b.r + C.HIT_R)) { this.ballHit(b, q, nx, ny, nz); break; }
        }
        if (!b.dead) for (const d of this.decoys) {
          if (!d.alive || d.own === b.own) continue;
          if (segCap(b.x, b.y, b.z, nx, ny, nz, d, b.r + C.HIT_R)) { b.dead = true; this.hitDecoy(d, b.auth ? b.dmg : 0, b.auth, nx, ny, nz); if (!b.auth) this.emit({ k: 'puff', x: nx, y: ny, z: nz, ice: b.ice }); break; }
        }
        if (b.dead) break;
        const r = YD.ray(this.map, b.x, b.y, b.z, nx, ny, nz, this.t);
        if (r.t < 1) { b.dead = true; const u = r.t; this.emit({ k: 'splat', x: b.x + (nx - b.x) * u, y: b.y + (ny - b.y) * u, z: b.z + (nz - b.z) * u, ice: b.ice, g: r.o === 'g' }); break; }
        b.x = nx; b.y = ny; b.z = nz; b.vy -= b.g * h; b.age += h;
        if (Math.abs(b.x) > this.map.half + 1 || Math.abs(b.z) > this.map.half + 1 || b.age > 4) { b.dead = true; }
      }
    }
    ballHit(b, q, x, y, z) {
      b.dead = true;
      if (!b.auth) { this.emit({ k: 'puff', x, y, z, s: q.slot, ice: b.ice }); return; }
      const shooter = this.players[b.own]; shooter.stats.hit++; shooter.stats.dmg += b.dmg;
      const dir = Math.atan2(b.vx, b.vz);
      if (this.auth[q.slot]) { const r = damage(q, b.dmg); this.onHurt(q, r, b.own, dir, x, y, z, b.ice); }
      else {
        // 相手の画面へ知らせる。こちらは先に「当たった」を見せる
        const pr = { d: b.dmg, a: Math.min(q.ar, b.dmg), broke: q.ar > 0 && q.ar <= b.dmg, ko: false };
        q.ar = Math.max(0, q.ar - pr.a); q.hp = Math.max(1, q.hp - (b.dmg - pr.a)); q.predT = 0.6;
        this.emit({ k: 'hit', s: q.slot, by: b.own, x, y, z, d: b.dmg, a: pr.a, broke: pr.broke, ice: b.ice, dir });
        if (this.net) this.net.sendHit(q.slot, b.dmg, dir, b.ice, x, y, z);
      }
    }
    // ネットから「当たった」が届いた（自分が受ける側）
    remoteHit(slot, d, by, dir, ice, x, y, z) { const q = this.players[slot]; if (!q.alive || !this.auth[slot]) return; const r = damage(q, d); this.onHurt(q, r, by, dir, x, y, z, ice); }
    onHurt(q, r, by, dir, x, y, z, ice) {
      q.lastHurt = this.t; q.hurtDir = dir;
      this.emit({ k: 'hit', s: q.slot, by, x, y, z, d: r.d, a: r.a, broke: r.broke, ice, dir });
      if (r.ko) this.ko(q, by);
    }
    ko(q, by) {
      if (!q.alive || this.over) return; q.alive = false; q.heal = null; q.slide = 0; q.climb = null;
      this.over = { loser: q.slot, t: this.t }; this.emit({ k: 'ko', s: q.slot, by });
    }
    // ---------- 特技 ----------
    useSkill(p, I) {
      const k = p.skill, [fx, fz] = fwd(p.yaw), [rx, rz] = rgt(p.yaw), lim = this.map.half - 1.4;
      let a = null;
      if (k === 'wall') {
        const x = YD.clamp(p.x + fx * 1.75, -lim, lim), z = YD.clamp(p.z + fz * 1.75, -lim, lim);
        a = { x: +x.toFixed(2), z: +z.toFixed(2), ax: Math.abs(fx) > Math.abs(fz) ? 'z' : 'x' };
      } else if (k === 'decoy') {
        a = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3), id: p.slot + ':' + (this.decoyN++) };
      } else if (k === 'smoke') {
        a = { x: +YD.clamp(p.x + fx * 3.2, -lim, lim).toFixed(2), z: +YD.clamp(p.z + fz * 3.2, -lim, lim).toFixed(2) };
      } else if (k === 'dash') {
        let wx = fx * I.mz + rx * I.mx, wz = fz * I.mz + rz * I.mx, l = Math.hypot(wx, wz); if (l < 0.2) { wx = fx; wz = fz; l = 1; }
        p.vx = wx / l * 19; p.vz = wz / l * 19; p.vy = Math.max(p.vy, p.ground ? 2.5 : 1); p.ground = false; p.dashT = 0.24; p.slide = 0;
        a = {};
      }
      if (!a) return;
      p.cd = C.SKILLS[k].cd; if (p.heal) { p.heal = null; this.emit({ k: 'healCancel', s: p.slot }); }
      this.applySkill(p.slot, k, a);
      if (this.net) this.net.sendSkill(k, a);
    }
    // 自分の特技も、ネットから来た相手の特技も、ここで同じように作る
    applySkill(slot, k, a, lag) {
      const t = this.t;
      if (k === 'wall') {
        const o = { id: this.map.obs.length, kind: 'b', x: a.x, z: a.z, hx: a.ax === 'x' ? 1.25 : 0.32, hz: a.ax === 'x' ? 0.32 : 1.25, h0: 2.1, pair: 'w', tm: t + 9 - (lag || 0), born: t - (lag || 0), dyn: true };
        this.map.obs.push(o); this.emit({ k: 'skill', s: slot, kind: k, o });
      } else if (k === 'decoy') {
        const d = new Decoy(a.id, slot, a.x, a.z, a.yaw, t, this.map); this.decoys.push(d); d.showHp = this.players[slot].hp; d.showAr = this.players[slot].ar;
        let l = Math.min(0.4, lag || 0); while (l > 0) { const h = Math.min(l, 1 / 60); d.step(h, this); l -= h; }
        this.emit({ k: 'skill', s: slot, kind: k, d });
      } else if (k === 'smoke') {
        const sm = { x: a.x, z: a.z, r: 3.4, t0: t - (lag || 0), t1: t + 6.5 - (lag || 0) }; this.map.smokes.push(sm); this.emit({ k: 'skill', s: slot, kind: k, sm });
      } else this.emit({ k: 'skill', s: slot, kind: k });
    }
    hitDecoy(d, dmg, auth, x, y, z) {
      if (!d.alive) return; d.hp -= dmg;
      this.emit({ k: 'decoyHit', id: d.id, own: d.own, x, y, z, pop: d.hp <= 0 });
      if (d.hp <= 0) { d.alive = false; }
      if (auth && this.net) this.net.sendDecoyHit(d.id, dmg);
    }
    remoteDecoyHit(id, dmg) { const d = this.decoys.find(q => q.id === id); if (d) this.hitDecoy(d, dmg, false, d.x, d.y + 1, d.z); }
    // ---------- 1コマ進める ----------
    update(dt, inputs) {
      for (const p of this.players) if (this.auth[p.slot] && inputs[p.slot]) this.stepPlayer(p, inputs[p.slot], dt);
      for (const p of this.players) if (p.predT > 0) p.predT -= dt;
      for (const d of this.decoys) d.step(dt, this);
      this.decoys = this.decoys.filter(d => d.alive || this.t - d.dieT < 0.1);
      this.map.smokes = this.map.smokes.filter(m => m.t1 > this.t);
      for (const b of this.balls) this.stepBall(b, dt);
      this.balls = this.balls.filter(b => !b.dead);
      if (this.t < 0) return;
      // アイテム
      for (const pk of this.map.picks) {
        if (pk.t > this.t || this.taken[pk.id] != null) continue;
        pk.y = YD.groundAt(this.map, pk.x, pk.z, 0.2, this.t);
        for (const p of this.players) {
          if (!this.auth[p.slot] || !p.alive || this.pending[pk.id] != null) continue;
          if (Math.hypot(p.x - pk.x, p.z - pk.z) > C.PICK_R || Math.abs(p.y - pk.y) > 1.3) continue;
          if (pk.kind !== 'ice' && p.bag[pk.kind] >= C.BAG) continue;
          if (pk.kind === 'ice' && p.ice >= C.ICE.n) continue;
          if (this.net) { this.pending[pk.id] = p.slot; this.net.claim(pk, p.slot); }
          else this.givePick(pk, p.slot);
          break;
        }
      }
      // サドンデス（寒さ）
      if (this.t > C.ROUND_T) for (const p of this.players) if (this.auth[p.slot] && p.alive) {
        p.cold += C.COLD_DPS * dt; if (p.cold >= 1) { const d = Math.floor(p.cold); p.cold -= d; const r = damage(p, d); p.lastHurt = this.t; if (r.ko) this.ko(p, 1 - p.slot); }
      }
    }
    givePick(pk, slot) {
      if (this.taken[pk.id] != null) return; this.taken[pk.id] = slot; delete this.pending[pk.id];
      const p = this.players[slot];
      if (this.auth[slot]) { if (pk.kind === 'ice') p.ice = C.ICE.n; else p.bag[pk.kind] = Math.min(C.BAG, p.bag[pk.kind] + 1); }
      this.emit({ k: 'pick', s: slot, kind: pk.kind, id: pk.id, x: pk.x, y: pk.y || 0, z: pk.z });
    }
    claimFailed(pk) { delete this.pending[pk.id]; }
  }
  // にせ雪だるま：自分そっくりのおとり。前に走って、止まって、7秒で消える。2発で割れる
  class Decoy {
    constructor(id, own, x, z, yaw, t, map) {
      this.id = id; this.own = own; this.slot = own; this.x = x; this.z = z; this.y = YD.groundAt(map, x, z, C.PR * 0.55, t); this.yaw = yaw; this.pitch = 0;
      const [fx, fz] = fwd(yaw); this.vx = fx * C.RUN; this.vz = fz * C.RUN; this.vy = 0; this.t0 = t; this.hp = 40; this.ar = 0; this.alive = true; this.ground = true;
      this.decoy = true; this.top = C.PH; this.slide = 0; this.heal = null; this.climb = null; this.reload = 0; this.throwN = 0; this.ice = 0; this.mag = 6; this.dieT = 9e9;
    }
    chest() { return { x: this.x, y: this.y + 1.1, z: this.z }; }
    eye() { return { x: this.x, y: this.y + 1.5, z: this.z }; }
    speedH() { return Math.hypot(this.vx, this.vz); }
    step(dt, w) {
      if (!this.alive) return;
      const age = w.t - this.t0;
      if (age > 7) { this.alive = false; this.dieT = w.t; w.emit({ k: 'decoyHit', id: this.id, own: this.own, x: this.x, y: this.y + 1, z: this.z, pop: true, fade: true }); return; }
      if (age > 2.6) { this.vx *= 0.8; this.vz *= 0.8; }
      const pos = { x: this.x + this.vx * dt, z: this.z + this.vz * dt }; const hit = YD.pushOut(w.map, pos, C.PR, w.t, this.y, C.STEP);
      if (hit) { const vn = this.vx * hit.nx + this.vz * hit.nz; if (vn < 0) { this.vx -= vn * hit.nx; this.vz -= vn * hit.nz; } }
      this.x = pos.x; this.z = pos.z;
      const g = YD.groundAt(w.map, this.x, this.z, C.PR * 0.55, w.t); this.vy -= C.GRAV * dt; this.y += this.vy * dt; if (this.y <= g) { this.y = g; this.vy = 0; }
    }
  }
  YD.Decoy = Decoy;
  // 線分（雪玉の通り道）と、人の体（たての線分＋太さ）
  function segCap(ax, ay, az, bx, by, bz, q, R) {
    const y0 = q.y + 0.1, y1 = q.y + q.top - 0.15;
    for (let i = 0; i <= 3; i++) {
      const u = i / 3, x = ax + (bx - ax) * u, y = ay + (by - ay) * u, z = az + (bz - az) * u;
      const cy = y < y0 ? y0 : y > y1 ? y1 : y, dx = x - q.x, dy = y - cy, dz = z - q.z;
      if (dx * dx + dy * dy + dz * dz < R * R) return true;
    }
    return false;
  }
  YD.Player = Player; YD.World = World; YD.launch = launch; YD.damage = damage; YD.fwd = fwd; YD.rgt = rgt; YD.clamp = clamp;
})();
