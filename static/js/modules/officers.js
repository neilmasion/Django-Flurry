export function setupOfficerDeck() {
    const deck = document.getElementById('officerDeck');
    if (!deck) return;

    const cards    = Array.from(deck.querySelectorAll('.deck-card'));
    const total    = cards.length;
    let topIndex   = 0;
    let animating  = false;

    // Hide the hint if there's only 1 card
    if (total <= 1) {
        const hint = document.querySelector('.deck-hint');
        if (hint) hint.style.display = 'none';
        
        // Hide the counter entirely if there's only 1
        const counter = document.querySelector('.deck-counter');
        if (counter) counter.style.display = 'none';
    }

    function getOfficerData(idx) {
        const card = cards[idx];
        if (!card) return { name: '', role: '', course: '' };
        return {
            name: card.dataset.name || '',
            role: card.dataset.role || '',
            course: card.dataset.course || '',
        };
    }

    function updateInfo(idx) {
        const o = getOfficerData(idx);
        document.getElementById('deckName').textContent    = o.name;
        document.getElementById('deckRole').textContent    = o.role;
        document.getElementById('deckCourse').textContent  = o.course;
        document.getElementById('deckCurrent').textContent = idx + 1;
        const linksEl = document.getElementById('deckLinks');
        linksEl.innerHTML = [
            '<a href="#"><i class="fa-brands fa-linkedin"></i></a>',
            '<a href="#"><i class="fa-brands fa-github"></i></a>'
        ].join('');
    }

    function getCardByIndex(idx) {
        return cards.find(c => parseInt(c.dataset.index) === idx);
    }

    deck.addEventListener('click', () => {
        if (total <= 1) return; // Prevent flip if only 1 card
        if (animating) return;
        animating = true;

        const topCard = getCardByIndex(topIndex);
        topCard.classList.add('fly-out');

        setTimeout(() => {
            topCard.classList.remove('fly-out');
            topIndex = (topIndex + 1) % total;

            cards.forEach(card => {
                const pos = (parseInt(card.dataset.index) - topIndex + total) % total;
                card.setAttribute('data-pos', pos);
            });

            updateInfo(topIndex);
            animating = false;
        }, 420);
    });

    updateInfo(0);
}