/* ============================================================
   CEEZAER — Shared JavaScript
   ============================================================ */

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const answer = q.nextElementSibling;
    const isOpen = q.classList.contains('open');
    // close all
    document.querySelectorAll('.faq-q').forEach(el => {
      el.classList.remove('open');
      el.nextElementSibling.classList.remove('open');
    });
    if (!isOpen) {
      q.classList.add('open');
      answer.classList.add('open');
    }
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// Simple scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = '1'; });
}, { threshold: 0.1 });
document.querySelectorAll('.card, .step, .blog-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.5s ease';
  observer.observe(el);
});
