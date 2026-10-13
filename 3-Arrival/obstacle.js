class Obstacle extends Vehicle {
  constructor(x, y, radius = 18) {
    super(x, y);
    this.r = radius;
  }

  show() {
    noStroke();
    fill("#56634e");
    circle(this.pos.x, this.pos.y, this.r * 2);
    fill("#718269");
    circle(this.pos.x - this.r * 0.25, this.pos.y - this.r * 0.25, this.r * 0.65);
  }
}