/**
 * Returns a color scale.
 * @param {int} n the number of sections in the color scale. Default: 5
 * @param {string[]} color the color palette. Default: ["yellow", "red"]
 * @returns returns a color scale
 */
export function getColorScale(n = 5, color = ["#FFF8C4", "#B74202"]) {
  return (x) => d3.interpolateOranges(x / n);
}

/**
 * Returns a womble scale from 0 - 1
 * @param {int} n the number of sections on the scale. Default: 5
 * @returns returns a womble scale from 0 - 1
 */
export function getWombleScale(n = 5) {
  return d3
    .scaleLinear()
    .domain([1, n + 1])
    .range([0, 1]);
}
