/**
 * Ceezaer Site Enhancements
 * - Header scroll effect (transparent -> solid)
 * - Scroll-reveal animations via IntersectionObserver
 */
(function() {
  'use strict';

  // Header scroll effect
  var header = document.getElementById('site-header');
  if (header) {
    function onScroll() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll-reveal animation
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      });

      reveals.forEach(function(el) {
        observer.observe(el);
      });
    } else {
      // Fallback for older browsers
      reveals.forEach(function(el) {
        el.classList.add('visible');
      });
    }
  }
})();
