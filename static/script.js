/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  MATH BATTLE ARENA – AI ANIME EDITION                   ║
 * ║  script.js – Full game engine                           ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Sections:
 *   1. Config & State
 *   2. URL Params
 *   3. DOM Cache
 *   4. Audio Engine
 *   5. Stars Background
 *   6. Anime Character System
 *   7. Question Engine
 *   8. Answer Rendering
 *   9. Timer System
 *  10. Scoring
 *  11. Tug of War
 *  12. Speed Round
 *  13. Turn Management
 *  14. Game Over / Winner
 *  15. Confetti
 *  16. Init
 */

// ═══════════════════════════════════════════════════════════════════════
// 1. CONFIG & STATE
// ═══════════════════════════════════════════════════════════════════════

const CFG = {
  QUESTION_TIME:   10,   // seconds per question
  TUG_WIN:         5,    // pulls to win tug mode
  SPEED_SECONDS:   60,   // speed round duration
  CORRECT_PTS:     10,
  WRONG_PTS:       -5,
  PRACTICE_HINTS:  true, // show hints in practice mode
};

let ST = {
  blueScore: 0, redScore:  0,
  blueCorrect: 0, blueTotal: 0,
  redCorrect: 0,  redTotal: 0,
  blueTug: 0, redTug: 0,
  turn: "blue",    // "blue" | "red"
  round: 1,
  currentQ: null,
  timeLeft: CFG.QUESTION_TIME,
  speedLeft: CFG.SPEED_SECONDS,
  timerIv: null,
  speedIv: null,
  gameOver: false,
  locked: false,   // answer locked (awaiting next Q)
  musicOn: false,
  ttsOn: true,
};

// ═══════════════════════════════════════════════════════════════════════
// 2. URL PARAMS
// ═══════════════════════════════════════════════════════════════════════

const URL_P  = new URLSearchParams(location.search);
const BLUE   = URL_P.get("blue") || "Team Blue";
const RED    = URL_P.get("red")  || "Team Red";
const MODE   = URL_P.get("mode") || "battle";   // battle|tugofwar|speed|practice
const DIFF   = URL_P.get("diff") || "easy";     // easy|medium|hard|auto
const CHAR   = URL_P.get("char") || "aria";

const CHAR_DATA = {
  aria:  { emoji:"🧙‍♀️", color:"#a855f7", voice_pitch:1.3 },
  kai:   { emoji:"🦊",   color:"#f97316", voice_pitch:1.1 },
  luna:  { emoji:"🌸",   color:"#ec4899", voice_pitch:1.5 },
  blaze: { emoji:"🐉",   color:"#ef4444", voice_pitch:.9  },
};
const COMPANION = CHAR_DATA[CHAR] || CHAR_DATA.aria;

// ═══════════════════════════════════════════════════════════════════════
// 3. DOM CACHE
// ═══════════════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const D = {
  blueBox:   $("box-blue"),   redBox:    $("box-red"),
  blueScore: $("scr-blue"),   redScore:  $("scr-red"),
  blueLbl:   $("lbl-blue"),   redLbl:    $("lbl-red"),
  blueStars: $("str-blue"),   redStars:  $("str-red"),
  qBadge:    $("q-badge"),    modePill:  $("mode-pill"),
  timerRing: $("timer-ring"), timerNum:  $("timer-num"),
  timerCirc: document.querySelector(".timer-ring circle"),
  tugWrap:   $("tug-wrap"),   speedWrap: $("speed-wrap"),
  tugKnot:   $("tug-knot"),
  tfBlue:    $("tf-blue"),    tfRed:     $("tf-red"),
  tugB:      $("tug-b"),      tugR:      $("tug-r"),
  speedFill: $("speed-fill"), speedLbl:  $("speed-lbl"),
  turnBanner:$("turn-banner"),
  qCard:     $("q-card"),
  diffChip:  $("diff-chip"),  qText:     $("q-text"),
  hintText:  $("hint-text"),  ansGrid:   $("ans-grid"),
  feedback:  $("feedback"),
  charSvg:   $("char-svg"),   bubble:    $("speech-bubble"),
  winOverlay:$("winner-overlay"),
  winTitle:  $("win-title"),  winScores: $("win-scores"),
  winChar:   $("win-char"),
  musicFab:  $("music-fab"),
};

