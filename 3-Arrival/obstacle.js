class Obstacle extends Vehicle {
  constructor(x, y, radius = 18) {
    super(x, y);
    this.r = radius;
  }

  show() {
    noStroke();
    fill(0, 0, 0, 52);
    ellipse(this.pos.x + 2, this.pos.y + this.r * 0.72, this.r * 2.3, this.r * 1.05);
    fill("#172e31");
    circle(this.pos.x, this.pos.y, this.r * 2.15);
    fill("#647e70");
    circle(this.pos.x, this.pos.y, this.r * 2);
    fill("#8ca28b");
    circle(this.pos.x - this.r * 0.22, this.pos.y - this.r * 0.28, this.r * 0.78);
    fill("#415d52");
    circle(this.pos.x + this.r * 0.35, this.pos.y + this.r * 0.22, this.r * 0.44);
    stroke(208, 239, 210, 130);
    strokeWeight(1.5);
    noFill();
    arc(this.pos.x, this.pos.y, this.r * 1.65, this.r * 1.65, Math.PI * 1.05, Math.PI * 1.85);
  }
}