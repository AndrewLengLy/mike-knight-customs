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
// Flags: tap Before/After to reveal the full photo; active side highlights green.
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

  const updateFromX = (clientX) => {
    const rect = unit.getBoundingClientRect();
    const usable = Math.max(rect.width, 1);
    const x = Math.max(0, Math.min(clientX - rect.left, usable));
    const v = (x / usable) * 100;
    range.value = v;
    set(v);
  };

  const onInput = () => set(parseFloat(range.value));
  range.addEventListener('input', onInput);
  range.addEventListener('change', onInput);
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

  if (beforeFlag) {
    beforeFlag.addEventListener('click', (e) => { e.stopPropagation(); slideTo(100); });
  }
  if (afterFlag) {
    afterFlag.addEventListener('click', (e) => { e.stopPropagation(); slideTo(0); });
  }

  let dragging = false;
  unit.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.compare__flag')) return;
    dragging = true;
    unit.setPointerCapture(e.pointerId);
    updateFromX(e.clientX);
  });
  unit.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    updateFromX(e.clientX);
  });
  const endDrag = () => { dragging = false; };
  unit.addEventListener('pointerup', endDrag);
  unit.addEventListener('pointercancel', endDrag);
});

// Review carousel — auto-rotates verified customer quotes
(() => {
  const root = document.querySelector('[data-review-carousel]');
  if (!root) return;

  const reviews = [
    { quote: 'Mike and his team did a fantastic job on my 2019 GMC Sierra 1500. Excellent service, perfect paint match. My pickup came back better than new.', author: 'Zane G. · Google Review' },
    { quote: 'I couldn\'t have asked for a better experience. The whole rig looks better than brand new. 100% recommend.', author: 'Aaron B. · Google Review' },
    { quote: 'I would highly reccomend MKC to anyone in need of body work or insurance repairs. They got my car in and repaired within days of the estimate, and the cost was exactly what was quoted.', author: 'Natalie K. · Yelp Review' },
    { quote: 'Amazing shop! Would give ten stars if I could. Mike and his team took the best care of me and my car. He was reassuring from the start and kept constant communication throughout.', author: 'Alex L. · Yelp Review' },
    { quote: 'There are not enough words to describe the amazing experience I have had with this shop. The customer service is on point, and the quality of the work is phenomenal.', author: 'Lindsay D. · Yelp Review' },
    { quote: 'Holy cow, I\'ve never had a better car-related experience. My Explorer got hit in a parking lot and I dreaded the whole process. Mike made it easy from start to finish.', author: 'Michele M. · Yelp Review' },
    { quote: 'If there was an option for more than five stars I would. Mikey and his team went above and beyond to make my car not only look better but actually perform better too.', author: 'June S. · Yelp Review' },
    { quote: 'Highly recommend MKC! We took my wife\'s new Expedition for body damage. They exceeded our expectations with quick turnaround, excellent communication, and a flawless result.', author: 'Ben J. · Yelp Review' },
    { quote: 'If you want the job done right, Mike\'s your guy. My car was rear ended and he dealt with the insurance and made sure everything was done right. Came back good as new.', author: 'Bailey P. · Yelp Review' },
    { quote: 'Mike Knight Customs is amazing! I got hit by a commercial truck and had a horrible time with insurance. Mike dealt with the insurer for me and got everything resolved properly.', author: 'Abby C. · Yelp Review' },
  ];

  const quote = document.getElementById('review-quote');
  const author = document.getElementById('review-author');
  const dots = document.getElementById('review-dots');
  let idx = 0;
  let timer;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = reduced ? 0 : 6000;

  reviews.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review__dot' + (i === 0 ? ' is-active' : '');
    btn.setAttribute('aria-label', `Review ${i + 1} of ${reviews.length}`);
    if (i === 0) btn.setAttribute('aria-current', 'true');
    btn.addEventListener('click', () => { show(i); restart(); });
    dots.appendChild(btn);
  });

  const show = (i) => {
    idx = i;
    quote.classList.add('is-fading');
    author.classList.add('is-fading');
    setTimeout(() => {
      quote.textContent = `\u201c${reviews[i].quote}\u201d`;
      author.textContent = reviews[i].author;
      quote.classList.remove('is-fading');
      author.classList.remove('is-fading');
      dots.querySelectorAll('.review__dot').forEach((d, n) => {
        d.classList.toggle('is-active', n === i);
        d.toggleAttribute('aria-current', n === i);
      });
    }, reduced ? 0 : 280);
  };

  const next = () => show((idx + 1) % reviews.length);
  const restart = () => {
    clearInterval(timer);
    if (interval) timer = setInterval(next, interval);
  };

  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  root.addEventListener('focusin', () => clearInterval(timer));
  root.addEventListener('focusout', restart);
  restart();
})();
