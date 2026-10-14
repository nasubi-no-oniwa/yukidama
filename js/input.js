// =============================================
//  操作：PC（キーボード＋マウス）・スマホ（スティック＋ボタン）・コントローラー
// =============================================
(function () {
  const $ = id => document.getElementById(id);
  const In = {
    kind: matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse', sens: 1, active: false,
    keys: {}, mouse: false, dyaw: 0, dpitch: 0, edge: {}, held: {},
    stick: { id: null, x0: 0, y0: 0, x: 0, y: 0 }, looks: {}, fireTouch: false, locked: false
  };
  try { In.sens = parseFloat(localStorage.getItem('yd_sens')) || 1; } catch (e) {}
  const press = k => { if (!In.held[k]) In.edge[k] = true; In.held[k] = true; };
  const release = k => { In.held[k] = false; };
  // ---- キーボード ----
  const KMAP = { Space: 'jump', ShiftLeft: 'slide', ShiftRight: 'slide', KeyC: 'slide', KeyR: 'reload', KeyE: 'heal', KeyQ: 'skill', KeyF: 'fire' };
  addEventListener('keydown', e => {
    if (!In.active || e.target.tagName === 'INPUT') return; In.kind = In.kind === 'touch' ? 'touch' : 'mouse';
    In.keys[e.code] = true; const k = KMAP[e.code]; if (k) { press(k); e.preventDefault(); }
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => { In.keys[e.code] = false; const k = KMAP[e.code]; if (k) release(k); });
  addEventListener('blur', () => { In.keys = {}; In.held = {}; In.mouse = false; });
  // ---- マウス ----
  In.bindCanvas = el => {
    el.addEventListener('mousedown', e => {
      if (!In.active || In.kind === 'touch') return;
      if (!In.locked) { try { const r = el.requestPointerLock && el.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) {} return; }
      if (e.button === 0) { In.mouse = true; press('fire'); } if (e.button === 2) press('slide');
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
  };
  addEventListener('mouseup', e => { if (e.button === 0) { In.mouse = false; release('fire'); } if (e.button === 2) release('slide'); });
  document.addEventListener('pointerlockchange', () => { In.locked = !!document.pointerLockElement; if (In.onLock) In.onLock(In.locked); });
  addEventListener('mousemove', e => { if (In.active && In.locked) { In.dyaw -= e.movementX * 0.0023 * In.sens; In.dpitch -= e.movementY * 0.0023 * In.sens; } });
  // ---- タッチ ----
  function setupTouch() {
    const zone = $('touch'); if (!zone) return;
    const knob = $('stick-knob'), base = $('stick-base');
    const BTN = { 'b-fire': 'fire', 'b-jump': 'jump', 'b-slide': 'slide', 'b-heal': 'heal', 'b-skill': 'skill' };
    const btnOf = el => { while (el && el !== zone) { if (BTN[el.id]) return el; el = el.parentElement; } return null; };
    zone.addEventListener('touchstart', e => {
      if (!In.active) return; In.kind = 'touch'; e.preventDefault();
      for (const t of e.changedTouches) {
        const b = btnOf(t.target);
        if (b) { const k = BTN[b.id]; press(k); b.classList.add('on'); In.looks[t.identifier] = { x: t.clientX, y: t.clientY, btn: b, k }; continue; }
        if (t.clientX < innerWidth * 0.42 && In.stick.id == null) {
          In.stick = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: 0, y: 0 };
          base.style.left = t.clientX + 'px'; base.style.top = t.clientY + 'px'; base.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)';
        } else In.looks[t.identifier] = { x: t.clientX, y: t.clientY };
      }
    }, { passive: false });
    zone.addEventListener('touchmove', e => {
      if (!In.active) return; e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === In.stick.id) {
          const R = 52; let dx = t.clientX - In.stick.x0, dy = t.clientY - In.stick.y0; const l = Math.hypot(dx, dy);
          if (l > R) { // 指についていく
            In.stick.x0 += dx * (1 - R / l); In.stick.y0 += dy * (1 - R / l); base.style.left = In.stick.x0 + 'px'; base.style.top = In.stick.y0 + 'px'; dx = t.clientX - In.stick.x0; dy = t.clientY - In.stick.y0;
          }
          In.stick.x = dx / R; In.stick.y = dy / R; knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        } else if (In.looks[t.identifier]) {
          const L = In.looks[t.identifier]; if (L.btn && L.k !== 'fire') continue;
          In.dyaw -= (t.clientX - L.x) * 0.0062 * In.sens * (In.slowK || 1); In.dpitch -= (t.clientY - L.y) * 0.0056 * In.sens * (In.slowK || 1); L.x = t.clientX; L.y = t.clientY;
        }
      }
    }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === In.stick.id) { In.stick = { id: null, x: 0, y: 0 }; base.classList.remove('on'); }
        const L = In.looks[t.identifier]; if (L) { if (L.btn) { release(L.k); L.btn.classList.remove('on'); } delete In.looks[t.identifier]; }
      }
    };
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
  }
  // ---- コントローラー ----
  let padPrev = {};
  function pad(dt, o) {
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; let g = null; for (const p of gps) if (p && p.connected) { g = p; break; }
    if (!g) return;
    const dz = v => Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82;
    const lx = dz(g.axes[0] || 0), ly = dz(g.axes[1] || 0), rx = dz(g.axes[2] || 0), ry = dz(g.axes[3] || 0);
    if (lx || ly || rx || ry) In.kind = 'pad';
    if (In.kind !== 'pad') return;
    o.mx += lx; o.mz -= ly;
    In.dyaw -= rx * Math.abs(rx) * 3.4 * In.sens * dt * (In.slowK || 1); In.dpitch -= ry * Math.abs(ry) * 2.6 * In.sens * dt * (In.slowK || 1);
    const B = i => g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.4);
    const map = { fire: B(7) || B(6) || B(5), jump: B(0), slide: B(1) || B(10), reload: B(2), heal: B(3), skill: B(4) };
    for (const k in map) { if (map[k] && !padPrev[k]) In.edge[k] = true; if (map[k]) o.padHeld[k] = true; }
    padPrev = map;
  }
  In.read = dt => {
    const o = { mx: 0, mz: 0, padHeld: {} };
    const K = In.keys;
    o.mx += (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0);
    o.mz += (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0);
    if (In.stick.id != null) { o.mx += In.stick.x; o.mz -= In.stick.y; }
    pad(dt, o);
    const l = Math.hypot(o.mx, o.mz); if (l > 1) { o.mx /= l; o.mz /= l; }
    const E = In.edge, H = In.held;
    const r = {
      mx: o.mx, mz: o.mz, dyaw: In.dyaw, dpitch: In.dpitch,
      fire: !!(H.fire || o.padHeld.fire), firePress: !!E.fire, jump: !!E.jump, jumpHeld: !!(H.jump || o.padHeld.jump), slide: !!E.slide, heal: !!E.heal, reload: !!E.reload, skill: !!E.skill
    };
    In.dyaw = 0; In.dpitch = 0; In.edge = {};
    return r;
  };
  In.clear = () => { In.held = {}; In.edge = {}; In.keys = {}; In.dyaw = In.dpitch = 0; In.stick = { id: null, x: 0, y: 0 }; In.looks = {}; document.querySelectorAll('#touch .on').forEach(b => b.classList.remove('on')); };
  In.unlock = () => { if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock(); };
  In.setSens = v => { In.sens = v; try { localStorage.setItem('yd_sens', v); } catch (e) {} };
  setupTouch();
  YD.In = In;
})();
