import { GlobalData } from "./data/globaldata.js";
import { Dimensions, LightModes } from "./util/enums.js";
import {
  getColourExpression,
  getConstantWidthExpression,
  getHeightExpression,
  getVariableWidthExpression,
} from "./expressions.js";
import { variableCheckboxHandler } from "./interface/menu/indicators/variableOptions.js";

export function addInputListeners(map) {
  // each element in this array corresponds to some sort of option that the user has
  // the object describes the html id of the input element, the function that handles the input, and the event to trigger the input handler
  let elemObjects = [
    {
      id: "boundaries-checkbox",
      handler: boundariesCheckboxHandler,
      event: "click",
    },
    { id: "walls-checkbox", handler: wallsCheckboxHandler, event: "click" },
    { id: "color-checkbox", handler: colourCheckboxHandler, event: "click" },
    { id: "height-checkbox", handler: heightCheckboxHandler, event: "click" },
    {
      id: "transparency-slider",
      handler: transparencySliderHandler,
      event: "input",
    },
    { id: "min-slider", handler: minMaxSliderHandler, event: "input" },
    { id: "max-slider", handler: minMaxSliderHandler, event: "input" },
    { id: "select-all-button", handler: selectAllHandler, event: "click" },
    { id: "deselect-all-button", handler: selectNoneHandler, event: "click" },
  ];

  // add event listeners for each option element
  for (let elemObject of elemObjects) {
    let element = document.getElementById(elemObject.id);
    element.addEventListener(elemObject.event, () => {
      elemObject.handler(map);
    });
  }
}

export function runAllInputHandlers(map) {
  let inputHandlers = [
    boundariesCheckboxHandler,
    wallsCheckboxHandler,
    colourCheckboxHandler,
    heightCheckboxHandler,
    transparencySliderHandler,
    minMaxSliderHandler,
    dimensionHandler,
  ];

  for (let handler of inputHandlers) {
    handler(map);
  }
}
/**
 * Toggles boundaries according to boundaries checkbox.
 * @param {*} map map object
 * @returns
 */
function boundariesCheckboxHandler(map) {
  // if the clicked layer doesn't exist, return
  if (!map.getLayer("boundaries")) {
    return;
  }
  map.setLayoutProperty(
    "boundaries",
    "visibility",
    document.getElementById("boundaries-checkbox").checked ? "visible" : "none"
  );
}

/**
 * Toggle walls according to walls checkbox.
 * @param {*} map map object
 * @returns
 */
function wallsCheckboxHandler(map) {
  let checkbox = document.getElementById("walls-checkbox");
  if (
    map.getLayer("walls3D") &&
    GlobalData.appDimension == Dimensions.THREE_D
  ) {
    map.setLayoutProperty(
      "walls3D",
      "visibility",
      checkbox.checked ? "visible" : "none"
    );
  }

  if (map.getLayer("walls2D") && GlobalData.appDimension == Dimensions.TWO_D) {
    map.setLayoutProperty(
      "walls2D",
      "visibility",
      checkbox.checked ? "visible" : "none"
    );
  }
}

/**
 *
 * @param {*} map map object
 * @returns
 */
function colourCheckboxHandler(map) {
  let checkbox = document.getElementById(`color-checkbox`);
  let color = checkbox.checked ? getColourExpression() : "#808080";
  if (map.getLayer("walls3D")) {
    map.setPaintProperty("walls3D", "fill-extrusion-color", color);
  }

  if (map.getLayer("walls2D")) {
    map.setPaintProperty("walls2D", "line-color", color);
  }
}

function heightCheckboxHandler(map) {
  let checkbox = document.getElementById(`height-checkbox`);
  if (map.getLayer("walls3D")) {
    map.setPaintProperty(
      "walls3D",
      "fill-extrusion-height",
      checkbox.checked ? getHeightExpression() : 250
    );
  }
  if (map.getLayer("walls2D")) {
    map.setPaintProperty(
      "walls2D",
      "line-width",
      checkbox.checked
        ? getVariableWidthExpression()
        : getConstantWidthExpression()
    );
  }

  if (map.getLayer("borderOutline")) {
    map.setPaintProperty(
      "borderOutline",
      "line-width",
      checkbox.checked
        ? getVariableWidthExpression(5)
        : getConstantWidthExpression(5)
    );
  }
}

