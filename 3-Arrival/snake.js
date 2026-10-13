class Snake extends Vehicle {
  constructor(x, y, startingSize) {
    super(x, y);
    this.r = 18;
    this.maxSpeed = 4.5;
    this.maxForce = 0.22;
    this.segments = [];

    for (let index = 1; index < startingSize; index += 1) {
      this.segments.push(new SnakeSegment(x - index * this.r * 1.5, y, this.r));
    }
  }

  updateFollowingMouse(target) {
    this.applyForce(this.arrive(target));
    this.update();
    this.edges();

    let previous = this;
    for (const segment of this.segments) {
      segment.follow(previous.pos);
      previous = segment;
    }
  }

  grow(amount) {
    let tail = this.segments[this.segments.length - 1] || this;
    let offset = tail.vel.copy();
    if (offset.magSq() < 0.01) {
      offset = this.vel.copy();
    }
    if (offset.magSq() < 0.01) {
      offset = createVector(1, 0);
    }
    offset.setMag(this.r * 1.5);

    for (let index = 0; index < amount; index += 1) {
      const position = tail.pos.copy().sub(offset);
      tail = new SnakeSegment(position.x, position.y, this.r);
      this.segments.push(tail);
    }
  }

  shrink(amount) {
    this.segments.splice(Math.max(0, this.segments.length - amount), amount);
  }

  show() {
    for (let index = this.segments.length - 1; index >= 0; index -= 1) {
      const shade = map(index, 0, Math.max(1, this.segments.length), 105, 45);
      this.segments[index].show(color(20, shade, 38));
    }

    noStroke();
    fill("#38a34a");
    circle(this.pos.x, this.pos.y, this.r * 2);

    const heading = this.vel.magSq() > 0.01 ? this.vel.heading() : 0;
    const eyeOffset = this.r * 0.42;
    const eyeSize = this.r * 0.3;
    fill("#f4f5dc");
    circle(
      this.pos.x + cos(heading - 0.55) * eyeOffset,
      this.pos.y + sin(heading - 0.55) * eyeOffset,
      eyeSize
    );
    circle(
      this.pos.x + cos(heading + 0.55) * eyeOffset,
      this.pos.y + sin(heading + 0.55) * eyeOffset,
      eyeSize
    );
  }
}