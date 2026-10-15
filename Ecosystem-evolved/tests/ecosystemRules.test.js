const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../ecosystemRules.js');

test('new plant toxicity is sampled around the field average', () => {
  assert.equal(rules.averageToxicity([{ toxicity: 0 }, { toxicity: 1 }, { toxicity: 2 }]), 1);
  assert.equal(rules.sampleToxicityFromAverage(0.25, () => 0.2, 0), 1);
  assert.equal(rules.sampleToxicityFromAverage(0.25, () => 0.3, 0), 0);
  assert.equal(rules.sampleToxicityFromAverage(2, () => 0, 0), 2);
  assert.equal(rules.sampleToxicityFromAverage(0, () => 0.99, 0), 0);
  assert.equal(rules.sampleToxicityFromAverage(2, () => 0, 0.1), 1);
});

test('toxic plant share includes poisonous and lethal plants', () => {
  assert.equal(
    rules.toxicPlantFraction([{ toxicity: 0 }, { toxicity: 1 }, { toxicity: 2 }, { toxicity: 0 }]),
    0.5
  );
  assert.equal(rules.toxicPlantFraction([]), 0);
});

test('toxin damage is reduced by resistance and remains bounded', () => {
  assert.equal(rules.toxinDamage(0, 0), 0);
  assert.equal(rules.toxinDamage(1, 0), 1.4);
  assert.equal(rules.toxinDamage(2, 0), 3.2);
  assert.equal(rules.toxinDamage(1, 0.5), 0.7);
  assert.ok(Math.abs(rules.toxinDamage(2, 1) - 0.16) < 1e-12);
});

test('sheep resistance develops above the toxic-plant threshold', () => {
  assert.equal(rules.adaptResistance(0.2, 0.39, 10), 0.2);
  assert.equal(rules.adaptResistance(0.2, 0.4, 10), 0.8);
  assert.equal(rules.adaptResistance(0.94, 0.9, 10), 0.95);
  assert.equal(rules.adaptResistance(0.2, 0.9, -1), 0.2);
});

test('inherited resistance mutations stay within the trait bounds', () => {
  assert.ok(Math.abs(rules.inheritResistance(0.2, 0.1) - 0.3) < 1e-12);
  assert.equal(rules.inheritResistance(0, -0.1), 0);
  assert.equal(rules.inheritResistance(0.94, 0.1), 0.95);
});

test('animals reproduce on feeding only when mature, off cooldown, and below capacity', () => {
  assert.equal(rules.canReproduce(5.9, 0, 12, 6, 10, 4, 80), false);
  assert.equal(rules.canReproduce(6, 3, 12, 6, 10, 4, 80), false);
  assert.equal(rules.canReproduce(6, 2, 12, 6, 10, 4, 80), true);
  assert.equal(rules.canReproduce(6, 0, 12, 6, 10, 80, 80), false);
});
