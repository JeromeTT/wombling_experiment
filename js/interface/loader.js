import { yieldToMain } from "../util/yield.js";
export async function showLoader(status = true, loaderText = "Loading...") {
  document.getElementById("loader-panel").hidden = !status;
  if (status) {
    document.getElementById("loader-text").textContent = loaderText;
  }
  await yieldToMain();
}
