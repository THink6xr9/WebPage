import {
    state,
    incrementInteraction,
    subscribe
} from '../../state.js';
import { OPEN_SEA_LINKS } from '../../data/opensea-links.js';
import { MEDIUM_LINKS } from '../../data/medium-links.js';
import { YOUTUBE_LINKS } from '../../data/youtube-links.js';
import { FACE_WORDS } from '../../data/face-words.js';

/* -----------------------------
   CONSTANTS & DATA
----------------------------- */
const TEAR_LINKS = [...OPEN_SEA_LINKS, ...MEDIUM_LINKS];



/* -----------------------------
   HTML STRUCTURE
----------------------------- */
const FACE_HTML = `
  <div class="inner-panel">
    
    <div class="top-inputs">
      <button class="eye left" id="btn1">Enter</button>
      <button class="eye right" id="btn2">Enter</button>
    </div>

    <button class="mouth" id="btn3">EXPLORE</button>

    <div class="youtube-links" id="youtubeLinks">
      <!-- Icons injected here -->
    </div>

    <div id="youtubePlayerContainer" class="youtube-player-container hidden">
      <iframe id="youtubePlayer" width="320" height="180" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>

    <div class="tears left">
      <div class="tear"></div>
      <div class="tear"></div>
      <div class="tear"></div>
      <div class="tear"></div>
    </div>

    <div class="tears right">
      <div class="tear"></div>
      <div class="tear"></div>
      <div class="tear"></div>
      <div class="tear"></div>
    </div>

  </div>
`;

/* -----------------------------
   STATE & ELEMENTS
----------------------------- */
let leftEye, rightEye, exploreBtn;

/* -----------------------------
   INITIALIZATION
----------------------------- */
export function initFace() {
    // Inject HTML
    document.body.insertAdjacentHTML("beforeend", FACE_HTML);

    // Get Elements
    leftEye = document.getElementById("btn1");
    rightEye = document.getElementById("btn2");
    exploreBtn = document.getElementById("btn3");

    // Render YouTube Links
    const ytContainer = document.getElementById("youtubeLinks");
    const playerContainer = document.getElementById("youtubePlayerContainer");
    const player = document.getElementById("youtubePlayer");

    if (ytContainer) {
        const randomYtLinks = shuffle(YOUTUBE_LINKS).slice(0, 8);
        randomYtLinks.forEach(link => {
            const icon = document.createElement("div");
            icon.className = "youtube-icon";
            icon.addEventListener("click", () => {
                incrementInteraction();

                let videoId = "";
                if (link.includes("youtu.be/")) {
                    videoId = link.split("youtu.be/")[1].split("?")[0];
                } else if (link.includes("youtube.com/watch?v=")) {
                    videoId = link.split("youtube.com/watch?v=")[1].split("&")[0];
                }

                if (videoId) {
                    player.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                    playerContainer.classList.remove("hidden");
                } else {
                    window.open(link, "_blank");
                }
            });
            ytContainer.appendChild(icon);
        });
    }

    // Setup Interactions
    setupClickHandlers();
    setupTearsInteraction();

    // Start Lifecycle
    applyColorState();
    randomizeFaceWords();
    subscribe(applyColorState);
    setTimeout(randomBlink, 2000);
}


/* -----------------------------
   COLOR MANAGEMENT
----------------------------- */
function applyColorState() {
    if (!leftEye || !state.colorState) return;

    leftEye.style.color = state.colorState[0];
    rightEye.style.color = state.colorState[1];
    exploreBtn.style.color = state.colorState[2];

    if (document.body.style.background !== state.backgroundColor) {
        document.body.style.background = state.backgroundColor;
    }
}

function swapEyeColors() {
    [state.colorState[0], state.colorState[1]] = [state.colorState[1], state.colorState[0]];
    applyColorState();
}

function shuffleFaceOrder() {
    state.colorState = shuffle(state.colorState);
    applyColorState();
    randomizeFaceWords();
}

function randomizeFaceWords() {
    if (!leftEye || !rightEye || !exploreBtn) return;
    const shuffled = shuffle(FACE_WORDS);
    leftEye.textContent = shuffled[0 % shuffled.length] || "Enter";
    rightEye.textContent = shuffled[1 % shuffled.length] || "Enter";
    exploreBtn.textContent = shuffled[2 % shuffled.length] || "EXPLORE";
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
    clone.style.color = getComputedStyle(element).color; // Use current computed color

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
   INTERACTIONS
----------------------------- */
function setupClickHandlers() {
    leftEye.addEventListener("click", () => handleFaceClick(leftEye));
    rightEye.addEventListener("click", () => handleFaceClick(rightEye));
    exploreBtn.addEventListener("click", () => handleFaceClick(exploreBtn));
}

function handleFaceClick(element) {
    incrementInteraction();
    pixelBreak(element);
    screenPixelate();
    shuffleFaceOrder();
}

function setupTearsInteraction() {
    const tears = document.querySelectorAll(".tear");

    tears.forEach(tear => {
        tear.style.cursor = "pointer";
        tear.addEventListener("click", () => {
            incrementInteraction({ tear: true });
            if (TEAR_LINKS.length > 0) {
                const link = TEAR_LINKS[Math.floor(Math.random() * TEAR_LINKS.length)];
                window.open(link, "_blank");
            }
        });
    });
}

/* -----------------------------
   BLINK LOGIC
----------------------------- */
let blinkInProgress = false;

function triggerBlink(targets, mode) {
    if (blinkInProgress) return;
    blinkInProgress = true;

    targets.forEach(el => el.classList.add("blink"));

    setTimeout(() => {
        targets.forEach(el => el.classList.remove("blink"));

        if (mode === "single") swapEyeColors();
        if (mode === "both") shuffleFaceOrder();

        blinkInProgress = false;
    }, 220);
}

function randomBlink() {
    if (!leftEye || !rightEye) return; // safety

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
