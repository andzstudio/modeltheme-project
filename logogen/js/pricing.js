document.addEventListener('DOMContentLoaded', () => {
    const pricingSection = document.getElementById('pricing');
    if (!pricingSection) {
        return;
    }

    // --- 1. Entrance Animations ---
    const revealElements = document.querySelectorAll('.lg-pricing-reveal, .lg-pricing__bg-text');
    const revealOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            // Add a small delay for the background text for a more layered effect
            if (entry.target.classList.contains('lg-pricing__bg-text')) {
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }, 300);
            } else {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // --- 2. Smooth Billing Toggle Logic ---
    const billingToggle = document.getElementById('lg-pricing-billing-toggle');
    const priceElements = document.querySelectorAll('.lg-pricing-card__price[data-monthly]');
    const costPerLogoElements = document.querySelectorAll('.lg-pricing-card__price-per-logo');
    const labelMonthly = document.getElementById('lg-pricing-label-monthly');
    const labelAnnually = document.getElementById('lg-pricing-label-annually');

    if (billingToggle) {
        billingToggle.addEventListener('change', (e) => {
            const isYearly = e.target.checked;
            
            if(isYearly) {
                labelMonthly.classList.remove('is-active');
                labelAnnually.classList.add('is-active');
            } else {
                labelMonthly.classList.add('is-active');
                labelAnnually.classList.remove('is-active');
            }
            
            priceElements.forEach(priceEl => {
                const card = priceEl.closest('.lg-pricing-card');
                const billingEl = card.querySelector('.lg-pricing-card__price-billing');
                const costEl = card.querySelector('.lg-pricing-card__price-per-logo');
                const yearlyPrice = priceEl.dataset.yearly;

                priceEl.style.transform = 'translateY(-10px)';
                priceEl.style.opacity = '0';
                
                setTimeout(() => {
                    priceEl.textContent = isYearly ? priceEl.dataset.yearly : priceEl.dataset.monthly;
                    priceEl.style.transition = 'none';
                    priceEl.style.transform = 'translateY(10px)';
                    
                    void priceEl.offsetWidth;
                    
                    priceEl.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
                    priceEl.style.transform = 'translateY(0)';
                    priceEl.style.opacity = '1';
                }, 200); // Slightly faster for responsiveness

                // Update billing text
                if (billingEl) {
                    if (isYearly) {
                        const annualTotal = parseInt(yearlyPrice) * 12;
                        billingEl.textContent = `billed $${annualTotal} annually`;
                    } else {
                        billingEl.textContent = 'billed monthly, cancel anytime';
                    }

                    // Update cost-per-logo text
                    if (costEl) {
                        costEl.style.opacity = '0';
                        setTimeout(() => {
                            costEl.textContent = isYearly ? costEl.dataset.yearlyCost : costEl.dataset.monthlyCost;
                            costEl.style.opacity = '1';
                        }, 200);
                    }
                }
            });
        });
    }

    // --- 3. Feature List Toggle ---
    const featureToggleBtns = document.querySelectorAll('.lg-pricing-card__show-features-btn');
    featureToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.lg-pricing-card__features-wrapper');
            const collapsibleList = wrapper.querySelector('.lg-pricing-card__feature-list--collapsible');
            const btnText = btn.querySelector('span');
            const btnIcon = btn.querySelector('i');

            const isExpanded = collapsibleList.classList.toggle('is-expanded');
            
            if (isExpanded) {
                btnText.textContent = 'Show less features';
                btnIcon.className = 'ph ph-caret-up';
            } else {
                btnText.textContent = 'Show all features';
                btnIcon.className = 'ph ph-caret-down';
            }
        });
    });

    // --- 4. Card Spotlight Cursor Effect (with smooth interpolation) ---
    const cards = document.querySelectorAll('.lg-pricing-card');

    cards.forEach(card => {
        let animationFrameId = null;
        const data = {
            x: 0, y: 0,
            targetX: 0, targetY: 0,
            lerp: 0.1 // Controls the "lag" of the spotlight. Lower is slower.
        };

        const updateSpotlight = () => {
            // Interpolate the current position towards the target
            data.x += (data.targetX - data.x) * data.lerp;
            data.y += (data.targetY - data.y) * data.lerp;

            card.style.setProperty('--x', `${data.x}px`);
            card.style.setProperty('--y', `${data.y}px`);

            // Continue the loop if the spotlight hasn't caught up yet
            if (Math.abs(data.targetX - data.x) > 0.1 || Math.abs(data.targetY - data.y) > 0.1) {
                animationFrameId = requestAnimationFrame(updateSpotlight);
            } else {
                // Stop the loop when the spotlight is at the target to save performance
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            data.targetX = e.clientX - rect.left;
            data.targetY = e.clientY - rect.top;

            // Start the animation loop if it's not already running
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(updateSpotlight);
            }
        });
    });

    // --- 5. Background Text Spotlight Effect ---
    const bgText = document.querySelector('.lg-pricing__bg-text');
    if (bgText) {
        let bgAnimationId = null;
        const bgData = {
            x: 0, y: 0,
            targetX: 0, targetY: 0,
            lerp: 0.05 // Slower lerp for a more subtle, "drifting" effect
        };

        const updateBgSpotlight = () => {
            bgData.x += (bgData.targetX - bgData.x) * bgData.lerp;
            bgData.y += (bgData.targetY - bgData.y) * bgData.lerp;

            bgText.style.setProperty('--spotlight-x', `${bgData.x}px`);
            bgText.style.setProperty('--spotlight-y', `${bgData.y}px`);

            if (Math.abs(bgData.targetX - bgData.x) > 0.1 || Math.abs(bgData.targetY - bgData.y) > 0.1) {
                bgAnimationId = requestAnimationFrame(updateBgSpotlight);
            } else {
                cancelAnimationFrame(bgAnimationId);
                bgAnimationId = null;
            }
        };

        pricingSection.addEventListener('mousemove', (e) => {
            const rect = pricingSection.getBoundingClientRect();
            bgData.targetX = e.clientX - rect.left;
            bgData.targetY = e.clientY - rect.top;

            if (!bgAnimationId) {
                bgAnimationId = requestAnimationFrame(updateBgSpotlight);
            }
        });
    }
});