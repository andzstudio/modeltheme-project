/**
 * AI Tools 3D Carousel Logic
 * Architect: Staff Frontend Engineer
 */
class AIToolsCarousel {
    constructor() {
        this.track = document.getElementById('aiToolsTrack');
        if (!this.track) return;

        this.cards = Array.from(this.track.querySelectorAll('.ai-tools-card'));
        this.btnPrev = document.querySelector('.ai-tools-nav-btn.prev');
        this.btnNext = document.querySelector('.ai-tools-nav-btn.next');
        
        this.totalCards = this.cards.length;
        this.currentIndex = 0; // Focus on the first card initially

        this.init();
    }

    init() {
        this.updateCarousel();
        this.bindEvents();
    }

    bindEvents() {
        // Navigation buttons
        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', () => this.navigate(-1));
        }
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => this.navigate(1));
        }

        // Direct card click (brings side cards to center)
        this.cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (this.currentIndex !== index) {
                    this.currentIndex = index;
                    this.updateCarousel();
                }
            });
        });
    }

    navigate(direction) {
        // Handle infinite wrap-around safely
        this.currentIndex = (this.currentIndex + direction + this.totalCards) % this.totalCards;
        this.updateCarousel();
    }

    updateCarousel() {
        // Reset all classes
        this.cards.forEach(card => {
            card.className = 'ai-tools-card'; 
        });

        // Calculăm indicii pentru pozițiile vizibile pe baza indexului curent
        const activeIdx = this.currentIndex;
        const prev1Idx = (activeIdx - 1 + this.totalCards) % this.totalCards;
        const prev2Idx = (activeIdx - 2 + this.totalCards) % this.totalCards;
        const next1Idx = (activeIdx + 1) % this.totalCards;
        const next2Idx = (activeIdx + 2) % this.totalCards;

        // Atribuim clasele corespunzătoare pentru efectul 3D
        this.cards[activeIdx].classList.add('active');
        this.cards[prev1Idx].classList.add('prev-1');
        this.cards[next1Idx].classList.add('next-1');
        this.cards[prev2Idx].classList.add('prev-2');
        this.cards[next2Idx].classList.add('next-2');
    }
}

// Initialize on DOM Ready to ensure assets are parsed
document.addEventListener('DOMContentLoaded', () => {
    new AIToolsCarousel();
});