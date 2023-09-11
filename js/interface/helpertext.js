export function setHelperText(text) {
  if (text == null) {
    return;
  }
  const message = document.getElementById("areaSelectMessage");
  message.textContent = text;
}

export function hideHelperText() {
  const message = document.getElementById("areaSelectMessage");
  message.style.display = "none";
}

export function showHelperText(text = null) {
  const message = document.getElementById("areaSelectMessage");
  message.style.display = "block";
  setHelperText(text);
}
