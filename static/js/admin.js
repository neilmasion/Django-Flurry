const ADMIN_CREDS = { email: 'admin@flurry.com', password: 'admin123' };
const ADMIN_KEY   = 'flurryAdminAuth';
const DEFAULT_EVENTS = [
    { id: 'ev1', title: 'AWS Cloud Practitioner Bootcamp',          tag: 'Bootcamp',  date: 'March 15, 2026',  time: '9:00 AM – 5:00 PM',  location: 'Room 401, IT Building', desc: 'A full-day intensive prep session for the AWS Certified Cloud Practitioner exam.' },
    { id: 'ev2', title: 'Building Serverless APIs with Lambda',      tag: 'Workshop',  date: 'March 22, 2026',  time: '2:00 PM – 5:00 PM',  location: 'CS Lab 3',              desc: 'Deploy a real REST API using AWS Lambda, API Gateway, and DynamoDB from scratch.' },
    { id: 'ev3', title: 'Cloud Careers: From Student to AWS Engineer', tag: 'Tech Talk', date: 'April 5, 2026',   time: '3:00 PM – 5:00 PM',  location: 'Auditorium B',          desc: 'Industry professionals share their journey into cloud engineering.' },
    { id: 'ev4', title: 'IAM & Security Deep Dive',                  tag: 'Workshop',  date: 'April 19, 2026',  time: '1:00 PM – 4:00 PM',  location: 'IT Lab 2',              desc: 'Understand AWS Identity and Access Management in practice.' },
];

function getEvents()     { return JSON.parse(localStorage.getItem('flurryEvents') || 'null') || DEFAULT_EVENTS; }
function saveEvents(evs) { localStorage.setItem('flurryEvents', JSON.stringify(evs)); }
function getUsers() {
    const stored = JSON.parse(localStorage.getItem('flurryUser') || 'null');
    const all    = JSON.parse(localStorage.getItem('flurryUsers') || '[]');
    if (stored && !all.find(u => u.email === stored.email)) all.push(stored);
    return all;
}

function saveUsers(users) { localStorage.setItem('flurryUsers', JSON.stringify(users)); }

function getEnrollments() {
    return JSON.parse(localStorage.getItem('enrolledWorkshops') || '[]');
}

function getUserEnrollments() {
    const base  = getEnrollments();
    const users = getUsers();
    const user  = JSON.parse(localStorage.getItem('flurryUser') || 'null');
    if (!user) return [];
    return base.map(e => ({
        userEmail:  user.email,
        userName:   [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        title:      e.title || e,
        date:       e.date  || '—',
        time:       e.time  || '—',
        enrolledAt: e.enrolledAt || '—',
    }));
}

function showToast(msg, success = true) {
    const toast  = document.getElementById('adminToast');
    const msgEl  = document.getElementById('adminToastMsg');
    const iconEl = document.getElementById('adminToastIcon');
    msgEl.textContent  = msg;
    iconEl.className   = success ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    iconEl.style.color = success ? '#86efac' : '#fbbf24';
    toast.style.display = 'flex';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 3200);
}

function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function initTheme() {
    const saved  = localStorage.getItem('lumioTheme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved || system);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lumioTheme', next);
}

function initLogin() {
    if (localStorage.getItem(ADMIN_KEY) === 'true') {
        showApp();
        return;
    }

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input   = document.getElementById(btn.dataset.target);
            if (!input) return;
            const hidden  = input.type === 'password';
            input.type    = hidden ? 'text' : 'password';
            btn.querySelector('i').classList.toggle('fa-eye-slash', !hidden);
            btn.querySelector('i').classList.toggle('fa-eye', hidden);
        });
    });

    document.getElementById('adminLoginForm').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value.trim();
        const pass  = document.getElementById('adminPass').value;
        document.getElementById('adminEmailErr').textContent = '';
        document.getElementById('adminPassErr').textContent  = '';

        let ok = true;
        if (!email) { document.getElementById('adminEmailErr').textContent = 'Email is required'; ok = false; }
        if (!pass)  { document.getElementById('adminPassErr').textContent  = 'Password is required'; ok = false; }
        if (!ok) return;

        if (email !== ADMIN_CREDS.email || pass !== ADMIN_CREDS.password) {
            document.getElementById('adminPassErr').textContent = 'Invalid admin credentials';
            return;
        }

        localStorage.setItem(ADMIN_KEY, 'true');
        showApp();
    });
}