// ═══════════════════════════════════════════════════════════════════════
// 4. AUDIO ENGINE  (Web Audio API – zero external files)
// ═══════════════════════════════════════════════════════════════════════

let audioCtx = null;
let bgNodes  = [];

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}

function resumeCtx() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

/**
 * Play a simple synthesized tone.
 * @param {number}  freq  - Hz
 * @param {string}  type  - oscillator type
 * @param {number}  dur   - seconds
 * @param {number}  vol   - 0..1
 * @param {number}  delay - seconds from now
 */
function playTone(freq, type="sine", dur=.15, vol=.3, delay=0) {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + dur);
    return o;
  } catch(e) { return null; }
}

/* Correct: ascending triad */
function sfxCorrect() {
  playTone(523, "sine", .12, .35);
  playTone(659, "sine", .12, .35, .1);
  playTone(784, "sine", .22, .35, .2);
  playTone(1047,"sine", .25, .3,  .35);
}

/* Wrong: descending buzz */
function sfxWrong() {
  playTone(300, "sawtooth", .12, .25);
  playTone(220, "sawtooth", .2,  .25, .1);
}

/* Timer tick */
function sfxTick() { playTone(1200, "sine", .04, .08); }

/* Win fanfare */
function sfxWin() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => playTone(f, "sine", .3, .4, i * .12));
  setTimeout(() => notes.slice().reverse().forEach((f,i)=>playTone(f,"sine",.2,.3,i*.1)),1000);
}

/* Timeout buzz */
function sfxTimeout() {
  playTone(350, "triangle", .4, .2);
}

/* Background music toggle */
let bgMusicRunning = false;
let bgMusicTimer   = null;
const BG_MELODY = [261, 329, 392, 261, 329, 392, 523, 392, 329, 261];
let bgMelIdx = 0;

function startBgMusic() {
  if (bgMusicRunning) return;
  bgMusicRunning = true;
  (function playNext() {
    if (!ST.musicOn || !bgMusicRunning) return;
    playTone(BG_MELODY[bgMelIdx++ % BG_MELODY.length], "sine", .5, .06);
    bgMusicTimer = setTimeout(playNext, 600);
  })();
}

function stopBgMusic() {
  bgMusicRunning = false;
  clearTimeout(bgMusicTimer);
}

function toggleMusic() {
  resumeCtx();
  ST.musicOn = !ST.musicOn;
  D.musicFab.textContent = ST.musicOn ? "🔇" : "🎵";
  ST.musicOn ? startBgMusic() : stopBgMusic();
}

// ═══════════════════════════════════════════════════════════════════════
// 5. STARS BACKGROUND
// ═══════════════════════════════════════════════════════════════════════

function initStars() {
  const bg = $("star-bg");
  if (!bg) return;
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const sz = rnd(2, 5);
    s.style.cssText = `
      width:${sz}px;height:${sz}px;
      left:${rnd(0,100)}%;top:${rnd(0,100)}%;
      --d:${rnd(2,7)}s;--dl:${rnd(0,6)}s;
    `;
    bg.appendChild(s);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 6. ANIME CHARACTER SYSTEM
// ═══════════════════════════════════════════════════════════════════════

const MOODS = {
  thinking: {
    mouth: "M50 90 Q60 90 70 90",  // flat line
    blush: .3,
    pupils: { lx:49, ly:70, rx:75, ry:70 },
  },
  happy: {
    mouth: "M46 87 Q60 104 74 87",  // big smile
    blush: .7,
    pupils: { lx:49, ly:74, rx:75, ry:74 },
  },
  sad: {
    mouth: "M50 95 Q60 85 70 95",   // frown
    blush: .2,
    pupils: { lx:49, ly:76, rx:75, ry:76 },
  },
  win: {
    mouth: "M44 85 Q60 108 76 85",  // huge smile
    blush: .9,
    pupils: { lx:49, ly:72, rx:75, ry:72 },
  },
  excited: {
    mouth: "M46 86 Q60 106 74 86",
    blush: .8,
    pupils: { lx:49, ly:71, rx:75, ry:71 },
  },
};

let bubbleTimer = null;

function setCharMood(mood, message) {
  const m = MOODS[mood] || MOODS.thinking;
  // Update SVG inline
  const svg = D.charSvg;
  if (!svg) return;

  // Mouth
  const mouth = svg.querySelector("#char-mouth");
  if (mouth) mouth.setAttribute("d", m.mouth);

  // Blush
  const bl = svg.querySelector("#blush-l");
  const br = svg.querySelector("#blush-r");
  if (bl) bl.setAttribute("opacity", m.blush);
  if (br) br.setAttribute("opacity", m.blush);

  // Pupils
  const pl = svg.querySelector("#pupil-l");
  const pr = svg.querySelector("#pupil-r");
  if (pl) { pl.setAttribute("cx", m.pupils.lx); pl.setAttribute("cy", m.pupils.ly); }
  if (pr) { pr.setAttribute("cx", m.pupils.rx); pr.setAttribute("cy", m.pupils.ry); }

  // Animation class
  svg.className.baseVal = "char-svg " + mood;

  // Speech bubble
  if (message) {
    D.bubble.textContent = message;
    D.bubble.style.opacity = "1";
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { D.bubble.style.opacity = "0"; }, 3000);

    // TTS
    if (ST.ttsOn && "speechSynthesis" in window) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(message.replace(/[⭐🌟💥✨🔥😊🎉💪🌈📚🎯⚡💖👑🏆]/gu, ""));
        u.rate  = 1.05;
        u.pitch = COMPANION.voice_pitch || 1.2;
        speechSynthesis.speak(u);
      } catch(e) {}
    }
  }
}

