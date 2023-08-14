import { retrieveIndicatorSliders } from "./sliders.js";
import { Dimensions } from "./enums.js";
import { closeExistingPopups } from "./interface/popups.js";
import { runAllInputHandlers } from "./filter.js";
import {
  getColourExpression,
  getHeightExpression,
  getVariableWidthExpression,
} from "./expressions.js";
import { histogram } from "./interface/charts.js";
import { GlobalData } from "./data.js";

/**
 * Draws the heights of the edges based on their womble values.
 * Runs when the user presses the "Run" button after selecting their indicator weights.
 * @param {*} map mapbox map object that the walls will be drawn on
 * @param {*} source geojson source for the boundaries upon which walls will be drawn
 */
export function runWomble(map, source) {
  closeExistingPopups(map);
  GlobalData.selectedVariables = GlobalData.getWombleIndicators(
    GlobalData.optionsData
  );
  let wallsData = generateWombleFeaturesData(source);
  // appendIndicatorsToAreas(map, "areasSource");

  // if walls have already been drawn (i.e. walls source exists), update the source data with the new data
  if (map.getSource("wallsSource")) {
    map.getSource("wallsSource").setData(wallsData);
  }
  // else, add the walls source and draw the layer for the first time
  else {
    // use the data json object as the source for the walls layer
    let wallsSource = {
      type: "geojson",
      data: wallsData,
    };

    map.addSource("wallsSource", wallsSource);
    addWallsLayer(map);
  }

  // hide boundaries directly after running womble
  document.getElementById("boundaries-checkbox").checked = false;
  map.setLayoutProperty("boundaries", "visibility", "none");

  // hide loading spinner once the map loads
  document.getElementById("loader").setAttribute("hidden", true);
}

export function addWallsLayer(map) {
  // create and draw the layer
  let wallsLayer;

  // if in 2d mode, draw thicknesses using line
  if (GlobalData.appDimension == Dimensions.TWO_D) {
    wallsLayer = {
      id: "walls",
      type: "line",
      source: "wallsSource",
      layout: {
        "line-cap": "round",
        "line-join": "miter", // this doesn't seem to actually join the lines properly
      },
      paint: {
        "line-color": getColourExpression(),
        "line-width": getVariableWidthExpression(),
      },
    };
  }
  // if in 3d mode, draw heights using fill-extrusion
  else if (GlobalData.appDimension == Dimensions.THREE_D) {
    wallsLayer = {
      id: "walls", // this needs to be unique
      type: "fill-extrusion",
      source: "wallsSource",
      paint: {
        "fill-extrusion-color": getColourExpression(),
        "fill-extrusion-height": getHeightExpression(),
      },
    };
  }

  map.addLayer(wallsLayer);

  runAllInputHandlers(map);
}

/**
 * Creates womble data which can be used to draw features on a mapbox map.
 * Womble data will be created for each edge in the supplied source data.
 * This womble data is added as a property for each edge, but this is done so as a deep copy so as not to modify the supplied source data.
 * @param {*} source geojson source for the boundaries upon which the womble features will be drawn
 * @returns data in json form that can be supplied as the data property in a mapbox source
 */
function generateWombleFeaturesData(source) {
  let edges = source["features"]; // get all edges from the source into one array

  let rawWombleValues = [];
  let maxWomble = 0; // used to calculate womble_scaled

  // create array of womble values for each edge
  for (let edge of edges) {
    let womble = calculateWomble(edge);
    rawWombleValues.push(womble);

    // keep track of the largest womble value
    if (womble > maxWomble) {
      maxWomble = womble;
    }
  }

  // handling the case where the max womble is somehow zero, i dont think this should ever happen
  if (maxWomble == 0) {
    console.log("Max womble value in this data set is zero");
    document.getElementById("loader").setAttribute("hidden", true);
    return;
  }

  // create a new geojson that will be used for the womble features source data
  let wombleFeaturesData = {
    type: "FeatureCollection",
    features: [],
  };
  console.log(rawWombleValues);
  histogram(rawWombleValues, ".dual-slider-overview");
  // add each edge that has a non-zero womble value to the walls source data
  for (let i = 0; i < edges.length; i++) {
    let edge = JSON.parse(JSON.stringify(edges[i])); // deep copying the edge so the original source is not modified
    if (rawWombleValues[i] != null) {
      edge["properties"]["womble"] = rawWombleValues[i];
      edge["properties"]["womble_scaled"] = rawWombleValues[i] / maxWomble;
      wombleFeaturesData.features.push(edge);
    }
  }
  console.log("Feature Data?", wombleFeaturesData);
  return wombleFeaturesData;
}

/**
 * Calculates the womble value for a particular edge
 * @param {Number} edge object corresponding to the edge that the womble calculation is being done for
 * @returns {Number} womble value
 */
