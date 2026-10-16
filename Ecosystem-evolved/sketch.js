const settings = {
  initialPlants: EcosystemConfig.initial.plants,
  initialWolves: EcosystemConfig.initial.wolves,
  initialSheep: EcosystemConfig.initial.sheep,
  plantSpawnRate: EcosystemConfig.initial.plantSpawnRate,
};

const sim = {
  running: true,
  time: 0,
  debug: false,
  deaths: 0,
  births: 0,
  animalDeaths: 0,
  plantRemovals: 0,
  wolfBirths: 0,
  sheepBirths: 0,
  plantSpawns: 0,
  plantSpawnAccumulator: 0,
  tickAccumulator: 0,
  statsClock: 0,
  wolves: [],
  sheep: [],
  plants: [],
};

const ui = {};
const TOXICITY = {
  SAFE: EcosystemConfig.plant.safe,
  POISONOUS: EcosystemConfig.plant.poisonous,
  LETHAL: EcosystemConfig.plant.lethal,
};

function setup() {
  randomSeed(EcosystemConfig.simulation.seed);
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
    <button id="reportBtn" class="report-button" type="button">Download PDF report</button>
    <p id="reportStatus" class="report-status" role="status" aria-live="polite"></p>
    <div class="control-group">
      <div class="label-row">
        <label>Plant spawn rate</label>
        <span id="plantSpawnValue">1.20 plants/s</span>
      </div>
      <input id="plantSpawnSlider" type="range" min="0" max="${EcosystemConfig.simulation.maxPlantSpawnRate}" step="0.05" value="${EcosystemConfig.initial.plantSpawnRate}">
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
      <div class="legend-item"><span class="dot poisonous"></span>Poisonous: ${EcosystemConfig.toxicity.poisonDamage} HP damage before resistance</div>
      <div class="legend-item"><span class="dot lethal"></span>Lethal: ${EcosystemConfig.toxicity.lethalDamage} HP; only resistant sheep eat it</div>
      <p class="rule-note">Movement and costly traits use energy. Food restores energy, and animals starve if it runs out. Reproduction costs energy. Toxin resistance is inherited with small mutations; higher resistance costs more energy. Plants detoxify one level every ${EcosystemConfig.plant.detoxInterval} seconds. At ${EcosystemConfig.simulation.maxPlants} plants, new spawns replace the oldest.</p>
    </div>
    <div id="statsPanel" class="stats-panel"></div>
  `);

  ui.startPauseBtn = select('#startPauseBtn');
  ui.resetBtn = select('#resetBtn');
  ui.reportBtn = select('#reportBtn');
  ui.reportStatus = select('#reportStatus');
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
  ui.reportBtn.mousePressed(downloadEcosystemReport);
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
  randomSeed(EcosystemConfig.simulation.seed);
  sim.time = 0;
  sim.deaths = 0;
  sim.births = 0;
  sim.animalDeaths = 0;
  sim.plantRemovals = 0;
  sim.wolfBirths = 0;
  sim.sheepBirths = 0;
  sim.plantSpawns = 0;
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
    const dt = EcosystemConfig.simulation.fixedStep;
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
    if (sim.plants.length >= EcosystemConfig.simulation.maxPlants) {
      const oldest = sim.plants.reduce((current, plant) => plant.age > current.age ? plant : current);
      sim.plants.splice(sim.plants.indexOf(oldest), 1);
      sim.deaths += 1;
      sim.plantRemovals += 1;
    }
    const toxicity = EcosystemRules.sampleToxicityFromAverage(
      EcosystemRules.averageToxicity(sim.plants),
      () => random(),
      EcosystemConfig.plant.mutationRate
    );
    sim.plants.push(new Plant(random(width * 0.08, width * 0.92), random(height * 0.18, height * 0.92), toxicity));
    sim.births += 1;
    sim.plantSpawns += 1;
  }
}

function updateWolves(dt) {
  for (let i = sim.wolves.length - 1; i >= 0; i--) {
    const wolf = sim.wolves[i];
    wolf.update(dt, sim.sheep);
    if (wolf.isDead()) {
      sim.wolves.splice(i, 1);
      sim.deaths += 1;
      sim.animalDeaths += 1;
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
      sim.animalDeaths += 1;
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
      sim.plantRemovals += 1;
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
  const avgWolfEnergy = sim.wolves.length ? sim.wolves.reduce((sum, item) => sum + item.energy, 0) / sim.wolves.length : 0;
  const avgSheepEnergy = sim.sheep.length ? sim.sheep.reduce((sum, item) => sum + item.energy, 0) / sim.sheep.length : 0;

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
      <div><span class="stat-label">Avg wolf energy</span><strong>${avgWolfEnergy.toFixed(0)}%</strong></div>
      <div><span class="stat-label">Avg sheep energy</span><strong>${avgSheepEnergy.toFixed(0)}%</strong></div>
      <div><span class="stat-label">Avg wolf age</span><strong>${avgWolfAge}s</strong></div>
      <div><span class="stat-label">Avg sheep age</span><strong>${avgSheepAge}s</strong></div>
      <div><span class="stat-label">Avg plant age</span><strong>${avgPlantAge}s</strong></div>
      <div><span class="stat-label">Avg toxicity</span><strong>${avgPlantToxicity}</strong></div>
      <div><span class="stat-label">Toxic plants</span><strong>${(toxicFraction * 100).toFixed(0)}%</strong></div>
      <div><span class="stat-label">Avg sheep resistance</span><strong>${avgResistance}</strong></div>
    </div>
  `);
}

