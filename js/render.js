// =============================================
//  ユキダマッチ  3D表示（three.js r158）
// =============================================
(function () {
  const C = YD.C;
  const TEAM = ['#ff5a4f', '#3d7bff'], TEAM_D = ['#c23a33', '#2556c4'];
  const lerp = (a, b, u) => a + (b - a) * u;
  const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };

  // 角の丸い箱（雪のブロック）
  function roundBox(w, h, d, r, seg = 5) {
    const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, hw = w / 2, hh = h / 2, hd = d / 2;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ix = Math.max(-hw + r, Math.min(hw - r, x)), iy = Math.max(-hh + r, Math.min(hh - r, y)), iz = Math.max(-hd + r, Math.min(hd - r, z));
      let nx = x - ix, ny = y - iy, nz = z - iz; const l = Math.hypot(nx, ny, nz);
      if (l > 1e-6) { nx /= l; ny /= l; nz /= l; const j = 1 + (hash(x, y, z) - 0.5) * 0.12; x = ix + nx * r * j; y = iy + ny * r * j; z = iz + nz * r * j; }
      p.setXYZ(i, x, y + hh, z);
    }
    g.computeVertexNormals(); return g;
  }
  function mound(r, h) {
    const k = Math.min(0.35, h * 0.4, r * 0.4), pts = [new THREE.Vector2(0, 0), new THREE.Vector2(r + 0.05, 0), new THREE.Vector2(r, h - k)];
    for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(r - k + Math.cos(a) * k, h - k + Math.sin(a) * k)); }
    pts.push(new THREE.Vector2(0, h)); const g = new THREE.LatheGeometry(pts, 28); g.computeVertexNormals(); return g;
  }
  function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

  // ---------- 粒（雪しぶき・もこもこの破片など） ----------
  class Parts {
    constructor(scene, n = 700) {
      this.n = n; this.list = []; this.free = [];
      const g = new THREE.IcosahedronGeometry(1, 0), m = new THREE.MeshLambertMaterial({ color: '#ffffff' });
      this.mesh = new THREE.InstancedMesh(g, m, n); this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.frustumCulled = false;
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.col = new THREE.Color();
      for (let i = 0; i < n; i++) { this.free.push(i); this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); }
      scene.add(this.mesh);
    }
    add(o) { const i = this.free.pop(); if (i == null) return; o.i = i; o.age = 0; this.list.push(o); this.col.set(o.c || '#ffffff'); this.mesh.setColorAt(i, this.col); this.mesh.instanceColor.needsUpdate = true; }
    burst(x, y, z, n, o = {}) {
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = (o.sp || 4) * (0.4 + Math.random() * 0.8), q = Math.sqrt(1 - u * u);
        this.add({ x, y, z, vx: Math.cos(a) * q * s + (o.vx || 0), vy: Math.abs(u) * s * (o.up || 1) + (o.vy || 0), vz: Math.sin(a) * q * s + (o.vz || 0), life: (o.life || 0.6) * (0.6 + Math.random() * 0.7), sz: (o.sz || 0.07) * (0.6 + Math.random() * 0.8), g: o.g ?? 12, c: o.c, drag: o.drag || 1.5, rot: Math.random() * 6 });
      }
    }
    update(dt) {
      const L = this.list;
      for (let k = L.length - 1; k >= 0; k--) {
        const p = L[k]; p.age += dt;
        if (p.age >= p.life) { this.mesh.setMatrixAt(p.i, this.m4.makeScale(0, 0, 0)); this.free.push(p.i); L.splice(k, 1); continue; }
        p.vy -= p.g * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vz *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.02) { p.y = 0.02; p.vy *= -0.2; p.vx *= 0.5; p.vz *= 0.5; }
        const u = p.age / p.life, s = p.sz * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3); p.rot += dt * 4;
        this.q.setFromAxisAngle(this.v.set(0.3, 1, 0.2).normalize(), p.rot);
        this.mesh.setMatrixAt(p.i, this.m4.compose(this.v.set(p.x, p.y, p.z), this.q, this.s.set(s, s, s)));
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    clear() { for (const p of this.list) { this.mesh.setMatrixAt(p.i, this.m4.makeScale(0, 0, 0)); this.free.push(p.i); } this.list = []; this.mesh.instanceMatrix.needsUpdate = true; }
  }

  // ---------- キャラクター（ちびキャラ） ----------
  function makeChar(slot) {
    const L = c => new THREE.MeshLambertMaterial({ color: c });
    const jacket = L(TEAM[slot]), dark = L(TEAM_D[slot]), skin = L('#ffdcc0'), pants = L('#39405a'), boot = L('#5a3b2b'), white = L('#ffffff'), black = L('#1d1d28'), scarfM = L(slot ? '#ffd23f' : '#3ee0b5'), cheek = L('#ff9aa8');
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const cast = m => { m.castShadow = true; return m; };
    const hip = new THREE.Group(); hip.position.y = 0.72; body.add(hip);
    const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.14, 0, 0); const l = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 8), pants)); l.position.y = -0.3; g.add(l); const b = cast(new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), boot)); b.scale.set(1, 0.75, 1.35); b.position.set(0, -0.6, -0.05); g.add(b); hip.add(g); return g; });
    const torso = new THREE.Group(); torso.position.y = 0.72; body.add(torso);
    const tm = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.32, 6, 14), jacket)); tm.position.y = 0.32; torso.add(tm);
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.02), white); zip.position.set(0, 0.3, -0.305); torso.add(zip);
    // もこもこ（アーマー）
    const puff = new THREE.Group(); torso.add(puff);
    for (let i = 0; i < 3; i++) { const t = cast(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.075, 8, 22), L('#f2f6ff'))); t.rotation.x = Math.PI / 2; t.position.y = 0.12 + i * 0.2; puff.add(t); }
    const head = new THREE.Group(); head.position.y = 0.8; torso.add(head);
    const hm = cast(new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), skin)); hm.position.y = 0.1; head.add(hm);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), black); e.scale.set(1, 1.35, 0.6); e.position.set(s * 0.09, 0.12, -0.25); head.add(e); const c = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), cheek); c.scale.set(1, 0.6, 0.4); c.position.set(s * 0.16, 0.04, -0.215); head.add(c); });
    const hat = cast(new THREE.Mesh(new THREE.SphereGeometry(0.29, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark)); hat.position.y = 0.15; head.add(hat);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 22), white); band.rotation.x = Math.PI / 2; band.position.y = 0.16; head.add(band);
    const pom = cast(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), white)); pom.position.y = 0.46; head.add(pom);
    const scarf = cast(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 18), scarfM)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.66; torso.add(scarf);
    const tail = cast(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.05), scarfM)); tail.position.set(0.12, 0.5, 0.2); tail.rotation.z = 0.2; torso.add(tail);
    const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.36, 0.58, 0); const a = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.3, 4, 8), jacket)); a.position.y = -0.2; g.add(a); const m = cast(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), dark)); m.position.y = -0.42; g.add(m); torso.add(g); g.rotation.z = s * 0.25; return g; });
    const held = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), L('#ffffff')); held.position.set(0, -0.5, -0.06); arms[1].add(held);
    const cup = new THREE.Group(); const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.15, 12), L('#fff3e0')); const cc = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.01, 12), L('#6b3b22')); cc.position.y = 0.07; cup.add(cb, cc); cup.position.set(0, -0.5, -0.08); arms[0].add(cup);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.04), L('#ff7a3d')); pad.position.set(0, -0.52, -0.1); arms[0].add(pad);
    // 雪まみれ（当たるほど増える）
    const blobs = []; const BM = L('#ffffff'); const R = YD.rng(slot * 99 + 3);
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09 + R() * 0.05, 8, 6), BM); const a = R() * Math.PI * 2, y = R();
      if (i % 3 === 2) { head.add(b); b.position.set(Math.cos(a) * 0.24, 0.05 + y * 0.18, Math.sin(a) * 0.24); }
      else { b.position.set(Math.cos(a) * 0.3, 0.1 + y * 0.5, Math.sin(a) * 0.3); torso.add(b); }
      b.scale.set(1, 0.7, 1); b.visible = false; blobs.push(b);
    }
    // 雪だるま（負けたとき）
    const sm = new THREE.Group(); const sw = L('#ffffff');
    [[0.5, 0.45], [0.36, 1.12], [0.26, 1.6]].forEach(([r, y]) => { const s = cast(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), sw)); s.position.y = y; sm.add(s); });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 8), L('#ff8a1f')); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 1.6, -0.33); sm.add(nose);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), black); e.position.set(s * 0.09, 1.68, -0.23); sm.add(e); });
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark); sh.position.y = 1.75; sm.add(sh);
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), white); sp.position.y = 2.04; sm.add(sp);
    const ss = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 18), scarfM); ss.rotation.x = Math.PI / 2; ss.position.y = 1.38; sm.add(ss);
    sm.visible = false; root.add(sm);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = Math.PI / 2; glow.visible = false; root.add(glow);
    // 足もとの影（見やすく）
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TEAM[slot], transparent: true, opacity: 0.55, depthWrite: false })); ring.position.y = 0.03; root.add(ring);
    return { glow, root, body, hip, legs, torso, head, arms, held, cup, pad, puff, blobs, sm, ring, ph: 0, thN: 0, thT: 9, koT: 0, heldIce: false };
  }

  // ---------- キャラクター（Kenney Mini Characters を使う版） ----------
  const SC = 2.2;   // 元の大きさ（約0.67）→ 約1.6m
  function makeCharGLB(slot, av) {
    const T = YD.A && YD.A.chars[av];
    if (!T) { const c = makeChar(slot); c.av = av; return c; }
    const L = c => new THREE.MeshLambertMaterial({ color: c });
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const model = YD.SkeletonUtils.clone(T.scene); model.scale.setScalar(SC); model.rotation.y = Math.PI; body.add(model);
    const bone = n => { let b = null; model.traverse(o => { if (!b && o.name === n) b = o; }); return b || model; };
    const torso = bone('torso'), head = bone('head'), armR = bone('arm-right');
    // チームの色のマフラー
    const scarfM = L(TEAM[slot]);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 22), scarfM); scarf.rotation.x = Math.PI / 2; scarf.position.set(0, 0.16, 0); scarf.castShadow = true; torso.add(scarf);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.02), scarfM); tail.position.set(0.045, 0.1, -0.12); tail.rotation.z = 0.25; torso.add(tail);
    // もこもこ（アーマー）
    const puff = new THREE.Group(); torso.add(puff);
    for (let i = 0; i < 2; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.026, 8, 22), L("#f2f6ff")); t.rotation.x = Math.PI / 2; t.position.y = 0.035 + i * 0.065; t.castShadow = true; puff.add(t); }
    // 手に持つ雪玉・ココア・カイロ
    const held = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), L('#ffffff')); held.position.set(0, -0.13, 0.02); armR.add(held);
    const cup = new THREE.Group(); const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.065, 12), L('#fff3e0')); const cc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.004, 12), L('#6b3b22')); cc.position.y = 0.032; cup.add(cb, cc); cup.position.set(0, -0.13, 0.03); armR.add(cup);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.02), L('#ff7a3d')); pad.position.set(0, -0.13, 0.04); armR.add(pad);
    // 雪まみれ
    const blobs = [], BM = L('#ffffff'), R = YD.rng(slot * 99 + 7);
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.035 + R() * 0.02, 8, 6), BM), a = R() * Math.PI * 2;
      if (i % 3 === 2) { head.add(b); b.position.set(Math.cos(a) * 0.13, 0.08 + R() * 0.12, Math.sin(a) * 0.13); } else { torso.add(b); b.position.set(Math.cos(a) * 0.1, 0.02 + R() * 0.13, Math.sin(a) * 0.09); }
      b.scale.set(1, 0.7, 1); b.visible = false; blobs.push(b);
    }
    // 雪だるま（負けたとき）
    let sm = YD.decor('snowman', 1.75);
    if (sm) { const sc2 = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 22), scarfM); sc2.rotation.x = Math.PI / 2; sc2.position.y = 1.02; sm.add(sc2); sm.rotation.y = Math.PI; }
    else sm = makeChar(slot).sm;
    sm.visible = false; root.add(sm);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TEAM[slot], transparent: true, opacity: 0.55, depthWrite: false })); ring.position.y = 0.03; root.add(ring);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = Math.PI / 2; glow.visible = false; root.add(glow);
    // 動き
    const mixer = new THREE.AnimationMixer(model), acts = {};
    for (const k in T.clips) { if (!T.clips[k]) continue; const a = mixer.clipAction(T.clips[k]); acts[k] = a; }
    for (const k of ['jump', 'die', 'crouch', 'emote-yes']) if (acts[k]) { acts[k].setLoop(THREE.LoopOnce); acts[k].clampWhenFinished = true; }
    if (acts.throw) { acts.throw.setLoop(THREE.LoopOnce); acts.throw.clampWhenFinished = false; acts.throw.timeScale = 1.7; }
    const c = { glb: true, av, root, body, model, mixer, acts, base: null, up: null, held, cup, pad, puff, blobs, sm, ring, glow, ph: 0, thN: 0, thT: 9, koT: 0, heldIce: false, popped: false };
    c.reset = () => { mixer.stopAllAction(); c.base = c.up = null; c.koT = 0; c.popped = false; sm.visible = false; body.visible = true; };
    return c;
  }
  function setBase(c, name) {
    if (c.base === name || !c.acts[name]) return;
    const nx = c.acts[name]; nx.reset().setEffectiveWeight(1).fadeIn(c.base ? 0.12 : 0).play();
    if (c.base && c.acts[c.base]) c.acts[c.base].fadeOut(0.12);
    c.base = name;
  }
  function setUpper(c, name, restart) {
    if (c.up === name && !restart) return;
    if (c.up && c.acts[c.up] && c.up !== name) c.acts[c.up].fadeOut(0.1);
    if (name && c.acts[name]) { const a = c.acts[name]; if (c.up !== name || restart) a.reset(); a.setEffectiveWeight(5).fadeIn(0.06).play(); }
    c.up = name;
  }

  class Render {
    constructor(el) {
      this.el = el; const lo = matchMedia('(pointer: coarse)').matches;
      this.lo = lo;
      const r = this.r = window.__fakeGL ? { domElement: document.createElement('canvas'), setPixelRatio() {}, setSize() {}, render() {}, shadowMap: {} } : new THREE.WebGLRenderer({ antialias: !lo, powerPreference: 'high-performance' });   // __fakeGL はテスト用
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, lo ? 1.5 : 2)); r.shadowMap.enabled = true; r.shadowMap.type = (lo || window.__pvFast) ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;   // スマホは軽い影
      r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      el.appendChild(r.domElement);
      const S = this.scene = new THREE.Scene(); S.background = new THREE.Color('#b9d6f0'); S.fog = new THREE.Fog('#c9e0f4', 30, 95);
      this.cam = new THREE.PerspectiveCamera(70, 1, 0.08, 220);
      S.add(new THREE.HemisphereLight('#dbeeff', '#8aa0c0', 1.25));
      const sun = this.sun = new THREE.DirectionalLight('#fff1dc', 2.1); sun.position.set(-18, 30, 12); sun.castShadow = true;
      const sc = sun.shadow.camera; sc.left = sc.bottom = -26; sc.right = sc.top = 26; sc.near = 5; sc.far = 80; sun.shadow.mapSize.set(lo ? 1024 : 2048, lo ? 1024 : 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      S.add(sun);
      this.env(); this.parts = new Parts(S); this.balls = []; this.obsM = []; this.pickM = {}; this.decoyM = {}; this.smokeM = []; this.rpB = {}; this.chars = [makeChar(0), makeChar(1)]; this.chars.forEach(c => S.add(c.root));
      this.snow(); this.shake = 0; this.camPos = new THREE.Vector3(); this.camFwd = new THREE.Vector3(0, 0, -1); this.fovK = 0;
      this.resize(); addEventListener('resize', () => this.resize());
    }
    resize() { const w = this.el.clientWidth || innerWidth, h = this.el.clientHeight || innerHeight; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w / h < 1 ? 82 : 70; this.cam.updateProjectionMatrix(); this.W = w; this.H = h; }
    env() {
      const S = this.scene;
      const tex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#f3f7fd'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const v = 225 + Math.random() * 30 | 0; x.fillStyle = `rgba(${v - 12},${v - 4},${v + 10},.35)`; const r = Math.random() * 3 + 0.5; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, r, 0, 7); x.fill(); } });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(30, 30);
      const g = this.ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshLambertMaterial({ map: tex, color: '#ffffff' })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; S.add(g);
      // うすい線（場の大きさがわかるように）
      const ln = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.75, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#a9c6e6', transparent: true, opacity: 0.5, depthWrite: false })); ln.position.y = 0.01; S.add(ln);
      const cl = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.12).rotateX(-Math.PI / 2), ln.material); cl.position.y = 0.01; S.add(cl);
      // まわりの雪の土手と柵
      const bankM = new THREE.MeshLambertMaterial({ color: '#f7faff' });
      for (let k = 0; k < 4; k++) for (let i = -5; i <= 5; i++) {
        const m = new THREE.Mesh(roundBox(4.6, 1.3 + hash(k, i, 1) * 0.8, 2.4, 0.6, 4), bankM); const a = k * Math.PI / 2;
        const u = i * 4.1, v = 21.4; m.position.set(Math.cos(a) * v - Math.sin(a) * u, 0, Math.sin(a) * v + Math.cos(a) * u); m.rotation.y = -a + Math.PI / 2; m.receiveShadow = true; m.castShadow = true; S.add(m);
      }
      const wood = new THREE.MeshLambertMaterial({ color: '#9a6a43' }), postG = new THREE.CylinderGeometry(0.07, 0.08, 1.1, 6), railG = new THREE.BoxGeometry(40, 0.08, 0.06);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; for (let i = -10; i <= 10; i++) { const p = new THREE.Mesh(postG, wood); p.position.set(Math.cos(a) * 20.1 - Math.sin(a) * i * 2, 0.55, Math.sin(a) * 20.1 + Math.cos(a) * i * 2); S.add(p); } for (const y of [0.45, 0.9]) { const rl = new THREE.Mesh(railG, wood); rl.position.set(Math.cos(a) * 20.1, y, Math.sin(a) * 20.1); rl.rotation.y = -a + Math.PI / 2; S.add(rl); } }
      // 木
      const trunk = new THREE.CylinderGeometry(0.18, 0.25, 1.2, 6), leaf = new THREE.ConeGeometry(1.5, 3.2, 8), cap = new THREE.ConeGeometry(0.9, 1.3, 8);
      const tm = new THREE.MeshLambertMaterial({ color: '#7a5236' }), lm = new THREE.MeshLambertMaterial({ color: '#2f6f5a' }), cm = new THREE.MeshLambertMaterial({ color: '#ffffff' });
      const R = YD.rng(42); this.coneTrees = new THREE.Group(); S.add(this.coneTrees); this.treeSpots = [];
      for (let i = 0; i < 90; i++) {
        const a = R() * Math.PI * 2, d = 26 + R() * 30, s = 0.8 + R() * 1.1, x = Math.cos(a) * d, z = Math.sin(a) * d;
        const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.scale.setScalar(s);
        const t = new THREE.Mesh(trunk, tm); t.position.y = 0.6; const l1 = new THREE.Mesh(leaf, lm); l1.position.y = 2.4; const l2 = new THREE.Mesh(leaf, lm); l2.position.y = 3.6; l2.scale.setScalar(0.72); const c = new THREE.Mesh(cap, cm); c.position.y = 4.35; c.scale.setScalar(0.6);
        g2.add(t, l1, l2, c); if (d < 34) g2.children.forEach(m => { m.castShadow = true; }); this.coneTrees.add(g2); this.treeSpots.push({ x, z, s, d, k: i % 3 });
      }
      // 遠くの山
      const mm = new THREE.MeshLambertMaterial({ color: '#dfe9f6' });
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.2, m = new THREE.Mesh(new THREE.ConeGeometry(18 + (i % 3) * 6, 22 + (i % 4) * 7, 7), mm); m.position.set(Math.cos(a) * 120, 8, Math.sin(a) * 120); S.add(m); }
    }
    // 素材が読みこめたら：雪の質感・本物の木や小物・キャラ
    useAssets() {
      const A = YD.A, S = this.scene; if (!A || this.assetsOn) return; this.assetsOn = true;
      if (A.tex.snow) {
        const t = A.tex.snow; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        const g = t.clone(); g.repeat.set(48, 48); g.needsUpdate = true; this.ground.material.map = g;
        if (A.tex.snowN) { const n = A.tex.snowN.clone(); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(48, 48); n.needsUpdate = true; this.ground.material.normalMap = n; this.ground.material.normalScale = new THREE.Vector2(0.45, 0.45); }
        this.ground.material.needsUpdate = true;
        this.snowTex = t; this.snowN = A.tex.snowN;
      }
      if (A.decor) {
        this.coneTrees.visible = false;
        const kinds = ['tree-snow-a', 'tree-snow-b', 'tree-snow-c'];
        for (const sp of this.treeSpots) { const m = YD.decor(sp.d < 30 && sp.k === 0 && sp.x > 0 && sp.z > 0 ? 'tree-decorated-snow' : kinds[sp.k], 2.6 * sp.s); if (!m) continue; m.position.set(sp.x, 0, sp.z); m.rotation.y = sp.x * 7 % 6.28; if (sp.d > 34) m.traverse(o => { o.castShadow = false; }); S.add(m); }
        const R = YD.rng(7), put = (n, x, z, s, ry) => { const m = YD.decor(n, s); if (m) { m.position.set(x, 0, z); m.rotation.y = ry ?? R() * 6.28; S.add(m); } return m; };
        // 柵のまわり（場外）
        for (const [x, z] of [[-22.5, -22.5], [22.5, -22.5], [-22.5, 22.5], [22.5, 22.5]]) { put('snowman', x, z, 1.9, Math.atan2(-x, -z)); put('present-a-cube', x + Math.sign(x) * 1.4, z - Math.sign(z) * 0.4, 1.8); put('present-b-round', x - Math.sign(x) * 0.3, z + Math.sign(z) * 1.3, 1.7); }
        for (let k = 0; k < 4; k++) for (const u of [-14, -6, 6, 14]) { const a = k * Math.PI / 2, x = Math.cos(a) * 21 - Math.sin(a) * u, z = Math.sin(a) * 21 + Math.cos(a) * u; put('lantern', x, z, 1.5, -a); }
        for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = 24 + R() * 5; put(['rocks-large', 'rocks-medium', 'snow-pile', 'snow-bunker'][i % 4], Math.cos(a) * d, Math.sin(a) * d, 1.6 + R()); }
        put('sled', 23.5, 4, 2.2, 0.6); put('sled', -24, -8, 2.2, 2.2); put('reindeer', 27, -14, 2.4, -1.2); put('reindeer', -29, 16, 2.4, 2.1); put('candy-cane-red', 22.6, -2, 2.2, 0); put('candy-cane-red', -22.6, 2, 2.2, 0);
        put('tree-decorated-snow', -26, -24, 4.5, 0.3); put('lights-colored', 0, 22.8, 3, 0);
      }
    }
    setAvatars(avs) {
      for (let i = 0; i < 2; i++) {
        const c = this.chars[i]; if (c && c.av === avs[i] && c.glb === !!(YD.A && YD.A.chars[avs[i]])) continue;
        if (c) this.scene.remove(c.root);
        this.chars[i] = makeCharGLB(i, avs[i]); this.scene.add(this.chars[i].root);
      }
      this.avs = avs.slice();
    }
    snow() {
      const n = this.lo ? 700 : 1400, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * 50; a[i * 3 + 1] = Math.random() * 20; a[i * 3 + 2] = (Math.random() - 0.5) * 50; }
      g.setAttribute('position', new THREE.BufferAttribute(a, 3));
      const t = canvasTex(32, 32, (x) => { const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); });
      this.flakes = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, map: t, transparent: true, depthWrite: false, opacity: 0.9 })); this.flakes.frustumCulled = false; this.scene.add(this.flakes);
    }
    // ラウンドごとにステージを作り直す
    build(world) {
      const S = this.scene;
      for (const m of this.obsM) { S.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); }
      for (const k in this.pickM) S.remove(this.pickM[k]); this.pickM = {};
      if (this.padM) this.padM.forEach(m => S.remove(m));
      for (const b of this.balls) S.remove(b.m); this.balls = []; this.parts.clear();
      this.obsM = world.map.obs.map(o => this.obsMesh(o));
      const pt = canvasTex(128, 128, (x) => { x.fillStyle = '#25c6ff'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = '#e9fbff'; x.beginPath(); x.arc(64, 64, 50, 0, 7); x.fill(); x.fillStyle = '#25c6ff'; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(64, 20 + k * 26); x.lineTo(92, 46 + k * 26); x.lineTo(36, 46 + k * 26); x.fill(); } });
      this.padM = world.map.pads.map(p => { const m = new THREE.Mesh(new THREE.CircleGeometry(p.r, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: pt, transparent: true })); m.position.set(p.x, 0.03, p.z); S.add(m); return m; });
      this.chars.forEach(c => { c.koT = 0; c.sm.visible = false; c.body.visible = true; if (c.glb) c.reset(); });
      for (const id in this.decoyM) S.remove(this.decoyM[id].root); this.decoyM = {};
      for (const sm of this.smokeM || []) S.remove(sm.g); this.smokeM = [];
      this.clearReplayBalls();
    }
    obsMesh(o) {
      const geo = o.kind === 'b' ? roundBox(o.hx * 2, o.h0, o.hz * 2, Math.min(0.28, o.hx, o.hz, o.h0 / 2)) : mound(o.r, o.h0);
      const mat = new THREE.MeshLambertMaterial({ color: o.dyn ? '#eef6ff' : '#f4f8ff', emissive: '#000000' });
      if (this.snowTex) { mat.map = this.snowTex; if (this.snowN) { mat.normalMap = this.snowN; mat.normalScale = new THREE.Vector2(0.5, 0.5); } }
      const m = new THREE.Mesh(geo, mat); m.position.set(o.x, 0, o.z); m.castShadow = m.receiveShadow = true; this.scene.add(m);
      return { o, mesh: m, st: 0 };
    }
    smoke(m) {
      const g = new THREE.Group(); g.position.set(m.x, 0, m.z);
      if (!this.puffTex) this.puffTex = canvasTex(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(250,252,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
      const R = YD.rng((m.x * 100) | 0);
      for (let i = 0; i < 26; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.puffTex, color: i % 3 ? '#ffffff' : '#e3eefb', transparent: true, depthWrite: false, opacity: 0.92 }));
        const a = R() * 6.28, u = R(), rr = Math.sqrt(u) * 0.8; sp.userData = { x: Math.cos(a) * rr, y: 0.25 + R() * 0.75, z: Math.sin(a) * rr, s: 1.6 + R() * 1.4, ph: R() * 6 };
        g.add(sp);
      }
      this.scene.add(g); return { m, g };
    }
    pickMesh(pk) {
      const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.25 });
      let col = '#ffb74a';
      if (pk.kind === 'cocoa') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.36, 16), L('#fff6e8')); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), L('#7b4a2a')); d.position.y = 0.17; const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12), L('#fff6e8')); h.position.x = 0.24; g.add(c, d, h); col = '#ff9a4a'; }
      else if (pk.kind === 'kairo') { const b = new THREE.Mesh(roundBox(0.42, 0.5, 0.12, 0.05, 2), L('#ff6a3d')); b.position.y = -0.25; const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.13), L('#ffffff')); g.add(b, s); col = '#ff5a3d'; }
      else { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshLambertMaterial({ color: '#9fe8ff', emissive: '#4fc8ff', emissiveIntensity: 0.6 })); c.scale.y = 1.4; g.add(c); col = '#4fc8ff'; }
      g.children.forEach(m => { m.castShadow = true; });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, depthWrite: false }));
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 14, 12, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.y = 7;
      const root = new THREE.Group(); root.add(g, ring, beam); root.userData = { item: g, ring, beam }; return root;
    }
    ball(b) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(b.r * 1.15, 10, 8), new THREE.MeshLambertMaterial({ color: b.ice ? '#bff0ff' : '#ffffff', emissive: b.ice ? '#4fc8ff' : '#556070', emissiveIntensity: b.ice ? 0.6 : 0.25 }));
      m.castShadow = true; m.position.set(b.x, b.y, b.z); this.scene.add(m); this.balls.push({ b, m });
    }
    // リプレイ用の雪玉
    replayBalls(list) {
      const seen = {};
      for (const b of list) { seen[b.id] = 1; let m = this.rpB[b.id]; if (!m) { m = this.rpB[b.id] = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshLambertMaterial({ color: b.ice ? '#bff0ff' : '#ffffff', emissive: b.ice ? '#4fc8ff' : '#556070', emissiveIntensity: 0.4 })); this.scene.add(m); } m.position.set(b.x, b.y, b.z); }
      for (const id in this.rpB) if (!seen[id]) { this.scene.remove(this.rpB[id]); delete this.rpB[id]; }
    }
    clearReplayBalls() { for (const id in this.rpB) this.scene.remove(this.rpB[id]); this.rpB = {}; }
    hideLiveBalls() { for (const B of this.balls) this.scene.remove(B.m); this.balls = []; }
    // 画面の位置（HTMLの吹き出し用）
    project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.cam); return { x: (v.x + 1) / 2 * this.W, y: (1 - v.y) / 2 * this.H, on: v.z < 1 && v.z > -1 }; }
    // ---------- 毎コマ ----------
    frame(w, view, dt) {
      const t = w.t;
      // 遮蔽（特技のかべは後から増える）
      while (this.obsM.length < w.map.obs.length) this.obsM.push(this.obsMesh(w.map.obs[this.obsM.length]));
      for (const M of this.obsM) {
        const o = M.o, h = YD.hAt(o, t), warn = YD.warnAt(o, t);
        const rise = o.born != null ? Math.min(1, Math.max(0.02, (t - o.born) / 0.16)) : 1;
        M.mesh.visible = h > 0.02 && t >= (o.born ?? -99); M.mesh.scale.y = Math.max(0.001, h / o.h0 * rise);
        const mat = M.mesh.material;
        if (warn) { const k = 0.5 + 0.5 * Math.sin(t * (10 + (t - o.tm + C.MELT_WARN) * 6)); mat.emissive.setRGB(0.05 + 0.25 * k, 0.25 + 0.35 * k, 0.55 * k + 0.1); M.mesh.position.x = o.x + Math.sin(t * 60) * 0.02 * k; }
        else if (h < o.h0) { mat.emissive.setRGB(0.08, 0.2, 0.35); mat.color.set('#dcebff'); M.mesh.position.x = o.x; if (h > 0.05 && Math.random() < dt * 30) { const a = Math.random() * 6.28, rr = o.kind === 'b' ? 1 : o.r; this.parts.add({ x: o.x + Math.cos(a) * (o.kind === 'b' ? o.hx : rr) * Math.random(), y: h, z: o.z + Math.sin(a) * (o.kind === 'b' ? o.hz : rr) * Math.random(), vx: 0, vy: 1.5, vz: 0, life: 0.6, sz: 0.06, g: 4, c: '#cfe8ff', drag: 2 }); } }
        else { mat.emissive.setRGB(0, 0, 0); M.mesh.position.x = o.x; }
      }
      // アイテム
      for (const pk of w.map.picks) {
        const before = pk.t - t, gone = w.taken[pk.id] != null || (w.pending[pk.id] != null);
        if (before > C.PICK_WARN || gone) { if (this.pickM[pk.id]) { this.scene.remove(this.pickM[pk.id]); delete this.pickM[pk.id]; } continue; }
        let m = this.pickM[pk.id]; if (!m) { m = this.pickM[pk.id] = this.pickMesh(pk); this.scene.add(m); }
        const y = pk.y != null ? pk.y : YD.groundAt(w.map, pk.x, pk.z, 0.2, t); m.position.set(pk.x, y, pk.z);
        const u = m.userData, on = before <= 0;
        u.item.visible = on; u.item.position.y = 0.55 + Math.sin(t * 3 + pk.id) * 0.08; u.item.rotation.y = t * 1.6;
        u.ring.scale.setScalar(on ? 1 + Math.sin(t * 5) * 0.06 : 0.4 + 0.6 * (1 - before / C.PICK_WARN)); u.beam.material.opacity = on ? 0.16 : 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * 12));
      }
      // 雪玉
      for (const B of this.balls) { B.m.position.set(B.b.x, B.b.y, B.b.z); if (B.b.dead) this.scene.remove(B.m); }
      this.balls = this.balls.filter(B => !B.b.dead);
      // キャラ
      w.players.forEach((p, i) => this.charFrame(this.chars[i], p, p, dt, t));
      // にせ雪だるま
      const seen = {};
      for (const d of (view.decoys || w.decoys)) {
        seen[d.id] = 1; let c = this.decoyM[d.id];
        if (!d.alive) { if (c) { this.scene.remove(c.root); delete this.decoyM[d.id]; } continue; }
        if (!c) { c = this.decoyM[d.id] = makeCharGLB(d.own, (this.avs || [])[d.own]); this.scene.add(c.root); }
        this.charFrame(c, d, d, dt, t);
      }
      for (const id in this.decoyM) if (!seen[id]) { this.scene.remove(this.decoyM[id].root); delete this.decoyM[id]; }
      // 雪けむり
      const sms = view.smokes || w.map.smokes;
      for (const m of sms) if (!this.smokeM.some(q => q.m === m)) this.smokeM.push(this.smoke(m));
      this.smokeM = this.smokeM.filter(q => { if (!sms.includes(q.m) || t > q.m.t1 || t < q.m.t0 - 0.05) { this.scene.remove(q.g); return false; } return true; });
      for (const q of this.smokeM) { const k = YD.smokeR(q.m, t) / q.m.r; for (const sp of q.g.children) { const u = sp.userData; sp.position.set(u.x * q.m.r * k, u.y * q.m.r * Math.max(0.5, k) + Math.sin(t + u.ph) * 0.1, u.z * q.m.r * k); sp.scale.setScalar(u.s * Math.max(0.3, k) * 1.25); const cd = this.camPos.distanceTo(sp.getWorldPosition(this._v || (this._v = new THREE.Vector3()))); sp.material.opacity = 0.93 * Math.min(1, k * 1.5) * Math.max(0.12, Math.min(1, (cd - 0.8) / 3)); } }
      this.parts.update(dt);
      // カメラ
      this.camera(w, view, dt);
      // 雪
      const fp = this.flakes.geometry.attributes.position, cx = this.camPos.x, cz = this.camPos.z;
      for (let i = 0; i < fp.count; i++) {
        let x = fp.getX(i), y = fp.getY(i) - dt * 1.4, z = fp.getZ(i); x += Math.sin(t * 0.7 + i) * dt * 0.3;
        if (y < 0) y += 20; if (x - cx > 25) x -= 50; if (x - cx < -25) x += 50; if (z - cz > 25) z -= 50; if (z - cz < -25) z += 50; fp.setXYZ(i, x, y, z);
      }
      fp.needsUpdate = true;
      this.r.render(this.scene, this.cam);
    }
    charFrame(c, p, s, dt, t) {
      if (c.glb) return this.charFrameGLB(c, p, dt, t);
      c.root.position.set(p.x, p.y, p.z); c.root.rotation.y = p.yaw;
      if (!p.alive) {
        c.koT += dt; c.body.visible = false; c.sm.visible = true; const k = Math.min(1, c.koT / 0.35); c.sm.scale.setScalar(k < 1 ? 0.3 + k * 0.85 - Math.sin(k * Math.PI) * 0.1 : 1); c.ring.visible = false;
        if (c.koT < dt * 1.5) this.parts.burst(p.x, p.y + 1, p.z, 40, { sp: 6, sz: 0.12, life: 1 });
        return;
      }
      c.body.visible = true; c.sm.visible = false; c.ring.visible = true; c.koT = 0;
      const sp = Math.hypot(p.vx || 0, p.vz || 0), slide = s.slide > 0 || s.sl, climb = !!(s.climb || s.cl), heal = s.heal ? s.heal.k : s.hk, ground = s.ground ?? s.gr;
      c.ph += dt * (sp * 1.9 + 0.01);
      const run = ground && !slide ? Math.min(1, sp / C.RUN) : 0, sw = Math.sin(c.ph) * 0.9 * run;
      // 投げ
      if (p.throwN !== c.thN) { c.thN = p.throwN; c.thT = 0; }
      c.thT += dt; const th = c.thT < 0.22 ? Math.sin(c.thT / 0.22 * Math.PI) : 0;
      const rel = (s.reload ?? s.rl) > 0;
      // 体
      c.body.position.y = slide ? -0.32 : (rel ? -0.18 : 0) + Math.abs(Math.sin(c.ph)) * 0.05 * run;
      c.body.rotation.x = slide ? 0.75 : climb ? -0.3 : run * -0.12 + (rel ? -0.35 : 0);
      c.legs[0].rotation.x = slide ? -1.2 : !ground ? -0.5 : sw; c.legs[1].rotation.x = slide ? -0.9 : !ground ? 0.3 : -sw;
      c.torso.rotation.x = slide ? -0.55 : 0;
      c.head.rotation.x = YD.clamp(-(p.pitch || 0) * 0.6, -0.5, 0.5) - (slide ? -0.3 : 0);
      const A = c.arms;
      if (climb) { A[0].rotation.x = A[1].rotation.x = -2.7; }
      else if (heal) { A[0].rotation.x = -1.9; A[0].rotation.z = -0.5; A[1].rotation.x = -sw * 0.5; }
      else if (rel) { A[0].rotation.x = A[1].rotation.x = -0.9 + Math.sin(t * 14) * 0.3; A[0].rotation.z = -0.25; }
      else { A[0].rotation.x = -sw * 0.7 + (slide ? -1.0 : 0); A[0].rotation.z = -0.25; A[1].rotation.x = th > 0 ? -2.6 + th * 1.4 : (-0.6 + sw * 0.3 + (slide ? -0.6 : 0)); }
      c.cup.visible = heal === 'cocoa'; c.pad.visible = heal === 'kairo';
      c.glow.visible = !!heal; if (heal) { const k = (t * 1.6) % 1; c.glow.position.y = 0.2 + k * 1.6; c.glow.scale.setScalar(1.1 - k * 0.4); c.glow.material.opacity = 0.9 * (1 - k); c.glow.material.color.set(heal === 'cocoa' ? '#ffd28a' : '#ff8a3d'); }
      const ice = (s.ice ?? 0) > 0, mag = s.mag ?? 1; c.held.visible = !heal && !climb && (ice || (mag > 0 && !rel)) && c.thT > 0.12;
      if (ice !== c.heldIce) { c.heldIce = ice; c.held.material.color.set(ice ? '#a8ecff' : '#ffffff'); c.held.material.emissive = new THREE.Color(ice ? '#3cb8ff' : '#000000'); }
      // もこもこ
      const ar = Math.max(0, p.decoy ? p.showAr : p.ar) / C.ARMOR; c.puff.visible = ar > 0.01; c.puff.scale.set(0.9 + ar * 0.12, 1, 0.9 + ar * 0.12);
      const nb = Math.round((1 - (p.decoy ? p.showHp : p.hp) / C.HP) * 12); c.blobs.forEach((b, i) => { b.visible = i < nb; });
      if (heal && Math.random() < dt * 30) { const h = p.y + 1.6; this.parts.add({ x: p.x, y: h, z: p.z, vx: (Math.random() - 0.5) * 0.6, vy: 1.4, vz: (Math.random() - 0.5) * 0.6, life: 1.1, sz: 0.1, g: -1, c: heal === 'cocoa' ? '#ffe6c8' : '#ffb27a', drag: 2 }); }
      if (slide && Math.random() < dt * 40) this.parts.add({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + 0.05, z: p.z + (Math.random() - 0.5) * 0.4, vx: -(p.vx || 0) * 0.15, vy: 1.5 + Math.random(), vz: -(p.vz || 0) * 0.15, life: 0.45, sz: 0.06, g: 8, drag: 2 });
    }
    charFrameGLB(c, p, dt, t) {
      c.root.position.set(p.x, p.y, p.z); c.root.rotation.y = p.yaw;
      if (!p.alive) {
        c.koT += dt; c.ring.visible = false; c.glow.visible = false;
        if (c.koT < 0.32) { setUpper(c, null); setBase(c, 'die'); c.body.visible = true; c.sm.visible = false; }
        else {
          c.body.visible = false; c.sm.visible = true; const k = Math.min(1, (c.koT - 0.32) / 0.3); c.sm.scale.setScalar(1.75 * (k < 1 ? 0.3 + k * 0.85 - Math.sin(k * Math.PI) * 0.1 : 1));
          if (!c.popped) { c.popped = true; this.parts.burst(p.x, p.y + 1, p.z, 44, { sp: 6, sz: 0.12, life: 1 }); }
        }
        c.mixer.update(dt); return;
      }
      if (c.koT > 0) c.reset();
      c.body.visible = true; c.sm.visible = false; c.ring.visible = true;
      const sp = Math.hypot(p.vx || 0, p.vz || 0), slide = p.slide > 0, climb = !!p.climb, heal = p.heal ? p.heal.k : null, ground = p.ground;
      let base = slide ? 'crouch' : climb ? 'jump' : !ground ? ((p.vy || 0) > 1 ? 'jump' : 'fall') : sp > 4.3 ? 'sprint' : sp > 0.5 ? 'walk' : 'idle';
      setBase(c, base);
      if (c.acts.walk) c.acts.walk.timeScale = Math.max(0.6, sp / 2.6); if (c.acts.sprint) c.acts.sprint.timeScale = Math.max(0.8, sp / 6.2);
      if (p.throwN !== c.thN) { const first = c.thN === 0 && c.thT > 8; c.thN = p.throwN; c.thT = 0; if (!first) setUpper(c, 'throw', true); }
      c.thT += dt;
      const rel = (p.reload || 0) > 0;
      const up = c.thT < 0.25 ? 'throw' : heal ? 'drink' : rel ? 'scoop' : null;
      setUpper(c, up);
      c.mixer.update(dt);
      c.body.rotation.x = slide ? -0.25 : climb ? 0.2 : 0; c.body.position.y = slide ? -0.08 : 0;
      c.cup.visible = heal === 'cocoa'; c.pad.visible = heal === 'kairo';
      const ice = (p.ice || 0) > 0, mag = p.mag ?? 1; c.held.visible = !heal && !climb && (ice || (mag > 0 && !rel)) && c.thT > 0.18;
      if (ice !== c.heldIce) { c.heldIce = ice; c.held.material.color.set(ice ? '#a8ecff' : '#ffffff'); c.held.material.emissive = new THREE.Color(ice ? '#3cb8ff' : '#000000'); }
      const ar = Math.max(0, p.decoy ? p.showAr : p.ar) / C.ARMOR; c.puff.visible = ar > 0.01; c.puff.scale.set(0.9 + ar * 0.14, 1, 0.9 + ar * 0.14);
      const nb = Math.round((1 - (p.decoy ? p.showHp : p.hp) / C.HP) * 12); for (let i = 0; i < c.blobs.length; i++) c.blobs[i].visible = i < nb;
      c.glow.visible = !!heal; if (heal) { const k = (t * 1.6) % 1; c.glow.position.y = 0.2 + k * 1.5; c.glow.scale.setScalar(1.1 - k * 0.4); c.glow.material.opacity = 0.9 * (1 - k); c.glow.material.color.set(heal === 'cocoa' ? '#ffd28a' : '#ff8a3d'); }
      if (heal && Math.random() < dt * 30) this.parts.add({ x: p.x, y: p.y + 1.55, z: p.z, vx: (Math.random() - 0.5) * 0.6, vy: 1.4, vz: (Math.random() - 0.5) * 0.6, life: 1.1, sz: 0.1, g: -1, c: heal === 'cocoa' ? '#ffe6c8' : '#ffb27a', drag: 2 });
      if (slide && Math.random() < dt * 40) this.parts.add({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y + 0.05, z: p.z + (Math.random() - 0.5) * 0.4, vx: -(p.vx || 0) * 0.15, vy: 1.5 + Math.random(), vz: -(p.vz || 0) * 0.15, life: 0.45, sz: 0.06, g: 8, drag: 2 });
      if (ground && sp > 4 && !slide) { c.ph += dt * sp * 1.6; if (c.ph > Math.PI) { c.ph -= Math.PI; if (YD.onStep) YD.onStep(p); } }
    }
    camera(w, v, dt) {
      const cam = this.cam;
      let px, py, pz, yaw, pitch;
      if (v.cine) { // リプレイ：決めた位置から
        const c = v.cine; this.camPos.lerp(new THREE.Vector3(c.from.x, c.from.y, c.from.z), Math.min(1, dt * 4 + (this.cineSnap ? 1 : 0))); this.cineSnap = false;
        cam.position.copy(this.camPos); cam.lookAt(c.at.x, c.at.y, c.at.z); cam.updateMatrixWorld(); this.chars.forEach(ch => { ch.root.visible = true; }); return;
      }
      if (v.free) { // 観戦：ふたりの間を少し上から
        const a = w.players[0], b = w.players[1], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, d = Math.hypot(a.x - b.x, a.z - b.z);
        this.oy = (this.oy || 0) + dt * 0.12; const R = 10 + d * 0.6;
        const tp = new THREE.Vector3(mx + Math.sin(this.oy) * R, 7 + d * 0.35, mz + Math.cos(this.oy) * R);
        this.camPos.lerp(tp, Math.min(1, dt * 2)); cam.position.copy(this.camPos); cam.lookAt(mx, 1, mz); cam.updateMatrixWorld(); return;
      }
      const p = v.me; yaw = v.yaw; pitch = v.pitch;
      const slide = p.slide > 0 || (v.states && v.states[p.slot] && v.states[p.slot].sl);
      this.pivY = this.pivY == null ? p.y + 1.45 : lerp(this.pivY, p.y + (slide ? 0.95 : 1.45), Math.min(1, dt * 14));
      px = p.x; py = this.pivY; pz = p.z;
      const cp = Math.cos(pitch), fx = -Math.sin(yaw) * cp, fy = Math.sin(pitch), fz = -Math.cos(yaw) * cp, rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const back = v.dead ? 5.5 : 3.8, side = v.dead ? 0 : 1.0, up = 0.5;
      let cx = px + rx * side - fx * back, cy = py + up - fy * back, cz = pz + rz * side - fz * back;
      // かべにめりこまない
      const sx = px + rx * side * 0.6, sz = pz + rz * side * 0.6, r = YD.ray(w.map, sx, py, sz, cx, cy, cz, w.t);
      if (r.t < 1) { const u = Math.max(0.1, r.t - 0.12); cx = sx + (cx - sx) * u; cy = py + (cy - py) * u; cz = sz + (cz - sz) * u; }
      cy = Math.max(0.35, cy);
      this.shake = Math.max(0, this.shake - dt * 3);
      const sh = this.shake * this.shake * 0.25;
      cam.position.set(cx + (Math.random() - 0.5) * sh, cy + (Math.random() - 0.5) * sh, cz + (Math.random() - 0.5) * sh);
      cam.lookAt(cam.position.x + fx, cam.position.y + fy, cam.position.z + fz);
      cam.updateMatrixWorld(); this.camPos.copy(cam.position); this.camFwd.set(fx, fy, fz);
      // 近すぎたら自分を消す
      const near = Math.hypot(cx - px, cy - py, cz - pz); this.chars[p.slot].root.visible = near > 2.0 || v.dead;
      // 速いときは少し広角
      const k = Math.min(1, Math.max(0, (Math.hypot(p.vx, p.vz) - C.RUN) / 5)); this.fovK = lerp(this.fovK, k, Math.min(1, dt * 6));
      const base = this.W / this.H < 1 ? 82 : 70; if (Math.abs(cam.fov - (base + this.fovK * 8)) > 0.05) { cam.fov = base + this.fovK * 8; cam.updateProjectionMatrix(); }
    }
  }
  YD.Render = Render; YD.TEAM = TEAM;
})();
