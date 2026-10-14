let target;
let obstacles = [];
let vehicules = [];
let canvasHost;
let canvasObserver;

const simulationSettings = {
  maxSpeed: 4,
  maxForce: 0.2,
  seekerCount: 3,
  maxSeeingDistance: 200
};

function setup() {
  canvasHost = document.getElementById("canvas-wrap");
  const canvas = createCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
  canvas.parent(canvasHost);
  pixelDensity(1);
  canvasObserver = new ResizeObserver(resizeCanvasToHost);
  canvasObserver.observe(canvasHost);
  resizeCanvasToHost();

  target = new Target(width / 2, height / 2);
  target.r = 16;

  obstacles.push(new Obstacle(width * 0.52, height * 0.5, 75));
  syncSeekerCount();
  setupControls();
}

function draw() {
  background(10, 16, 29, 100);

  target.pos.set(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
  target.show();

  obstacles.forEach(obstacle => obstacle.show());

  vehicules.forEach(vehicle => {
    vehicle.applyBehaviors(target.pos, obstacles);
    vehicle.update();
    vehicle.show();
  });
}

function setupControls() {
  bindSlider("speed-control", "speed-value", value => {
    simulationSettings.maxSpeed = value;
    applySettingsToSeekers();
  }, value => value.toFixed(1));

  bindSlider("strength-control", "strength-value", value => {
    simulationSettings.maxForce = value;
    applySettingsToSeekers();
  }, value => value.toFixed(2));

  bindSlider("seeker-control", "seeker-value", value => {
    simulationSettings.seekerCount = value;
    syncSeekerCount();
  }, value => String(value));

  bindSlider("vision-control", "vision-value", value => {
    simulationSettings.maxSeeingDistance = value;
    applySettingsToSeekers();
  }, value => `${value} px`);
}

function bindSlider(inputId, outputId, onChange, formatValue) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  const update = () => {
    const value = Number(input.value);
    output.value = formatValue(value);
    output.textContent = formatValue(value);
    onChange(value);
  };

  input.addEventListener("input", update);
  update();
}

function applySettingsToSeekers() {
  vehicules.forEach(vehicle => {
    vehicle.maxSpeed = simulationSettings.maxSpeed;
    vehicle.maxForce = simulationSettings.maxForce;
    vehicle.maxSeeingDistance = simulationSettings.maxSeeingDistance;
  });
}

function syncSeekerCount() {
  while (vehicules.length < simulationSettings.seekerCount) {
    const seeker = new Seeker(random(width), random(height));
    vehicules.push(seeker);
  }

  if (vehicules.length > simulationSettings.seekerCount) {
    vehicules.splice(simulationSettings.seekerCount);
  }

  applySettingsToSeekers();
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    obstacles.push(new Obstacle(mouseX, mouseY, random(20, 55)));
  }
}

function keyPressed() {
  if (document.activeElement instanceof HTMLInputElement) return;

  if (key === "d" || key === "D") {
    Vehicle.debug = !Vehicle.debug;
  } else if (key === "v" || key === "V") {
    const seekerControl = document.getElementById("seeker-control");
    seekerControl.value = Math.min(Number(seekerControl.max), vehicules.length + 1);
    seekerControl.dispatchEvent(new Event("input"));
  }
}

function windowResized() {
  resizeCanvasToHost();
}

function resizeCanvasToHost() {
  if (!canvasHost.clientWidth || !canvasHost.clientHeight) return;

  if (width !== canvasHost.clientWidth || height !== canvasHost.clientHeight) {
    resizeCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
  }
}
