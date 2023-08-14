import { closeExistingPopups } from "../popups.js";
import { GlobalData } from "../../data.js";
import { initLayer } from "./map.js";
export function addBoundariesLayer(map) {
  initLayer(map, "boundariesSource");
}

export function addAreasLayer(map) {
  initLayer(map, "areasSource");
}

/**
 * Adds clickable wall behaviour. Upon clicking a wall, a popup appears with relevant info and the wall's adjacent areas are highlighted
 * @param {*} map mapbox map
 */
export function initClickableWallBehaviour(map) {
  map.on("click", ["walls3D", "walls2D"], (e) => {
    closeExistingPopups(map);
    let wall = e.features[0];

    // raw and scaled womble values rounded to 3 dec places
    let rawWomble = wall.properties.womble.toFixed(3);
    let scaledWomble = wall.properties.womble_scaled.toFixed(3);
    let description = `Raw womble: ${rawWomble} <br> Scaled womble: ${scaledWomble} <br> Neighbouring area IDs: <br> ${wall.properties.sa1_id1}, <br> ${wall.properties.sa1_id2}`;
    console.log(wall);

    // area IDs are converted to strings b/c they'll be compared to the SA1 area properties which are strings
    let areaIds = [
      wall.properties.sa1_id1.toString(),
      wall.properties.sa1_id2.toString(),
    ];

    // create popup
    let popup = new mapboxgl.Popup({ closeOnClick: false });
    popup.setLngLat(e.lngLat);
    popup.setHTML(description);
    popup.addClassName("wall-popup");
    popup.addTo(map);

    // closing the popup unhighlights the neighbouring areas
    popup.on("close", () => {
      closeExistingPopups(map);
      // map.setFilter("areas", ["boolean", false]);
    });

    // highlights the neighbouring areas
    // uses setFilter to display only the features in the "areas" layer which match the area IDs adjacent to the clicked wall
    // here we're using the property SA1_MAIN16 as the area ID
    // TODO: maybe modify this/future sa1 area files to use a more homogenous property name (e.g. area_id)
    map.setFilter("areas", [
      "in",
      ["get", GlobalData.geojsonAreaCode],
      ["literal", areaIds],
    ]);
  });

  // change mouse pointer upon hovering over walls
  map.on("mouseenter", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "";
  });
}

export function initClickableAreaBehaviour(map) {
  map.on("click", "areas", (e) => {
    let area = e.features[0];
    console.log(area);
    let areaCode = area["properties"][GlobalData.geojsonAreaCode];

    // find indicators that correspond with the area that was clicked on
    let correspondingIndicators = GlobalData.indicatorsData.find(
      (indicators) => {
        let indicatorsCode = indicators[GlobalData.csvAreaCode]; // csvAreaCode is global and initialised in setIndicatorsData()

        // if code is a number, convert it to string
        if (!isNaN(indicatorsCode)) {
          indicatorsCode = indicatorsCode.toString(); // both codes have to be strings for comparison
        }

        return indicatorsCode == areaCode;
      }
    );

    // let selectedIndicators = selectedVariables;
    correspondingIndicators = Object.entries(correspondingIndicators); // convert indicators object to an array

    // filter out any indicators that were NOT selected by user, i.e. keep only selected indicators
    correspondingIndicators = correspondingIndicators.filter(
      ([key, value]) => GlobalData.selectedVariables.includes(key) // selectedVariables is a global
    );
    console.log(correspondingIndicators);

    let description = `Area ID: ${areaCode}, <br> Selected Indicators: <br>`;

    for (let [key, value] of correspondingIndicators) {
      description += `${key}: ${value}, <br>`;
    }

    // create popup
    let popup = new mapboxgl.Popup({ closeOnClick: false });
    popup.setLngLat(e.lngLat);
    popup.setHTML(description);
    popup.addClassName("area-popup");
    popup.addTo(map);
  });

  map.on("mouseenter", "areas", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "areas", () => {
    map.getCanvas().style.cursor = "";
  });
}
