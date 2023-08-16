import {
  getColourExpression,
  getHeightExpression,
  getVariableWidthExpression,
} from "../../expressions.js";

export function initSource(map, sourceData, sourceID) {
  // If source exists, simply update the data
  if (map.getSource(sourceID)) {
    map.getSource(sourceID).setData(sourceData);
    return;
  }
  // Otherwise, add the source + layer
  map.addSource(sourceID, {
    type: "geojson",
    data: sourceData,
  });
  initLayer(map, sourceID);
}

export function initLayer(map, sourceID) {
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
          "fill-color": "blue",
          "fill-opacity": 0.05,
        },
        //filter: ["boolean", true], // initialise filter to show no features by setting false
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
  }
  console.log("Adding layer", sourceID, layer);
  map.addLayer(layer);
}
