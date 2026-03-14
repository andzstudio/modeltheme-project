document.addEventListener('DOMContentLoaded', () => {
    class ServicesApplication {
        constructor() {
            this.section = document.getElementById('services');
            if (!this.section) return;

            this.cards = this.section.querySelectorAll('.lg-services-accordion-card');
            this.isDesktop = window.innerWidth >= 768;
            
            this.initGSAP();
            this.initHoverAccordion();
            
            window.addEventListener('resize', () => { this.isDesktop = window.innerWidth >= 768; });
        }

        initGSAP() {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                console.error("GSAP or ScrollTrigger not loaded for Services section.");
                return;
            }
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: this.section,
                    start: "top 70%",
                    toggleActions: "play none none none",
                },
                defaults: { ease: "power3.out" }
            });

            tl.fromTo(".lg-services-gs-reveal",
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 1 }
            )
            .fromTo(".lg-services-gs-card", 
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 },
                "-=0.5"
            );
        }

        initHoverAccordion() {
            this.cards.forEach((card) => {

                // --- HOVER LOGIC (FLEX EXPANSION) ---
                card.addEventListener('mouseenter', () => {
                    if (!this.isDesktop) return;

                    card.classList.add('is-expanded');
                    card.classList.remove('is-shrunk');

                    this.cards.forEach(c => {
                        if (c !== card) {
                            c.classList.remove('is-expanded');
                            c.classList.add('is-shrunk');
                        }
                    });
                });

                card.addEventListener('mouseleave', () => {
                    if (!this.isDesktop) return;

                    this.cards.forEach(c => {
                        c.classList.remove('is-expanded');
                        c.classList.remove('is-shrunk');
                    });

                    card.style.setProperty('--pos', `50%`);
                });

                // --- MOUSE FOLLOW LOGIC (ZERO-CLICK SLIDER) ---
                let rafId = null;
                
                const updatePosition = (clientX) => {
                    const rect = card.getBoundingClientRect();
                    let xPos = clientX - rect.left;
                    xPos = Math.max(0, Math.min(xPos, rect.width));
                    const percentage = (xPos / rect.width) * 100;
                    card.style.setProperty('--pos', `${percentage}%`);
                };

                card.addEventListener('mousemove', (e) => {
                    if (!this.isDesktop) return;

                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        updatePosition(e.clientX);
                    });
                });
                
                // --- MOBILE FALLBACK (TOUCH DRAG) ---
                let isDragging = false;
                card.addEventListener('touchstart', (e) => {
                    if (this.isDesktop) return;
                    isDragging = true;
                    updatePosition(e.touches[0].clientX);
                }, { passive: true });

                card.addEventListener('touchmove', (e) => {
                    if (this.isDesktop || !isDragging) return;
                    e.preventDefault(); 
                    updatePosition(e.touches[0].clientX);
                }, { passive: false });

                card.addEventListener('touchend', () => {
                    isDragging = false;
                });
            });
        }
    }

    new ServicesApplication();
});