export function setupPartnersCarousel() {
    function initTrack(trackId, direction) {
        const track = document.getElementById(trackId);
        if (!track) return;

        function init() {
            const gap       = parseFloat(getComputedStyle(track).gap) || 16;
            const originals = Array.from(track.children);
            const setWidth = originals.reduce((sum, el) => sum + el.offsetWidth + gap, 0);

            while (track.scrollWidth < window.innerWidth * 20) {
                originals.forEach(item => track.appendChild(item.cloneNode(true)));
            }

            let offset = setWidth * 5;
            function tick() {
                offset += 0.6 * direction;
                if (offset >= setWidth * 10) offset -= setWidth * 5;
                if (offset <= setWidth * 0)  offset += setWidth * 5;
                track.style.transform = 'translateX(-' + offset + 'px)';
                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        }

        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }
    }

    initTrack('partnersTrackA',  1);
    initTrack('partnersTrackB', -1);
}