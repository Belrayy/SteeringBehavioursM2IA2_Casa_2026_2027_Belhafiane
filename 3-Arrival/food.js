class Food extends Vehicle {
  constructor(x, y, type) {
    super(x, y);
    const properties = GameRules.FOOD_TYPES[type];
    if (!properties) {
      throw new RangeError(`Unknown food type: ${type}`);
    }

    Object.assign(this, properties);
    this.type = type;
    this.r = 11;
  }

  show() {
    const pulse = 1 + Math.sin(frameCount * 0.09 + this.pos.x * 0.03) * 0.09;
    const diameter = this.r * 2;

    noFill();
    stroke(this.color);
    strokeWeight(1.5);
    circle(this.pos.x, this.pos.y, diameter * (this.bad ? 1.7 : 1.55) * pulse);

    noStroke();
    fill(this.color + "35");
    circle(this.pos.x, this.pos.y, diameter * 2.2 * pulse);

    push();
    translate(this.pos.x, this.pos.y);
    rotate(frameCount * (this.type === "golden" ? 0.025 : 0.012));
    if (this.type === "golden") {
      fill(this.color);
      stroke("#fff2af");
      strokeWeight(1.5);
      beginShape();
      vertex(0, -this.r * 1.25 * pulse);
      vertex(this.r * 0.88, 0);
      vertex(0, this.r * 1.25 * pulse);
      vertex(-this.r * 0.88, 0);
      endShape(CLOSE);
      noStroke();
      fill("#fff9d4");
      circle(0, 0, this.r * 0.48);
      pop();
      return;
    }

    noStroke();
    fill(this.color);
    stroke(this.bad ? "#e5c7ff" : "#fff1da");
    strokeWeight(1.5);
    circle(0, 0, diameter * pulse);

    if (this.bad) {
      stroke("#f5e8ff");
      strokeWeight(2);
      line(-4, -4, 4, 4);
      line(4, -4, -4, 4);
    } else {
      noStroke();
      fill(255, 235, 200, 190);
      circle(-3, -3, 4);
      fill("#79e8a5");
      ellipse(3, -this.r * 0.8, 5, 9);
    }
    pop();
  }
}