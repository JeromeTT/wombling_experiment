import { yieldToMain } from "../util/yield.js";
/**
 * Toggles the loading spinner to show.
 * @param {*} status whether to show the loadiung spinner
 * @param {*} loaderText option param to define loading text
 */
export async function showLoader(status = true, loaderText = "Loading...") {
  document.getElementById("loader-panel").hidden = !status;
  document.getElementById("loader-text").textContent = loaderText;

  await yieldToMain();
}
