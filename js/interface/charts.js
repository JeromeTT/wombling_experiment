/**
 * Utilised D3.js to draw a histogram
 * @param {*} param0 TODO
 */
export function histogram({
  data,
  parent,
  scale = 4,
  flipped = false,
  thresholds = 10,
  reference = (d) => d,
  datapoint = null,
}) {
  const width = 1000;
  const height = width / scale;
  const f = reference;
  const bins = d3
    .bin()
    .thresholds((_, min, max) =>
      d3.range(thresholds).map((t) => min + (t / thresholds) * (max - min))
    )
    .value(f)(data);

  if (datapoint) {
    //Check which bucket it is
    for (let bin of bins) {
      if (f(datapoint) <= bin.x1) {
        bin.contains = true;
        // it is in this bin
        break;
      }
    }
  }

  // Declare the x (horizontal position) scale.
  const x = d3
    .scaleLinear()
    .domain([bins[0].x0, bins[bins.length - 1].x1])
    .range([0, width]);

  // Declare the y (vertical position) scale.
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .range([height, 0]);

  // Create the SVG container.
  // Remove
  d3.select(parent).selectAll("*").remove();
  const svg = d3
    .select(parent)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add a rect for each bin.
  svg
    .append("g")
    .selectAll()
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("fill", (d) => (d.contains ? "red" : "steelblue"))
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("y", (d) => 0)
    .attr("height", (d) => y(0) - y(d.length));
}
