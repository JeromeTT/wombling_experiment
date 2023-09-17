import { retrieveIndicatorSliders } from "./interface/menu/indicators/sliders.js";
import { Dimensions, HELPERTEXT } from "./util/enums.js";
import { closeExistingPopups } from "./interface/popups.js";
import { runAllInputHandlers } from "./filter.js";
import { histogram } from "./interface/charts.js";
import { GlobalData } from "./data/globaldata.js";
import { initSource } from "./interface/map/map.js";
import { showLoader } from "./interface/loader.js";
import { refreshEntirePanel } from "./interface/menu/sidemenu.js";
import { showHelperText } from "./interface/helpertext.js";
import { updateChoropleth } from "./interface/menu/indicators/choropleth.js";

/**
 * Draws the heights of the edges based on their womble values.
 * Runs when the user presses the "Run" button after selecting their indicator weights.
 * @param {*} map mapbox map object that the walls will be drawn on
 * @param {*} source geojson source for the boundaries upon which walls will be drawn
 */
export function runWomble(map, source2D, source3D) {
  GlobalData.selectedVariables = GlobalData.getWombleIndicators();
  GlobalData.test = source2D.features;
  generateWombleFeaturesData(source2D, source3D);
  initSource(
    map,
    {
      type: "FeatureCollection",
      features: source3D.features,
    },
    "wallsSource3D"
  );
  initSource(
    map,
    {
      type: "FeatureCollection",
      features: source2D.features,
    },
    "wallsSource2D"
  );

  // Hide boundaries directly after running womble
  document.getElementById("boundaries-checkbox").checked = false;
  runAllInputHandlers(map);
  closeExistingPopups(map);
  showHelperText(HELPERTEXT.DEFAULT);
  refreshEntirePanel(map);
}

/**
 * Creates womble data which can be used to draw features on a mapbox map.
 * Womble data will be created for each edge in the supplied source data.
 * This womble data is added as a property for each edge, but this is done so as a deep copy so as not to modify the supplied source data.
 * @param {*} source geojson source for the boundaries upon which the womble features will be drawn
 * @returns data in json form that can be supplied as the data property in a mapbox source
 */
function generateWombleFeaturesData(source2D, source3D) {
  let generatedWombleValues = [];
  let sliders = retrieveIndicatorSliders();
  // create array of womble values for each edge
  for (let edge of source2D["features"]) {
    generatedWombleValues.push(calculateWomble(edge, sliders));
  }

  // handling the case where the max womble is somehow zero, i dont think this should ever happen
  let maxWomble = d3.max(generatedWombleValues, (d) => d.womble);
  if (maxWomble == 0) {
    console.log("Max womble value in this data set is zero");
    showLoader(true, "Error: Max womble = 0");
    return;
  }

  histogram({
    data: generatedWombleValues,
    parent: ".dual-slider-overview",
    reference: (d) => d.womble,
  });

  GlobalData.generatedWombleValues = generatedWombleValues;

  // Assign the values in place
  for (let i in generatedWombleValues) {
    for (let [key, value] of Object.entries(generatedWombleValues[i])) {
      source2D.features[i]["properties"][key] = value;
      source3D.features[i]["properties"][key] = value;
    }
    source3D.features[i]["properties"]["womble_scaled"] =
      source3D.features[i]["properties"]["womble"] / maxWomble;
    source2D.features[i]["properties"]["womble_scaled"] =
      source2D.features[i]["properties"]["womble"] / maxWomble;
  }
  console.log("Feature Data?", source2D, source3D);
}

/**
 * Calculates the womble value for a particular edge
 * @param {Number} edge object corresponding to the edge that the womble calculation is being done for
 * @returns {Number} womble value
 */
