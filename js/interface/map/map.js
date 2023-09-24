import { GlobalData } from "../../data/globaldata.js";
import {
  getChoroplethColourExpression,
  getColourExpression,
  getHeightExpression,
  getVariableWidthExpression,
} from "../../expressions.js";

/**
 * Adds the source and corresponding layer to the map.
 * @param {*} map the map object the source and layer is added to
 * @param {*} sourceData raw feature data
 * @param {*} sourceID the name of the source
 * @param {*} optionalData optional layer data to work out the layer
 * @returns
 */
export function initSource(map, sourceData, sourceID, before = null) {
  // If source exists, simply update the data
  if (map.getSource(sourceID)) {
    map.getSource(sourceID).setData(sourceData);
    return;
  }
  map.addSource(sourceID, {
    type: "geojson",
    data: sourceData,
  });
  // Otherwise, add the source + layer
  initLayer(map, sourceID, before);
}

/**
 * Adds the layer to the corresponding source.
 * @param {*} map the map object which the layer is added to
 * @param {*} sourceID source to add the layer
 */
export function initLayer(map, sourceID, before = null) {
  // Layer defines how to display the source
  let layer = { source: sourceID };
  switch (sourceID) {
    case "boundariesSource":
      //
      layer = {
        ...layer,
        id: "boundaries", // this needs to be unique
        type: "line",
        paint: {
          "line-color": "grey",
          "line-width": 0.2,
        },
      };
      break;
    case "areasSource":
      //
      layer = {
        ...layer,
        id: "areas", // this needs to be unique
        type: "fill",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selectedArea1"], false],
            "purple",
            ["boolean", ["feature-state", "selectedArea2"], false],
            "green",
            ["boolean", ["feature-state", "selected"], false],
            "purple",
            ["boolean", ["feature-state", "neighbour"], false],
            "lightgreen",
            "blue",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selectedArea1"], false],
            1,
            ["boolean", ["feature-state", "selectedArea2"], false],
            1,
            ["boolean", ["feature-state", "selected"], false],
            0.6,
            ["boolean", ["feature-state", "neighbour"], false],
            0.6,
            0,
          ],
        },
        filter: ["boolean", true], // initialise filter to show no features by setting false
      };
      break;
    case "wallsSource2D":
      //
      layer = {
        ...layer,
        id: "walls2D",
        type: "line",
        layout: {
          "line-cap": "round",
          "line-join": "miter", // this doesn't seem to actually join the lines properly
        },
        paint: {
          "line-color": getColourExpression(),
          "line-width": getVariableWidthExpression(),
        },
      };
      break;
    case "wallsSource3D":
      //
      layer = {
        ...layer,
        id: "walls3D", // this needs to be unique
        type: "fill-extrusion",
        paint: {
          "fill-extrusion-color": getColourExpression(),
          "fill-extrusion-height": getHeightExpression(),
        },
      };
      break;
    case "choroplethSource":
      const indicator = document.getElementById(
        "choropleth-indicatorChange"
      ).value;
      const active = document.getElementById("choropleth-checkbox").checked;
      layer = {
        ...layer,
        id: "choropleth",
        type: "fill",
        paint: {
          "fill-color": getChoroplethColourExpression(indicator),
          "fill-opacity": 0.6,
        },
        filter: ["boolean", active],
      };
      if (map.getLayer("choropleth")) {
        map.removeLayer("choropleth");
      }
      break;
  }

  if (before == null) {
    map.addLayer(layer);
  } else {
    map.addLayer(layer, before);
  }
}

export function removeSourceLayer(map, sourceID) {
  let layerID = "";
  switch (sourceID) {
    case "wallsSource2D":
      layerID = "walls2D";
      break;
    case "wallsSource3D":
      layerID = "walls3D";
      break;
    case "choroplethSource":
      layerID = "choropleth";
      break;
    case "areasSource":
      layerID = "areas";
      break;
  }
  if (map.getLayer(layerID)) {
    map.removeLayer(layerID);
  }
  if (map.getSource(sourceID)) {
    map.removeSource(sourceID);
  }
}
