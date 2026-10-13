class RandomTarget extends Vehicle {
  constructor(x, y, rng = Math.random) {
    super(x, y);
    this.r = SeekPopulation.ARRIVAL_RADIUS;
    this.maxSpeed = 3;
    this.maxForce = 0.12;
    this.baseMaxSpeed = this.maxSpeed;
    this.baseMaxForce = this.maxForce;
    this.avoidanceRadius = 160;
    this.hasSplit = false;
    this.fleeBoostEnabled = false;
    this.rng = rng;
    this.wanderTarget = createVector(x, y);
    this.framesUntilWander = 0;
  }

  setFleeBoost(enabled) {
    this.fleeBoostEnabled = enabled;
    const multiplier = enabled ? 1.75 : 1;
    this.maxSpeed = this.baseMaxSpeed * multiplier;
    this.maxForce = this.baseMaxForce * multiplier;
  }

  isCaughtBy(vehicle) {
    const distance = p5.Vector.sub(vehicle.pos, this.pos).mag();
    return distance <= this.r + vehicle.r;
  }

  split(vehicle, w, h) {
    if (this.hasSplit) return null;

    this.hasSplit = true;
    const childRadius = this.r * 0.65;
    const separation = childRadius + vehicle.r + 2;
    const dx = vehicle.pos.x - this.pos.x;
    const dy = vehicle.pos.y - this.pos.y;
    const distance = Math.hypot(dx, dy);
    const perpendicularX = distance === 0 ? 0 : -dy / distance;
    const perpendicularY = distance === 0 ? 1 : dx / distance;
    const maxX = Math.max(childRadius, w - childRadius);
    const maxY = Math.max(childRadius, h - childRadius);

    return [-1, 1].map(direction => {
      const x = Math.max(childRadius, Math.min(maxX,
        this.pos.x + perpendicularX * separation * direction));
      const y = Math.max(childRadius, Math.min(maxY,
        this.pos.y + perpendicularY * separation * direction));
      const child = new RandomTarget(x, y, this.rng);
      child.r = childRadius;
      child.baseMaxSpeed = this.baseMaxSpeed * 0.7;
      child.baseMaxForce = this.baseMaxForce * 0.7;
      child.avoidanceRadius = this.avoidanceRadius;
      child.hasSplit = true;
      child.setFleeBoost(this.fleeBoostEnabled);
      return child;
    });
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
