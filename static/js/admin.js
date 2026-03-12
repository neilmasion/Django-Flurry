const ADMIN_CREDS = { email: 'admin@flurry.com', password: 'admin123' };
const ADMIN_KEY = 'flurryAdminAuth';
const DEFAULT_EVENTS = [
    { id: 'ev1', title: 'AWS Cloud Practitioner Bootcamp', tag: 'Bootcamp', date: 'March 15, 2026', time: '9:00 AM – 5:00 PM', location: 'Room 401, IT Building', desc: 'A full-day intensive prep session for the AWS Certified Cloud Practitioner exam.' },
    { id: 'ev2', title: 'Building Serverless APIs with Lambda', tag: 'Workshop', date: 'March 22, 2026', time: '2:00 PM – 5:00 PM', location: 'CS Lab 3', desc: 'Deploy a real REST API using AWS Lambda, API Gateway, and DynamoDB from scratch.' },
    { id: 'ev3', title: 'Cloud Careers: From Student to AWS Engineer', tag: 'Tech Talk', date: 'April 5, 2026', time: '3:00 PM – 5:00 PM', location: 'Auditorium B', desc: 'Industry professionals share their journey into cloud engineering.' },
    { id: 'ev4', title: 'IAM & Security Deep Dive', tag: 'Workshop', date: 'April 19, 2026', time: '1:00 PM – 4:00 PM', location: 'IT Lab 2', desc: 'Understand AWS Identity and Access Management in practice.' },
];

function getEvents() { return JSON.parse(localStorage.getItem('flurryEvents') || 'null') || DEFAULT_EVENTS; }
function saveEvents(evs) { localStorage.setItem('flurryEvents', JSON.stringify(evs)); }
function getUsers() {
    const stored = JSON.parse(localStorage.getItem('flurryUser') || 'null');
    const all = JSON.parse(localStorage.getItem('flurryUsers') || '[]');
    if (stored && !all.find(u => u.email === stored.email)) all.push(stored);
    return all;
}

function saveUsers(users) { localStorage.setItem('flurryUsers', JSON.stringify(users)); }

function getEnrollments() {
    return JSON.parse(localStorage.getItem('enrolledWorkshops') || '[]');
}

function getUserEnrollments() {
    const base = getEnrollments();
    const users = getUsers();
    const user = JSON.parse(localStorage.getItem('flurryUser') || 'null');
    if (!user) return [];
    return base.map(e => ({
        userEmail: user.email,
        userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        title: e.title || e,
        date: e.date || '—',
        time: e.time || '—',
        enrolledAt: e.enrolledAt || '—',
    }));
}

function showToast(msg, success = true) {
    const toast = document.getElementById('adminToast');
    const msgEl = document.getElementById('adminToastMsg');
    const iconEl = document.getElementById('adminToastIcon');
    msgEl.textContent = msg;
    iconEl.className = success ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    iconEl.style.color = success ? '#86efac' : '#fbbf24';
    toast.style.display = 'flex';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 3200);
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initTheme() {
    const saved = localStorage.getItem('lumioTheme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved || system);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lumioTheme', next);
}

function initLogin() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const hidden = input.type === 'password';
            input.type = hidden ? 'text' : 'password';
            btn.querySelector('i').classList.toggle('fa-eye-slash', !hidden);
            btn.querySelector('i').classList.toggle('fa-eye', hidden);
        });
    });
}

function initApp() {
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('section-' + btn.dataset.section).classList.add('active');
            document.getElementById('adminBreadcrumb').textContent = btn.querySelector('span').textContent;
            document.getElementById('adminSidebar').classList.remove('open');
            document.getElementById('adminSidebarOverlay')?.classList.remove('visible');
        });
    });

    const overlay = document.getElementById('adminSidebarOverlay');
    document.getElementById('adminMenuToggle').addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('open');
        overlay?.classList.toggle('visible');
    });
    overlay?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.remove('open');
        overlay.classList.remove('visible');
    });

    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem(ADMIN_KEY);
        location.reload();
    });

    if (!localStorage.getItem('flurryEvents')) saveEvents(DEFAULT_EVENTS);

    // renderDashboard();
    // renderUsers();
    // renderEvents();
    // renderEnrollments();
    setupDjangoListeners();
}

