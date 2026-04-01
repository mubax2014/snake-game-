const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const scoresDiv = document.getElementById("scores");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const gameTitle = document.getElementById("gameTitle");
const bgMusic = document.getElementById("bgMusic");

const gridSize = 24;
const tileCount = canvas.width / gridSize;

let isMultiplayer = false;

// Single Player
let snake = [{ x: 10, y: 12 }];
let dx = 1, dy = 0;
let score = 0;

// Multiplayer
let snake1 = [{ x: 8, y: 12 }];
let dx1 = 1, dy1 = 0;
let score1 = 0;

let snake2 = [{ x: 16, y: 12 }];
let dx2 = -1, dy2 = 0;
let score2 = 0;

let food = { x: 0, y: 0, type: 0 };
let gameInterval;
let gameSpeed = 110;
let gameRunning = false;

let colorOffset = 0; // For rainbow snake effect

const fruits = [
  { color: "#ff0088", points: 10,  name: "Cherry" },
  { color: "#00ffcc", points: 15,  name: "Lime" },
  { color: "#ffff00", points: 20,  name: "Lemon" },
  { color: "#ff8800", points: 25,  name: "Orange" }
];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playEatSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 900;
  gain.gain.value = 0.25;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playGameOverSound() {
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  const gain = audioCtx.createGain();
  gain.gain.value = 0.4;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.8);
  osc.stop(audioCtx.currentTime + 0.8);
}

function randomFood() {
  do {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    food.type = Math.floor(Math.random() * fruits.length);
  } while (isMultiplayer ? 
    (snake1.some(s => s.x === food.x && s.y === food.y) || 
     snake2.some(s => s.x === food.x && s.y === food.y)) :
    snake.some(s => s.x === food.x && s.y === food.y)
  );
}

// Helper to get rainbow color
function getRainbowColor(index) {
  const hue = (colorOffset + index * 25) % 360;
  return `hsl(${hue}, 100%, 65%)`;
}

function drawGame() {
  ctx.fillStyle = "#0a0a1f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Light grid
  ctx.strokeStyle = "rgba(0, 255, 255, 0.07)";
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
  }

  colorOffset += 2; // Animate rainbow shift

  if (isMultiplayer) {
    // Multiplayer logic (same as before, but with rainbow for both snakes)
    const head1 = { x: snake1[0].x + dx1, y: snake1[0].y + dy1 };
    if (head1.x < 0 || head1.x >= tileCount || head1.y < 0 || head1.y >= tileCount ||
        snake1.some(s => s.x === head1.x && s.y === head1.y) ||
        snake2.some(s => s.x === head1.x && s.y === head1.y)) {
      endGame("Player 2 Wins!");
      return;
    }
    snake1.unshift(head1);
    if (head1.x === food.x && head1.y === food.y) {
      score1 += fruits[food.type].points;
      score1El.textContent = score1;
      playEatSound();
      randomFood();
    } else snake1.pop();

    const head2 = { x: snake2[0].x + dx2, y: snake2[0].y + dy2 };
    if (head2.x < 0 || head2.x >= tileCount || head2.y < 0 || head2.y >= tileCount ||
        snake2.some(s => s.x === head2.x && s.y === head2.y) ||
        snake1.some(s => s.x === head2.x && s.y === head2.y)) {
      endGame("Player 1 Wins!");
      return;
    }
    snake2.unshift(head2);
    if (head2.x === food.x && head2.y === food.y) {
      score2 += fruits[food.type].points;
      score2El.textContent = score2;
      playEatSound();
      randomFood();
    } else snake2.pop();

    // Draw rainbow Snake 1
    snake1.forEach((s, i) => {
      ctx.shadowBlur = 25;
      ctx.shadowColor = getRainbowColor(i);
      ctx.fillStyle = getRainbowColor(i);
      ctx.fillRect(s.x * gridSize + 2, s.y * gridSize + 2, gridSize - 4, gridSize - 4);
    });

    // Draw rainbow Snake 2 (slightly different hue offset)
    snake2.forEach((s, i) => {
      ctx.shadowBlur = 25;
      ctx.shadowColor = getRainbowColor(i + 180);
      ctx.fillStyle = getRainbowColor(i + 180);
      ctx.fillRect(s.x * gridSize + 2, s.y * gridSize + 2, gridSize - 4, gridSize - 4);
    });

  } else {
    // Single Player
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame("Game Over");
      return;
    }
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += fruits[food.type].points;
      score1El.textContent = score;
      playEatSound();
      randomFood();
    } else {
      snake.pop();
    }

    // Draw rainbow single snake
    snake.forEach((s, i) => {
      ctx.shadowBlur = 25;
      ctx.shadowColor = getRainbowColor(i);
      ctx.fillStyle = getRainbowColor(i);
      ctx.fillRect(s.x * gridSize + 2, s.y * gridSize + 2, gridSize - 4, gridSize - 4);
    });
  }

  // Draw food
  const fruit = fruits[food.type];
  ctx.shadowBlur = 35;
  ctx.shadowColor = fruit.color;
  ctx.fillStyle = fruit.color;
  ctx.beginPath();
  ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 4, 0, Math.PI * 2);
  ctx.fill();
}

