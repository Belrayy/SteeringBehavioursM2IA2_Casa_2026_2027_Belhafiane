const test = require('node:test');
const assert = require('node:assert/strict');
const report = require('../ecosystemReport.js');

function makeSimulation() {
  return {
    running: false,
    time: 125.5,
    births: 12,
    deaths: 7,
    wolfBirths: 2,
    sheepBirths: 3,
    plantSpawns: 7,
    animalDeaths: 4,
    plantRemovals: 3,
    wolves: [
      { age: 30, health: 2.4, gene: { pursuit: 1, vision: 120, chaseBias: 1.1 } },
    ],
    sheep: [
      { age: 20, health: 3, gene: { threatRadius: 125, foodRadius: 110, avoidToxicity: 1, speed: 1, toxinResistance: 0.6 } },
      { age: 22, health: 4, gene: { threatRadius: 130, foodRadius: 120, avoidToxicity: 0.9, speed: 1.1, toxinResistance: 0.8 } },
    ],
    plants: [
      { age: 10, toxicity: 0 },
      { age: 12, toxicity: 1 },
      { age: 14, toxicity: 2 },
      { age: 16, toxicity: 2 },
    ],
  };
}

test('report summarizes population, events, toxicity, and resistance in plain-language values', () => {
  const snapshot = report.createReport(makeSimulation(), {
    initialPlants: 60,
    initialWolves: 5,
    initialSheep: 32,
    plantSpawnRate: 1.2,
  }, new Date('2026-10-16T09:00:00.000Z'));

  assert.deepEqual(snapshot.population, { wolves: 1, sheep: 2, plants: 4 });
  assert.deepEqual(snapshot.events.births, { total: 12, wolves: 2, sheep: 3, plants: 7 });
  assert.deepEqual(snapshot.events.removals, { total: 7, animals: 4, plants: 3 });
  assert.deepEqual(
    [snapshot.plants.safe, snapshot.plants.poisonous, snapshot.plants.lethal],
    [1, 1, 2]
  );
  assert.equal(snapshot.plants.toxicFraction, 0.75);
  assert.equal(snapshot.sheep.resistance.resistantCount, 1);
  assert.match(snapshot.observations.toxicity, /40% threshold/);
  assert.equal(snapshot.settings.plantSpawnRate, 1.2);
});

test('PDF is a valid two-page document containing the explanations and snapshot metrics', async () => {
  const snapshot = report.createReport(makeSimulation(), {
    initialPlants: 60,
    initialWolves: 5,
    initialSheep: 32,
    plantSpawnRate: 1.2,
  });
  const pdfBlob = report.createPdf(snapshot);
  const pdf = Buffer.from(await pdfBlob.arrayBuffer()).toString('ascii');

  assert.equal(pdfBlob.type, 'application/pdf');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.endsWith('%%EOF'));
  assert.match(pdf, /\/Count 2/);
  assert.match(pdf, /Current populations and condition/);
  assert.match(pdf, /Rules in plain language/);
  assert.match(pdf, /16-second cooldown/);
  assert.match(pdf, /population cap of 180/);
  assert.match(pdf, /Average toxicity/);
  assert.match(pdf, /Plant spawn rate/);
  const textPositions = [...pdf.matchAll(/BT \/F\d+ \d+(?:\.\d+)? Tf \d+ (-?\d+(?:\.\d+)?) Td/g)]
    .map((match) => Number(match[1]))
    .filter((position) => position > 30);
  assert.ok(Math.min(...textPositions) >= 45, 'report content should stay above the footer');

  const xrefStart = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.equal(pdf.slice(xrefStart, xrefStart + 4), 'xref');
  const xrefEntries = pdf.slice(xrefStart).match(/xref\n0 9\n([\s\S]*?)trailer/)[1].trimEnd().split('\n').slice(1);
  for (let objectNumber = 1; objectNumber <= 8; objectNumber++) {
    const offset = Number(xrefEntries[objectNumber - 1].slice(0, 10));
    assert.ok(pdf.startsWith(`${objectNumber} 0 obj`, offset), `object ${objectNumber} offset should be correct`);
  }
});

test('empty populations still produce a readable report without non-finite values', async () => {
  const emptySim = {
    running: false,
    time: 0,
    births: 0,
    deaths: 0,
    wolfBirths: 0,
    sheepBirths: 0,
    plantSpawns: 0,
    animalDeaths: 0,
    plantRemovals: 0,
    wolves: [],
    sheep: [],
    plants: [],
  };
  const snapshot = report.createReport(emptySim, {
    initialPlants: 60,
    initialWolves: 5,
    initialSheep: 32,
    plantSpawnRate: 1.2,
  });
  const pdf = Buffer.from(await report.createPdf(snapshot).arrayBuffer()).toString('ascii');

  assert.equal(snapshot.plants.averageToxicity, 0);
  assert.equal(snapshot.sheep.resistance.average, 0);
  assert.doesNotMatch(pdf, /NaN|Infinity/);
  assert.match(pdf, /There are no plants to assess for toxicity/);
});
