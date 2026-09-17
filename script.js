const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const overlay = document.getElementById('gameOverlay');
const overlayMessage = document.getElementById('overlayMessage');
const startButton = document.getElementById('startButton');

const W = canvas.width;
const H = canvas.height;
const paddle = { width: 14, height: 105, speed: 8 };
const player = { x: 32, y: H / 2 - paddle.height / 2, score: 0, velocity: 0 };
const computer = { x: W - 46, y: H / 2 - paddle.height / 2, score: 0 };
const ball = { x: W / 2, y: H / 2, radius: 9, speed: 6, vx: 6, vy: 2.5 };
const keys = { up: false, down: false };
let running = false;
let animationFrame;

function resetBall(direction = 1) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = 6;
  ball.vx = direction * ball.speed;
  ball.vy = (Math.random() * 4 - 2) || 1;
}

function resetGame() {
  player.score = 0;
  computer.score = 0;
  playerScoreEl.textContent = '0';
  computerScoreEl.textContent = '0';
  player.y = computer.y = H / 2 - paddle.height / 2;
  resetBall(Math.random() > .5 ? 1 : -1);
}

function startGame() {
  resetGame();
  running = true;
  overlay.classList.add('hidden');
  cancelAnimationFrame(animationFrame);
  loop();
}

function endGame(winner) {
  running = false;
  overlayMessage.textContent = `${winner} wins!`;
  startButton.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

function movePlayer() {
  player.velocity = (keys.down ? paddle.speed : 0) - (keys.up ? paddle.speed : 0);
  player.y += player.velocity;
  player.y = Math.max(0, Math.min(H - paddle.height, player.y));
}

function moveComputer() {
  const target = ball.y - paddle.height / 2;
  const difficulty = 0.075;
  computer.y += (target - computer.y) * difficulty;
  computer.y = Math.max(0, Math.min(H - paddle.height, computer.y));
}

function intersects(p) {
  return ball.x - ball.radius < p.x + paddle.width &&
    ball.x + ball.radius > p.x &&
    ball.y - ball.radius < p.y + paddle.height &&
    ball.y + ball.radius > p.y;
}

function update() {
  movePlayer();
  moveComputer();
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= H) {
    ball.vy *= -1;
    ball.y = Math.max(ball.radius, Math.min(H - ball.radius, ball.y));
  }

  if (ball.vx < 0 && intersects(player)) {
    ball.x = player.x + paddle.width + ball.radius;
    ball.vx = Math.abs(ball.vx) * 1.04;
    ball.vy += (ball.y - (player.y + paddle.height / 2)) * 0.08;
  }
  if (ball.vx > 0 && intersects(computer)) {
    ball.x = computer.x - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 1.04;
    ball.vy += (ball.y - (computer.y + paddle.height / 2)) * 0.08;
  }

  if (ball.x < -ball.radius) {
    computer.score++;
    computerScoreEl.textContent = computer.score;
    if (computer.score >= 5) return endGame('Computer');
    resetBall(-1);
  } else if (ball.x > W + ball.radius) {
    player.score++;
    playerScoreEl.textContent = player.score;
    if (player.score >= 5) return endGame('You');
    resetBall(1);
  }
}

function draw() {
  ctx.fillStyle = '#10152b';
  ctx.fillRect(0, 0, W, H);
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

  ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function loop() {
  if (!running) return;
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

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { keys.up = true; event.preventDefault(); }
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { keys.down = true; event.preventDefault(); }
  if (event.key === ' ' && !running) startGame();
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keys.up = false;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keys.down = false;
});
canvas.addEventListener('mousemove', setPlayerFromPointer);
canvas.addEventListener('touchmove', (event) => { setPlayerFromPointer(event.touches[0]); event.preventDefault(); }, { passive: false });
startButton.addEventListener('click', startGame);

draw();