function showApp() {
    document.getElementById('adminLoginWrap').style.display = 'none';
    document.getElementById('adminApp').style.display       = 'flex';
    initApp();
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

    renderDashboard();
    renderUsers();
    renderEvents();
    renderEnrollments();
}

function renderDashboard() {
    const users   = getUsers();
    const evs     = getEvents();
    const enrolls = getUserEnrollments();

    document.getElementById('statTotalUsers').textContent       = users.length;
    document.getElementById('statTotalEnrollments').textContent = enrolls.length;
    document.getElementById('statTotalEvents').textContent      = evs.length;
    const avg = users.length ? (enrolls.length / users.length).toFixed(1) : 0;
    document.getElementById('statAvgEnroll').textContent = avg;

    const countMap = {};
    enrolls.forEach(e => { countMap[e.title] = (countMap[e.title] || 0) + 1; });
    const sorted = Object.entries(countMap).sort((a,b) => b[1]-a[1]);
    const topEl  = document.getElementById('topEvents');
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
                <span class="dash-row-title">${escHtml([u.firstName,u.lastName].filter(Boolean).join(' ') || u.email)}</span>
                <span class="dash-row-meta">${escHtml(u.course || '—')}</span>
            </div>`
        ).join('');
    }
}

function renderUsers(filter = '') {
    const enrolls = getUserEnrollments();
    let users = getUsers();
    if (filter) {
        const f = filter.toLowerCase();
        users = users.filter(u =>
            [u.firstName, u.lastName, u.email].join(' ').toLowerCase().includes(f)
        );
    }

    document.getElementById('userCount').textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;
    const tbody = document.getElementById('usersTableBody');
    const empty = document.getElementById('usersEmpty');

    if (!users.length) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        document.getElementById('usersTable').style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    document.getElementById('usersTable').style.display = '';

    tbody.innerHTML = users.map((u, idx) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
        const enrolled = enrolls.filter(e => e.userEmail === u.email).length;
        return `<tr>
            <td class="name-cell" data-label="Name">${escHtml(name)}</td>
            <td data-label="Email">${escHtml(u.email)}</td>
            <td data-label="Course">${escHtml(u.course || '—')}</td>
            <td data-label="Year">${escHtml(u.year || '—')}</td>
            <td data-label="Enrolled"><span class="admin-tag admin-tag--green">${enrolled}</span></td>
            <td data-label="">
                <div class="admin-actions">
                    <button class="admin-btn-icon admin-btn-icon--danger" title="Delete user" data-delete-user="${escHtml(u.email)}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-delete-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.dataset.deleteUser;
            openDeleteModal('Delete User?', `Remove "${email}" from Flurry? This cannot be undone.`, () => {
                let users = getUsers().filter(u => u.email !== email);
                saveUsers(users);
                // Also clear if it's the single flurryUser
                const single = JSON.parse(localStorage.getItem('flurryUser') || 'null');
                if (single && single.email === email) localStorage.removeItem('flurryUser');
                renderUsers(document.getElementById('userSearch').value);
                renderDashboard();
                showToast('User deleted.');
            });
        });
    });
}

document.getElementById('userSearch')?.addEventListener('input', e => {
    renderUsers(e.target.value);
});

