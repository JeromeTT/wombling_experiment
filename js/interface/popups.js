export function closeExistingPopups(map) {
  let popups = document.getElementsByClassName("mapboxgl-popup");
  while (popups.length > 0) {
    popups[0].remove();
  }

  // unhighlight selected areas
  map.setFilter("areas", ["boolean", true]);
}
