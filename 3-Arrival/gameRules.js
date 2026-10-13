var GameRules = (() => {
  const FOOD_TYPES = {
    berry: { score: 10, growth: 1, color: "#e64b3c", soundFrequency: 620, bad: false },
    golden: { score: 25, growth: 3, color: "#ffd447", soundFrequency: 880, bad: false },
    bad: { score: -15, growth: -2, color: "#7641a8", soundFrequency: 180, bad: true }
  };

  function applyFoodEffect(score, size, foodType) {
    const food = FOOD_TYPES[foodType];
    if (!food) {
      throw new RangeError(`Unknown food type: ${foodType}`);
    }

    return {
      score: Math.max(0, score + food.score),
      size: Math.max(1, size + food.growth)
    };
  }

  function targetBadFoodCount(score, badFoodEnabled) {
    if (!badFoodEnabled) {
      return 0;
    }
    return Math.min(8, 1 + Math.floor(Math.max(0, score) / 30));
  }

  function targetObstacleCount(score) {
    return Math.min(12, Math.floor(Math.max(0, score) / 25));
  }

  return {
    FOOD_TYPES,
    applyFoodEffect,
    targetBadFoodCount,
    targetObstacleCount
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = GameRules;
}