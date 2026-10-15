const settings = {
  initialPlants: 60,
  initialWolves: 5,
  initialSheep: 32,
  plantSpawnRate: 1.2,
};

const sim = {
  running: true,
  time: 0,
  debug: false,
  deaths: 0,
  births: 0,
  plantSpawnAccumulator: 0,
  tickAccumulator: 0,
  statsClock: 0,
  wolves: [],
  sheep: [],
  plants: [],
};

const ui = {};
const TOXICITY = {
  SAFE: 0,
  POISONOUS: 1,
  LETHAL: 2,
};

function setup() {
  randomSeed(2026);
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  initControls();
  resetSimulation();
}

function initControls() {
  ui.panel = createDiv('');
  ui.panel.class('panel');
  ui.panel.position(18, 18);
  ui.panel.html(`
    <h2>Ecosystem Evolution</h2>
    <div class="button-row">
      <button id="startPauseBtn" type="button">Pause</button>
      <button id="resetBtn" type="button">Reset</button>
    </div>
    <div class="control-group">
      <div class="label-row">
        <label>Plant spawn rate</label>
        <span id="plantSpawnValue">1.20 plants/s</span>
      </div>
      <input id="plantSpawnSlider" type="range" min="0" max="2" step="0.05" value="1.2">
    </div>
    <div class="control-group">
      <div class="label-row">
        <label>Initial plants</label>
        <span id="initialPlantsValue">60</span>
      </div>
      <input id="initialPlantsSlider" type="range" min="10" max="120" step="1" value="60">
    </div>
    <div class="control-group">
      <div class="label-row">
        <label>Initial wolves</label>
        <span id="initialWolvesValue">5</span>
      </div>
      <input id="initialWolvesSlider" type="range" min="2" max="24" step="1" value="5">
    </div>
    <div class="control-group">
      <div class="label-row">
        <label>Initial sheep</label>
        <span id="initialSheepValue">32</span>
      </div>
      <input id="initialSheepSlider" type="range" min="5" max="80" step="1" value="32">
    </div>
    <div class="toggle-row">
      <label class="checkbox-label" for="debugToggle">Debug overlay</label>
      <input id="debugToggle" type="checkbox">
    </div>
    <div class="legend">
      <div class="legend-title">Plant toxicity</div>
      <div class="legend-item"><span class="dot safe"></span>Safe: heals sheep</div>
      <div class="legend-item"><span class="dot poisonous"></span>Poisonous: 1.4 HP damage before resistance</div>
      <div class="legend-item"><span class="dot lethal"></span>Lethal: 3.2 HP; only highly resistant sheep eat it</div>
      <p class="rule-note">No passive HP drain: animals grow with age. Eating can restore HP or cause toxicity damage. When over 40% of plants are toxic, sheep develop resistance and pass it down with small mutations. New plants track the field's average toxicity. At 300 plants, new spawns replace the oldest.</p>
    </div>
    <div id="statsPanel" class="stats-panel"></div>
  `);

  ui.startPauseBtn = select('#startPauseBtn');
  ui.resetBtn = select('#resetBtn');
  ui.plantSpawnSlider = select('#plantSpawnSlider');
  ui.initialPlantsSlider = select('#initialPlantsSlider');
  ui.initialWolvesSlider = select('#initialWolvesSlider');
  ui.initialSheepSlider = select('#initialSheepSlider');
  ui.plantSpawnValue = select('#plantSpawnValue');
  ui.initialPlantsValue = select('#initialPlantsValue');
  ui.initialWolvesValue = select('#initialWolvesValue');
  ui.initialSheepValue = select('#initialSheepValue');
  ui.debugToggle = select('#debugToggle');
  ui.statsPanel = select('#statsPanel');

  ui.startPauseBtn.mousePressed(toggleSimulation);
  ui.resetBtn.mousePressed(resetSimulation);
  ui.plantSpawnSlider.input(() => {
    settings.plantSpawnRate = Number(ui.plantSpawnSlider.value());
    ui.plantSpawnValue.html(`${settings.plantSpawnRate.toFixed(2)} plants/s`);
  });
  ui.initialPlantsSlider.input(() => {
    settings.initialPlants = Number(ui.initialPlantsSlider.value());
    ui.initialPlantsValue.html(String(settings.initialPlants));
  });
  ui.initialWolvesSlider.input(() => {
    settings.initialWolves = Number(ui.initialWolvesSlider.value());
    ui.initialWolvesValue.html(String(settings.initialWolves));
  });
  ui.initialSheepSlider.input(() => {
    settings.initialSheep = Number(ui.initialSheepSlider.value());
    ui.initialSheepValue.html(String(settings.initialSheep));
  });
  ui.debugToggle.input(() => {
    sim.debug = ui.debugToggle.checked();
  });

  updateControlLabels();
}

