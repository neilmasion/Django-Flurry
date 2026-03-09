export function setupOfficerDeck() {
    const deck = document.getElementById('officerDeck');
    if (!deck) return;

    const officers = [
        { initials:'AT',  name:'Aldwin Tumulak',         role:'Captain',                           course:'BS Information Technology, 3th Year',   links:['linkedin','github'] },
        { initials:'KKE', name:'Klycie Kerth Er-er',     role:'Executive Secretary',               course:'BS Information Technology, 2nd Year',   links:['linkedin','github'] },
        { initials:'AA',  name:'Alex Aristotle',         role:'Chief of Finance',                  course:'BS Information Technology, 2nd Year',   links:['linkedin','github'] },
        { initials:'TB',  name:'Trixie Batucan',         role:'Treasurer',                         course:'BS Information Technology, 2nd Year',   links:['linkedin','github'] },
        { initials:'JG',  name:'Jhuly Godinez',          role:'Chief of Marketing & Creatives',    course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] },
        { initials:'NM',  name:'Neil Masion',            role:'Graphic Designer',                  course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] },
        { initials:'KCT', name:'Kenth Carlo Timan',      role:'Social Media Manager',              course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] },
        { initials:'JLG', name:'John Lloyd Gabrillo',    role:'Chief of Relations',                course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] },
        { initials:'JA',  name:'Junas Amanence',         role:'Chief of Logistics and Operations', course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] },
        { initials:'MA',  name:'Mike Alinghawa',         role:'Chief of Technical',                course:'BS Information Technology, 3rd Year',   links:['linkedin','github'] }
    ];

    const cards    = Array.from(deck.querySelectorAll('.deck-card'));
    const total    = cards.length;
    let topIndex   = 0;
    let animating  = false;

    function updateInfo(idx) {
        const o = officers[idx];
        document.getElementById('deckName').textContent    = o.name;
        document.getElementById('deckRole').textContent    = o.role;
        document.getElementById('deckCourse').textContent  = o.course;
        document.getElementById('deckCurrent').textContent = idx + 1;
        const linksEl = document.getElementById('deckLinks');
        linksEl.innerHTML = o.links.map(l =>
            '<a href="#"><i class="fa-brands fa-' + l + '"></i></a>'
        ).join('');
    }

    function getCardByIndex(idx) {
        return cards.find(c => parseInt(c.dataset.index) === idx);
    }

    deck.addEventListener('click', () => {
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