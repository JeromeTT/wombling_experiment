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
  areaTextDiv.setHTML(`
  <table class="value-table">
    <tr>
      <td> ID (${GlobalData.csvAreaID}):</th>
      <td> ${areaCode} </th>
    </tr>
  </table>`);

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
    childInnerText.setHTML(`
    <table class="value-table">
      <tr>
        <td> Raw value:</th>
        <td> ${feature[variable].toFixed(2)} </th>
      </tr>
    </table>`);
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
    const histogramtext = child.appendChild(document.createElement("div"));
    const histogramChild = child.appendChild(document.createElement("div"));
    histogramChild.setAttribute("class", "boundary-text-childOuterHistogram");
    histogramtext.setHTML(
      `<table class="boundary-table">
          <tr>
            <th style="width:50%"> Actual contribution</th>
            <th>Wombled contribution</th>
          </tr>
          <tr>
            <td>${differenceContribution.toFixed(2)}%</td>
            <td>${weight.toFixed(2)}%</td>
          </tr>
       </table>`
    );
    histogramChild.setHTML(`
    <table class="value-table">
      <tr>
        <td> Raw absolute difference:</th>
        <td> ${difference.toFixed(2)}</th>
      </tr>
      <tr>
        <td> Weighted absolute difference: (weighted ${weight.toFixed(2)}%)</th>
        <td> ${differenceWeighted.toFixed(2)}</th>
    </tr>
    </table>`);
    const actualHistogramChild = histogramChild.appendChild(
      document.createElement("div")
    );
    actualHistogramChild.setAttribute(
      "class",
      "boundary-text-childInnerHistogram"
    );
    histogram({
      data: GlobalData.selectedBuffered.features,
      parent: actualHistogramChild,
      reference: (d) => Number(d.properties[variable]),
      datapoint: wall,
    });
  }
  refreshDropdownSelections();
}

export function updatePopupMenuWomble(wall) {
  let rawWomble = wall.properties.womble.toFixed(3);
  let scaledWomble = wall.properties.womble_scaled.toFixed(3);
  let maxWomble = (
    wall.properties.womble / wall.properties.womble_scaled
  ).toFixed(3);
  let description = `
  <table class="value-table">
    <tr>
      <td id="label-rawWomble"> Raw womble &#x1F6C8:</th>
      <td id="value-rawWomble"> &#x1F6C8 ${rawWomble}</th>
    </tr>
    <tr>
      <td id="label-scaledWomble"> Scaled womble &#x1F6C8: </td>
      <td id="value-scaledWomble"> &#x1F6C8 ${scaledWomble}</td>
    </tr>
    <tr>
      <td> Neighbouring Area ID1 (${GlobalData.csvAreaID}): </td>
      <td>${wall.properties.sa1_id1}</td>
    </tr>
    <tr>
      <td> Neighbouring Area ID2 (${GlobalData.csvAreaID}):</td>
      <td>${wall.properties.sa1_id2}</td>
    </tr>
  </table>
  <div class="popup-charts"></div>`;

  let parent = document.getElementById("menu-right-wombled-data");
  parent.setHTML(description);
  eventHover(
    "label-scaledWomble",
    "The scaled womble value is obtained from scaling the range of raw wombles to the values 0 and 1."
  );
  eventHover(
    "value-scaledWomble",
    `Obtained from:<br> ${rawWomble} / ${maxWomble} = ${scaledWomble}`
  );

  eventHover(
    "label-rawWomble",
    "The raw womble value is the sum of the Weighted absolute differences of all the indicators."
  );

  let list = `<tr>
      <th> Weight%</th>
      <th> Indicator</th>
      <th> Value</th>
      <th> Contribution%</th>
    </tr>`;
  let total = 0;
  const weights = retrieveIndicatorSliders();
  for (let i in GlobalData.selectedVariables) {
    const variable = GlobalData.selectedVariables[i];
    const weight = parseFloat(weights[i].value);
    const difference = wall.properties[variable];
    const differenceWeighted = (difference * weight) / 100;
    const differenceContribution =
      (differenceWeighted / wall.properties.womble) * 100;
    let color = "";
    if (differenceContribution > weight) {
      color = d3.interpolateGreens;
    } else if (differenceContribution < weight) {
      color = d3.interpolateReds;
    } else {
      color = (x) => "white";
    }
    let val = Math.abs(differenceContribution - weight) / weight;
    let textColor = val > 0.5 ? "white" : "black";
    total += differenceWeighted;
    list = list.concat(`    
    <tr>
      <td> ${weight.toFixed(2)}%</th>
      <td> ${variable}</td>
      
      <td> ${differenceWeighted.toFixed(3)} <- ${weight.toFixed(
      2
    )}% * ${difference.toFixed(3)}</th>
      <td style="background-color: ${color(
        val
      )}; color: ${textColor}"> ${differenceContribution.toFixed(2)}%</th>
    </tr>`);
  }

  list = list.concat(`<tr>
    <td colspan="2">Total:</th>
    <td> ${total.toFixed(3)}</th>
    <td>100.00%</th>
  </tr>`);
  eventHover(
    "value-rawWomble",
    `Obtained from:<br>
    <table class="hoverValue-table">
    ${list}
  </table>`
  );

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

function eventHover(id, text) {
  document.getElementById(id).addEventListener("mouseenter", (e) => {
    document.getElementById("dynamicTooltip").style.opacity = 1;
  });

  document.getElementById(id).addEventListener("mousemove", (e) => {
    testHover(e, text);
  });

  document.getElementById(id).addEventListener("mouseleave", (e) => {
    document.getElementById("dynamicTooltip").style.opacity = 0;
    document.getElementById("dynamicTooltip").style.left = "-10px";
    document.getElementById("dynamicTooltip").style.top = "-10px";
    document.getElementById("dynamicTooltip").setHTML("");
  });

  document
    .getElementById("dynamicTooltip")
    .addEventListener("mouseenter", (e) => {
      document.getElementById("dynamicTooltip").style.opacity = 1;
    });

  document
    .getElementById("dynamicTooltip")
    .addEventListener("mouseleave", (e) => {
      document.getElementById("dynamicTooltip").style.opacity = 0;
    });
}

function testHover(e, text) {
  var x = e.clientX + 5;
  var y = e.clientY + 5;
  document.getElementById("dynamicTooltip").style.left = x + "px";
  document.getElementById("dynamicTooltip").style.top = y + "px";
  document.getElementById("dynamicTooltip").setHTML(text);
}
