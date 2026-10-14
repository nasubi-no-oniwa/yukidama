// =============================================
//  ステージ（雪の公園）と、当たり判定の道具
//  点対称（x,z → -x,-z）なので、どちらのスタートでも同じ条件。
//  遮蔽は「対になる2つ」が同時に溶ける。まん中の雪山は最後。
// =============================================
(function () {
  const C = YD.C;
  YD.rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const HALF = 20;
  // ステージ。片側ぶん（z>0 側）を書くと、点対称の反対側が自動でできる。kind b=箱 c=円柱
  //   [種類, x, z, 半幅x(半径), 半幅z, 高さ, 溶けるグループ]
  const STAGES = {
    park: {
      name: '雪の公園',
      half: [['b', -5, 12.6, 2.2, 0.45, 2.2], ['b', 6, 13, 0.5, 1.8, 2.2], ['b', -12, 9, 1.5, 1.5, 1.0], ['c', 13, 8, 1.1, 0, 2.6], ['b', -15, 15.5, 0.5, 2, 2.2],
        ['b', 1, 7, 2.4, 0.45, 2.2], ['b', -7, 4.6, 0.45, 2.2, 2.2], ['b', 9, 3.4, 1.6, 0.45, 1.1], ['c', -15.5, 2, 1.3, 0, 1.2], ['b', 15, 15, 1.2, 1.2, 2.2], ['b', -3.6, 1.7, 1.4, 0.4, 2.2]],
      center: [['c', 0, 0, 2.2, 0, 1.3]],
      heal: [[-10, 13], [10, 10.5], [-2, 10.5], [-11.5, 5], [12.5, 13], [4, 3.6], [-17, 9], [16.5, 1.5]],
      ice: [[0, 0], [-11, 0.3], [11, -0.3]], pads: [[17, 5.5]]
    },
    mount: {
      name: '雪山',
      half: [['b', 4.0, 0, 0.6, 1.3, 1.2, 98], ['b', 5.2, 0, 0.6, 1.3, 0.8, 98], ['b', 6.4, 0, 0.6, 1.3, 0.4, 98],
        ['b', -11, 11, 1.8, 1.8, 2.4, 'tw'], ['b', -11, 8.6, 1.8, 0.6, 1.2, 'tw'],
        ['b', 6, 12.5, 2.2, 0.45, 2.2], ['b', 13, 6, 0.45, 2.2, 2.2], ['b', -4, 7, 1.8, 0.45, 2.2], ['b', -16, 3, 0.5, 2.2, 2.2], ['b', 14, 14.5, 1.2, 1.2, 1.2],
        ['c', 3, 14.5, 1.0, 0, 2.2], ['c', 9, 8.5, 1.0, 0, 2.6]],
      center: [['b', 0, 0, 3.4, 3.4, 1.6]],
      heal: [[-8, 13.5], [10, 10.5], [-2, 11], [-13, 4], [16.5, 10], [3, 10], [-17, 14], [8, 3.5]],
      ice: [[0, 0], [-10, 0.3], [10, -0.3]], pads: [[17.5, -9]]
    },
    alley: {
      name: '雪の路地',
      half: [['b', -6, 11, 0.4, 4, 2.6], ['b', 6, 11, 0.4, 4, 2.6], ['b', -6, 3, 0.4, 2.2, 2.6], ['b', 6, 3, 0.4, 2.2, 2.6], ['b', -13, 7, 3, 0.4, 2.2], ['b', 13, 9, 2.5, 0.4, 2.2],
        ['b', 0, 7.5, 2, 0.4, 2.2], ['b', -2.5, 1.6, 0.4, 1.2, 1.2], ['b', 11, 15.5, 0.4, 2, 2.2], ['b', -16.5, 14, 1, 1, 1.0], ['b', 16, 3, 1, 1, 1.4]],
      center: [['c', 0, 0, 1.0, 0, 2.4]],
      heal: [[-9, 11], [9, 11], [0, 11], [-14, 3], [14, 5], [-3.5, 5], [3, 4], [-17, 9]],
      ice: [[-9, 0], [9, 0], [-4.5, 0], [4.5, 0]], pads: [[10, 0.6]]
    }
  };
  YD.STAGES = STAGES; YD.STAGE_KEYS = Object.keys(STAGES);

  function makeMap(seed, stage) {
    const R = YD.rng(seed || 1), ST = STAGES[stage] || STAGES.park;
    const obs = [];
    const add = (k, x, z, a, b, h, pair) => obs.push(k === 'b' ? { id: obs.length, kind: 'b', x, z, hx: a, hz: b, h0: h, pair } : { id: obs.length, kind: 'c', x, z, r: a, h0: h, pair });
    const pairs = [];
    ST.half.forEach((o, i) => { const g = o[6] != null ? o[6] : i; if (!pairs.includes(g)) pairs.push(g); add(o[0], o[1], o[2], o[3], o[4], o[5], g); add(o[0], -o[1], -o[2], o[3], o[4], o[5], g); });
    for (const o of ST.center) add(o[0], o[1], o[2], o[3], o[4], o[5], 99);
    // 溶ける順番（対ごとに。98＝まん中の階段は最後から2番目、99＝まん中は最後）
    const order = pairs.filter(p => p !== 98);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    if (pairs.includes(98)) order.push(98);
    order.push(99);
    const N = order.length;
    order.forEach((p, k) => { const tm = C.MELT_START + (C.MELT_END - C.MELT_START) * k / (N - 1); for (const o of obs) if (o.pair === p) o.tm = tm; });
    // アイテムの場所（遮蔽と重なる所はのぞく。高い所の上ならOK）
    const free = ([x, z]) => Math.abs(x) < HALF - 1.2 && Math.abs(z) < HALF - 1.2 && !obs.some(o => o.h0 < 1.7 ? false : overlap(o, x, z, 0.8)) && !ST.pads.some(p => Math.hypot(Math.abs(x) - Math.abs(p[0]), Math.abs(z) - Math.abs(p[1])) < 2);
    const HEAL_SPOTS = ST.heal.filter(free), ICE_SPOTS = ST.ice.filter(free);
    const PADS = ST.pads.flatMap(p => [p, [-p[0], -p[1]]]);
    // アイテム（時間・種類・場所が最初から決まっている＝ふたりの画面で同じ）
    const picks = []; let w = 0;
    for (let t = C.PICK_FIRST; t < C.ROUND_T + 80; t += C.PICK_EVERY, w++) {
      const kind = ['cocoa', 'kairo', 'ice'][w % 3];
      if (kind === 'ice') { const s = ICE_SPOTS[Math.floor(R() * ICE_SPOTS.length)]; picks.push({ id: picks.length, kind, x: s[0], z: s[1], t }); }
      else { const s = HEAL_SPOTS[Math.floor(R() * HEAL_SPOTS.length)]; picks.push({ id: picks.length, kind, x: s[0], z: s[1], t }); picks.push({ id: picks.length, kind, x: -s[0], z: -s[1], t }); }
    }
    return { stage: stage || 'park', name: ST.name, half: HALF, obs, picks, pads: PADS.map(p => ({ x: p[0], z: p[1], r: 1.1 })), spawns: [{ x: 0, z: 17, yaw: 0 }, { x: 0, z: -17, yaw: Math.PI }] };
  }

  // 遮蔽の高さ（時間で溶ける）
  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  function hAt(o, t) { if (o.tm == null || t < o.tm) return o.h0; return o.h0 * (1 - smooth((t - o.tm) / C.MELT_DUR)); }
  function warnAt(o, t) { return o.tm != null && t >= o.tm - C.MELT_WARN && t < o.tm; }
  // 円（x,z,r）と重なるか
  function overlap(o, x, z, r) {
    if (o.kind === 'b') { const dx = Math.max(Math.abs(x - o.x) - o.hx, 0), dz = Math.max(Math.abs(z - o.z) - o.hz, 0); return dx * dx + dz * dz < r * r; }
    const dx = x - o.x, dz = z - o.z, rr = o.r + r; return dx * dx + dz * dz < rr * rr;
  }
  // 足もとの高さ
  function groundAt(map, x, z, r, t) { let g = 0; for (const o of map.obs) { const h = hAt(o, t); if (h > 0.02 && h > g && overlap(o, x, z, r)) g = h; } return g; }
  // 円を遮蔽の外へ押し出す（足もとより高い物だけ）。ぶつかった物と向きを返す
  function pushOut(map, p, r, t, footY, step) {
    let hit = null;
    for (const o of map.obs) {
      const h = hAt(o, t); if (h <= footY + step) continue;
      if (o.kind === 'b') {
        const cx = Math.max(o.x - o.hx, Math.min(p.x, o.x + o.hx)), cz = Math.max(o.z - o.hz, Math.min(p.z, o.z + o.hz));
        let dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 < 1e-9) { // 中に入った：いちばん近い面へ
          const ex = o.hx - Math.abs(p.x - o.x), ez = o.hz - Math.abs(p.z - o.z);
          if (ex < ez) { dx = Math.sign(p.x - o.x) || 1; dz = 0; p.x = o.x + dx * (o.hx + r); } else { dz = Math.sign(p.z - o.z) || 1; dx = 0; p.z = o.z + dz * (o.hz + r); }
          hit = { o, nx: dx, nz: dz, h }; continue;
        }
        const d = Math.sqrt(d2), nx = dx / d, nz = dz / d; p.x = cx + nx * r; p.z = cz + nz * r; hit = { o, nx, nz, h };
      } else {
        const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), rr = o.r + r;
        if (d >= rr) continue; const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
        p.x = o.x + nx * rr; p.z = o.z + nz * rr; hit = { o, nx, nz, h };
      }
    }
    const lim = map.half - r;
    if (p.x > lim) { p.x = lim; hit = hit || { wall: 1, nx: -1, nz: 0 }; } if (p.x < -lim) { p.x = -lim; hit = hit || { wall: 1, nx: 1, nz: 0 }; }
    if (p.z > lim) { p.z = lim; hit = hit || { wall: 1, nx: 0, nz: -1 }; } if (p.z < -lim) { p.z = -lim; hit = hit || { wall: 1, nx: 0, nz: 1 }; }
    return hit;
  }
  // 線分 a→b と遮蔽・地面。当たった割合 0..1（当たらなければ 1）
  function ray(map, ax, ay, az, bx, by, bz, t, skipGround) {
    const dx = bx - ax, dy = by - ay, dz = bz - az; let best = 1, bo = null;
    for (const o of map.obs) {
      const h = hAt(o, t); if (h <= 0.02) continue;
      let tt = 2;
      if (o.kind === 'b') {
        let t0 = 0, t1 = best;
        const sl = (a, d, lo, hi) => { if (Math.abs(d) < 1e-9) return a >= lo && a <= hi; let u = (lo - a) / d, v = (hi - a) / d; if (u > v) [u, v] = [v, u]; if (u > t0) t0 = u; if (v < t1) t1 = v; return t0 <= t1; };
        if (sl(ax, dx, o.x - o.hx, o.x + o.hx) && sl(az, dz, o.z - o.hz, o.z + o.hz) && sl(ay, dy, -1, h)) tt = t0;
      } else {
        const fx = ax - o.x, fz = az - o.z, A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), Cc = fx * fx + fz * fz - o.r * o.r;
        if (Cc <= 0 && ay <= h) tt = 0;
        else {
          if (A > 1e-9) { const D = B * B - 4 * A * Cc; if (D >= 0) { const u = (-B - Math.sqrt(D)) / (2 * A); if (u >= 0 && u <= 1 && ay + dy * u <= h) tt = u; } }
          if (dy < 0 && ay > h) { const u = (h - ay) / dy; if (u >= 0 && u <= 1) { const px = fx + dx * u, pz = fz + dz * u; if (px * px + pz * pz <= o.r * o.r && u < tt) tt = u; } }
        }
      }
      if (tt >= 0 && tt < best) { best = tt; bo = o; }
    }
    if (!skipGround && dy < 0 && ay + dy * best < 0) { const u = -ay / dy; if (u < best) { best = u; bo = 'g'; } }
    return { t: best, o: bo };
  }
  function los(map, a, b, t) {
    if (ray(map, a.x, a.y, a.z, b.x, b.y, b.z, t, true).t < 0.999) return false;
    for (const m of map.smokes || []) { if (t < m.t0 || t > m.t1) continue; if (segSphere(a, b, m.x, 1.3, m.z, smokeR(m, t))) return false; }
    return true;
  }
  const smokeR = (m, t) => m.r * Math.min(1, (t - m.t0) / 0.4) * (t > m.t1 - 0.6 ? Math.max(0.2, (m.t1 - t) / 0.6) : 1);
  function segSphere(a, b, cx, cy, cz, r) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = dx * dx + dy * dy + dz * dz || 1e-9;
    const u = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy + (cz - a.z) * dz) / L));
    const px = a.x + dx * u - cx, py = a.y + dy * u - cy, pz = a.z + dz * u - cz; return px * px + py * py + pz * pz < r * r;
  }
  YD.smokeR = smokeR;

  YD.makeMap = makeMap; YD.hAt = hAt; YD.warnAt = warnAt; YD.groundAt = groundAt; YD.pushOut = pushOut; YD.ray = ray; YD.los = los; YD.overlap = overlap;
})();
