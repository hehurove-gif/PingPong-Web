const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const overlay = document.getElementById('gameOverlay');
const overlayMessage = document.getElementById('overlayMessage');
const startButton = document.getElementById('startButton');
const levelsEl = document.getElementById('levels');
const levelButtons = Array.from(levelsEl.querySelectorAll('.level'));
const levelBadge = document.getElementById('levelBadge');
const recordLine = document.getElementById('recordLine');
const soundButton = document.getElementById('soundButton');

const W = canvas.width;
const H = canvas.height;
const WIN_SCORE = 5;
const MAX_BALL_VX = 16;
const MAX_BALL_VY = 11;

/* Niveles de dificultad.
   paddle: alto de las paletas · ballSpeed: velocidad al sacar · speedUp: aceleración por golpe
   aiLerp: qué tan rápido corrige la computadora · aiMax: velocidad máxima de su paleta (px/frame)
   aiError: imprecisión (px) al apuntar · aiTrackFrom: fracción del ancho desde donde empieza a seguir la pelota */
const LEVELS = {
  easy:   { label: 'Easy',   paddle: 120, ballSpeed: 5, speedUp: 1.02, aiLerp: 0.05,  aiMax: 5,  aiError: 70, aiTrackFrom: 0.5 },
  normal: { label: 'Normal', paddle: 105, ballSpeed: 6, speedUp: 1.04, aiLerp: 0.075, aiMax: 7,  aiError: 35, aiTrackFrom: 0.3 },
  hard:   { label: 'Hard',   paddle: 95,  ballSpeed: 7, speedUp: 1.05, aiLerp: 0.13,  aiMax: 10, aiError: 14, aiTrackFrom: 0.1 },
  insane: { label: 'Insane', paddle: 85,  ballSpeed: 8, speedUp: 1.06, aiLerp: 0.18,  aiMax: 12, aiError: 6,  aiTrackFrom: 0 },
};

const paddle = { width: 14, height: LEVELS.normal.paddle, speed: 8 };
const player = { x: 32, y: H / 2 - paddle.height / 2, score: 0, velocity: 0 };
const computer = { x: W - 46, y: H / 2 - paddle.height / 2, score: 0, offset: 0 };
const ball = { x: W / 2, y: H / 2, radius: 9, speed: 6, vx: 6, vy: 2.5 };
const keys = { up: false, down: false };
const trail = [];

let levelKey = 'normal';
let level = LEVELS[levelKey];
let running = false;
let paused = false;
let animationFrame;
let soundOn = true;
let audioCtx = null;
let shake = 0;

/* ---------- Almacenamiento (puede fallar en modo privado: siempre con try/catch) ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* sin almacenamiento */ }
}

const stats = loadJSON('neonpong.stats', {});
function statsFor(key) {
  const s = stats[key] || {};
  return { wins: s.wins || 0, losses: s.losses || 0, streak: s.streak || 0, best: s.best || 0 };
}
function recordResult(playerWon) {
  const s = statsFor(levelKey);
  if (playerWon) {
    s.wins++;
    s.streak++;
    s.best = Math.max(s.best, s.streak);
  } else {
    s.losses++;
    s.streak = 0;
  }
  stats[levelKey] = s;
  saveJSON('neonpong.stats', stats);
}

/* ---------- Sonido (Web Audio, sin archivos) ---------- */
function beep(freq, duration = 0.08, type = 'square', volume = 0.05) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) { /* sin audio disponible */ }
}
function sfx(name) {
  if (name === 'paddle') beep(440, 0.07);
  else if (name === 'wall') beep(260, 0.05, 'triangle');
  else if (name === 'score') beep(150, 0.25, 'sawtooth', 0.06);
  else if (name === 'win') { beep(523, 0.12); setTimeout(() => beep(659, 0.12), 120); setTimeout(() => beep(784, 0.25), 240); }
  else if (name === 'lose') { beep(300, 0.2, 'sawtooth'); setTimeout(() => beep(200, 0.35, 'sawtooth'), 180); }
}
function updateSoundButton() {
  soundButton.textContent = soundOn ? '🔊 Sound on' : '🔇 Sound off';
  soundButton.setAttribute('aria-pressed', String(soundOn));
}
function toggleSound() {
  soundOn = !soundOn;
  saveJSON('neonpong.sound', soundOn);
  updateSoundButton();
}