function calculateWomble(edge) {
  let sliders = retrieveIndicatorSliders();

  // retrieve the user's selected indicator names and weights
  let selectedIndicators = [];
  let indicatorWeights = [];
  for (let slider of sliders) {
    selectedIndicators.push(slider.getAttribute("indicatorname")); // each slider was previously created with an "indicatorname" attribute
    indicatorWeights.push(parseFloat(slider.value) / 100); // divide by 100 b/c the slider values are percentages
  }

  let womble = 0;

  // Find the elements in the indicators csv array that corresponds to the edges neighbouring areas
  let area1 = GlobalData.indicatorsData.find(
    (area) => area[GlobalData.csvAreaCode] == edge["properties"]["sa1_id1"] // TODO: will have to update area code name, hardcoded to sa1_id1 for now
  );

  let area2 = GlobalData.indicatorsData.find(
    (area) => area[GlobalData.csvAreaCode] == edge["properties"]["sa1_id2"] // TODO: will have to update area code name, hardcoded to sa1_id2 for now
  );

  // if either or both of the areas are undefined it means the indicators csv doesn't have data for that area and therefore we cannot calculate a womble value for that edge
  if (area1 == undefined || area2 == undefined) {
    console.log(`Indicators data not found for this edge`);
    return null;
  }

  // actual womble calculation is done here
  for (let i = 0; i < selectedIndicators.length; i++) {
    // if an indicator value is found to not be a number, we can't calculate womble, communicate it to user. TODO: for now it prints to console, but we should print it to somewhere on the page
    if (
      isNaN(area1[selectedIndicators[i]]) ||
      area1[selectedIndicators[i]] === null
    ) {
      console.log(
        `Warning: Indicator value is not a number.
        Found: area ID: ${area1[GlobalData.csvAreaCode]},
        ${selectedIndicators[i]}: ${area1[selectedIndicators[i]]}`
      );
      return null;
    }
    if (
      isNaN(area2[selectedIndicators[i]]) ||
      area2[selectedIndicators[i]] === null
    ) {
      console.log(
        `Warning: Indicator value is not a number.
        Found: area ID: ${area2[GlobalData.csvAreaCode]},
        ${selectedIndicators[i]}: ${area2[selectedIndicators[i]]}`
      );
      return null;
    }

    if (document.getElementById("normalize-checkbox").checked) {
      womble += indicatorWeights[i] * Math.abs(edge[selectedIndicators[i]]);
      continue;
    }
    // womble += indicatorWeights[i] * absolute difference of (area1's selectedIndicator[i] value and area2's selectedIndicator[i] value)
    if (isDistanceWeighted()) {
      womble +=
        (indicatorWeights[i] *
          Math.abs(
            parseFloat(area1[selectedIndicators[i]]) -
              parseFloat(area2[selectedIndicators[i]])
          )) /
        edge["properties"]["distance"]; // divide by a distance property that we assume exists in the edge data
    } else {
      womble +=
        indicatorWeights[i] *
        Math.abs(
          parseFloat(area1[selectedIndicators[i]]) -
            parseFloat(area2[selectedIndicators[i]])
        );
    }
  }
  return womble;
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

  #convertWalls(map) {
    if (!map.getSource("wallsSource")) {
      console.log("No existing walls to convert");
      return;
    }

    let wallsData = map.getSource("wallsSource")._data;

    // will use either unbuffered or buffered features
    // unbuffered features if we're converting to 2d b/c we want lines
    // buffered features if we're converting to 3d b/c we want polygons that we can make fill-extrusions from
    let rawFeatures;
    if (GlobalData.appDimension == Dimensions.TWO_D) {
      rawFeatures = map.getSource("unbufferedSource")._data["features"];
    } else if (GlobalData.appDimension == Dimensions.THREE_D) {
      rawFeatures = map.getSource("bufferedSource")._data["features"];
    }

    // overwrite the geometries for each feature in the existing walls data
    for (let wall of wallsData["features"]) {
      // the raw source data will have more features than the existing walls data, b/c the walls data will have filtered out edges where the womble cannot be calculated
      // therefore, we need to "find" the features in the raw source that correspond with our existing walls
      let rawFeature = rawFeatures.find(
        (feature) => feature["properties"]["id"] == wall["properties"]["id"]
      );

      rawFeature = JSON.parse(JSON.stringify(rawFeature)); // deep copy so we don't somehow modify raw source
      wall["geometry"] = rawFeature["geometry"];
    }

    map.removeLayer("walls");
    map.getSource("wallsSource").setData(wallsData);
    addWallsLayer(map);
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
    this.#convertWalls(map);

    // Change the radio label to height only
    document.getElementById("colorOnly-label").innerText = "Height only";
    document.getElementById("both-check-label").innerText =
      "Both Color and Height";
  }

  #switchTo2d(map) {
    // switch to 2d
    GlobalData.appDimension = Dimensions.TWO_D;
    this._btn.className = `mapboxgl-ctrl-icon mapboxgl-ctrl-dimensiontoggle-3d`;

    // disable pitch
    this._previousPitch = map.getPitch();
    map.easeTo({ pitch: 0, duration: 1000 });
    map.setMaxPitch(0);

    // set min zoom
    map.setMinZoom(9);

    // delete walls and draw thicknesses
    this.#convertWalls(map);

    // Change the radio label to width only
    document.getElementById("colorOnly-label").innerText = "Width only";
    document.getElementById("both-check-label").innerText =
      "Both Color and Width";
  }
}
