class Obstacle extends Vehicle {
  constructor(x, y, r, couleur) {
    super(x, y);
    this.r = r;
    this.color = couleur || "#218b70";
  }

  show() {
    push();
    noStroke();
    fill(0, 0, 0, 52);
    ellipse(this.pos.x + 3, this.pos.y + this.r * 0.72, this.r * 2.25, this.r);
    fill("#123c39");
    circle(this.pos.x, this.pos.y, this.r * 2.1);
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 1.9);
    fill("#55b99a");
    circle(this.pos.x - this.r * 0.18, this.pos.y - this.r * 0.24, this.r * 0.72);
    fill("#176b5c");
    circle(this.pos.x + this.r * 0.3, this.pos.y + this.r * 0.2, this.r * 0.4);
    noFill();
    stroke(169, 243, 216, 125);
    strokeWeight(1.5);
    arc(this.pos.x, this.pos.y, this.r * 1.62, this.r * 1.62, Math.PI * 1.05, Math.PI * 1.85);
    pop();
  }
}