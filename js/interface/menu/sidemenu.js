import { GlobalData } from "../../data/globaldata.js";
import { COLORS } from "../../util/enums.js";
import { histogram } from "../charts.js";
import { findBoundary } from "../map/areas.js";
import { retrieveIndicatorSliders } from "./indicators/sliders.js";

export function menuInitDropdownBehaviour() {
  let dropdown = document.getElementById("menu-right-indicatorChange");
  dropdown.addEventListener("change", () => {
    refreshDropdownSelections();
  });
}

export function updatePopupMenuArea1(area) {
  clearPopupMenuArea();
  updatePopupMenuArea(area, "area1-text", "area1-data", COLORS.PURPLE);
}

export function updatePopupMenuArea2(area) {
  updatePopupMenuArea(area, "area2-text", "area2-data", COLORS.GREEN);
}

function updatePopupMenuArea(
  area,
  textDivName,
  dataDivName,
  color = COLORS.DEFAULT
) {
  let areaCode = area;
  if (typeof areaCode === "object") {
    areaCode = area.id;
  }
  let feature = GlobalData.indicatorsData.find(
    (elem) => elem[GlobalData.csvAreaID] == areaCode
  );
  let areaTextDiv = document.getElementById(textDivName);
  areaTextDiv.setHTML(`ID: ${areaCode}`);

  let areaDiv = document.getElementById(dataDivName);
  areaDiv.innerHTML = ""; // Clear existing stuff
  for (let variable of GlobalData.selectedVariables) {
    let child = document.createElement("div");
    child.setAttribute("id", areaCode + variable);
    child.setAttribute("class", `${textDivName}-child`);
    let childInnerText = document.createElement("div");
    childInnerText.setAttribute("class", `${textDivName}-childInnerText`);
    let childInnerHistogram = document.createElement("div");
    childInnerHistogram.setAttribute(
      "class",
      `${textDivName}-childInnerHistogram`
    );
    childInnerText.setHTML(`Raw value: ${feature[variable].toFixed(2)}`);
    histogram({
      data: GlobalData.indicatorsData,
      parent: childInnerHistogram,
      reference: (d) => Number(d[variable]),
      datapoint: feature,
      color: color,
    });
    child.appendChild(childInnerText);
    child.appendChild(childInnerHistogram);
    areaDiv.appendChild(child);
  }
  refreshDropdownSelections();
}

export function updatePopupMenuBoundary(wall) {
  const weights = retrieveIndicatorSliders();
  let id1 = wall.properties.sa1_id1.toString();
  let id2 = wall.properties.sa1_id2.toString();

  const areaDiv = document.getElementById("area-difference-data");
  for (let i in GlobalData.selectedVariables) {
    const variable = GlobalData.selectedVariables[i];
    const weight = parseFloat(weights[i].value);
    const difference = wall.properties[variable];
    const differenceWeighted = (difference * weight) / 100;
    const differenceContribution =
      (differenceWeighted / wall.properties.womble) * 100;

    // Set title
    const child = areaDiv.appendChild(document.createElement("div"));
    child.setAttribute("id", id1 + id2 + variable);
    const histogramtitle = child.appendChild(document.createElement("div"));
    const histogramChild = child.appendChild(document.createElement("div"));
    histogramtitle.setHTML(
      `Actual contribution | Expected Contribution: <br> ${differenceContribution.toFixed(
        2
      )}% | ${weight.toFixed(2)}% <br> Raw difference: ${difference.toFixed(
        2
      )}  <br> Weighted Difference: ${differenceWeighted.toFixed(
        2
      )} (${weight.toFixed(2)}%)<br>`
    );

    histogram({
      data: GlobalData.selectedBuffered.features,
      parent: histogramChild,
      reference: (d) => Number(d.properties[variable]),
      datapoint: wall,
    });
  }
  refreshDropdownSelections();
}

export function updatePopupMenuWomble(wall) {
  let rawWomble = wall.properties.womble.toFixed(3);
  let scaledWomble = wall.properties.womble_scaled.toFixed(3);
  let description = `Raw womble: ${rawWomble} <br> Scaled womble: ${scaledWomble} <br> Neighbouring area IDs: <br> ID1: ${wall.properties.sa1_id1}, <br> ID2: ${wall.properties.sa1_id2} <div class="popup-charts"></div>`;

  let parent = document.getElementById("menu-right-wombled-data");
  parent.setHTML(description);
  let child = parent.appendChild(document.createElement("div"));
  histogram({
    data: GlobalData.generatedWombleValues,
    parent: child,
    reference: (d) => d.womble,
    datapoint: wall.properties,
  });
}
/**
 * Updates the dropdown selection
 */
export function updatePopupMenuDropdownOptions() {
  let select = document.getElementById("menu-right-indicatorChange");
  let currentlySelected = select.value;
  select.innerHTML = "";
  for (let variable of GlobalData.selectedVariables) {
    let option = document.createElement("option");
    option.setAttribute("value", variable);
    option.text = variable;
    select.appendChild(option);
    if (option.value == currentlySelected) {
      select.value = currentlySelected;
    }
  }
}

export function clearPopupMenuArea() {
  document.getElementById("area1-text").innerHTML = "";
  document.getElementById("area2-text").innerHTML = "";
  document.getElementById("area1-data").innerHTML = "";
  document.getElementById("area2-data").innerHTML = "";
  document.getElementById("area-difference-data").innerHTML = "";
  document.getElementById("menu-right-wombled-data").innerHTML = "";
}

/**
 * Shows and hides the relevant elements according to the dropdown
 */
export function refreshDropdownSelections() {
  let dropdownVal = document.getElementById("menu-right-indicatorChange").value;
  let lst = ["area-difference-data", "area1-data", "area2-data"];
  for (let name of lst) {
    let data1 = document.getElementById(name);
    for (let child of data1.children) {
      if (child.id.includes(dropdownVal)) {
        child.style.display = null;
      } else {
        child.style.display = "none";
      }
    }
  }

  // Highlight relevant element on the indicator selection panel
  const options = document.getElementById("options");
  for (let child of options.children) {
    if (child.id == "form-check-" + dropdownVal) {
      child.classList.add("form-check-selected");
    } else {
      child.classList.remove("form-check-selected");
    }
  }

  //
}

export function refreshEntirePanel(map) {
  clearPopupMenuArea();
  updatePopupMenuDropdownOptions();
  if (GlobalData.selectedArea.areas == null) {
    return;
  }
  if (Array.isArray(GlobalData.selectedArea.areas)) {
    const id1 = GlobalData.selectedArea.areas[0];
    const id2 = GlobalData.selectedArea.areas[1];
    const wall = findBoundary(map, id1, id2);
    updatePopupMenuArea1(id1);
    updatePopupMenuArea2(id2);
    updatePopupMenuBoundary(wall);
    updatePopupMenuWomble(wall);
  } else {
    updatePopupMenuArea1(GlobalData.selectedArea.areas);
  }
}
