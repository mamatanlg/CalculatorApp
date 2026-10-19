import test from "node:test";
import assert from "node:assert/strict";
import { displayExpression, formatNumber, parseExpression } from "./calculator.js";

test("parses arithmetic with precedence and parentheses", () => {
  assert.equal(parseExpression("12.5+(3*2)"), 18.5);
  assert.equal(parseExpression("(8-3)/2"), 2.5);
});

test("supports decimals, unary signs, and percentages", () => {
  assert.equal(parseExpression("-2.5 + 200*10%"), 17.5);
  assert.equal(parseExpression("25%"), 0.25);
});

test("formats tiny results as zero and supports scientific notation", () => {
  assert.equal(formatNumber(parseExpression("1/100000000")), "0");
  assert.equal(parseExpression("1e-7"), 1e-7);
});

test("rejects invalid expressions and division by zero", () => {
  assert.throws(() => parseExpression("1/0"), /Cannot divide by zero/);
  assert.throws(() => parseExpression("1+"), /Expected a number/);
  assert.throws(() => parseExpression("2+alert(1)"), /Unsupported character/);
});

test("formats expressions for display", () => {
  assert.equal(displayExpression("2*3-4/2"), "2×3−4÷2");
});
