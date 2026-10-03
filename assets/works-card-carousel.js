(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const carousels = [...document.querySelectorAll('[data-work-card-carousel]')]
    .filter(carousel => carousel.querySelectorAll('.work-card-slide').length > 1);
  if (!carousels.length || reduceMotion.matches) return;

  carousels.forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.work-card-slide')];
    let current = 0;
    let timer;
    const activate = index => {
      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      current = index;
      slides[current].classList.add('is-active');
      slides[current].removeAttribute('aria-hidden');
    };
    const show = index => {
      const next = slides[index];
      const image = next.querySelector('img');
      if (!image || (image.complete && image.naturalWidth)) {
        activate(index);
        return;
      }
      // A hidden lazy image can otherwise leave a blank frame at the exact
      // moment the carousel reaches it. Start it, then reveal only on load.
      image.loading = 'eager';
      image.addEventListener('load', () => activate(index), { once: true });
      image.addEventListener('error', () => {}, { once: true });
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => show((current + 1) % slides.length), 2800);
    };
    const stop = () => clearInterval(timer);
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.closest('a')?.addEventListener('focusin', stop);
    carousel.closest('a')?.addEventListener('focusout', start);
    start();
  });
})();
