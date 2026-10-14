let target;
let scenarios;
let debugMode = false;
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
let targetFleeBoostEnabled = false;
let targetsCaught = 0;
const INITIAL_TARGET_COUNT = 1;
const MAX_TARGET_COUNT = 20;
const INITIAL_TARGET_AVOIDANCE_RADIUS = 160;
let targetAvoidanceRadius = INITIAL_TARGET_AVOIDANCE_RADIUS;

function resizeRandomTargets(count) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_TARGET_COUNT) {
    throw new RangeError(`Le nombre de cibles doit être compris entre 1 et ${MAX_TARGET_COUNT}.`);
  }

  while (randomTargets.length > count) randomTargets.pop();
  while (randomTargets.length < count) {
    const position = randomTargets.length === 0 && target
      ? target.pos
      : { x: Math.random() * width, y: Math.random() * height };
    const randomTarget = new RandomTarget(position.x, position.y);
    randomTarget.avoidanceRadius = targetAvoidanceRadius;
    randomTarget.setFleeBoost(targetFleeBoostEnabled);
    randomTargets.push(randomTarget);
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

function catchTarget(caughtTarget, vehicle) {
  const targetIndex = randomTargets.indexOf(caughtTarget);
  if (targetIndex === -1) return;

  const children = caughtTarget.split(vehicle, width, height);
  targetsCaught++;
  if (children) {
    randomTargets.splice(targetIndex, 1, ...children);
  } else {
    randomTargets.splice(targetIndex, 1);
  }
  target = randomTargets[0] ?? target;
  document.getElementById('target-caught-count').textContent = String(targetsCaught);
}

function sceneDimensions() {
  const { width: sceneWidth, height: sceneHeight } =
    document.getElementById('scene').getBoundingClientRect();
  return {
    width: Math.max(1, sceneWidth),
    height: Math.max(1, sceneHeight),
  };
}

function setup() {
  const dimensions = sceneDimensions();
  sceneCanvas = createCanvas(dimensions.width, dimensions.height);
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
  const targetFleeBoostToggle = document.getElementById('target-flee-boost-toggle');
  const targetCaughtCount = document.getElementById('target-caught-count');
  const targetCountSlider = document.getElementById('target-count');
  const targetCountValue = document.getElementById('target-count-value');
  const targetRadiusSlider = document.getElementById('target-radius');
  const targetRadiusValue = document.getElementById('target-radius-value');
  targetCountSlider.value = INITIAL_TARGET_COUNT;
  resizeRandomTargets(INITIAL_TARGET_COUNT);
  targetCountValue.value = `${INITIAL_TARGET_COUNT} / ${MAX_TARGET_COUNT}`;
  targetCountSlider.addEventListener('input', () => {
    const count = Number(targetCountSlider.value);
    resizeRandomTargets(count);
    targetCountValue.value = `${randomTargets.length} / ${MAX_TARGET_COUNT}`;
  });
  targetRadiusSlider.value = INITIAL_TARGET_AVOIDANCE_RADIUS;
  targetRadiusValue.value = `${INITIAL_TARGET_AVOIDANCE_RADIUS} px`;
  targetRadiusSlider.addEventListener('input', () => {
    targetAvoidanceRadius = Number(targetRadiusSlider.value);
    targetRadiusValue.value = `${targetAvoidanceRadius} px`;
    for (const randomTarget of randomTargets) {
      randomTarget.avoidanceRadius = targetAvoidanceRadius;
    }
    if (autonomousTarget) {
      targetHint.textContent = `Les cibles rouges se déplacent aléatoirement et fuient les véhicules dans leur rayon de ${targetAvoidanceRadius} px.`;
    }
  });
  targetFleeBoostToggle.addEventListener('click', () => {
    targetFleeBoostEnabled = !targetFleeBoostEnabled;
    targetFleeBoostToggle.setAttribute('aria-pressed', String(targetFleeBoostEnabled));
    targetFleeBoostToggle.textContent = targetFleeBoostEnabled
      ? 'Désactiver la fuite améliorée'
      : 'Améliorer leur fuite';
    for (const randomTarget of randomTargets) randomTarget.setFleeBoost(targetFleeBoostEnabled);
  });
  targetCaughtCount.textContent = String(targetsCaught);

  targetModeToggle.addEventListener('click', () => {
    autonomousTarget = !autonomousTarget;
    if (autonomousTarget && randomTargets.length === 0) {
      resizeRandomTargets(Number(targetCountSlider.value));
    }
    target = autonomousTarget
      ? randomTargets[0]
      : new MouseTarget(target.pos.x, target.pos.y);
    targetModeToggle.setAttribute('aria-pressed', String(autonomousTarget));
    targetModeToggle.textContent = autonomousTarget
      ? 'Revenir à la cible souris'
      : 'Activer la cible fuyante';
    targetHint.textContent = autonomousTarget
      ? `Les cibles rouges se déplacent aléatoirement et fuient les véhicules dans leur rayon de ${targetAvoidanceRadius} px.`
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
    ambiencePointer.x = SeekAmbience.clamp((event.clientX - rect.left) / rect.width);
    ambiencePointer.y = SeekAmbience.clamp((event.clientY - rect.top) / rect.height);
  });
  window.addEventListener('pagehide', () => { void audioEngine.stop(); });
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
    for (const randomTarget of [...randomTargets]) randomTarget.step(vehicles, width, height);
    for (const vehicle of vehicles) {
      const caughtTarget = randomTargets.find(candidate => candidate.isCaughtBy(vehicle));
      if (caughtTarget) catchTarget(caughtTarget, vehicle);
    }
  }
  for (const vehicle of vehicles) {
    if (activeTargets.length > 0) {
      const vehicleTarget = closestTarget(vehicle, activeTargets);
      SeekPopulation.step(vehicle, vehicleTarget.pos, width, height);
    }
    vehicle.show();
  }
  for (const activeTarget of activeTargets) activeTarget.show();
}