/* ---------- Dificultad ---------- */
function updateRecordLine() {
  const s = statsFor(levelKey);
  if (!s.wins && !s.losses) {
    recordLine.textContent = `${level.label}: no games yet`;
    return;
  }
  recordLine.textContent = `${level.label}: ${s.wins} W – ${s.losses} L · best streak ${s.best}`;
}

function setLevel(key) {
  if (!LEVELS[key]) return;
  levelKey = key;
  level = LEVELS[key];
  paddle.height = level.paddle;
  levelBadge.textContent = level.label.toUpperCase();
  levelButtons.forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.level === key)));
  saveJSON('neonpong.level', key);
  updateRecordLine();
  if (!running) {
    player.y = computer.y = H / 2 - paddle.height / 2;
    draw();
  }
}

/* ---------- Juego ---------- */
function resetBall(direction = 1) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = level.ballSpeed;
  ball.vx = direction * ball.speed;
  ball.vy = (Math.random() * 4 - 2) || 1;
  computer.offset = (Math.random() * 2 - 1) * level.aiError;
  trail.length = 0;
}

function resetGame() {
  player.score = 0;
  computer.score = 0;
  playerScoreEl.textContent = '0';
  computerScoreEl.textContent = '0';
  paddle.height = level.paddle;
  player.y = computer.y = H / 2 - paddle.height / 2;
  resetBall(Math.random() > .5 ? 1 : -1);
}

function showOverlay(message, buttonText, isPaused = false) {
  overlayMessage.textContent = message;
  startButton.textContent = buttonText;
  overlay.classList.toggle('is-paused', isPaused);
  overlay.classList.remove('hidden');
}

function startGame() {
  resetGame();
  running = true;
  paused = false;
  overlay.classList.add('hidden');
  cancelAnimationFrame(animationFrame);
  loop();
}

function pauseGame() {
  if (!running || paused) return;
  paused = true;
  cancelAnimationFrame(animationFrame);
  showOverlay('Paused', 'Resume', true);
}

function resumeGame() {
  if (!running || !paused) return;
  paused = false;
  overlay.classList.add('hidden');
  loop();
}

function endGame(playerWon) {
  running = false;
  recordResult(playerWon);
  updateRecordLine();
  sfx(playerWon ? 'win' : 'lose');
  showOverlay(playerWon ? 'You win!' : 'Computer wins!', 'Play Again');
}

function movePlayer() {
  player.velocity = (keys.down ? paddle.speed : 0) - (keys.up ? paddle.speed : 0);
  player.y += player.velocity;
  player.y = Math.max(0, Math.min(H - paddle.height, player.y));
}

function moveComputer() {
  const incoming = ball.vx > 0 && ball.x > W * level.aiTrackFrom;
  const target = incoming ? ball.y + computer.offset - paddle.height / 2 : H / 2 - paddle.height / 2;
  const lerp = incoming ? level.aiLerp : 0.02;
  const delta = Math.max(-level.aiMax, Math.min(level.aiMax, (target - computer.y) * lerp));
  computer.y += delta;
  computer.y = Math.max(0, Math.min(H - paddle.height, computer.y));
}

function intersects(p) {
  return ball.x - ball.radius < p.x + paddle.width &&
    ball.x + ball.radius > p.x &&
    ball.y - ball.radius < p.y + paddle.height &&
    ball.y + ball.radius > p.y;
}

function clampBall() {
  ball.vx = Math.max(-MAX_BALL_VX, Math.min(MAX_BALL_VX, ball.vx));
  ball.vy = Math.max(-MAX_BALL_VY, Math.min(MAX_BALL_VY, ball.vy));
}

