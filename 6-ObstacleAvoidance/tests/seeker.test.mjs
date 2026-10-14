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
    if (this.mag() > 0) this.mult(value / this.mag());
    return this;
  }
  limit(maximum) {
    if (this.magSq() > maximum * maximum) this.setMag(maximum);
    return this;
  }
  dist(vector) { return TestVector.dist(this, vector); }

  static add(first, second) { return new TestVector(first.x + second.x, first.y + second.y); }
  static sub(first, second) { return new TestVector(first.x - second.x, first.y - second.y); }
  static dist(first, second) { return TestVector.sub(first, second).mag(); }
}

const context = vm.createContext({
  createVector: (x, y) => new TestVector(x, y),
  p5: { Vector: TestVector },
  random: (minimum, maximum) => maximum === undefined ? 0 : minimum,
  map: (value, inputStart, inputEnd, outputStart, outputEnd) =>
    outputStart + ((value - inputStart) / (inputEnd - inputStart)) * (outputEnd - outputStart),
  width: 800,
  height: 600,
  vehicules: [],
  console
});

for (const file of ["vehicle.js", "obstacle.js", "seeker.js"]) {
  vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), context, {
    filename: file
  });
}

const Vehicle = vm.runInContext("Vehicle", context);
const Seeker = vm.runInContext("Seeker", context);
const Obstacle = vm.runInContext("Obstacle", context);

test("seekers and stationary obstacles both extend Vehicle", () => {
  assert.ok(new Seeker(20, 30) instanceof Vehicle);
  assert.ok(new Obstacle(50, 60, 25) instanceof Vehicle);
});

test("seeing distance limits which obstacles reach inherited avoidance", () => {
  const seeker = new Seeker(100, 100);
  seeker.maxSeeingDistance = 80;
  const nearby = new Obstacle(120, 100, 18);
  const distant = new Obstacle(250, 100, 18);
  let consideredObstacles;
  seeker.avoid = obstacles => {
    consideredObstacles = obstacles;
    return new TestVector(0, 0);
  };

  seeker.applyBehaviors(new TestVector(300, 100), [nearby, distant]);

  assert.deepEqual(consideredObstacles, [nearby]);
});

test("seekers apply inherited avoidance to detected obstacles only", () => {
  const seeker = new Seeker(100, 100);
  seeker.maxSeeingDistance = 80;
  const nearby = new Obstacle(120, 100, 18);
  const distant = new Obstacle(250, 100, 18);

  seeker.applyBehaviors(seeker.pos, [nearby]);
  assert.ok(seeker.acc.x < 0);

  seeker.acc.set(0, 0);
  seeker.applyBehaviors(seeker.pos, [distant]);
  assert.equal(seeker.acc.mag(), 0);
});

test("combined steering force is capped by the configured maximum strength", () => {
  const seeker = new Seeker(100, 100);
  seeker.maxForce = 0.08;
  seeker.avoid = () => new TestVector(10, 10);
  let appliedForce;
  seeker.applyForce = force => { appliedForce = force.copy(); };

  seeker.applyBehaviors(new TestVector(500, 100), [new Obstacle(110, 100, 20)]);

  assert.ok(appliedForce.mag() <= seeker.maxForce + 1e-9);
});

test("empty obstacle lists do not invoke the base avoidance function", () => {
  const seeker = new Seeker(100, 100);
  seeker.avoid = () => {
    throw new Error("avoidance should not run without visible obstacles");
  };

  assert.doesNotThrow(() => seeker.applyBehaviors(new TestVector(500, 100), []));
});