function transparencySliderHandler(map) {
  // elements for the transparency slider
  let transparencySlider = document.getElementById("transparency-slider");
  let transparencySliderValue = document.getElementById(
    "transparency-slider-value"
  );

  // value indicator
  transparencySliderValue.textContent = transparencySlider.value + "%";

  if (!map.getLayer("walls2D")) {
    console.log("Layer doesn't exist");
    return;
  }

  // adjust the boundary layer's fill-extrusion-opacity value. If you change the id of the boundary layer you'll also have to change it here
  map.setPaintProperty(
    "walls2D",
    "line-opacity",
    parseInt(transparencySlider.value, 10) / 100
  );
  map.setPaintProperty(
    "walls3D",
    "fill-extrusion-opacity",
    parseInt(transparencySlider.value, 10) / 100
  );
}

function minMaxSliderHandler(map) {
  // if either slider is adjusted, we have to perform the min max filter

  // elements for the min/max sliders
  let minSlider = document.getElementById("min-slider");
  let minSliderValue = document.getElementById("min-slider-value");
  let maxSlider = document.getElementById("max-slider");
  let maxSliderValue = document.getElementById("max-slider-value");
  let sliderTrack = document.getElementById("min-max-slider-track");

  fillDualSliderColour(minSlider, maxSlider, sliderTrack, 1);

  // automatically adjust slider if user makes min > max
  if (parseFloat(minSlider.value) > parseFloat(maxSlider.value)) {
    console.log("Max must be greater than or equal to min");
    // maxSlider.value = minSlider.value;
    minSlider.value = maxSlider.value;
  }

  let min = parseFloat(minSlider.value);
  let max = parseFloat(maxSlider.value);

  // update display values
  minSliderValue.textContent = min;
  maxSliderValue.textContent = max;

  if (!map.getLayer("walls2D")) {
    console.log("No walls to filter yet");
    return;
  }

  // filter the walls layer

  // returns true if wall's womble_scaled is >= min slider value
  let greaterThanMinExpression = [">=", ["get", "womble_scaled"], min];

  // returns true if wall's womble_scaled is <= max slider value
  let lessThanMaxExpression = ["<=", ["get", "womble_scaled"], max];

  // returns true if wall's womble_scaled is in the range [min, max]
  let filterExpression = [
    "all",
    greaterThanMinExpression,
    lessThanMaxExpression,
  ];

  map.setFilter("walls2D", filterExpression);
  map.setFilter("walls3D", filterExpression);
}

function fillDualSliderColour(slider1, slider2, sliderTrack, maxValue) {
  let percent1 = (slider1.value / maxValue) * 100;
  let percent2 = (slider2.value / maxValue) * 100;
  sliderTrack.style.background = `linear-gradient(to right, #efefef ${percent1}%, #0075ff ${percent1}%, #0075ff ${percent2}%, #efefef ${percent2}%)`;
}

function dimensionHandler(map) {
  switch (GlobalData.appDimension) {
    case Dimensions.TWO_D:
      map.setLayoutProperty("walls3D", "visibility", "none");
      map.setLayoutProperty("walls2D", "visibility", "visible");
      break;
    case Dimensions.THREE_D:
      map.setLayoutProperty("walls2D", "visibility", "none");
      map.setLayoutProperty("walls3D", "visibility", "visible");
      break;
  }
}
// TODO: move control buttons into one file together?
// ALSO, changing the style just doesn't work, b/c it deletes all existing layers and sources
export class darkModeToggle {
  constructor(mode = LightModes.LIGHT) {
    this._mode = mode;
  }
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this._btn = document.createElement("button");

    this._btn.addEventListener("click", () => {
      // if light, change to dark
      if (this._mode == LightModes.LIGHT) {
        console.log(map.getStyle());
        let currentStyle = map.getStyle();

        this._mode = LightModes.DARK;
        map.setStyle("mapbox://styles/mapbox/dark-v11");
      }
      // if dark, change to light
      else if (this._mode == LightModes.DARK) {
        this._mode = LightModes.LIGHT;
        map.setStyle("mapbox://styles/mapbox/light-v11");
      }
    });

    this._container.appendChild(this._btn);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

function selectAllHandler(map) {
  let i = 0;
  while (true) {
    let next = document.getElementById("variable-" + i);
    if (next == null || next == undefined) {
      break;
    }
    next.checked = true;
    i++;
  }
  variableCheckboxHandler();
}
function selectNoneHandler(map) {
  let i = 0;
  while (true) {
    let next = document.getElementById("variable-" + i);
    if (next == null || next == undefined) {
      break;
    }
    next.checked = false;
    i++;
  }
  variableCheckboxHandler();
}
