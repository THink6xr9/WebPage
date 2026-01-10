// features/tears.js
(function () {
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
})();
