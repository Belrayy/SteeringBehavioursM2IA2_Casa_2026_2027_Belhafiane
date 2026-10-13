import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class TestVector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy() { return new TestVector(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  heading() { return Math.atan2(this.y, this.x); }

  setMag(value) {
    const magnitude = this.mag();
    if (magnitude > 0) {
      this.mult(value / magnitude);
    }
    return this;
  }

  limit(maximum) {
    if (this.magSq() > maximum * maximum) {
      this.setMag(maximum);
    }
    return this;
  }

  static sub(first, second) {
    return new TestVector(first.x - second.x, first.y - second.y);
  }

  static dist(first, second) {
    return TestVector.sub(first, second).mag();
  }
}

const context = vm.createContext({
  createVector: (x, y) => new TestVector(x, y),
  p5: { Vector: TestVector },
  random: (minimum, maximum) => maximum === undefined ? 0 : minimum,
  map: (value, inputStart, inputEnd, outputStart, outputEnd) =>
    outputStart + ((value - inputStart) / (inputEnd - inputStart)) * (outputEnd - outputStart),
  width: 800,
  height: 600
});

for (const file of ["vehicle.js", "gameRules.js", "snakeSegment.js", "snake.js", "food.js", "obstacle.js"]) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  vm.runInContext(source, context, { filename: file });
}
vm.runInContext(readFileSync(new URL("../sketch.js", import.meta.url), "utf8"), context, {
  filename: "sketch.js"
});

const Vehicle = vm.runInContext("Vehicle", context);
const Snake = vm.runInContext("Snake", context);
const SnakeSegment = vm.runInContext("SnakeSegment", context);
const Food = vm.runInContext("Food", context);
const Obstacle = vm.runInContext("Obstacle", context);

test("arrival steering turns toward near and far targets within maxForce", () => {
  const vehicle = new Vehicle(100, 100);
  const farForce = vehicle.arrive(new TestVector(500, 100));
  const nearForce = vehicle.arrive(new TestVector(110, 100));
  const atTargetForce = vehicle.arrive(vehicle.pos.copy());

  assert.ok(farForce.x > 0);
  assert.ok(farForce.mag() <= vehicle.maxForce);
  assert.ok(nearForce.mag() <= vehicle.maxForce);
  assert.equal(atTargetForce.mag(), 0);
});

test("snake and segments extend Vehicle and receive limited follow forces", () => {
  const snake = new Snake(100, 100, 4);
  const appliedForces = [];
  const originalApplyForce = Vehicle.prototype.applyForce;
  Vehicle.prototype.applyForce = function (force) {
    appliedForces.push({ magnitude: force.mag(), limit: this.maxForce });
    originalApplyForce.call(this, force);
  };

  try {
    const startingDistance = TestVector.dist(snake.pos, new TestVector(300, 100));
    for (let frame = 0; frame < 20; frame += 1) {
      snake.updateFollowingMouse(new TestVector(300, 100));
    }

    assert.ok(TestVector.dist(snake.pos, new TestVector(300, 100)) < startingDistance);
    assert.equal(appliedForces.length, 20 * 4);
    assert.ok(appliedForces.every(force => force.magnitude <= force.limit + 1e-9));
    assert.ok(snake instanceof Vehicle);
    assert.ok(snake.segments.every(segment => segment instanceof SnakeSegment));
    assert.ok(snake.segments.every(segment => segment instanceof Vehicle));
  } finally {
    Vehicle.prototype.applyForce = originalApplyForce;
  }
});

test("growth adds separated Vehicle segments and shrinking keeps the head", () => {
  const snake = new Snake(100, 100, 2);
  snake.grow(2);

  assert.equal(snake.segments.length, 3);
  assert.ok(TestVector.dist(snake.segments[1].pos, snake.segments[2].pos) > 0);
  snake.shrink(10);

  assert.equal(snake.segments.length, 0);
  assert.ok(snake instanceof Vehicle);
});

test("food and obstacles are Vehicle entities with configured food effects", () => {
  const berry = new Food(10, 20, "berry");
  const badFood = new Food(30, 40, "bad");
  const obstacle = new Obstacle(50, 60);

  assert.ok(berry instanceof Vehicle);
  assert.ok(badFood instanceof Vehicle);
  assert.ok(obstacle instanceof Vehicle);
  assert.equal(berry.score, 10);
  assert.equal(berry.growth, 1);
  assert.equal(badFood.score, -15);
  assert.equal(badFood.growth, -2);
});

test("safe spawning refuses overlapping positions instead of returning an unsafe fallback", () => {
  vm.runInContext(
    "snake = { pos: createVector(18, 18), r: 18, segments: [] }; foods = []; obstacles = [];",
    context
  );
  assert.equal(vm.runInContext("findSafePosition(18)", context), null);

  vm.runInContext("snake.pos.set(700, 500)", context);
  assert.equal(JSON.stringify(vm.runInContext("findSafePosition(18)", context)), "[18,18]");
});
