// --- Global Cart Module ---
const CartManager = {
    cart: [],
    
    init() {
        this.loadCart();
        this.bindEvents();
        this.renderCart();
        this.renderMiniCart();
    },

    loadCart() {
        this.cart = JSON.parse(localStorage.getItem('mt_cart')) || [];
    },

    saveCart() {
        localStorage.setItem('mt_cart', JSON.stringify(this.cart));
    },

    addToCart(event, product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            this.showNotification(`${product.name} is already in your cart.`, 'info');
            this.shakeCartIcon();
            return;
        }

        // Animation
        if (event && event.target) {
            this.flyToCartAnimation(event.target);
        }

        this.cart.push({ ...product, quantity: 1 });
        this.saveCart();
        this.renderCart();
        this.renderMiniCart();
        this.showNotification(`${product.name} added to cart.`, 'success');
    },

    removeFromCart(productId) {
        const itemToRemove = this.cart.find(item => item.id === productId);
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.renderCart();
        this.renderMiniCart();
        if (itemToRemove) {
            this.showNotification(`${itemToRemove.name} was removed.`, 'error');
        }
    },

    clearCart() {
        if (this.cart.length > 0) {
            this.showNotification('All items removed from cart.', 'info');
        }
        this.cart = [];
        this.saveCart();
        this.renderCart();
        this.renderMiniCart();
    },

    renderCart() {
        const $cartBody = $('#mt-cart-body');
        const $cartBadge = $('#mt-cart-badge');
        const $cartSubtotal = $('#mt-cart-subtotal');
        const $cartEmpty = $('.mt-cart-empty');
        const $cartFooter = $('.mt-cart-footer');
        const $cartTotalItems = $('#mt-cart-total-items');

        $cartBody.find('.mt-cart-item').remove();
        
        if (this.cart.length === 0) {
            $cartEmpty.show();
            $cartFooter.hide();
            $cartBadge.text('0').removeClass('has-items');
            return;
        }

        $cartEmpty.hide();
        $cartFooter.show();
        let subtotal = 0;
        let totalItems = this.cart.length;
        
        this.cart.forEach(item => {
            const itemSubtotal = item.price;
            subtotal += itemSubtotal;

            const itemHTML = `
                <div class="mt-cart-item" data-id="${item.id}">
                    <div class="mt-cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="mt-cart-item-details">
                        <span class="mt-cart-item-title">${item.name}</span>
                        <span class="mt-cart-item-category">${item.category || 'Product'}</span>
                    </div>
                    <div class="mt-cart-item-actions">
                        <span class="mt-cart-item-subtotal">$${itemSubtotal.toFixed(2)}</span>
                        <button class="mt-cart-item-remove" aria-label="Remove item"><ion-icon name="trash-outline"></ion-icon></button>
                    </div>
                </div>
            `;
            $cartBody.append(itemHTML);
        });

        $cartSubtotal.text(`$${subtotal.toFixed(2)}`);
        if ($cartTotalItems.length) {
            $cartTotalItems.text(`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`);
        }
        $cartBadge.text(this.cart.length).addClass('has-items');
    },

    renderMiniCart() {
        const $miniCartBody = $('#mt-mini-cart-body');
        const $miniCartFooter = $('#mt-mini-cart-footer');
        const $miniCartEmpty = $('#mt-mini-cart-empty');
        const $miniCartSubtotal = $('#mt-mini-cart-subtotal');
    
        if (!$miniCartBody.length) return;
    
        $miniCartBody.empty();
    
        if (this.cart.length === 0) {
            $miniCartEmpty.show();
            $miniCartFooter.hide();
            return;
        }
    
        $miniCartEmpty.hide();
        $miniCartFooter.show();
        let subtotal = 0;
    
        this.cart.forEach(item => {
            subtotal += item.price;
            const itemHTML = `
                <div class="mt-mini-cart-item" data-id="${item.id}">
                    <div class="mt-mini-cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="mt-mini-cart-item-details">
                        <span class="mt-mini-cart-item-title">${item.name}</span>
                        <span class="mt-mini-cart-item-price">$${item.price.toFixed(2)}</span>
                    </div>
                    <button class="mt-mini-cart-item-remove" aria-label="Remove item"><ion-icon name="close-outline"></ion-icon></button>
                </div>
            `;
            $miniCartBody.append(itemHTML);
        });
    
        $miniCartSubtotal.text(`$${subtotal.toFixed(2)}`);
    },

    openDrawer() {
        $('#mt-cart-drawer').addClass('is-open');
        $('#mt-cart-drawer-overlay').addClass('is-open');
        $('body').addClass('mt-drawer-open');
    },

    closeDrawer() {
        $('#mt-cart-drawer').removeClass('is-open');
        $('#mt-cart-drawer-overlay').removeClass('is-open');
        $('body').removeClass('mt-drawer-open');
    },

    shakeCartIcon() {
        const $cartIcon = $('#mt-cart-toggle-btn');
        if ($cartIcon.length > 0 && gsap) {
            gsap.fromTo($cartIcon, 
                { x: 0 }, 
                { 
                    duration: 0.5, 
                    x: 7, 
                    ease: 'elastic.out(1, 0.2)',
                    onComplete: () => gsap.set($cartIcon, { clearProps: 'x' })
                }
            );
        }
    },

    flyToCartAnimation(buttonElement) {
        const $button = $(buttonElement);
        const $card = $button.closest('.mt-ai-tools-card, .mt-catalog-card');
        if ($card.length === 0) return;

        const $image = $card.find('.mt-ai-tools-card-media img, .mt-card-media img');
        if ($image.length === 0) return;

        const $cartIcon = $('#mt-cart-toggle-btn');
        if ($cartIcon.length === 0) return;

        const startRect = $image[0].getBoundingClientRect();
        const endRect = $cartIcon[0].getBoundingClientRect();

        const $clone = $image.clone().css({
            position: 'fixed',
            top: startRect.top,
            left: startRect.left,
            width: startRect.width,
            height: startRect.height,
            borderRadius: '12px',
            objectFit: 'cover',
            zIndex: 10001,
            pointerEvents: 'none'
        }).appendTo('body');

        gsap.to($clone, {
            top: endRect.top + endRect.height / 2,
            left: endRect.left + endRect.width / 2,
            width: 30,
            height: 30,
            opacity: 0.3,
            rotation: 270,
            borderRadius: '50%',
            duration: 1.1,
            ease: 'power2.inOut',
            onComplete: () => {
                $clone.remove();
                const $badge = $('#mt-cart-badge');
                if ($badge.length > 0) {
                    gsap.fromTo($badge, 
                        { scale: 1.8 }, 
                        { scale: 1, duration: 0.5, ease: 'back.out(3)' }
                    );
                }
            }
        });
    },

    showNotification(message, type = 'success') {
        // This function is now globally available via account.js, but we keep a fallback.
        if (typeof showAuthNotification === 'function') {
            showAuthNotification(message, type);
        } else {
            alert(message);
        }
    },

    bindEvents() {
        $('#mt-cart-toggle-btn').on('click', (e) => { e.preventDefault(); this.openDrawer(); });
        $('#mt-cart-close-btn, #mt-cart-drawer-overlay').on('click', () => this.closeDrawer());
        $('#mt-cart-clear-btn').on('click', () => this.clearCart());
        $('#mt-cart-body').on('click', '.mt-cart-item-remove', (e) => {
            const productId = $(e.currentTarget).closest('.mt-cart-item').data('id');
            this.removeFromCart(productId);
        });

        $('#mt-mini-cart-body').on('click', '.mt-mini-cart-item-remove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = $(e.currentTarget).closest('.mt-mini-cart-item').data('id');
            this.removeFromCart(productId);
        });
    
        $('#mt-mini-cart-view-cart-btn').on('click', (e) => {
            e.preventDefault();
            this.openDrawer();
        });
    }
};

