const EcosystemRules = (() => {
  const CONFIG = typeof module !== 'undefined' && module.exports
    ? require('./ecosystemConfig.js')
    : EcosystemConfig;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function toxicityAfterAging(initialToxicity, age, secondsPerLevel = CONFIG.plant.detoxInterval) {
    const startingLevel = clamp(Math.round(initialToxicity), 0, 2);
    const interval = Math.max(Number.EPSILON, secondsPerLevel);
    const elapsedLevels = Math.floor(Math.max(0, age) / interval);
    return Math.max(0, startingLevel - elapsedLevels);
  }

  function averageToxicity(plants) {
    if (plants.length === 0) return 0;
    return plants.reduce((sum, plant) => sum + plant.toxicity, 0) / plants.length;
  }

  function toxicPlantFraction(plants) {
    if (plants.length === 0) return 0;
    return plants.filter((plant) => plant.toxicity > 0).length / plants.length;
  }

  function sampleToxicityFromAverage(average, randomValue, mutationRate = CONFIG.plant.mutationRate) {
    const bounded = clamp(average, 0, 2);
    const lower = Math.floor(bounded);
    let toxicity = lower < 2 && randomValue() < bounded - lower ? lower + 1 : lower;
    if (randomValue() < mutationRate) {
      toxicity = clamp(toxicity + (randomValue() < 0.5 ? -1 : 1), 0, 2);
    }
    return toxicity;
  }

  function toxinDamage(toxicity, resistance) {
    const remainingDose = 1 - clamp(resistance, 0, 0.95);
    if (toxicity === CONFIG.plant.poisonous) return CONFIG.toxicity.poisonDamage * remainingDose;
    if (toxicity === CONFIG.plant.lethal) return CONFIG.toxicity.lethalDamage * remainingDose;
    return 0;
  }

  function updateEnergy(energy, intake, drainRate, dt, maximum = 100) {
    const elapsed = Math.max(0, dt);
    return clamp(energy + Math.max(0, intake) - Math.max(0, drainRate) * elapsed, 0, maximum);
  }

  function starvationDamage(energy, dt, damagePerSecond) {
    if (energy > 0) return 0;
    return Math.max(0, dt) * Math.max(0, damagePerSecond);
  }

  function energyDrainRate(baseRate, movementRate, speedRatio, traitCost = 0) {
    return Math.max(0, baseRate)
      + Math.max(0, movementRate) * clamp(speedRatio, 0, 2)
      + Math.max(0, traitCost);
  }

  function predationCooldown(preyCount, baseCooldown, referencePopulation) {
    const availablePrey = Math.max(1, preyCount);
    const reference = Math.max(1, referencePopulation);
    return Math.max(0, baseCooldown) * Math.max(1, reference / availablePrey);
  }

  function inheritResistance(parentResistance, mutation) {
    return clamp(parentResistance + mutation, 0, CONFIG.toxicity.maximumResistance);
  }

  function canReproduce(age, lastBirthAt, now, maturityAge, cooldown, population, capacity, energy = Infinity, minimumEnergy = 0) {
    return age >= maturityAge
      && now - lastBirthAt >= cooldown
      && population < capacity
      && energy >= minimumEnergy;
  }

  return Object.freeze({
    PLANT_DETOXIFY_INTERVAL: CONFIG.plant.detoxInterval,
    toxicityAfterAging,
    averageToxicity,
    toxicPlantFraction,
    sampleToxicityFromAverage,
    toxinDamage,
    inheritResistance,
    updateEnergy,
    starvationDamage,
    energyDrainRate,
    predationCooldown,
    canReproduce,
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcosystemRules;
}
