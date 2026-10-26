/**
 * Starter Tools for ShadowClaw Template
 *
 * Demonstrates the decoupled, portable ESM architecture for agent tools and scripts.
 * Contains pure computation and execution logic with zero DOM or browser dependencies.
 * Can be executed directly in Web Workers, Node.js, CLI scripts, or external runtimes.
 */

/**
 * Parses parameters from strings, rawInput, or JSON objects.
 *
 * @param {string|object} params
 * @returns {{ min: number, max: number }}
 */
export function parseRandomNumberParams(params) {
  let min = 1;
  let max = 1000000;
  let obj = {};

  if (typeof params === "string") {
    const trimmed = params.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        obj = JSON.parse(trimmed);
      } catch (e) {}
    } else {
      const numbers = trimmed.match(/\b\d+\b/g);
      if (numbers && numbers.length > 0) {
        if (numbers.length === 1) {
          max = Number(numbers[0]);
        } else {
          min = Number(numbers[0]);
          max = Number(numbers[1]);
        }
      }
    }
  } else if (params && typeof params === "object") {
    obj =
      params.rawInput && typeof params.rawInput === "object"
        ? params.rawInput
        : params;
    if (typeof params.rawInput === "string") {
      const trimmed = params.rawInput.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          obj = JSON.parse(trimmed);
        } catch (e) {}
      }
    }
  }

  if (obj.min !== undefined && !isNaN(Number(obj.min))) {
    min = Number(obj.min);
  }
  if (obj.max !== undefined && !isNaN(Number(obj.max))) {
    max = Number(obj.max);
  }

  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }

  return { min, max };
}

/**
 * Generates a random integer between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function generateRandomNumber(min = 1, max = 1000000) {
  const effectiveMin = Math.ceil(min);
  const effectiveMax = Math.floor(max);
  return (
    Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin
  );
}

/**
 * Tool execution handler for generate_random_number.
 *
 * @param {string|object} params
 * @returns {number}
 */
export function executeGenerateRandomNumber(params) {
  const { min, max } = parseRandomNumberParams(params);
  return generateRandomNumber(min, max);
}

/**
 * Universal tool command dispatcher.
 *
 * @param {string} type
 * @param {string|object} params
 * @returns {Promise<string|number>}
 */
export async function handleToolCommand(type, params) {
  if (type === "generate_random_number" || type === "random_number") {
    return executeGenerateRandomNumber(params);
  }
  throw new Error(`Unknown tool command: ${type}`);
}

export default {
  parseRandomNumberParams,
  generateRandomNumber,
  executeGenerateRandomNumber,
  handleToolCommand,
};
