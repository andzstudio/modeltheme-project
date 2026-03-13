/**
 * Handles the vertical infinite scroll gallery ("Community Showcase").
 * Assumes GSAP is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    const gallerySection = document.querySelector('.lg-gallery');
    if (!gallerySection) {
        return; // Don't run if the section isn't on the page
    }

    if (typeof gsap === 'undefined') {
        console.error("GSAP is not loaded. Cannot animate .lg-gallery section.");
        return;
    }

    // 1. Duplicate track content to create a seamless infinite loop
    const trackLeft = document.getElementById('lg-gallery-track-left');
    const trackRight = document.getElementById('lg-gallery-track-right');
    
    if (!trackLeft || !trackRight) {
        console.error("Gallery tracks not found.");
        return;
    }

    // Duplicate the HTML inside the tracks so they can scroll infinitely
    trackLeft.innerHTML += trackLeft.innerHTML;
    trackRight.innerHTML += trackRight.innerHTML;

    // 2. Setup Infinite GSAP Animations (Vertical Axis)
    
    // Left Track: Moves Up
    const tweenLeft = gsap.to(trackLeft, {
        yPercent: -50,
        ease: "none",
        duration: 45, // Base speed
        repeat: -1
    });

    // Right Track: Moves Down (Starts at -50% and moves to 0)
    const tweenRight = gsap.fromTo(trackRight, 
        { yPercent: -50 },
        { yPercent: 0, ease: "none", duration: 50, repeat: -1 }
    );

    // 3. Hover Interaction Logic
    const galleryItems = document.querySelectorAll('.lg-gallery__item');
    
    galleryItems.forEach(item => {
        // When mouse enters ANY image, slow down BOTH carousels
        item.addEventListener('mouseenter', () => {
            gsap.to([tweenLeft, tweenRight], {
                timeScale: 0.08, // Slows down to 8% of original speed
                duration: 0.8, // Smooth transition into slow motion
                ease: "power2.out"
            });
        });

        // When mouse leaves, return to normal speed
        item.addEventListener('mouseleave', () => {
            gsap.to([tweenLeft, tweenRight], {
                timeScale: 1, // Back to 100% speed
                duration: 0.8, // Smooth transition back to normal
                ease: "power2.out"
            });
        });
    });

    // 4. Entrance animation for the title
    // Use ScrollTrigger to only animate when it's in view
    gsap.from(".lg-gallery__title", {
        scrollTrigger: {
            trigger: gallerySection,
            start: "top 80%", // Start animation when 80% of the section is in view
            toggleActions: "play none none none"
        },
        scale: 0.95,
        opacity: 0,
        duration: 2,
        ease: "expo.out",
        delay: 0.2
    });

    // 5. Copy to Clipboard Functionality
    const gallery = document.querySelector('.lg-gallery');
    if (gallery) {
        gallery.addEventListener('click', function(e) {
            // Find the button that was clicked, if any
            const copyButton = e.target.closest('.lg-button--copy-prompt');
            if (!copyButton || copyButton.disabled) return;

            e.preventDefault(); // Prevent any default button behavior

            // Find the parent item and the prompt text
            const galleryItem = copyButton.closest('.lg-gallery__item');
            const promptEl = galleryItem.querySelector('.lg-gallery__item-prompt');
            const promptText = promptEl.textContent.trim();

            if (!promptText) return;

            // Use the Clipboard API
            navigator.clipboard.writeText(promptText).then(() => {
                // --- Success feedback ---
                const originalIcon = 'copy-outline';
                const buttonSpan = copyButton.querySelector('span');
                const buttonIcon = copyButton.querySelector('ion-icon');

                // Change to "Copied" state
                if (buttonSpan) buttonSpan.textContent = 'Copied!';
                if (buttonIcon) buttonIcon.setAttribute('name', 'checkmark-outline');
                copyButton.disabled = true;

                // Revert back after a delay
                setTimeout(() => {
                    if (buttonSpan) buttonSpan.textContent = 'Copy';
                    if (buttonIcon) buttonIcon.setAttribute('name', originalIcon);
                    copyButton.disabled = false;
                }, 2000);

            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }
});