function downloadEcosystemReport() {
  try {
    const report = EcosystemReport.createReport(sim, settings);
    const pdf = EcosystemReport.createPdf(report);
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecosystem-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    ui.reportStatus.html('PDF report generated. Check your downloads if it did not save automatically.');
  } catch (error) {
    console.error('Could not generate the ecosystem PDF report.', error);
    ui.reportStatus.html('The PDF report could not be generated. Check the browser console for details.');
  }
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
    this.maxEnergy = 100;
    this.energy = this.maxEnergy;
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
    const originalMaxForce = this.maxForce;
    const nearBoundary = this.pos.x < 70
      || this.pos.x > width - 70
      || this.pos.y < 70
      || this.pos.y > height - 70;
    if (nearBoundary) this.maxForce = Math.max(originalMaxForce, 0.6);
    this.boundaries();
    this.maxForce = originalMaxForce;
    super.update();
    this.health = health;
  }

  updateEnergy(dt, drainRate, starvationDamagePerSecond) {
    this.energy = EcosystemRules.updateEnergy(this.energy, 0, drainRate, dt, this.maxEnergy);
    this.health = Math.max(
      0,
      this.health - EcosystemRules.starvationDamage(this.energy, dt, starvationDamagePerSecond)
    );
  }
}

class Wolf extends LivingEntity {
  constructor(x, y, geneSet) {
    super(x, y, EcosystemConfig.wolf.maxHealth, undefined);
    this.type = 'wolf';
    this.maxEnergy = EcosystemConfig.wolf.maxEnergy;
    this.energy = EcosystemConfig.wolf.initialEnergy;
    this.baseMaxSpeed = EcosystemConfig.wolf.baseSpeed;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = EcosystemConfig.wolf.maxForce;
    this.r = 10;
    this.size = 1.0;
    this.detectionRadius = 130;
    const baseGene = geneSet || {
      pursuit: EcosystemConfig.wolf.pursuitInitial
        + random(...EcosystemConfig.wolf.pursuitInitialMutation),
      vision: EcosystemConfig.wolf.initialVision
        + random(...EcosystemConfig.wolf.visionInitialMutation),
      stamina: EcosystemConfig.wolf.staminaInitial
        + random(...EcosystemConfig.wolf.staminaInitialMutation),
    };
    this.gene = {
      pursuit: clamp(
        baseGene.pursuit + random(-EcosystemConfig.wolf.pursuitMutation, EcosystemConfig.wolf.pursuitMutation),
        EcosystemConfig.wolf.pursuitMin,
        EcosystemConfig.wolf.pursuitMax
      ),
      vision: clamp(
        baseGene.vision + random(-EcosystemConfig.wolf.visionMutation, EcosystemConfig.wolf.visionMutation),
        EcosystemConfig.wolf.visionMin,
        EcosystemConfig.wolf.visionMax
      ),
      stamina: clamp(
        baseGene.stamina + random(-EcosystemConfig.wolf.staminaMutation, EcosystemConfig.wolf.staminaMutation),
        EcosystemConfig.wolf.staminaMin,
        EcosystemConfig.wolf.staminaMax
      ),
    };
    this.maxSpeed = this.baseMaxSpeed * this.gene.stamina;
    this.detectionRadius = this.gene.vision;
    this.lastBirthAt = -Infinity;
    this.lastHuntAt = -Infinity;
    this.wanderHeading = this.vel.heading();
    this.health = this.maxHealth;
  }

