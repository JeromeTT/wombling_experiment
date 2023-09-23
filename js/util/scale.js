/**
 * Returns a color scale.
 * @param {int} n the number of sections in the color scale. Default: 5
 * @param {string[]} color the color palette. Default: ["yellow", "red"]
 * @returns returns a color scale
 */
export function getColorScale(n = 5) {
  return (x) => d3.interpolateOranges(x / n);
}

export function getChoroplethColorScale(n = 5) {
  return (x) => d3.interpolateBlues(x / n);
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

// From https://observablehq.com/@d3/color-legend
export function choroplethLegend(
  parent,
  color,
  {
    title,
    tickSize = 6,
    width = 300,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 16,
    marginBottom = 16 + tickSize,
    marginLeft = 16,
    ticks = 1,
    tickFormat,
    tickValues,
  } = {}
) {
  function ramp(color, n = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  const svg = d3
    .select(parent)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block")
    .style("max-width", "100%");
  let x;

  // Continuous
  const n = Math.min(color.domain().length, color.range().length);

  x = color
    .copy()
    .rangeRound(
      d3.quantize(d3.interpolate(marginLeft, width - marginRight), n)
    );

  svg
    .append("image")
    .attr("x", marginLeft)
    .attr("y", marginTop)
    .attr("width", width - marginLeft - marginRight)
    .attr("height", height - marginTop - marginBottom)
    .attr("preserveAspectRatio", "none")
    .attr(
      "xlink:href",
      ramp(
        color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))
      ).toDataURL()
    );

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(ticks).tickSize(tickSize))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("class", "title")
        .text(title)
    );

  return svg.node();
}