function renderEvents() {
    const evs     = getEvents();
    const enrolls = getUserEnrollments();
    const grid    = document.getElementById('eventsAdminGrid');
    const empty   = document.getElementById('eventsEmpty');

    document.getElementById('eventCount').textContent = `${evs.length} event${evs.length !== 1 ? 's' : ''}`;

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
    const modal     = document.getElementById('eventModalOverlay');
    const titleEl   = document.getElementById('eventModalTitle');
    const idInput   = document.getElementById('eventId');
    ['evTitleErr','evDateErr','evTimeErr'].forEach(id => document.getElementById(id).textContent = '');

    if (ev) {
        titleEl.textContent                        = 'Edit Event';
        idInput.value                              = ev.id;
        document.getElementById('evTitle').value   = ev.title;
        document.getElementById('evDate').value    = ev.date;
        document.getElementById('evTime').value    = ev.time;
        document.getElementById('evTag').value     = ev.tag;
        document.getElementById('evLocation').value= ev.location || '';
        document.getElementById('evDesc').value    = ev.desc    || '';
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
    const date  = document.getElementById('evDate').value.trim();
    const time  = document.getElementById('evTime').value.trim();
    let ok = true;

    document.getElementById('evTitleErr').textContent = '';
    document.getElementById('evDateErr').textContent  = '';
    document.getElementById('evTimeErr').textContent  = '';

    if (!title) { document.getElementById('evTitleErr').textContent = 'Title is required'; ok = false; }
    if (!date)  { document.getElementById('evDateErr').textContent  = 'Date is required';  ok = false; }
    if (!time)  { document.getElementById('evTimeErr').textContent  = 'Time is required';  ok = false; }
    if (!ok) return;

    const id  = document.getElementById('eventId').value;
    const evs = getEvents();
    const idx = evs.findIndex(e => e.id === id);

    const updated = {
        id,
        title,
        date,
        time,
        tag:      document.getElementById('evTag').value,
        location: document.getElementById('evLocation').value.trim(),
        desc:     document.getElementById('evDesc').value.trim(),
    };

    if (idx >= 0) evs[idx] = updated;
    else          evs.push(updated);

    saveEvents(evs);
    document.getElementById('eventModalOverlay').style.display = 'none';
    renderEvents();
    renderDashboard();
    showToast(idx >= 0 ? 'Event updated.' : 'Event added.');
});

function renderEnrollments(filter = '', eventFilter = '') {
    let enrolls = getUserEnrollments();

    const sel = document.getElementById('enrollFilter');
    if (sel.options.length <= 1) {
        const titles = [...new Set(enrolls.map(e => e.title))];
        titles.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            sel.appendChild(opt);
        });
    }

    if (filter) {
        const f = filter.toLowerCase();
        enrolls = enrolls.filter(e =>
            e.userName.toLowerCase().includes(f) ||
            e.title.toLowerCase().includes(f) ||
            e.userEmail.toLowerCase().includes(f)
        );
    }
    if (eventFilter) {
        enrolls = enrolls.filter(e => e.title === eventFilter);
    }

    document.getElementById('enrollCount').textContent =
        `${enrolls.length} enrollment${enrolls.length !== 1 ? 's' : ''}`;

    const tbody = document.getElementById('enrollTableBody');
    const empty = document.getElementById('enrollEmpty');

    if (!enrolls.length) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        document.getElementById('enrollTable').style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    document.getElementById('enrollTable').style.display = '';

    tbody.innerHTML = enrolls.map(e => {
        const when = e.enrolledAt && e.enrolledAt !== '—'
            ? new Date(e.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';
        return `<tr>
            <td class="name-cell" data-label="User">${escHtml(e.userName)}</td>
            <td data-label="Email">${escHtml(e.userEmail)}</td>
            <td data-label="Event">${escHtml(e.title)}</td>
            <td data-label="Date">${escHtml(e.date)}</td>
            <td data-label="Time">${escHtml(e.time)}</td>
            <td data-label="Enrolled At">${escHtml(when)}</td>
        </tr>`;
    }).join('');
}

document.getElementById('enrollSearch')?.addEventListener('input', e => {
    renderEnrollments(e.target.value, document.getElementById('enrollFilter').value);
});
document.getElementById('enrollFilter')?.addEventListener('change', e => {
    renderEnrollments(document.getElementById('enrollSearch').value, e.target.value);
});

let _deleteCallback = null;

function openDeleteModal(title, desc, onConfirm) {
    document.getElementById('deleteModalTitle').textContent = title;
    document.getElementById('deleteModalDesc').textContent  = desc;
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
});