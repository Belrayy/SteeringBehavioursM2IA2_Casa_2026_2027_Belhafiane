const flock = [];
const obstacles = [];

let car;
let contacts = 0;
let isPaused = false;
let carPace = 6;
let chaseWeight = 2.8;
let lastNearestPerson;

const ui = {};

function setup() {
  const world = document.getElementById("world");
  const renderer = createCanvas(world.clientWidth, world.clientHeight);
  renderer.parent(world);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

  cacheControls();
  bindControls();
  resetSimulation();
}

function cacheControls() {
  [
    "people-count", "contact-count", "run-status", "population", "population-value",
    "pace", "pace-value", "separation", "separation-value", "cohesion",
    "cohesion-value", "debug-toggle", "pause-button", "add-person-button", "reset-button"
  ].forEach((id) => {
    ui[id] = document.getElementById(id);
  });

  document.querySelectorAll('input[type="range"]').forEach(setRangeProgress);
}

function bindControls() {
  ui.population.addEventListener("input", () => {
    setRangeProgress(ui.population);
    const count = Number(ui.population.value);
    document.getElementById("population-value").value = count;
    document.getElementById("population-value").textContent = count;
    resizePopulation(count);
  });

  ui.pace.addEventListener("input", () => {
    setRangeProgress(ui.pace);
    carPace = Number(ui.pace.value);
    document.getElementById("pace-value").value = carPace;
    document.getElementById("pace-value").textContent = carPace;
    car.maxSpeed = carPace;
  });

  ui.separation.addEventListener("input", () => {
    setRangeProgress(ui.separation);
    const value = Number(ui.separation.value);
    document.getElementById("separation-value").value = value.toFixed(1);
    document.getElementById("separation-value").textContent = value.toFixed(1);
    flock.forEach((person) => person.separationWeight = value);
  });

  ui.cohesion.addEventListener("input", () => {
    setRangeProgress(ui.cohesion);
    const value = Number(ui.cohesion.value);
    document.getElementById("cohesion-value").value = value.toFixed(1);
    document.getElementById("cohesion-value").textContent = value.toFixed(1);
    flock.forEach((person) => person.cohesionWeight = value);
  });

  ui["debug-toggle"].addEventListener("change", () => {
    Boid.debug = ui["debug-toggle"].checked;
  });
  ui["pause-button"].addEventListener("click", togglePause);
  ui["add-person-button"].addEventListener("click", () => addPerson(width / 2, height / 2));
  ui["reset-button"].addEventListener("click", resetSimulation);
}

function setRangeProgress(input) {
  const range = Number(input.max) - Number(input.min);
  const progress = range === 0 ? 0 : ((Number(input.value) - Number(input.min)) / range) * 100;
  input.style.setProperty("--range-progress", `${progress}%`);
}

function resetSimulation() {
  flock.length = 0;
  obstacles.length = 0;
  contacts = 0;
  isPaused = false;
  Boid.debug = ui["debug-toggle"].checked;
  car = new Boid(width / 2, height / 2);
  car.r = 24;
  car.maxSpeed = carPace;
  car.maxForce = 0.18;
  car.distanceCercle = 100;
  car.wanderRadius = 34;

  const count = Number(ui.population.value);
  for (let i = 0; i < count; i++) {
    flock.push(createPerson(random(width), random(height)));
  }
  updateMetrics();
  updatePauseButton();
}

function createPerson(x, y) {
  const person = new Boid(x, y);
  person.r = random(10, 14);
  person.maxSpeed = random(2.3, 3.6);
  person.maxForce = 0.16;
  person.separationWeight = Number(ui.separation.value);
  person.cohesionWeight = Number(ui.cohesion.value);
  person.alignWeight = 1.1;
  person.boundariesWeight = 8;
  person.boundariesDistance = 38;
  person.avoidWeight = 8;
  person.personColor = random(["#f7b267", "#7bd8c6", "#b9a4ff", "#f28b82", "#e9d98f"]);
  return person;
}

