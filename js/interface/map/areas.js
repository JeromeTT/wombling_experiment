import { GlobalData } from "../../data/globaldata.js";
import { Dimensions, HELPERTEXT } from "../../util/enums.js";
import { hideHelperText, showHelperText } from "../helpertext.js";
import {
  clearPopupMenuArea,
  updatePopupMenuArea1,
  updatePopupMenuArea2,
  updatePopupMenuBoundary,
} from "../menu/sidemenu.js";
import { removeBoundaryOutline, wallClicked } from "./boundaries.js";
/**
 * Adds clickable area behaviour to areas.
 * @param {} map Mapbox map object
 */
export function initClickableAreaBehaviour(map) {
  // Check that walls have been drawn
  map.on("click", "areas", (e) => {
    // This is only a 2d feature
    if (GlobalData.appDimension == Dimensions.THREE_D) {
      return;
    }

    if (!map.getSource("wallsSource2D")) {
      console.log("walls don't exist yet");
      return;
    }
    let area = e.features[0];
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

    // filter out any indicators that were NOT selected by user, i.e. keep only selected indicators
    correspondingIndicators = Object.entries(correspondingIndicators).filter(
      ([key, value]) => GlobalData.selectedVariables.includes(key) // selectedVariables is a global
    );

    map.removeFeatureState({ source: "areasSource" });
    removeBoundaryOutline(map);
    if (GlobalData.selectedArea.neighbours.has(areaCode)) {
      // If a previous areas has already been selected
      // Highlight Boundary
      let id1 = GlobalData.selectedArea.areas;
      let id2 = areaCode;
      let wall = findBoundary(map, id1, id2);

      map.setFeatureState(
        { source: "areasSource", id: id1 },
        { selectedArea1: true }
      );
      map.setFeatureState(
        { source: "areasSource", id: id2 },
        { selectedArea2: true }
      );
      updatePopupMenuArea2(area);
      updatePopupMenuBoundary(wall);
      wallClicked(map, wall);
      hideHelperText();
      GlobalData.selectedArea = {
        areas: [id1, id2],
        neighbours: new Set(),
      };
    } else if (GlobalData.selectedArea.areas == areaCode) {
      // Clear GlobalData
      // If it is the same area, therefore, clear everything
      clearPopupMenuArea();
      showHelperText(HELPERTEXT.DEFAULT);
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
          areas: areaCode,
          neighbours: neighbourSet,
        };
        map.setFeatureState(
          { source: "areasSource", id: areaCode },
          { selected: true, selectedArea1: false, selectedArea2: false }
        );
        for (let neighbourID of neighbourSet) {
          map.setFeatureState(
            { source: "areasSource", id: neighbourID },
            { neighbour: true }
          );
        }
      }
      updatePopupMenuArea1(area);
      showHelperText(HELPERTEXT.ONE_BOUNDARY);
    }
  });

  map.on("mouseenter", "areas", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "areas", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function findBoundary(map, id1, id2) {
  // let wall = GlobalData.test.find(
  //   (elem) =>
  //     (elem["sa1_id1"] == id1 && elem["sa1_id2"] == id2) ||
  //     (elem["sa1_id1"] == id2 && elem["sa1_id2"] == id1)
  // );
  let wall = map.queryRenderedFeatures({
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
  wall = wall.length > 0 ? wall[0] : null;
  console.log("wall", wall);
  return wall;
}
