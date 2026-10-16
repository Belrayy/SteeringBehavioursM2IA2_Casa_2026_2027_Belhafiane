const test = require('node:test');
const assert = require('node:assert/strict');
const steering = require('../sheepSteering.js');

test('wander heading changes gradually and clamps abrupt turn inputs', () => {
  assert.equal(steering.updateWanderHeading(1, 0.04), 1.04);
  assert.equal(steering.updateWanderHeading(1, 4), 1.08);
  assert.equal(steering.updateWanderHeading(1, -4), 0.92);
});

test('wander steering points toward its target and respects the force limit', () => {
  const force = steering.wanderForce({ x: 0, y: 0 }, 0, 3, 0.14);
  assert.ok(Math.abs(force.x - 0.14) < 1e-12);
  assert.equal(force.y, 0);
  assert.ok(Math.hypot(force.x, force.y) <= 0.14);
});

test('wander steering reduces velocity difference when already moving toward its heading', () => {
  const force = steering.wanderForce({ x: 1, y: 0 }, 0, 3, 0.14);
  assert.ok(force.x > 0);
  assert.equal(force.y, 0);
  assert.ok(Math.hypot(force.x, force.y) <= 0.14);
});

test('wander steering turns toward a new direction from an opposing velocity', () => {
  const force = steering.wanderForce({ x: -2, y: 0 }, 0, 3, 0.14);
  assert.ok(force.x > 0);
  assert.ok(Math.abs(force.y) < 1e-12);
  assert.ok(Math.hypot(force.x, force.y) <= 0.14);
});
