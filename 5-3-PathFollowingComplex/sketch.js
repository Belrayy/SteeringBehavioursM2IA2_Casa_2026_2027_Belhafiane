// Path Following (Complex Path)
// The Nature of Code
// The Coding Train / Daniel Shiffman
// https://youtu.be/LrnR6dc2IfM
// https://thecodingtrain.com/learning/nature-of-code/5.7-path-following.html

// Path Following: https://editor.p5js.org/codingtrain/sketches/dqM054vBV
// Complex Path: https://editor.p5js.org/codingtrain/sketches/2FFzvxwVt

// Crowd Path Following
// Via Reynolds: http://www.red3d.com/cwr/steer/CrowdPath.html

// Pour debug on/off affichage des lignes etc.
let debug = false;

// le chemin
let path;
let selectedCircuit;

// Tableau des véhicules
let vehicles = [];
let snakes = [];
let snakeFollowWeight = 2;
let snakeSeparationWeight = 1.2;
let circuitWidth = 20;
let snakeSpacing = 20;
let snakeSize = 22;

function setup() {
  const canvasContainer = document.getElementById("canvas-container");
  const canvas = createCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
  canvas.parent(canvasContainer);

  selectedCircuit = document.getElementById("circuit-select");
  selectedCircuit.addEventListener("change", () => newPath(selectedCircuit.value));

  newPath(selectedCircuit.value);
  newVehicle(random(width), random(height));
}

function windowResized() {
  const canvasContainer = document.getElementById("canvas-container");
  resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
  newPath(selectedCircuit.value);
}

function draw() {
  background(237, 242, 247);
  // Affichage du chemin
  path.display();

  const allSegments = snakes.flatMap(snake => snake.anneaux);
  const neighbors = [...vehicles, ...allSegments];
  for (let v of vehicles) {
    // On applique les comportements pour suivre le chemin
    // Comme on utilise ici plusieurs comportements, notamment un comportement qui 
    // dépend des autres véhicules, on passe en paramètre le tableau des véhicules 
    // et le chemin
    v.applyBehaviors(neighbors, path);
    // on a regroupé update, draw etc. dans une méthode run (update, borders, display, etc.)
    v.run();
  }

  updateVehicleCounts();
}

function newPath(circuit = "oval") {
  path = new Path();

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = max(20, width * 0.38);
  const radiusY = max(20, height * 0.38);
  const circuitShapes = {
    oval: (angle) => ({
      x: centerX + radiusX * cos(angle),
      y: centerY + radiusY * sin(angle)
    }),
    "figure-eight": (angle) => ({
      x: centerX + radiusX * 0.9 * sin(angle),
      y: centerY + radiusY * 0.9 * sin(2 * angle)
    }),
    clover: (angle) => ({
      x: centerX + radiusX * (0.72 * cos(angle) + 0.25 * cos(3 * angle)),
      y: centerY + radiusY * (0.72 * sin(angle) - 0.25 * sin(3 * angle))
    }),
    rounded: (angle) => ({
      x: centerX + radiusX * Math.sign(cos(angle)) * Math.pow(abs(cos(angle)), 0.45),
      y: centerY + radiusY * Math.sign(sin(angle)) * Math.pow(abs(sin(angle)), 0.45)
    }),
    winding: (angle) => {
      const radius = 0.82 + 0.13 * cos(3 * angle) + 0.05 * sin(5 * angle);
      return {
        x: centerX + radiusX * radius * cos(angle),
        y: centerY + radiusY * radius * sin(angle)
      };
    }
  };
  const createPoint = circuitShapes[circuit] || circuitShapes.oval;
  const segmentCount = 48;

  for (let i = 0; i < segmentCount; i++) {
    const point = createPoint((TWO_PI * i) / segmentCount);
    path.addPoint(point.x, point.y);
  }
}

function newVehicle(x, y) {
  let maxspeed = random(1, 3);
  let maxforce = 0.3;
  let v = new PathFollowingVehicle(x, y, maxspeed, maxforce);
  vehicles.push(v);
  updateVehicleCounts();
  return v;
}

function newFastVehicle(x, y) {
  const v = new FastVehicle(x, y, 0.3);
  vehicles.push(v);
  updateVehicleCounts();
  return v;
}

function newWanderVehicle(x, y) {
  const v = new WanderVehicle(x, y, 2, 0.25);
  vehicles.push(v);
  updateVehicleCounts();
  return v;
}

function updateVehicleCounts() {
  const counts = {
    path: 0,
    fast: 0,
    wander: 0
  };
  for (const vehicle of vehicles) {
    counts[vehicle.vehicleType] = (counts[vehicle.vehicleType] || 0) + 1;
  }
  document.getElementById("path-count").textContent = counts.path;
  document.getElementById("fast-count").textContent = counts.fast;
  document.getElementById("wander-count").textContent = counts.wander;
}

function keyPressed() {
  if (document.activeElement && ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    return;
  }

  const pressedKey = key.toLowerCase();
  if (pressedKey === "d") {
    debug = !debug;
    Vehicle.debug = debug;
  } else if (pressedKey === "s") {
    newFastVehicle(mouseX, mouseY);
  } else if (pressedKey === "g" || pressedKey === "w") {
    newWanderVehicle(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    newVehicle(mouseX, mouseY);
  }
}
