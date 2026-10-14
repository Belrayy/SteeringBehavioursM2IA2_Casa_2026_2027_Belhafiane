class Path {
  constructor() {
    // Rayon arbitraire de 20 (c'est la demi-largeur de la route)
    // Un chemin a un rayon qui définit la zone ou le véhicule doit rester
    this.radius = 20;
    // Path = tableau de points (vecteurs)
    this.points = [];
  }

  // Ajout d'un point dans le chemin
  addPoint(x, y) {
    let point = createVector(x, y);
    this.points.push(point);
  }

  // Dessin du chemin
  display() {
    strokeJoin(ROUND);
    strokeCap(ROUND);

    stroke(30, 43, 57, 38);
    strokeWeight(this.radius * 2 + 9);
    noFill();
    beginShape();
    for (let v of this.points) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);

    stroke(48, 59, 72);
    strokeWeight(this.radius * 2);
    beginShape();
    for (let v of this.points) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);

    stroke(218, 226, 231, 175);
    strokeWeight(2);
    for (let i = 0; i < this.points.length; i += 2) {
      const start = this.points[i];
      const end = this.points[(i + 1) % this.points.length];
      line(start.x, start.y, end.x, end.y);
    }
  }
}
