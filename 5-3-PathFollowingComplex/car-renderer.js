function renderCar(vehicle) {
  push();
  translate(vehicle.pos.x, vehicle.pos.y);
  rotate(vehicle.vel.heading());
  rectMode(CENTER);

  noStroke();
  fill(19, 30, 43, 45);
  ellipse(1, 2, 38, 23);

  fill(17, 25, 34);
  rect(-8, -8, 10, 5, 2);
  rect(8, -8, 10, 5, 2);
  rect(-8, 8, 10, 5, 2);
  rect(8, 8, 10, 5, 2);

  fill(vehicle.couleur);
  stroke(17, 25, 34, 210);
  strokeWeight(1.25);
  rect(0, 0, 33, 16, 6);

  noStroke();
  fill(31, 49, 62);
  rect(2, 0, 15, 10, 3);
  rect(-8, 0, 5, 9, 2);

  fill(255, 243, 185);
  rect(15, -4, 2, 3, 1);
  rect(15, 4, 2, 3, 1);

  fill(245, 94, 92);
  rect(-15, -4, 2, 3, 1);
  rect(-15, 4, 2, 3, 1);
  pop();
}
