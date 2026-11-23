document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('articles-container');
  const pagination = document.getElementById('articles-pagination');
  const searchInput = document.getElementById('articles-search');
  const filterButtons = document.querySelectorAll('.article-filter-btn');

  const PAGE_SIZE = 9;
  let allCards = [];
  let filteredCards = [];
  let currentPage = 1;
  let activeFilter = 'all';
  let searchQuery = '';

  if (!container) return;

  // Collect all static cards pre-rendered in HTML
  allCards = Array.from(container.querySelectorAll('.blog-corporate-card'));
  filteredCards = [...allCards];

  // Helper to resolve card category
  function getCardCategory(card) {
    if (card.dataset.category) {
      return card.dataset.category.toLowerCase();
    }
    const tag = (card.querySelector('.blog-category-tag')?.textContent || '').toLowerCase();
    if (tag.includes('epfo') || tag.includes('pf')) return 'epfo';
    if (tag.includes('direct') || tag.includes('tax') || tag.includes('itr') || tag.includes('presumptive')) return 'tax';
    if (tag.includes('gst') || tag.includes('indirect')) return 'gst';
    if (tag.includes('mca') || tag.includes('corporate') || tag.includes('incorporation') || tag.includes('startup')) return 'corporate';
    if (tag.includes('finance') || tag.includes('accounting') || tag.includes('cma') || tag.includes('loan') || tag.includes('capital') || tag.includes('compliance')) return 'finance';
    return 'other';
  }

  // Parse page and category from URL query if available
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get('page'), 10);
  if (!isNaN(pageParam) && pageParam > 0) {
    currentPage = pageParam;
  }
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    activeFilter = categoryParam;
    filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
  }

  function applyFilters() {
    filteredCards = allCards.filter((card) => {
      if (activeFilter !== 'all') {
        const cat = getCardCategory(card);
        if (cat !== activeFilter) return false;
      }

      if (searchQuery) {
        const text = (card.textContent || '').toLowerCase();
        if (!text.includes(searchQuery)) return false;
      }

      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      currentPage = 1;
    }

    renderCurrentPage();
  }

  function changePage(page) {
    currentPage = page;
    renderCurrentPage();

    // Sync URL parameter cleanly without full reload
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set('page', currentPage);
    } else {
      url.searchParams.delete('page');
    }
    if (activeFilter !== 'all') {
      url.searchParams.set('category', activeFilter);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({ page: currentPage, category: activeFilter }, '', url);

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
    pageStatus.textContent = `Page ${currentPage} of ${totalPages} (${filteredCards.length} articles)`;

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'pagination-btn';
    next.textContent = 'Next →';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => changePage(currentPage + 1));

    pagination.append(previous, pageStatus, next);
  }

  function renderCurrentPage() {
    const totalItems = filteredCards.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    // Hide all cards first
    allCards.forEach((card) => {
      card.style.display = 'none';
    });

    const emptyNotice = document.getElementById('articles-empty-notice');
    if (emptyNotice) {
      emptyNotice.remove();
    }

    if (!totalItems) {
      const notice = document.createElement('div');
      notice.id = 'articles-empty-notice';
      notice.style.gridColumn = '1 / -1';
      notice.style.textAlign = 'center';
      notice.style.padding = '48px 20px';
      notice.style.background = 'var(--bg-subtle)';
      notice.style.border = '1px solid var(--border-hairline)';
      notice.style.borderRadius = '8px';
      notice.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.95rem;">No articles found matching your criteria.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="reset-articles-filters" style="margin-top: 12px;">Reset Filter</button>
      `;
      container.appendChild(notice);

      const resetBtn = document.getElementById('reset-articles-filters');
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
      return;
    }

    // Display only cards belonging to the current page
    const pageSlice = filteredCards.slice(start, end);
    pageSlice.forEach((card) => {
      card.style.display = 'flex';
    });

    renderPagination(totalPages);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      applyFilters();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      currentPage = 1;
      applyFilters();
    });
  });

  window.addEventListener('popstate', () => {
    const nextParams = new URLSearchParams(window.location.search);
    const nextPage = parseInt(nextParams.get('page'), 10) || 1;
    currentPage = nextPage;
    renderCurrentPage();
  });

  // Execute initial filter & page display
  applyFilters();
});