async function fetchCharMessage(mood) {
  try {
    const res = await fetch("/api/message", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ mood }),
    });
    const data = await res.json();
    setCharMood(mood, data.message);
  } catch(e) {
    // fallback messages
    const fb = {
      correct: "Great job! ⭐",
      wrong:   "Try again! 💪",
      thinking:"Focus! 🎯",
      win:     "AMAZING! 🏆",
      timeout: "Be faster! ⚡",
    };
    setCharMood(mood, fb[mood] || "Let's go! ⚡");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 7. QUESTION ENGINE
// ═══════════════════════════════════════════════════════════════════════

async function fetchQuestion() {
  const team = ST.turn;
  const perf = ST[`${team}Total`] > 0
    ? ST[`${team}Correct`] / ST[`${team}Total`]
    : null;

  try {
    const res = await fetch("/api/question", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ difficulty: DIFF, performance: perf }),
    });
    return await res.json();
  } catch(e) {
    return fallbackQuestion();
  }
}

function fallbackQuestion() {
  // Local fallback so game works even without network
  const ops = [
    { op:"+", a:rnd(1,20), b:rnd(1,20) },
    { op:"−", a:rnd(5,20), b:rnd(1,5)  },
    { op:"×", a:rnd(2,9),  b:rnd(2,9)  },
  ];
  const chosen = ops[Math.floor(Math.random() * (DIFF==="easy" ? 2 : 3))];
  const {op,a,b} = chosen;
  const ans = op==="+" ? a+b : op==="−" ? a-b : a*b;
  return {
    question: `${a} ${op} ${b}`,
    answer: ans,
    difficulty: DIFF==="auto" ? "easy" : DIFF,
    hint: "Take your time! 😊",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 8. ANSWER RENDERING
// ═══════════════════════════════════════════════════════════════════════

function generateChoices(correct) {
  const s = new Set([correct]);
  let attempts = 0;
  while (s.size < 4 && attempts < 50) {
    attempts++;
    const delta = rnd(1, 12) * (Math.random() > .5 ? 1 : -1);
    const v = correct + delta;
    if (v >= 0 && v !== correct) s.add(v);
  }
  return shuffle([...s]);
}

function renderAnswers(choices, correct) {
  D.ansGrid.innerHTML = "";
  choices.forEach((val, i) => {
    const btn = document.createElement("button");
    btn.className = `ans-btn c${i} ripple`;
    btn.textContent = val;
    btn.setAttribute("aria-label", `Answer: ${val}`);
    btn.addEventListener("click", () => onAnswer(val, correct, btn));
    D.ansGrid.appendChild(btn);
  });
}

async function loadQuestion() {
  if (ST.gameOver) return;
  ST.locked = false;

  const q = await fetchQuestion();
  ST.currentQ = q;

  // Animate card
  D.qCard.style.animation = "none";
  void D.qCard.offsetWidth; // reflow
  D.qCard.style.animation = "qCardIn .4s cubic-bezier(.34,1.56,.64,1)";

  // Question text
  D.qText.textContent = q.question;
  D.qBadge.textContent = `Q ${ST.round}`;

  // Difficulty chip
  const chipMap = { easy:"😊 Easy easy", medium:"😎 Medium medium", hard:"🔥 Hard hard" };
  const [chipLabel, chipClass] = (chipMap[q.difficulty] || "😊 Easy easy").split(" ");
  D.diffChip.textContent = chipLabel + " " + chipClass.replace(/[a-z]+$/,"");
  D.diffChip.className = `diff-chip ${q.difficulty || "easy"}`;

  // Hint (practice mode)
  D.hintText.textContent = MODE === "practice" && CFG.PRACTICE_HINTS ? q.hint || "" : "";

  // Turn banner
  updateTurnBanner();

  // Active team highlight
  D.blueBox.classList.toggle("active-team", ST.turn === "blue");
  D.redBox.classList.toggle("active-team",  ST.turn === "red");

  // Answers
  const choices = generateChoices(q.answer);
  renderAnswers(choices, q.answer);

  // Clear feedback
  D.feedback.textContent = "";
  D.feedback.className = "feedback";

  // Char: thinking
  fetchCharMessage("thinking");

  // Start timer
  startQuestionTimer();
}

function updateTurnBanner() {
  if (MODE === "practice") {
    D.turnBanner.className = "turn-banner solo-turn";
    D.turnBanner.textContent = "🎮 Practice Mode – Solo Player";
  } else if (ST.turn === "blue") {
    D.turnBanner.className = "turn-banner blue-turn";
    D.turnBanner.textContent = `💙 ${BLUE}'s Turn!`;
  } else {
    D.turnBanner.className = "turn-banner red-turn";
    D.turnBanner.textContent = `❤️ ${RED}'s Turn!`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 9. TIMER SYSTEM
// ═══════════════════════════════════════════════════════════════════════

function startQuestionTimer() {
  ST.timeLeft = CFG.QUESTION_TIME;
  renderTimer();
  clearInterval(ST.timerIv);
  ST.timerIv = setInterval(() => {
    ST.timeLeft--;
    renderTimer();
    if (ST.timeLeft <= 3 && ST.timeLeft > 0) sfxTick();
    if (ST.timeLeft <= 0) {
      clearInterval(ST.timerIv);
      onTimeout();
    }
  }, 1000);
}

function renderTimer() {
  const t   = ST.timeLeft;
  const pct = t / CFG.QUESTION_TIME;
  D.timerNum.textContent = t;

  // SVG circle: circumference = 2π×20.8 ≈ 131
  if (D.timerCirc) {
    D.timerCirc.style.strokeDashoffset = 131 * (1 - pct);
    D.timerCirc.style.stroke =
      t > 5 ? "#22c55e" : t > 2 ? "#facc15" : "#ef4444";
  }
}

function onTimeout() {
  if (ST.locked || ST.gameOver) return;
  ST.locked = true;
  sfxTimeout();
  fetchCharMessage("timeout");
  showFeedback("tmo", `⏰ Time's up! Answer: ${ST.currentQ.answer}`);
  lockAllButtons("timeout");
  setTimeout(nextTurn, 1900);
}

// ═══════════════════════════════════════════════════════════════════════
// 10. SCORING
// ═══════════════════════════════════════════════════════════════════════

function onAnswer(chosen, correct, btn) {
  if (ST.locked || ST.gameOver) return;
  ST.locked = true;
  clearInterval(ST.timerIv);
  resumeCtx();

  const isRight = parseInt(chosen) === parseInt(correct);
  const team    = ST.turn;

  ST[`${team}Total`]++;
  if (isRight) ST[`${team}Correct`]++;

  if (isRight) {
    sfxCorrect();
    btn.classList.add("correct");
    showFeedback("ok", `✅ Correct! +${CFG.CORRECT_PTS} ⭐`);
    addScore(team, CFG.CORRECT_PTS);
    if (MODE === "tugofwar") tugPull(team, true);
    fetchCharMessage("correct");
  } else {
    sfxWrong();
    btn.classList.add("wrong");
    // reveal correct
    document.querySelectorAll(".ans-btn").forEach(b => {
      if (parseInt(b.textContent) === parseInt(correct)) b.classList.add("correct");
    });
    showFeedback("err", `❌ Wrong! ${CFG.WRONG_PTS} pts`);
    addScore(team, CFG.WRONG_PTS);
    if (MODE === "tugofwar") tugPull(team, false);
    fetchCharMessage("wrong");
  }

  setTimeout(() => { if (!ST.gameOver) nextTurn(); }, 1700);
}

function addScore(team, delta) {
  if (team === "blue") {
    ST.blueScore = Math.max(0, ST.blueScore + delta);
    D.blueScore.textContent = ST.blueScore;
    bump(D.blueScore);
    updateStars(D.blueStars, ST.blueScore);
  } else {
    ST.redScore = Math.max(0, ST.redScore + delta);
    D.redScore.textContent = ST.redScore;
    bump(D.redScore);
    updateStars(D.redStars, ST.redScore);
  }
}

function bump(el) {
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function updateStars(el, score) {
  el.textContent = "⭐".repeat(Math.min(Math.floor(score / 20), 5));
}

function showFeedback(cls, msg) {
  D.feedback.textContent = msg;
  D.feedback.className = `feedback ${cls}`;
}

function lockAllButtons(cause) {
  document.querySelectorAll(".ans-btn").forEach(b => {
    b.disabled = true;
    if (cause === "timeout" && parseInt(b.textContent) === parseInt(ST.currentQ.answer))
      b.classList.add("correct");
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 11. TUG OF WAR
// ═══════════════════════════════════════════════════════════════════════

function tugPull(team, correct) {
  if (correct) {
    if (team === "blue") ST.blueTug++;
    else                  ST.redTug++;
  }
  renderTug();
  if (ST.blueTug >= CFG.TUG_WIN) endGame("blue");
  else if (ST.redTug >= CFG.TUG_WIN) endGame("red");
}

function renderTug() {
  const bl  = ST.blueTug;
  const rl  = ST.redTug;
  const tot = CFG.TUG_WIN * 2;

  D.tfBlue.style.width = (bl / tot * 100) + "%";
  D.tfRed.style.width  = (rl / tot * 100) + "%";
  D.tugB.textContent   = bl;
  D.tugR.textContent   = rl;

  // Knot position: 50% neutral, moves ±40% based on pull diff
  const pct = 50 + ((bl - rl) / CFG.TUG_WIN) * 40;
  D.tugKnot.style.left = clamp(pct, 8, 92) + "%";
}

// ═══════════════════════════════════════════════════════════════════════
// 12. SPEED ROUND
// ═══════════════════════════════════════════════════════════════════════

function startSpeedTimer() {
  ST.speedLeft = CFG.SPEED_SECONDS;
  renderSpeedBar();
  ST.speedIv = setInterval(() => {
    ST.speedLeft--;
    renderSpeedBar();
    if (ST.speedLeft <= 0) {
      clearInterval(ST.speedIv);
      // Speed mode: whoever has more points wins
      const winner = ST.blueScore >= ST.redScore ? "blue" : "red";
      const draw   = ST.blueScore === ST.redScore;
      endGame(winner, draw);
    }
  }, 1000);
}

function renderSpeedBar() {
  const pct = (ST.speedLeft / CFG.SPEED_SECONDS) * 100;
  D.speedFill.style.width = pct + "%";
  D.speedLbl.textContent  = `${ST.speedLeft}s`;
  if (pct < 25) D.speedFill.style.background = "linear-gradient(90deg,#ef4444,#f97316)";
  else          D.speedFill.style.background = "linear-gradient(90deg,#22c55e,#ffd700)";
}

// ═══════════════════════════════════════════════════════════════════════
// 13. TURN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function nextTurn() {
  if (ST.gameOver) return;
  if (MODE !== "practice") {
    ST.turn = ST.turn === "blue" ? "red" : "blue";
  }
  ST.round++;
  loadQuestion();
}

// ═══════════════════════════════════════════════════════════════════════
// 14. GAME OVER / WINNER
// ═══════════════════════════════════════════════════════════════════════

function endGame(winnerTeam, draw=false) {
  if (ST.gameOver) return;
  ST.gameOver = true;
  clearInterval(ST.timerIv);
  clearInterval(ST.speedIv);

  const winName  = winnerTeam === "blue" ? BLUE : RED;
  const winScore = winnerTeam === "blue" ? ST.blueScore : ST.redScore;

  sfxWin();
  fetchCharMessage("win");
  startConfetti();

  // Show winner overlay briefly, then navigate to winner page
  D.winTitle.textContent  = draw ? "🤝 It's a Draw!" : `${winName} Wins! 🎉`;
  D.winScores.textContent = `${BLUE}: ${ST.blueScore}  |  ${RED}: ${ST.redScore}`;
  D.winChar.textContent   = COMPANION.emoji;
  D.winOverlay.style.display = "flex";
  setCharMood("win");

  // Submit to leaderboard
  fetch("/api/leaderboard", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      winner: draw ? "DRAW" : winName,
      score: winScore,
      mode: MODE,
      blue: BLUE, red: RED,
    }),
  }).catch(() => {});

  // Navigate to winner page after delay
  setTimeout(() => {
    const p = new URLSearchParams({
      winner: draw ? "Draw" : winName,
      blue:   ST.blueScore,
      red:    ST.redScore,
      char:   CHAR,
      mode:   MODE,
      draw:   draw ? "1" : "0",
    });
    window.location.href = `/winner?${p}`;
  }, 3500);
}

// ═══════════════════════════════════════════════════════════════════════
// 15. CONFETTI
// ═══════════════════════════════════════════════════════════════════════

function startConfetti() {
  const canvas = $("confetti-canvas");
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx2 = canvas.getContext("2d");
  const colors = ["#ffd700","#ef4444","#3b82f6","#22c55e","#ec4899","#a78bfa","#f97316"];
  const pieces = Array.from({length:200}, () => ({
    x:  rnd(0, canvas.width),
    y:  rnd(-canvas.height, 0),
    r:  rnd(5, 12),
    d:  rnd(2, 7),
    color: colors[Math.floor(Math.random()*colors.length)],
    t: 0, ti: rnd(2,8)/100,
  }));
  let frame = 0;
  (function draw() {
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.t += p.ti; p.y += p.d; p.x += Math.sin(p.t) * 1.5;
      if (p.y > canvas.height + 20) { p.y = -20; p.x = rnd(0, canvas.width); }
      ctx2.save(); ctx2.translate(p.x, p.y); ctx2.rotate(p.t);
      ctx2.fillStyle = p.color;
      ctx2.fillRect(-p.r/2, -p.r/2, p.r, p.r);
      ctx2.restore();
    });
    frame++;
    if (frame < 600) requestAnimationFrame(draw);
    else ctx2.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ═══════════════════════════════════════════════════════════════════════
// 16. INIT
// ═══════════════════════════════════════════════════════════════════════

function init() {
  // ── Labels ───────────────────────────────────────────────────────────
  D.blueLbl.textContent = "💙 " + BLUE;
  D.redLbl.textContent  = "❤️ " + RED;
  D.modePill.textContent = {
    battle:   "⚔️ BATTLE",
    tugofwar: "🪢 TUG OF WAR",
    speed:    "⚡ SPEED",
    practice: "📚 PRACTICE",
  }[MODE] || "BATTLE";

  // ── Mode setup ────────────────────────────────────────────────────────
  if (MODE === "tugofwar") {
    D.tugWrap.style.display   = "";
    D.speedWrap.style.display = "none";
  } else if (MODE === "speed") {
    D.tugWrap.style.display   = "none";
    D.speedWrap.style.display = "";
    startSpeedTimer();
  } else {
    D.tugWrap.style.display   = "none";
    D.speedWrap.style.display = "none";
  }

  // Practice mode: only blue team active
  if (MODE === "practice") {
    D.redBox.style.opacity = ".4";
    D.blueLbl.textContent  = "🎮 Solo Player";
  }

  // ── Stars ─────────────────────────────────────────────────────────────
  initStars();

  // ── Character appearance ──────────────────────────────────────────────
  // Tint SVG to match companion color
  D.charSvg.style.filter = `drop-shadow(0 0 8px ${COMPANION.color})`;

  // ── Music fab ─────────────────────────────────────────────────────────
  D.musicFab.addEventListener("click", toggleMusic);

  // ── Resume AudioCtx on first interaction ─────────────────────────────
  document.addEventListener("click", resumeCtx, { once: true });

  // ── Start game ────────────────────────────────────────────────────────
  loadQuestion();
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Boot ──────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", init);
