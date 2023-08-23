import { closeExistingPopups } from "../popups.js";
import { GlobalData } from "../../data/globaldata.js";
import { initLayer } from "./map.js";
import { histogram } from "../charts.js";
import { retrieveIndicatorSliders } from "../menu/indicators/sliders.js";
export function addBoundariesLayer(map) {
  initLayer(map, "boundariesSource");
}

export function addAreasLayer(map) {
  initLayer(map, "areasSource");
}

/**
 * Adds clickable wall behaviour. Upon clicking a wall, a popup appears with relevant info and the wall's adjacent areas are highlighted
 * @param {*} map mapbox map
 */
export function initClickableWallBehaviour(map) {
  map.on("click", ["walls3D", "walls2D"], (e) => {
    let wall = e.features[0];
    console.log(e.features[0].geometry);
    wallClicked(map, wall, e.lngLat);
  });

  // change mouse pointer upon hovering over walls
  map.on("mouseenter", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "";
  });
}

export function wallClicked(map, wall, coordinates) {
  console.log("coords", coordinates);
  closeExistingPopups(map);
  // raw and scaled womble values rounded to 3 dec places
  let rawWomble = wall.properties.womble.toFixed(3);
  let scaledWomble = wall.properties.womble_scaled.toFixed(3);
  let description = `Raw womble: ${rawWomble} <br> Scaled womble: ${scaledWomble} <br> Neighbouring area IDs: <br> ID1: ${wall.properties.sa1_id1}, <br> ID2: ${wall.properties.sa1_id2} <div class="popup-charts"></div>`;
  console.log(wall);

  // area IDs are converted to strings b/c they'll be compared to the SA1 area properties which are strings
  let areaIds = [
    wall.properties.sa1_id1.toString(),
    wall.properties.sa1_id2.toString(),
  ];

  // create popup
  let popup = new mapboxgl.Popup({ closeOnClick: false });
  popup.setLngLat(coordinates);
  popup.setHTML(description);
  popup.addClassName("wall-popup");
  popup.addTo(map);

  // closing the popup unhighlights the neighbouring areas
  popup.on("close", () => {
    closeExistingPopups(map);
    map.removeFeatureState({ source: "areasSource" });
  });

  let parent = document.querySelector(
    ".wall-popup .mapboxgl-popup-content .popup-charts"
  );
  const weights = retrieveIndicatorSliders();
  for (let i in GlobalData.selectedVariables) {
    let variable = GlobalData.selectedVariables[i];
    let weight = parseFloat(weights[i].value);
    const innerP = parent.appendChild(document.createElement("p"));
    innerP.textContent = `${variable} [Weighted: ${weight}%]`;
    const innerDivDifference = parent.appendChild(
      document.createElement("div")
    );
    innerDivDifference.setAttribute(
      "style",
      "padding-top: 5px; padding-bottom: 5px"
    );
    histogram({
      data: GlobalData.selectedBuffered.features,
      parent: innerDivDifference,
      reference: (d) => d.properties[variable],
      datapoint: wall,
    });
    const innerDivVar1 = parent.appendChild(document.createElement("div"));
    innerDivVar1.setAttribute("style", "padding-top: 5px; padding-bottom: 5px");
    histogram({
      data: GlobalData.indicatorsData,
      parent: innerDivVar1,
      reference: (d) => d[variable],
      datapoint: GlobalData.indicatorsData.find(
        (d) => d[GlobalData.csvAreaID] == areaIds[0]
      ),
    });
    const innerDivVar2 = parent.appendChild(document.createElement("div"));
    innerDivVar2.setAttribute("style", "padding-top: 5px; padding-bottom: 5px");
    histogram({
      data: GlobalData.indicatorsData,
      parent: innerDivVar2,
      reference: (d) => d[variable],
      datapoint: GlobalData.indicatorsData.find(
        (d) => d[GlobalData.csvAreaID] == areaIds[1]
      ),
    });
  }

  // highlights the neighbouring areas
  // uses setFilter to display only the features in the "areas" layer which match the area IDs adjacent to the clicked wall
  // here we're using the property SA1_MAIN16 as the area ID
  // TODO: maybe modify this/future sa1 area files to use a more homogenous property name (e.g. area_id)
  map.setFeatureState(
    { source: "areasSource", id: areaIds[0] },
    { selected: true }
  );
  map.setFeatureState(
    { source: "areasSource", id: areaIds[1] },
    { selected: true }
  );
}
function resetAreas(map) {
  if (GlobalData.edgeSelectionMode) {
    // If edge selection mode is enabled,
    map.setFilter("areas", ["boolean", true]);
  } else {
    map.setFilter("areas", ["boolean", true]);
  }
}
