import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function sketch() {
  const buttonEvents = {};
  const calls = { background: [], gradients: [], fills: [], canvasSize: [], resizedCanvas: [] };
  const gradient = { addColorStop: (stop, color) => calls.gradients.push([stop, color]) };
  const toggle = {
    textContent: 'Désactiver le fond LSD',
    attributes: { 'aria-pressed': 'true' },
    addEventListener: (name, listener) => { buttonEvents[name] = listener; },
    setAttribute: (name, value) => { toggle.attributes[name] = value; },
  };
  const musicToggle = {
    textContent: 'Activer la musique',
    attributes: { 'aria-pressed': 'false' },
    addEventListener: (name, listener) => { buttonEvents['music-' + name] = listener; },
    setAttribute: (name, value) => { musicToggle.attributes[name] = value; },
  };
  const musicStatus = { textContent: '' };
  const targetModeToggle = {
    textContent: 'Activer la cible fuyante',
    attributes: { 'aria-pressed': 'false' },
    addEventListener: (name, listener) => { buttonEvents['target-' + name] = listener; },
    setAttribute: (name, value) => { targetModeToggle.attributes[name] = value; },
  };
  const targetFleeBoostToggle = {
    textContent: 'Améliorer leur fuite',
    attributes: { 'aria-pressed': 'false' },
    addEventListener: (name, listener) => { buttonEvents['target-flee-boost-' + name] = listener; },
    getAttribute: name => targetFleeBoostToggle.attributes[name],
    setAttribute: (name, value) => { targetFleeBoostToggle.attributes[name] = value; },
  };
  const targetHint = { textContent: 'Déplacez la souris dans la scène pour guider la cible rouge.' };
  const targetCountSlider = { value: '1', addEventListener: (name, listener) => { buttonEvents['target-count-' + name] = listener; } };
  const targetCountValue = {};
  const targetRadiusSlider = { value: '160', addEventListener: (name, listener) => { buttonEvents['target-radius-' + name] = listener; } };
  const targetRadiusValue = {};
  const targetCaughtCount = { textContent: '0' };
  const slider = { value: '20' };
  const speedSlider = { value: '4', addEventListener: (name, listener) => { buttonEvents['speed-' + name] = listener; } };
  const forceSlider = { value: '0.1', addEventListener: (name, listener) => { buttonEvents['force-' + name] = listener; } };
  const elements = {
    controls: { offsetHeight: 40 },
    scene: { getBoundingClientRect: () => ({ width: 760, height: 560 }) },
    'background-toggle': toggle,
    'music-toggle': musicToggle,
    'music-status': musicStatus,
    'target-mode-toggle': targetModeToggle,
    'target-flee-boost-toggle': targetFleeBoostToggle,
    'target-caught-count': targetCaughtCount,
    'target-hint': targetHint,
    'target-count': targetCountSlider,
    'target-count-value': targetCountValue,
    'target-radius': targetRadiusSlider,
    'target-radius-value': targetRadiusValue,
    'vehicle-count': slider,
    'vehicle-count-value': {},
    'vehicle-speed': speedSlider,
    'vehicle-speed-value': {},
    'vehicle-force': forceSlider,
    'vehicle-force-value': {},
  };
  const canvas = { parent() {}, elt: { addEventListener() {}, getBoundingClientRect() {
    return { left: 0, top: 0, width: 800, height: 560 };
  } } };
  class MockVehicle {
    constructor(x, y) { this.pos = { x, y, set(nx, ny) { this.x = nx; this.y = ny; } }; this.r = 16; }
    show() {}
    edges() {}
  }
  const context = vm.createContext({
    Math, windowWidth: 800, windowHeight: 600, width: 800, height: 560, frameCount: 0,
    p5: { Vector: { sub(a, b) {
      return { mag: () => Math.hypot(a.x - b.x, a.y - b.y) };
    } } },
    document: { getElementById: id => elements[id] },
    createCanvas: (width, height) => { calls.canvasSize.push([width, height]); return canvas; },
    resizeCanvas: (width, height) => calls.resizedCanvas.push([width, height]),
    drawingContext: {
      createRadialGradient: () => gradient,
      set fillStyle(value) { calls.fills.push(value); },
      fillRect: (...args) => calls.fills.push(args),
    },
    background: color => calls.background.push(color),
    Vehicle: MockVehicle,
    MouseTarget: class { constructor(x, y) { this.pos = { x, y, set(nx, ny) { this.x = nx; this.y = ny; } }; } show() {} },
    RandomTarget: class {
      constructor(x, y) {
        this.pos = { x, y, set(nx, ny) { this.x = nx; this.y = ny; } };
        this.r = 16;
        this.avoidanceRadius = 160;
        this.hasSplit = false;
        this.fleeBoostEnabled = false;
      }
      setFleeBoost(enabled) { this.fleeBoostEnabled = enabled; }
      isCaughtBy(vehicle) {
        return Math.hypot(this.pos.x - vehicle.pos.x, this.pos.y - vehicle.pos.y) <= this.r + vehicle.r;
      }
      split() {
        if (this.hasSplit) return null;
        this.hasSplit = true;
        return [
          new this.constructor(this.pos.x - 50, this.pos.y),
          new this.constructor(this.pos.x + 50, this.pos.y),
        ];
      }
      show() {}
      step() {}
      edges() {}
    },
    SeekPopulation: {
      INITIAL_COUNT: 20,
      bindSlider(countSlider, output, vehicles, target, dimensions, createVehicle) {
        this.createVehicle = createVehicle;
        for (let i = 0; i < Number(countSlider.value); i++) vehicles.push(createVehicle(0, 0));
      },
      step() {},
    },
    SeekMusic: {
      async start() { this.started = true; },
      stop() { this.stopped = true; },
    },
    constrain: value => value,
  });
  vm.runInContext(readFileSync(new URL('../sketch.js', import.meta.url), 'utf8'), context);
  vm.runInContext('setup()', context);
  return { context, buttonEvents, calls, toggle, musicToggle, musicStatus, targetModeToggle, targetFleeBoostToggle, targetHint, targetCountValue, targetRadiusValue, targetCaughtCount };
}

