$(document).ready(function() {

  // --- LENIS & GSAP SCROLL SETUP ---
  window.lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  
  window.lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    window.lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  gsap.registerPlugin(ScrollTrigger);

  // Automatically toggle the 'scrolled' class on the navbar
  ScrollTrigger.create({
      start: '50px top',
      end: 99999,
      toggleClass: {
          className: 'scrolled',
          targets: '#lg-navbar'
      }
  });


  // --- FEATURE: Mobile navigation toggle ---
  var menuToggle = $('#lg-navbar-toggle');
  var menu = $('#lg-navbar-menu');

  menuToggle.on('click', function() {
    menu.toggleClass('open');
    // Optional: Change icon on toggle
    var icon = $(this).find('ion-icon');
    icon.attr('name', menu.hasClass('open') ? 'close-outline' : 'menu-outline');
  });

  // --- FEATURE: Scroll to Top Button ---
  const scrollToTopBtn = $('#lg-scroll-to-top');
  
  // Folosim ScrollTrigger pentru a comuta vizibilitatea (performant)
  ScrollTrigger.create({
      start: 'top -50%', // Afișează butonul după un scroll de 50% din înălțimea ecranului
      end: 99999,
      onToggle: self => {
          if (self.isActive) {
              scrollToTopBtn.addClass('visible');
          } else {
              scrollToTopBtn.removeClass('visible');
          }
      }
  });

  // Gestionează evenimentul de click
  scrollToTopBtn.on('click', function(e) {
      e.preventDefault();
      window.lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  });

  // --- FEATURE: Smooth scroll for navbar links ---
  $('.lg-navbar__link').on('click', function(e) {
    const target = $(this).data('target');
    if (target) {
      e.preventDefault();
      window.lenis.scrollTo(target, {
        offset: -80, // Optional: offset for the fixed navbar
        duration: 1.5
      });
    }
  });
});

function animateCounter(element, target) {
  const counter = { value: 0 };
  gsap.to(counter, {
    value: target,
    duration: 2.5,
    ease: 'power2.out',
    onUpdate: () => {
      $(element).text(Math.ceil(counter.value));
    },
    delay: 1 // Start after main entrance animations
  });
}

$(window).on('load', function() {
  // --- FEATURE: Loading Screen & Entrance Animation Trigger ---
  const $loader = $('#lg-loader');
  const $body = $('body');

  // Short delay to ensure the initial state is rendered
  setTimeout(function() {
    // 1. Start the fill animation
    $loader.addClass('loading-progress');

    // 2. Wait for fill animation to end, then fade out
    setTimeout(function() {
      $loader.addClass('hidden');
      
      // 3. After fade out, trigger content animations
      $loader.one('transitionend', function() {
        $body.addClass('loaded');
        animateCounter('#lg-counter', 700);
        $loader.remove();
      });

    }, 1500); // Corresponds to clip-path transition duration

  }, 100); // Initial delay
});