function calculateWomble(edge, sliders) {
  // retrieve the user's selected indicator names and weights
  let selectedIndicators = [];
  let indicatorWeights = [];
  let featureList = { womble: 0 };
  for (let slider of sliders) {
    selectedIndicators.push(slider.getAttribute("indicatorname")); // each slider was previously created with an "indicatorname" attribute
    indicatorWeights.push(parseFloat(slider.value) / 100); // divide by 100 b/c the slider values are percentages
  }
  let stat = edge.raw;
  if (document.getElementById("normalize-checkbox").checked) {
    stat = edge.normalised;
  } else if (document.getElementById("rank-checkbox").checked) {
    stat = edge.rank;
  }
  for (let i in selectedIndicators) {
    if (isDistanceWeighted()) {
      featureList[selectedIndicators[i]] =
        stat[selectedIndicators[i]] / edge.properties.distance;
    } else {
      featureList[selectedIndicators[i]] = stat[selectedIndicators[i]];
    }
    featureList.womble +=
      indicatorWeights[i] * featureList[selectedIndicators[i]];
  }
  return featureList;
}

/**
 * Function that checks whether the user has chosen to use distance weighting
 */
function isDistanceWeighted() {
  let checkbox = document.getElementById("distance-weight-checkbox");
  return checkbox.checked;
}

/**
 * Control button for switching between 2D and 3D modes.
 * If pressed while in 2D mode, any existing walls are converted to fill-extrusion polygons, and pitch is added to the map.
 * If pressed while in 3D mode, any existing walls are converted to flat lines, and altering the map pitch is disabled.
 */
export class DimensionToggle {
  constructor({ pitch = 45 }) {
    this._previousPitch = pitch;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this._btn = document.createElement("button");

    // style the dimension toggle button depending on what dimension the app is in (i.e. if app is in 2d mode, show 3d on button)
    if (GlobalData.appDimension == Dimensions.TWO_D) {
      this._btn.className = `mapboxgl-ctrl-icon mapboxgl-ctrl-dimensiontoggle-3d`;
    } else if (GlobalData.appDimension == Dimensions.THREE_D) {
      this._btn.className = `mapboxgl-ctrl-icon mapboxgl-ctrl-dimensiontoggle-2d`;
    }

    // switch dimensions when this button is clicked
    this._btn.addEventListener("click", () => {
      if (GlobalData.appDimension == Dimensions.TWO_D) {
        this.#switchTo3d(map);
      } else if (GlobalData.appDimension == Dimensions.THREE_D) {
        this.#switchTo2d(map);
      }
    });

    this._container.appendChild(this._btn);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  #switchTo3d(map) {
    // switch to 3d
    GlobalData.appDimension = Dimensions.THREE_D;
    this._btn.className = `mapboxgl-ctrl-icon mapboxgl-ctrl-dimensiontoggle-2d`;

    // restore previous pitch
    map.easeTo({
      pitch: this._previousPitch,
      duration: 1000,
    });
    map.setMaxPitch(85); // default max pitch

    // set min zoom
    map.setMinZoom(9);

    // delete thicknesses and draw walls
    map.setLayoutProperty("walls2D", "visibility", "none");
    map.setLayoutProperty("walls3D", "visibility", "visible");
    // Change the radio label to height only
    document.getElementById("height-check-label").innerText =
      "Show Wall Height";
  }

  #switchTo2d(map) {
    // switch to 2d
    GlobalData.appDimension = Dimensions.TWO_D;
    this._btn.className = `mapboxgl-ctrl-icon mapboxgl-ctrl-dimensiontoggle-3d`;

    // disable pitch
    this._previousPitch = map.getPitch();
    map.easeTo({ pitch: 0, duration: 1000 });

    // set min zoom
    map.setMinZoom(9);
    map.setMaxPitch(0);
    // delete walls and draw thicknesses
    map.setLayoutProperty("walls3D", "visibility", "none");
    map.setLayoutProperty("walls2D", "visibility", "visible");
    // Change the radio label to width only
    document.getElementById("height-check-label").innerText = "Show Wall Width";
  }
}
