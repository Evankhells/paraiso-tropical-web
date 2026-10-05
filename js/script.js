(() => {
  'use strict';
  const categories = window.PARAISO_MENU;
  if (!Array.isArray(categories) || !categories.length) return;
  const tabs = document.getElementById('category-tabs');
  const track = document.getElementById('product-track');
  const panel = document.getElementById('menu-panel');
  const search = document.getElementById('menu-search');
  const clearSearch = document.getElementById('clear-search');
  const heading = document.getElementById('category-title');
  const count = document.getElementById('result-count');
  const emptyState = document.getElementById('empty-state');
  const previous = document.getElementById('products-prev');
  const next = document.getElementById('products-next');
  const categoryBack = document.querySelector('.category-back');
  const categoryNext = document.querySelector('.category-next');
  const carouselHint = document.getElementById('carousel-hint');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeCategory = categories[0];
  let frame;
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  categories.forEach(category => {
    const tab = element('button', 'category-tab');
    tab.type = 'button';
    tab.id = `tab-${category.id}`;
    tab.dataset.category = category.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'menu-panel');
    tab.append(element('span', 'category-tab-icon', category.icon), element('span', '', category.name), element('span', 'category-tab-count', category.products.length));
    tab.firstChild.setAttribute('aria-hidden', 'true');
    tabs.append(tab);
  });
  function updateControls() {
    const overflow = track.scrollWidth > track.clientWidth + 2;
    previous.disabled = !overflow || track.scrollLeft <= 2;
    next.disabled = !overflow || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    carouselHint.hidden = !overflow || panel.hidden;
    categoryBack.disabled = tabs.scrollLeft <= 2;
    categoryNext.disabled = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2;
    document.querySelector('.category-hint').hidden = tabs.scrollWidth <= tabs.clientWidth + 2;
  }
  function scheduleControls() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateControls);
  }
  function productCard(product, category, showCategory) {
    const card = element('article', 'product-card');
    card.setAttribute('role', 'listitem');
    const visual = element('div', 'product-visual');
    const image = element('img');
    image.src = product.image;
    image.alt = product.imageAlt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 360;
    image.height = 240;
    visual.append(image);
    if (showCategory) visual.append(element('span', 'product-category', category.name));
    const body = element('div', 'product-body');
    body.append(element('h4', '', product.name), element('p', 'product-description', product.description));
    const prices = element('div', 'product-prices');
    if (product.price) prices.append(element('span', 'price', product.price));
    (product.sizes || []).forEach(size => prices.append(element('span', 'size-price', size)));
    body.append(prices);
    card.append(visual, body);
    return card;
  }
  function render() {
    const query = normalize(search.value);
    const words = query.split(/\s+/).filter(Boolean);
    const results = query
      ? categories.flatMap(category => category.products
          .filter(product => words.every(word => normalize(`${product.name} ${product.description} ${category.name}`).includes(word)))
          .map(product => ({ product, category })))
      : activeCategory.products.map(product => ({ product, category: activeCategory }));
    tabs.querySelectorAll('[role="tab"]').forEach(tab => {
      const selected = !query && tab.dataset.category === activeCategory.id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = tab.dataset.category === activeCategory.id ? 0 : -1;
    });
    heading.textContent = query ? `Resultados para “${search.value.trim()}”` : activeCategory.name;
    count.textContent = query
      ? `${results.length} ${results.length === 1 ? 'producto encontrado' : 'productos encontrados'} en todo el menú`
      : `${results.length} ${results.length === 1 ? 'delicia para disfrutar' : 'delicias para disfrutar'}`;
    clearSearch.hidden = !search.value;
    panel.hidden = !results.length;
    emptyState.hidden = Boolean(results.length);
    if (query) {
      panel.removeAttribute('role');
      panel.setAttribute('aria-labelledby', 'category-title');
    } else {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${activeCategory.id}`);
    }
    track.setAttribute('aria-label', query ? 'Resultados de búsqueda del menú' : `Productos de ${activeCategory.name}`);
    track.replaceChildren(...results.map(({ product, category }) => productCard(product, category, Boolean(query))));
    track.scrollLeft = 0;
    previous.disabled = true;
    next.disabled = !results.length;
    scheduleControls();
  }
  function selectCategory(id, { focus = false, updateHash = false } = {}) {
    const category = categories.find(item => item.id === id);
    if (!category) return false;
    activeCategory = category;
    search.value = '';
    render();
    const tab = document.getElementById(`tab-${id}`);
    // Keep the active category visible without moving the page vertically.
    const tabRect = tab.getBoundingClientRect();
    const listRect = tabs.getBoundingClientRect();
    if (tabRect.left < listRect.left) tabs.scrollBy({ left: tabRect.left - listRect.left, behavior: 'auto' });
    else if (tabRect.right > listRect.right) tabs.scrollBy({ left: tabRect.right - listRect.right, behavior: 'auto' });
    if (focus) tab.focus({ preventScroll: true });
    if (updateHash) history.replaceState(null, '', `#${id === 'postres' ? 'postres-clasicos' : id}`);
    scheduleControls();
    return true;
  }
  tabs.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) selectCategory(tab.dataset.category, { updateHash: true });
  });
  tabs.addEventListener('keydown', event => {
    const index = categories.findIndex(category => category.id === event.target.dataset.category);
    if (index < 0) return;
    let targetIndex;
    if (event.key === 'ArrowRight') targetIndex = (index + 1) % categories.length;
    if (event.key === 'ArrowLeft') targetIndex = (index - 1 + categories.length) % categories.length;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = categories.length - 1;
    if (targetIndex === undefined) return;
    event.preventDefault();
    selectCategory(categories[targetIndex].id, { focus: true, updateHash: true });
  });
  search.addEventListener('input', render);
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      search.value = '';
      render();
    }
  });
  clearSearch.addEventListener('click', () => {
    search.value = '';
    render();
    search.focus();
  });
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    render();
    search.focus();
  });
  function moveProducts(direction) {
    const card = track.querySelector('.product-card');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  previous.addEventListener('click', () => moveProducts(-1));
  next.addEventListener('click', () => moveProducts(1));
  panel.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveProducts(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  });
  categoryBack.addEventListener('click', () => tabs.scrollBy({ left: -tabs.clientWidth * .65, behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
  categoryNext.addEventListener('click', () => tabs.scrollBy({ left: tabs.clientWidth * .65, behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
  track.addEventListener('scroll', scheduleControls, { passive: true });
  tabs.addEventListener('scroll', scheduleControls, { passive: true });
  window.addEventListener('resize', scheduleControls);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleControls);
    observer.observe(track);
    observer.observe(tabs);
  }
  // Keep the old #postres link for special desserts; distinguish classic desserts.
  const aliases = { postres: 'postres-especiales', 'postres-clasicos': 'postres' };
  function applyHash() {
    const id = location.hash.slice(1);
    if (selectCategory(aliases[id] || id)) {
      document.getElementById('menu').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  window.addEventListener('hashchange', applyHash);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    const id = hash.slice(1);
    if (!categories.some(category => category.id === (aliases[id] || id))) return;
    // Category links also work when the current URL already contains this hash.
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    applyHash();
  });
  const featured = categories.find(category => category.id === 'premium')?.products.find(product => product.image === 'img/productos/copa_verano_mango_kiwi.webp');
  if (featured) {
    document.querySelector('#hero-feature strong').textContent = featured.name;
    document.querySelector('#hero-feature .feature-price').textContent = featured.price;
  }
  render();
  if (location.hash) requestAnimationFrame(applyHash);
})();
