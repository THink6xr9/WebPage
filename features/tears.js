// features/tears.js
(async function () {
  try {
    const response = await fetch("features/tears.html");
    const text = await response.text();

    // Parse and extract only <body> contents
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const bodyContent = doc.body.innerHTML;

    document.body.insertAdjacentHTML("beforeend", bodyContent);

    initTears();
  } catch (err) {
    console.error("Failed to load tears feature", err);
  }

  function initTears() {
    const tears = document.querySelectorAll(".tear");
    if (!tears.length) return;

    function openRandomTearLink() {
      if (!window.TEAR_LINKS || window.TEAR_LINKS.length === 0) return;

      const link =
        window.TEAR_LINKS[Math.floor(Math.random() * window.TEAR_LINKS.length)];

      window.open(link, "_blank");
    }

    tears.forEach(tear => {
      tear.style.cursor = "pointer";
      tear.addEventListener("click", openRandomTearLink);
    });
  }
})();
