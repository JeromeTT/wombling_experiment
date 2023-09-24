import { GlobalData } from "../../../data/globaldata.js";
import { initLayer, initSource } from "../../map/map.js";

export function updateChoropleth(map) {
  if (
    GlobalData.indicatorsData == null ||
    GlobalData.indicatorsData == undefined
  ) {
    return;
  }
  if (map.getSource("choroplethSource")) {
    initLayer(map, "choroplethSource", "boundaries");
  } else {
    console.log("UPDATING SOURCE!!!!!!!!!!!!!!!!!!!!!!!!");
    initSource(map, GlobalData.selectedAreas, "choroplethSource", "boundaries");
  }
}

export function choroplethSelectionHandler(map) {
  const checkbox = document.getElementById("choropleth-checkbox");
  const select = document.getElementById("choropleth-indicatorChange");

  checkbox.addEventListener("click", () => {
    updateChoropleth(map);
  });

  select.addEventListener("change", () => {
    updateChoropleth(map);
  });
}
