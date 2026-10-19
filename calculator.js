export function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(index));
      if (!match) throw new Error("Invalid number");
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new Error("Number is out of range");
      tokens.push({ type: "number", value });
      index += match[0].length;
      continue;
    }

    if ("+-*/()%".includes(character)) {
      tokens.push({ type: character, value: character });
      index += 1;
      continue;
    }

    throw new Error("Unsupported character");
  }

  return tokens;
}

export function parseExpression(source) {
  const tokens = tokenize(source);
  let position = 0;

  function peek(type) {
    return tokens[position]?.type === type;
  }

  function take(type) {
    if (!peek(type)) throw new Error("Incomplete expression");
    return tokens[position++].value;
  }

  function primary() {
    if (peek("number")) return take("number");
    if (peek("(")) {
      take("(");
      const value = addition();
      take(")");
      return value;
    }
    throw new Error("Expected a number");
  }

  function postfix() {
    let value = primary();
    while (peek("%")) {
      take("%");
      value /= 100;
    }
    return value;
  }

  function unary() {
    if (peek("+")) {
      take("+");
      return unary();
    }
    if (peek("-")) {
      take("-");
      return -unary();
    }
    return postfix();
  }

  function multiplication() {
    let value = unary();
    while (peek("*") || peek("/")) {
      const operator = tokens[position++].type;
      const right = unary();
      if (operator === "/" && right === 0) throw new Error("Cannot divide by zero");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function addition() {
    let value = multiplication();
    while (peek("+") || peek("-")) {
      const operator = tokens[position++].type;
      const right = multiplication();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  if (tokens.length === 0) throw new Error("Enter an expression");
  const answer = addition();
  if (position !== tokens.length) throw new Error("Check the expression");
  if (!Number.isFinite(answer)) throw new Error("Result is out of range");
  return answer;
}

export function formatNumber(value) {
  if (Math.abs(value) <= 1e-8) value = 0;
  return Number(value.toPrecision(12)).toString();
}

export function displayExpression(source) {
  return source.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
}
