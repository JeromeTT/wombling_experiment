import { setDefaultWeights } from "./sliders.js";
import { createVariables } from "./variableOptions.js";
import {
  initClickableAreaBehaviour,
  initClickableWallBehaviour,
  initMapAreas,
  initMapBoundaries,
} from "./boundaries.js";
import { closeExistingPopups } from "./interface/popups.js";
import { runWomble, DimensionToggle } from "./womble.js";
import boundaries_SA1_2011_buffered from "../boundaries_SA1_2011_dist_wgs84_buffered7.geojson" assert { type: "json" };
import boundaries_SA1_2011 from "../boundaries_SA1_2011_dist_wgs84.geojson" assert { type: "json" };
import areas_SA1_2011 from "../SA1_2011_Greater_Melbourne.geojson" assert { type: "json" };
import boundaries_SA1_2016_buffered from "../boundaries_SA1_2016_wgs84_buffered7.geojson" assert { type: "json" };
import boundaries_SA1_2016 from "../boundaries_SA1_2016_wgs84.geojson" assert { type: "json" };
import areas_SA1_2016 from "../SA1_2016_Greater_Melbourne.geojson" assert { type: "json" };
import { addInputListeners } from "./filter.js";
// import geoJsonData from "../liveability_sa1_2011_difference_buffered_transformed.geojson" assert { type: "json" };
// import boundaries_SA1_2011 from "../boundaries_SA1_2011_wgs84_buffered.geojson" assert { type: "json" };
import {
  createIndicatorOptions,
  removeIndicatorOptions,
  getValues,
} from "./indicatorOptions.js";

import { menuInitCollapsibleBehaviour } from "./interface/menu.js";
import { Dimensions } from "./enums.js";
import { addStyleListeners } from "./styleOptions.js";

import { initLegend as initLegend } from "./interface/legend.js";
import { normaliseDataColumns, scaleDataColumns } from "./util/normalise.js";
import { GlobalData } from "./data.js";
// console.log(geoJsonData);

// Could also use fetch instead of import
// fetch("./boundaries_SA1_2016.geojson")
//   .then((response) => {
//     return response.json();
//   })
//   .then((data) => console.log(data));

// Mapbox token (taken from existing project)
const MAPBOX_TOKEN =
  "pk.eyJ1IjoibmR1bzAwMDMiLCJhIjoiY2tnNHlucmF3MHA4djJ6czNkaHRycmo1OCJ9.xfU4SWH35W5BYtJP8VnTEA";

/**
 * TODO:
 * @param {*} data
 */
export function setIndicatorsData(data) {
  GlobalData.originalIndicatorsData = JSON.parse(JSON.stringify(data.data));
  GlobalData.indicatorsData = JSON.parse(JSON.stringify(data.data));
  let headers = Object.keys(data.data[0]);
  GlobalData.csvAreaCode = headers.shift();
  GlobalData.optionsData = headers;
  // indicatorsData = scaleDataColumns(originalIndicatorsData, headers);
  // indicatorsData = normaliseDataColumns(originalIndicatorsData, headers);
  // Normalise everything?

  console.log("Indicators Data", GlobalData.indicatorsData);
  console.log("headers", headers);
  // Filter all boundaries where an area has undefined value
  GlobalData.selectedUnbuffered["features"] = GlobalData.selectedUnbuffered[
    "features"
  ].filter((boundary) => {
    let row1 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id1
    );
    let row2 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id2
    );
    return row1 != undefined && row2 != undefined;
  });
  // PREPROCESS EVERY SINGLE BOUNDARY
  for (let i in GlobalData.selectedUnbuffered.features) {
    let boundary = GlobalData.selectedUnbuffered.features[i];
    let row1 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id1
    );
    let row2 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id2
    );
    for (let header of headers) {
      boundary[header] = Math.abs(row1[header] - row2[header]);
    }
  }
  // SCALE EVERY BOUNDARY
  GlobalData.selectedUnbuffered.features = scaleDataColumns(
    GlobalData.selectedUnbuffered.features,
    headers
  );
  GlobalData.selectedUnbuffered.features = normaliseDataColumns(
    GlobalData.selectedUnbuffered.features,
    headers
  );
  console.log("ALL BOUNDARIES", GlobalData.selectedUnbuffered);
  createVariables(headers);
}

// export function setIndicatorsData(data) {
//   indicatorsData = data[0];
//   csvAreaCode = data[1].shift();
//   optionsData = data[1];

