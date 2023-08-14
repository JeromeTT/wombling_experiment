/**
 * OLD IMPLEMENTATION
 * Draws the heights of the edges based on their womble values.
 * Runs when the user presses the "Run" button after selecting their indicator weights.
 */
// export function drawHeights(map, source) {
//   // TODO: maybe move this function to boundaries.js or just keep it idk

//   // outline:
//   // construct an array that stores edges with their associated womble value as objects
//   // use setPaintProperty on the boundaries layer to set the extrusion heights based on this constructed array
//   // this can be achieved with a 'match' expression
//   // idea drawn from: https://docs.mapbox.com/mapbox-gl-js/example/data-join/

//   const HEIGHT_MULTIPLIER = 5000;
//   let edges = source["features"]; // get all edges from the source into one array
//   let edgeCalculation = []; // output array, where each element is an edge object containing their associated calculated womble value
//   let rawWombleValues = [];
//   let maxWomble = 0; // used to calculate womble_scaled

//   // create array of womble values for each edge
//   for (let edge of edges) {
//     let womble = calculateWomble(edge);
//     rawWombleValues.push(womble);

//     // keep track of the largest womble value
//     if (womble > maxWomble) {
//       maxWomble = womble;
//     }
//   }

//   // handling the case where the max womble is somehow zero, i dont think this should ever happen
//   if (maxWomble == 0) {
//     console.log("Max womble value in this data set is zero");
//     return;
//   }

//   // create our output calculations array
//   for (let i = 0; i < edges.length; i++) {
//     // create the output "row" then add it to our calculations array
//     let edge = edges[i];

//     // TODO: the keys are hardcoded here, what happens if the data is using sa2 id's ? have to think of a more dynamic approach. perhaps we specify that the area id's have to be name area_id1 and area_id2
//     let output = {
//       ogc_fid: edge["properties"]["ogc_fid"],
//       sa1_id1: edge["properties"]["sa1_id1"],
//       sa1_id2: edge["properties"]["sa1_id2"],
//       womble: rawWombleValues[i],
//       womble_scaled: rawWombleValues[i] / maxWomble,
//     };
//     edgeCalculation.push(output);
//   }

//   // console.log(edgeCalculation);
//   // console.log(maxWomble);

//   // building a match expression to get each boundary's womble value, using the ogc_fid as the lookup key
//   let matchExpression = ["match", ["get", "ogc_fid"]];

//   // calculate height of each edge and add to the match expression
//   for (let edge of edgeCalculation) {
//     let height;
//     // if womble value exists for this edge, use it to calculate the edge's height
//     if ("womble_scaled" in edge) {
//       height = edge["womble_scaled"] * HEIGHT_MULTIPLIER;
//     }
//     // else set the height to zero (?)
//     else {
//       height = 0;
//     }

//     matchExpression.push(edge["ogc_fid"], height);
//   }

//   // make the fallback value null or zero? it shouldnt really matter since i think ill code it such that all the ids match
//   matchExpression.push(0);
//   // console.log(matchExpression);

//   // TODO: fix the polygon glitch for this layer, maybe see if there is a way to NOT draw a height for a particular edge
//   if (map.getLayer("walls")) {
//     map.setPaintProperty("walls", "fill-extrusion-height", matchExpression);
//   } else {
//     let wallsLayer = {
//       id: "walls", // this needs to be unique
//       type: "fill-extrusion",
//       source: "boundarySource",
//       paint: {
//         "fill-extrusion-color": "red",
//         "fill-extrusion-opacity": 1,
//         "fill-extrusion-height": matchExpression,
//       },
//     };

//     map.addLayer(wallsLayer);
//   }

//   console.log("Heights drawn");
// }

/**
 * Adds thickness to the edges based on their womble values.
 * Runs when the user presses the "Run" button after selecting their indicator weights, while in 2D mode.
 * @param {*} map mapbox map object that the walls will be drawn on
 * @param {*} source geojson source for the boundaries upon which walls will be drawn
 */
// export function drawThicknesses(map, source) {
//   console.log("drawing thicknesses");
//   const WIDTH_MULTIPLIER = 10;
//   let thicknessesData = generateWombleFeaturesData(source);

//   // if thicknesses have already been drawn (i.e. thicknesses source exists), update the source data with the new data
//   if (map.getSource("thicknessesSource")) {
//     map.getSource("thicknessesSource").setData(thicknessesData);
//   }
//   // else, add the thicknesses source and draw the layer for the first time
//   else {
//     // use the data json object as the source for the thicknesses layer
//     let thicknessesSource = {
//       type: "geojson",
//       data: thicknessesData,
//     };

//     console.log(thicknessesSource);

//     map.addSource("thicknessesSource", thicknessesSource);

//     // colors to use for the categories
//     const colors = ["#be87b9", "#dcc2dc", "#ebedec", "#b5bcd7"];

//     // create and draw the layer
//     let thicknessesLayer = {
//       id: "thicknesses", // this needs to be unique
//       type: "line",
//       source: "thicknessesSource",

//       layout: {
//         "line-join": "miter",
//         "line-miter-limit": 0,
//       },
//       paint: {
//         "line-color": [
//           "case",
//           [">=", ["to-number", ["get", "womble_scaled"]], 1],
//           colors[0],
//           [">=", ["to-number", ["get", "womble_scaled"]], 0.6],
//           colors[3],
//           [">=", ["to-number", ["get", "womble_scaled"]], 0.3],
//           colors[2],
//           colors[1],
//         ],
//         "line-opacity": 1,

//         // mapbox expression to multiply each feature's womble property with some constant to calculate the width drawn
//         "line-width": ["*", ["get", "womble_scaled"], WIDTH_MULTIPLIER],
//       },
//     };

//     map.addLayer(thicknessesLayer);
//   }

//   // hide boundaries directly after running womble
//   document.getElementById("boundaries-checkbox").checked = false;
//   map.setLayoutProperty("boundaries", "visibility", "none");

//   // hide loading spinner once the map loads
//   document.getElementById("loader").setAttribute("hidden", true);
// }
