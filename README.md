# ユキダマッチ

雪合戦の1対1。走って、すべって、よじ登って、雪玉をぶつけ合う3Dアクション（TPS）。遮蔽はだんだん溶けていく。2本先取。

## あそびかた
- 雪玉を当てて相手を雪だるまにしたら1本。「もこもこ」（アーマー）が先に減る
- アイテムは光の柱のところにわく：☕ココア（体力）・🔥カイロ（もこもこ）・❄氷玉（6発だけ強い）
- 特技（試合前に1つ）：🧱ゆきかべ・⛄にせ雪だるま・🌫雪けむり・💨ダッシュ
- ステージ：雪の公園・雪山・雪の路地（ラウンドごとに変わる）
- CPU（かんたん／ふつう／むずかしい）、あいことば対戦（3人目からは観戦）

## ファイルの中身
| ファイル | 役割 |
|---|---|
| `index.html` / `css/style.css` | 画面 |
| `js/config.js` | **調整はここ**（体力・速さ・雪玉・回復の時間・溶ける時間・特技など） |
| `js/map.js` | ステージ3つと当たり判定 |
| `js/sim.js` | ルール本体（動き・雪玉・アイテム・特技） |
| `js/cpu.js` | CPU |
| `js/render.js` | 3D表示（three.js r158） |
| `js/assets.js` | 素材の読みこみ |
| `js/input.js` | 操作（スマホ・PC・コントローラー） |
| `js/sound.js` | 音とBGM |
| `js/online.js` / `js/firebase-config.js` | あいことば対戦（ほかのゲームと同じFirebase） |
| `js/main.js` | 画面と試合の進行・リプレイ |
| `assets/` | キャラ・小物・効果音・BGM・雪の質感 |
| `database.rules.json` | Firebaseに貼る安全ルール（全ゲーム共通。`yukidama` を追加） |

## 素材
- キャラ・小物：Kenney「Mini Characters」「Holiday Kit」（CC0）
- 効果音：Kenney「Impact Sounds」（CC0）
- 雪の質感：Poly Haven「snow_01」（CC0）
- BGM：自作
