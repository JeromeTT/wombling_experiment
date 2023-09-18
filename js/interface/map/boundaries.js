import { GlobalData } from "../../data/globaldata.js";
import { initLayer } from "./map.js";
import { rightMenuToggle } from "../menu/menu.js";
import { Dimensions } from "../../util/enums.js";
import { refreshEntirePanel } from "../menu/sidemenu.js";
import { getVariableWidthExpression } from "../../expressions.js";
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
  map.on("click", ["walls3D"], (e) => {
    let wall = e.features[0];
    console.log(e.features[0].geometry);
    map.removeFeatureState({ source: "areasSource" });
    wallClicked(map, wall);
  });

  // change mouse pointer upon hovering over walls
  map.on("mouseenter", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["walls3D", "walls2D"], () => {
    map.getCanvas().style.cursor = "";
  });
}

export function wallClicked(map, wall) {
  // If in 3D mode,
  let areaIds = [
    wall.properties.sa1_id1.toString(),
    wall.properties.sa1_id2.toString(),
  ];
  GlobalData.selectedArea = {
    areas: areaIds,
    neighbours: new Set(),
  };
  refreshEntirePanel(map);
  map.setFeatureState(
    { source: "areasSource", id: areaIds[0] },
    { selectedArea1: true }
  );
  map.setFeatureState(
    { source: "areasSource", id: areaIds[1] },
    { selectedArea2: true }
  );

  // If in 2D mode, highlight the boundary
  if (GlobalData.appDimension == Dimensions.TWO_D) {
    drawBoundaryOutline(map, wall);
  } else if (GlobalData.appDimension == Dimensions.THREE_D) {
    removeBoundaryOutline(map);
  }
  rightMenuToggle(true);
}

function drawBoundaryOutline(map, wall) {
  if (map.getLayer("borderOutline")) {
    map.getSource("borderOutlineSource").setData(wall);
  } else {
    let checkbox = document.getElementById(`height-checkbox`);
    map.addSource("borderOutlineSource", {
      type: "geojson",
      data: wall,
    });
    map.addLayer(
      {
        id: "borderOutline",
        type: "line",
        source: "borderOutlineSource",
        layout: {
          "line-cap": "round",
        },
        paint: {
          "line-color": "white",
          "line-width": checkbox.checked
            ? getVariableWidthExpression(5)
            : getConstantWidthExpression(),
        },
      },
      "walls2D"
    );
  }
}

export function removeBoundaryOutline(map) {
  if (map.getLayer("borderOutline")) {
    map.getSource("borderOutlineSource").setData({
      type: "FeatureCollection",
      features: [],
    });
  }
}
