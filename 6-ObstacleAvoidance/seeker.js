class Seeker extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.color = "#c9f4ff";
    this.maxSeeingDistance = 200;
  }

  applyBehaviors(target, obstacles) {
    const visibleObstacles = obstacles.filter(
      obstacle => this.pos.dist(obstacle.pos) <= this.maxSeeingDistance
    );

    const seekForce = this.arrive(target).mult(0.2);
    const avoidForce = visibleObstacles.length
      ? this.avoid(visibleObstacles).mult(3)
      : createVector(0, 0);

    seekForce.add(avoidForce).limit(this.maxForce);
    this.applyForce(seekForce);
  }
}