test('radial LSD background animates and toggle switches it to black', () => {
  const { context, buttonEvents, calls, toggle } = sketch();

  vm.runInContext('draw()', context);
  assert.equal(calls.gradients.length, 6);
  assert.equal(calls.background.length, 0);
  assert.ok(calls.gradients.some(([, color]) => color.includes('hsl(')));

  buttonEvents.click();
  assert.equal(toggle.attributes['aria-pressed'], 'false');
  assert.equal(toggle.textContent, 'Activer le fond LSD');
  vm.runInContext('draw()', context);
  assert.deepEqual(calls.background, ['black']);

  buttonEvents.click();
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  assert.equal(toggle.textContent, 'Désactiver le fond LSD');
  vm.runInContext('draw()', context);
  assert.equal(calls.gradients.length, 12);
});

test('canvas uses the scene area beside the responsive controls', () => {
  const { context, calls } = sketch();
  assert.deepEqual(calls.canvasSize, [[760, 560]]);

  vm.runInContext('windowResized()', context);
  assert.deepEqual(calls.resizedCanvas, [[760, 560]]);
});

test('speed and force sliders update current and newly created vehicles', () => {
  const { context, buttonEvents } = sketch();
  const vehicles = vm.runInContext('vehicles', context);
  const speedValue = vm.runInContext("document.getElementById('vehicle-speed-value')", context);
  const forceValue = vm.runInContext("document.getElementById('vehicle-force-value')", context);

  assert.equal(vehicles.length, 20);
  assert.ok(vehicles.every(vehicle => vehicle.maxSpeed === 4 && vehicle.maxForce === 0.1));

  vm.runInContext("document.getElementById('vehicle-speed').value = '7.5'", context);
  buttonEvents['speed-input']();
  vm.runInContext("document.getElementById('vehicle-force').value = '0.25'", context);
  buttonEvents['force-input']();

  assert.ok(vehicles.every(vehicle => vehicle.maxSpeed === 7.5 && vehicle.maxForce === 0.25));
  assert.equal(speedValue.value, '7.5 px/frame');
  assert.equal(forceValue.value, '0.25');

  const newVehicle = vm.runInContext('SeekPopulation.createVehicle(0, 0)', context);
  assert.equal(newVehicle.maxSpeed, 7.5);
  assert.equal(newVehicle.maxForce, 0.25);
});

