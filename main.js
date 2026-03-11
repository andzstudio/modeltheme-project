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

    // --- AI Tools Showcase Carousel ---
    function initAiToolsCarousel() {
        const $carousel = $('#mt-ai-showcase-carousel');
        if (!$carousel.length) return;

        const $cards = $carousel.find('.mt-showcase-card');
        const $backgroundsContainer = $('.mt-ai-showcase-backgrounds');
        let cardCount = $cards.length;
        let activeIndex = 0;

        // 1. Create background images
        $cards.each(function(index) {
            const imgSrc = $(this).data('img-src');
            const $bg = $('<div>', {
                class: 'mt-bg-image',
                'data-index': index
            }).css('background-image', `url(${imgSrc})`);
            $backgroundsContainer.append($bg);
        });
        const $backgrounds = $backgroundsContainer.find('.mt-bg-image');

        // 2. Update function
        function updateCarousel(newIndex, direction) {
            if (newIndex < 0 || newIndex >= cardCount) return;
            activeIndex = newIndex;

            // Update card classes
            $cards.each(function(i) {
                const $card = $(this);
                $card.removeClass('is-active is-prev is-next is-hidden-prev is-hidden-next');

                if (i === activeIndex) {
                    $card.addClass('is-active');
                } else if (i === activeIndex - 1) {
                    $card.addClass('is-prev');
                } else if (i === activeIndex + 1) {
                    $card.addClass('is-next');
                } else if (i < activeIndex) {
                    $card.addClass('is-hidden-prev');
                } else {
                    $card.addClass('is-hidden-next');
                }
            });

            // Update background
            $backgrounds.removeClass('is-active');
            $backgrounds.filter(`[data-index="${activeIndex}"]`).addClass('is-active');
        }

        // 3. Event Listeners
        $cards.on('click', function() {
            const clickedIndex = $(this).index();
            if (clickedIndex !== activeIndex) {
                updateCarousel(clickedIndex);
            }
        });

        // 4. Initial setup
        // Set a slight delay to ensure images are somewhat loaded for the background
        setTimeout(() => {
             updateCarousel(Math.floor(cardCount / 2)); // Start with the middle card
        }, 100);
       
    }

    // Initialize on document ready
    if (window.innerWidth > 768) { // Only run carousel on desktop
        initAiToolsCarousel();
    }

});