function updateControlLabels() {
  ui.plantSpawnValue.html(`${settings.plantSpawnRate.toFixed(2)} plants/s`);
  ui.initialPlantsValue.html(String(settings.initialPlants));
  ui.initialWolvesValue.html(String(settings.initialWolves));
  ui.initialSheepValue.html(String(settings.initialSheep));
}

function toggleSimulation() {
  sim.running = !sim.running;
  ui.startPauseBtn.html(sim.running ? 'Pause' : 'Start');
}

function resetSimulation() {
  sim.time = 0;
  sim.deaths = 0;
  sim.births = 0;
  sim.plantSpawnAccumulator = 0;
  sim.tickAccumulator = 0;
  sim.statsClock = 0;
  sim.wolves = [];
  sim.sheep = [];
  sim.plants = [];

  settings.initialPlants = Number(ui.initialPlantsSlider.value());
  settings.initialWolves = Number(ui.initialWolvesSlider.value());
  settings.initialSheep = Number(ui.initialSheepSlider.value());
  settings.plantSpawnRate = Number(ui.plantSpawnSlider.value());
  updateControlLabels();

  for (let i = 0; i < settings.initialPlants; i++) {
    sim.plants.push(new Plant(random(width * 0.08, width * 0.92), random(height * 0.18, height * 0.92), undefined));
  }
  for (let i = 0; i < settings.initialWolves; i++) {
    sim.wolves.push(new Wolf(random(width * 0.08, width * 0.92), random(height * 0.18, height * 0.92), undefined));
  }
  for (let i = 0; i < settings.initialSheep; i++) {
    sim.sheep.push(new Sheep(random(width * 0.08, width * 0.92), random(height * 0.18, height * 0.92), undefined));
  }

  sim.running = true;
  ui.startPauseBtn.html('Pause');
  ui.debugToggle.checked(false);
  sim.debug = false;
}

function draw() {
  renderEcosystemWorld();

  if (sim.running) {
    sim.tickAccumulator = Math.min(0.2, sim.tickAccumulator + deltaTime / 1000);
    const dt = 1 / 60;
    while (sim.tickAccumulator >= dt) {
      sim.time += dt;
      spawnPlantsByRate(dt);
      updateWolves(dt);
      updateSheep(dt);
      updatePlants(dt);
      pruneDeadEntities();
      sim.tickAccumulator -= dt;
    }
  }

  sim.statsClock += deltaTime / 1000;
  if (sim.statsClock >= 0.25) {
    sim.statsClock = 0;
    renderHud();
  }
}

function spawnPlantsByRate(dt) {
  sim.plantSpawnAccumulator += settings.plantSpawnRate * dt;
  while (sim.plantSpawnAccumulator >= 1) {
    sim.plantSpawnAccumulator -= 1;
    if (sim.plants.length >= 300) {
      const oldest = sim.plants.reduce((current, plant) => plant.age > current.age ? plant : current);
      sim.plants.splice(sim.plants.indexOf(oldest), 1);
      sim.deaths += 1;
    }
    const toxicity = EcosystemRules.sampleToxicityFromAverage(
      EcosystemRules.averageToxicity(sim.plants),
      () => random()
    );
    sim.plants.push(new Plant(random(width * 0.08, width * 0.92), random(height * 0.18, height * 0.92), toxicity));
    sim.births += 1;
  }
}

function updateWolves(dt) {
  for (let i = sim.wolves.length - 1; i >= 0; i--) {
    const wolf = sim.wolves[i];
    wolf.update(dt, sim.sheep, sim.plants, sim.wolves);
    if (wolf.isDead()) {
      sim.wolves.splice(i, 1);
      sim.deaths += 1;
    }
  }
}

