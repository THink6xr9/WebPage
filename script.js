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

// Fisher–Yates shuffle (stable randomness)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applyColors(colorSet) {
  buttons.forEach((btn, index) => {
    btn.style.color = colorSet[index];
  });
}

function assignRandomState() {
  const shuffledLinks = shuffle(links);
  const shuffledColors = shuffle(colors);

  applyColors(shuffledColors);

  buttons.forEach((btn, index) => {
    btn.onclick = () => {
      // 1. shuffle colors immediately
      applyColors(shuffle(colors));

      // 2. slight pause, then redirect
      setTimeout(() => {
        window.open(shuffledLinks[index], "_blank");

        // 3. prepare next state
        assignRandomState();
      }, 250);
    };
  });
}

// Initial state
assignRandomState();