function renderDashboard() {
    const users = getUsers();
    const evs = getEvents();
    const enrolls = getUserEnrollments();

    // Statistics are now handled by Django template tags
    /*
    document.getElementById('statTotalUsers').textContent       = users.length;
    document.getElementById('statTotalEnrollments').textContent = enrolls.length;
    document.getElementById('statTotalEvents').textContent      = evs.length;
    const avg = users.length ? (enrolls.length / users.length).toFixed(1) : 0;
    document.getElementById('statAvgEnroll').textContent = avg;
    */

    const countMap = {};
    enrolls.forEach(e => { countMap[e.title] = (countMap[e.title] || 0) + 1; });
    const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
    const topEl = document.getElementById('topEvents');
    if (!sorted.length) {
        topEl.innerHTML = '<div class="dash-empty">No enrollments yet.</div>';
    } else {
        topEl.innerHTML = sorted.map(([title, count]) =>
            `<div class="dash-row">
                <span class="dash-row-title">${escHtml(title)}</span>
                <span class="dash-row-badge">${count} enrolled</span>
            </div>`
        ).join('');
    }

    const recentEl = document.getElementById('recentRegs');
    const recentUsers = [...users].reverse().slice(0, 6);
    if (!recentUsers.length) {
        recentEl.innerHTML = '<div class="dash-empty">No users yet.</div>';
    } else {
        recentEl.innerHTML = recentUsers.map(u =>
            `<div class="dash-row">
                <span class="dash-row-title">${escHtml([u.firstName, u.lastName].filter(Boolean).join(' ') || u.email)}</span>
                <span class="dash-row-meta">${escHtml(u.course || '—')}</span>
            </div>`
        ).join('');
    }
}

function filterTable(tbodyId, searchStr, filterStr = '', filterColumnIndex = -1) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = tbody.getElementsByTagName('tr');
    const search = searchStr.toLowerCase();

    let visibleCount = 0;
    for (let row of rows) {
        if (row.cells.length < 2) continue; // Skip "No users found" row
        let text = row.textContent.toLowerCase();
        let matchesSearch = text.includes(search);
        let matchesFilter = true;
        
        if (filterStr && filterColumnIndex >= 0) {
            const cell = row.cells[filterColumnIndex];
            if (cell) {
                matchesFilter = cell.textContent.trim() === filterStr;
            }
        }
        
        const isVisible = matchesSearch && matchesFilter;
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    }

    // Handle empty state visibility
    const empty = document.getElementById(tbodyId.replace('Body', 'Empty'));
    const table = document.getElementById(tbodyId.replace('Body', ''));
    if (empty && table) {
        if (visibleCount === 0 && rows.length > 0) {
            empty.style.display = 'flex';
            table.style.display = 'none';
        } else {
            empty.style.display = 'none';
            table.style.display = '';
        }
    }
}

document.getElementById('userSearch')?.addEventListener('input', e => {
    filterTable('usersTableBody', e.target.value);
});

