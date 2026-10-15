function renderEcosystemWorld() {
  background(15, 57, 35);
  camera(height * 0.7, -height * 1.5, height * 1.15, 0, 0, 0, 0, 0, -1);
  ortho(-width * 0.78, width * 0.78, -height * 0.78, height * 0.78, 1, 5000);
  ambientLight(115, 145, 115);
  directionalLight(235, 245, 220, -0.45, -1, -0.3);
  directionalLight(95, 155, 112, 0.55, -0.4, 0.5);

  push();
  translate(-width * 0.18, 0, 0);
  push();
  translate(0, 25, 0);
  noStroke();
  ambientMaterial(28, 101, 55);
  box(width * 1.12, 24, height * 1.12);
  pop();

  drawWorldGrid();

  for (const plant of sim.plants) drawPlantModel(plant);
  for (const sheep of sim.sheep) drawSheepModel(sheep);
  for (const wolf of sim.wolves) drawWolfModel(wolf);
  if (sim.debug) drawDetectionRadii();
  pop();
}

function drawWorldGrid() {
  push();
  stroke(91, 160, 99, 80);
  strokeWeight(1);
  for (let x = -width / 2; x <= width / 2; x += 70) {
    line(x, 12, -height / 2, x, 12, height / 2);
  }
  for (let z = -height / 2; z <= height / 2; z += 70) {
    line(-width / 2, 12, z, width / 2, 12, z);
  }
  pop();
}

function drawDetectionRadii() {
  push();
  noFill();
  strokeWeight(1.5);
  for (const wolf of sim.wolves) {
    stroke(75, 255, 150, 185);
    drawGroundRing(wolf, wolf.detectionRadius);
  }
  for (const sheep of sim.sheep) {
    stroke(255, 216, 88, 185);
    drawGroundRing(sheep, sheep.detectionRadius);
  }
  pop();
}

function drawGroundRing(entity, radius) {
  push();
  translate(entity.pos.x - width / 2, 8, entity.pos.y - height / 2);
  rotateX(HALF_PI);
  ellipse(0, 0, radius * 2, radius * 2);
  pop();
}

function entityWorldPosition(entity, elevation) {
  translate(entity.pos.x - width / 2, elevation, entity.pos.y - height / 2);
}

function drawWolfModel(wolf) {
  const s = wolf.size;
  const stride = Math.sin(millis() * 0.012 + wolf.seed) * 0.22;
  push();
  entityWorldPosition(wolf, -8 * s);
  rotateY(Math.atan2(wolf.vel.x, -wolf.vel.y));
  noStroke();

  ambientMaterial(123, 78, 54);
  push();
  scale(0.8 * s, 0.63 * s, 1.15 * s);
  sphere(11, 12, 8);
  pop();
  ambientMaterial(151, 105, 72);
  push();
  translate(0, -2 * s, -10 * s);
  scale(0.62 * s, 0.58 * s, 0.62 * s);
  sphere(8, 12, 8);
  pop();
  ambientMaterial(83, 56, 43);
  push();
  translate(0, 1 * s, -16 * s);
  scale(0.37 * s, 0.3 * s, 0.42 * s);
  sphere(5, 10, 8);
  pop();

  ambientMaterial(97, 65, 48);
  for (const side of [-1, 1]) {
    push();
    translate(side * 4.1 * s, -8.7 * s, -11.2 * s);
    rotateZ(side * -0.12);
    cone(2.5 * s, 7 * s, 7, 1);
    pop();
  }

  ambientMaterial(76, 54, 42);
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      push();
      translate(side * 5.1 * s, 3 * s, front * 6.5 * s);
      rotateX(front * stride);
      cylinder(1.65 * s, 9 * s, 7, 1);
      pop();
    }
  }
  push();
  translate(0, -1 * s, 11 * s);
  rotateX(0.9 + stride);
  cylinder(1.8 * s, 12 * s, 7, 1);
  pop();

  ambientMaterial(242, 193, 128);
  push();
  translate(-2.5 * s, -3.5 * s, -14.3 * s);
  sphere(1.1 * s, 5, 4);
  translate(5 * s, 0, 0);
  sphere(1.1 * s, 5, 4);
  pop();

  if (sim.debug) drawHealthBar(wolf, 15 * s);
  pop();
}

