import { createIndicatorSliders } from "./sliders.js";

var firstUpload = true;

export function createVariables(optionsArray) {
  const divID = document.getElementById("options");
  if (!firstUpload) {
    while (divID.firstChild) {
      divID.removeChild(divID.lastChild);
    }
  }
  // Append checkboxes to indicators list
  for (let i = 0; i < optionsArray.length; i++) {
    var node = document.createElement("div");
    node.setAttribute("class", "form-check");
    node.setAttribute("id", "form-check-" + optionsArray[i]);
    node.innerHTML =
      '<label class = "checkbox-container"  for="variable-' +
      i +
      '"><div class="checkbox-text" title="' +
      optionsArray[i] +
      '">' +
      optionsArray[i] +
      '</div><input type="checkbox" id="variable-' +
      i +
      '" name="check' +
      i +
      '"><span class="checkmark"></span></label>';

    divID.appendChild(node);

    // add event listener to each checkbox
    let checkbox = document.getElementById(`variable-${i}`);
    checkbox.addEventListener("click", variableCheckboxHandler);
  }

  // Append to choropleth dropdown
  let select = document.getElementById("choropleth-indicatorChange");
  select.innerHTML = "";
  for (let variable of optionsArray) {
    let option = document.createElement("option");
    option.setAttribute("value", variable);
    option.text = variable;
    select.appendChild(option);
  }
  firstUpload = false;
  document.getElementById("womble-indicators-buttons").classList.remove("hide");
}

/**
 * When a variable checkbox is clicked, all variables checkboxes are scanned.
 * Indicator sliders are created for all checkboxes that are checked.
 */
export function variableCheckboxHandler() {
  let selectedVariables = [];
  let optionsDiv = document.getElementById("options");

  for (let i = 0; i < optionsDiv.childElementCount; i++) {
    // the code for declaring checkbox and varName is pretty wack, but that's just how we retreive it based on the current structure of the checkboxes
    // if we change the HTML structure, we'll have to change these lines
    let checkbox = optionsDiv.children[i].children[0].querySelector("input");

    if (checkbox.checked) {
      let varName = optionsDiv.children[i].children[0].textContent;
      selectedVariables.push(varName);
    }
  }
  createIndicatorSliders(selectedVariables);
}