function updateSheep(dt) {
  for (let i = sim.sheep.length - 1; i >= 0; i--) {
    const sheep = sim.sheep[i];
    sheep.update(dt, sim.wolves, sim.plants, sim.sheep);
    if (sheep.isDead()) {
      sim.sheep.splice(i, 1);
      sim.deaths += 1;
    }
  }
}

function updatePlants(dt) {
  for (let i = sim.plants.length - 1; i >= 0; i--) {
    const plant = sim.plants[i];
    plant.update(dt, sim.plants);
    if (plant.isDead()) {
      sim.plants.splice(i, 1);
      sim.deaths += 1;
    }
  }
}

function pruneDeadEntities() {
  sim.wolves = sim.wolves.filter((entity) => !entity.isDead());
  sim.sheep = sim.sheep.filter((entity) => !entity.isDead());
  sim.plants = sim.plants.filter((entity) => !entity.isDead());
}

function renderHud() {
  const avgSheepAge = sim.sheep.length ? (sim.sheep.reduce((sum, item) => sum + item.age, 0) / sim.sheep.length).toFixed(1) : '0.0';
  const avgWolfAge = sim.wolves.length ? (sim.wolves.reduce((sum, item) => sum + item.age, 0) / sim.wolves.length).toFixed(1) : '0.0';
  const avgPlantAge = sim.plants.length ? (sim.plants.reduce((sum, item) => sum + item.age, 0) / sim.plants.length).toFixed(1) : '0.0';
  const avgPlantToxicity = EcosystemRules.averageToxicity(sim.plants).toFixed(2);
  const toxicFraction = EcosystemRules.toxicPlantFraction(sim.plants);
  const avgResistance = sim.sheep.length
    ? (sim.sheep.reduce((sum, item) => sum + item.gene.toxinResistance, 0) / sim.sheep.length).toFixed(2)
    : '0.00';
  const avgSheepHealth = sim.sheep.length ? (sim.sheep.reduce((sum, item) => sum + item.health, 0) / sim.sheep.length).toFixed(2) : '0.00';
  const avgWolfHealth = sim.wolves.length ? (sim.wolves.reduce((sum, item) => sum + item.health, 0) / sim.wolves.length).toFixed(2) : '0.00';

  ui.statsPanel.html(`
    <div class="stat-grid">
      <div><span class="stat-label">Time</span><strong>${sim.time.toFixed(1)}s</strong></div>
      <div><span class="stat-label">Deaths</span><strong>${sim.deaths}</strong></div>
      <div><span class="stat-label">Wolves</span><strong>${sim.wolves.length}</strong></div>
      <div><span class="stat-label">Sheep</span><strong>${sim.sheep.length}</strong></div>
      <div><span class="stat-label">Plants</span><strong>${sim.plants.length}</strong></div>
      <div><span class="stat-label">Births</span><strong>${sim.births}</strong></div>
      <div><span class="stat-label">Avg wolf HP</span><strong>${avgWolfHealth}</strong></div>
      <div><span class="stat-label">Avg sheep HP</span><strong>${avgSheepHealth}</strong></div>
      <div><span class="stat-label">Avg wolf age</span><strong>${avgWolfAge}s</strong></div>
      <div><span class="stat-label">Avg sheep age</span><strong>${avgSheepAge}s</strong></div>
      <div><span class="stat-label">Avg plant age</span><strong>${avgPlantAge}s</strong></div>
      <div><span class="stat-label">Avg toxicity</span><strong>${avgPlantToxicity}</strong></div>
      <div><span class="stat-label">Toxic plants</span><strong>${(toxicFraction * 100).toFixed(0)}%</strong></div>
      <div><span class="stat-label">Avg sheep resistance</span><strong>${avgResistance}</strong></div>
    </div>
  `);
}

function clamp(value, minValue, maxValue) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if ((key === 'd' || key === 'D') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    sim.debug = !sim.debug;
    ui.debugToggle.checked(sim.debug);
  }
}

function randomChoice(items) {
  return items[Math.floor(random(items.length))];
}

class LivingEntity extends Vehicle {
  constructor(x, y, maxHealth, dna) {
    super(x, y, dna);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.age = 0;
    this.size = 1;
    this.detectionRadius = 60;
    this.seed = random(10000);
  }

