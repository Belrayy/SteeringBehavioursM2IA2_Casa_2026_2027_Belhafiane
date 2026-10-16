# Ecosystem Evolution

This is a standalone p5.js ecosystem simulation using the bundled local libraries. Open `index.html` in a browser or serve this folder with a static HTTP server. No package installation is required.

## Controls

- **Start / Pause** toggles simulation time.
- **Reset** applies the selected initial plant, wolf, and sheep counts.
- **Download PDF report** saves a plain-language, two-page snapshot of the current populations, births and removals, plant toxicity, health, ages, sheep resistance, simulation settings, and ecosystem rules. It works while running or paused; it does not include a historical timeline.
- **Plant spawn rate** sets autonomous plant arrivals per simulated second (0-4; default 2). It works while the ecosystem runs. At the 300-plant performance limit, each new plant replaces the oldest one.
- **Debug overlay** (or `D`) shows wolf and sheep perception radii; debug health bars are also visible.

## Ecosystem rules

- Rules and starting values are centralized in `ecosystemConfig.js`.
- Wolves start at full energy and regain 65 energy after a hunt. Their 14-second base hunt cooldown stretches when sheep become scarce, and the six-wolf population cap and sheep's higher base speed further limit predation so prey can recover. Lower wolf movement and vision energy costs give them more time to find prey; they still starve if energy runs out. Wolves need 10 seconds of age and at least 60 energy to reproduce; offspring cost 42 energy, start at 48 energy, and reproduction has a 16-second cooldown.
- Sheep flee wolves and eat plants for energy. Sheep need 1.5 seconds of age and at least 64 energy to reproduce; offspring cost 36 energy, start at 48 energy, and reproduction has a 1-second cooldown and population cap of 80, which limits herd growth to a sustainable carrying capacity.
- Poisonous plants inflict 1.4 HP before resistance; lethal plants inflict 3.2 HP. Sheep avoid lethal plants until resistance reaches 0.75; resistant sheep can tolerate a bite.
- Plants that remain uneaten become less toxic with age: every 20 simulated seconds, toxicity drops by one level (lethal to poisonous to safe). Plants begin aging from their starting toxicity, and safe plants stay safe.
- Animals spend energy while moving. Faster movement and broader vision increase energy use; sheep resistance also costs energy. Food restores energy. Health is only reduced by predation, toxic feeding, or starvation after energy reaches zero.
- Sheep resistance is set at birth and passed on with small mutations; it no longer increases during an individual's life. Toxic food damages susceptible sheep, creating survival selection for inherited resistance.
- Trait trade-offs are charged against energy: broader wolf vision and sheep food radius increase baseline energy use, sheep resistance costs energy continuously, and faster movement costs more while moving. Low energy also reduces maximum movement speed.
- Plant arrivals sample the field's average toxicity, with small mutations preserving diversity. Reset reapplies the fixed seed (2026) so a run is reproducible.
- Defaults are 60 plants, 5 wolves, 32 sheep, and 3.5 new plants per simulated second. The spawn-rate control allows up to 4 plants per second to help keep plant food available as the herd grows.
- Sheep and wolves inherit their behavioral traits with bounded mutations. Their 3D models grow with age.
- Sheep use gradual, persistent wander steering when no edible plant is within their food-perception radius, then switch back to seeking food when one is detected. Wolves still take priority and trigger fleeing. All animals use the base vehicle's steering-based boundary behavior instead of being clamped at the canvas edge.
- The report separates animal births from plant spawns and animal deaths from plant removals so combined totals are easier to interpret.

## Tests

Run all focused rules, steering, and report tests with Node.js:

```powershell
node --test tests\ecosystemRules.test.js tests\sheepSteering.test.js tests\ecosystemReport.test.js
```
