import { setDefaultWeights } from "./interface/menu/indicators/sliders.js";
import { initClickableWallBehaviour } from "./interface/map/boundaries.js";
import { initClickableAreaBehaviour } from "./interface/map/areas.js";
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

import { initSource } from "./interface/map/map.js";
import { menuInitCollapsibleBehaviour } from "./interface/menu/menu.js";
import { addStyleListeners } from "./styleOptions.js";

import { initLegend as initLegend } from "./interface/map/legend.js";
import { GlobalData, setIndicatorsData } from "./data/globaldata.js";
import { changeBG, uploadFromURL2011, uploadFromURL2016 } from "./upload.js";
import { showLoader } from "./interface/loader.js";
import {
  eventHover,
  menuInitDropdownBehaviour,
} from "./interface/menu/sidemenu.js";
import { choroplethSelectionHandler } from "./interface/menu/indicators/choropleth.js";

// Could also use fetch instead of import
// fetch("./boundaries_SA1_2016.geojson")
//   .then((response) => {
//     return response.json();
//   })
//   .then((data) => console.log(data));

// Mapbox token (taken from existing project)
const MAPBOX_TOKEN =
  "pk.eyJ1IjoibmR1bzAwMDMiLCJhIjoiY2tnNHlucmF3MHA4djJ6czNkaHRycmo1OCJ9.xfU4SWH35W5BYtJP8VnTEA";
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
  GlobalData.selectedAreas = areaTypes[selection].areas;
  GlobalData.geojsonAreaCode = areaTypes[selection].areaCodeProp;

  // Assign area ids
  for (let feature of GlobalData.selectedAreas.features) {
    feature.id = feature.properties[GlobalData.geojsonAreaCode];
  }

  // Re-init map boundaries
  initSource(map, GlobalData.selectedAreas, "boundariesSource");
  initSource(map, GlobalData.selectedAreas, "areasSource");
  // Pre-womble data again:
  setIndicatorsData();
  // button for drawing the edge heights based on womble calculation
  closeExistingPopups(map);
  choroplethSelectionHandler(map);
}

//// MAIN ////
// Main map object definition
let uploadBtn = document.querySelector("#csvInput");
uploadBtn.addEventListener("change", changeBG);

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
menuInitDropdownBehaviour();
initLegend();

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new DimensionToggle({ pitch: 45 }));

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

  uploadFromURL2011(map);
  uploadFromURL2016(map);

  // Add hover text on wombling selection options
  eventHover(
    "csvAuto2011-parent",
    "This data set uses the SA1 (Statistical Area 1) boundaries with 2011 indicators." +
      "<br> This data set contains: 1 urban liveability index, 15 raw indicators and 15 normalised indicators." +
      "<br> The normalised indicators used in the urban liveability index calculation will be preselected on load."
  );

  eventHover(
    "csvAuto2016-parent",
    "This data set uses the SA1 (Statistical Area 1) boundaries with 2016 indicators." +
      "<br> This data set contains: 1 urban liveability index and 7 indicators." +
      "<br> The indicators will be preselected on load."
  );

  eventHover(
    "custom-text",
    "The first column must contain area codes. All other columns must contain variable data."
  );
  eventHover(
    "indicator-options-tooltip",
    'Womble indicator options will only take effect upon clicking "Run".'
  );
  eventHover(
    "normalize-container",
    "Normalises the boundary differences using an exponential distribution. <br> Attempts to provide a more uniform distribution while retaining significant values."
  );
  eventHover(
    "distance-container",
    "Applies an additional distance weight to all the difference boundaries.<br> Distances are calculated from the centroids of each area."
  );
  eventHover(
    "rank-container",
    "Ranks the boundary differences instead of calculating womble as percentage of maximum. <br> Generally provides a uniform distribution of wombled values."
  );
});

// Run Womble Button
let runWombleButton = document.getElementById("run-womble-button");
runWombleButton.addEventListener("click", async () => {
  await showLoader(true, "Performing wombling");
  // Draw walls if in 3d mode, using buffered source (polygon features)
  runWomble(map, GlobalData.selectedUnbuffered, GlobalData.selectedBuffered);

  await showLoader(false);
});

// Choropleth selectors

// Default config
document.getElementById("boundaries-checkbox").checked = true;
