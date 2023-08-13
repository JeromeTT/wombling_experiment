export function barChart(
  data,
  parent,
  scale = 4,
  flipped = false,
  thresholds = 10
) {
  const width = 1000;
  const height = width / scale;
  const bins = d3.bin().thresholds(thresholds)(data);
  console.log(bins);
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
    .attr("fill", "steelblue")
    .selectAll()
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("y", (d) => 0)
    .attr("height", (d) => y(0) - y(d.length));
}
