import assert from "node:assert/strict";
import test from "node:test";
import GameRules from "../gameRules.js";

test("food types award different scores and growth amounts", () => {
  assert.deepEqual(GameRules.applyFoodEffect(0, 4, "berry"), { score: 10, size: 5 });
  assert.deepEqual(GameRules.applyFoodEffect(10, 4, "golden"), { score: 35, size: 7 });
  assert.deepEqual(GameRules.applyFoodEffect(35, 7, "bad"), { score: 20, size: 5 });
});

test("bad food cannot reduce score or snake size below their minimums", () => {
  assert.deepEqual(GameRules.applyFoodEffect(5, 2, "bad"), { score: 0, size: 1 });
  assert.deepEqual(GameRules.applyFoodEffect(0, 1, "bad"), { score: 0, size: 1 });
});

test("unknown food types are rejected", () => {
  assert.throws(() => GameRules.applyFoodEffect(0, 1, "mystery"), {
    name: "RangeError"
  });
});

test("higher scores increase obstacles and enabled bad food", () => {
  assert.equal(GameRules.targetObstacleCount(0), 0);
  assert.equal(GameRules.targetObstacleCount(75), 3);
  assert.equal(GameRules.targetBadFoodCount(0, true), 1);
  assert.equal(GameRules.targetBadFoodCount(90, true), 4);
});

test("difficulty is capped and bad food can be disabled", () => {
  assert.equal(GameRules.targetObstacleCount(10000), 12);
  assert.equal(GameRules.targetBadFoodCount(10000, true), 8);
  assert.equal(GameRules.targetBadFoodCount(10000, false), 0);
});