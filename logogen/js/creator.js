$(document).ready(function() {
    if (typeof gsap === 'undefined') {
        console.error("GSAP is not loaded.");
        return;
    }

    // --- MODAL INJECTION ---
    // The HTML for the 'Continue Session' and 'Exit' modals was missing, causing
    // errors when trying to display them. This injects the required HTML into the DOM
    // on page load, ensuring the elements are available for the script.
    const continueModalHtml = `
        <div class="lg-continue-modal-overlay" id="lg-continue-overlay" style="opacity: 0; visibility: hidden;">
            <div class="lg-continue-modal" id="lg-continue-modal" style="opacity: 0; transform: scale(0.95) translateY(10px);">
                <h3 class="lg-continue-modal__title">Resume Session?</h3>
                <p class="lg-continue-modal__desc">You have an unfinished logo session. Would you like to continue where you left off?</p>
                <div class="lg-continue-modal__actions">
                    <button class="lg-button lg-button--secondary" id="lg-continue-new">Start New</button>
                    <button class="lg-button lg-button--primary" id="lg-continue-resume">Resume Session</button>
                </div>
            </div>
        </div>
    `;

    const exitConfirmModalHtml = `
        <div class="lg-confirm-modal-overlay" id="lg-exit-confirm-overlay" style="opacity: 0; visibility: hidden;">
            <div class="lg-confirm-modal" id="lg-exit-confirm-modal" style="opacity: 0; transform: scale(0.95) translateY(10px);">
                <h3 class="lg-confirm-modal__title">Exit Creator?</h3>
                <p class="lg-confirm-modal__desc">Are you sure you want to exit? Your progress will be saved.</p>
                <div class="lg-confirm-modal__actions">
                    <button class="lg-button lg-button--secondary" id="lg-exit-stay">Stay</button>
                    <button class="lg-button lg-button--primary" id="lg-exit-confirm">Exit</button>
                </div>
            </div>
        </div>
    `;
    $('body').append(continueModalHtml).append(exitConfirmModalHtml);

    // --- UTILITIES ---
    const LocalState = {
        save: (state) => {
            try {
                localStorage.setItem('logogen_creator_state', JSON.stringify(state));
            } catch (e) {
                console.error("Could not save state to localStorage", e);
            }
        },
        load: () => {
            try {
                return JSON.parse(localStorage.getItem('logogen_creator_state'));
            } catch (e) {
                console.error("Could not load state from localStorage", e);
                return null;
            }
        },
        clear: () => localStorage.removeItem('logogen_creator_state'),
        exists: () => localStorage.getItem('logogen_creator_state') !== null
    };

    let state = {
        brandName: '',
        colors: [],
        colorSelectionType: '',
        industry: '',
        style: '', // NEW: for Logo Style (single selection)
        font: '',
        currentStep: 0,
        maxStepReached: 0,
    };

    // --- PREMIUM GRADIENT GENERATOR ---
    function applyPremiumGradient($circle, color) {
        if (!$circle || !color) return;
        const tColor = tinycolor(color);

        // Premium gradient for all displays
        const c1 = tColor.clone().lighten(15).spin(-10).toString();
        const c2 = color;
        const c3 = tColor.clone().darken(10).spin(10).toString();
        
        $circle.css({
            'background': `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
            'box-shadow': `0 12px 24px -6px ${tColor.setAlpha(0.5).toRgbString()}, inset 0 2px 4px rgba(255,255,255,0.4)`
        });

        $circle.find('ion-icon').hide();
        $circle.find('input[type="color"]').val(color);
        if (!$circle.find('input').length) {
            $circle.text('');
        }
    }

    // --- GLOBAL COLOR CALLBACKS ---
    function previewColorCallback(color, circleElement) {
        if (!circleElement) return;
        applyPremiumGradient($(circleElement), color);
    }

    function applyColorCallback(color, circleElement) {
        if (!circleElement) return;
        const $circle = $(circleElement);
        const $wrapper = $circle.closest('.lg-color-circle-wrapper');
        const index = $wrapper.data('color-index');
        
        if (color === 'CLEAR') {
            // When user starts customizing, deselect predefined palettes
            $('.lg-palette-card').removeClass('selected');

            state.colorSelectionType = 'selective';
            state.colors[index] = null;
            LocalState.save(state);
            
            $circle.css({ 'background': '', 'box-shadow': '' });
            $circle.find('ion-icon').show();
            $circle.find('input[type="color"]').val('#ffffff');
            $wrapper.find('.lg-color-hex-label').removeClass('visible').text('HEX');
            
            $('.lg-color-card').css('border-color', 'rgba(255, 255, 255, 0.1)');
            $('#color-continue').prop('disabled', false); 
            $wrapper.closest('.lg-color-card').css('border-color', 'var(--color-primary)');
            
            return;
        }
        
        // When user starts customizing, deselect predefined palettes
        $('.lg-palette-card').removeClass('selected');

        state.colorSelectionType = 'selective';
        state.colors[index] = color;
        LocalState.save(state);
        
        applyPremiumGradient($circle, color);
        
        // Update Hex Label
        $wrapper.find('.lg-color-hex-label').addClass('visible').text(color.toUpperCase());
        
        $('.lg-color-card').css('border-color', 'rgba(255, 255, 255, 0.1)');
        $('#color-continue').prop('disabled', false);
        $wrapper.closest('.lg-color-card').css('border-color', 'var(--color-primary)');
    }


    // --- CUSTOM COLOR PICKER MODULE ---
    const CustomColorPicker = {
        popover: null,
        wheelCanvas: null, ctxWheel: null,
        sliderCanvas: null, ctxSlider: null,
        indicator: null, hexInput: null,
        isDragging: false, // NEW: Flag for dragging the whole popover
        dragStartX: 0,
        dragStartY: 0,
        popoverStartX: 0,
        popoverStartY: 0,
        activeCircle: null,
        onPreview: null, onApply: null,
        size: 248, 

        init(selector, onPreviewCallback, onApplyCallback) {
            this.popover = $(selector);
            this.onPreview = onPreviewCallback;
            this.onApply = onApplyCallback;

            const pickerHtml = `
                <div class="lg-color-picker__header">
                    <h5 class="lg-color-picker__title">Select Color</h5>
                    <button class="lg-color-picker__close-btn" id="lg-color-picker-close"><ion-icon name="close-outline"></ion-icon></button>
                </div>
                <div class="lg-color-picker__main">
                    <canvas id="lg-color-picker-wheel" class="lg-color-picker__wheel" width="${this.size}" height="${this.size}"></canvas>
                    <div class="lg-color-picker__wheel-indicator"></div>
                </div>
                <div class="lg-color-picker__slider-wrapper">
                    <canvas id="lg-color-picker-slider" class="lg-color-picker__slider" width="${this.size}" height="15"></canvas>
                    <div class="lg-color-picker__slider-indicator"></div>
                </div>
                <div class="lg-color-picker__hex-wrapper">
                    <span>#</span>
                    <input type="text" id="lg-color-picker-hex" class="lg-color-picker__hex-input" maxlength="6" />
                </div>
                <div class="lg-color-picker__actions">
                    <button class="lg-button lg-button--secondary" id="lg-color-picker-reset">Reset</button>
                    <button class="lg-button lg-button--primary" id="lg-color-picker-apply">Apply</button>
                </div>
            `;
            this.popover.html(pickerHtml);

            this.wheelCanvas = document.getElementById('lg-color-picker-wheel');
            this.ctxWheel = this.wheelCanvas.getContext('2d');
            this.sliderCanvas = document.getElementById('lg-color-picker-slider');
            this.ctxSlider = this.sliderCanvas.getContext('2d');
            this.indicator = this.popover.find('.lg-color-picker__wheel-indicator');
            this.sliderIndicator = this.popover.find('.lg-color-picker__slider-indicator');
            this.hexInput = this.popover.find('#lg-color-picker-hex');

            this.drawWheel();
            this.drawSlider();

            // Event Listeners
            this.popover.on('mousedown', '.lg-color-picker__header', this.handlePopoverDragStart.bind(this));
            this.popover.on('click', '#lg-color-picker-close', () => this.cancel());
            this.popover.on('click', '#lg-color-picker-apply', () => this.apply());
            this.popover.on('click', '#lg-color-picker-reset', () => this.reset());
            this.wheelCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.sliderCanvas.addEventListener('mousedown', this.handleSliderDown.bind(this));
            
            // Hex Input Two-Way Binding
            this.hexInput.on('input', (e) => {
                let val = e.target.value.trim();
                if (val.length === 6 || val.length === 3) {
                    const color = tinycolor(val);
                    if (color.isValid()) {
                        this.hue = color.toHsv().h;
                        this.drawWheel();
                        this.updateUI(color, false); // false to avoid recursive input update
                    }
                }
            });
        },

        drawWheel() {
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    const s = x / this.size;
                    const v = 1 - (y / this.size);
                    const h = this.hue || 0;
                    this.ctxWheel.fillStyle = tinycolor({ h, s, v }).toHexString();
                    this.ctxWheel.fillRect(x, y, 1, 1);
                }
            }
        },

        drawSlider() {
            const gradient = this.ctxSlider.createLinearGradient(0, 0, this.size, 0);
            for (let i = 0; i <= 360; i += 60) {
                gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
            }
            this.ctxSlider.fillStyle = gradient;
            this.ctxSlider.fillRect(0, 0, this.size, 15);
        },

        open(targetCircle) {
            this.activeCircle = targetCircle;
            const $circle = $(targetCircle);
            
            this.wasEmpty = $circle.find('ion-icon').css('display') !== 'none';
            this.initialColor = $circle.find('input[type="color"]').val() || '#ffffff';
            this.tempColor = this.initialColor;
            
            const rect = targetCircle.getBoundingClientRect();
            const popoverWidth = this.popover.outerWidth() || this.size + 32; 
            const windowWidth = window.innerWidth;

            let newLeft = rect.right + 50; 
            let newTop = rect.top - 90;
            let origin = 'top left';

            if (newLeft + popoverWidth > windowWidth - 20) {
                newLeft = rect.left - popoverWidth - 50;
                origin = 'top right'; 
            }
            if (newTop < 10) {
                newTop = 10;
            }

            gsap.set(this.popover, { top: newTop, left: newLeft, transformOrigin: origin });
            this.popover.addClass('visible');

            const color = tinycolor(this.initialColor);
            const { h } = color.toHsv();
            if (this.hue !== h) {
                this.hue = h;
                this.drawWheel();
            }
            this.updateUI(color);
        },

        close(revert = true) {
            if (revert && this.onApply) {
                if (this.wasEmpty) {
                    this.onApply('CLEAR', this.activeCircle);
                } else {
                    this.onApply(this.initialColor, this.activeCircle);
                }
            }
            this.popover.removeClass('visible');
            this.activeCircle = null;
        },

        apply() {
            if (this.onApply) {
                this.onApply(this.tempColor, this.activeCircle);
            }
            this.close(false); 
        },

        reset() {
            const whiteColor = tinycolor('#ffffff');
            this.hue = 0; 
            this.drawWheel();
            this.tempColor = '#ffffff';

            gsap.to(this.indicator, { left: 0, top: 0, background: '#ffffff', duration: 0.3, ease: 'power2.out' });
            gsap.to(this.sliderIndicator, { left: 0, duration: 0.3, ease: 'power2.out' });
            this.hexInput.val('ffffff');

            if (this.onApply) {
                this.onApply('CLEAR', this.activeCircle);
            }
        },

        cancel() {
            this.close(true); 
        },

        updateUI(color, updateInput = true) {
            const { h, s, v } = color.toHsv();
            const x = s * this.size;
            const y = (1 - v) * this.size;
            const hexColor = color.toHexString();

            this.tempColor = hexColor;

            gsap.set(this.indicator, { left: x, top: y, background: hexColor });

            const hueX = (h / 360) * this.size;
            gsap.set(this.sliderIndicator, { left: hueX });
            
            if(updateInput) {
                this.hexInput.val(hexColor.replace('#', '').toUpperCase());
            }

            if (this.onPreview) {
                this.onPreview(hexColor, this.activeCircle);
            }
        },

        handlePopoverDragStart(e) {
            // Prevent dragging if the target is a button
            if ($(e.target).is('button, ion-icon')) {
                return;
            }
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            const popoverPosition = this.popover.position();
            this.popoverStartX = popoverPosition.left;
            this.popoverStartY = popoverPosition.top;

            const onMouseMove = (moveEvent) => this.handlePopoverDragMove(moveEvent);
            const onMouseUp = () => {
                this.isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },

        handlePopoverDragMove(e) {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            gsap.set(this.popover, { left: this.popoverStartX + dx, top: this.popoverStartY + dy });
        },

        handleMouseDown(e) {
            e.preventDefault();
            this.isDraggingWheel = true;
            this.updateFromWheel(e);
            const onMouseMove = (moveEvent) => this.updateFromWheel(moveEvent);
            const onMouseUp = () => { this.isDraggingWheel = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },

        updateFromWheel(e) {
            if (!this.isDraggingWheel) return;
            const rect = this.wheelCanvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            x = Math.max(0, Math.min(this.size, x));
            y = Math.max(0, Math.min(this.size, y));

            const s = x / this.size;
            const v = 1 - (y / this.size);
            const newColor = tinycolor({ h: this.hue, s, v });

            this.updateUI(newColor);
        },

        handleSliderDown(e) {
            e.preventDefault();
            this.isDraggingSlider = true;
            this.updateFromSlider(e);
            const onMouseMove = (moveEvent) => this.updateFromSlider(moveEvent);
            const onMouseUp = () => { this.isDraggingSlider = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },

        updateFromSlider(e) {
            if (!this.isDraggingSlider) return;
            const rect = this.sliderCanvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(this.size, x));

            const newHue = (x / this.size) * 360;

            if (Math.abs(newHue - (this.hue || 0)) > 0.5) {
                this.hue = newHue;
                this.drawWheel();
            }

            const indicatorPos = { x: parseFloat(this.indicator.css('left')), y: parseFloat(this.indicator.css('top')) };
            const s = indicatorPos.x / this.size;
            const v = 1 - (indicatorPos.y / this.size);
            const newColor = tinycolor({ h: newHue, s, v });

            this.updateUI(newColor);
        }
    };

    const steps = [
        { id: 'color', build: buildStepColor },
        { id: 'industry', build: buildStepIndustry },
        { id: 'style', build: buildStepStyle }, // NEW
        { id: 'font', build: buildStepFont },
    ];

    const $flowContainer = $('#lg-creator-flow');

    function goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        const previousStepIndex = state.currentStep > 0 ? state.currentStep - 1 : -1; // This is 0-based
        const currentStepId = previousStepIndex !== -1 ? `#lg-step-${steps[previousStepIndex].id}` : null;
        const nextStepId = `#lg-step-${steps[stepIndex].id}`;
        const nextStepInfo = steps[stepIndex];

        $('#lg-creator-back').css('visibility', stepIndex > 0 ? 'visible' : 'hidden');

        const direction = stepIndex > previousStepIndex ? 'forward' : 'backward';
        
        state.currentStep = stepIndex + 1;
        state.maxStepReached = Math.max(state.maxStepReached, state.currentStep);

        const y_out = direction === 'forward' ? -30 : 30;
        const y_in_start = direction === 'forward' ? 30 : -30;

        const tl = gsap.timeline({
            onComplete: () => {
                if (nextStepInfo.id === 'industry' && state.industry) {
                    $(`#lg-step-industry .lg-selection-card[data-value="${state.industry}"]`).addClass('selected');
                    $('#industry-continue').prop('disabled', false).removeClass('loading');
                }
                if (nextStepInfo.id === 'style' && state.style) {
                    $(`#lg-step-style .lg-selection-card[data-value="${state.style}"]`).addClass('selected');
                    $('#style-continue').prop('disabled', false).removeClass('loading');
                }
                if (nextStepInfo.id === 'font' && state.font) {
                    $(`#lg-step-font .lg-selection-card[data-value="${state.font}"]`).addClass('selected');
                    $('#font-generate').prop('disabled', false).removeClass('loading');
                }
                if (nextStepInfo.id === 'color' && state.colors.length > 0) {
                    $('#color-continue').prop('disabled', false).removeClass('loading');
                    
                    // Always update the editor/selective display
                    updateColorCircles($('#selective-color-display'), state.colors, true);

                    if (state.colorSelectionType === 'predefined') {
                        const colorsStr = state.colors.join(',');
                        // Find the card with the matching colors and select it
                        $(`.lg-palette-card[data-colors="${colorsStr}"]`).addClass('selected');
                    }
                    // No special UI for 'random' or 'selective' needed, as the editor is the source of truth.
                }
            }
        });

        if (direction === 'forward') {
            const titleChars = splitTextIntoChars(`${nextStepId} .lg-step-title`);
            if (titleChars) {
                tl.from(titleChars, { yPercent: 110, stagger: 0.03, duration: 0.6, ease: 'power2.out' }, "-=0.4");
            }
        }

        if (currentStepId) {
            tl.to(currentStepId, { autoAlpha: 0, y: y_out, duration: 0.4, ease: 'power2.in' });
        }

        gsap.set(nextStepId, { y: y_in_start, autoAlpha: 0 });

        if (direction === 'forward' && (nextStepInfo.id === 'industry' || nextStepInfo.id === 'font')) {
            gsap.set(`${nextStepId} .lg-selection-card`, { autoAlpha: 0, y: 20 });
        }
        // NEW: Reveal animation for color palette cards
        if (direction === 'forward' && nextStepInfo.id === 'color') {
            gsap.set(`${nextStepId} .lg-palette-card`, { autoAlpha: 0, y: 20 });
        }

        tl.to(nextStepId, { 
            autoAlpha: 1, 
            y: 0, 
            duration: 0.5, 
            ease: 'power2.out'
        }, currentStepId ? '>-=0.2' : '>');

        if (direction === 'forward' && (nextStepInfo.id === 'industry' || nextStepInfo.id === 'font')) {
            tl.to(`${nextStepId} .lg-selection-card`, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out' }, '-=0.3');
        }
        // NEW: Reveal animation for color palette cards
        if (direction === 'forward' && nextStepInfo.id === 'color') {
            tl.to(`${nextStepId} .lg-palette-card`, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, '-=0.3');
        }
    }

    function initCreator(resume = false) {
        if (window.lenis) window.lenis.stop();

        if (resume) {
            const savedState = LocalState.load();
            if (savedState) {
                state = savedState;
            }
        } else {
            // Starting a new flow, preserve brandName set from hero
            const brandName = state.brandName;
            state = { brandName: brandName, colors: [], colorSelectionType: '', industry: '', style: '', font: '', currentStep: 0, maxStepReached: 0 };
            LocalState.save(state); // Save the initial state with the brand name
        }
        
        $('body').addClass('creator-active');

        const tl = gsap.timeline();
        tl.to('#lg-hero-content', { duration: 0.8, y: -50, autoAlpha: 0, ease: 'power3.inOut' })
          .to('.lg-hero__background', { duration: 0.8, autoAlpha: 0, ease: 'power3.inOut' }, '-=0.5')
          .to($flowContainer, { duration: 0.5, autoAlpha: 1 }, '-=0.3')
          .add(() => goToStep(resume ? state.currentStep - 1 : 0));
    }

    function exitCreator() {
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true }); 
            window.lenis.start();
        }

        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 100);
            }
        });

        tl.to($flowContainer, { duration: 0.5, autoAlpha: 0, ease: 'power2.in' })
          .add(() => $('body').removeClass('creator-active'))
          .fromTo('#lg-hero-content',
              { y: -50, autoAlpha: 0 }, // Explicitly start from the hidden state
              {
                duration: 0.8,
                y: 0,
                autoAlpha: 1,
                ease: 'power3.out',
                clearProps: 'all' // Return control to CSS after animation
              },
              '>-=0.3' // Start this animation slightly earlier for a smoother overlap
          )
          .to('.lg-hero__background', { duration: 0.8, autoAlpha: 1, ease: 'power3.out' }, '<');
    }
    let modalTrigger = null; 

    // NEW: Handlers for the hero brand input, which is now the primary way to start
    function handleStartAttempt() {
        const brandName = $('#lg-hero-brand-input').val().trim();
        if (brandName) {
            state.brandName = brandName;
            initCreator(false);
        } else {
            gsap.fromTo('.lg-hero-brand-input__wrapper', { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, clearProps: 'x' });
        }
    }

    $('body').on('click', '#lg-hero-brand-submit', handleStartAttempt);
    $('body').on('keypress', '#lg-hero-brand-input', function(e) {
        if (e.which === 13) {
            handleStartAttempt();
        }
    });

    // The navbar button now primarily handles resuming or prompting the user
    $('#lg-navbar-start-btn').on('click', function(e) {
        e.preventDefault();
        if (LocalState.exists()) {
            const overlay = $('#lg-continue-overlay');
            const modal = $('#lg-continue-modal');
            gsap.to(overlay, { autoAlpha: 1, duration: 0.3 });
            gsap.to(modal, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' });
            modalTrigger = this;
            $('#lg-continue-resume').focus();
        } else {
            // If no session, prompt user to enter a name in the hero
            window.lenis.scrollTo('#lg-hero-brand-input', {
                offset: -200,
                duration: 1.2,
                easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                onComplete: () => {
                    $('#lg-hero-brand-input').focus();
                    gsap.fromTo($('.lg-hero-brand-input__wrapper'), 
                        { scale: 1.05, 'box-shadow': '0 0 25px rgba(192, 255, 0, 0.3)' }, 
                        { scale: 1, 'box-shadow': '0 0 0 rgba(192, 255, 0, 0)', duration: 1.5, ease: 'elastic.out(1, 0.4)' }
                    );
                }
            });
        }
    });

    $('#lg-continue-new').on('click', function() {
        LocalState.clear();
        const overlay = $('#lg-continue-overlay');
        const modal = $('#lg-continue-modal');
        gsap.to(modal, { autoAlpha: 0, y: 10, scale: 0.95, duration: 0.3, ease: 'power2.in' });
        gsap.to(overlay, { autoAlpha: 0, duration: 0.4, delay: 0.1, onComplete: () => {
            if (modalTrigger) $(modalTrigger).focus();
            $('#lg-hero-brand-input').val('').focus();
        }});
    });

    $('#lg-continue-resume').on('click', function() {
        const overlay = $('#lg-continue-overlay');
        const modal = $('#lg-continue-modal');
        gsap.to(modal, { autoAlpha: 0, y: 10, scale: 0.95, duration: 0.3, ease: 'power2.in' });
        gsap.to(overlay, { autoAlpha: 0, duration: 0.4, delay: 0.1, onComplete: () => initCreator(true) });
    });

    steps.forEach(step => step.build());

    CustomColorPicker.init('#lg-color-picker', previewColorCallback, applyColorCallback);

    $flowContainer.on('click', '#lg-creator-cancel', function() {
        const overlay = $('#lg-exit-confirm-overlay');
        const modal = $('#lg-exit-confirm-modal');
        modalTrigger = this;
        gsap.to(overlay, { autoAlpha: 1, duration: 0.3 });
        gsap.to(modal, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out', onComplete: () => {
            $('#lg-exit-stay').focus();
        }});
    });

    $('#lg-creator-back').on('click', function() {
        goToStep(state.currentStep - 2);
    });

    function hideExitConfirmModal() {
        const overlay = $('#lg-exit-confirm-overlay');
        const modal = $('#lg-exit-confirm-modal');
        gsap.to(modal, { autoAlpha: 0, y: 10, scale: 0.95, duration: 0.3, ease: 'power2.in' });
        gsap.to(overlay, { autoAlpha: 0, duration: 0.4, delay: 0.1, onComplete: () => {
            if (modalTrigger) $(modalTrigger).focus();
        }});
    }

    $('#lg-exit-stay').on('click', hideExitConfirmModal);

    $('#lg-exit-confirm').on('click', function() {
        hideExitConfirmModal();
        setTimeout(exitCreator, 300);
    });

    function splitTextIntoChars(selector) {
        const element = $(selector)[0];
        if (!element) return null;

        const existingChars = $(element).find('.char');
        if (existingChars.length > 0) {
            return existingChars;
        }

        const text = $(element).text(); 
        if (!text.trim()) return null; 

        element.innerHTML = text.split('').map(char => `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
        return $(element).find('.char');
    }

    // --- STEP BUILDERS ---

    function buildStepColor() {
        const predefinedPalettes = [
            { name: 'Cyber Neon', colors: ['#5B5FEF', '#8B5CF6', '#22D3EE'] },
            { name: 'Sunset Glow', colors: ['#2563EB', '#7C3AED', '#F472B6'] },
            { name: 'Tropical Wave', colors: ['#00F5D4', '#4361EE', '#7209B7'] },
            { name: 'Sky High', colors: ['#A78BFA', '#38BDF8', '#34D399'] },
            { name: 'Bold Fusion', colors: ['#FF6B6B', '#F59E0B', '#6366F1'] },
            { name: 'Cosmic Dark', colors: ['#4C1D95', '#7C3AED', '#06B6D4'] }
        ];
    
        let paletteCardsHtml = predefinedPalettes.map(palette => {
            const dataColors = palette.colors.join(',');
            const swatchesHtml = palette.colors.map(color => `<div class="lg-color-circle" data-color="${color}"></div>`).join('');
            return `
                <div class="lg-palette-card" data-colors="${dataColors}">
                    <div class="lg-palette-card__swatches">
                        ${swatchesHtml}
                    </div>
                    <div class="lg-palette-card__name">${palette.name}</div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="lg-creator-step" id="lg-step-color">
                <div class="lg-step-content" data-step="color">
                    <div class="lg-step-header">
                        <h2 class="lg-step-title">Choose a Color Palette</h2>
                        <p class="lg-step-desc">Select a starting point for your brand's colors, or create your own below.</p>
                    </div>
                    
                    <div class="lg-color-layout">
                        <div class="lg-color-layout__primary">
                            <div class="lg-palette-grid">
                                ${paletteCardsHtml}
                            </div>
                        </div>

                        <div class="lg-color-layout__custom">
                            <div class="lg-custom-color-header">
                                <h4>Customize or Create</h4>
                            </div>
                            <div class="lg-custom-color-options">
                                <div class="lg-custom-option-card" id="lg-random-color-trigger">
                                    <ion-icon name="shuffle-outline"></ion-icon>
                                    <span>Generate Random</span>
                                </div>
                                <div class="lg-custom-option-card lg-custom-option-card--editor">
                                    <div class="lg-color-display" id="selective-color-display">
                                        <div class="lg-color-circle-wrapper" data-color-index="0">
                                            <div class="lg-color-circle">
                                                <ion-icon name="add-outline"></ion-icon>
                                                <input type="color" value="#C0FF00">
                                            </div>
                                            <div class="lg-color-hex-label">HEX</div>
                                        </div>
                                        <div class="lg-color-circle-wrapper" data-color-index="1">
                                            <div class="lg-color-circle">
                                                <ion-icon name="add-outline"></ion-icon>
                                                <input type="color" value="#FFFFFF">
                                            </div>
                                            <div class="lg-color-hex-label">HEX</div>
                                        </div>
                                        <div class="lg-color-circle-wrapper" data-color-index="2">
                                            <div class="lg-color-circle">
                                                <ion-icon name="add-outline"></ion-icon>
                                                <input type="color" value="#000000">
                                            </div>
                                            <div class="lg-color-hex-label">HEX</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lg-step-actions">
                        <button class="lg-button lg-button--tertiary" id="color-skip"><span class="lg-button__text">Skip for now</span><span class="lg-button__loader"></span></button>
                        <button class="lg-button lg-button--primary" id="color-continue" disabled><span class="lg-button__text">Continue</span><span class="lg-button__loader"></span></button>
                    </div>
                </div>
            </div>
        `;
        $flowContainer.append(html);
    
        // After appending, apply gradients to the new predefined palette circles
        $('.lg-palette-card__swatches .lg-color-circle').each(function() {
            applyPremiumGradient($(this), $(this).data('color'));
        });
    
        // --- NEW EVENT HANDLERS ---
    
        // Click on a predefined palette
        $('#lg-step-color').on('click', '.lg-palette-card', function() {
            const $card = $(this);
            const colors = $card.data('colors').split(',');

            state.colors = colors;
            state.colorSelectionType = 'predefined';
            LocalState.save(state);
    
            // Update UI
            $('.lg-palette-card').removeClass('selected');
            $card.addClass('selected');
            updateColorCircles('#selective-color-display', colors, true);
            $('#color-continue').prop('disabled', false);
    
        });

        // Click on Random button
        $('#lg-step-color').on('click', '#lg-random-color-trigger', function() {
            const newColors = [];
            const $editorCircles = $('#selective-color-display .lg-color-circle');
    
            gsap.to($editorCircles, {
                rotationY: 90,
                duration: 0.25,
                stagger: 0.1,
                ease: 'power2.in',
                onComplete: () => {
                    for (let i = 0; i < 3; i++) {
                        newColors.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
                    }
                    state.colors = newColors;
                    state.colorSelectionType = 'random';
                    LocalState.save(state);
                    updateColorCircles('#selective-color-display', newColors, true);
                    $('.lg-palette-card').removeClass('selected');
                    $('#color-continue').prop('disabled', false);
    
                    gsap.set($editorCircles, { rotationY: -90 });
                    gsap.to($editorCircles, { rotationY: 0, duration: 0.3, stagger: 0.1, ease: 'power2.out' });
                }
            });
        });

        // Click to Open Picker (delegated to flow container)
        $('#lg-creator-flow').on('click', '#selective-color-display .lg-color-circle', function() {
            // When user starts customizing, deselect predefined palettes
            $('.lg-palette-card').removeClass('selected');
            state.colorSelectionType = 'selective'; // Set state to selective
            CustomColorPicker.open(this);
        });

        // Click to Copy Hex Label Magic (already delegated, no change needed)
        $('#lg-creator-flow').on('click', '.lg-color-hex-label.visible', function() {
            const $label = $(this);
            const originalText = $label.text();
            
            if(originalText === 'COPIED!') return;

            navigator.clipboard.writeText(originalText).then(() => {
                $label.html('<ion-icon name="checkmark-outline" style="margin-right:3px;"></ion-icon>COPIED!');
                $label.addClass('copied');
                
                // satisfying bounce on the parent circle
                gsap.fromTo($label.siblings('.lg-color-circle'), 
                    { scale: 0.9 }, 
                    { scale: 1, duration: 0.4, ease: "back.out(2)" }
                );

                setTimeout(() => {
                    $label.text(originalText);
                    $label.removeClass('copied');
                }, 1500);
            });
        });

        $('#color-continue').on('click', function() {
            const $btn = $(this);
            if ($btn.hasClass('loading') || $btn.is(':disabled')) return;

            $btn.addClass('loading').prop('disabled', true);
            setTimeout(() => { 
                LocalState.save(state);
                goToStep(1);
            }, 200);
        });

        $('#color-skip').on('click', function() {
            const $btn = $(this);
            if ($btn.hasClass('loading')) return;

            state.colors = ['#C0FF00', '#FFFFFF', '#000000'];
            state.colorSelectionType = 'default';
            
            $btn.addClass('loading').prop('disabled', true);
            $('#color-continue').prop('disabled', true); 

            setTimeout(() => {
                LocalState.save(state);
                goToStep(1);
            }, 200);
        });
    }

    function updateColorCircles(container, colors, isSelective = false) {
        const $wrappers = $(container).find('.lg-color-circle-wrapper');
        $wrappers.each(function(index) {
            const color = colors[index];
            const $wrapper = $(this);
            const $circle = $wrapper.find('.lg-color-circle');
            
            if (color) {
                applyPremiumGradient($circle, color);
                if(isSelective) {
                    $wrapper.find('.lg-color-hex-label').addClass('visible').text(color.toUpperCase());
                }
            } else {
                if (isSelective) {
                    $circle.css({ 'background': '', 'box-shadow': '' });
                    $circle.find('ion-icon').show();
                    $circle.find('input[type="color"]').val('#ffffff');
                    $wrapper.find('.lg-color-hex-label').removeClass('visible').text('HEX');
                } else {
                    $circle.html('?');
                    $circle.css({ 'background': '', 'box-shadow': '' });
                }
            }
        });
    }

    function buildStepIndustry() {
        const industries = [
            { name: 'Technology', icon: 'hardware-chip-outline' }, { name: 'Retail', icon: 'cart-outline' },
            { name: 'Real Estate', icon: 'business-outline' }, { name: 'Finance', icon: 'cash-outline' },
            { name: 'Restaurant', icon: 'restaurant-outline' }, { name: 'Travel', icon: 'airplane-outline' },
            { name: 'Sports & Fitness', icon: 'barbell-outline' }, { name: 'Medical', icon: 'medkit-outline' },
            { name: 'Beauty & Spa', icon: 'woman-outline' }, { name: 'Automotive', icon: 'car-sport-outline' },
            { name: 'Construction', icon: 'build-outline' }, { name: 'Education', icon: 'book-outline' },
            { name: 'Entertainment', icon: 'game-controller-outline' }, { name: 'Internet', icon: 'globe-outline' },
            { name: 'Animals & Pets', icon: 'paw-outline' }, { name: 'Other', icon: 'ellipsis-horizontal-outline' }
        ];

        let cardsHtml = industries.map(ind => `
            <div class="lg-selection-card" data-value="${ind.name}">
                <ion-icon name="${ind.icon}" class="lg-card-icon"></ion-icon>
                <span class="lg-card-label">${ind.name}</span>
            </div>
        `).join('');

        const html = `
            <div class="lg-creator-step" id="lg-step-industry">
                <div class="lg-step-content" data-step="industry">
                    <div class="lg-step-header">
                        <h2 class="lg-step-title">Select Your Industry</h2>
                        <p class="lg-step-desc">This helps the AI understand the context of your brand.</p>
                    </div>
                    <div class="lg-industry-search-wrapper">
                        <ion-icon name="search-outline" class="lg-industry-search__icon"></ion-icon>
                        <input type="search" class="lg-industry-search__input" id="lg-industry-search" placeholder="Search for an industry...">
                    </div>
                    <div class="lg-card-grid">${cardsHtml}</div>
                    <div class="lg-no-results" id="lg-no-results">
                        <ion-icon name="sad-outline"></ion-icon>
                        <span>No results found.</span>
                    </div>
                    <div class="lg-step-actions">
                        <button class="lg-button lg-button--primary" id="industry-continue" disabled><span class="lg-button__text">Continue</span><span class="lg-button__loader"></span></button>
                    </div>
                </div>
            </div>
        `;
        $flowContainer.append(html);

        $('#lg-step-industry .lg-selection-card').on('click', function() {
            state.industry = $(this).data('value');
            $('#lg-step-industry .lg-selection-card').removeClass('selected');
            $(this).addClass('selected');
            $('#industry-continue').prop('disabled', false);
        });

        $('#industry-continue').on('click', function() {
            const $btn = $(this);
            if ($btn.hasClass('loading') || !state.industry) return;

            $btn.addClass('loading').prop('disabled', true);
            setTimeout(() => { 
                LocalState.save(state);
                goToStep(2); // NEW: goes to Logo Style
            }, 200);
        });

        const $grid = $('#lg-step-industry .lg-card-grid');
        const originalCardsOrder = $grid.children('.lg-selection-card').toArray();

        $('#lg-industry-search').on('input', function() {
            const searchTerm = $(this).val().trim();
            const searchTermLower = searchTerm.toLowerCase();
            const $allCards = $(originalCardsOrder);

            gsap.killTweensOf($allCards);
            gsap.killTweensOf($grid.children());

            gsap.to($allCards, {
                duration: 0.2,
                autoAlpha: 0,
                scale: 0.95,
                stagger: 0.01,
                onComplete: () => {
                    let matchingCards = [];
                    let nonMatchingCards = [];
                    if (searchTerm) {
                        matchingCards = $allCards.filter(function() {
                            return $(this).find('.lg-card-label').text().toLowerCase().includes(searchTermLower);
                        });
                        nonMatchingCards = $allCards.not(matchingCards);
                        $grid.append(matchingCards).append(nonMatchingCards);
                        gsap.to(matchingCards, { duration: 0.3, autoAlpha: 1, scale: 1, stagger: 0.02, delay: 0.05 });
                    } else {
                        $grid.append(originalCardsOrder); 
                        gsap.to($grid.children(), { duration: 0.3, autoAlpha: 1, scale: 1, stagger: 0.02, delay: 0.05 });
                    }
                    
                    $('#lg-no-results').toggle(searchTerm.length > 0 && matchingCards.length === 0);
                }
            });
        });
    }

    function buildStepStyle() {
        const styles = [
            { name: 'Minimalist', folder: 'minimalist' },
            { name: 'Modern', folder: 'modern' },
            { name: 'Vintage', folder: 'vintage' },
            { name: 'Playful', folder: 'playful' },
            { name: 'Elegant', folder: 'elegant' },
            { name: 'Bold', folder: 'bold' },
            { name: 'Geometric', folder: 'geometric' },
            { name: 'Hand-Drawn', folder: 'handwrite' }
        ];

        let cardsHtml = styles.map(style => {
            const imagePath = `img/form/${style.folder}/`;
            return `
            <div class="lg-selection-card" data-value="${style.name}">
                <span class="lg-card-label">${style.name}</span>
                <div class="lg-style-card__image-preview">
                    <img src="${imagePath}1.png" alt="${style.name} example 1" loading="lazy">
                    <img src="${imagePath}2.png" alt="${style.name} example 2" loading="lazy">
                    <img src="${imagePath}3.png" alt="${style.name} example 3" loading="lazy">
                </div>
            </div>
        `}).join('');

        const html = `
            <div class="lg-creator-step" id="lg-step-style">
                <div class="lg-step-content" data-step="style">
                    <div class="lg-step-header">
                        <h2 class="lg-step-title">Choose Logo Styles</h2>
                        <p class="lg-step-desc">Select the style that best fits your brand's essence. This will guide the AI's creative direction.</p>
                    </div>
                    <div class="lg-card-grid">${cardsHtml}</div>
                    <div class="lg-step-actions">
                        <button class="lg-button lg-button--primary" id="style-continue" disabled><span class="lg-button__text">Continue</span><span class="lg-button__loader"></span></button>
                    </div>
                </div>
            </div>
        `;
        $flowContainer.append(html);

        $('#lg-step-style .lg-selection-card').on('click', function() {
            const $card = $(this);
            const value = $card.data('value');
            
            // Update state for single selection
            state.style = value;

            // Update UI
            $('#lg-step-style .lg-selection-card').removeClass('selected');
            $card.addClass('selected');

            // Enable continue button
            $('#style-continue').prop('disabled', false);
        });

        $('#style-continue').on('click', function() {
            const $btn = $(this);
            if ($btn.hasClass('loading') || $btn.is(':disabled')) return;

            $btn.addClass('loading').prop('disabled', true);
            setTimeout(() => { 
                LocalState.save(state);
                goToStep(3); // NEW: goes to Font Style
            }, 200);
        });
    }

    function buildStepFont() {
        const fonts = [
            { name: 'Modern', class: 'font-modern' }, { name: 'Elegant', class: 'font-elegant' }, 
            { name: 'Slab', class: 'font-slab' }, { name: 'Handwritten', class: 'font-handwritten' }, 
            { name: 'Playful', class: 'font-playful' }, { name: 'Futuristic', class: 'font-futuristic' },
            { name: 'Minimalist', class: 'font-minimalist' }, { name: 'Bold', class: 'font-bold' },
            { name: 'Script', class: 'font-script' }, { name: 'Serif', class: 'font-elegant' }
        ];

        let cardsHtml = fonts.map(font => `
            <div class="lg-selection-card" data-value="${font.name}">
                <div class="lg-font-card">
                    <div class="lg-font-card__preview ${font.class}">Ag</div>
                    <div class="lg-font-card__name">${font.name}</div>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="lg-creator-step" id="lg-step-font">
                <div class="lg-step-content">
                    <div class="lg-step-header">
                        <h2 class="lg-step-title">Define Your Font Style</h2>
                        <p class="lg-step-desc">Choose the typography that best represents your brand's personality.</p>
                    </div>
                    <div class="lg-card-grid lg-card-grid--no-scroll">${cardsHtml}</div>
                    <div class="lg-step-actions">
                        <button class="lg-button lg-button--primary" id="font-generate" disabled><span class="lg-button__text">Generate</span><span class="lg-button__loader"></span></button>
                    </div>
                </div>
            </div>
        `;
        $flowContainer.append(html);

        $('#lg-step-font .lg-selection-card').on('click', function() {
            state.font = $(this).data('value');
            $('#lg-step-font .lg-selection-card').removeClass('selected');
            $(this).addClass('selected');
            $('#font-generate').prop('disabled', false);
        });

        $('#font-generate').on('click', function() {
            const $btn = $(this);
            if ($btn.hasClass('loading') || !state.font) return;

            $btn.addClass('loading').prop('disabled', true);
            setTimeout(() => { 
                LocalState.save(state);
                buildStepGenerate();
            }, 500);
        });
    }

    function buildStepGenerate() {
        if ($('#lg-final-overlay').length === 0) {
            const finalHtml = `
                <div class="lg-creator-final-overlay" id="lg-final-overlay">
                    <div class="lg-final-blur-bg"></div>
                    <h2 class="lg-final-teaser-title" id="lg-final-teaser-title">Crafting your brand...</h2>
                    <div class="lg-final-modal" id="lg-google-modal">
                        <ion-icon name="color-palette-outline" class="lg-google-icon"></ion-icon>
                        <h3 class="lg-final-modal-title">Ready to reveal</h3>
                        <p class="lg-final-modal-desc">Your custom logo designs are ready. Continue to view them.</p>
                        <button class="lg-google-btn">
                            <ion-icon name="logo-google"></ion-icon>
                            Continue with Google
                        </button>
                    </div>
                </div>
            `;
            $('body').append(finalHtml);
        }

        const $overlay = $('#lg-final-overlay');
        const $modal = $('#lg-google-modal');
        const $teaserTitle = $('#lg-final-teaser-title');
        const $blurBg = $('.lg-final-blur-bg');

        if ($blurBg.is(':empty')) {
            const unsplashImages = [
                'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
                'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
                'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&q=80'
            ];
            
            const cardsHtml = unsplashImages.map(url => `
                <div class="lg-final-blurry-card">
                    <img src="${url}" alt="Generating..." loading="lazy">
                </div>
            `).join('');
            
            $blurBg.html(cardsHtml);
        }

        const tl = gsap.timeline();

        tl.to($flowContainer, { duration: 0.5, autoAlpha: 0, ease: 'power2.in' })
          .to($overlay, { autoAlpha: 1, duration: 0.5 }, '-=0.3') 
          .to([$teaserTitle, $blurBg], { duration: 1.0, autoAlpha: 0.7, ease: 'power2.out' }, '<')
          .to($modal, { delay: 0.3, duration: 0.8, autoAlpha: 1, y: 0, ease: 'elastic.out(1, 0.75)' });
    }

});