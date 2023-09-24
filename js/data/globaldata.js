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

export async function setIndicatorsDataFromUpload(d = null) {
  setIndicatorsData({ data: d });
}

/**
 * TODO:
 * @param {*} data
 */
export async function setIndicatorsData(data = null) {
  if (data != null) {
    await showLoader(true, "Starting data preprocessing");

    GlobalData.indicatorsData = data.data;
    let headers = Object.keys(data.data[0]);
    GlobalData.csvAreaID = headers.shift();
    GlobalData.indicatorsHeaders = headers;
    // Remove nulls
    GlobalData.indicatorsData = GlobalData.indicatorsData.filter(
      (row) => row[GlobalData.csvAreaID] != null
    );

    // Convert to numbers
    for (let row of GlobalData.indicatorsData) {
      for (let header of GlobalData.indicatorsHeaders) {
        row[header] = Number(row[header]);
      }
      row[GlobalData.csvAreaID] = row[GlobalData.csvAreaID].toString();
    }
  }
  if (GlobalData.indicatorsData == undefined) {
    return;
  }
  // The glorious hash map
  const globalIndicatorTestMap = new Map();
  for (let i of GlobalData.indicatorsData) {
    globalIndicatorTestMap.set(i.sa1, i);
  }

  // Used for choropleth
  var startTime = performance.now();
  removeUndefinedAreas(globalIndicatorTestMap);
  GlobalData.selectedAreas.features = GlobalData.selectedAreas.features.map(
    (row) => {
      row.properties = {
        ...row.properties,
        ...globalIndicatorTestMap.get(row.id),
      };
      return row;
    }
  );
  var endTime = performance.now();
  console.log("Choropleth preprocessing", endTime - startTime);

  console.log(GlobalData.selectedAreas);
  await showLoader(true, "Starting data preprocessing");
  const headers = GlobalData.indicatorsHeaders;
  // Normalise everything?
  console.log("Indicators Data", GlobalData.indicatorsData);
  await showLoader(true, "Removing non-indicator boundaries");

  // Remove all boundaries which do not have indicators assigned to them
  var startTime = performance.now();
  removeUndefinedBoundaries(
    GlobalData.selectedUnbuffered,
    globalIndicatorTestMap
  );
  removeUndefinedBoundaries(
    GlobalData.selectedBuffered,
    globalIndicatorTestMap
  );
  var endTime = performance.now();
  console.log("Removed undefined", endTime - startTime);

  await showLoader(true, "Performing pre-wombling");
  startTime = performance.now();
  // PREPROCESS EVERY SINGLE BOUNDARY
  for (let i in GlobalData.selectedUnbuffered.features) {
    let boundary = GlobalData.selectedUnbuffered.features[i];
    let row1 = globalIndicatorTestMap.get(boundary.properties.sa1_id1);
    let row2 = globalIndicatorTestMap.get(boundary.properties.sa1_id2);
    boundary["raw"] = {};
    for (let header of headers) {
      boundary["raw"][header] = Math.abs(row1[header] - row2[header]);
    }
  }
  for (let i in GlobalData.selectedBuffered.features) {
    let boundary = GlobalData.selectedBuffered.features[i];
    let row1 = globalIndicatorTestMap.get(boundary.properties.sa1_id1);
    let row2 = globalIndicatorTestMap.get(boundary.properties.sa1_id2);
    boundary["raw"] = {};
    for (let header of headers) {
      boundary["raw"][header] = Math.abs(row1[header] - row2[header]);
    }
  }
  endTime = performance.now();
  console.log("TIMING", endTime - startTime);

  await showLoader(true, "Performing data scaling");
  // SCALE EVERY BOUNDARY
  startTime = performance.now();
  scaleDataColumns(GlobalData.selectedUnbuffered.features, headers);
  scaleDataColumns(GlobalData.selectedBuffered.features, headers);
  endTime = performance.now();
  console.log("Scaling", endTime - startTime);

  await showLoader(true, "Performing data normalisation");
  startTime = performance.now();
  normaliseDataColumns(GlobalData.selectedUnbuffered.features, headers);
  normaliseDataColumns(GlobalData.selectedBuffered.features, headers);
  endTime = performance.now();
  console.log("Norm", endTime - startTime);

  await showLoader(true, "Performing data ranking");
  startTime = performance.now();
  rankDataColumns(GlobalData.selectedUnbuffered.features, headers);
  rankDataColumns(GlobalData.selectedBuffered.features, headers);
  endTime = performance.now();
  console.log("Rank", endTime - startTime);

  console.log("ALL BOUNDARIES UNBUFFERED", GlobalData.selectedUnbuffered);
  console.log("ALL BOUNDARIES BUFFERED", GlobalData.selectedBuffered);
  await showLoader(false);
  createVariables(headers);
}

function removeUndefinedBoundaries(source, indicatorHashMap) {
  // Convert IDs to Strings
  source.features.forEach((row) => {
    row.properties.sa1_id1 = row.properties.sa1_id1 + "";
  });
  source.features.forEach((row) => {
    row.properties.sa1_id2 = row.properties.sa1_id2 + "";
  });

  source.features = source.features.filter((boundary) => {
    return (
      indicatorHashMap.has(boundary.properties.sa1_id1) &&
      indicatorHashMap.has(boundary.properties.sa1_id2)
    );
  });
}

function removeUndefinedAreas(indicatorHashMap) {
  GlobalData.selectedAreas.features = GlobalData.selectedAreas.features.filter(
    (area) => {
      return indicatorHashMap.has(area.properties[GlobalData.geojsonAreaCode]);
    }
  );
}
