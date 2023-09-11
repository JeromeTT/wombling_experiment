export function menuInitCollapsibleBehaviour() {
  let collapsible = document.getElementById("menu-collapsible");
  let menuContents = document.getElementById("menu-contents");
  let mapOverlayRight = document.getElementById("map-overlay-right");
  menuContents.style.display = "block"; // initialised to block, so that the if statement in the event listener works correctly

  collapsible.addEventListener("click", () => {
    collapsible.classList.toggle("active"); // required for the +/- icons to appear correctly
    if (menuContents.style.display === "block") {
      menuContents.style.display = "none";
      mapOverlayRight.style.display = "none";
    } else {
      menuContents.style.display = "block";
      mapOverlayRight.style.display = "block";
    }
  });
  let rightCollapsible = document.getElementById("menu-collapsible-right");
  // Right collapsible
  rightCollapsible.addEventListener("click", () => {
    rightMenuToggle();
  });
}

export function rightMenuToggle(toggled = null) {
  let rightCollapsible = document.getElementById("menu-collapsible-right");
  let menuRightContents = document.getElementById("menu-right-content");
  if (toggled == true) {
    menuRightContents.style.display = "block";
    rightCollapsible.textContent = "<";
    return;
  }

  if (toggled == false) {
    menuRightContents.style.display = "none";
    rightCollapsible.textContent = ">";
    return;
  }
  if (menuRightContents.style.display === "block") {
    menuRightContents.style.display = "none";
    rightCollapsible.textContent = ">";
  } else {
    menuRightContents.style.display = "block";
    rightCollapsible.textContent = "<";
  }
}
