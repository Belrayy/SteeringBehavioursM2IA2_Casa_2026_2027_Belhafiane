const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../ecosystemConfig.js');
const rules = require('../ecosystemRules.js');

test('uneaten plant toxicity falls by one level per full aging interval', () => {
  const interval = rules.PLANT_DETOXIFY_INTERVAL;
  assert.equal(interval, 20);
  assert.equal(rules.toxicityAfterAging(2, interval - 0.01), 2);
  assert.equal(rules.toxicityAfterAging(2, interval), 1);
  assert.equal(rules.toxicityAfterAging(2, interval * 2 - 0.01), 1);
  assert.equal(rules.toxicityAfterAging(2, interval * 2), 0);
  assert.equal(rules.toxicityAfterAging(1, interval), 0);
  assert.equal(rules.toxicityAfterAging(0, interval * 3), 0);
  assert.equal(rules.toxicityAfterAging(2, -1), 2);
});

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

test('sheep resistance changes only through bounded inheritance mutations', () => {
  assert.equal(rules.inheritResistance(0.2, 0), 0.2);
  assert.ok(Math.abs(rules.inheritResistance(0.2, 0.03) - 0.23) < 1e-12);
  assert.equal(rules.inheritResistance(0.94, 0.1), 0.95);
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
  assert.equal(rules.canReproduce(6, 0, 12, 6, 10, 4, 80, 40, 50), false);
  assert.equal(rules.canReproduce(6, 0, 12, 6, 10, 4, 80, 50, 50), true);
});

test('energy intake, movement costs, and starvation are bounded', () => {
  assert.equal(rules.updateEnergy(80, 30, 2, 5, 100), 100);
  assert.equal(rules.updateEnergy(80, 0, 2, 5, 100), 70);
  assert.equal(rules.updateEnergy(10, 0, 3, 5, 100), 0);
  assert.equal(rules.updateEnergy(10, 10, -3, 1, 100), 20);
  assert.equal(rules.starvationDamage(1, 2, 0.5), 0);
  assert.equal(rules.starvationDamage(0, 2, 0.5), 1);
  assert.equal(rules.starvationDamage(0, -2, 0.5), 0);
});

test('higher movement and trait demands increase energy drain', () => {
  const economical = rules.energyDrainRate(0.2, 0.3, 0.25, 0.05);
  const demanding = rules.energyDrainRate(0.2, 0.3, 1.5, 0.2);
  assert.ok(demanding > economical);
  assert.equal(rules.energyDrainRate(0, 1, -1, -1), 0);
});

test('predation slows down as the prey population falls', () => {
  assert.equal(rules.predationCooldown(32, 14, 32), 14);
  assert.equal(rules.predationCooldown(16, 14, 32), 28);
  assert.equal(rules.predationCooldown(64, 14, 32), 14);
  assert.equal(rules.predationCooldown(0, 14, 32), 448);
});

test('shared configuration defines consistent species and population rules', () => {
  assert.equal(config.wolf.maxEnergy, 100);
  assert.equal(config.sheep.maxEnergy, 100);
  assert.ok(config.wolf.reproductionEnergyCost > 0);
  assert.ok(config.sheep.reproductionEnergyCost > 0);
  assert.ok(config.wolf.populationCap > 0);
  assert.ok(config.sheep.populationCap > config.wolf.populationCap);
  assert.ok(Number.isFinite(config.wolf.visionMin));
  assert.ok(Number.isFinite(config.wolf.visionMax));
  assert.ok(config.wolf.visionMin < config.wolf.visionMax);
  assert.ok(config.wolf.initialVision >= config.wolf.visionMin);
  assert.ok(config.wolf.initialVision <= config.wolf.visionMax);
  assert.ok(config.sheep.baseSpeed > config.wolf.baseSpeed);
  assert.equal(config.wolf.initialEnergy, config.wolf.maxEnergy);
  assert.ok(config.wolf.huntCooldown > 0);
  assert.equal(config.wolf.populationCap, 6);
  assert.equal(config.sheep.populationCap, 80);
  assert.ok(config.initial.plantSpawnRate <= config.simulation.maxPlantSpawnRate);
  assert.equal(config.initial.plantSpawnRate, 3.5);
  assert.ok(config.wolf.huntPreyReference > 0);
});
