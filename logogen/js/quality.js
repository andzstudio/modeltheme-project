/**
 * Handles the scroll-based animations for the "Why LogoGEN" section.
 * This script assumes GSAP, ScrollTrigger, and a global Lenis instance are already loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Pre-computation checks
    const whySection = document.querySelector('.lg-why-section');
    if (!whySection) {
        return; // Don't run if the section isn't on the page
    }

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger is not loaded. Cannot animate .lg-why-section.");
        return;
    }

    // It's assumed Lenis is initialized globally (e.g., in app.js) and handles
    // the requestAnimationFrame loop and ScrollTrigger.update().

    // 2. Register GSAP Plugin
    gsap.registerPlugin(ScrollTrigger);

    // 3. Set initial state
    gsap.set('.lg-why-title', { xPercent: -50, yPercent: -50 });

    // 4. Calculate dynamic scroll distance
    const cards = gsap.utils.toArray('.lg-why-card');
    // The scroll duration was hardcoded to 400%, making it feel too long.
    // This now calculates the duration based on the number of cards and a multiplier,
    // ensuring the scroll length is "exactly as needed". 
    // USER FEEDBACK: The animation felt too fast. Increasing the multiplier from 25 back to 75
    // will require more scrolling from the user to advance the animation, making it feel
    // smoother and more controlled, as requested.
    const scrollMultiplier = 75; // 75% of viewport height per second of animation.
    const lastCardTimeOffset = cards.length > 1 ? (cards.length - 1) * 1.5 : 0.8;
    const totalAnimationDuration = lastCardTimeOffset + 1.5; // Add the duration of the last animation.
    const endScroll = `+=${totalAnimationDuration * scrollMultiplier}%`;

    // 4. Create the main timeline
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.lg-why-section',
            start: 'top top',
            end: endScroll, // Use the calculated, "perfect" scroll distance
            scrub: 1,      
            pin: true      
        }
    });

    // Animation Step A: Animate title to the top-center
    tl.to('.lg-why-title', {
        top: '7.5vh',
        left: '69%',
        xPercent: -50,
        yPercent: 0,
        scale: 0.3,
        duration: 1,
        ease: 'power3.inOut'
    }, 0); // Start at time 0

    cards.forEach((card, index) => {
        // Stagger the start time of each card animation
        const timeOffset = index === 0 ? 0.8 : index * 1.5;

        // Animate the current card into the center view
        tl.to(card, {
            x: '0vw',
            duration: 1.5,
            ease: 'power3.out'
        }, timeOffset);

        // For subsequent cards, animate the previous cards to a "stack" on the left
        if (index > 0) {
            for (let i = 0; i < index; i++) {
                tl.to(cards[i], {
                    scale: 1 - ((index - i) * 0.08),    // Cards get smaller faster
                    opacity: 1 - ((index - i) * 0.3),  
                    x: `-${(index - i) * 3}vw`,
                    y: `${(index - i) * 3}vh`,          // Pushed down slightly
                    duration: 1.5,
                    ease: 'power3.out' // Adăugat pentru consistența animației
                }, timeOffset); 
            }
        }
    });
});