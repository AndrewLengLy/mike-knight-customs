/* MKC shared behaviors: nav, reveals, proof-center comparators */

// Mobile nav
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav__burger');
if (burger) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Scroll reveals (respects reduced motion via CSS)
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Before / After comparators
document.querySelectorAll('[data-compare]').forEach((unit) => {
  const range = unit.querySelector('input[type="range"]');
  const afterPane = unit.querySelector('.compare__after');
  const handle = unit.querySelector('.compare__handle');
  const set = (v) => {
    afterPane.style.clipPath = `inset(0 0 0 ${v}%)`;
    handle.style.left = `${v}%`;
  };
  range.addEventListener('input', () => set(range.value));
  set(range.value);
});
