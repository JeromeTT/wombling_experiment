import { Dimensions } from "../util/enums.js";
import { createVariables } from "../interface/menu/indicators/variableOptions.js";
import {
  normaliseDataColumns,
  scaleDataColumns,
  rankDataColumns,
} from "../util/normalise.js";
import { showLoader } from "../interface/loader.js";

/**
 * Global data object.
 */
export class GlobalData {
  // The dimension that the app is currently in (2d or 3d)
  static appDimension = Dimensions.TWO_D;
  // AREAS
  // Area code column name
  static geojsonAreaCode;

  //// INDICATORS
  // Array storing the indicator data
  static indicatorsData;
  // The name of the column containing the IDs (for example: sa1)
  static csvAreaID;
  // Headers of each indicator column
  static indicatorsHeaders;

  // Buffered and Unbuffered datasets
  static selectedUnbuffered;
  static selectedBuffered;

  // Stores the user's selected variables for running the womble calc
  static selectedVariables;
  static getWombleIndicators() {
    let values = [];
    for (let i = 0; i < GlobalData.indicatorsHeaders.length; i++) {
      let currentVariable = document.getElementById(`variable-${i}`);
      if (currentVariable.checked) {
        // make indicator slider visisble
        // createIndicatorSliders(currentVariable.innerText, i);
        values.push(GlobalData.indicatorsHeaders[i]);
      }
    }
    return values;
  }
  static selectedArea = { areas: null, neighbours: new Set() };
}

/**
 * TODO:
 * @param {*} data
 */
export async function setIndicatorsData(data) {
  await showLoader(true, "Starting data preprocessing");

  GlobalData.indicatorsData = data.data;
  let headers = Object.keys(data.data[0]);
  GlobalData.csvAreaID = headers.shift();
  GlobalData.indicatorsHeaders = headers;

  // Remove nulls
  GlobalData.indicatorsData = GlobalData.indicatorsData.filter(
    (row) => row[GlobalData.csvAreaID] != null
  );
  for (let row of GlobalData.indicatorsData) {
    for (let header of GlobalData.indicatorsHeaders) {
      row[header] = Number(row[header]);
    }
  }

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

  await showLoader(true, "Performing data scaling");
  // SCALE EVERY BOUNDARY
  scaleDataColumns(GlobalData.selectedUnbuffered.features, headers);
  scaleDataColumns(GlobalData.selectedBuffered.features, headers);

  await showLoader(true, "Performing data normalisation");
  normaliseDataColumns(GlobalData.selectedUnbuffered.features, headers);
  normaliseDataColumns(GlobalData.selectedBuffered.features, headers);

  await showLoader(true, "Performing data ranking");
  rankDataColumns(GlobalData.selectedUnbuffered.features, headers);
  rankDataColumns(GlobalData.selectedBuffered.features, headers);

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
