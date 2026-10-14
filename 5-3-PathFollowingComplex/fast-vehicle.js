class FastVehicle extends Vehicle {
  constructor(x, y, maxForce) {
    super(x, y, 10, maxForce);
    this.vehicleType = "fast";
    this.couleur = "red";
  }

  render() {
    renderCar(this);
  }
}