function renderEvents() {
    const evs = getEvents();
    const enrolls = getUserEnrollments();
    const grid = document.getElementById('eventsAdminGrid');
    const empty = document.getElementById('eventsEmpty');

    // document.getElementById('eventCount').textContent = `${evs.length} event${evs.length !== 1 ? 's' : ''}`;

    if (!evs.length) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = evs.map(ev => {
        const count = enrolls.filter(e => e.title === ev.title).length;
        return `<div class="event-admin-card" data-ev-id="${escHtml(ev.id)}">
            <div class="event-admin-card-header">
                <h4>${escHtml(ev.title)}</h4>
                <span class="admin-tag">${escHtml(ev.tag)}</span>
            </div>
            <div class="event-admin-meta">
                <span><i class="fa-regular fa-calendar"></i>${escHtml(ev.date)}</span>
                <span><i class="fa-regular fa-clock"></i>${escHtml(ev.time)}</span>
                ${ev.location ? `<span><i class="fa-solid fa-location-dot"></i>${escHtml(ev.location)}</span>` : ''}
            </div>
            <div class="event-admin-footer">
                <span class="event-enroll-count"><i class="fa-solid fa-users"></i> ${count} enrolled</span>
                <div class="admin-actions">
                    <button class="admin-btn-icon" title="Edit" data-edit-ev="${escHtml(ev.id)}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="admin-btn-icon admin-btn-icon--danger" title="Delete" data-delete-ev="${escHtml(ev.id)}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-edit-ev]').forEach(btn => {
        btn.addEventListener('click', () => {
            const ev = getEvents().find(e => e.id === btn.dataset.editEv);
            if (ev) openEventModal(ev);
        });
    });

    grid.querySelectorAll('[data-delete-ev]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.deleteEv;
            const ev = getEvents().find(e => e.id === id);
            openDeleteModal('Delete Event?', `Remove "${ev?.title}"? This cannot be undone.`, () => {
                saveEvents(getEvents().filter(e => e.id !== id));
                renderEvents();
                renderDashboard();
                showToast('Event deleted.');
            });
        });
    });
}

function openEventModal(ev = null) {
    const modal = document.getElementById('eventModalOverlay');
    const titleEl = document.getElementById('eventModalTitle');
    const idInput = document.getElementById('eventId');
    ['evTitleErr', 'evDateErr', 'evTimeErr'].forEach(id => document.getElementById(id).textContent = '');

    if (ev) {
        titleEl.textContent = 'Edit Event';
        idInput.value = ev.id;
        document.getElementById('evTitle').value = ev.title;
        document.getElementById('evDate').value = ev.date;
        document.getElementById('evTime').value = ev.time;
        document.getElementById('evTag').value = ev.tag;
        document.getElementById('evLocation').value = ev.location || '';
        document.getElementById('evDesc').value = ev.desc || '';
    } else {
        titleEl.textContent = 'Add Event';
        document.getElementById('eventForm').reset();
        idInput.value = 'ev' + Date.now();
    }

    modal.style.display = 'flex';
}

document.getElementById('addEventBtn')?.addEventListener('click', () => openEventModal());
document.getElementById('eventModalClose')?.addEventListener('click', () => {
    document.getElementById('eventModalOverlay').style.display = 'none';
});
document.getElementById('eventModalCancel')?.addEventListener('click', () => {
    document.getElementById('eventModalOverlay').style.display = 'none';
});
document.getElementById('eventModalOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
});

document.getElementById('eventForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('evTitle').value.trim();
    const date = document.getElementById('evDate').value.trim();
    const time = document.getElementById('evTime').value.trim();
    let ok = true;

    document.getElementById('evTitleErr').textContent = '';
    document.getElementById('evDateErr').textContent = '';
    document.getElementById('evTimeErr').textContent = '';

    if (!title) { document.getElementById('evTitleErr').textContent = 'Title is required'; ok = false; }
    if (!date) { document.getElementById('evDateErr').textContent = 'Date is required'; ok = false; }
    if (!time) { document.getElementById('evTimeErr').textContent = 'Time is required'; ok = false; }
    if (!ok) return;

    const id = document.getElementById('eventId').value;
    const evs = getEvents();
    const idx = evs.findIndex(e => e.id === id);

    const updated = {
        id,
        title,
        date,
        time,
        tag: document.getElementById('evTag').value,
        location: document.getElementById('evLocation').value.trim(),
        desc: document.getElementById('evDesc').value.trim(),
    };

    if (idx >= 0) evs[idx] = updated;
    else evs.push(updated);

    saveEvents(evs);
    document.getElementById('eventModalOverlay').style.display = 'none';
    renderEvents();
    renderDashboard();
    showToast(idx >= 0 ? 'Event updated.' : 'Event added.');
});

function setupEnrollmentFilters() {
    const tbody = document.getElementById('enrollTableBody');
    const sel = document.getElementById('enrollFilter');
    if (!tbody || !sel) return;

    const rows = tbody.getElementsByTagName('tr');
    const eventTitles = new Set();
    for (let row of rows) {
        if (row.cells.length >= 3) {
            eventTitles.add(row.cells[2].textContent.trim());
        }
    }

    eventTitles.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        sel.appendChild(opt);
    });

    const searchInput = document.getElementById('enrollSearch');
    const handleInput = () => {
        filterTable('enrollTableBody', searchInput.value, sel.value, 2);
    };

    searchInput?.addEventListener('input', handleInput);
    sel?.addEventListener('change', handleInput);
}

let _deleteCallback = null;

function openDeleteModal(title, desc, onConfirm) {
    document.getElementById('deleteModalTitle').textContent = title;
    document.getElementById('deleteModalDesc').textContent = desc;
    _deleteCallback = onConfirm;
    document.getElementById('deleteModalOverlay').style.display = 'flex';
}

document.getElementById('deleteCancel')?.addEventListener('click', () => {
    document.getElementById('deleteModalOverlay').style.display = 'none';
    _deleteCallback = null;
});
document.getElementById('deleteConfirm')?.addEventListener('click', () => {
    document.getElementById('deleteModalOverlay').style.display = 'none';
    if (_deleteCallback) { _deleteCallback(); _deleteCallback = null; }
});
document.getElementById('deleteModalOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
        e.currentTarget.style.display = 'none';
        _deleteCallback = null;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    document.getElementById('loginThemeBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('appThemeBtn')?.addEventListener('click', toggleTheme);

    initLogin();

    const adminApp = document.getElementById('adminApp');
    if (adminApp) {
        initApp();
        setupEnrollmentFilters();
    }

    // Hide skeleton loader after initialization
    const loader = document.getElementById('skeleton-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300); // Small delay for smooth transition
    }
});
