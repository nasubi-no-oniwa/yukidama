// =============================================
//  CPU（かんたん／ふつう／むずかしい）
//  人と同じ「入力」を作るだけ。体の動きは人と同じルールで動く。
// =============================================
(function () {
  const C = YD.C;
  const LV = {
    easy:   { react: 0.75, err: 0.95, errK: 0.035, lead: 0.15, turn: 3.2, cover: 0, heal: 45, burst: 2, pause: 0.9, slide: 0, dist: [7, 13], pick: 0.4, think: 0.35, skill: 0.12, fool: 0.9 },
    normal: { react: 0.42, err: 0.55, errK: 0.025, lead: 0.6, turn: 6.5, cover: 0.6, heal: 70, burst: 4, pause: 0.45, slide: 0.25, dist: [7, 14], pick: 0.75, think: 0.25, skill: 0.35, fool: 0.6 },
    hard:   { react: 0.24, err: 0.3, errK: 0.018, lead: 0.95, turn: 11, cover: 1, heal: 95, burst: 6, pause: 0.2, slide: 0.6, dist: [6, 15], pick: 1, think: 0.18, skill: 0.6, fool: 0.3 }
  };
  const N = 40, CELL = 1;          // 1マス1m
  const cIdx = (x, z) => [Math.floor(x + 20), Math.floor(z + 20)];
  const cPos = (i, j) => ({ x: i - 20 + 0.5, z: j - 20 + 0.5 });

  class Cpu {
    constructor(slot, level, seed) {
      this.slot = slot; this.L = LV[level] || LV.normal; this.level = level; this.R = YD.rng((seed || 7) * 31 + slot);
      this.think = 0; this.path = null; this.goal = null; this.mode = 'hunt'; this.seen = 0; this.strafe = 1; this.strafeT = 0;
      this.burst = 0; this.pauseT = 0; this.aimX = 0; this.aimY = 0; this.aimZ = 0; this.yaw = null; this.pitch = 0; this.stuck = 0; this.navT = -9;
      this.jump = false; this.slide = false; this.heal = false; this.reload = false; this.errV = { x: 0, y: 0, z: 0 }; this.errT = 0;
    }
    // 歩けるマス
    buildGrid(w) {
      const g = new Uint8Array(N * N);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const p = cPos(i, j); let b = 0;
        for (const o of w.map.obs) { if (YD.hAt(o, w.t + 1) > 0.45 && YD.overlap(o, p.x, p.z, C.PR + 0.25)) { b = 1; break; } }
        if (Math.abs(p.x) > 19.4 || Math.abs(p.z) > 19.4) b = 1;
        g[i * N + j] = b;
      }
      this.grid = g; this.navT = w.t;
    }
    findPath(w, from, to) {
      const g = this.grid; let [si, sj] = cIdx(from.x, from.z), [ti, tj] = cIdx(to.x, to.z);
      const ok = (i, j) => i >= 0 && j >= 0 && i < N && j < N && !g[i * N + j];
      // 目的地がふさがっていたら近くの空きマス
      if (!ok(ti, tj)) { let best = null, bd = 1e9; for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) if (ok(ti + di, tj + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [ti + di, tj + dj]; } } if (!best) return null; [ti, tj] = best; }
      if (!ok(si, sj)) { for (let r = 1; r < 4 && !ok(si, sj); r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) if (ok(si + di, sj + dj)) { si += di; sj += dj; di = r + 1; break; } }
      const S = si * N + sj, T = ti * N + tj, gs = new Float32Array(N * N).fill(1e9), from_ = new Int32Array(N * N).fill(-1), closed = new Uint8Array(N * N);
      const open = [S]; gs[S] = 0; const h = k => Math.hypot((k / N | 0) - ti, (k % N) - tj);
      let it = 0;
      while (open.length && it++ < 3000) {
        let bi = 0; for (let k = 1; k < open.length; k++) if (gs[open[k]] + h(open[k]) < gs[open[bi]] + h(open[bi])) bi = k;
        const cur = open.splice(bi, 1)[0]; if (cur === T) break; if (closed[cur]) continue; closed[cur] = 1;
        const ci = cur / N | 0, cj = cur % N;
        for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
          if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!ok(ni, nj)) continue;
          if (di && dj && (!ok(ci + di, cj) || !ok(ci, cj + dj))) continue;
          const nk = ni * N + nj, ng = gs[cur] + (di && dj ? 1.414 : 1);
          if (ng < gs[nk]) { gs[nk] = ng; from_[nk] = cur; open.push(nk); }
        }
      }
      if (from_[T] < 0 && T !== S) return null;
      const out = []; let k = T; while (k >= 0 && k !== S) { out.push(cPos(k / N | 0, k % N)); k = from_[k]; }
      out.reverse(); if (out.length) out[out.length - 1] = { x: to.x, z: to.z }; return out;
    }
    // 相手から見えない場所（遮蔽のうら）
    coverSpot(w, me, foe) {
      let best = null, bd = 1e9; const fe = foe.eye();
      for (const o of w.map.obs) {
        const h = YD.hAt(o, w.t + 2.5); if (h < 1.5 || (o.tm != null && w.t > o.tm - 4)) continue;
        const rr = (o.kind === 'b' ? Math.max(o.hx, o.hz) : o.r) + 0.9;
        for (let a = 0; a < 8; a++) {
          const ang = a * Math.PI / 4, x = o.x + Math.cos(ang) * (o.kind === 'b' ? o.hx + 0.75 : rr) , z = o.z + Math.sin(ang) * (o.kind === 'b' ? o.hz + 0.75 : rr);
          if (Math.abs(x) > 19 || Math.abs(z) > 19) continue;
          if (YD.groundAt(w.map, x, z, C.PR, w.t) > 0.3) continue;
          if (YD.los(w.map, fe, { x, y: 1.2, z }, w.t)) continue;
          const d = Math.hypot(x - me.x, z - me.z) + Math.max(0, 6 - Math.hypot(x - foe.x, z - foe.z)) * 2;
          if (d < bd) { bd = d; best = { x, z }; }
        }
      }
      return best && bd < 14 ? best : null;
    }
    input(w, dt) {
      const me = w.players[this.slot], real = w.players[1 - this.slot], L = this.L, R = this.R;
      // にせ雪だるまにだまされることがある
      let foe = real;
      const dc = this.tgt && w.decoys.find(d => d.id === this.tgt && d.alive);
      if (dc) foe = dc; else this.tgt = null;
      if (this.yaw == null) this.yaw = me.yaw;
      const I = { mx: 0, mz: 0, yaw: this.yaw, pitch: this.pitch, fire: false, firePress: false, jump: false, jumpHeld: false, slide: false, heal: false, reload: false, aim: null };
      if (!me.alive || w.t < 0) { this.lookAt(foe.x, foe.z, dt, 99); I.yaw = this.yaw; return I; }
      if (!this.grid || w.t - this.navT > 1.2) this.buildGrid(w);
      const eye = me.eye(), fc = foe.chest(), see = foe.alive && YD.los(w.map, eye, fc, w.t), dist = Math.hypot(foe.x - me.x, foe.z - me.z);
      this.seen = see ? this.seen + dt : 0;
      // ---- 考える（ときどき） ----
      this.think -= dt;
      if (this.think <= 0) {
        this.think = L.think * (0.8 + R() * 0.4);
        if (!this.tgt) for (const d of w.decoys) {
          if (!d.alive || d.own === this.slot || this.fooled === d.id) continue; this.fooled = d.id;
          if (YD.los(w.map, eye, d.chest(), w.t) && (!YD.los(w.map, eye, real.chest(), w.t) || R() < L.fool)) { this.tgt = d.id; break; }
        }
        const hpS = me.hp + me.ar, need = { cocoa: me.hp < C.HP - 20, kairo: me.ar < C.ARMOR - 15 };
        const canHeal = (need.cocoa && me.bag.cocoa > 0) || (need.kairo && me.bag.kairo > 0);
        let mode = 'hunt', goal = null;
        if (canHeal && hpS < (L.heal + 50) * 1.5 && !(see && dist < 6 && foe.hp + foe.ar < 60)) {
          mode = 'heal';
          if (see && R() < L.cover + 0.2) { goal = this.coverSpot(w, me, foe); if (!goal) mode = 'fight'; }
        } else if (me.reload > 0 && see && R() < L.cover) { goal = this.coverSpot(w, me, foe); mode = goal ? 'cover' : 'fight'; }
        if (mode === 'hunt') {
          // アイテム
          let pk = null, pd = 1e9;
          for (const p of w.map.picks) {
            if (w.taken[p.id] != null || p.t > w.t + 2.5) continue;
            if (p.kind === 'ice' ? me.ice > 0 : (me.bag[p.kind] >= C.BAG)) continue;
            const d = Math.hypot(p.x - me.x, p.z - me.z), df = Math.hypot(p.x - foe.x, p.z - foe.z);
            const want = p.kind === 'ice' ? 1.2 : (p.kind === 'cocoa' ? (me.hp < C.HP * 0.9 ? 1.1 : 0.7) : (me.ar < C.ARMOR * 0.8 ? 1.1 : 0.6));
            const score = d / want; if (d < 16 && (d < df + 3 || !see) && score < pd && R() < L.pick + 0.1) { pd = score; pk = p; }
          }
          if (pk && !(see && dist < 9 && R() < 0.6)) { mode = 'pick'; goal = { x: pk.x, z: pk.z }; }
          else if (see) mode = 'fight';
        }
        if (mode === 'hunt') goal = { x: foe.x, z: foe.z };
        if (mode === 'fight') {
          // 間合いを保って横に動く
          this.strafeT -= this.L.think; if (this.strafeT <= 0) { this.strafe = R() < 0.5 ? -1 : 1; this.strafeT = 0.5 + R() * 1.1; }
          const dx = (foe.x - me.x) / (dist || 1), dz = (foe.z - me.z) / (dist || 1);
          const want = dist < L.dist[0] ? -0.8 : dist > L.dist[1] ? 0.9 : (foe.hp + foe.ar < me.hp + me.ar - 45 ? 0.5 : 0);
          goal = { x: me.x + (dx * want - dz * this.strafe) * 3, z: me.z + (dz * want + dx * this.strafe) * 3 };
          if (L.slide > 0 && R() < L.slide * 0.18) this.slide = true;
          if (L.slide > 0 && R() < L.slide * 0.1) this.jump = true;
        }
        // 特技
        if (me.cd <= 0 && R() < L.skill) {
          const k = me.skill;
          if (k === 'dash' && mode === 'fight' && (dist > L.dist[1] || foe.hp + foe.ar < 70 || R() < 0.25)) this.skill = true;
          if (k === 'wall' && see && dist < 18 && (me.reload > 0 || mode === 'heal' || mode === 'cover' || hpS < C.HP)) this.skill = true;
          if (k === 'smoke' && see && (hpS < (C.HP + C.ARMOR) * 0.45 || mode === 'heal')) this.skill = true;
          if (k === 'decoy' && (mode === 'hunt' || (see && R() < 0.25))) this.skill = true;
        }
        this.mode = mode;
        if (goal) {
          if (mode === 'fight') this.path = [goal];
          else if (!this.goal || Math.hypot(goal.x - this.goal.x, goal.z - this.goal.z) > 1.2 || !this.path || !this.path.length) this.path = this.findPath(w, me, goal) || [goal];
          this.goal = goal;
        }
      }
      // ---- 動く ----
      let mvx = 0, mvz = 0;
      if (this.path && this.path.length) {
        while (this.path.length > 1 && Math.hypot(this.path[0].x - me.x, this.path[0].z - me.z) < 0.7) this.path.shift();
        const q = this.path[0], dx = q.x - me.x, dz = q.z - me.z, d = Math.hypot(dx, dz);
        if (d > 0.35) { mvx = dx / d; mvz = dz / d; } else if (this.path.length === 1) this.path = null;
      }
      // 回復：見られていない時に始める（かんたんは気にしない）。ふつう以上は、近くで見つかったらやめて戦う
      const safe = !see || this.level === 'easy' || dist > 18;
      if (this.mode === 'heal' && (!this.path || !see)) { mvx *= 0.3; mvz *= 0.3; if (!me.heal && safe) this.heal = true; }
      if (me.heal && see && this.level !== 'easy' && dist < 11 && me.heal.T - me.heal.t > 0.8) { this.heal = true; this.mode = 'fight'; this.think = 0; }
      if (this.mode === 'pick' && foe.alive && see) { /* 拾いながら投げる */ }
      // 引っかかったらジャンプ
      const sp = me.speedH(); if (Math.hypot(mvx, mvz) > 0.5 && sp < 1.2 && me.ground && !me.heal) { this.stuck += dt; if (this.stuck > 0.45) { this.jump = true; this.stuck = 0; I.jumpHeld = true; } } else this.stuck = 0;
      // ---- ねらう ----
      if (see) {
        this.errT -= dt;
        if (this.errT <= 0) { this.errT = 0.25 + R() * 0.35; const e = L.err + dist * L.errK; this.errV = { x: (R() - 0.5) * 2 * e, y: (R() - 0.5) * 1.2 * e, z: (R() - 0.5) * 2 * e }; }
        const B = me.ice > 0 ? C.ICE : C.BALL, tt = dist / B.v * 1.05;
        const ax = fc.x + foe.vx * tt * L.lead + this.errV.x, ay = fc.y + this.errV.y, az = fc.z + foe.vz * tt * L.lead + this.errV.z;
        const off = this.lookAt(ax, az, dt, L.turn);
        I.aim = { x: ax, y: ay, z: az };
        this.pitch = Math.atan2(ay - eye.y, dist) * 0.5;
        const ready = this.seen > L.react && off < 0.18 && !me.heal && this.mode !== 'heal';
        if (ready) {
          this.pauseT -= dt;
          if (this.pauseT <= 0) { I.fire = true; if (me.fireT <= 0 && (me.mag > 0 || me.ice > 0) && me.reload <= 0) { this.burst++; if (this.burst >= L.burst) { this.burst = 0; this.pauseT = L.pause * (0.6 + R() * 0.8); } } }
        }
      } else {
        if (mvx || mvz) this.lookAt(me.x + mvx, me.z + mvz, dt, L.turn * 0.6);
        this.pitch *= 0.9;
        if (me.mag < C.MAG && me.reload <= 0 && !me.heal) this.reload = true;
      }
      // 向き基準の入力にする
      const [fx, fz] = YD.fwd(this.yaw), [rx, rz] = YD.rgt(this.yaw);
      I.mz = mvx * fx + mvz * fz; I.mx = mvx * rx + mvz * rz; I.yaw = this.yaw; I.pitch = this.pitch;
      I.skill = this.skill; I.jump = this.jump; I.slide = this.slide && sp > 4; I.heal = this.heal && !me.heal; I.reload = this.reload; I.jumpHeld = I.jumpHeld || this.jump;
      this.jump = this.slide = this.heal = this.reload = this.skill = false;
      return I;
    }
    lookAt(x, z, dt, rate) {
      const me = this; const want = Math.atan2(-(x - this._x()), -(z - this._z()));
      let d = want - this.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const m = rate * dt; this.yaw += Math.abs(d) <= m ? d : Math.sign(d) * m; return Math.abs(d) - Math.min(Math.abs(d), m);
    }
  }
  // lookAt で自分の位置を使う
  Cpu.prototype._x = function () { return this.w.players[this.slot].x; };
  Cpu.prototype._z = function () { return this.w.players[this.slot].z; };
  const _input = Cpu.prototype.input; Cpu.prototype.input = function (w, dt) { this.w = w; return _input.call(this, w, dt); };
  YD.Cpu = Cpu; YD.CPU_LV = LV;
})();
