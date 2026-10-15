const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'configurable-vehicle.js'),
  'utf8'
);

function createVehicleClass(settings) {
  class BaseVehicle {
    constructor() {
      this.pos = { x: 0, y: 0 };
      this.maxspeed = 5;
      this.rays = [];
      this.brain = new TestNetwork(6, 12, 2);
    }
  }

  class TestNetwork {
    constructor(inputs, hidden, outputs) {
      this.input_nodes = inputs;
      this.hidden_nodes = hidden;
      this.output_nodes = outputs;
      this.disposed = false;
      this.model = {
        optimizer: null,
        compile: options => {
          this.model.optimizer = options.optimizer;
        }
      };
    }

    copy() {
      return new TestNetwork(this.input_nodes, this.hidden_nodes, this.output_nodes);
    }

    dispose() {
      this.disposed = true;
    }
  }

  class TestRay {
    constructor(pos, angle) {
      this.pos = pos;
      this.angle = angle;
    }
  }

  const context = {
    Vehicle: BaseVehicle,
    NeuralNetwork: TestNetwork,
    Ray: TestRay,
    currentSettings: settings,
    PI: Math.PI,
    map: (value, inStart, inStop, outStart, outStop) =>
      outStart + ((value - inStart) / (inStop - inStart)) * (outStop - outStart)
  };
  vm.runInNewContext(`${source}\nthis.ConfigurableVehicle = ConfigurableVehicle;`, context);
  return { ConfigurableVehicle: context.ConfigurableVehicle, TestNetwork };
}

test('constructs the selected number of rays and matches the neural input layer', () => {
  const { ConfigurableVehicle } = createVehicleClass({
    carSpeed: 8,
    neuronCount: 32,
    rayCount: 13
  });
  const vehicle = new ConfigurableVehicle();

  assert.equal(vehicle.maxspeed, 8);
  assert.equal(vehicle.rays.length, 13);
  assert.equal(vehicle.rays[0].angle, -Math.PI / 4);
  assert.equal(vehicle.rays[12].angle, Math.PI / 4);
  assert.equal(vehicle.brain.input_nodes, 13);
  assert.equal(vehicle.brain.hidden_nodes, 32);
  assert.equal(vehicle.brain.output_nodes, 2);
  vehicle.dispose();
  assert.equal(vehicle.brain.disposed, true);
});

test('offspring copy the parent brain architecture and weights source', () => {
  const { ConfigurableVehicle, TestNetwork } = createVehicleClass({
    carSpeed: 4,
    neuronCount: 10,
    rayCount: 5
  });
  const parentBrain = new TestNetwork(5, 10, 2);
  const child = new ConfigurableVehicle(parentBrain);

  assert.notEqual(child.brain, parentBrain);
  assert.equal(child.brain.input_nodes, 5);
  assert.equal(child.brain.hidden_nodes, 10);
  assert.equal(child.rays.length, 5);
  assert.equal(child.maxspeed, 4);
  child.dispose();
});
