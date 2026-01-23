import {
  state,
  isConfiguratorUnlocked,
  getRemainingClicksInfo,
  incrementInteraction,
  subscribe,
  notifyStateChange
} from '../../state.js';


// Inlined HTML to avoid fetch/CORS issues
const CONFIG_HTML = `
  <div id="configPanel">
    <div class="config-squares">
      <div class="config-color red" data-color="red"></div>
      <div class="config-color blue" data-color="blue"></div>
      <div class="config-color yellow" data-color="yellow"></div>
      <div class="config-color coming-soon">Coming Soon</div>
    </div>
    <div class="music-player-bar" id="musicPlayerBar">
      <div class="music-track-name" id="trackName">♫ The Gift of Love</div>
      <div class="music-bar-controls">
        <button class="music-bar-btn" id="prevBtnBar" aria-label="Previous">⏮</button>
        <button class="music-bar-btn play-btn-bar" id="playPauseBtnBar" aria-label="Play">▶</button>
        <button class="music-bar-btn" id="nextBtnBar" aria-label="Next">⏭</button>
      </div>
    </div>
  </div>
`;

export function initConfigurator() { // No longer async
  try {
    document.body.insertAdjacentHTML("beforeend", CONFIG_HTML);
    setupConfigurator();
  } catch (err) {
    console.error("Failed to load configurator", err);
  }
}

function setupConfigurator() {
  const configPanel = document.getElementById("configPanel");
  const configBtn = document.getElementById("configBtn");
  const colorSquares = document.querySelectorAll(".config-color:not(.coming-soon)");

  let panelVisible = false;

  // Toggle panel visibility
  configBtn.addEventListener("click", () => {
    panelVisible = !panelVisible;
    configPanel.classList.toggle("show", panelVisible);
  });

  // Handle color swap
  colorSquares.forEach(square => {
    square.addEventListener("click", () => {

      // FIRST: if unlocked, NEVER show hint
      if (isConfiguratorUnlocked()) {

        // block only the background-locked color
        if (square.classList.contains("locked")) {
          return;
        }

        const clickedColor = square.dataset.color;
        if (!clickedColor) return;

        swapBackgroundColor(clickedColor);
        panelVisible = false;
        configPanel.classList.remove("show");
        return;
      }

      // ONLY if still locked
      showConfiguratorHint(getRemainingClicksInfo());
    });
  });

  // Initialize configurator colors
  updateConfiguratorColors();

  // Listen for state changes (from clicks or other updates)
  subscribe(updateConfiguratorColors);
}

function swapBackgroundColor(clickedColor) {
  if (!state.faceColors.includes(clickedColor)) return;

  const oldBg = state.backgroundColor;
  state.lockedConfiguratorColor = oldBg;

  // Remove clicked color from face
  state.faceColors = state.faceColors.filter(c => c !== clickedColor);

  // Add old background into face
  state.faceColors.push(oldBg);

  // Set new background
  state.backgroundColor = clickedColor;
  document.body.style.background = clickedColor;

  // Reset face order to membership (no shuffle here)
  state.colorState = [...state.faceColors];

  // We need to notify main.js to update the face UI
  notifyStateChange();

  // Also update local configurator UI
  updateConfiguratorColors();
}


function updateConfiguratorColors() {
  const squares = document.querySelectorAll(".config-color:not(.coming-soon)");
  const unlocked = isConfiguratorUnlocked();

  // If elements aren't injected yet (async load)
  if (squares.length === 0) return;

  squares.forEach((square, index) => {
    square.className = "config-color"; // reset everything

    if (!unlocked) {
      // LOCKED: all identical
      square.classList.add("locked");
      square.style.background = "#cfcfcf";
      square.dataset.color = "";
      return;
    }

    // UNLOCKED: reveal real colors
    square.classList.remove("locked");
    const color = state.faceColors[index];
    if (!color) return;

    square.classList.add(color);
    square.style.background = color;
    square.dataset.color = color;

    if (color === state.lockedConfiguratorColor) {
      square.classList.add("locked");
    } else {
      square.classList.remove("locked");
    }

    if (isConfiguratorUnlocked()) {
      const hint = document.getElementById("configHelp");
      if (hint) hint.classList.remove("show");
    }
  });
};


let hintTimeout = null;

function showConfiguratorHint(text) {
  if (isConfiguratorUnlocked()) return;

  const hint = document.getElementById("configHelp");
  if (!hint) return;

  hint.textContent = text;
  hint.classList.add("show");

  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    hint.classList.remove("show");
  }, 1500);
}