function resizePopulation(count) {
  while (flock.length > count) flock.pop();
  while (flock.length < count) {
    flock.push(createPerson(random(width), random(height)));
  }
  updateMetrics();
}

function addPerson(x, y) {
  if (flock.length >= Number(ui.population.max)) return;

  flock.push(createPerson(x, y));
  ui.population.value = flock.length;
  document.getElementById("population-value").value = flock.length;
  document.getElementById("population-value").textContent = ui.population.value;
  updateMetrics();
}

function updateMetrics() {
  ui["people-count"].textContent = flock.length;
  ui["contact-count"].textContent = String(contacts).padStart(2, "0");
  ui["run-status"].textContent = isPaused ? "PAUSED" : "LIVE";
  ui["add-person-button"].disabled = flock.length >= Number(ui.population.max);
}

function togglePause() {
  isPaused = !isPaused;
  updatePauseButton();
  updateMetrics();
}

function updatePauseButton() {
  ui["pause-button"].innerHTML = isPaused
    ? "<span>▶</span> Resume scene"
    : "<span>Ⅱ</span> Pause scene";
}

function draw() {
  drawCityBackdrop();

  if (!isPaused) {
    updatePeople();
    updateCar();
    resolveContacts();
  }

  obstacles.forEach((obstacle) => obstacle.show());
  flock.forEach(drawPerson);
  drawCar();

  if (Boid.debug) drawDebugOverlay();
}

function drawCityBackdrop() {
  background("#121a18");
  noStroke();

  for (let x = 16; x < width; x += 44) {
    for (let y = 18; y < height; y += 44) {
      fill(178, 205, 177, 11);
      circle(x, y, 1.5);
    }
  }

  const roadY = height * 0.73;
  fill("#1a2321");
  rect(0, roadY - 72, width, 144);
  fill("#27312e");
  rect(0, roadY - 76, width, 5);
  rect(0, roadY + 71, width, 5);

  stroke(225, 213, 175, 36);
  strokeWeight(2);
  drawingContext.setLineDash([18, 17]);
  line(0, roadY, width, roadY);
  drawingContext.setLineDash([]);
  noStroke();

  const crossingX = width * 0.7;
  fill(230, 227, 204, 25);
  for (let y = roadY - 57; y < roadY + 56; y += 18) {
    rect(crossingX, y, 32, 9, 2);
  }

  fill(255, 255, 255, 28);
  textSize(10);
  textStyle(BOLD);
  text("W  18TH STREET", 25, height - 24);
  textStyle(NORMAL);
}

function updatePeople() {
  for (const person of flock) {
    person.flock(flock, obstacles);

    if (p5.Vector.dist(person.pos, car.pos) < 170) {
      const escapeForce = person.flee(car.pos);
      escapeForce.mult(2.2);
      person.applyForce(escapeForce);
    }

    person.update();
    person.edges();
  }
}

function updateCar() {
  const wanderForce = car.wander();
  wanderForce.mult(0.24);
  car.applyForce(wanderForce);

  lastNearestPerson = car.getVehiculeLePlusProche(flock);
  if (lastNearestPerson) {
    const chaseForce = car.seek(lastNearestPerson.pos);
    chaseForce.mult(chaseWeight);
    car.applyForce(chaseForce);
  }

  car.applyForce(car.avoid(obstacles));
  car.update();
  car.edges();
}

function resolveContacts() {
  for (let i = flock.length - 1; i >= 0; i--) {
    const person = flock[i];
    const distance = p5.Vector.dist(car.pos, person.pos);
    if (!circlesOverlap(distance, car.r * 0.72, person.r * 0.72)) continue;

    contacts++;
    flock.splice(i, 1);
    const respawn = spawnPointAtEdge();
    flock.push(createPerson(respawn.x, respawn.y));
    updateMetrics();
  }
}