  update(dt, sheepList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.05, 1, 1.8);
    this.maxSpeed = this.baseMaxSpeed * this.gene.stamina * (0.45 + 0.55 * this.energy / this.maxEnergy);

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
      desired.mult(this.maxSpeed * this.gene.pursuit);
      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce * 1.8);
      this.applyForce(steer);

      const huntCooldown = EcosystemRules.predationCooldown(
        sheepList.length,
        EcosystemConfig.wolf.huntCooldown,
        EcosystemConfig.wolf.huntPreyReference
      );
      if (closestDist < this.r + closestSheep.r + 6
        && sim.time - this.lastHuntAt >= huntCooldown) {
        const index = sheepList.indexOf(closestSheep);
        if (index >= 0) {
          sheepList.splice(index, 1);
          this.lastHuntAt = sim.time;
          this.health = clamp(this.health + 1.2, 0, this.maxHealth);
          this.energy = EcosystemRules.updateEnergy(
            this.energy,
            EcosystemConfig.wolf.mealEnergy,
            0,
            dt,
            this.maxEnergy
          );
          sim.deaths += 1;
          sim.animalDeaths += 1;
          this.reproduceAfterFeeding();
        }
      }
    }

    if (!closestSheep) {
      this.wanderHeading = SheepSteering.updateWanderHeading(
        this.wanderHeading,
        random(-0.08, 0.08)
      );
      const wander = SheepSteering.wanderForce(
        this.vel,
        this.wanderHeading,
        this.maxSpeed,
        this.maxForce * 0.2
      );
      this.applyForce(createVector(wander.x, wander.y));
    }
    const visionCost = (this.gene.vision - EcosystemConfig.wolf.visionMin)
      / (EcosystemConfig.wolf.visionMax - EcosystemConfig.wolf.visionMin)
      * EcosystemConfig.wolf.visionEnergyDrain;
    const drainRate = EcosystemRules.energyDrainRate(
      EcosystemConfig.wolf.baseEnergyDrain,
      EcosystemConfig.wolf.movementEnergyDrain * this.gene.stamina,
      this.vel.mag() / Math.max(this.maxSpeed, 0.01),
      visionCost
    );
    this.updateEnergy(dt, drainRate, EcosystemConfig.wolf.starvationDamagePerSecond);
    this.move();
  }

  reproduceAfterFeeding() {
    const config = EcosystemConfig.wolf;
    if (!EcosystemRules.canReproduce(
      this.age,
      this.lastBirthAt,
      sim.time,
      config.maturityAge,
      config.reproductionCooldown,
      sim.wolves.length,
      config.populationCap,
      this.energy,
      config.birthEnergyThreshold
    )) return;
    this.energy -= config.reproductionEnergyCost;
    const offspring = new Wolf(
      this.pos.x + random(-18, 18),
      this.pos.y + random(-18, 18),
      { ...this.gene }
    );
    offspring.energy = config.offspringEnergy;
    sim.wolves.push(offspring);
    this.lastBirthAt = sim.time;
    sim.births += 1;
    sim.wolfBirths += 1;
  }

}

class Sheep extends LivingEntity {
  constructor(x, y, geneSet) {
    super(x, y, EcosystemConfig.sheep.maxHealth, undefined);
    this.type = 'sheep';
    this.maxEnergy = EcosystemConfig.sheep.maxEnergy;
    this.energy = EcosystemConfig.sheep.initialEnergy;
    this.baseMaxSpeed = EcosystemConfig.sheep.baseSpeed;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = 0.14;
    this.r = 9;
    this.detectionRadius = 110;
    const baseGene = geneSet || {
      threatRadius: 125 + random(-18, 25),
      foodRadius: 120 + random(-15, 25),
      avoidToxicity: 0.9 + random(-0.2, 0.4),
      speed: 0.95 + random(-0.1, 0.25),
      toxinResistance: random(0, EcosystemConfig.toxicity.maximumResistance),
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
    this.wanderHeading = this.vel.heading();
    this.health = this.maxHealth;
  }

  update(dt, wolfList, plantList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.04, 1, 1.9);
    this.maxSpeed = this.baseMaxSpeed
      * this.gene.speed
      * (0.45 + 0.55 * this.energy / this.maxEnergy);

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
      flee.mult(this.maxSpeed * 2.2);
      const steer = p5.Vector.sub(flee, this.vel);
      steer.limit(this.maxForce * 2.4);
      this.applyForce(steer);
    } else {
      let bestPlant = null;
      let bestScore = -Infinity;
      for (const plant of plantList) {
        const d = p5.Vector.dist(this.pos, plant.pos);
        if (d > plant.r + this.r + 2 && d < this.gene.foodRadius) {
          if (plant.toxicity === TOXICITY.LETHAL
            && this.gene.toxinResistance < EcosystemConfig.toxicity.lethalResistanceThreshold) continue;
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
        desired.mult(this.maxSpeed * 1.3);
        const steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce * 1.7);
        this.applyForce(steer);
      } else {
        this.wanderHeading = SheepSteering.updateWanderHeading(
          this.wanderHeading,
          random(-0.08, 0.08)
        );
        const wanderForce = SheepSteering.wanderForce(
          this.vel,
          this.wanderHeading,
          this.maxSpeed,
          this.maxForce * 0.7
        );
        this.applyForce(createVector(wanderForce.x, wanderForce.y));
      }
    }

