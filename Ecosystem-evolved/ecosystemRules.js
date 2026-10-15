const EcosystemRules = (() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function averageToxicity(plants) {
    if (plants.length === 0) return 0;
    return plants.reduce((sum, plant) => sum + plant.toxicity, 0) / plants.length;
  }

  function toxicPlantFraction(plants) {
    if (plants.length === 0) return 0;
    return plants.filter((plant) => plant.toxicity > 0).length / plants.length;
  }

  function sampleToxicityFromAverage(average, randomValue, mutationRate = 0.1) {
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
    if (toxicity === 1) return 1.4 * remainingDose;
    if (toxicity === 2) return 3.2 * remainingDose;
    return 0;
  }

  function adaptResistance(resistance, toxicFraction, dt) {
    if (toxicFraction < 0.4) return clamp(resistance, 0, 0.95);
    return clamp(resistance + Math.max(0, dt) * 0.06, 0, 0.95);
  }

  function inheritResistance(parentResistance, mutation) {
    return clamp(parentResistance + mutation, 0, 0.95);
  }

  function canReproduce(age, lastBirthAt, now, maturityAge, cooldown, population, capacity) {
    return age >= maturityAge
      && now - lastBirthAt >= cooldown
      && population < capacity;
  }

  return Object.freeze({
    averageToxicity,
    toxicPlantFraction,
    sampleToxicityFromAverage,
    toxinDamage,
    adaptResistance,
    inheritResistance,
    canReproduce,
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcosystemRules;
}
