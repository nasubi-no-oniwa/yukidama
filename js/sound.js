// =============================================
//  音：効果音は Kenney「Impact Sounds」（CC0）＋合成、BGMは自作（ファイル）
// =============================================
(function () {
  let ac = null, bus = null, master = null, mus = null, nbuf = null, sfx = null, SP = null, MB = {}, mark = 0, muted = (() => { try { return localStorage.getItem('yd_mute') === '1'; } catch (e) { return false; } })();
  const A = () => {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const c = ac.createDynamicsCompressor(); c.threshold.value = -14; c.ratio.value = 4; c.attack.value = 0.003; c.release.value = 0.15;
        master = ac.createGain(); master.gain.value = muted ? 0 : 1; c.connect(master); master.connect(ac.destination); bus = c;
        mus = ac.createGain(); mus.gain.value = 0.5; mus.connect(master);
        loadBufs();
        ac.onstatechange = () => { if (ac.state === 'running' && bgm.want && !bgm.src) bgm.start(bgm.want); };
        nbuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
    } catch (e) {} return ac;
  };
  // pan: -1..1（左右）、vol: 距離で小さく
  function out(pan) { if (pan == null || !ac.createStereoPanner) return bus; const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(bus); return p; }
  function tone(f, d, type = 'triangle', v = 0.07, delay = 0, f2, pan) { const a = A(); if (!a || a.state !== 'running') return; const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(out(pan)); o.start(t); o.stop(t + d + 0.02); }
  function noise(d, v = 0.15, f = 1200, type = 'lowpass', delay = 0, pan, f2) { const a = A(); if (!a || a.state !== 'running') return; const t = a.currentTime + delay, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.buffer = nbuf; s.connect(fl); fl.connect(g); g.connect(out(pan)); s.start(t, Math.random() * 0.8, d + 0.05); }
  // ---- ファイルの音 ----
  async function getBuf(name) { const r = await fetch(YD.url(name)); const ab = await r.arrayBuffer(); return await new Promise((res, rej) => ac.decodeAudioData(ab, res, rej)); }
  function firstLoud(b, th) { const d = b.getChannelData(0), n = Math.min(d.length, b.sampleRate * 0.4); for (let i = 0; i < n; i++) if (Math.abs(d[i]) > th) return i / b.sampleRate; return 0; }
  async function loadBufs() {
    try { const [b, j] = await Promise.all([getBuf('sfx.mp3'), fetch(YD.url('sfx.json')).then(r => r.json())]); sfx = b; SP = j; mark = firstLoud(b, 0.5); } catch (e) { sfx = null; }
    for (const k of ['bgm', 'title']) { try { MB[k] = await getBuf(k + '.mp3'); MB[k].lp = firstLoud(MB[k], 0.002); } catch (e) {} }
    if (bgm.want) bgm.start(bgm.want);
  }
  // name の中からひとつ（i 指定もできる）
  function smp(name, v = 1, pan, rate = 1, delay = 0, i) {
    const a = A(); if (!a || !sfx || !SP || !SP[name]) return false; if (a.state !== 'running') return true;
    const L = SP[name], it = L[i != null ? i % L.length : (Math.random() * L.length) | 0];
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = sfx; s.playbackRate.value = rate; g.gain.value = v; s.connect(g); g.connect(out(pan));
    s.start(a.currentTime + delay, mark + it[0], it[1] + 0.02); return true;
  }
  const rr = (a, b) => a + Math.random() * (b - a);
  function chime(f, d, v, delay = 0, pan) { [1, 2.01, 3.03].forEach((r, i) => tone(f * r, d / (1 + i * 0.6), 'sine', v / (1 + i * 1.4), delay, null, pan)); }
  const S = {
    throw: (v = 1, pan) => { noise(0.12, 0.13 * v, 900, 'bandpass', 0, pan, 2600); },
    throwIce: (v = 1, pan) => { noise(0.14, 0.14 * v, 1600, 'bandpass', 0, pan, 5200); tone(1800, 0.08, 'sine', 0.02 * v, 0, 2600, pan); },
    splat: (v = 1, pan) => { if (smp('splat', 0.55 * v, pan, rr(0.85, 1.1))) return; noise(0.16, 0.22 * v, 700, 'lowpass', 0, pan, 250); tone(160, 0.08, 'sine', 0.06 * v, 0, 80, pan); },
    splatIce: (v = 1, pan) => { noise(0.1, 0.18 * v, 5000, 'highpass', 0, pan); [2400, 3100, 3900].forEach((f, i) => tone(f, 0.12, 'sine', 0.025 * v, i * 0.02, null, pan)); },
    hitMe: () => { tone(110, 0.16, 'sine', 0.16, 0, 50); if (smp('hit', 0.95, null, rr(0.9, 1.05))) return; noise(0.22, 0.4, 600, 'lowpass', 0, null, 180); tone(110, 0.18, 'sine', 0.2, 0, 50); },
    hitArmor: (pan) => { if (smp('glassL', 0.45, pan, rr(1.0, 1.2))) { smp('splat', 0.4, pan); return; } noise(0.09, 0.3, 2400, 'bandpass', 0, pan); tone(900, 0.08, 'square', 0.03, 0, 500, pan); },
    hitFoe: (pan) => { tone(1300, 0.05, 'triangle', 0.04, 0.01); if (smp('hit', 0.7, pan, rr(1.0, 1.15))) return; noise(0.14, 0.3, 900, 'lowpass', 0, pan, 300); tone(1300, 0.06, 'triangle', 0.06, 0.01); },
    marker: () => { tone(1700, 0.05, 'square', 0.035); },
    broke: () => { [2637, 3951].forEach((f, i) => tone(f, 0.3, 'sine', 0.04, i * 0.03)); if (smp('glassH', 0.9, null, 1) && smp('glassM', 0.55, null, 1.1, 0.04)) return; noise(0.35, 0.4, 6000, 'highpass'); [2637, 3136, 3951, 4699].forEach((f, i) => tone(f, 0.3, 'sine', 0.05, i * 0.025)); tone(500, 0.3, 'sawtooth', 0.04, 0, 160); },
    ko: () => { if (smp('punch', 0.9, null, 0.85)) { smp('bell', 0.35, null, 1.5, 0.12); [784, 988, 1175, 1568].forEach((f, i) => chime(f, 0.5, 0.05, 0.2 + i * 0.09)); return; } noise(0.6, 0.45, 1200, 'lowpass', 0, null, 200); tone(180, 0.6, 'sine', 0.3, 0, 40); [784, 988, 1175, 1568].forEach((f, i) => chime(f, 0.5, 0.06, 0.15 + i * 0.09)); },
    jump: () => { tone(300, 0.14, 'sine', 0.05, 0, 620); noise(0.08, 0.06, 2000, 'highpass'); },
    pad: () => { tone(220, 0.45, 'sine', 0.12, 0, 1200); noise(0.3, 0.12, 3000, 'bandpass'); },
    land: v => { if (smp('step', Math.min(0.9, 0.3 + v * 0.05), null, 0.8)) return; noise(0.14, Math.min(0.3, 0.06 + v * 0.015), 500); },
    slide: () => { noise(0.5, 0.16, 3000, 'bandpass', 0, null, 900); },
    climb: () => { if (smp('step', 0.5, null, 1.2) && smp('step', 0.5, null, 1.1, 0.14)) return; noise(0.18, 0.1, 1200); tone(220, 0.15, 'sine', 0.04, 0.05, 330); },
    reload: () => { if (smp('step', 0.35, null, 1.6) && smp('step', 0.3, null, 1.8, 0.28) && smp('step', 0.3, null, 1.7, 0.6)) return; noise(0.08, 0.1, 1500, 'lowpass'); noise(0.08, 0.1, 1100, 'lowpass', 0.25); noise(0.08, 0.1, 1300, 'lowpass', 0.55); },
    reloaded: () => tone(1200, 0.06, 'triangle', 0.04),
    empty: () => tone(240, 0.06, 'square', 0.03),
    pick: kind => { if (kind === 'ice') { [1568, 2093, 2637].forEach((f, i) => chime(f, 0.4, 0.05, i * 0.06)); } else [880, 1320].forEach((f, i) => chime(f, 0.3, 0.06, i * 0.07)); },
    pickFoe: () => tone(500, 0.15, 'triangle', 0.04, 0, 380),
    healStart: () => { noise(0.35, 0.05, 900, 'bandpass'); },
    healFoe: (v = 1, pan) => { noise(0.5, 0.09 * v, 700, 'bandpass', 0, pan, 1500); tone(330, 0.25, 'sine', 0.04 * v, 0.05, 440, pan); },
    healDone: kind => { if (kind === 'cocoa') [523, 659, 784].forEach((f, i) => chime(f, 0.3, 0.05, i * 0.06)); else [440, 660, 880].forEach((f, i) => chime(f, 0.3, 0.05, i * 0.05)); },
    no: () => { tone(220, 0.1, 'square', 0.04); tone(180, 0.12, 'square', 0.04, 0.08); },
    warn: (v = 1) => { [3200, 2600].forEach((f, i) => tone(f, 0.08, 'sine', 0.03 * v, i * 0.05)); noise(0.05, 0.06 * v, 6000, 'highpass'); },
    melt: (v = 1) => { noise(0.9, 0.14 * v, 900, 'lowpass', 0, null, 200); tone(140, 0.6, 'sine', 0.06 * v, 0, 60); },
    spawn: () => { [1047, 1319].forEach((f, i) => chime(f, 0.25, 0.03, i * 0.05)); },
    count: () => tone(660, 0.12, 'square', 0.06), go: () => { tone(990, 0.35, 'square', 0.07); noise(0.3, 0.2, 3000, 'highpass'); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => chime(f, 0.4, 0.07, i * 0.1)), lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, i * 0.16)),
    cold: () => { noise(1.2, 0.12, 400, 'bandpass', 0, null, 1400); },
    ui: () => tone(880, 0.05, 'square', 0.03),
    step: (v = 1, pan) => { smp('step', 0.4 * v, pan, rr(0.95, 1.15)); },
    wall: (v = 1) => { if (smp('mine', 0.8 * v, null, 0.7)) { smp('hit', 0.7 * v, null, 0.7); tone(90, 0.3, 'sine', 0.2 * v, 0, 45); return; } noise(0.25, 0.3 * v, 500, 'lowpass', 0, null, 150); tone(90, 0.3, 'sine', 0.22 * v, 0, 45); noise(0.15, 0.12 * v, 2500, 'bandpass', 0.05); },
    smoke: (v = 1) => { noise(0.9, 0.22 * v, 1200, 'bandpass', 0, null, 300); noise(0.4, 0.12 * v, 4000, 'highpass'); },
    decoy: () => { [660, 880, 660].forEach((f, i) => tone(f, 0.1, 'triangle', 0.05, i * 0.07)); noise(0.2, 0.1, 2000, 'bandpass'); },
    decoyPop: (v = 1) => { [523, 392, 262].forEach((f, i) => tone(f, 0.12, 'square', 0.025 * v, 0.05 + i * 0.07)); if (smp('hit', 0.8 * v, null, 1.2)) return; noise(0.3, 0.35 * v, 1500, 'lowpass', 0, null, 300); [523, 392, 262].forEach((f, i) => tone(f, 0.12, 'square', 0.03 * v, 0.05 + i * 0.07)); },
    dash: (v = 1) => { noise(0.3, 0.25 * v, 600, 'bandpass', 0, null, 4000); tone(200, 0.25, 'sawtooth', 0.04 * v, 0, 900); }
  };
  // ---- BGM（自作の曲。つなぎ目なしでくり返す） ----
  const SEC = { bgm: 512 * 60 / 142 / 4, title: 256 * 60 / 104 / 4 };
  const bgm = {
    want: null, cur: null, src: null, g: null,
    start(k = 'bgm') {
      this.want = k; const a = A(); if (!a || a.state !== 'running') return;
      if (this.cur === k && this.src) { this.src.playbackRate.value = 1; return; }
      const B = MB[k]; if (!B) return;
      this.stop(true);
      const s = a.createBufferSource(), g = a.createGain(); s.buffer = B; s.loop = true; s.loopStart = B.lp; s.loopEnd = Math.min(B.duration, B.lp + SEC[k]);
      g.gain.setValueAtTime(0, a.currentTime); g.gain.linearRampToValueAtTime(k === 'title' ? 0.8 : 1, a.currentTime + 0.6); s.connect(g); g.connect(mus); s.start(a.currentTime, B.lp);
      this.src = s; this.g = g; this.cur = k;
    },
    mode(m) { if (this.src) this.src.playbackRate.value = m === 'hot' ? 1.1 : 1; },
    stop(quick) {
      const a = ac; if (this.src && a) { const s = this.src, g = this.g; g.gain.cancelScheduledValues(a.currentTime); g.gain.setValueAtTime(g.gain.value, a.currentTime); g.gain.linearRampToValueAtTime(0, a.currentTime + (quick ? 0.25 : 0.8)); s.stop(a.currentTime + (quick ? 0.3 : 0.9)); }
      this.src = null; this.cur = null; if (!quick) this.want = null;
    }
  };
  YD.S = S; YD.bgm = bgm; YD.audio = A;
  YD.mute = v => { if (v != null) { muted = v; try { localStorage.setItem('yd_mute', v ? '1' : '0'); } catch (e) {} if (master) master.gain.value = v ? 0 : 1; } return muted; };
})();
