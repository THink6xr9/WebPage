const links = [
  "https://opensea.io/collection/time-402",
  "https://medium.com/@qmbgjhq",
  "https://x.com/_THink__6xr9"
];

const colors = ["red", "blue", "yellow"];
const buttons = [
  document.getElementById("btn1"),
  document.getElementById("btn2"),
  document.getElementById("btn3")
];

// Shuffle helper
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Apply colors
function applyColors(colorSet) {
  buttons.forEach((btn, i) => btn.style.color = colorSet[i]);
}

function getPixelSizeByTime() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return 6;   // morning
  if (hour >= 12 && hour < 18) return 8;  // afternoon
  if (hour >= 18 && hour < 22) return 10; // evening
  return 12;                              // night
}


// Pixel breakup effect
function pixelBreak(element) {
  const rect = element.getBoundingClientRect();
  const pixelSize = getPixelSizeByTime();

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

    setTimeout(() => {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      p.style.transform = `translate(${x}px, ${y}px)`;
      p.style.opacity = 0;
    }, 20);
  }

  setTimeout(() => clone.remove(), 700);
}

// Assign system state
function assignRandomState() {
  const shuffledLinks = shuffle(links);
  applyColors(shuffle(colors));

  buttons.forEach((btn, index) => {
    btn.onclick = () => {
      pixelBreak(btn);          // break button
      screenPixelate();         // whole screen pixelates
      applyColors(shuffle(colors)); // calm color shift

      setTimeout(() => {
        window.open(shuffledLinks[index], "_blank");
        assignRandomState();
      }, 700);
    };
  });
}

function screenPixelate() {
  const overlay = document.createElement("div");
  overlay.className = "screen-pixelate";
  document.body.appendChild(overlay);

  // Fade in
  requestAnimationFrame(() => {
    overlay.style.opacity = 1;
  });

  // Fade out
  setTimeout(() => {
    overlay.style.opacity = 0;
  }, 300);

  // Cleanup
  setTimeout(() => {
    overlay.remove();
  }, 700);
}


// Init
assignRandomState();
