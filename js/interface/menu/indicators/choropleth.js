import { GlobalData } from "../../../data/globaldata.js";
import { initLayer, initSource } from "../../map/map.js";

export function updateChoropleth(map, area) {
  const indicator = document.getElementById("choropleth-indicatorChange");
  if (
    GlobalData.indicatorsData == null ||
    GlobalData.indicatorsData == undefined
  ) {
    return;
  }
  if (map.getSource("choroplethSource")) {
    initLayer(map, "choroplethSource", "boundaries");
  } else {
    initSource(map, area, "choroplethSource", "boundaries");
  }
}

export function choroplethSelectionHandler(map, area) {
  const checkbox = document.getElementById("choropleth-checkbox");
  const select = document.getElementById("choropleth-indicatorChange");

  checkbox.addEventListener("click", () => {
    updateChoropleth(map, area);
  });

  select.addEventListener("change", () => {
    updateChoropleth(map, area);
  });
}
