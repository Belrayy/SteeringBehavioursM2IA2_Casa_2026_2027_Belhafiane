class PathFollowingVehicle extends Vehicle {
  constructor(x, y, maxSpeed, maxForce) {
    super(x, y, maxSpeed, maxForce);
    this.vehicleType = "path";
  }

  render() {
    renderCar(this);
  }
}