function drawSheepModel(sheep) {
  const s = sheep.size;
  const stride = Math.sin(millis() * 0.01 + sheep.seed) * 0.16;
  const coat = lerpColor(color(217, 212, 183), color(247, 239, 211), sheep.health / sheep.maxHealth);
  push();
  entityWorldPosition(sheep, -7 * s);
  rotateY(Math.atan2(sheep.vel.x, -sheep.vel.y));
  noStroke();

  ambientMaterial(coat);
  push();
  scale(0.92 * s, 0.78 * s, 1.15 * s);
  sphere(10, 12, 9);
  pop();
  for (let i = 0; i < 7; i++) {
    const a = i * TWO_PI / 7;
    push();
    translate(Math.cos(a) * 5.4 * s, -4.4 * s, Math.sin(a) * 6.2 * s);
    sphere(4.8 * s, 8, 6);
    pop();
  }
  ambientMaterial(122, 83, 63);
  push();
  translate(0, -2 * s, -10 * s);
  scale(0.5 * s, 0.55 * s, 0.62 * s);
  sphere(7, 10, 8);
  pop();
  ambientMaterial(91, 61, 53);
  for (const side of [-1, 1]) {
    push();
    translate(side * 4.2 * s, -5.2 * s, -10 * s);
    rotateZ(side * 0.8);
    ellipsoid(1.6 * s, 2.2 * s, 5.4 * s);
    pop();
  }
  ambientMaterial(58, 42, 38);
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      push();
      translate(side * 4.8 * s, 3.8 * s, front * 6.3 * s);
      rotateX(front * stride);
      cylinder(1.15 * s, 8.5 * s, 6, 1);
      pop();
    }
  }
  ambientMaterial(26, 23, 22);
  push();
  translate(-1.7 * s, -3.1 * s, -14.6 * s);
  sphere(0.85 * s, 5, 4);
  translate(3.4 * s, 0, 0);
  sphere(0.85 * s, 5, 4);
  pop();

  if (sim.debug) drawHealthBar(sheep, 15 * s);
  pop();
}

function drawPlantModel(plant) {
  const s = plant.size;
  const colors = [
    [93, 199, 87],
    [222, 158, 55],
    [190, 57, 65],
  ];
  const plantColor = colors[plant.toxicity];
  push();
  entityWorldPosition(plant, 0);
  noStroke();

  ambientMaterial(57, 126, 58);
  push();
  translate(0, -9 * s, 0);
  cylinder(1.2 * s, 18 * s, 7, 1);
  pop();

  for (const side of [-1, 1]) {
    push();
    translate(side * 4.8 * s, -9 * s, side * 1.6 * s);
    rotateZ(side * 0.8);
    if (plant.toxicity === 0) ambientMaterial(73, 181, 75);
    else ambientMaterial(59, 133, 67);
    ellipsoid(2.2 * s, 1.2 * s, 5.4 * s);
    pop();
  }

  if (plant.toxicity === 0) {
    ambientMaterial(plantColor);
    push();
    translate(0, -20 * s, 0);
    sphere(5.5 * s, 9, 7);
    for (let i = 0; i < 5; i++) {
      rotateY(TWO_PI / 5);
      push();
      translate(0, -1.5 * s, 6 * s);
      ellipsoid(2.8 * s, 2.2 * s, 4.5 * s);
      pop();
    }
    pop();
    ambientMaterial(252, 215, 85);
    push();
    translate(0, -20 * s, 0);
    sphere(2.4 * s, 8, 6);
    pop();
  } else if (plant.toxicity === 1) {
    ambientMaterial(plantColor);
    push();
    translate(0, -18 * s, 0);
    cone(5.5 * s, 12 * s, 7, 1);
    translate(0, -7 * s, 0);
    sphere(3.1 * s, 8, 6);
    pop();
  } else {
    ambientMaterial(plantColor);
    push();
    translate(0, -19 * s, 0);
    sphere(4.6 * s, 9, 7);
    for (let i = 0; i < 5; i++) {
      rotateY(TWO_PI / 5);
      push();
      translate(0, 0, 5 * s);
      cone(2 * s, 9 * s, 6, 1);
      pop();
    }
    pop();
    ambientMaterial(74, 47, 72);
    push();
    translate(0, -15 * s, 0);
    sphere(2.2 * s, 7, 5);
    pop();
  }
  pop();
}

function drawHealthBar(entity, lift) {
  const ratio = Math.max(0, Math.min(1, entity.health / entity.maxHealth));
  push();
  translate(0, -lift, 0);
  rotateX(HALF_PI);
  noStroke();
  fill(55, 31, 31, 190);
  rect(-7, -1.5, 14, 3);
  fill(95, 221, 111);
  rect(-7, -1.5, 14 * ratio, 3);
  pop();
}
