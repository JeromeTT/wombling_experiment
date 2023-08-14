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
  initialiseLayer(map, sourceID);
}

export function initLayer(map, sourceID) {
  // Layer defines how to display the source
  let layer = { source: sourceID };
  switch (sourceID) {
    case "boundariesSource":
      layer = {
        id: "boundaries", // this needs to be unique
        type: "line",
        paint: {
          "line-color": "black",
          "line-width": 0.2,
        },
      };
    case "areasSource":
      layer = {
        id: "areas", // this needs to be unique
        type: "fill",
        paint: {
          "fill-color": "blue",
          "fill-opacity": 0.21,
        },
        //filter: ["boolean", true], // initialise filter to show no features by setting false
      };
    case "wallsSource2D":
    // pass
    case "wallsSource3D":
    // pass
    case "wallsSource":
      // if in 2d mode, draw thicknesses using line
      if (GlobalData.appDimension == Dimensions.TWO_D) {
        layer = {
          id: "walls",
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
      }
      // if in 3d mode, draw heights using fill-extrusion
      else if (GlobalData.appDimension == Dimensions.THREE_D) {
        layer = {
          id: "walls", // this needs to be unique
          type: "fill-extrusion",
          paint: {
            "fill-extrusion-color": getColourExpression(),
            "fill-extrusion-height": getHeightExpression(),
          },
        };
      }
  }
  map.addLayer(layer);
}