    for (let i = plantList.length - 1; i >= 0; i--) {
      if (this.health <= 0) break;
      const plant = plantList[i];
      const d = p5.Vector.dist(this.pos, plant.pos);
      if (d < plant.r + this.r + 4) {
        if (plant.toxicity === TOXICITY.LETHAL
          && this.gene.toxinResistance < EcosystemConfig.toxicity.lethalResistanceThreshold) continue;
        const damage = EcosystemRules.toxinDamage(plant.toxicity, this.gene.toxinResistance);
        this.health = plant.toxicity === TOXICITY.SAFE
          ? clamp(this.health + 1.2, 0, this.maxHealth)
          : clamp(this.health - damage, 0, this.maxHealth);
        const mealEnergy = plant.toxicity === TOXICITY.SAFE
          ? EcosystemConfig.sheep.foodEnergy
          : EcosystemConfig.sheep.toxicFoodEnergy;
        this.energy = EcosystemRules.updateEnergy(this.energy, mealEnergy, 0, dt, this.maxEnergy);
        plant.health = 0;
        plantList.splice(i, 1);
        sim.deaths += 1;
        sim.plantRemovals += 1;
        if (this.health > 0) this.reproduceAfterFeeding();
      }
    }

    if (this.health <= 0) {
      this.health = 0;
    }

    const visionCost = (this.gene.foodRadius - EcosystemConfig.sheep.foodRadiusMin)
      / (EcosystemConfig.sheep.foodRadiusMax - EcosystemConfig.sheep.foodRadiusMin)
      * 0.08;
    const resistanceCost = this.gene.toxinResistance * EcosystemConfig.sheep.resistanceEnergyDrain;
    const drainRate = EcosystemRules.energyDrainRate(
      EcosystemConfig.sheep.baseEnergyDrain,
      EcosystemConfig.sheep.movementEnergyDrain * this.gene.speed,
      this.vel.mag() / Math.max(this.maxSpeed, 0.01),
      visionCost + resistanceCost
    );
    this.updateEnergy(dt, drainRate, EcosystemConfig.sheep.starvationDamagePerSecond);
    this.move();
  }

  reproduceAfterFeeding() {
    const config = EcosystemConfig.sheep;
    if (!EcosystemRules.canReproduce(
      this.age,
      this.lastBirthAt,
      sim.time,
      config.maturityAge,
      config.reproductionCooldown,
      sim.sheep.length,
      config.populationCap,
      this.energy,
      config.birthEnergyThreshold
    )) return;
    this.energy -= config.reproductionEnergyCost;
    const offspring = new Sheep(
      this.pos.x + random(-20, 20),
      this.pos.y + random(-20, 20),
      { ...this.gene }
    );
    offspring.energy = config.offspringEnergy;
    sim.sheep.push(offspring);
    this.lastBirthAt = sim.time;
    sim.births += 1;
    sim.sheepBirths += 1;
  }

}

class Plant extends LivingEntity {
  constructor(x, y, inheritedToxicity) {
    super(x, y, EcosystemConfig.plant.maxHealth, undefined);
    this.type = 'plant';
    this.maxSpeed = 0;
    this.maxForce = 0;
    this.r = 7;
    this.age = 0;
    this.toxicity = inheritedToxicity == null
      ? randomChoice([TOXICITY.SAFE, TOXICITY.SAFE, TOXICITY.POISONOUS, TOXICITY.LETHAL])
      : clamp(Math.round(inheritedToxicity), 0, 2);
    this.initialToxicity = this.toxicity;
    this.growthBias = random(-0.2, 0.25);
    this.vel.set(0, 0);
    this.health = this.maxHealth;
  }

  update(dt, plantList) {
    this.age += dt;
    this.size = clamp(1 + this.age * 0.06, 1, 2);
    this.toxicity = EcosystemRules.toxicityAfterAging(
      this.initialToxicity,
      this.age,
      EcosystemRules.PLANT_DETOXIFY_INTERVAL
    );
    this.move();
  }

}