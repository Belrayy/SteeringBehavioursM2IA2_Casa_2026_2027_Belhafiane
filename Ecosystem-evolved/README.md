# Ecosystem Evolution

This is a standalone p5.js ecosystem simulation using the bundled local libraries. Open `index.html` in a browser or serve this folder with a static HTTP server. No package installation is required.

## Controls

- **Start / Pause** toggles simulation time.
- **Reset** applies the selected initial plant, wolf, and sheep counts.
- **Download PDF report** saves a plain-language, two-page snapshot of the current populations, births and removals, plant toxicity, health, ages, sheep resistance, simulation settings, and ecosystem rules. It works while running or paused; it does not include a historical timeline.
- **Plant spawn rate** sets autonomous plant arrivals per simulated second (0-2). It works while the ecosystem runs. At the 300-plant performance limit, each new plant replaces the oldest one.
- **Debug overlay** (or `D`) shows wolf and sheep perception radii; debug health bars are also visible.

## Ecosystem rules

- Wolves chase and eat sheep. A successful hunt restores wolf health and can produce an offspring once mature; reproduction has a 16-second cooldown and population cap.
- Sheep flee wolves and eat safe plants for health. Eating any plant that the sheep can safely consume can produce an offspring once mature; reproduction has a 1-second cooldown and population cap.
- Poisonous plants inflict 1.4 HP before resistance; lethal plants inflict 3.2 HP. Sheep avoid lethal plants until resistance reaches 0.75; resistant sheep can tolerate a bite.
- Plants that remain uneaten become less toxic with age: every 30 simulated seconds, toxicity drops by one level (lethal to poisonous to safe). Plants begin aging from their starting toxicity, and safe plants stay safe.
- No species loses HP passively. Plants grow over time and only die when eaten or replaced at the population limit; animals die from predation or toxic feeding.
- Plant arrivals sample the field's average toxicity, with small mutations preserving diversity. With at least 40% of plants toxic, sheep resistance rises gradually and is inherited with small bounded mutations.
- Defaults are 60 plants, 5 wolves, and 32 sheep; wolf reproduction is capped at 12 to preserve a prey population for observing evolution.
- Sheep and wolves inherit their behavioral traits with bounded mutations. Their 3D models grow with age.
- Sheep use gradual, persistent wander steering when no edible plant is within their food-perception radius, then switch back to seeking food when one is detected. Wolves still take priority and trigger fleeing. All animals use the base vehicle's steering-based boundary behavior instead of being clamped at the canvas edge.
- The report separates animal births from plant spawns and animal deaths from plant removals so combined totals are easier to interpret.

## Tests

Run the focused rules tests with Node.js:

```powershell
node --test tests\ecosystemRules.test.js
```

Sheep steering tests can be run with:

```powershell
node --test tests\sheepSteering.test.js
```