function spawnPointAtEdge() {
  const edge = floor(random(4));
  if (edge === 0) return createVector(random(width), 0);
  if (edge === 1) return createVector(width, random(height));
  if (edge === 2) return createVector(random(width), height);
  return createVector(0, random(height));
}

function drawPerson(person) {
  const heading = person.vel.heading() + HALF_PI;
  push();
  translate(person.pos.x, person.pos.y);
  rotate(heading);
  noStroke();

  fill(0, 0, 0, 65);
  ellipse(1, 7, person.r * 1.45, person.r * 0.65);

  stroke("#d8d4c5");
  strokeWeight(2.3);
  line(-2, 3, -4, 7);
  line(2, 3, 4, 7);
  stroke(person.personColor);
  strokeWeight(2.5);
  line(-3, -1, -5, 2);
  line(3, -1, 5, 2);

  noStroke();
  fill(person.personColor);
  ellipse(0, 0, person.r * 0.92, person.r * 1.1);
  fill("#f1c8a5");
  circle(0, -person.r * 0.78, person.r * 0.64);
  fill("#282c29");
  arc(0, -person.r * 0.87, person.r * 0.7, person.r * 0.44, PI, TWO_PI);
  pop();
}

function drawCar() {
  if (!car) return;
  push();
  translate(car.pos.x, car.pos.y);
  rotate(car.vel.heading());
  noStroke();

  fill(0, 0, 0, 70);
  ellipse(-1, 5, 58, 34);
  fill("#111514");
  rect(-17, -17, 11, 7, 2);
  rect(10, -17, 11, 7, 2);
  rect(-17, 10, 11, 7, 2);
  rect(10, 10, 11, 7, 2);

  fill("#e76f51");
  rect(-25, -13, 50, 26, 9);
  fill("#f49a71");
  rect(-11, -10, 23, 20, 6);
  fill("#253b39");
  quad(-9, -9, 3, -9, 9, -5, 9, 5);
  quad(-9, 9, 3, 9, 9, 5, 9, -5);
  fill("#fff0bd");
  rect(20, -9, 4, 5, 2);
  rect(20, 4, 4, 5, 2);
  fill("#9b4039");
  rect(-24, -9, 3, 5, 1);
  rect(-24, 4, 3, 5, 1);
  pop();
}

function drawDebugOverlay() {
  if (lastNearestPerson) {
    noFill();
    stroke("#f7b267");
    strokeWeight(1);
    circle(car.pos.x, car.pos.y, 170);
    line(car.pos.x, car.pos.y, lastNearestPerson.pos.x, lastNearestPerson.pos.y);
    noStroke();
    fill("#f7b267");
    circle(lastNearestPerson.pos.x, lastNearestPerson.pos.y, 5);
  }
  fill(216, 227, 210, 190);
  noStroke();
  textSize(11);
  text(`car speed  ${car.vel.mag().toFixed(1)}   ·   people  ${flock.length}   ·   contacts  ${contacts}`, 20, 28);
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    obstacles.push(new Obstacle(mouseX, mouseY, random(16, 25), "#d99b62"));
  }
}

function mouseDragged() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && frameCount % 5 === 0) {
    addPerson(mouseX, mouseY);
  }
}

function keyPressed() {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "BUTTON") return;

  if (key.toLowerCase() === "d") {
    Boid.debug = !Boid.debug;
    ui["debug-toggle"].checked = Boid.debug;
  } else if (key.toLowerCase() === "r") {
    resetSimulation();
  } else if (key === " ") {
    togglePause();
    return false;
  }
}

function windowResized() {
  const world = document.getElementById("world");
  resizeCanvas(world.clientWidth, world.clientHeight);
  if (car) {
    car.boundariesWidth = width;
    car.boundariesHeight = height;
  }
  flock.forEach((person) => {
    person.boundariesWidth = width;
    person.boundariesHeight = height;
  });
}