function windowResized() {
  const dimensions = sceneDimensions();
  resizeCanvas(dimensions.width, dimensions.height);
  target.pos.set(constrain(target.pos.x, 0, width), constrain(target.pos.y, 0, height));
  for (const randomTarget of randomTargets) randomTarget.edges();
  for (const vehicle of vehicles) vehicle.edges();
}

function bindScenarioControls() {
  const modeSelect = document.getElementById('scenario');
  modeSelect.addEventListener('change', () => {
    scenarios.setMode(modeSelect.value);
    target = scenarios.target;
    document.getElementById('flee-controls').hidden = scenarios.mode !== 'flee';
    windowResized();
  });
  const fields = [
    ['detection-radius', 'detectionRadius'],
    ['exit-distance', 'exitDistance'],
    ['flee-duration', 'maxFleeDuration']
  ];
  for (const [id, setting] of fields) {
    const input = document.getElementById(id);
    const update = () => {
      scenarios.fleeingTargets.forEach(sceneTarget =>
        sceneTarget.setFleeSettings({ [setting]: Number(input.value) }));
      for (const [fieldId, parameter] of fields) {
        const value = scenarios.fleeingTarget[parameter];
        document.getElementById(fieldId).value = value;
        document.getElementById(fieldId + '-value').value = value + (parameter === 'maxFleeDuration' ? ' s' : ' px');
      }
    };
    input.addEventListener('input', update);
  }
  const checkbox = document.getElementById('debug');
  const setDebug = value => { debugMode = value; SeekVehicle.debug = value; checkbox.checked = value; };
  checkbox.addEventListener('change', () => setDebug(checkbox.checked));
  document.addEventListener('keydown', event => {
    const textField = event.target.matches?.('input[type="text"], input[type="number"], textarea');
    if (event.key.toLowerCase() === 'd' && !event.repeat && !textField) setDebug(!debugMode);
  });
}
