let target;
let snake;
let foods = [];
let obstacles = [];
let gameState = "menu";
let score = 0;
let highScore = 0;
let elapsedSeconds = 0;
let foodSpawnElapsed = 0;
let foodSpawnInterval = 1100;
let badFoodEnabled = true;
let foodOscillator;

const GOOD_FOOD_COUNT = 5;
const HIGH_SCORE_KEY = "mouseSnakeHighScore";

function setup() {
  createCanvas(windowWidth, windowHeight);
  target = createVector(width / 2, height / 2);
  highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("restart-button").addEventListener("click", startGame);
  document.getElementById("menu-button").addEventListener("click", showMainMenu);
}

function draw() {
  background("#71b84b");

  if (gameState !== "playing") {
    return;
  }

  elapsedSeconds += deltaTime / 1000;
  target.set(mouseX, mouseY);
  snake.updateFollowingMouse(target);

  for (const food of foods) {
    food.show();
  }
  for (const obstacle of obstacles) {
    obstacle.show();
  }
  snake.show();
  drawMouseTarget();

  updateFoodSpawning();
  updateDifficulty();

  if (hasCollision()) {
    finishGame();
    return;
  }

  collectFood();
  updateScoreboard();
}

function startGame() {
  userStartAudio();
  const startingSize = Number(document.getElementById("starting-size").value);
  foodSpawnInterval = Number(document.getElementById("food-rate").value);
  badFoodEnabled = document.getElementById("bad-food-enabled").checked;

  snake = new Snake(width / 2, height / 2, startingSize);
  foods = [];
  obstacles = [];
  score = 0;
  elapsedSeconds = 0;
  foodSpawnElapsed = 0;
  foodOscillator = undefined;
  createInitialFood();

  document.getElementById("start-menu").hidden = true;
  document.getElementById("game-over").hidden = true;
  document.getElementById("scoreboard").hidden = false;
  gameState = "playing";
  updateScoreboard();
}

function showMainMenu() {
  gameState = "menu";
  document.getElementById("scoreboard").hidden = true;
  document.getElementById("game-over").hidden = true;
  document.getElementById("start-menu").hidden = false;
}

function createInitialFood() {
  for (let index = 0; index < GOOD_FOOD_COUNT; index += 1) {
    addFood(randomGoodFoodType());
  }
  for (let index = 0; index < GameRules.targetBadFoodCount(score, badFoodEnabled); index += 1) {
    addFood("bad");
  }
}

function updateFoodSpawning() {
  foodSpawnElapsed += deltaTime;
  if (foodSpawnElapsed < foodSpawnInterval) {
    return;
  }
  foodSpawnElapsed = 0;

  const badCount = foods.filter(food => food.bad).length;
  const goodCount = foods.length - badCount;
  if (badCount < GameRules.targetBadFoodCount(score, badFoodEnabled)) {
    addFood("bad");
  } else if (goodCount < GOOD_FOOD_COUNT) {
    addFood(randomGoodFoodType());
  }
}

function updateDifficulty() {
  const desiredObstacleCount = GameRules.targetObstacleCount(score);
  while (obstacles.length < desiredObstacleCount) {
    const position = findSafePosition(22);
    if (!position) {
      break;
    }
    obstacles.push(new Obstacle(position[0], position[1], random(14, 22)));
  }

  const desiredBadFoodCount = GameRules.targetBadFoodCount(score, badFoodEnabled);
  let badCount = foods.filter(food => food.bad).length;
  while (badCount < desiredBadFoodCount) {
    addFood("bad");
    badCount += 1;
  }
}

function addFood(type) {
  const position = findSafePosition(18);
  if (!position) {
    return;
  }
  const [x, y] = position;
  foods.push(new Food(x, y, type));
}

function randomGoodFoodType() {
  return random() < 0.25 ? "golden" : "berry";
}

function findSafePosition(margin) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const x = random(margin, Math.max(margin + 1, width - margin));
    const y = random(margin, Math.max(margin + 1, height - margin));
    const position = createVector(x, y);
    const tooCloseToSnake = snake && [snake, ...snake.segments].some(
      part => p5.Vector.dist(position, part.pos) < margin + part.r
    );
    const tooCloseToFood = foods.some(food => p5.Vector.dist(position, food.pos) < margin + food.r);
    const tooCloseToObstacle = obstacles.some(
      obstacle => p5.Vector.dist(position, obstacle.pos) < margin + obstacle.r
    );

    if (!tooCloseToSnake && !tooCloseToFood && !tooCloseToObstacle) {
      return [x, y];
    }
  }

  return null;
}

function hasCollision() {
  if (obstacles.some(obstacle => p5.Vector.dist(snake.pos, obstacle.pos) < snake.r + obstacle.r)) {
    return true;
  }

  return snake.segments.slice(3).some(
    segment => p5.Vector.dist(snake.pos, segment.pos) < snake.r * 1.4
  );
}

function collectFood() {
  const foodIndex = foods.findIndex(
    food => p5.Vector.dist(snake.pos, food.pos) < snake.r + food.r
  );
  if (foodIndex === -1) {
    return;
  }

  const [food] = foods.splice(foodIndex, 1);
  const currentSize = snake.segments.length + 1;
  const updated = GameRules.applyFoodEffect(score, currentSize, food.type);
  score = updated.score;

  if (updated.size > currentSize) {
    snake.grow(updated.size - currentSize);
  } else if (updated.size < currentSize) {
    snake.shrink(currentSize - updated.size);
  }

  playFoodSound(food.soundFrequency);
}

function playFoodSound(frequency) {
  if (!foodOscillator) {
    foodOscillator = new p5.Oscillator("sine");
    foodOscillator.start();
    foodOscillator.amp(0);
  }

  foodOscillator.freq(frequency);
  foodOscillator.amp(0.16, 0.01);
  foodOscillator.amp(0, 0.12, 0.03);
}

function drawMouseTarget() {
  noStroke();
  fill("#e64b3c");
  circle(target.x, target.y, 12);
}

function updateScoreboard() {
  document.getElementById("score-value").textContent = String(score);
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(elapsedSeconds % 60).toString().padStart(2, "0");
  document.getElementById("timer-value").textContent = `${minutes}:${seconds}`;
}

function finishGame() {
  gameState = "gameover";
  highScore = Math.max(highScore, score);
  localStorage.setItem(HIGH_SCORE_KEY, String(highScore));

  document.getElementById("scoreboard").hidden = true;
  document.getElementById("final-score").textContent = String(score);
  document.getElementById("high-score").textContent = String(highScore);
  document.getElementById("game-over").hidden = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === "d") {
    Vehicle.debug = !Vehicle.debug;
  }
}
