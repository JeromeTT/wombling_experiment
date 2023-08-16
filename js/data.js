import { Dimensions } from "./enums.js";
import { createVariables } from "./variableOptions.js";
import {
  normaliseDataColumns,
  scaleDataColumns,
  rankDataColumns,
} from "./util/normalise.js";
import { showLoader } from "./interface/loader.js";
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
export async function setIndicatorsData(data) {
  await showLoader(true, "Starting data preprocessing");

  GlobalData.originalIndicatorsData = JSON.parse(JSON.stringify(data.data));
  GlobalData.indicatorsData = JSON.parse(JSON.stringify(data.data));
  let headers = Object.keys(data.data[0]);
  GlobalData.csvAreaCode = headers.shift();
  GlobalData.optionsData = headers;

  // Normalise everything?
  console.log("Indicators Data", GlobalData.indicatorsData);
  console.log("headers", headers);
  await showLoader(true, "Removing non-indicator boundaries");
  // Remove all boundaries which do not have indicators assigned to them
  removeUndefinedBoundaries(GlobalData.selectedUnbuffered);
  removeUndefinedBoundaries(GlobalData.selectedBuffered);

  // PREPROCESS EVERY SINGLE BOUNDARY
  await showLoader(true, "Performing pre-wombling");
  for (let i in GlobalData.selectedUnbuffered.features) {
    let boundary = GlobalData.selectedUnbuffered.features[i];
    let row1 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id1
    );
    let row2 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id2
    );
    boundary["raw"] = {};
    for (let header of headers) {
      boundary["raw"][header] = Math.abs(row1[header] - row2[header]);
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
    boundary["raw"] = {};
    for (let header of headers) {
      boundary["raw"][header] = Math.abs(row1[header] - row2[header]);
    }
  }
  await showLoader(true, "Performing data scaling.");
  // SCALE EVERY BOUNDARY
  setTimeout;
  await scaleDataColumns(GlobalData.selectedUnbuffered.features, headers);
  await scaleDataColumns(GlobalData.selectedBuffered.features, headers);

  await showLoader(true, "Performing data normalisation.");
  await normaliseDataColumns(GlobalData.selectedUnbuffered.features, headers);
  await normaliseDataColumns(GlobalData.selectedBuffered.features, headers);

  await showLoader(true, "Performing data ranking.");
  await rankDataColumns(GlobalData.selectedUnbuffered.features, headers);
  await rankDataColumns(GlobalData.selectedBuffered.features, headers);

  console.log("ALL BOUNDARIES UNBUFFERED", GlobalData.selectedUnbuffered);
  console.log("ALL BOUNDARIES BUFFERED", GlobalData.selectedBuffered);
  await showLoader(false);
  createVariables(headers);
}

function removeUndefinedBoundaries(source) {
  source.features = source.features.filter((boundary) => {
    let row1 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id1
    );
    let row2 = GlobalData.indicatorsData.find(
      (row) => row["sa1"] == boundary.properties.sa1_id2
    );
    return row1 != undefined && row2 != undefined;
  });
}
