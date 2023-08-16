/**
 * Yield function retrieved from https://web.dev/optimize-long-tasks/#built-in-yield-with-continuation
 * @returns
 */
export function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
