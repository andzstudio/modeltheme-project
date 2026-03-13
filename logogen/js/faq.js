/**
 * Support Center Manager for FAQ Section
 * Architecture: Modular Object-Oriented approach.
 * Enforces single responsibility, debouncing for performance, and clean DOM manipulation.
 */
class FaqSupportCenter {
    constructor() {
        // Cache DOM elements
        this.dom = {
            searchInput: document.getElementById('lg-faq-search'),
            filterBtns: document.querySelectorAll('.lg-faq-nav-button'),
            faqItems: document.querySelectorAll('.lg-faq-card'),
            emptyState: document.getElementById('lg-faq-empty-state'),
            faqContainer: document.getElementById('lg-faq-container')
        };

        // Check if the container exists before proceeding
        if (!this.dom.faqContainer) {
            return;
        }

        // State
        this.state = {
            searchTerm: '',
            activeCategory: 'all'
        };

        // Init
        this.bindEvents();
    }

    /**
     * Attach Event Listeners
     */
    bindEvents() {
        // FAQ Accordion Toggle
        this.dom.faqItems.forEach(item => {
            const header = item.querySelector('.lg-faq-header');
            if (header) {
                header.addEventListener('click', () => this.toggleFaq(item));
            }
        });

        // Category Filter Click
        this.dom.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCategoryFilter(e.currentTarget));
        });

        // Search Input (Debounced)
        if (this.dom.searchInput) {
            this.dom.searchInput.addEventListener('input', this.debounce((e) => {
                this.state.searchTerm = e.target.value.toLowerCase().trim();
                this.filterContent();
            }, 300));
        }
    }

    /**
     * Handles accordion logic. Closes others before opening the target.
     */
    toggleFaq(targetItem) {
        const isExpanded = targetItem.classList.contains('is-expanded');

        // Close all
        this.dom.faqItems.forEach(item => item.classList.remove('is-expanded'));

        // Open target if it wasn't already open
        if (!isExpanded) {
            targetItem.classList.add('is-expanded');
        }
    }

    /**
     * Updates category UI and triggers filter
     */
    handleCategoryFilter(btn) {
        this.dom.filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        this.state.activeCategory = btn.getAttribute('data-filter');
        this.filterContent();
    }

    /**
     * Core filtering logic based on state (Search + Category)
     */
    filterContent() {
        let visibleCount = 0;

        this.dom.faqItems.forEach(item => {
            const textContent = item.innerText.toLowerCase();
            const keywords = (item.getAttribute('data-keywords') || '').toLowerCase();
            const category = item.getAttribute('data-category');

            const matchesSearch = textContent.includes(this.state.searchTerm) || keywords.includes(this.state.searchTerm);
            const matchesCategory = this.state.activeCategory === 'all' || category === this.state.activeCategory;

            if (matchesSearch && matchesCategory) {
                item.classList.remove('lg-faq-util-hidden');
                visibleCount++;
            } else {
                item.classList.add('lg-faq-util-hidden');
                item.classList.remove('is-expanded');
            }
        });

        // Empty State handling
        this.dom.emptyState.classList.toggle('lg-faq-util-hidden', visibleCount > 0);
    }

    /**
     * Utility: Debounce function for performance optimization
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FaqSupportCenter();
});