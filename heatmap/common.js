var colourInput = document.querySelector(`input[type="color"]`);
var rangeInput = document.querySelector(`input[type="range"]`);
var bodyStyle = getComputedStyle(document.documentElement);
colourInput.onchange = function() {
  const { r, g, b } = hexToRGB(colourInput.value);
  document.documentElement.style.setProperty("--r", r);
  document.documentElement.style.setProperty("--g", g);
  document.documentElement.style.setProperty("--b", b);
};
colourInput.onchange();
rangeInput.value = rangeInput.max = parseInt(bodyStyle.getPropertyValue("--max"), 10);
rangeInput.onchange = function() {
  document.documentElement.style.setProperty("--scale-factor", rangeInput.value);
}
rangeInput.onchange();

function rgbToHex(r, g, b) {
  return "#" +
    parseInt(r, 10).toString(16).padStart(2, "0") +
    parseInt(g, 10).toString(16).padStart(2, "0") +
    parseInt(b, 10).toString(16).padStart(2, "0");
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16),
  };
}

window.onclick = function(event) {
  if (event.target.localName == "circle") {
    togglePopup(event.target.dataset.popup);
  }
}

function togglePopup(...ids) {
  for (const id of ids) {
    document.getElementById(id).classList.toggle("hidden-popup");
  }
}

function switchMode(button, modeId) {
  button.parentNode.querySelector(".current")?.classList.remove("current");
  button.classList.add("current");

  const svg = document.getElementById(modeId);
  svg.parentNode.querySelector("svg:not(.hidden)")?.classList.add("hidden");
  svg.classList.remove("hidden");
}
