import { catalogData } from '../../data/catalog.js?v=4';

const CATALOG_HTML = `
  <!-- Catalog Trigger Button -->
  <button id="openCatalogBtn" aria-label="Open Collection">
    ◱
  </button>

  <!-- Catalog Gallery Overlay -->
  <div id="catalogOverlay">
    <div class="catalog-header">
      <h2>Time Collection</h2>
      <button class="close-catalog-btn" id="closeCatalogBtn" aria-label="Close Catalog">✕</button>
    </div>
    
    <!-- Controls: Search and Filters -->
    <div class="catalog-controls">
      <div class="catalog-search-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="catalogSearch" placeholder="Search by title or story..." autocomplete="off">
      </div>
      <div class="catalog-filter-tabs">
        <button class="filter-tab active" data-filter="all">All</button>
        <button class="filter-tab" data-filter="music">♫ Music</button>
        <button class="filter-tab" data-filter="writing">✍ Writings</button>
        <button class="filter-tab" data-filter="video">▶ Videos</button>
        <button class="filter-tab" data-filter="nft">⛵ NFTs</button>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="catalog-gallery" id="catalogGallery">
      <!-- Items will be injected here -->
    </div>
  </div>

  <!-- Detail View Overlay -->
  <div id="catalogDetailView">
    <button class="detail-close-btn" id="closeDetailBtn" aria-label="Close Details">✕</button>
    <div class="detail-content" id="detailContent">
      <!-- Detail content will be injected here -->
    </div>
  </div>
`;

export function initCatalog() {
  try {
    document.body.insertAdjacentHTML("beforeend", CATALOG_HTML);
    setupCatalog();
  } catch (err) {
    console.error("Failed to load catalog", err);
  }
}

function setupCatalog() {
  const openBtn = document.getElementById('openCatalogBtn');
  const closeBtn = document.getElementById('closeCatalogBtn');
  const catalogOverlay = document.getElementById('catalogOverlay');
  
  const gallery = document.getElementById('catalogGallery');
  const detailView = document.getElementById('catalogDetailView');
  const closeDetailBtn = document.getElementById('closeDetailBtn');
  const detailContent = document.getElementById('detailContent');
  
  const searchInput = document.getElementById('catalogSearch');
  const filterTabs = document.querySelectorAll('.filter-tab');

  let activeFilter = 'all';
  let searchQuery = '';

  // Render Gallery Items
  function renderGallery() {
    gallery.innerHTML = '';
    
    // Filter and search catalog items
    const filteredItems = catalogData.filter(item => {
      // 1. Search Query Check
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.story.toLowerCase().includes(searchQuery);
        
      // 2. Filter Tab Check
      let matchesFilter = true;
      if (activeFilter === 'music') {
        matchesFilter = !!item.spotifyLink;
      } else if (activeFilter === 'writing') {
        matchesFilter = !!item.mediumLink;
      } else if (activeFilter === 'video') {
        matchesFilter = !!item.youtubeLink;
      } else if (activeFilter === 'nft') {
        matchesFilter = !!item.openseaLink;
      }
      
      return matchesSearch && matchesFilter;
    });

    if (filteredItems.length === 0) {
      gallery.innerHTML = `
        <div class="catalog-no-results">
          <h3>No artworks found</h3>
          <p>Try refining your search or filter selection.</p>
        </div>
      `;
      return;
    }

    filteredItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'catalog-item';
      
      const serialNum = item.id.replace('time-', '');
      
      // Determine what media badges to show
      let badgesHtml = '';
      if (item.spotifyLink) badgesHtml += `<span class="badge" title="Has Music">♫</span>`;
      if (item.mediumLink) badgesHtml += `<span class="badge" title="Has Writing">✍</span>`;
      if (item.youtubeLink) badgesHtml += `<span class="badge" title="Has Video">▶</span>`;
      if (item.openseaLink) badgesHtml += `<span class="badge" title="Has NFT">⛵</span>`;

      itemEl.innerHTML = `
        <img src="${item.artUrl}" alt="${item.title}" loading="lazy">
        <div class="catalog-item-info">
          <div class="catalog-item-header">
            <span class="catalog-item-number">Time ${serialNum}</span>
            <div class="catalog-item-badges">${badgesHtml}</div>
          </div>
          <h3 class="catalog-item-title">${item.title}</h3>
        </div>
      `;
      
      itemEl.addEventListener('click', () => openDetailView(item));
      gallery.appendChild(itemEl);
    });
  }

  // Bind controls
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderGallery();
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter');
      renderGallery();
    });
  });

  // Open/Close Catalog Logic
  openBtn.addEventListener('click', () => {
    catalogOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Lock background scroll
    renderGallery();
  });

  closeBtn.addEventListener('click', () => {
    catalogOverlay.classList.remove('show');
    document.body.style.overflow = '';
  });

  // Open/Close Detail Logic
  function openDetailView(item) {
    const serialNum = item.id.replace('time-', '');
    detailView.setAttribute('data-theme', item.theme);
    detailContent.innerHTML = `
      <div class="immersive-background" style="background-image: url('${item.artUrl}');"></div>
      <div class="immersive-overlay">
        <div class="detail-container">
          <div class="detail-image-sec">
            <img src="${item.artUrl}" alt="${item.title}" class="detail-artwork-img">
          </div>
          <div class="detail-info-sec">
            <div class="immersive-theme pulse-text">Time Collection — ${serialNum}</div>
            <h2 class="immersive-title">${item.title}</h2>
            <p class="immersive-story">${item.story || "A reflective canvas in the Time Collection exploring presence, consciousness, and inner movement."}</p>
            <div class="immersive-links">
              ${item.openseaLink ? `<a href="${item.openseaLink}" target="_blank" class="immersive-link glass-effect">⛵ OpenSea</a>` : ''}
              ${item.mediumLink ? `<a href="${item.mediumLink}" target="_blank" class="immersive-link glass-effect">✍ Medium</a>` : ''}
              ${item.youtubeLink ? `<a href="${item.youtubeLink}" target="_blank" class="immersive-link glass-effect">▶ YouTube</a>` : ''}
              ${item.spotifyLink ? `<a href="${item.spotifyLink}" target="_blank" class="immersive-link glass-effect">♫ Listen</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    detailView.classList.add('show');
  }

  closeDetailBtn.addEventListener('click', () => {
    detailView.classList.remove('show');
    setTimeout(() => {
      if (!detailView.classList.contains('show')) {
        detailContent.innerHTML = '';
      }
    }, 800);
  });
}
