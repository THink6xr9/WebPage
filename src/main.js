/* -----------------------------
   IMPORTS
----------------------------- */
import { OPEN_SEA_LINKS } from './data/opensea-links.js';
import { MEDIUM_LINKS } from './data/medium-links.js';
import {
  state,
  incrementInteraction,
  subscribe
} from './state.js';
import { initTears } from './features/tears/tears.js';
import { initConfigurator } from './features/configurator/configurator.js';

/* -----------------------------
   LINKS
----------------------------- */
const links = [
  "https://opensea.io/collection/time-402",
  "https://medium.com/@qmbgjhq",
  "https://x.com/_THink__6xr9"
];

/* -----------------------------
   ELEMENTS
----------------------------- */
const leftEye = document.getElementById("btn1");
const rightEye = document.getElementById("btn2");
const exploreBtn = document.getElementById("btn3");

/* -----------------------------
   HELPERS
----------------------------- */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* -----------------------------
   COLOR MANAGEMENT
----------------------------- */

function applyColorState() {
  // Use state from state.js
  leftEye.style.color = state.colorState[0];
  rightEye.style.color = state.colorState[1];
  exploreBtn.style.color = state.colorState[2];

  // Also sync background if it changed (handled in configurator, but good safety)
  if (document.body.style.background !== state.backgroundColor) {
    document.body.style.background = state.backgroundColor;
  }
}

// Initial apply
applyColorState();

// Subscribe to state changes (e.g. from configurator)
subscribe(applyColorState);

function swapEyeColors() {
  [state.colorState[0], state.colorState[1]] = [state.colorState[1], state.colorState[0]];
  applyColorState();
}


function shuffleFaceOrder() {
  // shuffle ONLY the current face order
  state.colorState = shuffle(state.colorState);
  applyColorState();
}

/* -----------------------------
   PIXEL EFFECTS
----------------------------- */
function pixelBreak(element) {
  const rect = element.getBoundingClientRect();
  const pixelSize = 8;

  const cols = Math.floor(rect.width / pixelSize);
  const rows = Math.floor(rect.height / pixelSize);

  const clone = document.createElement("div");
  clone.className = "pixel-clone";
  clone.style.left = rect.left + "px";
  clone.style.top = rect.top + "px";
  clone.style.width = rect.width + "px";
  clone.style.height = rect.height + "px";
  clone.style.gridTemplateColumns = `repeat(${cols}, ${pixelSize}px)`;
  clone.style.gridTemplateRows = `repeat(${rows}, ${pixelSize}px)`;
  clone.style.color = getComputedStyle(element).color;

  document.body.appendChild(clone);

  for (let i = 0; i < cols * rows; i++) {
    const p = document.createElement("div");
    p.className = "pixel";
    p.style.width = pixelSize + "px";
    p.style.height = pixelSize + "px";
    clone.appendChild(p);

    requestAnimationFrame(() => {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      p.style.transform = `translate(${x}px, ${y}px)`;
      p.style.opacity = 0;
    });
  }

  setTimeout(() => clone.remove(), 700);
}

function screenPixelate() {
  const overlay = document.createElement("div");
  overlay.className = "screen-pixelate";
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = 1;
  });

  setTimeout(() => {
    overlay.style.opacity = 0;
  }, 300);

  setTimeout(() => overlay.remove(), 700);
}


/* -----------------------------
   CLICK BEHAVIOR (PIXELS + DELAY)
----------------------------- */
leftEye.addEventListener("click", () => {
  incrementInteraction();
  pixelBreak(leftEye);
  screenPixelate();
  shuffleFaceOrder();

  setTimeout(() => {
    window.open(links[0], "_blank");
  }, 450);
});

rightEye.addEventListener("click", () => {
  incrementInteraction();
  pixelBreak(rightEye);
  screenPixelate();
  shuffleFaceOrder();

  setTimeout(() => {
    window.open(links[1], "_blank");
  }, 450);
});

exploreBtn.addEventListener("click", () => {
  incrementInteraction();
  pixelBreak(exploreBtn);
  screenPixelate();
  shuffleFaceOrder();

  setTimeout(() => {
    const randomLink = shuffle(links)[0];
    window.open(randomLink, "_blank");
  }, 450);
});

/* -----------------------------
   BLINK LOGIC (ATOMIC)
----------------------------- */
let blinkInProgress = false;

function triggerBlink(targets, mode) {
  if (blinkInProgress) return;
  blinkInProgress = true;

  targets.forEach(el => el.classList.add("blink"));

  setTimeout(() => {
    targets.forEach(el => el.classList.remove("blink"));

    if (mode === "single") {
      swapEyeColors();
    }

    if (mode === "both") {
      shuffleFaceOrder();
    }

    blinkInProgress = false;
  }, 220);
}

function randomBlink() {
  const r = Math.random();

  if (r < 0.33) {
    triggerBlink([leftEye], "single");
  } else if (r < 0.66) {
    triggerBlink([rightEye], "single");
  } else {
    triggerBlink([leftEye, rightEye], "both");
  }

  const next = 3000 + Math.random() * 4000;
  setTimeout(randomBlink, next);
}

/* -----------------------------
   INITIALIZATION
----------------------------- */
// start blinking
setTimeout(randomBlink, 2000);

// Initialize Features
initTears();
initConfigurator();
