import { Dimensions } from "./enums.js";

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
