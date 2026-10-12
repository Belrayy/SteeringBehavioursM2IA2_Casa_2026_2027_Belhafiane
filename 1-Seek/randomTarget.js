class RandomTarget extends Vehicle {
  constructor(x, y, rng = Math.random) {
    super(x, y);
    this.r = SeekPopulation.ARRIVAL_RADIUS;
    this.maxSpeed = 3;
    this.maxForce = 0.12;
    this.avoidanceRadius = 160;
    this.rng = rng;
    this.wanderTarget = createVector(x, y);
    this.framesUntilWander = 0;
  }

  step(vehicles, w, h) {
    if (this.framesUntilWander <= 0
      || p5.Vector.sub(this.wanderTarget, this.pos).mag() < 40) {
      this.wanderTarget.set(this.rng() * w, this.rng() * h);
      this.framesUntilWander = 90;
    }
    this.framesUntilWander--;

    const steering = this.seek(this.wanderTarget).mult(0.35);
    const avoidance = createVector(0, 0);
    for (const vehicle of vehicles) {
      const distance = p5.Vector.sub(vehicle.pos, this.pos).mag();
      if (distance > 0 && distance < this.avoidanceRadius) {
        const urgency = 1 - distance / this.avoidanceRadius;
        avoidance.add(this.flee(vehicle.pos).mult(urgency));
      }
    }

    steering.add(avoidance);
    steering.limit(this.maxForce);
    this.applyForce(steering);
    this.update();
    this.edges();
  }

  show() {
    push();
    noFill();
    stroke(255, 95);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, this.avoidanceRadius * 2);
    fill('#ff4d6d');
    stroke('white');
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}