  isDead() {
    return this.health <= 0;
  }

  move() {
    const health = this.health;
    super.update();
    this.health = health;
    const margin = 18;
    if (this.pos.x < margin) {
      this.vel.x += 0.12;
      this.pos.x = margin;
    }
    if (this.pos.x > width - margin) {
      this.vel.x -= 0.12;
      this.pos.x = width - margin;
    }
    if (this.pos.y < margin) {
      this.vel.y += 0.12;
      this.pos.y = margin;
    }
    if (this.pos.y > height - margin) {
      this.vel.y -= 0.12;
      this.pos.y = height - margin;
    }
  }
}

class Wolf extends LivingEntity {
  constructor(x, y, geneSet) {
    super(x, y, 3, undefined);
    this.type = 'wolf';
    this.maxSpeed = 1.7;
    this.maxForce = 0.14;
    this.r = 10;
    this.size = 1.0;
    this.detectionRadius = 130;
    const baseGene = geneSet || {
      pursuit: 1.1 + random(-0.15, 0.25),
      vision: 130 + random(-25, 35),
      chaseBias: 1.0 + random(-0.2, 0.25),
    };
    this.gene = {
      pursuit: clamp(baseGene.pursuit + random(-0.07, 0.07), 0.75, 1.8),
      vision: clamp(baseGene.vision + random(-10, 10), 70, 180),
      chaseBias: clamp(baseGene.chaseBias + random(-0.08, 0.08), 0.7, 1.5),
    };
    this.detectionRadius = this.gene.vision;
    this.lastBirthAt = -Infinity;
    this.health = this.maxHealth;
  }

  update(dt, sheepList, plantList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.05, 1, 1.8);

    let closestSheep = null;
    let closestDist = Infinity;
    for (const sheep of sheepList) {
      const d = p5.Vector.dist(this.pos, sheep.pos);
      if (d < closestDist && d < this.gene.vision) {
        closestDist = d;
        closestSheep = sheep;
      }
    }

    if (closestSheep) {
      const desired = p5.Vector.sub(closestSheep.pos, this.pos);
      desired.normalize();
      desired.mult(this.maxSpeed * this.gene.pursuit * this.gene.chaseBias);
      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce * 1.8);
      this.applyForce(steer);

      if (closestDist < this.r + closestSheep.r + 6) {
        closestSheep.health = 0;
        this.health = clamp(this.health + 1.2, 0, this.maxHealth);
        const index = sheepList.indexOf(closestSheep);
        if (index >= 0) {
          sheepList.splice(index, 1);
          sim.deaths += 1;
          this.reproduceAfterFeeding();
        }
      }
    }

    const wander = createVector(random(-1, 1), random(-1, 1));
    wander.normalize();
    wander.mult(this.maxForce * 0.2);
    this.applyForce(wander);
    this.move();
  }

  reproduceAfterFeeding() {
    if (!EcosystemRules.canReproduce(this.age, this.lastBirthAt, sim.time, 10, 16, sim.wolves.length, 12)) return;
    sim.wolves.push(new Wolf(
      this.pos.x + random(-18, 18),
      this.pos.y + random(-18, 18),
      { ...this.gene }
    ));
    this.lastBirthAt = sim.time;
    sim.births += 1;
  }

}

class Sheep extends LivingEntity {
  constructor(x, y, geneSet) {
    super(x, y, 4, undefined);
    this.type = 'sheep';
    this.maxSpeed = 3.2;
    this.maxForce = 0.14;
    this.r = 9;
    this.detectionRadius = 110;
    const baseGene = geneSet || {
      threatRadius: 125 + random(-18, 25),
      foodRadius: 120 + random(-15, 25),
      avoidToxicity: 0.9 + random(-0.2, 0.4),
      speed: 0.95 + random(-0.1, 0.25),
      toxinResistance: 0.05 + random(0, 0.18),
    };
    this.gene = {
      threatRadius: clamp(baseGene.threatRadius + random(-8, 8), 80, 170),
      foodRadius: clamp(baseGene.foodRadius + random(-10, 10), 90, 170),
      avoidToxicity: clamp(baseGene.avoidToxicity + random(-0.06, 0.06), 0.6, 1.5),
      speed: clamp(baseGene.speed + random(-0.05, 0.05), 0.7, 1.5),
      toxinResistance: EcosystemRules.inheritResistance(
        baseGene.toxinResistance,
        random(-0.035, 0.035)
      ),
    };
    this.detectionRadius = this.gene.threatRadius;
    this.lastBirthAt = -Infinity;
    this.health = this.maxHealth;
  }

