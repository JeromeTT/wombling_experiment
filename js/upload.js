import { GlobalData, setIndicatorsData } from "./data/globaldata.js";
import Papa from "https://cdn.skypack.dev/papaparse@5.3.0";
import { areaDropDownHandler } from "./index.js";
import { updateChoropleth } from "./interface/menu/indicators/choropleth.js";
import { removeSourceLayer } from "./interface/map/map.js";
import { removeBoundaryOutline } from "./interface/map/boundaries.js";
import { clearPopupMenuArea } from "./interface/menu/sidemenu.js";
import { variableCheckboxHandler } from "./interface/menu/indicators/variableOptions.js";

export function changeBG(e) {
  const customTxt = document.getElementById("custom-text");
  let uploadBtn = document.querySelector("#csvInput");
  e.preventDefault();
  if (uploadBtn.value) {
    customTxt.innerHTML = uploadBtn.value.match(
      /[\/\\]([\w\d\s\.\-\(\)]+)$/
    )[1];
  } else {
    customTxt.innerHTML = "No file chosen, yet";
  }

  const file = e.target.files[0];
  // const reader = new FileReader();

  // reader.onload = function (e) {
  //   setIndicatorsData(csvToArr(e.target.result, ","));
  // };

  // console.log(indicatorsData);

  // reader.readAsText(file);

  let papaParseCallback = function (results) {
    let headers = Object.keys(results.data[0]);
    setIndicatorsData(results);
  };

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: papaParseCallback,
  });
}

function csvToArr(stringVal, splitter) {
  const [keys, ...rest] = stringVal
    .replace(/['"]+/g, "") // gets rid of quotation marks from the csv data
    .trim()
    .split("\n")
    .map((item) => item.split(splitter));

  const headers = Object.values(keys);

  const formedArr = rest.map((item) => {
    const object = {};
    keys.forEach((key, index) => (object[key] = parseFloat(item.at(index))));
    return object;
  });
  return [formedArr, headers];

  // return formedArr;
}

export function uploadFromURL2011(map) {
  const button = document.getElementById("csvAuto2011");
  button.addEventListener("click", () => {
    const dropdown = document.getElementById("areasSelect");
    const customTxt = document.getElementById("custom-text");
    //////////////////
    GlobalData.indicatorsData = undefined;
    removeSourceLayer(map, "choroplethSource");
    removeSourceLayer(map, "wallsSource2D");
    removeSourceLayer(map, "wallsSource3D");
    removeSourceLayer(map, "areasSource");
    GlobalData.selectedArea = {
      areas: null,
      neighbours: new Set(),
    };
    clearPopupMenuArea();

    removeBoundaryOutline(map);
    dropdown.value = "sa1_2011";
    //////////////////
    areaDropDownHandler(map);
    const url =
      "https://raw.githubusercontent.com/JeromeTT/wombling_experiment/main/liveability_sa1_2011.csv";
    d3.csv(url).then(async (d) => {
      await setIndicatorsData({ data: d });
      document.getElementById("choropleth-indicatorChange").value =
        "urban_liveability_index";
      updateChoropleth(map);

      let optionsDiv = document.getElementById("options");
      for (let i = 1; i <= 15; i++) {
        let checkbox =
          optionsDiv.children[i].children[0].querySelector("input");
        checkbox.checked = true;
      }
      variableCheckboxHandler();
    });
    customTxt.innerHTML = "liveability_sa1_2011.csv";
  });
}

export function uploadFromURL2016(map) {
  const button = document.getElementById("csvAuto2016");
  button.addEventListener("click", () => {
    const dropdown = document.getElementById("areasSelect");
    const customTxt = document.getElementById("custom-text");
    GlobalData.indicatorsData = undefined;
    removeSourceLayer(map, "choroplethSource");
    removeSourceLayer(map, "wallsSource2D");
    removeSourceLayer(map, "wallsSource3D");
    removeSourceLayer(map, "areasSource");
    GlobalData.selectedArea = {
      areas: null,
      neighbours: new Set(),
    };
    clearPopupMenuArea();
    removeBoundaryOutline(map);
    dropdown.value = "sa1_2016";
    areaDropDownHandler(map);
    const url =
      "https://raw.githubusercontent.com/JeromeTT/wombling_experiment/main/liveability_sa1_2016.csv";
    d3.csv(url).then(async (d) => {
      await setIndicatorsData({ data: d });
      document.getElementById("choropleth-indicatorChange").value =
        "urban_liveability_index";
      updateChoropleth(map);

      let optionsDiv = document.getElementById("options");
      for (let i = 1; i <= 7; i++) {
        let checkbox =
          optionsDiv.children[i].children[0].querySelector("input");
        checkbox.checked = true;
      }
      variableCheckboxHandler();
    });
    customTxt.innerHTML = "liveability_sa1_2016.csv";
    updateChoropleth(map);
  });
}
