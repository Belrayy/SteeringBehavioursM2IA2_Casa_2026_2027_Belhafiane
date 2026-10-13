class SnakeSegment extends Vehicle {
  constructor(x, y, radius) {
    super(x, y);
    this.r = radius;
    this.maxSpeed = 3.5;
    this.maxForce = 0.18;
  }

  follow(target) {
    this.applyForce(this.arrive(target, this.r * 1.1));
    this.update();
    this.edges();
  }

  show(colorValue) {
    noStroke();
    fill(colorValue);
    circle(this.pos.x, this.pos.y, this.r * 1.8);
  }
}