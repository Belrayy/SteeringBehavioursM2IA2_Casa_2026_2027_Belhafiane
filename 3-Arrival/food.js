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
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 2);

    if (this.bad) {
      stroke("#f5e8ff");
      strokeWeight(2);
      line(this.pos.x - 4, this.pos.y - 4, this.pos.x + 4, this.pos.y + 4);
      line(this.pos.x + 4, this.pos.y - 4, this.pos.x - 4, this.pos.y + 4);
    } else {
      noStroke();
      fill(255, 235, 200, 190);
      circle(this.pos.x - 3, this.pos.y - 3, 4);
    }
  }
}