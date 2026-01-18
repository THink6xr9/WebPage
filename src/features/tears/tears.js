import { incrementInteraction } from '../../state.js';
import { OPEN_SEA_LINKS } from '../../data/opensea-links.js';
import { MEDIUM_LINKS } from '../../data/medium-links.js';

const TEAR_LINKS = [...OPEN_SEA_LINKS, ...MEDIUM_LINKS];

// Inlined HTML to avoid fetch/CORS issues
const TEARS_HTML = `
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
`;

export function initTears() { // No longer async
  try {
    document.body.insertAdjacentHTML("beforeend", TEARS_HTML);
    setupTearsInteraction();
  } catch (err) {
    console.error("Failed to load tears feature", err);
  }
}

function setupTearsInteraction() {
  const tears = document.querySelectorAll(".tear");
  if (!tears.length) return;

  function openRandomTearLink() {
    incrementInteraction({ tear: true });

    if (!TEAR_LINKS || TEAR_LINKS.length === 0) return;

    const link = TEAR_LINKS[Math.floor(Math.random() * TEAR_LINKS.length)];

    window.open(link, "_blank");
  }


  tears.forEach(tear => {
    tear.style.cursor = "pointer";
    tear.addEventListener("click", openRandomTearLink);
  });
}
