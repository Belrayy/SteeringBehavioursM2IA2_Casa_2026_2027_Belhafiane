# Glow Garden — Mouse Snake

Open `index.html` in a browser to play. Choose the starting snake size, food spawn rate, and whether bad food is included, then guide the snake with the mouse through the softly glowing garden.

Berry and golden food increase the score and snake size by different amounts. Bad food decreases both. Obstacles and bad food increase as the score rises. Colliding with an obstacle or the snake's body ends the game; the high score is saved in the browser.

Run the game-rule tests from this directory with:

```sh
node --test tests/*.test.mjs
```