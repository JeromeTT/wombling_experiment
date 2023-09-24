export function createIndicatorOptions(optionsArray, select_id) {
  var x = document.getElementById(select_id);

  for (let i = 0; i < optionsArray.length; i++) {
    var option = document.createElement("option");
    option.text = optionsArray[i];
    x.add(option, i);
  }
}

// Return an array of the selected option values
// select is an HTML select element
export function getValues(select_id) {
  var options = document.getElementById(select_id).options;
  var values = Array.from(options).map(({ value }) => value);
  return values;
}