function update() {
  movePlayer();
  moveComputer();
  ball.x += ball.vx;
  ball.y += ball.vy;

  trail.push({ x: ball.x, y: ball.y });
  if (trail.length > 8) trail.shift();
  if (shake > 0) shake -= 1;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
    ball.vy *= -1;
    ball.y = Math.max(ball.radius, Math.min(H - ball.radius, ball.y));
    sfx('wall');
  }

  if (ball.vx < 0 && intersects(player)) {
    ball.x = player.x + paddle.width + ball.radius;
    ball.vx = Math.abs(ball.vx) * level.speedUp;
    ball.vy += (ball.y - (player.y + paddle.height / 2)) * 0.08;
    computer.offset = (Math.random() * 2 - 1) * level.aiError;
    clampBall();
    sfx('paddle');
  }
  if (ball.vx > 0 && intersects(computer)) {
    ball.x = computer.x - ball.radius;
    ball.vx = -Math.abs(ball.vx) * level.speedUp;
    ball.vy += (ball.y - (computer.y + paddle.height / 2)) * 0.08;
    clampBall();
    sfx('paddle');
  }

  if (ball.x < -ball.radius) {
    computer.score++;
    computerScoreEl.textContent = computer.score;
    shake = 10;
    if (computer.score >= WIN_SCORE) return endGame(false);
    sfx('score');
    resetBall(-1);
  } else if (ball.x > W + ball.radius) {
    player.score++;
    playerScoreEl.textContent = player.score;
    if (player.score >= WIN_SCORE) return endGame(true);
    sfx('score');
    resetBall(1);
  }
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  ctx.fillStyle = '#10152b';
  ctx.fillRect(-12, -12, W + 24, H + 24);
  ctx.strokeStyle = '#29335c';
  ctx.setLineDash([10, 16]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);

  ctx.shadowBlur = 18;
  ctx.shadowColor = '#69f6d2';
  ctx.fillStyle = '#69f6d2';
  ctx.fillRect(player.x, player.y, paddle.width, paddle.height);
  ctx.shadowColor = '#ff6bcb';
  ctx.fillStyle = '#ff6bcb';
  ctx.fillRect(computer.x, computer.y, paddle.width, paddle.height);

  ctx.shadowBlur = 0;
  trail.forEach((p, i) => {
    ctx.globalAlpha = ((i + 1) / trail.length) * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(p.x, p.y, ball.radius * ((i + 1) / trail.length), 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.shadowBlur = 18;
  ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function loop() {
  if (!running || paused) return;
  update();
  draw();
  animationFrame = requestAnimationFrame(loop);
}

function setPlayerFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height;
  player.y = (event.clientY - rect.top) * scaleY - paddle.height / 2;
  player.y = Math.max(0, Math.min(H - paddle.height, player.y));
}

/* ---------- Eventos ---------- */
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (event.key === 'ArrowUp' || key === 'w') { keys.up = true; event.preventDefault(); }
  if (event.key === 'ArrowDown' || key === 's') { keys.down = true; event.preventDefault(); }
  if (event.key === ' ') {
    if (event.target === startButton || levelButtons.includes(event.target) || event.target === soundButton) return;
    event.preventDefault();
    if (paused) resumeGame();
    else if (!running) startGame();
  }
  if (key === 'p' || event.key === 'Escape') {
    if (running && !paused) pauseGame();
    else if (paused) resumeGame();
  }
  if (key === 'm') toggleSound();
  if (!running && ['1', '2', '3', '4'].includes(event.key)) setLevel(Object.keys(LEVELS)[Number(event.key) - 1]);
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (event.key === 'ArrowUp' || key === 'w') keys.up = false;
  if (event.key === 'ArrowDown' || key === 's') keys.down = false;
});
window.addEventListener('blur', () => { keys.up = keys.down = false; pauseGame(); });
canvas.addEventListener('mousemove', setPlayerFromPointer);
canvas.addEventListener('touchmove', (event) => { setPlayerFromPointer(event.touches[0]); event.preventDefault(); }, { passive: false });
levelButtons.forEach((btn) => btn.addEventListener('click', () => { if (!running) setLevel(btn.dataset.level); }));
startButton.addEventListener('click', () => { if (paused) resumeGame(); else startGame(); });
soundButton.addEventListener('click', toggleSound);

/* ---------- Inicio ---------- */
soundOn = loadJSON('neonpong.sound', true) !== false;
updateSoundButton();
setLevel(LEVELS[loadJSON('neonpong.level', 'normal')] ? loadJSON('neonpong.level', 'normal') : 'normal');
draw();
