/**
 * Close all existing popups.
 * @param {} map map object
 */
export function closeExistingPopups(map) {
  let popups = document.getElementsByClassName("mapboxgl-popup");
  while (popups.length > 0) {
    popups[0].remove();
  }
}
