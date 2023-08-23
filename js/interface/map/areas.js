import { GlobalData } from "../../data/globaldata.js";
import { Dimensions } from "../../util/enums.js";
import { closeExistingPopups } from "../popups.js";
import { wallClicked } from "./boundaries.js";
/**
 * Adds clickable area behaviour to areas.
 * @param {} map Mapbox map object
 */
export function initClickableAreaBehaviour(map) {
  // Check that walls have been drawn
  map.on("click", "areas", (e) => {
    if (!map.getSource("wallsSource2D")) {
      console.log("walls don't exist yet");
      return;
    }
    let area = e.features[0];
    console.log(area);
    let areaCode = area["properties"][GlobalData.geojsonAreaCode];

    // find indicators that correspond with the area that was clicked on
    let correspondingIndicators = GlobalData.indicatorsData.find(
      (indicators) => {
        let indicatorsCode = indicators[GlobalData.csvAreaID]; // csvAreaCode is global and initialised in setIndicatorsData()

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
    if (GlobalData.edgeSelectionMode) {
      map.removeFeatureState({ source: "areasSource" });
      closeExistingPopups(map);
      if (GlobalData.selectedArea.neighbours.has(areaCode)) {
        // Highlight Boundary
        let id1 = areaCode;
        let id2 = GlobalData.selectedArea.area;
        let wall = null;
        if (GlobalData.appDimension == Dimensions.TWO_D) {
          wall = map.queryRenderedFeatures({
            layers: ["walls2D"],
            filter: [
              "any",
              [
                "all",
                ["==", ["to-string", ["get", "sa1_id1"]], id1],
                ["==", ["to-string", ["get", "sa1_id2"]], id2],
              ],
              [
                "all",
                ["==", ["to-string", ["get", "sa1_id1"]], id2],
                ["==", ["to-string", ["get", "sa1_id2"]], id1],
              ],
            ],
          });
        }
        if (wall.length > 0) {
          wall = wall[0];
        } else {
          wall = null;
        }
        let singleLine = wall;
        if (wall.geometry.type == "MultiLineString") {
          singleLine = {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: wall.geometry.coordinates[0],
            },
          };
        }
        let coordinates = turf.along(
          singleLine,
          turf.length(singleLine, { units: "meters" }),
          {
            units: "meters",
          }
        ).geometry.coordinates;
        wallClicked(map, wall, coordinates);
        GlobalData.selectedArea = {
          areas: null,
          neighbours: new Set(),
        };
      } else if (GlobalData.selectedArea.area == areaCode) {
        // Clear GlobalData
        GlobalData.selectedArea = {
          areas: null,
          neighbours: new Set(),
        };
      } else {
        // Get neighbouring areas
        let neighbourSet = GlobalData.selectedBuffered.features.reduce(
          (acc, val) => {
            if (val.properties[GlobalData.csvAreaID + "_id1"] == areaCode) {
              acc.add(val.properties[GlobalData.csvAreaID + "_id2"].toString());
            } else if (
              val.properties[GlobalData.csvAreaID + "_id2"] == areaCode
            ) {
              acc.add(val.properties[GlobalData.csvAreaID + "_id1"].toString());
            }
            return acc;
          },
          new Set()
        );
        if (neighbourSet.size > 0) {
          GlobalData.selectedArea = {
            area: areaCode,
            neighbours: neighbourSet,
          };
          map.setFeatureState(
            { source: "areasSource", id: areaCode },
            { selected: true }
          );
          for (let neighbourID of neighbourSet) {
            map.setFeatureState(
              { source: "areasSource", id: neighbourID },
              { neighbour: true }
            );
          }
        }
      }
    } else {
      let popup = new mapboxgl.Popup({ closeOnClick: false });
      popup.setLngLat(e.lngLat);
      popup.setHTML(description);
      popup.addClassName("area-popup");
      popup.addTo(map);
    }
  });

  map.on("mouseenter", "areas", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "areas", () => {
    map.getCanvas().style.cursor = "";
  });
}
