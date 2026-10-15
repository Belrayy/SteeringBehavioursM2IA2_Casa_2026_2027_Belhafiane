function disposeNetwork(network) {
  // tfjs 1.1 needs a compiled model before model.dispose() can release its layers.
  network.model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
  network.dispose();
}

class ConfigurableVehicle extends Vehicle {
  constructor(brain) {
    super();
    disposeNetwork(this.brain);
    this.rays = [];
    this.maxspeed = currentSettings.carSpeed;

    for (let i = 0; i < currentSettings.rayCount; i++) {
      const angle = currentSettings.rayCount === 1
        ? 0
        : map(i, 0, currentSettings.rayCount - 1, -PI / 4, PI / 4);
      this.rays.push(new Ray(this.pos, angle));
    }

    this.brain = brain
      ? brain.copy()
      : new NeuralNetwork(currentSettings.rayCount, currentSettings.neuronCount, 2);
  }

  dispose() {
    disposeNetwork(this.brain);
  }
}
