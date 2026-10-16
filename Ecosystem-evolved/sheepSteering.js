const SheepSteering = (() => {
  function updateWanderHeading(heading, turnDelta, maxTurn = 0.08) {
    const boundedTurn = Math.min(maxTurn, Math.max(-maxTurn, turnDelta));
    return heading + boundedTurn;
  }

  function wanderForce(velocity, heading, maxSpeed, maxForce) {
    let forceX = Math.cos(heading) * maxSpeed - velocity.x;
    let forceY = Math.sin(heading) * maxSpeed - velocity.y;
    const magnitude = Math.hypot(forceX, forceY);
    if (magnitude > maxForce && magnitude > 0) {
      const scale = maxForce / magnitude;
      forceX *= scale;
      forceY *= scale;
    }
    return { x: forceX, y: forceY };
  }

  return Object.freeze({ updateWanderHeading, wanderForce });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheepSteering;
}
