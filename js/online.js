// =============================================
//  ユキダマッチ  あいことば対戦（Firebase Realtime Database）
//  ・自分の体の動きと体力は、自分の画面が決めて送る（1秒に15回）
//  ・雪玉は「投げた」を送る。当たったかどうかは投げた側が決めて送る
//  ・アイテムは早い者勝ち（transaction）
//
//  データの形： yukidama/{あいことば}/
//    players/{0|1} : { id, name, av:キャラ }     watchers/{id} : { name }     ready/{0|1} : 何試合目をやりたいか
//    game          : { m:試合, r:ラウンド, seed, startAt, sc:"0,1", over }   0番の人が書く
//    s/{0|1}       : ようす（文字列）
//    ev/{m1r2}/{0|1}/{自動ID} : { t:'th'|'hit', ... }
//    pk/{m1r2}/{アイテム番号} : 取った人
//    ko/{m1r2}     : { l: 負けた人 }
// =============================================
(function () {
  const clean = s => String(s || '').replace(/[.#$\[\]\/\s]/g, '').slice(0, 20);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const r3 = v => Math.round(v * 1000) / 1000, r2 = v => Math.round(v * 100) / 100;
  class Room {
    constructor(db, code, name, cb, av) {
      this.av = YD.AV && YD.AV.includes(av) ? av : 'male-a';
      this.db = db; this.code = clean(code); this.name = (String(name || '').trim().slice(0, 8)) || 'ななし'; this.cb = cb || {};
      this.id = uid(); this.slot = -1; this.watching = false; this.players = {}; this.ready = {}; this.game = null; this.subs = []; this.rs = []; this.offset = 0; this.left = false;
      this.root = db.ref('yukidama/' + this.code);
    }
    call(n, ...a) { if (this.cb[n]) this.cb[n](...a); }
    now() { return Date.now() + this.offset; }
    on(ref, ev, fn, list) { ref.on(ev, fn); (list || this.subs).push([ref, ev, fn]); }
    async join() {
      if (!this.code) throw new Error('あいことばを入れてください');
      this.on(this.db.ref('.info/serverTimeOffset'), 'value', s => { this.offset = s.val() || 0; });
      for (const s of [0, 1]) {
        const res = await this.root.child('players/' + s).transaction(cur => (cur ? undefined : { id: this.id, name: this.name, av: this.av }));
        if (res.committed && res.snapshot.val() && res.snapshot.val().id === this.id) { this.slot = s; break; }
      }
      if (this.slot < 0) {
        const w = (await this.root.child('watchers').once('value')).val() || {};
        if (Object.keys(w).length >= 10) throw new Error('この部屋は観戦の人でいっぱいです（10人まで）');
        this.watching = true; const me = this.root.child('watchers/' + this.id); await me.set({ name: this.name }); me.onDisconnect().remove();
      } else {
        for (const k of ['players/', 'ready/', 's/']) this.root.child(k + this.slot).onDisconnect().remove();
        const g0 = (await this.root.child('game').once('value')).val(); this.joinM = ((g0 && g0.m) || 0) + 1;
        const other = (await this.root.child('players/' + (1 - this.slot)).once('value')).val();
        if (!other) { await this.root.child('game').remove(); this.joinM = 1; await this.root.child('ready').remove(); }
        else if (g0 && !g0.over) await this.root.child('game').set(Object.assign({}, g0, { over: 1 }));   // とちゅうで抜けた試合は終わりにする
      }
      this.on(this.root.child('players'), 'value', snap => {
        const prev = this.players; this.players = snap.val() || {}; this.call('onPeople', this.people());
        if (!this.watching && prev[1 - this.slot] && !this.players[1 - this.slot]) {
          if (this.game && !this.game.over) this.root.child('game').set(Object.assign({}, this.game, { over: 1, gone: 1 }));
          this.call('onLeft');
        } else if (this.watching && ((prev[0] && !this.players[0]) || (prev[1] && !this.players[1]))) this.call('onLeft');
        this.tryStart();
      });
      this.on(this.root.child('watchers'), 'value', snap => this.call('onWatchers', Object.keys(snap.val() || {}).length));
      this.on(this.root.child('ready'), 'value', snap => { this.ready = snap.val() || {}; this.tryStart(); });
      this.on(this.root.child('game'), 'value', snap => this.onGame(snap.val()));
      for (const s of [0, 1]) if (s !== this.slot) this.on(this.root.child('s/' + s), 'value', snap => { const v = snap.val(); if (v) { try { this.call('onState', s, JSON.parse(v)); } catch (e) {} } });
      if (this.slot >= 0) await this.root.child('ready/' + this.slot).set(this.joinM);
      return { slot: this.slot, code: this.code, watching: this.watching };
    }
    people() { return { names: [0, 1].map(s => (this.players[s] ? this.players[s].name : null)), avs: [0, 1].map(s => (this.players[s] && this.players[s].av) || (s ? 'female-b' : 'male-a')), slot: this.slot, watching: this.watching }; }
    tryStart() {
      if (this.slot !== 0 || this.left || !this.joinM) return;
      const r = this.ready || {}, next = (this.game && this.game.m ? this.game.m : 0) + 1;
      if (!this.players[0] || !this.players[1]) return;
      if (!(r[0] >= next && r[1] >= next) || this.starting === next) return;
      if (this.game && !this.game.over && this.game.m) return;
      this.starting = next;
      this.stOrder = YD.STAGE_KEYS.slice().sort(() => Math.random() - 0.5);
      this.root.child('game').set({ m: next, r: 1, seed: (Math.random() * 1e9) | 0, startAt: this.now() + 3500, sc: '0,0', st: this.stOrder[0] });
    }
    key(g) { return 'm' + g.m + 'r' + g.r; }
    onGame(g) {
      if (this.left) return;
      const prev = this.game; this.game = g;
      if (!g) return;
      if (!this.watching && g.m < (this.joinM || 0)) return;
      const k = this.key(g) + (g.over ? 'x' : '');
      if (this.gk === k) return; this.gk = k;
      if (g.over) { for (const [ref, ev, fn] of this.rs) ref.off(ev, fn); this.rs = []; this.call('onOver', { sc: g.sc.split(',').map(Number), m: g.m, gone: !!g.gone }); return; }
      // ラウンドごとの購読をはりかえ
      for (const [ref, ev, fn] of this.rs) ref.off(ev, fn); this.rs = [];
      const K = this.key(g); this.K = K;
      for (const s of [0, 1]) if (s !== this.slot) this.on(this.root.child('ev/' + K + '/' + s), 'child_added', snap => { const v = snap.val(); if (v) this.call('onEv', s, v); }, this.rs);
      this.on(this.root.child('pk/' + K), 'value', snap => this.call('onPicks', snap.val() || {}), this.rs);
      this.on(this.root.child('ko/' + K), 'value', snap => { const v = snap.val(); if (v) this.onKo(g, v); }, this.rs);
      this.call('onRound', { st: g.st || 'park', m: g.m, r: g.r, seed: g.seed, startAt: g.startAt, sc: g.sc.split(',').map(Number), slot: this.slot, watching: this.watching, names: this.people().names, avs: this.people().avs, wait: g.startAt - this.now() });
      // 古いラウンドのかたづけ
      if (this.slot === 0 && prev && prev.m && (prev.m !== g.m || prev.r !== g.r)) { const old = 'm' + prev.m + 'r' + prev.r; setTimeout(() => { for (const n of ['ev/', 'pk/', 'ko/']) this.root.child(n + old).remove(); }, 4000); }
    }
    onKo(g, v) {
      if (this.koSeen === this.key(g)) return; this.koSeen = this.key(g);
      this.call('onKo', v.l);
      if (this.slot !== 0) return;
      const sc = g.sc.split(',').map(Number); sc[1 - v.l]++;
      const win = Math.max(sc[0], sc[1]) >= (YD.C.WIN);
      setTimeout(() => {
        if (this.left || !this.game || this.key(this.game) !== this.key(g)) return;
        if (win) this.root.child('game').set({ m: g.m, r: g.r, seed: g.seed, startAt: g.startAt, sc: sc.join(','), over: 1 });
        else { const ord = this.stOrder || YD.STAGE_KEYS; this.root.child('game').set({ m: g.m, r: g.r + 1, seed: (Math.random() * 1e9) | 0, startAt: this.now() + 3600, sc: sc.join(','), st: ord[g.r % ord.length] }); }
      }, YD.KO_WAIT || 6200);
    }
    // ---- 送る ----
    sendState(p, extra) {
      if (this.slot < 0 || this.left) return;
      const fl = (p.ground ? 1 : 0) | (p.slide > 0 ? 2 : 0) | (p.climb ? 4 : 0) | (p.reload > 0 ? 8 : 0) | (p.alive ? 16 : 0);
      const a = [this.now(), r3(p.x), r3(p.y), r3(p.z), r3(p.yaw), r2(p.pitch), r2(p.vx), r2(p.vy), r2(p.vz), Math.round(p.hp), Math.round(p.ar), fl, p.heal ? (p.heal.k === 'cocoa' ? 1 : 2) : 0, p.ice, p.mag, p.throwN, p.bag.cocoa, p.bag.kairo, p.heal ? r2(p.heal.t / p.heal.T) : 0];
      this.root.child('s/' + this.slot).set(JSON.stringify(a));
    }
    sendThrow(b) { if (this.slot < 0 || this.left || !this.K) return; this.root.child('ev/' + this.K + '/' + this.slot).push({ t: 'th', i: b.id, k: b.ice ? 1 : 0, p: [r3(b.x), r3(b.y), r3(b.z)], v: [r3(b.vx), r3(b.vy), r3(b.vz)], s: this.now() }); }
    sendHit(to, d, dir, ice, x, y, z) { if (this.slot < 0 || this.left || !this.K) return; this.root.child('ev/' + this.K + '/' + this.slot).push({ t: 'hit', to, d, dr: r2(dir), k: ice ? 1 : 0, p: [r2(x), r2(y), r2(z)] }); }
    sendSkill(k, a) { if (this.slot < 0 || this.left || !this.K) return; this.root.child('ev/' + this.K + '/' + this.slot).push({ t: 'sk', k, a, s: this.now() }); }
    sendDecoyHit(id, d) { if (this.slot < 0 || this.left || !this.K) return; this.root.child('ev/' + this.K + '/' + this.slot).push({ t: 'dh', i: id, d }); }
    claim(pk, slot, done) {
      if (this.left || !this.K) return;
      this.root.child('pk/' + this.K + '/' + pk.id).transaction(cur => (cur == null ? slot : undefined)).then(res => done(!!(res.committed && res.snapshot.val() === slot))).catch(() => done(false));
    }
    ko(slot) { if (this.left || !this.K) return; this.root.child('ko/' + this.K).transaction(cur => (cur ? undefined : { l: slot, t: this.now() })); }
    rematch() { if (this.slot >= 0 && this.game) this.root.child('ready/' + this.slot).set(this.game.m + 1); }
    leave() {
      if (this.left) return; this.left = true;
      for (const [ref, ev, fn] of this.subs.concat(this.rs)) ref.off(ev, fn); this.subs = []; this.rs = [];
      if (this.watching) this.root.child('watchers/' + this.id).remove();
      else if (this.slot >= 0) for (const k of ['players/', 'ready/', 's/']) this.root.child(k + this.slot).remove();
    }
  }
  YD.Room = Room; YD.cleanCode = clean;
})();