test('music button starts and stops generated music with accessible status', async () => {
  const { context, buttonEvents, musicToggle, musicStatus } = sketch();

  await buttonEvents['music-click']();
  assert.equal(vm.runInContext('SeekMusic.started', context), true);
  assert.equal(musicToggle.attributes['aria-pressed'], 'true');
  assert.equal(musicToggle.textContent, 'Désactiver la musique');
  assert.equal(musicStatus.textContent, 'Musique activée');
  assert.equal(musicToggle.disabled, false);

  await buttonEvents['music-click']();
  assert.equal(vm.runInContext('SeekMusic.stopped', context), true);
  assert.equal(musicToggle.attributes['aria-pressed'], 'false');
  assert.equal(musicToggle.textContent, 'Activer la musique');
  assert.equal(musicStatus.textContent, 'Musique désactivée');
});

test('target mode button switches between mouse and autonomous fleeing target', () => {
  const { context, buttonEvents, targetModeToggle, targetHint } = sketch();

  buttonEvents['target-click']();
  assert.equal(vm.runInContext('autonomousTarget', context), true);
  assert.equal(vm.runInContext('target.constructor.name', context), 'RandomTarget');
  assert.equal(targetModeToggle.attributes['aria-pressed'], 'true');
  assert.equal(targetModeToggle.textContent, 'Revenir à la cible souris');
  assert.match(targetHint.textContent, /fuit les véhicules/);

  buttonEvents['target-click']();
  assert.equal(vm.runInContext('autonomousTarget', context), false);
  assert.equal(vm.runInContext('target.constructor.name', context), 'MouseTarget');
  assert.equal(targetModeToggle.attributes['aria-pressed'], 'false');
  assert.equal(targetModeToggle.textContent, 'Activer la cible fuyante');
  assert.match(targetHint.textContent, /Déplacez la souris/);
});

test('target count slider sets between one and twenty autonomous targets', () => {
  const { context, buttonEvents, targetCountValue } = sketch();
  const targets = vm.runInContext('randomTargets', context);
  assert.equal(targets.length, 1);
  assert.equal(targetCountValue.value, '1 / 20');

  vm.runInContext("document.getElementById('target-count').value = '20'", context);
  buttonEvents['target-count-input']();
  assert.equal(targets.length, 20);
  assert.equal(targetCountValue.value, '20 / 20');

  vm.runInContext("document.getElementById('target-count').value = '3'", context);
  buttonEvents['target-count-input']();
  assert.equal(targets.length, 3);
  assert.equal(targetCountValue.value, '3 / 20');
});

test('target radius slider updates existing and newly added autonomous targets', () => {
  const { context, buttonEvents, targetRadiusValue } = sketch();
  const targets = vm.runInContext('randomTargets', context);
  assert.equal(targets[0].avoidanceRadius, 160);
  assert.equal(targetRadiusValue.value, '160 px');

  vm.runInContext("document.getElementById('target-radius').value = '240'", context);
  buttonEvents['target-radius-input']();
  assert.ok(targets.every(target => target.avoidanceRadius === 240));
  assert.equal(targetRadiusValue.value, '240 px');

  vm.runInContext("document.getElementById('target-count').value = '2'", context);
  buttonEvents['target-count-input']();
  assert.ok(targets.every(target => target.avoidanceRadius === 240));
});

test('flee boost applies to current and newly added targets', () => {
  const { context, buttonEvents, targetFleeBoostToggle } = sketch();
  const targets = vm.runInContext('randomTargets', context);

  buttonEvents['target-flee-boost-click']();
  assert.equal(targetFleeBoostToggle.attributes['aria-pressed'], 'true');
  assert.ok(targets.every(target => target.fleeBoostEnabled));

  vm.runInContext("document.getElementById('target-count').value = '2'", context);
  buttonEvents['target-count-input']();
  assert.ok(targets.every(target => target.fleeBoostEnabled));

  buttonEvents['target-flee-boost-click']();
  assert.ok(targets.every(target => !target.fleeBoostEnabled));
});

test('caught targets split once and subsequent contacts remove split targets', () => {
  const { context, buttonEvents, targetCaughtCount } = sketch();
  const targets = vm.runInContext('randomTargets', context);
  const vehicles = vm.runInContext('vehicles', context);
  vehicles[0].pos.set(targets[0].pos.x, targets[0].pos.y);
  buttonEvents['target-click']();

  vm.runInContext('draw()', context);
  assert.equal(targetCaughtCount.textContent, '1');
  assert.equal(targets.length, 2);
  assert.ok(targets.every(target => target.hasSplit));

  vehicles[1].pos.set(targets[0].pos.x, targets[0].pos.y);
  vm.runInContext('draw()', context);
  assert.equal(targetCaughtCount.textContent, '2');
  assert.equal(targets.length, 1);
});
