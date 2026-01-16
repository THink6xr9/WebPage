// features/configurator.js
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
    window.currentBgColor = "green";
    window.allColors = ["red", "blue", "yellow", "green"];

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
    window.addEventListener('colorsUpdated', updateConfiguratorColors);
  }

  function swapBackgroundColor(clickedColor) {
    // Find clicked color in faceColors array
    const colorIndex = window.colorState.indexOf(clickedColor);
    
    if (colorIndex === -1) return; // Safety check

    // Swap: clicked color becomes background, old background goes to face
    const oldBgColor = window.currentBgColor;
    
    document.body.style.background = clickedColor;
    window.currentBgColor = clickedColor;
    window.colorState[colorIndex] = oldBgColor;

    // Update the available colors pool for shuffling
    window.availableColors = window.allColors.filter(c => c !== window.currentBgColor);

    // Update face colors
    if (window.applyColorState) {
      window.applyColorState();
    }

    // Update configurator squares to show current face colors
    updateConfiguratorColors();
  }

  function updateConfiguratorColors() {
    if (!window.colorState) return;
    
    const colorSquares = document.querySelectorAll(".config-color:not(.coming-soon)");
    
    // Show the exact 3 face colors (left eye, right eye, mouth)
    colorSquares.forEach((square, index) => {
      if (window.colorState[index]) {
        const color = window.colorState[index];
        square.className = `config-color ${color}`;
        square.dataset.color = color;
      }
    });
  }
})();