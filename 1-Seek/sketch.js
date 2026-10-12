let target;
const vehicles = [];
const randomTargets = [];
let sceneCanvas;
let backgroundToggle;
let backgroundEnabled = true;
let maxVehicleSpeed = 4;
let maxVehicleForce = 0.1;
let musicToggle;
let musicStatus;
let musicEnabled = false;
let autonomousTarget = false;
const INITIAL_TARGET_COUNT = 1;
const MAX_TARGET_COUNT = 20;

function resizeRandomTargets(count) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_TARGET_COUNT) {
    throw new RangeError(`Le nombre de cibles doit être compris entre 1 et ${MAX_TARGET_COUNT}.`);
  }

  while (randomTargets.length > count) randomTargets.pop();
  while (randomTargets.length < count) {
    const position = randomTargets.length === 0 && target
      ? target.pos
      : { x: Math.random() * width, y: Math.random() * height };
    randomTargets.push(new RandomTarget(position.x, position.y));
  }

  if (autonomousTarget) target = randomTargets[0];
}

function closestTarget(vehicle, targets) {
  let closest = targets[0];
  let closestDistance = Infinity;
  for (const candidate of targets) {
    const distance = p5.Vector.sub(candidate.pos, vehicle.pos).mag();
    if (distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  }
  return closest;
}

function sceneHeight() {
  return Math.max(1, windowHeight - document.getElementById('controls').offsetHeight);
}

function setup() {
  sceneCanvas = createCanvas(windowWidth, sceneHeight());
  sceneCanvas.parent('scene');
  target = new MouseTarget(width / 2, height / 2);

  backgroundToggle = document.getElementById('background-toggle');
  backgroundToggle.addEventListener('click', () => {
    backgroundEnabled = !backgroundEnabled;
    backgroundToggle.setAttribute('aria-pressed', String(backgroundEnabled));
    backgroundToggle.textContent = backgroundEnabled
      ? 'Désactiver le fond LSD'
      : 'Activer le fond LSD';
  });

  musicToggle = document.getElementById('music-toggle');
  musicStatus = document.getElementById('music-status');
  musicToggle.addEventListener('click', async () => {
    musicToggle.disabled = true;
    if (musicEnabled) {
      SeekMusic.stop();
      musicEnabled = false;
      musicToggle.setAttribute('aria-pressed', 'false');
      musicToggle.textContent = 'Activer la musique';
      musicStatus.textContent = 'Musique désactivée';
      musicToggle.disabled = false;
      return;
    }

    try {
      await SeekMusic.start();
      musicEnabled = true;
      musicToggle.setAttribute('aria-pressed', 'true');
      musicToggle.textContent = 'Désactiver la musique';
      musicStatus.textContent = 'Musique activée';
    } catch (error) {
      musicStatus.textContent = `Impossible de démarrer la musique : ${error.message}`;
    } finally {
      musicToggle.disabled = false;
    }
  });

  const targetModeToggle = document.getElementById('target-mode-toggle');
  const targetHint = document.getElementById('target-hint');
  const targetCountSlider = document.getElementById('target-count');
  const targetCountValue = document.getElementById('target-count-value');
  targetCountSlider.value = INITIAL_TARGET_COUNT;
  resizeRandomTargets(INITIAL_TARGET_COUNT);
  targetCountValue.value = `${INITIAL_TARGET_COUNT} / ${MAX_TARGET_COUNT}`;
  targetCountSlider.addEventListener('input', () => {
    const count = Number(targetCountSlider.value);
    resizeRandomTargets(count);
    targetCountValue.value = `${randomTargets.length} / ${MAX_TARGET_COUNT}`;
  });

  targetModeToggle.addEventListener('click', () => {
    autonomousTarget = !autonomousTarget;
    target = autonomousTarget
      ? randomTargets[0]
      : new MouseTarget(target.pos.x, target.pos.y);
    targetModeToggle.setAttribute('aria-pressed', String(autonomousTarget));
    targetModeToggle.textContent = autonomousTarget
      ? 'Revenir à la cible souris'
      : 'Activer la cible fuyante';
    targetHint.textContent = autonomousTarget
      ? 'Les cibles rouges se déplacent aléatoirement et fuient les véhicules dans leur rayon de 160 px.'
      : 'Déplacez la souris dans la scène pour guider la cible rouge.';
  });

  const slider = document.getElementById('vehicle-count');
  slider.value = SeekPopulation.INITIAL_COUNT;
  SeekPopulation.bindSlider(slider, document.getElementById('vehicle-count-value'),
    vehicles, target.pos, () => ({ width, height }), (x, y) => {
      const vehicle = new Vehicle(x, y);
      vehicle.maxSpeed = maxVehicleSpeed;
      vehicle.maxForce = maxVehicleForce;
      return vehicle;
    });

  const speedSlider = document.getElementById('vehicle-speed');
  const speedValue = document.getElementById('vehicle-speed-value');
  speedSlider.addEventListener('input', () => {
    maxVehicleSpeed = Number(speedSlider.value);
    speedValue.value = `${maxVehicleSpeed.toFixed(1)} px/frame`;
    for (const vehicle of vehicles) vehicle.maxSpeed = maxVehicleSpeed;
  });

  const forceSlider = document.getElementById('vehicle-force');
  const forceValue = document.getElementById('vehicle-force-value');
  forceSlider.addEventListener('input', () => {
    maxVehicleForce = Number(forceSlider.value);
    forceValue.value = maxVehicleForce.toFixed(2);
    for (const vehicle of vehicles) vehicle.maxForce = maxVehicleForce;
  });

  // Les coordonnées sont relatives au canvas, pas à la barre de contrôle.
  // Un événement sur le slider ne modifie donc jamais la cible.
  sceneCanvas.elt.addEventListener('pointermove', event => {
    if (autonomousTarget) return;
    const rect = sceneCanvas.elt.getBoundingClientRect();
    const x = (event.clientX - rect.left) * width / rect.width;
    const y = (event.clientY - rect.top) * height / rect.height;
    if (x >= 0 && x <= width && y >= 0 && y <= height) target.pos.set(x, y);
  });
}

function drawBackground() {
  if (!backgroundEnabled) {
    background('black');
    return;
  }

  const centerX = width / 2 + Math.sin(frameCount * 0.012) * width * 0.12;
  const centerY = height / 2 + Math.cos(frameCount * 0.01) * height * 0.12;
  const radius = Math.hypot(width, height) * 0.8;
  const gradient = drawingContext.createRadialGradient(
    centerX, centerY, 0, centerX, centerY, radius,
  );

  for (const [index, stop] of [0, 0.18, 0.38, 0.6, 0.82, 1].entries()) {
    const hue = (frameCount * 0.7 + index * 72) % 360;
    gradient.addColorStop(stop, `hsl(${hue}, 100%, ${index === 0 ? 48 : 16}%)`);
  }

  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
}

function draw() {
  drawBackground();
  const activeTargets = autonomousTarget ? randomTargets : [target];
  if (autonomousTarget) {
    for (const randomTarget of randomTargets) randomTarget.step(vehicles, width, height);
  }
  for (const vehicle of vehicles) {
    const vehicleTarget = closestTarget(vehicle, activeTargets);
    SeekPopulation.step(vehicle, vehicleTarget.pos, width, height);
    vehicle.show();
  }
  for (const activeTarget of activeTargets) activeTarget.show();
}

function windowResized() {
  resizeCanvas(windowWidth, sceneHeight());
  target.pos.set(constrain(target.pos.x, 0, width), constrain(target.pos.y, 0, height));
  for (const randomTarget of randomTargets) randomTarget.edges();
  for (const vehicle of vehicles) vehicle.edges();
}
