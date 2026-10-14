// =============================================
//  素材の読みこみ（キャラ・小物・効果音・BGM）
//  ・キャラ／小物：Kenney「Mini Characters」「Holiday Kit」（CC0）
//  ・効果音：Kenney「Impact Sounds」（CC0）　・雪の質感：Poly Haven「snow_01」（CC0）
//  1つのHTMLにまとめた版では YD.ASSETS に中身が入っている
// =============================================
(function () {
  const C = YD.C;
  YD.AV = ['male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f', 'female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f'];
  YD.url = name => (YD.ASSETS && YD.ASSETS[name]) || ('assets/' + name);
  const A = YD.A = { chars: {}, decor: null, tex: {}, ready: false, prog: 0 };
  let total = 0, done = 0;
  const step = () => { done++; A.prog = done / total; if (YD.onAssetProg) YD.onAssetProg(A.prog); };
  function glb(name) {
    return new Promise(res => {
      try { new YD.GLTFLoader().load(YD.url(name), g => res(g), undefined, () => res(null)); } catch (e) { res(null); }
    });
  }
  function tex(name) { return new Promise(res => { new THREE.TextureLoader().load(YD.url(name), t => res(t), undefined, () => res(null)); }); }
  YD.loadAssets = async () => {
    if (!YD.GLTFLoader || !window.THREE) { A.ready = true; return A; }
    const jobs = [];
    total = YD.AV.length + 3;
    for (const k of YD.AV) jobs.push(glb('c-' + k + '.glb').then(g => { if (g) A.chars[k] = prepChar(g); step(); }));
    jobs.push(glb('decor.glb').then(g => { if (g) A.decor = prepDecor(g); step(); }));
    jobs.push(tex('snow_d.jpg').then(t => { A.tex.snow = t; step(); }));
    jobs.push(tex('snow_n.jpg').then(t => { A.tex.snowN = t; step(); }));
    await Promise.all(jobs);
    A.ready = true; return A;
  }
  // キャラ：上半身だけの動き（投げる・飲む・にぎる）を作っておく
  function prepChar(g) {
    const clips = {}; for (const c of g.animations) clips[c.name] = c;
    const upper = (src, name) => { const c = clips[src]; if (!c) return null; return new THREE.AnimationClip(name, c.duration, c.tracks.filter(t => /arm-right|arm-left|torso|head/.test(t.name))); };
    clips.throw = upper('attack-melee-right', 'throw'); clips.drink = upper('interact-right', 'drink'); clips.scoop = upper('pick-up', 'scoop'); clips.hold = upper('holding-right', 'hold');
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.material) { o.material.side = THREE.FrontSide; } } });
    return { scene: g.scene, clips };
  }
  function prepDecor(g) {
    const out = {};
    for (const sc of g.scenes) { sc.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); out[sc.name] = sc; }
    return out;
  }
  YD.decor = (name, s = 1) => { const src = A.decor && A.decor[name]; if (!src) return null; const g = src.clone(true); g.scale.setScalar(s); return g; };
})();
