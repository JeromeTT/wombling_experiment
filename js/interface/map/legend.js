import { DEFAULT } from "../../util/enums.js";
import { getColorScale, getWombleScale } from "../../util/scale.js";
/**
 * Appends the map legend to the HTML.
 */
export function initLegend() {
  const n = DEFAULT.SCALESECTIONS;
  const colorScale = getColorScale(n);
  const wombleScale = getWombleScale(n);
  const legend = document.getElementById("legend"); // Hard coded in HTML

  const item = document.createElement("div");
  const value = document.createElement("span");
  value.innerHTML = "<b>Wombled Scaled Values</b>";
  item.appendChild(value);
  legend.appendChild(item);

  for (let i = 1; i <= n; i++) {
    const color = colorScale(i);
    const lower = wombleScale(i);
    const upper = wombleScale(i + 1);
    const item = document.createElement("div");
    const key = document.createElement("span");
    key.className = "legend-key";
    key.style.backgroundColor = color;

    const value = document.createElement("span");
    value.innerHTML = lower + " - " + upper;

    item.appendChild(key);
    item.appendChild(value);
    legend.appendChild(item);
  }
}