function endGame(message) {
  gameRunning = false;
  bgMusic.pause();
  clearInterval(gameInterval);
  playGameOverSound();
  setTimeout(() => {
    alert(`💥 GAME OVER 💥\n\n${message}`);
    returnToMenu();
  }, 200);
}

function startSinglePlayer() {
  isMultiplayer = false;
  menu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  scoresDiv.classList.add("hidden");
  gameTitle.textContent = "NEON SNAKE - Single Player";

  snake = [{ x: 10, y: 12 }];
  dx = 1; dy = 0;
  score = 0;
  score1El.textContent = "0";

  colorOffset = 0;
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {}); // autoplay may be blocked, but it works after user interaction

  randomFood();
  gameRunning = true;
  clearInterval(gameInterval);
  gameInterval = setInterval(drawGame, gameSpeed);
}

function startMultiplayer() {
  isMultiplayer = true;
  menu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  scoresDiv.classList.remove("hidden");
  gameTitle.textContent = "NEON SNAKE - Multiplayer";

  snake1 = [{ x: 8, y: 12 }];
  dx1 = 1; dy1 = 0;
  score1 = 0;
  score1El.textContent = "0";

  snake2 = [{ x: 16, y: 12 }];
  dx2 = -1; dy2 = 0;
  score2 = 0;
  score2El.textContent = "0";

  colorOffset = 0;
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});

  randomFood();
  gameRunning = true;
  clearInterval(gameInterval);
  gameInterval = setInterval(drawGame, gameSpeed);
}

function returnToMenu() {
  clearInterval(gameInterval);
  gameRunning = false;
  bgMusic.pause();
  gameContainer.classList.add("hidden");
  menu.classList.remove("hidden");
}

// Keyboard Controls (unchanged)
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (isMultiplayer) {
    if (e.key === "ArrowUp" && dy1 !== 1)    { dx1 = 0; dy1 = -1; }
    if (e.key === "ArrowDown" && dy1 !== -1) { dx1 = 0; dy1 = 1; }
    if (e.key === "ArrowLeft" && dx1 !== 1)  { dx1 = -1; dy1 = 0; }
    if (e.key === "ArrowRight" && dx1 !== -1){ dx1 = 1; dy1 = 0; }

    if ((e.key === "w" || e.key === "W") && dy2 !== 1) { dx2 = 0; dy2 = -1; }
    if ((e.key === "s" || e.key === "S") && dy2 !== -1){ dx2 = 0; dy2 = 1; }
    if ((e.key === "a" || e.key === "A") && dx2 !== 1) { dx2 = -1; dy2 = 0; }
    if ((e.key === "d" || e.key === "D") && dx2 !== -1){ dx2 = 1; dy2 = 0; }
  } else {
    if (e.key === "ArrowUp" && dy !== 1)    { dx = 0; dy = -1; }
    if (e.key === "ArrowDown" && dy !== -1) { dx = 0; dy = 1; }
    if (e.key === "ArrowLeft" && dx !== 1)  { dx = -1; dy = 0; }
    if (e.key === "ArrowRight" && dx !== -1){ dx = 1; dy = 0; }
  }
});

window.onload = () => {
  randomFood();
};