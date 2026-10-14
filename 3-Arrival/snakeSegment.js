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
    stroke(8, 65, 48, 180);
    strokeWeight(1.5);
    fill(colorValue);
    circle(this.pos.x, this.pos.y, this.r * 1.8);

    noStroke();
    fill(236, 255, 243, 74);
    circle(this.pos.x - this.r * 0.22, this.pos.y - this.r * 0.24, this.r * 0.38);
  }
}