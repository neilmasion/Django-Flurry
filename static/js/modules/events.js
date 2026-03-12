const EVENT_INFO = {
    'AWS Cloud Practitioner Bootcamp':          { date: 'March 15, 2026',  time: '9:00 AM – 5:00 PM' },
    'Building Serverless APIs with Lambda':     { date: 'March 22, 2026',  time: '2:00 PM – 5:00 PM' },
    'Cloud Careers: From Student to AWS Engineer': { date: 'April 5, 2026', time: '3:00 PM – 5:00 PM' },
    'IAM & Security Deep Dive':                 { date: 'April 19, 2026',  time: '1:00 PM – 4:00 PM' },
};

function isLoggedIn() {
    return document.body.dataset.authenticated === 'true';
}

function showToast(msg, success = true) {
    const toast  = document.getElementById('enrollToast');
    const msgEl  = document.getElementById('enrollToastMsg');
    const iconEl = document.getElementById('enrollToastIcon');
    if (!toast || !msgEl) return;

    msgEl.textContent  = msg;
    iconEl.className   = success
        ? 'fa-solid fa-circle-check'
        : 'fa-solid fa-circle-exclamation';
    iconEl.style.color = success ? '#86efac' : '#fbbf24';

    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function getEnrolledKey() {
    const email = document.body.dataset.email || 'guest';
    return `enrolledWorkshops_${email}`;
}

function getEnrolled() {
    return JSON.parse(localStorage.getItem(getEnrolledKey()) || '[]');
}

function saveEnrolled(list) {
    localStorage.setItem(getEnrolledKey(), JSON.stringify(list));
}

function handleEnroll(btn) {
    if (!isLoggedIn()) {
        window.location.href = '/account/?next=/events/';
        return;
    }

    const title   = btn.dataset.title;
    const info    = EVENT_INFO[title] || {};
    const enrolled = getEnrolled();
    const already  = enrolled.some(e => (e.title || e) === title);

    if (already) {
        showToast('You\'re already enrolled in this event!', false);
        return;
    }

    enrolled.push({
        title,
        date:       info.date || btn.dataset.date || '—',
        time:       info.time || btn.dataset.time || '—',
        enrolledAt: new Date().toISOString()
    });
    saveEnrolled(enrolled);

    btn.textContent   = 'Enrolled ✓';
    btn.disabled      = true;
    btn.style.opacity = '0.65';

    showToast(`Enrolled in "${title}" successfully!`);
}

export function setupEventEnroll() {
    const btns = document.querySelectorAll('.enroll-btn');
    if (!btns.length) return;

    const enrolled = getEnrolled();

    btns.forEach(btn => {
        const already = enrolled.some(e => (e.title || e) === btn.dataset.title);
        if (already) {
            btn.textContent   = 'Enrolled ✓';
            btn.disabled      = true;
            btn.style.opacity = '0.65';
        }
        btn.addEventListener('click', () => handleEnroll(btn));
    });
}