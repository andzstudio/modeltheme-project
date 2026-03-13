$(document).ready(function() {
    if (typeof aiToolsData === 'undefined') {
        console.error("ai-tools-data.js is not loaded or aiToolsData is not defined.");
        return;
    }

    const state = {
        products: aiToolsData,
        filters: {
            searchTerm: '',
            category: 'all',
            priceMin: 0,
            priceMax: 100,
            sortBy: 'sales_desc'
        },
        priceRange: { min: 0, max: 100 }
    };

    const $grid = $('#mt-product-grid');
    const $searchInput = $('#mt-search-input');
    const $sortDropdown = $('#mt-sort-dropdown');
    const $sortTrigger = $('#mt-sort-trigger');
    const $sortTriggerText = $('#mt-sort-trigger-text');
    const $sortList = $('#mt-sort-list');
    const $categoryBtns = $('.mt-cat-btn');
    const $priceMinVal = $('#mt-price-min-val');
    const $priceMaxVal = $('#mt-price-max-val');
    const $sliderContainer = $('#mt-price-slider-container');
    const $handleMin = $('#mt-handle-min');
    const $handleMax = $('#mt-handle-max');
    const $sliderRange = $('#mt-slider-range');
    const $activeFiltersContainer = $('#mt-active-filters-container');
    const $clearAllBtn = $('#mt-clear-all-filters');
    const $noResults = $('#mt-no-results');
    const $mobileFilterToggle = $('#mt-mobile-filter-toggle');
    const $sidebar = $('.mt-catalog-sidebar');

    function init() {
        const prices = state.products.map(p => p.price);
        state.priceRange.min = Math.min(...prices);
        state.priceRange.max = Math.max(...prices);
        state.filters.priceMin = state.priceRange.min;
        state.filters.priceMax = state.priceRange.max;

        initPriceSlider();
        bindEvents();
        applyFiltersAndRender();
    }

    function bindEvents() {
        $searchInput.on('input', debounce(handleSearch, 300));
        $sortTrigger.on('click', () => $sortDropdown.toggleClass('open'));
        $sortList.on('click', 'li', handleSort);
        $categoryBtns.on('click', handleCategory);
        $clearAllBtn.on('click', clearAllFilters);
        $activeFiltersContainer.on('click', '.mt-chip-remove', handleRemoveChip);
        $grid.on('click', '.mt-card-action-btn.primary', handleAddToCart);
        $(document).on('click', function(e) {
            if (!$sortDropdown.is(e.target) && $sortDropdown.has(e.target).length === 0) {
                $sortDropdown.removeClass('open');
            }
        });
        $mobileFilterToggle.on('click', () => $sidebar.addClass('open'));
        $sidebar.on('click', function(e) {
            if ($(e.target).is($sidebar)) {
                $sidebar.removeClass('open');
            }
        });
    }

    function handleSearch(e) {
        state.filters.searchTerm = e.target.value.trim().toLowerCase();
        applyFiltersAndRender();
    }

    function handleSort(e) {
        const $li = $(e.currentTarget);
        state.filters.sortBy = $li.data('value');
        
        $sortTriggerText.text($li.text());
        $sortList.find('li').removeClass('active');
        $li.addClass('active');
        $sortDropdown.removeClass('open');
        
        applyFiltersAndRender();
    }

    function handleCategory(e) {
        const $btn = $(e.currentTarget);
        state.filters.category = $btn.data('category');
        $categoryBtns.removeClass('active');
        $btn.addClass('active');
        applyFiltersAndRender();
    }

    function handleAddToCart(e) {
        const $card = $(e.currentTarget).closest('.mt-catalog-card');
        const productId = $card.data('id');
        const product = state.products.find(p => p.id === productId);
        
        if (product && typeof window.addToCart === 'function') {
            window.addToCart(product);
        }
    }

    function handleRemoveChip(e) {
        const key = $(e.currentTarget).parent().data('filter-key');
        switch (key) {
            case 'searchTerm':
                state.filters.searchTerm = '';
                $searchInput.val('');
                break;
            case 'category':
                state.filters.category = 'all';
                $categoryBtns.removeClass('active').filter('[data-category="all"]').addClass('active');
                break;
            case 'price':
                state.filters.priceMin = state.priceRange.min;
                state.filters.priceMax = state.priceRange.max;
                updateSliderUI();
                break;
        }
        applyFiltersAndRender();
    }

    function clearAllFilters() {
        state.filters.searchTerm = '';
        state.filters.category = 'all';
        state.filters.priceMin = state.priceRange.min;
        state.filters.priceMax = state.priceRange.max;
        state.filters.sortBy = 'sales_desc';

        $searchInput.val('');
        $categoryBtns.removeClass('active').filter('[data-category="all"]').addClass('active');
        $sortTriggerText.text('Most Popular');
        $sortList.find('li').removeClass('active').filter('[data-value="sales_desc"]').addClass('active');
        updateSliderUI();
        applyFiltersAndRender();
    }

    function applyFiltersAndRender() {
        let filteredProducts = [...state.products];

        if (state.filters.searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(state.filters.searchTerm));
        }

        if (state.filters.category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === state.filters.category);
        }

        filteredProducts = filteredProducts.filter(p => p.price >= state.filters.priceMin && p.price <= state.filters.priceMax);

        sortProducts(filteredProducts, state.filters.sortBy);

        renderProducts(filteredProducts);
        updateActiveFiltersUI();
    }

    function sortProducts(products, sortBy) {
        products.sort((a, b) => {
            switch (sortBy) {
                case 'sales_desc': return b.sales - a.sales;
                case 'sales_asc': return a.sales - b.sales;
                case 'price_desc': return b.price - a.price;
                case 'price_asc': return a.price - b.price;
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });
    }

    function renderProducts(products) {
        $grid.empty();
        if (products.length === 0) {
            $noResults.show();
            return;
        }
        $noResults.hide();

        const productElements = products.map(p => createProductCardHTML(p));
        $grid.html(productElements.join(''));

        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.mt-catalog-card', 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }
            );
        }
    }

    function createProductCardHTML(product) {
        const originalPriceHTML = product.originalPrice ? `<del>$${product.originalPrice}</del>` : '';
        const badgeHTML = product.badge ? `<span class="mt-card-badge ${product.badge.type}">${product.badge.text}</span>` : '';

        let categoryHTML;
        if (product.category.startsWith('WordPress')) {
            const categoryType = product.category.split(' ')[1] || '';
            categoryHTML = `
                <div class="mt-card-category wp-category">
                    <img src="img/products/ai-tools/type/wordpress.png" alt="WordPress Logo">
                    <span>${categoryType}</span>
                </div>`;
        } else {
            categoryHTML = `<span class="mt-card-category">${product.category}</span>`;
        }

        return `
            <div class="mt-catalog-card" data-id="${product.id}">
                <div class="mt-card-media">
                    ${badgeHTML}
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="mt-card-content">
                    ${categoryHTML}
                    <h3 class="mt-card-title">${product.name}</h3>
                    <div class="mt-card-meta">
                        <div class="mt-card-price">${originalPriceHTML} <strong>$${product.price}</strong></div>
                        <div class="mt-card-sales"><ion-icon name="cart-outline"></ion-icon> ${product.sales} Sales</div>
                    </div>
                    <div class="mt-card-actions">
                        <button class="mt-card-action-btn primary">Add to Cart</button>
                        <button class="mt-card-action-btn secondary">Preview</button>
                    </div>
                </div>
            </div>
        `;
    }

    function updateActiveFiltersUI() {
        $activeFiltersContainer.empty();
        let hasFilters = false;

        if (state.filters.searchTerm) {
            $activeFiltersContainer.append(createChipHTML('searchTerm', `Search: "${state.filters.searchTerm}"`));
            hasFilters = true;
        }
        if (state.filters.category !== 'all') {
            $activeFiltersContainer.append(createChipHTML('category', `Category: ${state.filters.category}`));
            hasFilters = true;
        }
        if (state.filters.priceMin > state.priceRange.min || state.filters.priceMax < state.priceRange.max) {
            $activeFiltersContainer.append(createChipHTML('price', `Price: $${state.filters.priceMin} - $${state.filters.priceMax}`));
            hasFilters = true;
        }

        $clearAllBtn.toggle(hasFilters);
    }

    function createChipHTML(key, text) {
        return `
            <div class="mt-active-filter-chip" data-filter-key="${key}">
                <span>${text}</span>
                <button class="mt-chip-remove" aria-label="Remove filter"><ion-icon name="close-outline"></ion-icon></button>
            </div>
        `;
    }

    function initPriceSlider() {
        updateSliderUI();

        let activeHandle = null;

        function startDrag(e, handle) {
            e.preventDefault();
            activeHandle = handle;
            $(document).on('mousemove', onDrag);
            $(document).on('mouseup', stopDrag);
            $(document).on('touchmove', onDrag);
            $(document).on('touchend', stopDrag);
        }

        function onDrag(e) {
            if (!activeHandle) return;
            const rect = $sliderContainer[0].getBoundingClientRect();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            let x = clientX - rect.left;
            let percent = (x / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));

            const price = Math.round(state.priceRange.min + (percent / 100) * (state.priceRange.max - state.priceRange.min));

            if (activeHandle === 'min') {
                state.filters.priceMin = Math.min(price, state.filters.priceMax);
            } else {
                state.filters.priceMax = Math.max(price, state.filters.priceMin);
            }
            updateSliderUI();
        }

        function stopDrag() {
            if (!activeHandle) return;
            activeHandle = null;
            $(document).off('mousemove', onDrag);
            $(document).off('mouseup', stopDrag);
            $(document).off('touchmove', onDrag);
            $(document).off('touchend', stopDrag);
            debounce(applyFiltersAndRender, 50)();
        }

        $handleMin.on('mousedown', (e) => startDrag(e, 'min'));
        $handleMin.on('touchstart', (e) => startDrag(e, 'min'));
        $handleMax.on('mousedown', (e) => startDrag(e, 'max'));
        $handleMax.on('touchstart', (e) => startDrag(e, 'max'));
    }

    function updateSliderUI() {
        const range = state.priceRange.max - state.priceRange.min;
        if (range <= 0) return;

        const minPercent = ((state.filters.priceMin - state.priceRange.min) / range) * 100;
        const maxPercent = ((state.filters.priceMax - state.priceRange.min) / range) * 100;

        $handleMin.css('left', `${minPercent}%`);
        $handleMax.css('left', `${maxPercent}%`);
        $sliderRange.css({
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`
        });

        $priceMinVal.text(`$${state.filters.priceMin}`);
        $priceMaxVal.text(`$${state.filters.priceMax}`);
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    init();
});