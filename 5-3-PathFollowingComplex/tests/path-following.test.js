const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const exampleDirectory = path.resolve(__dirname, "..");

function loadSketch() {
  class TestPath {
    constructor() {
      this.points = [];
    }

    addPoint(x, y) {
      this.points.push({ x, y });
    }
  }

  class TestVehicle {
    constructor(x, y, maxSpeed, maxForce) {
      Object.assign(this, { x, y, maxSpeed, maxForce });
      this.pos = { x, y };
      this.vel = { heading: () => 0.75 };
      this.couleur = "black";
      this.appliedForces = [];
    }

    wander() {
      return {
        weight: 1,
        mult(amount) {
          this.weight *= amount;
        }
      };
    }

    applyForce(force) {
      this.appliedForces.push(force);
    }
  }

  const elements = new Map();
  const drawCalls = [];
  const document = {
    activeElement: null,
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, { textContent: "", addEventListener() {} });
      }
      return elements.get(id);
    }
  };
  const context = vm.createContext({
    Path: TestPath,
    Vehicle: TestVehicle,
    document,
    width: 800,
    height: 600,
    TWO_PI: Math.PI * 2,
    max: Math.max,
    cos: Math.cos,
    sin: Math.sin,
    abs: Math.abs,
    Math,
    random: () => 0.5,
    mouseX: 100,
    mouseY: 100,
    key: "g",
    CENTER: "center",
    push: () => drawCalls.push(["push"]),
    pop: () => drawCalls.push(["pop"]),
    translate: (...args) => drawCalls.push(["translate", ...args]),
    rotate: (...args) => drawCalls.push(["rotate", ...args]),
    rectMode: (...args) => drawCalls.push(["rectMode", ...args]),
    noStroke: (...args) => drawCalls.push(["noStroke", ...args]),
    fill: (...args) => drawCalls.push(["fill", ...args]),
    ellipse: (...args) => drawCalls.push(["ellipse", ...args]),
    stroke: (...args) => drawCalls.push(["stroke", ...args]),
    strokeWeight: (...args) => drawCalls.push(["strokeWeight", ...args]),
    rect: (...args) => drawCalls.push(["rect", ...args])
  });

  for (const file of [
    "car-renderer.js",
    "path-following-vehicle.js",
    "fast-vehicle.js",
    "wander-vehicle.js",
    "sketch.js"
  ]) {
    const source = fs.readFileSync(path.join(exampleDirectory, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }

  return { context, elements, TestVehicle, drawCalls };
}

test("each circuit selection creates a distinct closed path shape", () => {
  const { context } = loadSketch();
  const circuits = ["oval", "figure-eight", "clover", "rounded", "winding"];
  const shapes = circuits.map((circuit) => {
    context.newPath(circuit);
    const points = vm.runInContext("path.points", context);
    assert.equal(points.length, 48);
    return JSON.stringify(points);
  });

  assert.equal(new Set(shapes).size, circuits.length);
});

test("G adds a green Vehicle subclass using its inherited wander behavior", () => {
  const { context } = loadSketch();
  context.keyPressed();

  const vehicle = vm.runInContext("vehicles[0]", context);
  assert.equal(vm.runInContext("vehicles.length", context), 1);
  assert.equal(vm.runInContext("vehicles[0] instanceof WanderVehicle", context), true);
  assert.equal(vm.runInContext("vehicles[0] instanceof Vehicle", context), true);
  assert.equal(vehicle.couleur, "lightgreen");
  assert.equal(vehicle.vehicleType, "wander");

  vehicle.applyBehaviors();
  assert.equal(vehicle.appliedForces.length, 1);
  assert.equal(vehicle.appliedForces[0].weight, 1);
});

test("vehicle counters report each category", () => {
  const { context, elements } = loadSketch();
  vm.runInContext(`vehicles = [
    { vehicleType: "path" },
    { vehicleType: "path" },
    { vehicleType: "fast" },
    { vehicleType: "wander" }
  ]`, context);

  context.updateVehicleCounts();

  assert.equal(elements.get("path-count").textContent, 2);
  assert.equal(elements.get("fast-count").textContent, 1);
  assert.equal(elements.get("wander-count").textContent, 1);
});

test("all spawned car types extend Vehicle", () => {
  const { context } = loadSketch();
  context.newVehicle(50, 60);
  context.newFastVehicle(70, 80);

  assert.equal(vm.runInContext("vehicles[0] instanceof Vehicle", context), true);
  assert.equal(vm.runInContext("vehicles[0] instanceof PathFollowingVehicle", context), true);
  assert.equal(vm.runInContext("vehicles[1] instanceof Vehicle", context), true);
  assert.equal(vm.runInContext("vehicles[1] instanceof FastVehicle", context), true);
  assert.equal(vm.runInContext("vehicles[1].maxSpeed", context), 10);
});

test("each vehicle renders a car silhouette in its assigned color and heading", () => {
  const { context, drawCalls } = loadSketch();
  context.newVehicle(50, 60);
  context.newFastVehicle(70, 80);
  context.newWanderVehicle(90, 100);

  vm.runInContext("vehicles.forEach(vehicle => vehicle.render())", context);

  const bodyColors = drawCalls
    .filter((call) => call[0] === "fill")
    .map((call) => call.slice(1))
    .filter((args) => args.length === 1);
  assert.deepEqual(bodyColors, [["black"], ["red"], ["lightgreen"]]);
  assert.equal(drawCalls.filter((call) => call[0] === "rotate" && call[1] === 0.75).length, 3);
  assert.equal(drawCalls.filter((call) => call[0] === "rect" && call[3] === 33 && call[4] === 16).length, 3);
});
