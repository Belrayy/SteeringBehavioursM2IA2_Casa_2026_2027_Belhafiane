const TOTAL = 100;
const MUTATION_RATE = 0.1;
const LIFESPAN = 25;
const SIGHT = 50;
const DEFAULT_SETTINGS = {
  carSpeed: 5,
  trackSize: 65,
  complexity: 3,
  neuronCount: 12,
  rayCount: 7
};

let currentSettings = { ...DEFAULT_SETTINGS };
let generationCount = 0;
let walls = [];
let population = [];
let savedVehicles = [];
let start, end;
let inside = [];
let outside = [];
let checkpoints = [];

function buildTrack() {
  checkpoints = [];
  inside = [];
  outside = [];

  const total = Math.round(map(currentSettings.complexity, 1, 5, 36, 88));
  const pathWidth = map(currentSettings.trackSize, 35, 100, 24, 44);
  const radius = Math.min(width, height) *
    map(currentSettings.trackSize, 35, 100, 0.25, 0.36);
  const irregularity = map(currentSettings.complexity, 1, 5, 0.04, 0.27);
  const noiseFrequency = map(currentSettings.complexity, 1, 5, 0.8, 3.5);
  const noiseX = random(1000);
  const noiseY = random(1000);

  for (let i = 0; i < total; i++) {
    const angle = map(i, 0, total, 0, TWO_PI);
    const noiseValue = noise(
      cos(angle) * noiseFrequency + noiseX,
      sin(angle) * noiseFrequency + noiseY
    );
    const radiusAtAngle = radius * map(noiseValue, 0, 1, 1 - irregularity, 1 + irregularity);
    const halfWidth = pathWidth / 2;
    const innerX = width / 2 + (radiusAtAngle - halfWidth) * cos(angle);
    const innerY = height / 2 + (radiusAtAngle - halfWidth) * sin(angle);
    const outerX = width / 2 + (radiusAtAngle + halfWidth) * cos(angle);
    const outerY = height / 2 + (radiusAtAngle + halfWidth) * sin(angle);

    checkpoints.push(new Boundary(innerX, innerY, outerX, outerY));
    inside.push(createVector(innerX, innerY));
    outside.push(createVector(outerX, outerY));
  }

  walls = [];
  for (let i = 0; i < checkpoints.length; i++) {
    const next = (i + 1) % checkpoints.length;
    walls.push(new Boundary(inside[i].x, inside[i].y, inside[next].x, inside[next].y));
    walls.push(new Boundary(outside[i].x, outside[i].y, outside[next].x, outside[next].y));
  }

  start = checkpoints[0].midpoint();
  end = checkpoints[checkpoints.length - 1].midpoint();
}

function setup() {
  const canvas = createCanvas(1200, 800);
  canvas.parent('simulation');
  tf.setBackend('cpu');
  bindControls();
  buildTrack();
  createPopulation();
  updateStats();
}

function bindControls() {
  const ranges = [
    ['car-speed', 'car-speed-value', value => value],
    ['track-size', 'track-size-value', value => `${value}%`],
    ['track-complexity', 'track-complexity-value', value => `${value} / 5`],
    ['neuron-count', 'neuron-count-value', value => value],
    ['ray-count', 'ray-count-value', value => value]
  ];

  for (const [inputId, outputId, format] of ranges) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    input.addEventListener('input', () => {
      output.textContent = format(input.value);
    });
    input.addEventListener('change', applyControlSettings);
  }

  document.getElementById('restart-button').addEventListener('click', restartModel);
  document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('car-speed').value = DEFAULT_SETTINGS.carSpeed;
    document.getElementById('track-size').value = DEFAULT_SETTINGS.trackSize;
    document.getElementById('track-complexity').value = DEFAULT_SETTINGS.complexity;
    document.getElementById('neuron-count').value = DEFAULT_SETTINGS.neuronCount;
    document.getElementById('ray-count').value = DEFAULT_SETTINGS.rayCount;
    for (const [inputId, outputId, format] of ranges) {
      document.getElementById(outputId).textContent =
        format(document.getElementById(inputId).value);
    }
    applyControlSettings();
  });
}

function applyControlSettings() {
  currentSettings = {
    carSpeed: Number(document.getElementById('car-speed').value),
    trackSize: Number(document.getElementById('track-size').value),
    complexity: Number(document.getElementById('track-complexity').value),
    neuronCount: Number(document.getElementById('neuron-count').value),
    rayCount: Number(document.getElementById('ray-count').value)
  };
  restartModel();
}

function restartModel() {
  const existingVehicles = new Set([...population, ...savedVehicles]);
  for (const vehicle of existingVehicles) {
    vehicle.dispose();
  }

  population = [];
  savedVehicles = [];
  generationCount = 0;
  buildTrack();
  createPopulation();
  updateStats();
}

function createPopulation() {
  for (let i = 0; i < TOTAL; i++) {
    population.push(new ConfigurableVehicle());
  }
}

function draw() {
  background('#0a121b');

  const cycles = 1;
  let bestVehicle = population[0];
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const vehicle of population) {
      vehicle.applyBehaviors(walls);
      vehicle.check(checkpoints);
      vehicle.update();
      if (vehicle.fitness > bestVehicle.fitness) {
        bestVehicle = vehicle;
      }
    }

    for (let i = population.length - 1; i >= 0; i--) {
      const vehicle = population[i];
      if (vehicle.dead || vehicle.finished) {
        savedVehicles.push(population.splice(i, 1)[0]);
      }
    }

    if (population.length === 0) {
      buildTrack();
      nextGeneration();
      generationCount++;
      bestVehicle = population[0];
    }
  }

  for (const wall of walls) {
    wall.show();
  }

  for (const checkpoint of checkpoints) {
    push();
    stroke('#3a74ff');
    strokeWeight(1);
    line(checkpoint.a.x, checkpoint.a.y, checkpoint.b.x, checkpoint.b.y);
    pop();
  }

  for (const vehicle of population) {
    vehicle.show();
  }

  if (bestVehicle) {
    bestVehicle.highlight();
  }
  updateStats();
}

function updateStats() {
  document.getElementById('generation-value').textContent = generationCount;
  document.getElementById('active-value').textContent = population.length;
  document.getElementById('sensor-value').textContent = `${currentSettings.rayCount} rays`;
}
