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
   COLOR STATE (SINGLE SOURCE)
----------------------------- */
// [ left eye, right eye, mouth ]
window.backgroundColor = GREEN;
window.faceColors = ["red", "blue", "yellow"];
window.colorState = [...window.faceColors]; // order only
window.lockedConfiguratorColor = null;



window.applyColorState = function () {
  leftEye.style.color = window.colorState[0];
  rightEye.style.color = window.colorState[1];
  exploreBtn.style.color = window.colorState[2];

}

applyColorState();

function swapEyeColors() {
  [window.colorState[0], window.colorState[1]] = [window.colorState[1], window.colorState[0]];
  window.applyColorState();
}


function shuffleFaceOrder() {
  // shuffle ONLY the current face order
  window.colorState = shuffle(window.colorState);
  window.applyColorState();
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
  window.incrementInteraction();
  pixelBreak(leftEye);
  screenPixelate();
  shuffleFaceOrder();

  setTimeout(() => {
    window.open(links[0], "_blank");
  }, 450);
});

rightEye.addEventListener("click", () => {
  window.incrementInteraction();
  pixelBreak(rightEye);
  screenPixelate();
  shuffleFaceOrder();

  setTimeout(() => {
    window.open(links[1], "_blank");
  }, 450);
});

exploreBtn.addEventListener("click", () => {
  window.incrementInteraction();
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
      shuffleFaceOrder(); // ✅ THIS NOW ALWAYS AFFECTS MOUTH
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
   TEAR FEATURE INTEGRATION
----------------------------- */
window.TEAR_LINKS = [
  ...window.OPEN_SEA_LINKS,
  ...window.MEDIUM_LINKS
];


window.INTERACTION_STATE = {
  totalClicks: 0,
  tearClicks: 0,
  requiredTotal: 4,
  requiredTear: 1
};

window.isConfiguratorUnlocked = function () {
  const s = window.INTERACTION_STATE;
  return s.totalClicks >= s.requiredTotal && s.tearClicks >= s.requiredTear;
};

window.remainingClicksInfo = function () {
  const s = window.INTERACTION_STATE;

  const remainingTotal = Math.max(0, s.requiredTotal - s.totalClicks);
  const remainingTear = Math.max(0, s.requiredTear - s.tearClicks);

  if (remainingTear > 0) {
    return `Touch the tears (${remainingTear})`;
  }

  return `${remainingTotal} more interaction${remainingTotal === 1 ? "" : "s"}`;
};


// start blinking
setTimeout(randomBlink, 2000);
