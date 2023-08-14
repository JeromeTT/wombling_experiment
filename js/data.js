import { Dimensions } from "./enums.js";
import { createVariables } from "./variableOptions.js";
import { normaliseDataColumns, scaleDataColumns } from "./util/normalise.js";

export class GlobalData {
  static geojsonAreaCode;
  // stores the user's selected variables for running the womble calc
  static selectedVariables;
  // another global to store the dimension that the app is currently in (2d or 3d)
  static appDimension = Dimensions.TWO_D;

  static indicatorsData;

  static optionsData;

  static csvAreaCode;

  static originalIndicatorsData;

  static selectedUnbuffered;

  static selectedBuffered;

  static selecteedAreas;

  static getWombleIndicators(optionsArray) {
    let values = [];
    for (let i = 0; i < optionsArray.length; i++) {
      let currentVariable = document.getElementById(`variable-${i}`);

      if (currentVariable.checked) {
        // make indicator slider visisble
        // createIndicatorSliders(currentVariable.innerText, i);
        values.push(optionsArray[i]);
      }
    }

    return values;
  }
}

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

  // Normalise everything?
  console.log("Indicators Data", GlobalData.indicatorsData);
  console.log("headers", headers);

  // Remove all boundaries which do not have indicators assigned to them
  GlobalData.selectedUnbuffered["features"] = removeUndefinedBoundaries(
    GlobalData.selectedUnbuffered["features"]
  );
  GlobalData.selectedBuffered["features"] = removeUndefinedBoundaries(
    GlobalData.selectedBuffered["features"]
  );

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

  for (let i in GlobalData.selectedBuffered.features) {
    let boundary = GlobalData.selectedBuffered.features[i];
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

  GlobalData.selectedBuffered.features = scaleDataColumns(
    GlobalData.selectedBuffered.features,
    headers
  );
  GlobalData.selectedBuffered.features = normaliseDataColumns(
    GlobalData.selectedBuffered.features,
    headers
  );
  console.log("ALL BOUNDARIES", GlobalData.selectedUnbuffered);
  createVariables(headers);
}

function removeUndefinedBoundaries(features) {
  return features.filter((boundary) => {
    let row1 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id1
    );
    let row2 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id2
    );
    return row1 != undefined && row2 != undefined;
  });
}