  update(dt, wolfList, plantList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.04, 1, 1.9);
    this.gene.toxinResistance = EcosystemRules.adaptResistance(
      this.gene.toxinResistance,
      EcosystemRules.toxicPlantFraction(plantList),
      dt
    );

    let closestWolf = null;
    let closestWolfDist = Infinity;
    for (const wolf of wolfList) {
      const d = p5.Vector.dist(this.pos, wolf.pos);
      if (d < this.gene.threatRadius && d < closestWolfDist) {
        closestWolfDist = d;
        closestWolf = wolf;
      }
    }

    if (closestWolf) {
      const flee = p5.Vector.sub(this.pos, closestWolf.pos);
      flee.normalize();
      flee.mult(this.maxSpeed * 2.2 * this.gene.speed);
      const steer = p5.Vector.sub(flee, this.vel);
      steer.limit(this.maxForce * 2.4);
      this.applyForce(steer);
    } else {
      let bestPlant = null;
      let bestScore = -Infinity;
      for (const plant of plantList) {
        const d = p5.Vector.dist(this.pos, plant.pos);
        if (d > plant.r + this.r + 2 && d < this.gene.foodRadius) {
          if (plant.toxicity === TOXICITY.LETHAL && this.gene.toxinResistance < 0.75) continue;
          const toxicityPenalty = EcosystemRules.toxinDamage(plant.toxicity, this.gene.toxinResistance) * 34;
          const score = 180 - d - toxicityPenalty * this.gene.avoidToxicity;
          if (score > bestScore) {
            bestScore = score;
            bestPlant = plant;
          }
        }
      }
      if (bestPlant) {
        const desired = p5.Vector.sub(bestPlant.pos, this.pos);
        desired.normalize();
        desired.mult(this.maxSpeed * 1.3 * this.gene.speed);
        const steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce * 1.7);
        this.applyForce(steer);
      }
    }

    for (let i = plantList.length - 1; i >= 0; i--) {
      if (this.health <= 0) break;
      const plant = plantList[i];
      const d = p5.Vector.dist(this.pos, plant.pos);
      if (d < plant.r + this.r + 4) {
        if (plant.toxicity === TOXICITY.LETHAL && this.gene.toxinResistance < 0.75) continue;
        const damage = EcosystemRules.toxinDamage(plant.toxicity, this.gene.toxinResistance);
        this.health = plant.toxicity === TOXICITY.SAFE
          ? clamp(this.health + 1.2, 0, this.maxHealth)
          : clamp(this.health - damage, 0, this.maxHealth);
        plant.health = 0;
        plantList.splice(i, 1);
        sim.deaths += 1;
        if (this.health > 0) this.reproduceAfterFeeding();
      }
    }

    if (this.health <= 0) {
      this.health = 0;
    }

    this.move();
  }

  reproduceAfterFeeding() {
    if (!EcosystemRules.canReproduce(this.age, this.lastBirthAt, sim.time, 1.5, 1, sim.sheep.length, 180)) return;
    sim.sheep.push(new Sheep(
      this.pos.x + random(-20, 20),
      this.pos.y + random(-20, 20),
      { ...this.gene }
    ));
    this.lastBirthAt = sim.time;
    sim.births += 1;
  }

}

class Plant extends LivingEntity {
  constructor(x, y, inheritedToxicity) {
    super(x, y, 5, undefined);
    this.type = 'plant';
    this.maxSpeed = 0;
    this.maxForce = 0;
    this.r = 7;
    this.age = 0;
    this.toxicity = inheritedToxicity == null
      ? randomChoice([TOXICITY.SAFE, TOXICITY.SAFE, TOXICITY.POISONOUS, TOXICITY.LETHAL])
      : clamp(Math.round(inheritedToxicity), 0, 2);
    this.growthBias = random(-0.2, 0.25);
    this.vel.set(0, 0);
    this.health = this.maxHealth;
  }

  update(dt, plantList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.06, 1, 2);
    this.move();
  }

}