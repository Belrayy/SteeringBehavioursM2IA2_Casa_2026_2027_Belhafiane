const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const collisionSource = fs.readFileSync(path.join(__dirname, "..", "collision.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(collisionSource, context);

test("overlapping circles register a contact", () => {
  assert.equal(context.circlesOverlap(8, 5, 4), true);
});

test("circles touching at the summed radii register a contact", () => {
  assert.equal(context.circlesOverlap(9, 5, 4), true);
});

test("separate circles do not register a contact", () => {
  assert.equal(context.circlesOverlap(9.01, 5, 4), false);
});

test("zero-radius circles only overlap at the same point", () => {
  assert.equal(context.circlesOverlap(0, 0, 0), true);
  assert.equal(context.circlesOverlap(0.01, 0, 0), false);
});
