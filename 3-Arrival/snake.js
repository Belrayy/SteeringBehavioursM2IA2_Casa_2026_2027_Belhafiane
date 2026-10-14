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
      const progress = map(index, 0, Math.max(1, this.segments.length), 0, 1);
      const segmentColor = lerpColor(color("#b8ffd3"), color("#27b982"), progress);
      this.segments[index].show(segmentColor);
    }

    noStroke();
    fill(52, 211, 153, 48);
    circle(this.pos.x, this.pos.y, this.r * 2.7);
    stroke("#c8ffe0");
    strokeWeight(2);
    fill("#56e6a2");
    circle(this.pos.x, this.pos.y, this.r * 2);

    noStroke();
    const heading = this.vel.magSq() > 0.01 ? this.vel.heading() : 0;
    const eyeOffset = this.r * 0.42;
    const eyeSize = this.r * 0.38;
    fill("#f5fff7");
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
    fill("#11382c");
    const pupilOffset = this.r * 0.09;
    circle(
      this.pos.x + cos(heading - 0.55) * eyeOffset + cos(heading) * pupilOffset,
      this.pos.y + sin(heading - 0.55) * eyeOffset + sin(heading) * pupilOffset,
      eyeSize * 0.43
    );
    circle(
      this.pos.x + cos(heading + 0.55) * eyeOffset + cos(heading) * pupilOffset,
      this.pos.y + sin(heading + 0.55) * eyeOffset + sin(heading) * pupilOffset,
      eyeSize * 0.43
    );
  }
}