window.addToCart = function(event, product) {
    CartManager.addToCart(event, product);
}

$(document).ready(function () {

    // Lenis Smooth Scroll Initialization
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- Scroll Position Restoration ---
    const currentPath = window.location.pathname.split('/').pop();
    
    if (currentPath === 'index.html' || currentPath === '') {
        const allToolsLinks = document.querySelectorAll('a[href="ai-tools.html"]');
        allToolsLinks.forEach(link => {
            link.addEventListener('click', () => {
                sessionStorage.setItem('modeltheme_scroll_pos', window.scrollY);
            });
        });

        const scrollPos = sessionStorage.getItem('modeltheme_scroll_pos');
        if (scrollPos) {
            setTimeout(() => {
                if (lenis) {
                    lenis.scrollTo(scrollPos, { immediate: true });
                } else {
                    window.scrollTo(0, scrollPos);
                }
                sessionStorage.removeItem('modeltheme_scroll_pos');
            }, 100); 
        }
    }


    // Mobile Menu Toggle
    const $mobileToggle = $('#mt-mobileToggle');
    const $navContainer = $('#mt-navContainer');
    const $body = $('body');
    const $navbar = $('.mt-navbar');

    $mobileToggle.on('click', function () {
        const isActive = $navContainer.toggleClass('active').hasClass('active');
        $mobileToggle.toggleClass('active');
        $body.toggleClass('mobile-menu-open', isActive);

        if (isActive) {
            const navbarHeight = $navbar.outerHeight();
            $navContainer.css('paddingTop', `${navbarHeight}px`);
            lenis.stop();
        } else {
            lenis.start();
        }
    });

    // Mobile Dropdowns (Accordion style)
    const $allDropdownParents = $('.mt-dropdown-parent');

    $allDropdownParents.find('> a').on('click', function (e) {
        if (window.innerWidth <= 992) {
            e.preventDefault();
            const $parent = $(this).closest('.mt-dropdown-parent');
            const $menu = $parent.find('.mt-dropdown-menu');
            const isOpen = $parent.hasClass('mobile-open');

            // Close other dropdowns
            $('.mt-dropdown-parent.mobile-open').not($parent).removeClass('mobile-open').find('.mt-dropdown-menu').css('maxHeight', '');

            // Toggle the current one
            if (isOpen) {
                $parent.removeClass('mobile-open');
                $menu.css('maxHeight', '');
            } else {
                $parent.addClass('mobile-open');
                $menu.css('maxHeight', $menu.prop('scrollHeight') + "px");
            }
        }
    });

    // Vertical Word Switcher
    const words = ["Faster Websites", "Smarter Websites", "Better Websites"];
    let wordIndex = 0;
    const $switcher = $("#mt-wordSwitcher");

    setInterval(() => {
        const $currentSpan = $switcher.find('.mt-in');
        if ($currentSpan.length) {
            $currentSpan.removeClass('mt-in').addClass('mt-out');
        }

        wordIndex = (wordIndex + 1) % words.length;
        const $nextSpan = $('<span></span>')
            .addClass('mt-text-gradient mt-start')
            .text(words[wordIndex]);

        $switcher.append($nextSpan);

        // Force reflow to apply transition
        $nextSpan.get(0).offsetWidth;

        $nextSpan.removeClass('mt-start').addClass('mt-in');

        setTimeout(() => {
            $currentSpan.remove();
        }, 700);
    }, 3000);

    // Magnetic Button Effect
    $('.mt-magnetic-btn').on('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        $(this).css('transform', `translate(${x * 0.3}px, ${y * 0.3}px)`);
    }).on('mouseleave', function () {
        $(this).css('transform', 'translate(0px, 0px)');
    });

    // Dynamic Counter
    function animateCounter($element) {
        const target = +$element.data('target');
        const suffix = $element.data('suffix') || '';
        const duration = 2000;

        $({
            count: 0
        }).animate({
            count: target
        }, {
            duration: duration,
            easing: 'swing',
            step: function () {
                $element.text(Math.ceil(this.count).toLocaleString('en-US'));
            },
            complete: function () {
                $element.text(target.toLocaleString('en-US') + suffix);
            }
        });
    }

    setTimeout(() => {
        $('.mt-counter-number').each(function () {
            animateCounter($(this));
        });
    }, 600);


    // Navbar Scroll Behavior
    let lastScrollTop = 0;
    $(window).on('scroll', function () {
        const navbarHeight = $navbar.outerHeight();
        let scrollTop = $(this).scrollTop();

        // Add shadow and background on scroll
        $navbar.toggleClass('mt-navbar-scrolled', scrollTop > 10);

        // Hide/Show on scroll
        if (scrollTop > lastScrollTop && scrollTop > navbarHeight * 2) {
            $navbar.addClass('mt-navbar-minimal'); // Scrolling down
        } else {
            $navbar.removeClass('mt-navbar-minimal'); // Scrolling up
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Intersection Observer for animations
    const animatedSections = document.querySelectorAll('.mt-ai-tools-section');
    if (animatedSections.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        animatedSections.forEach(section => observer.observe(section));
    }

    // Initialize the cart manager
    CartManager.init();
});