// features/configurator.js
const GREEN = "#6cc56c";

(async function () {
  try {
    const response = await fetch("features/configurator.html");
    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const bodyContent = doc.body.innerHTML;

    document.body.insertAdjacentHTML("beforeend", bodyContent);

    initConfigurator();
  } catch (err) {
    console.error("Failed to load configurator", err);
  }

  function initConfigurator() {
    const configPanel = document.getElementById("configPanel");
    const configBtn = document.getElementById("configBtn");
    const colorSquares = document.querySelectorAll(".config-color:not(.coming-soon)");

    // Track current background color and all available colors
    window.currentBgColor = GREEN;
    window.allColors = ["red", "blue", "yellow", GREEN];

    let panelVisible = false;

    // Toggle panel visibility
    configBtn.addEventListener("click", () => {
      panelVisible = !panelVisible;
      configPanel.classList.toggle("show", panelVisible);
    });

    // Handle color swap
    colorSquares.forEach(square => {
      square.addEventListener("click", () => {
        const clickedColor = square.dataset.color;
        swapBackgroundColor(clickedColor);
        
        // Close panel after selection
        panelVisible = false;
        configPanel.classList.remove("show");
      });
    });

    // Initialize configurator colors
    updateConfiguratorColors();
    
    // Listen for color changes
    //window.addEventListener('colorsUpdated', updateConfiguratorColors);
  }

  function swapBackgroundColor(clickedColor) {
  if (!window.faceColors.includes(clickedColor)) return;

  const oldBg = window.backgroundColor;

  // Remove clicked color from face
  window.faceColors = window.faceColors.filter(c => c !== clickedColor);

  // Add old background into face
  window.faceColors.push(oldBg);

  // Set new background
  window.backgroundColor = clickedColor;
  document.body.style.background = clickedColor;

  // Reset face order to membership (no shuffle here)
  window.colorState = [...window.faceColors];

  window.applyColorState();
  updateConfiguratorColors();
}


  function updateConfiguratorColors() {
  const squares = document.querySelectorAll(".config-color:not(.coming-soon)");

  squares.forEach((square, index) => {
    const color = window.faceColors[index];

    if (!color) {
      square.className = "config-color";
      square.style.background = "transparent";
      square.dataset.color = "";
      return;
    }

    square.className = `config-color ${color}`;
    square.style.background = color;
    square.dataset.color = color;
  });
}

})();