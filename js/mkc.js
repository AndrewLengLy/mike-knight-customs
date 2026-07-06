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
// Flags: click Before/After to slide fully to that photo; the photo
// occupying the majority of the frame gets the green-highlighted flag.
document.querySelectorAll('[data-compare]').forEach((unit) => {
  const range = unit.querySelector('input[type="range"]');
  const afterPane = unit.querySelector('.compare__after');
  const handle = unit.querySelector('.compare__handle');
  const beforeFlag = unit.querySelector('.compare__flag--before');
  const afterFlag = unit.querySelector('.compare__flag--after');

  const set = (v) => {
    afterPane.style.clipPath = `inset(0 0 0 ${v}%)`;
    handle.style.left = `${v}%`;
    if (beforeFlag && afterFlag) {
      beforeFlag.classList.toggle('is-major', v >= 50);
      afterFlag.classList.toggle('is-major', v < 50);
    }
  };
  range.addEventListener('input', () => set(parseFloat(range.value)));
  set(parseFloat(range.value));

  let anim;
  const slideTo = (target) => {
    cancelAnimationFrame(anim);
    const start = parseFloat(range.value);
    const t0 = performance.now();
    const dur = 500;
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (target - start) * eased;
      range.value = v;
      set(v);
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  if (beforeFlag) beforeFlag.addEventListener('click', () => slideTo(100));
  if (afterFlag) afterFlag.addEventListener('click', () => slideTo(0));
});