//   createIndicatorOptions(optionsData);
//   new MultiSelectTag("indicators-selection"); // id
//   document.getElementById("selectionBlock").classList.remove("hide");
// }

// Main
let map = new mapboxgl.Map({
  container: "map",
  center: [144.9628, -37.8102], // long lat of melb
  // center: [145.2, -37.8102], // long lat of east side melb
  // center: [149.8911094722651, -35.0898882056091],
  zoom: 9,
  minZoom: 9,
  maxPitch: 0,
  style: "mapbox://styles/mapbox/light-v11",
  accessToken: MAPBOX_TOKEN,
  antialias: true,
});

menuInitCollapsibleBehaviour();
initLegend();

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new DimensionToggle({ pitch: 45 }));
// map.addControl(new darkModeToggle());

// let selectionSubmit = document.getElementById("submitOptions");
// selectionSubmit.addEventListener("click", () => submitOptions());
// function submitOptions() {
//   let selectedValues = getSelectValues(optionsData);
//   createIndicatorSliders(selectedValues);
// }

// Add event listener to the button for resetting indicator weight sliders
let resetWeightsButton = document.getElementById("reset-weights-button");
resetWeightsButton.addEventListener("click", setDefaultWeights);

// When map loads, do...
map.on("load", () => {
  document.getElementById("areasSelect").addEventListener("change", () => {
    areaDropDownHandler(map);
  });
  areaDropDownHandler(map);

  initClickableWallBehaviour(map);
  initClickableAreaBehaviour(map);

  addInputListeners(map);
  addStyleListeners(map);
});

export function areaDropDownHandler(map) {
  let areaTypes = {
    sa1_2011: {
      unbuffered: boundaries_SA1_2011,
      buffered: boundaries_SA1_2011_buffered,
      areas: areas_SA1_2011,
      areaCodeProp: "SA1_7DIG11", // idk why but the boundaries file im using uses the 7 digit codes
    },
    sa1_2016: {
      unbuffered: boundaries_SA1_2016,
      buffered: boundaries_SA1_2016_buffered,
      areas: areas_SA1_2016,
      areaCodeProp: "SA1_MAIN16",
    },
  };
  // Set variables depending on selection
  let selection = document.getElementById("areasSelect").value;
  GlobalData.selectedUnbuffered = areaTypes[selection].unbuffered;
  GlobalData.selectedBuffered = areaTypes[selection].buffered;
  let selectedAreas = areaTypes[selection].areas;
  GlobalData.geojsonAreaCode = areaTypes[selection].areaCodeProp;

  // Re-init map boundaries
  console.log(selectedAreas);
  initMapBoundaries(map, selectedAreas);
  initMapAreas(map, selectedAreas);

  if (map.getSource("unbufferedSource")) {
    map.getSource("unbufferedSource").setData(GlobalData.selectedUnbuffered);
  } else {
    map.addSource("unbufferedSource", {
      type: "geojson",
      data: GlobalData.selectedUnbuffered,
    });
  }

  if (map.getSource("bufferedSource")) {
    map.getSource("bufferedSource").setData(GlobalData.selectedBuffered);
  } else {
    map.addSource("bufferedSource", {
      type: "geojson",
      data: GlobalData.selectedBuffered,
    });
  }
  console.log("UNBUFFERED", GlobalData.selectedUnbuffered);
  console.log("BUFFERED", GlobalData.selectedBuffered);
  // button for drawing the edge heights based on womble calculation
  closeExistingPopups(map);
}

// Run Womble Button
let runWombleButton = document.getElementById("run-womble-button");
runWombleButton.addEventListener("click", () => {
  if (!GlobalData.indicatorsData) {
    console.log("Indicators data not found");
  }

  document.getElementById("loader").removeAttribute("hidden"); // show loading spinner
  // Draw walls if in 3d mode, using buffered source (polygon features)
  if (GlobalData.appDimension == Dimensions.THREE_D) {
    // TODO: loading spinner is broken sometimes?
    setTimeout(runWomble, 1, map, GlobalData.selectedBuffered); // 1 ms delay is required so that the loading spinner appears immediately before drawWalls is called, maybe see if there's a better way to do this
  }
  // Draw thicknesses if in 2d mode, using unbuffered source (line features)
  else if (GlobalData.appDimension == Dimensions.TWO_D) {
    setTimeout(runWomble, 1, map, GlobalData.selectedUnbuffered);
  }
  // drawWalls(map, boundaries_SA1_2016);
});

// Default config
document.getElementById("boundaries-checkbox").checked = true;
