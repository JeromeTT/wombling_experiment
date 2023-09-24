import { GlobalData } from "../../data/globaldata.js";
import { initLayer } from "./map.js";
import { rightMenuToggle } from "../menu/menu.js";
import { Dimensions } from "../../util/enums.js";
import { refreshEntirePanel } from "../menu/sidemenu.js";
import {
  getVariableWidthExpression,
  getConstantWidthExpression,
  getColourExpression,
  getHeightExpression,
} from "../../expressions.js";
import { findBoundary } from "./areas.js";
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
    map.removeFeatureState({ source: "areasSource" });
    wallClicked(map, wall);
  });

  // change mouse pointer upon hovering over walls
  map.on("mouseenter", ["walls3D"], () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["walls3D"], () => {
    map.getCanvas().style.cursor = "";
  });
}

export function wallClicked(map, wall, id1 = null, id2 = null) {
  // If in 3D mode,
  let areaIds = [
    wall.properties.sa1_id1.toString(),
    wall.properties.sa1_id2.toString(),
  ];

  if (id1 != null && id2 != null) {
    areaIds = [id1, id2];
  }
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
    removeBoundaryOutline(map);
    drawBoundaryOutline(map, wall);
  } else if (GlobalData.appDimension == Dimensions.THREE_D) {
    removeBoundaryOutline(map);
    drawBoundaryOutline(map, wall);
  }
  rightMenuToggle(true);
}

function drawBoundaryOutline(map, wall) {
  if (map.getLayer("borderOutline")) {
    map.removeLayer("borderOutline");
    map.removeSource("borderOutlineSource");
  }
  let checkbox = document.getElementById(`height-checkbox`);

  if (GlobalData.appDimension == Dimensions.TWO_D) {
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
            : getConstantWidthExpression(5),
        },
      },
      "walls2D"
    );
  } else {
    map.addSource("borderOutlineSource", {
      type: "geojson",
      data: wall,
    });
    map.addLayer(
      {
        id: "borderOutline",
        type: "fill-extrusion",
        source: "borderOutlineSource",
        paint: {
          "fill-extrusion-color": getColourExpression(),
          "fill-extrusion-height": getHeightExpression(),
          "fill-extrusion-opacity": 1,
        },
      },
      "walls3D"
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
