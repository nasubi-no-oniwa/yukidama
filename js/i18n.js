// =============================================
//  ことば（日本語・English・繁體中文・한국어）
//  ===========================================

(function () {
  var LANGS = ['ja', 'en', 'zh', 'ko'];
  var KEY = 'yukidama-lang';
  var D = {
 "lang_label": [
  "ことば",
  "Language",
  "語言",
  "언어"
 ],
 "home": [
  "なすびのお庭へ",
  "Nasubi's Garden (more games)",
  "前往茄子的庭院",
  "가지의 정원으로"
 ],
 "howto": [
  "あそびかた",
  "How to play",
  "玩法",
  "플레이 방법"
 ],
 "close": [
  "とじる",
  "Close",
  "關閉",
  "닫기"
 ],
 "back": [
  "もどる",
  "Back",
  "返回",
  "돌아가기"
 ],
 "to_title": [
  "タイトルへ",
  "Back to title",
  "回到標題",
  "타이틀로"
 ],
 "again": [
  "もう一回",
  "Play again",
  "再來一局",
  "한 판 더"
 ],
 "easy": [
  "よわい",
  "Easy",
  "簡單",
  "약함"
 ],
 "normal": [
  "ふつう",
  "Normal",
  "普通",
  "보통"
 ],
 "hard": [
  "つよい",
  "Hard",
  "困難",
  "강함"
 ],
 "vs_cpu": [
  "CPUとたいせん",
  "VS CPU",
  "對戰CPU",
  "CPU와 대전"
 ],
 "online": [
  "あいことばで対戦",
  "Play with a passcode",
  "用暗號對戰",
  "암호로 대전"
 ],
 "passcode": [
  "あいことば",
  "Passcode",
  "暗號",
  "암호"
 ],
 "name": [
  "なまえ",
  "Name",
  "名字",
  "이름"
 ],
 "noname": [
  "ななし",
  "Anonymous",
  "無名氏",
  "익명"
 ],
 "online_hint": [
  "同じあいことばを入れた人と対戦。3人目からは観戦になります。",
  "Play against whoever enters the same passcode. From the 3rd person on, you watch.",
  "和輸入相同暗號的人對戰。第3個人開始為觀戰。",
  "같은 암호를 입력한 사람과 대전. 3번째 사람부터는 관전이 됩니다."
 ],
 "join": [
  "はいる",
  "Join",
  "進入",
  "입장"
 ],
 "wait_pre": [
  "あいことば「",
  "Passcode: ",
  "暗號「",
  "암호 「"
 ],
 "wait_post": [
  "」",
  "",
  "」",
  "」"
 ],
 "waiting": [
  "あいてを待っています…",
  "Waiting for an opponent…",
  "等待對手中…",
  "상대를 기다리는 중…"
 ],
 "copy_link": [
  "さそうリンクをコピー",
  "Copy invite link",
  "複製邀請連結",
  "초대 링크 복사"
 ],
 "copied": [
  "コピーしました！",
  "Copied!",
  "已複製！",
  "복사했어요!"
 ],
 "send_link": [
  "このリンクを送ってください",
  "Send this link",
  "請傳送這個連結",
  "이 링크를 보내 주세요"
 ],
 "err_code": [
  "あいことばを入れてください（. # $ / [ ] は使えません）",
  "Enter a passcode (. # $ / [ ] are not allowed)",
  "請輸入暗號（不能使用 . # $ / [ ]）",
  "암호를 입력해 주세요 (. # $ / [ ] 는 사용할 수 없어요)"
 ],
 "err_code_short": [
  "あいことばを入れてください",
  "Enter a passcode",
  "請輸入暗號",
  "암호를 입력해 주세요"
 ],
 "connecting": [
  "つないでいます…",
  "Connecting…",
  "連線中…",
  "연결 중…"
 ],
 "err_net": [
  "通信できませんでした。電波のよいところでもう一度ためしてください",
  "Couldn't connect. Please try again where the signal is better.",
  "無法連線。請在訊號好的地方再試一次。",
  "연결하지 못했어요. 신호가 좋은 곳에서 다시 시도해 주세요."
 ],
 "err_notready": [
  "オンライン対戦はまだ準備中です",
  "Online play isn't ready yet",
  "線上對戰還在準備中",
  "온라인 대전은 아직 준비 중이에요"
 ],
 "err_conn": [
  "つながりませんでした",
  "Couldn't connect",
  "無法連線",
  "연결되지 않았어요"
 ],
 "left_win": [
  "相手が抜けたので、あなたの勝ち！",
  "Your opponent left, so you win!",
  "對手離開了，你贏了！",
  "상대가 나가서 당신의 승리!"
 ],
 "left": [
  "あいてが退室しました",
  "Your opponent left",
  "對手已離開",
  "상대가 퇴장했어요"
 ],
 "watch_in": [
  "観戦で入りました。試合が始まるのを待っています…",
  "You joined as a spectator. Waiting for the game to start…",
  "已用觀戰身分進入。等待比賽開始…",
  "관전으로 입장했어요. 경기 시작을 기다리는 중…"
 ],
 "wait_next": [
  "次の試合が始まるのを待っています…",
  "Waiting for the next game…",
  "等待下一局開始…",
  "다음 경기를 기다리는 중…"
 ],
 "wait_rematch": [
  "あいての「もう一回」を待っています…",
  "Waiting for your opponent to choose \"Play again\"…",
  "等待對手按「再來一局」…",
  "상대의 '한 판 더'를 기다리는 중…"
 ],
 "you": [
  "あなた",
  "You",
  "你",
  "나"
 ],
 "cpu": [
  "CPU",
  "CPU",
  "CPU",
  "CPU"
 ],
 "your_turn": [
  "あなたの番",
  "Your turn",
  "輪到你",
  "내 차례"
 ],
 "cpu_wait_label": [
  "CPU（ふつう）と遊びながら待つ",
  "Play the CPU (Normal) while waiting",
  "一邊和CPU（普通）玩一邊等",
  "기다리는 동안 CPU(보통)와 플레이"
 ],
 "qm_btn": [
  "だれかと対戦",
  "Play someone online",
  "隨機對戰",
  "아무나와 대전"
 ],
 "qm_stat": [
  "対戦待ち <b>{w}</b>人・対戦中 <b>{p}</b>組",
  "<b>{w}</b> waiting · <b>{p}</b> playing",
  "等待中 <b>{w}</b>人・對戰中 <b>{p}</b>組",
  "대기 <b>{w}</b>명 · 대전 중 <b>{p}</b>쌍"
 ],
 "qm_prime_hot": [
  "🔥 いま対戦タイム！（22時まで）",
  "🔥 Battle time now! (until 22:00 JST)",
  "🔥 現在是對戰時間！（到日本時間22點）",
  "🔥 지금은 대전 타임! (일본 시간 22시까지)"
 ],
 "qm_prime": [
  "🌙 毎晩21時〜22時は対戦タイム",
  "🌙 Battle time every night 21:00–22:00 JST",
  "🌙 每晚日本時間21〜22點是對戰時間",
  "🌙 매일 밤 일본 시간 21~22시는 대전 타임"
 ],
 "qm_sub": [
  "いま待っている人と、自動でつながります。",
  "You'll be matched automatically with someone who's waiting.",
  "自動和正在等待的人配對。",
  "기다리고 있는 사람과 자동으로 연결돼요."
 ],
 "qm_go": [
  "さがす",
  "Find a match",
  "尋找",
  "찾기"
 ],
 "qm_badname": [
  "その名前は使えません。ほかの名前にしてね",
  "That name can't be used. Please choose another.",
  "這個名字不能使用，請換一個。",
  "그 이름은 사용할 수 없어요. 다른 이름으로 해 주세요."
 ],
 "qm_searching": [
  "相手をさがしています",
  "Looking for an opponent",
  "正在尋找對手",
  "상대를 찾는 중"
 ],
 "qm_wait_pre": [
  "いま対戦待ち ",
  "Waiting now: ",
  "目前等待中 ",
  "현재 대기 "
 ],
 "qm_wait_post": [
  "人",
  "",
  "人",
  "명"
 ],
 "qm_cpu": [
  "CPUと遊びながら待つ",
  "Play the CPU while waiting",
  "一邊和CPU玩一邊等",
  "기다리는 동안 CPU와 플레이"
 ],
 "qm_cancel": [
  "やめる",
  "Cancel",
  "取消",
  "그만두기"
 ],
 "qm_retry": [
  "もう一度さがす",
  "Search again",
  "再找一次",
  "다시 찾기"
 ],
 "qm_searching_t": [
  "相手をさがしています… {t}",
  "Looking for an opponent… {t}",
  "正在尋找對手… {t}",
  "상대를 찾는 중… {t}"
 ],
 "qm_calling": [
  "CPUと遊んでいる人に声をかけています…",
  "Inviting someone who is playing the CPU…",
  "正在邀請正在和CPU玩的人…",
  "CPU와 플레이 중인 사람에게 신청하는 중…"
 ],
 "qm_declined": [
  "相手が見送りました。ほかの人をさがします",
  "They passed. Looking for someone else.",
  "對方跳過了，改找其他人。",
  "상대가 넘겼어요. 다른 사람을 찾을게요."
 ],
 "qm_found": [
  "相手が見つかりました！",
  "Opponent found!",
  "找到對手了！",
  "상대를 찾았어요!"
 ],
 "qm_avail": [
  "対戦できる相手がいます！",
  "Someone is ready to play!",
  "有可以對戰的對手！",
  "대전할 수 있는 상대가 있어요!"
 ],
 "qm_play": [
  "対戦する",
  "Play",
  "對戰",
  "대전하기"
 ],
 "qm_pass": [
  "見送る",
  "Pass",
  "跳過",
  "넘기기"
 ],
 "qm_taken": [
  "さっきの相手は、ほかの人と対戦を始めました。もう少し待ってね",
  "That player started a match with someone else. Please wait a little longer.",
  "剛才的對手已經和別人開始對戰了。請再等一下。",
  "방금 상대는 다른 사람과 대전을 시작했어요. 조금만 더 기다려 주세요."
 ],
 "qm_fail": [
  "相手とつながりませんでした（{c}）",
  "Couldn't connect to your opponent ({c})",
  "無法和對手連線（{c}）",
  "상대와 연결되지 않았어요 ({c})"
 ],
 "qm_nojoin": [
  "入れませんでした",
  "Couldn't join",
  "無法進入",
  "들어가지 못했어요"
 ],
 "qm_next": [
  "次の相手をさがす",
  "Find next opponent",
  "尋找下一位對手",
  "다음 상대 찾기"
 ],
 "doc_title": [
  "ユキダマッチ",
  "Snowball Match",
  "雪球對決",
  "눈싸움 매치"
 ],
 "doc_desc": [
  "雪合戦の1対1。走って、すべって、よじ登って、雪玉をぶつけ合え。遮蔽はだんだん溶けていく。",
  "A 1-on-1 snowball fight. Run, slide, climb and pelt each other with snowballs. The cover slowly melts away.",
  "1對1打雪仗。奔跑、滑行、攀爬，互丟雪球。掩體會慢慢融化。",
  "1대1 눈싸움. 달리고, 미끄러지고, 기어올라 눈덩이를 던져라. 엄폐물은 점점 녹아요."
 ],
 "logo1": [
  "ユキ",
  "SNOWBALL",
  "雪球",
  "눈싸움"
 ],
 "logo2": [
  "ダマッチ",
  "MATCH",
  "對決",
  "매치"
 ],
 "sub": [
  "雪合戦 1対1 ・ 2本先取",
  "Snowball fight · 1-on-1 · First to 2",
  "打雪仗 1對1・先拿2勝",
  "눈싸움 1대1 · 2승 선취"
 ],
 "chara": [
  "キャラ",
  "Character",
  "角色",
  "캐릭터"
 ],
 "skill": [
  "特技",
  "Skill",
  "特技",
  "특기"
 ],
 "vs_cpu2": [
  "CPUとたたかう",
  "VS CPU",
  "對戰CPU",
  "CPU와 대전"
 ],
 "lv_easy": [
  "かんたん",
  "Easy",
  "簡單",
  "쉬움"
 ],
 "lv_normal": [
  "ふつう",
  "Normal",
  "普通",
  "보통"
 ],
 "lv_hard": [
  "むずかしい",
  "Hard",
  "困難",
  "어려움"
 ],
 "online2": [
  "あいことば対戦",
  "Passcode match",
  "暗號對戰",
  "암호 대전"
 ],
 "sound_pre": [
  "音：",
  "Sound: ",
  "聲音：",
  "소리: "
 ],
 "snd_on": [
  "あり",
  "On",
  "開",
  "켜짐"
 ],
 "snd_off": [
  "なし",
  "Off",
  "關",
  "꺼짐"
 ],
 "sens": [
  "視点の速さ",
  "Look speed",
  "視角速度",
  "시점 속도"
 ],
 "loading": [
  "素材を読みこみ中… ",
  "Loading… ",
  "素材載入中… ",
  "불러오는 중… "
 ],
 "on_note": [
  "同じ「あいことば」を入れた人と1対1。3人目からは観戦になります。",
  "Play 1-on-1 with whoever enters the same passcode. From the 3rd person on, you watch.",
  "和輸入相同「暗號」的人1對1。第3個人開始為觀戰。",
  "같은 \"암호\"를 입력한 사람과 1대1. 3번째 사람부터는 관전이 됩니다."
 ],
 "name_ph": [
  "8文字まで",
  "Up to 8 characters",
  "最多8個字",
  "8자까지"
 ],
 "ex_code": [
  "例：ゆきがっせん",
  "e.g. snowfight",
  "例：打雪仗",
  "예: 눈싸움"
 ],
 "enter": [
  "入る",
  "Join",
  "進入",
  "입장"
 ],
 "waiting_opp": [
  "相手を待っています…",
  "Waiting for an opponent…",
  "等待對手中…",
  "상대를 기다리는 중…"
 ],
 "round_n": [
  "ラウンド{n}",
  "Round {n}",
  "第{n}回合",
  "라운드 {n}"
 ],
 "armor": [
  "もこもこ",
  "Fluff",
  "蓬蓬",
  "뽀송"
 ],
 "hp": [
  "体力",
  "HP",
  "體力",
  "체력"
 ],
 "rp_tag": [
  "▶ リプレイ <small>タップでとばす</small>",
  "▶ Replay <small>tap to skip</small>",
  "▶ 重播 <small>點一下跳過</small>",
  "▶ 리플레이 <small>탭해서 건너뛰기</small>"
 ],
 "healing": [
  "回復中",
  "Healing",
  "回復中",
  "회복 중"
 ],
 "keys": [
  "WASD 移動 ／ マウス 視点 ／ 左クリック 投げる ／ Space ジャンプ（かべに向かって押しっぱなしで よじ登る）／ Shift スライディング ／ Q 特技 ／ E 回復 ／ R にぎる ／ Esc 一時停止",
  "WASD move / Mouse look / Left click throw / Space jump (hold toward a wall to climb) / Shift slide / Q skill / E heal / R pack / Esc pause",
  "WASD 移動／滑鼠 視角／左鍵 丟／Space 跳（對著牆按住就能攀爬）／Shift 滑行／Q 特技／E 回復／R 捏雪球／Esc 暫停",
  "WASD 이동 / 마우스 시점 / 좌클릭 던지기 / Space 점프 (벽을 향해 누르고 있으면 기어오르기) / Shift 슬라이딩 / Q 특기 / E 회복 / R 뭉치기 / Esc 일시정지"
 ],
 "b_heal": [
  "回復",
  "Heal",
  "回復",
  "회복"
 ],
 "b_slide": [
  "すべる",
  "Slide",
  "滑行",
  "슬라이드"
 ],
 "b_jump": [
  "ジャンプ",
  "Jump",
  "跳",
  "점프"
 ],
 "b_fire": [
  "投げる",
  "Throw",
  "丟",
  "던지기"
 ],
 "pause_t": [
  "一時停止",
  "Paused",
  "暫停",
  "일시정지"
 ],
 "resume": [
  "つづける",
  "Resume",
  "繼續",
  "계속하기"
 ],
 "win": [
  "かち！",
  "WIN!",
  "贏了！",
  "승리!"
 ],
 "lose": [
  "まけ…",
  "LOSE…",
  "輸了…",
  "패배…"
 ],
 "rotate": [
  "📱↻ 横向きにすると遊びやすいよ",
  "📱↻ Easier to play sideways",
  "📱↻ 橫放會比較好玩喔",
  "📱↻ 가로로 하면 더 편해요"
 ],
 "hw1": [
  "<b>勝ち方</b>：雪玉を当てて（12発くらい）、相手を<b>雪だるま</b>にしたら1本。2本先取で勝ち。",
  "<b>How to win</b>: hit your opponent with snowballs (about 12) to turn them into a <b>snowman</b> and take a round. First to 2 rounds wins.",
  "<b>勝利方法</b>：用雪球打中對手（大約12發），把對手變成<b>雪人</b>就拿下1局。先拿2局獲勝。",
  "<b>이기는 법</b>: 눈덩이를 맞혀서 (12발 정도) 상대를 <b>눈사람</b>으로 만들면 1판. 2판 먼저 따면 승리."
 ],
 "hw2": [
  "<b>もこもこ</b>（青いゲージ）が先に減って、なくなると「パリン！」。そこから体力（白いゲージ）が減ります。",
  "<b>Fluff</b> (blue gauge) goes down first. When it runs out — \"Crack!\" — then HP (white gauge) starts dropping.",
  "<b>蓬蓬</b>（藍色量表）會先減少，用完就「啪鏘！」。之後開始減少體力（白色量表）。",
  "<b>뽀송</b>(파란 게이지)이 먼저 줄고, 다 없어지면 \"쨍그랑!\". 그다음 체력(흰 게이지)이 줄어요."
 ],
 "hw3": [
  "<b>雪玉</b>：手に6こ。なくなると自動で「にぎる」（すきができる）。少し投げずにいると、自動でにぎり直します。",
  "<b>Snowballs</b>: you hold 6. When you run out you automatically pack more (leaving you open). If you don't throw for a moment, you repack automatically.",
  "<b>雪球</b>：手上有6顆。用完會自動「捏雪球」（會露出破綻）。一陣子不丟，也會自動重新捏好。",
  "<b>눈덩이</b>: 손에 6개. 다 쓰면 자동으로 \"뭉치기\" (빈틈이 생겨요). 잠시 던지지 않으면 자동으로 다시 뭉쳐요."
 ],
 "hw4": [
  "<b>特技</b>（試合の前に1つえらぶ。使うと少し待つ）：🧱ゆきかべ＝目の前にかべ　⛄にせ雪だるま＝自分そっくりのおとりが走る（2発で割れる）　🌫雪けむり＝けむりの向こうが見えない　💨ダッシュ＝一気にとびこむ",
  "<b>Skills</b> (pick one before the match; it needs time to recharge): 🧱 Snow Wall = a wall in front of you　⛄ Decoy = a look-alike runs ahead (breaks in 2 hits)　🌫 Snow Smoke = no one can see through it　💨 Dash = leap forward in one go",
  "<b>特技</b>（比賽前選1個，用了要等一下）：🧱雪牆＝在眼前立起牆　⛄假雪人＝和自己一模一樣的誘餌往前跑（2發就破）　🌫雪煙＝看不見煙的另一邊　💨衝刺＝一口氣衝過去",
  "<b>특기</b> (경기 전에 1개 고르기. 쓰면 조금 기다려야 해요): 🧱눈벽 = 눈앞에 벽　⛄가짜 눈사람 = 나와 똑같은 미끼가 달려가요 (2발에 깨짐)　🌫눈연기 = 연기 너머가 안 보여요　💨대시 = 단숨에 뛰어들기"
 ],
 "hw5": [
  "<b>ステージ</b>：雪の公園・雪山（高台と階段）・雪の路地（細い道）。ラウンドごとに変わります。",
  "<b>Stages</b>: Snowy Park, Snow Mountain (high ground and stairs), Snowy Alley (narrow paths). It changes every round.",
  "<b>場地</b>：雪中公園・雪山（高台和階梯）・雪巷（窄路）。每回合都會換。",
  "<b>스테이지</b>: 눈 공원 · 눈산 (언덕과 계단) · 눈 골목 (좁은 길). 라운드마다 바뀌어요."
 ],
 "hw6": [
  "<b>かべは溶ける</b>：青く光ってふるえたら、もうすぐ溶けます。時間がたつほど隠れる場所がなくなります。90秒をすぎると<b>寒さ</b>で少しずつ削れます。",
  "<b>Walls melt</b>: when one glows blue and shakes, it's about to melt. The longer it goes, the fewer places to hide. After 90 seconds, the <b>cold</b> slowly wears you down.",
  "<b>牆會融化</b>：發出藍光並抖動時，就快融化了。時間越久，能躲的地方越少。超過90秒後會因為<b>寒冷</b>一點一點扣血。",
  "<b>벽은 녹아요</b>: 파랗게 빛나며 떨리면 곧 녹아요. 시간이 갈수록 숨을 곳이 없어져요. 90초가 지나면 <b>추위</b>로 조금씩 깎여요."
 ],
 "hw7": [
  "<b>アイテム</b>：光の柱が出たら、そこにわきます。<br>☕ココア＝体力回復　🔥カイロ＝もこもこ回復（それぞれ2こまで持てる。回復ボタンで使う。使っている間はおそいけど、受ける雪は2割へる。相手が回復中だと☕🔥マークが出る＝チャンス）<br>❄氷玉＝6発だけ、速くて痛い",
  "<b>Items</b>: they appear where a pillar of light shows up.<br>☕ Cocoa = restores HP　🔥 Hand warmer = restores Fluff (hold up to 2 of each; use with the Heal button. You're slow while using it, but take 20% less snow. A ☕🔥 mark over your opponent means they're healing = your chance)<br>❄ Ice balls = 6 fast, painful shots",
  "<b>道具</b>：出現光柱的地方就會冒出來。<br>☕可可＝回復體力　🔥暖暖包＝回復蓬蓬（各最多帶2個，用回復鈕使用。使用中會變慢，但受到的雪減少2成。對手回復中會出現☕🔥標記＝好機會）<br>❄冰球＝只有6發，又快又痛",
  "<b>아이템</b>: 빛기둥이 나타나면 그곳에 생겨요.<br>☕코코아 = 체력 회복　🔥핫팩 = 뽀송 회복 (각각 2개까지. 회복 버튼으로 사용. 쓰는 동안 느려지지만 받는 눈이 20% 줄어요. 상대가 회복 중이면 ☕🔥 표시 = 기회)<br>❄얼음구슬 = 6발만, 빠르고 아파요"
 ],
 "hw8": [
  "<b>動き</b>：走りながらスライディングで加速。すべりながらジャンプすると勢いが残ります。かべに向かってジャンプすると<b>よじ登れます</b>。青い丸はジャンプ台。",
  "<b>Movement</b>: slide while running to speed up. Jump while sliding to keep your momentum. Jump toward a wall to <b>climb</b> it. Blue circles are jump pads.",
  "<b>移動</b>：邊跑邊滑行可以加速。滑行中跳起來能保留衝勁。對著牆跳就能<b>攀爬</b>。藍色圓圈是跳台。",
  "<b>움직임</b>: 달리면서 슬라이딩하면 가속. 미끄러지며 점프하면 속도가 남아요. 벽을 향해 점프하면 <b>기어오를 수 있어요</b>. 파란 원은 점프대."
 ],
 "hw9": [
  "<b>ねらい</b>：相手の近くをねらえば、少しだけ吸いつきます（スマホは強め）。",
  "<b>Aiming</b>: aim near your opponent and it sticks a little (stronger on phones).",
  "<b>瞄準</b>：瞄準對手附近時會稍微吸附（手機比較強）。",
  "<b>조준</b>: 상대 근처를 노리면 살짝 달라붙어요 (휴대폰은 더 강하게)."
 ],
 "hw10": [
  "<b>PC</b>：WASD・マウス・左クリック・Space・Shift・Q（特技）・E（回復）・R（にぎる）。<br><b>スマホ</b>：左で移動、右をなぞって視点、ボタンで投げる（投げるボタンをなぞっても視点が動く）。横向きがおすすめ。<br><b>コントローラー</b>：左右スティック・右トリガー投げる・A ジャンプ・B すべる・X にぎる・Y 回復・LB 特技。",
  "<b>PC</b>: WASD, mouse, left click, Space, Shift, Q (skill), E (heal), R (pack).<br><b>Phone</b>: left side to move, drag the right side to look, buttons to throw (dragging on the Throw button also turns the view). Landscape recommended.<br><b>Controller</b>: both sticks, right trigger throw, A jump, B slide, X pack, Y heal, LB skill.",
  "<b>電腦</b>：WASD・滑鼠・左鍵・Space・Shift・Q（特技）・E（回復）・R（捏雪球）。<br><b>手機</b>：左邊移動，右邊滑動轉視角，按鈕丟雪球（在丟的按鈕上滑動也能轉視角）。建議橫放。<br><b>手把</b>：左右搖桿・右扳機丟・A 跳・B 滑行・X 捏雪球・Y 回復・LB 特技。",
  "<b>PC</b>: WASD · 마우스 · 좌클릭 · Space · Shift · Q (특기) · E (회복) · R (뭉치기).<br><b>휴대폰</b>: 왼쪽으로 이동, 오른쪽을 밀어서 시점, 버튼으로 던지기 (던지기 버튼을 밀어도 시점이 움직여요). 가로 추천.<br><b>컨트롤러</b>: 좌우 스틱 · 오른쪽 트리거 던지기 · A 점프 · B 슬라이드 · X 뭉치기 · Y 회복 · LB 특기."
 ],
 "hw11": [
  "<b>あいことば対戦</b>：同じあいことばで1対1。3人目からは観戦。",
  "<b>Passcode match</b>: 1-on-1 with the same passcode. From the 3rd person on, you watch.",
  "<b>暗號對戰</b>：用相同暗號1對1。第3個人開始觀戰。",
  "<b>암호 대전</b>: 같은 암호로 1대1. 3번째 사람부터는 관전."
 ],
 "credit": [
  "素材：キャラ・小物・効果音 Kenney（kenney.nl, CC0）／雪の質感 Poly Haven（CC0）／BGM・ゲーム なすびのお庭",
  "Assets: characters, props, sound effects by Kenney (kenney.nl, CC0) / snow textures by Poly Haven (CC0) / music & game by Nasubi's Garden",
  "素材：角色・小物・音效 Kenney（kenney.nl, CC0）／雪的質感 Poly Haven（CC0）／BGM・遊戲 茄子的庭院",
  "소재: 캐릭터·소품·효과음 Kenney (kenney.nl, CC0) / 눈 질감 Poly Haven (CC0) / BGM·게임 가지의 정원"
 ],
 "sk_wall": [
  "ゆきかべ",
  "Snow Wall",
  "雪牆",
  "눈벽"
 ],
 "sk_decoy": [
  "にせ雪だるま",
  "Decoy",
  "假雪人",
  "가짜 눈사람"
 ],
 "sk_smoke": [
  "雪けむり",
  "Snow Smoke",
  "雪煙",
  "눈연기"
 ],
 "sk_dash": [
  "ダッシュ",
  "Dash",
  "衝刺",
  "대시"
 ],
 "skd_wall": [
  "目の前に雪のかべを一瞬で立てる（9秒で溶ける）",
  "Instantly raise a snow wall in front of you (melts in 9s)",
  "瞬間在眼前立起雪牆（9秒後融化）",
  "눈앞에 눈벽을 순식간에 세워요 (9초 후 녹음)"
 ],
 "skd_decoy": [
  "自分そっくりのおとりが前に走っていく",
  "A look-alike decoy runs forward",
  "和自己一模一樣的誘餌往前跑",
  "나와 똑같은 미끼가 앞으로 달려가요"
 ],
 "skd_smoke": [
  "前に雪けむりを出して、相手から見えなくする",
  "Puff out snow smoke ahead to hide from your opponent",
  "往前噴出雪煙，讓對手看不見",
  "앞에 눈연기를 뿜어서 상대에게 안 보이게 해요"
 ],
 "skd_dash": [
  "行きたい方へ一気にとびこむ",
  "Leap in the direction you want to go",
  "朝想去的方向一口氣衝過去",
  "가고 싶은 쪽으로 단숨에 뛰어들어요"
 ],
 "every_s": [
  "（{s}秒ごと）",
  " (every {s}s)",
  "（每{s}秒）",
  " ({s}초마다)"
 ],
 "st_park": [
  "雪の公園",
  "Snowy Park",
  "雪中公園",
  "눈 공원"
 ],
 "st_mount": [
  "雪山",
  "Snow Mountain",
  "雪山",
  "눈산"
 ],
 "st_alley": [
  "雪の路地",
  "Snowy Alley",
  "雪巷",
  "눈 골목"
 ],
 "cpu_lv2": [
  "CPU（{lv}）",
  "CPU ({lv})",
  "CPU（{lv}）",
  "CPU ({lv})"
 ],
 "decider": [
  "これで決まる！",
  "This decides it!",
  "決勝局！",
  "이걸로 결정!"
 ],
 "one_more": [
  "あと1本！",
  "One more round!",
  "再1局！",
  "1판만 더!"
 ],
 "no_more": [
  "あとがない！",
  "No room for error!",
  "沒有退路了！",
  "물러설 곳이 없다!"
 ],
 "sk_wait": [
  "特技はあと {n} 秒",
  "Skill ready in {n}s",
  "特技還要 {n} 秒",
  "특기까지 {n}초"
 ],
 "fight": [
  "ファイト！",
  "FIGHT!",
  "開打！",
  "파이트!"
 ],
 "next_round": [
  "つぎのラウンドへ",
  "Next round",
  "下一回合",
  "다음 라운드로"
 ],
 "sp_cocoa": [
  "☕ ココアが出るよ",
  "☕ Cocoa is coming",
  "☕ 可可要出現了",
  "☕ 코코아가 나와요"
 ],
 "sp_kairo": [
  "🔥 カイロが出るよ",
  "🔥 A hand warmer is coming",
  "🔥 暖暖包要出現了",
  "🔥 핫팩이 나와요"
 ],
 "sp_ice": [
  "❄ 氷玉が出るよ（まん中あたり）",
  "❄ Ice balls are coming (near the middle)",
  "❄ 冰球要出現了（中間附近）",
  "❄ 얼음구슬이 나와요 (가운데쯤)"
 ],
 "sudden": [
  "サドンデス",
  "SUDDEN DEATH",
  "驟死戰",
  "서든데스"
 ],
 "sudden_sub": [
  "寒さで少しずつ削れる！",
  "The cold wears you down!",
  "寒冷會一點一點扣血！",
  "추위로 조금씩 깎여요!"
 ],
 "cold_soon": [
  "あと10秒で寒さがくる",
  "The cold comes in 10 seconds",
  "再10秒寒冷就要來了",
  "10초 후 추위가 와요"
 ],
 "crack": [
  "パリン！",
  "CRACK!",
  "啪鏘！",
  "쨍그랑!"
 ],
 "ar_broke": [
  "もこもこが割れた！",
  "Your Fluff broke!",
  "蓬蓬破掉了！",
  "뽀송이 깨졌어요!"
 ],
 "pk_cocoa": [
  "☕ ココアを拾った（回復ボタンで飲む）",
  "☕ Got cocoa (drink with Heal)",
  "☕ 撿到可可（用回復鈕喝）",
  "☕ 코코아 획득 (회복 버튼으로 마시기)"
 ],
 "pk_kairo": [
  "🔥 カイロを拾った（回復ボタンで使う）",
  "🔥 Got a hand warmer (use with Heal)",
  "🔥 撿到暖暖包（用回復鈕使用）",
  "🔥 핫팩 획득 (회복 버튼으로 사용)"
 ],
 "pk_ice": [
  "❄ 氷玉！ 6発だけ強い",
  "❄ Ice balls! 6 strong shots",
  "❄ 冰球！只有6發特別強",
  "❄ 얼음구슬! 6발만 강력"
 ],
 "foe_cocoa": [
  "☕ 相手がココアを飲んでいる！ いまがチャンス",
  "☕ They're drinking cocoa! Now's your chance",
  "☕ 對手在喝可可！現在是機會",
  "☕ 상대가 코코아를 마시는 중! 지금이 기회"
 ],
 "foe_kairo": [
  "🔥 相手がカイロをあてている！ いまがチャンス",
  "🔥 They're using a hand warmer! Now's your chance",
  "🔥 對手在用暖暖包！現在是機會",
  "🔥 상대가 핫팩을 쓰는 중! 지금이 기회"
 ],
 "heal_no": [
  "いまは回復しなくて大丈夫",
  "You don't need to heal right now",
  "現在不需要回復",
  "지금은 회복하지 않아도 돼요"
 ],
 "heal_none": [
  "回復アイテムを持っていない",
  "You don't have any healing items",
  "沒有回復道具",
  "회복 아이템이 없어요"
 ],
 "fake": [
  "にせもの！",
  "FAKE!",
  "假的！",
  "가짜!"
 ],
 "huh": [
  "ん…？",
  "Huh…?",
  "嗯…？",
  "응…?"
 ],
 "decoy_broke": [
  "⛄ にせ雪だるまが割られた",
  "⛄ Your decoy was broken",
  "⛄ 假雪人被打破了",
  "⛄ 가짜 눈사람이 깨졌어요"
 ],
 "x_point": [
  "{name} が1本",
  "{name} takes the round",
  "{name} 拿下1局",
  "{name} 1판 획득"
 ],
 "snowballed": [
  "ゆきだま！",
  "SNOWBALLED!",
  "雪人啦！",
  "눈사람!"
 ],
 "got_me": [
  "やられた…",
  "Got hit…",
  "被打倒了…",
  "당했다…"
 ],
 "took": [
  "1本とった！",
  "You took the round!",
  "拿下1局！",
  "1판 땄다!"
 ],
 "lost": [
  "1本とられた",
  "You lost the round",
  "被拿下1局",
  "1판 빼앗겼다"
 ],
 "x_wins": [
  "{name} の勝ち",
  "{name} wins",
  "{name} 獲勝",
  "{name} 승리"
 ],
 "res_cpu": [
  "CPU：{lv}",
  "CPU: {lv}",
  "CPU：{lv}",
  "CPU: {lv}"
 ],
 "res_stats": [
  "当てた数 {h}（命中率 {r}%）<br>あたえた雪 {d} ／ くらった雪 {t}",
  "Hits {h} ({r}% accuracy)<br>Snow dealt {d} / Snow taken {t}",
  "命中數 {h}（命中率 {r}%）<br>造成的雪 {d}／受到的雪 {t}",
  "맞힌 수 {h} (명중률 {r}%)<br>준 눈 {d} / 받은 눈 {t}"
 ],
 "watch_next": [
  "ふたりが「もう一回」をおすと、次の試合を観戦できます",
  "When both players press \"Play again\", you can watch the next match",
  "兩人都按「再來一局」後，就能觀看下一場比賽",
  "두 사람이 \"한 판 더\"를 누르면 다음 경기를 관전할 수 있어요"
 ],
 "cold_t": [
  "寒い！",
  "COLD!",
  "好冷！",
  "추워!"
 ],
 "melt": [
  "❄ かべが溶ける {n}",
  "❄ Walls melt in {n}",
  "❄ 牆壁融化 {n}",
  "❄ 벽이 녹아요 {n}"
 ],
 "heal_cocoa": [
  "☕ ココアを飲んでいる…（受ける雪 2割へる）",
  "☕ Drinking cocoa… (20% less snow taken)",
  "☕ 正在喝可可…（受到的雪減少2成）",
  "☕ 코코아 마시는 중… (받는 눈 20% 감소)"
 ],
 "heal_kairo": [
  "🔥 カイロをあてている…（受ける雪 2割へる）",
  "🔥 Using a hand warmer… (20% less snow taken)",
  "🔥 正在用暖暖包…（受到的雪減少2成）",
  "🔥 핫팩 쓰는 중… (받는 눈 20% 감소)"
 ],
 "on_watch": [
  "観戦します。試合が始まるのを待っています…",
  "You're watching. Waiting for the match to start…",
  "觀戰中。等待比賽開始…",
  "관전합니다. 경기 시작을 기다리는 중…"
 ],
 "on_soon": [
  "まもなく始まります！",
  "Starting soon!",
  "馬上開始！",
  "곧 시작해요!"
 ],
 "on_wait": [
  "相手を待っています…（同じあいことばを入れてもらってね）",
  "Waiting for an opponent… (have them enter the same passcode)",
  "等待對手中…（請對方輸入相同暗號）",
  "상대를 기다리는 중… (같은 암호를 입력해 달라고 하세요)"
 ],
 "n_watch": [
  "観戦 {n}人",
  "{n} watching",
  "觀戰 {n}人",
  "관전 {n}명"
 ],
 "room_left": [
  "相手が部屋から出ました",
  "Your opponent left the room",
  "對手離開了房間",
  "상대가 방에서 나갔어요"
 ],
 "player_left": [
  "プレイヤーが部屋から出ました",
  "A player left the room",
  "有玩家離開了房間",
  "플레이어가 방에서 나갔어요"
 ],
 "room_full": [
  "この部屋は観戦の人でいっぱいです（10人まで）",
  "This room is full of spectators (max 10)",
  "這個房間的觀戰人數已滿（最多10人）",
  "이 방은 관전자로 가득 찼어요 (10명까지)"
 ],
 "leave_room": [
  "部屋を出る",
  "Leave room",
  "離開房間",
  "방 나가기"
 ]
};
  function pick() {
    try { var q = new URLSearchParams(location.search).get('lang'); if (q && LANGS.indexOf(q) >= 0) { try { localStorage.setItem(KEY, q); } catch (e) {} return q; } } catch (e) {}
    try { var s = localStorage.getItem(KEY); if (s && LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    var n = (navigator.language || 'ja').toLowerCase();
    if (n.indexOf('ja') === 0) return 'ja'; if (n.indexOf('ko') === 0) return 'ko'; if (n.indexOf('zh') === 0) return 'zh'; return 'en';
  }
  var L = pick();
  function t(k, v) {
    var row = D[k]; var i = LANGS.indexOf(L);
    var s = row ? (row[i] != null ? row[i] : row[0]) : k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  function koFont() {
    if (L !== 'ko' || document.getElementById('ko-font')) return;
    var l = document.createElement('link'); l.id = 'ko-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap'; document.head.appendChild(l);
  }
  function apply() {
    koFont();
    var de = document.documentElement;
    de.lang = L === 'zh' ? 'zh-Hant' : L; de.setAttribute('data-lang', L);
    document.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = t(e.dataset.i); });
    document.querySelectorAll('[data-ih]').forEach(function (e) { e.innerHTML = t(e.dataset.ih); });
    document.querySelectorAll('[data-ip]').forEach(function (e) { e.placeholder = t(e.dataset.ip); });
    document.querySelectorAll('[data-ia]').forEach(function (e) { e.setAttribute('aria-label', t(e.dataset.ia)); });
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === L ? 'true' : 'false'); });
    document.title = t('doc_title');
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('doc_desc'));
    try { document.dispatchEvent(new CustomEvent('langchange', { detail: L })); } catch (e) {}
  }
  function set(l) { if (LANGS.indexOf(l) < 0) return; L = l; try { localStorage.setItem(KEY, l); } catch (e) {} apply(); }
  function bind() {
    document.querySelectorAll('.langs button').forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.lang); }); });
    apply();
  }
  window.I18N = { t: t, set: set, apply: apply, get lang() { return L; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
