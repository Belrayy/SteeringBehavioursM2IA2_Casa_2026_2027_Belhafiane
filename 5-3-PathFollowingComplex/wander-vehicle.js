class WanderVehicle extends Vehicle {
  constructor(x, y, maxSpeed, maxForce) {
    super(x, y, maxSpeed, maxForce);
    this.wanderWeight = 1;
    this.followPathWeight = 0;
    this.separateWeight = 0;
    this.r = 30;
    this.couleur = "lightgreen";
    this.vehicleType = "wander";
  }

  applyBehaviors() {
    const wanderForce = this.wander();
    wanderForce.mult(this.wanderWeight);
    this.applyForce(wanderForce);
  }

  render() {
    renderCar(this);
  }
}
