/**
 * Handles the interactive reviews section.
 * Assumes Lenis is initialized globally.
 */
document.addEventListener('DOMContentLoaded', () => {
    const reviewsSection = document.querySelector('.lg-reviews');
    if (!reviewsSection) {
        return; // Don't run if the section isn't on the page
    }

    // Inject Modal HTML for "See All" prompt functionality
    const modalHtml = `
    <div class="lg-full-prompt-overlay" id="lg-full-prompt-overlay">
        <div class="lg-full-prompt-modal">
            <button class="lg-full-prompt-close-btn" id="lg-full-prompt-close-btn"><ion-icon name="close-outline"></ion-icon></button>
            <h4 class="lg-full-prompt-title">Full Prompt</h4>
            <p class="lg-full-prompt-text" id="lg-full-prompt-text"></p>
            <div class="lg-full-prompt-actions">
                <button class="lg-button lg-button--primary" id="lg-full-prompt-copy-btn">
                    <ion-icon name="copy-outline"></ion-icon>
                    <span>Copy Prompt</span>
                </button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 1. DATA
    const servicesData = [
        { name: "Logo Generator", rating: 4.9, score: 98 },
        { name: "Background Remover", rating: 4.9, score: 99 },
        { name: "Crisp Upscale", rating: 4.8, score: 95 },
        { name: "Image to Vector", rating: 4.7, score: 93 }
    ];

    const reviewsData = [
        {
            id: 1,
            name: "Sarah Jenkins",
            handle: "@sarahj_design",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            service: "Logo Generator",
            rating: 5,
            text: "Absolutely mind-blowing. Generated a production-ready vector logo for my startup in under 30 seconds. The minimalist options are incredibly refined.",
            date: "Oct 24, 2023",
            views: "124.5K",
            userStats: "14 Logos • 3 Vectors",
            prompt: "A vibrant, abstract logo for a tech startup, minimalist style, using neon green and deep purple, 3D render, vector, clean lines.",
            previewImage: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: 2,
            name: "Marcus Chen",
            handle: "@marcus_photos",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            service: "Background Remover",
            rating: 5,
            text: "The edge detection on hair and complex textures is the best I've ever seen. It completely replaced my Photoshop workflow for e-commerce.",
            date: "Nov 02, 2023",
            views: "89.2K",
            userStats: "42 BG Removals • 5 Upscales",
            prompt: "Full body fashion shot of a model in a flowing red dress, city street background, remove background perfectly around the hair.",
            previewImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: 3,
            name: "Elena Rodriguez",
            handle: "@elenacreates",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            service: "Crisp Upscale",
            rating: 4,
            text: "Saved an old, low-resolution ad asset. It didn't just unblur it, the AI 'hallucinated' the missing details with terrifying precision.",
            date: "Nov 15, 2023",
            views: "210.8K",
            userStats: "12 Upscales • 2 Logos",
            prompt: "Upscale a blurry vintage concert poster to 4K, enhance text legibility, restore faded colors, AI photo restoration.",
            previewImage: "https://images.unsplash.com/photo-1604871000636-074fa5117945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: 4,
            name: "David Kim",
            handle: "@dkim_ui",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            service: "Image to Vector",
            rating: 5,
            text: "Converted a messy pencil sketch into a perfectly clean SVG file in one click. The path optimization is practically flawless.",
            date: "Dec 05, 2023",
            views: "56.4K",
            userStats: "24 Vectors • 10 BG Removals",
            prompt: "Convert a hand-drawn sketch of a coffee cup into a clean, scalable SVG vector file, single line style, no fills.",
            previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        }
    ];

    // State variables for vertical sliding
    let currentImageLayer = 0; 
    let currentDataIndex = -1; // Initialize to -1 to ensure the first update runs

    // 2. RENDER FUNCTIONS
    function renderServicesStats() {
        const container = document.getElementById('lg-reviews-services-stats');
        if (!container) return;
        let html = '';
 
        servicesData.forEach(service => {
            html += `
                <div class="lg-reviews__service-stat-item" title="${service.score}% satisfaction">
                    <div class="lg-reviews__service-stat-header">
                        <span class="lg-reviews__service-stat-name">${service.name}</span>
                        <span class="lg-reviews__service-stat-rating" data-rating="${service.rating}">
                            0.0 
                            <i class="ph-fill ph-star"></i>
                        </span>
                    </div>
                    <div class="lg-reviews__service-stat-bar-track">
                        <div class="lg-reviews__service-stat-bar-glow"></div>
                        <div class="lg-reviews__service-stat-bar-fill" 
                             data-score="${service.score}"
                             style="transform: scaleX(0);">
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
 
        // Animate stats into view with ScrollTrigger
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: container,
                start: "top 85%", // Start when 85% of the container is visible
                once: true, // Animate only once
                onEnter: () => {
                    const statItems = container.querySelectorAll('.lg-reviews__service-stat-item');
                    statItems.forEach((item, index) => {
                        const bar = item.querySelector('.lg-reviews__service-stat-bar-fill');
                        const ratingSpan = item.querySelector('.lg-reviews__service-stat-rating');
                        const targetRating = parseFloat(ratingSpan.dataset.rating);
 
                        // Animate the bar
                        gsap.to(bar, {
                            scaleX: parseFloat(bar.dataset.score) / 100,
                            duration: 1.5,
                            ease: 'power3.out',
                            delay: index * 0.1
                        });
 
                        // Animate the rating number
                        let counter = { value: 0 };
                        gsap.to(counter, {
                            value: targetRating,
                            duration: 2,
                            ease: 'power3.out',
                            delay: index * 0.1,
                            onUpdate: () => {
                                // Update the text, keeping one decimal place
                                ratingSpan.childNodes[0].nodeValue = counter.value.toFixed(1) + ' ';
                            }
                        });
                    });
                }
            });
        } else {
            console.error("GSAP or ScrollTrigger not loaded, cannot animate review stats.");
        }
    }
 
    function generateStars(rating) {
        return Array(5).fill(0).map((_, i) => 
            i < rating ? `<i class="ph-fill ph-star"></i>` : `<i class="ph ph-star"></i>`
        ).join('');
    }

    function renderReviews() {
        const container = document.getElementById('lg-reviews-list');
        if (!container) return;
        let html = '';

        reviewsData.forEach((review, index) => {
            const stateClass = index === 0 ? '' : 'inactive';
            const avatarClass = index === 0 ? '' : 'grayscale';
            
            html += `
                <div class="lg-reviews__item ${stateClass}" data-index="${index}">
                    <div class="lg-reviews__item-quote-mark">"</div>
                    <div class="lg-reviews__user-profile">
                        <img src="${review.avatar}" alt="${review.name}" class="lg-reviews__user-avatar ${avatarClass}" loading="lazy">
                        <div>
                            <h3 class="lg-reviews__user-name">${review.name}</h3>
                            <p class="lg-reviews__user-meta">${review.handle} <span>•</span> ${review.date}</p>
                        </div>
                        <div class="lg-reviews__user-tooltip">
                            <div class="lg-reviews__user-tooltip-content lg-reviews__glass-panel">
                                <i class="ph-fill ph-chart-line-up"></i>
                                <span>${review.userStats}</span>
                            </div>
                        </div>
                    </div>
                    ${
                        (() => {
                            const PROMPT_TRUNCATE_LENGTH = 150;
                            if (review.prompt.length > PROMPT_TRUNCATE_LENGTH) {
                                return `
                                    <p class="lg-reviews__item-prompt truncated">${review.prompt}</p>
                                    <button class="lg-reviews__see-all-btn" data-index="${index}">See all</button>
                                `;
                            }
                            return `<p class="lg-reviews__item-prompt">${review.prompt}</p>`;
                        })()
                    }
                    <div class="lg-reviews__item-actions">
                        <button class="lg-button lg-button--copy-prompt" data-index="${index}"><ion-icon name="copy-outline"></ion-icon> <span>Copy Prompt</span></button>
                        <button class="lg-button lg-button--generate"><ion-icon name="sparkles-outline"></ion-icon> <span>Generate</span></button>
                    </div>
                    <div class="lg-reviews__item-stars" title="${review.rating} out of 5 stars">${generateStars(review.rating)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // 3. INTERACTION LOGIC
    function updateShowcase(newIndex) {
        newIndex = parseInt(newIndex);
        if (newIndex === currentDataIndex || !reviewsData[newIndex]) return;
        
        const review = reviewsData[newIndex];
        const direction = newIndex > currentDataIndex ? 1 : -1; 
        
        const activeImg = document.getElementById(`lg-reviews-showcase-img-${currentImageLayer}`);
        const nextLayer = currentImageLayer === 0 ? 1 : 0;
        const nextImg = document.getElementById(`lg-reviews-showcase-img-${nextLayer}`);

        // Robustly get elements
        const serviceEl = document.getElementById('lg-reviews-showcase-service');
        const authorEl = document.getElementById('lg-reviews-showcase-author');
        const viewsEl = document.getElementById('lg-reviews-showcase-views');

        if (serviceEl) serviceEl.textContent = review.service;
        if (authorEl) authorEl.textContent = `Generated by ${review.handle}`;
        if (viewsEl) viewsEl.textContent = `${review.views} views`;

        if (!activeImg || !nextImg) return;

        nextImg.src = review.previewImage;
        
        // Snap next image into position without transition
        nextImg.style.transition = 'none';
        nextImg.style.transform = `translateY(${100 * direction}%)`;
        
        // Force reflow to apply the start position
        void nextImg.offsetWidth; 

        nextImg.style.transition = 'transform 1s cubic-bezier(0.64, 0.04, 0.35, 1)';
        activeImg.style.transition = 'transform 1s cubic-bezier(0.64, 0.04, 0.35, 1)';

        // Animate
        nextImg.style.transform = 'translateY(0)';
        activeImg.style.transform = `translateY(${-100 * direction}%)`;

        // Update state
        currentImageLayer = nextLayer;
        currentDataIndex = newIndex;
    }

    function initScrollObserver() {
        const reviewItems = document.querySelectorAll('.lg-reviews__item');
        if (reviewItems.length === 0) return;

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error("GSAP or ScrollTrigger is not loaded. Cannot animate .lg-reviews section.");
            return;
        }

        // Set up scroll-triggered animations for each review item
        reviewItems.forEach((item, index) => {
            ScrollTrigger.create({
                trigger: item,
                start: "top 55%",
                end: "bottom 45%",
                onToggle: self => {
                    if (self.isActive) {
                        // Deactivate all other reviews
                        reviewItems.forEach(r => {
                            r.classList.add('inactive');
                            r.querySelector('.lg-reviews__user-avatar')?.classList.add('grayscale');
                        });
                        
                        // Activate the current review
                        item.classList.remove('inactive');
                        item.querySelector('.lg-reviews__user-avatar')?.classList.remove('grayscale');

                        // Update the showcase image on the left
                        updateShowcase(index);
                    }
                }
            });
        });

        // Initialize the first review's visuals immediately on load
        if (reviewsData.length > 0) {
            const firstImg = document.getElementById('lg-reviews-showcase-img-0');
            if (firstImg) {
                firstImg.src = reviewsData[0].previewImage;
            }
            // Manually update the text for the first item without a full `updateShowcase` call
            // to avoid animation on page load.
            const serviceEl = document.getElementById('lg-reviews-showcase-service');
            const authorEl = document.getElementById('lg-reviews-showcase-author');
            const viewsEl = document.getElementById('lg-reviews-showcase-views');

            if (serviceEl) serviceEl.textContent = reviewsData[0].service;
            if (authorEl) authorEl.textContent = `Generated by ${reviewsData[0].handle}`;
            if (viewsEl) viewsEl.textContent = `${reviewsData[0].views} views`;
            currentDataIndex = 0; // Set initial index
        }
    }

    // 4. INITIALIZATION
    renderServicesStats();
    renderReviews();
    initScrollObserver();

    // 5. EVENT LISTENERS
    const reviewsList = document.getElementById('lg-reviews-list');
    if (reviewsList) {
        reviewsList.addEventListener('click', function(e) {
            const button = e.target.closest('.lg-button--copy-prompt');
            if (!button) return;

            const index = button.dataset.index;
            const promptText = reviewsData[index]?.prompt;

            if (promptText) {
                navigator.clipboard.writeText(promptText).then(() => {
                    const buttonSpan = button.querySelector('span');
                    if (buttonSpan) {
                        buttonSpan.textContent = 'Copied!';
                        button.querySelector('ion-icon').setAttribute('name', 'checkmark-outline');
                        setTimeout(() => {
                            buttonSpan.textContent = 'Copy Prompt';
                            button.querySelector('ion-icon').setAttribute('name', 'copy-outline');
                        }, 2000);
                    }
                }).catch(err => console.error('Failed to copy text: ', err));
            }
        });
    }

    // 6. FULL PROMPT MODAL LOGIC
    const fullPromptOverlay = document.getElementById('lg-full-prompt-overlay');
    const fullPromptTextEl = document.getElementById('lg-full-prompt-text');
    const fullPromptCloseBtn = document.getElementById('lg-full-prompt-close-btn');
    const fullPromptCopyBtn = document.getElementById('lg-full-prompt-copy-btn');

    if (fullPromptOverlay && reviewsList && fullPromptTextEl && fullPromptCloseBtn && fullPromptCopyBtn) {
        // Open modal
        reviewsList.addEventListener('click', function(e) {
            const seeAllBtn = e.target.closest('.lg-reviews__see-all-btn');
            if (!seeAllBtn) return;

            const index = seeAllBtn.dataset.index;
            const promptText = reviewsData[index]?.prompt;

            if (promptText) {
                fullPromptTextEl.textContent = promptText;
                fullPromptOverlay.classList.add('visible');
                if (window.lenis) window.lenis.stop();
            }
        });

        // Close modal
        const closeModal = () => {
            fullPromptOverlay.classList.remove('visible');
            if (window.lenis) window.lenis.start();
        };

        fullPromptCloseBtn.addEventListener('click', closeModal);
        fullPromptOverlay.addEventListener('click', function(e) {
            if (e.target === fullPromptOverlay) {
                closeModal();
            }
        });

        // Copy from modal
        fullPromptCopyBtn.addEventListener('click', function() {
            const promptText = fullPromptTextEl.textContent;
            navigator.clipboard.writeText(promptText).then(() => {
                const buttonSpan = fullPromptCopyBtn.querySelector('span');
                const icon = fullPromptCopyBtn.querySelector('ion-icon');
                buttonSpan.textContent = 'Copied!';
                icon.setAttribute('name', 'checkmark-outline');
                setTimeout(() => {
                    buttonSpan.textContent = 'Copy Prompt';
                    icon.setAttribute('name', 'copy-outline');
                }, 2000);
            });
        });
    }
});