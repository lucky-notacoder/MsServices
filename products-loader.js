document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('products-container');
  const status = document.getElementById('products-status');
  const pagination = document.getElementById('products-pagination');
  const searchInput = document.getElementById('products-search');
  const filterButtons = document.querySelectorAll('.product-filter-btn');

  const PAGE_SIZE = 9;
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  let activeFilter = 'all';
  let searchQuery = '';

  // Categorization helper based on keywords
  function getCategory(product) {
    const text = `${product.title || ''} ${product.badge || ''} ${product.description || ''}`.toLowerCase();
    if (text.match(/ssd|motherboard|hdmi|converter|monitor|screen|5g|phone|mobile|projector|partybox|fire tv|power bank|speaker/)) {
      return 'tech';
    }
    if (text.match(/extension|mouse|clock|cloth|microfiber|pad|cable|cord/)) {
      return 'office';
    }
    if (text.match(/tawa|dosa|fridge|refrigerator|inflator|trolley|mixer|honey|agaro|hair dryer|rc car/)) {
      return 'home';
    }
    if (text.match(/shirt|jeans|hair|serum|lotion|nivea|derma|cloth|anime|cotton/)) {
      return 'lifestyle';
    }
    return 'other';
  }

  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'amazon-catalog-card';

    const cardBody = document.createElement('div');
    cardBody.className = 'catalog-card-body';

    // Meta row with badge and Amazon tag
    const metaRow = document.createElement('div');
    metaRow.className = 'catalog-card-meta';

    if (product.badge) {
      const badge = document.createElement('span');
      badge.className = 'catalog-badge';
      badge.textContent = product.badge;
      metaRow.appendChild(badge);
    }

    const partnerTag = document.createElement('span');
    partnerTag.className = 'amazon-partner-tag';
    partnerTag.textContent = 'Amazon Partner';
    metaRow.appendChild(partnerTag);

    cardBody.appendChild(metaRow);

    // Title
    if (product.title) {
      const title = document.createElement('h3');
      title.className = 'catalog-item-title';
      title.textContent = product.title;
      cardBody.appendChild(title);
    }

    // Description
    if (product.description) {
      const description = document.createElement('p');
      description.className = 'catalog-item-desc';
      description.textContent = product.description;
      cardBody.appendChild(description);
    }

    // Direct Amazon affiliate link button
    const link = document.createElement('a');
    link.href = product.link || '#';
    link.target = '_blank';
    link.rel = 'noopener sponsored';
    link.className = 'amazon-button-link';
    link.innerHTML = `
      <span>View Product on Amazon</span>
      <svg viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px;" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" />
      </svg>
    `;

    cardBody.appendChild(link);
    card.appendChild(cardBody);
    return card;
  }

  function applyFilters() {
    filteredProducts = allProducts.filter((product) => {
      if (activeFilter !== 'all') {
        const cat = getCategory(product);
        if (cat !== activeFilter) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const text = `${product.title || ''} ${product.badge || ''} ${product.description || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });

    currentPage = 1;
    renderCurrentPage();
  }

  function changePage(page) {
    currentPage = page;
    renderCurrentPage();
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'pagination-btn';
    previous.textContent = '← Previous';
    previous.disabled = currentPage === 1;
    previous.addEventListener('click', () => changePage(currentPage - 1));

    const pageStatus = document.createElement('span');
    pageStatus.className = 'pagination-status';
    pageStatus.setAttribute('aria-live', 'polite');
    pageStatus.style.fontSize = '0.86rem';
    pageStatus.style.color = 'var(--text-muted)';
    pageStatus.textContent = `Page ${currentPage} of ${totalPages} (${filteredProducts.length} items)`;

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'pagination-btn';
    next.textContent = 'Next →';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => changePage(currentPage + 1));

    pagination.append(previous, pageStatus, next);
  }

  function renderCurrentPage() {
    if (!container) return;
    container.innerHTML = '';

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filteredProducts.slice(start, end);

    if (!pageItems.length) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-subtle); border: 1px solid var(--border-hairline); border-radius: 8px;">
          <p style="color: var(--text-muted); font-size: 0.95rem;">No items found matching your search criteria.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="reset-filters" style="margin-top: 12px;">Reset Filter</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          activeFilter = 'all';
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === 'all'));
          applyFilters();
        });
      }
      if (pagination) pagination.hidden = true;
      if (status) status.textContent = '';
      return;
    }

    pageItems.forEach((p) => container.appendChild(createProductCard(p)));
    renderPagination(totalPages);

    if (status) status.textContent = '';
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      applyFilters();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  fetch('products.json')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load products data.');
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data) || !data.length) {
        throw new Error('Products data is empty or invalid.');
      }
      allProducts = data;
      filteredProducts = [...allProducts];
      currentPage = 1;
      renderCurrentPage();
    })
    .catch((error) => {
      console.error(error);
      if (status) {
        status.textContent = 'Unable to load products. Please check back shortly.';
      }
    });
});
