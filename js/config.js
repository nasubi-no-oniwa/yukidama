// =============================================
//  ユキダマッチ  調整はここ
// =============================================
var YD = (typeof window !== 'undefined' ? (window.YD = window.YD || {}) : (globalThis.YD = globalThis.YD || {}));
YD.C = {
  WIN: 2,              // 何本先取
  ROUND_T: 90,         // この秒数をこえると「寒さ」で少しずつ削れる（サドンデス）
  COLD_DPS: 10,         // サドンデス中、1秒に減る量
  COUNT: 3,            // ラウンド開始のカウント（秒）
  HP: 150, ARMOR: 75,  // 体力・もこもこ（アーマー）。雪玉1発20 → 12発で雪だるま

  // 動き
  RUN: 6.8,            // 走る速さ（m/秒）
  GND_ACC: 70, AIR_ACC: 16,
  JUMP: 8.4, GRAV: 24, // ジャンプ（高さ 約1.5m）
  PAD: 15.5,           // ジャンプ台
  SLIDE_V: 12, SLIDE_T: 0.85, SLIDE_DEC: 8, SLIDE_CD: 0.45, SLIDE_MIN: 3.5,
  CLIMB_MAX: 2.75, CLIMB_T: 0.34,   // よじ登れる高さ・かかる時間
  STEP: 0.4,
  PR: 0.36, PH: 1.75, PH_SLIDE: 1.0, // 体の半径・高さ（スライディング中は低い）
  HIT_R: 0.42,         // 雪玉が当たる太さ（少し大きめ＝当てやすい）

  // 雪玉
  BALL: { dmg: 20, v: 42, g: 6, rate: 0.23, r: 0.15 },
  ICE:  { dmg: 34, v: 60, g: 3, rate: 0.32, r: 0.14, n: 6 },   // 氷玉（拾うと6発）
  MAG: 6, RELOAD: 1.2, // 手に持てる雪玉の数・にぎる時間

  // 回復（拾ってためて、ボタンで使う）
  COCOA: { hp: 75, t: 1.9 },   // ホットココア：体力
  KAIRO: { ar: 75, t: 2.5 },   // カイロ：もこもこ
  BAG: 2,                      // それぞれ持てる数
  HEAL_SPEED: 0.45,            // 回復中の歩く速さ（倍）
  HEAL_GUARD: 0.8,             // 回復中に受けるダメージ（倍）

  // 溶ける遮蔽
  MELT_START: 12, MELT_END: 75, MELT_WARN: 3, MELT_DUR: 1.6,
  // わくアイテム
  PICK_FIRST: 6, PICK_EVERY: 11, PICK_WARN: 3, PICK_R: 1.1,

  // 特技（試合の前に1つえらぶ。cd＝もう一度使えるまでの秒数）
  SKILLS: {
    wall:  { name: 'ゆきかべ', icon: '🧱', cd: 16, desc: '目の前に雪のかべを一瞬で立てる（9秒で溶ける）' },
    decoy: { name: 'にせ雪だるま', icon: '⛄', cd: 15, desc: '自分そっくりのおとりが前に走っていく' },
    smoke: { name: '雪けむり', icon: '🌫', cd: 18, desc: '前に雪けむりを出して、相手から見えなくする' },
    dash:  { name: 'ダッシュ', icon: '💨', cd: 6, desc: '行きたい方へ一気にとびこむ' }
  },
  AUTO_RELOAD: 2.0,    // 投げずにこの秒数たつと、自動でにぎり直す
  // ねらいの手助け（中心からこの角度以内なら、相手に吸いつく）
  ASSIST: { touch: 9, mouse: 2.8, pad: 7, cpu: 0 }
};
