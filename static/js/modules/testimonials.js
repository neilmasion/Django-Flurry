export function setupTestimonialSlider() {
    const track   = document.getElementById('testimonialTrack');
    const dotsEl  = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    if (!track) return;

    const cards   = Array.from(track.querySelectorAll('.testimonial-card'));
    const total   = cards.length;
    let current   = 0;
    let perView   = 3;

    function getPerView() {
        if (window.innerWidth < 600)  return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    }

    function getGap() {
        return parseFloat(getComputedStyle(track).gap) || 20;
    }

    function cardWidth() {
        const gap = getGap();
        return (track.parentElement.offsetWidth - gap * (perView - 1)) / perView;
    }

    function setWidths() {
        perView = getPerView();
        const w = cardWidth();
        cards.forEach(c => {
            c.style.width    = w + 'px';
            c.style.minWidth = w + 'px';
            c.style.maxWidth = w + 'px';
        });
    }

    function maxIndex() {
        return Math.max(0, total - perView);
    }

    function updateDots() {
        if (!dotsEl) return;
        dotsEl.querySelectorAll('.testimonial-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
    }

    function goTo(index) {
        current = Math.max(0, Math.min(index, maxIndex()));
        const w   = cardWidth();
        const gap = getGap();
        track.style.transform = 'translateX(-' + (current * (w + gap)) + 'px)';
        updateDots();
    }

    function buildDots() {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        const pages = maxIndex() + 1;
        for (let i = 0; i < pages; i++) {
            const dot = document.createElement('button');
            dot.className    = 'testimonial-dot' + (i === current ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', function () {
                goTo(parseInt(this.dataset.index));
            });
            dotsEl.appendChild(dot);
        }
    }

    setWidths();
    buildDots();
    goTo(0);

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

    window.addEventListener('resize', () => {
        setWidths();
        buildDots();
        goTo(0);
    });
}