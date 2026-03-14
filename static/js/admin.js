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

    // Event management logic is now handled by Django
    // if (!localStorage.getItem('flurryEvents')) saveEvents(DEFAULT_EVENTS);

    // renderDashboard();
    // renderUsers();
    // renderEvents();
    // renderEnrollments();
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

    /* Local storage rendering removed in favor of Django templates
    grid.querySelectorAll('[data-delete-ev]').forEach(btn => {
        ...
    });
    */

function showEventStep(step) {
    currentEventStep = step;
    
    // Update steps visibility
    document.querySelectorAll('.modal-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update stepper UI
    document.querySelectorAll('.stepper-item').forEach(item => {
        const s = parseInt(item.dataset.step);
        item.classList.remove('active', 'completed');
        if (s === step) item.classList.add('active');
        if (s < step) item.classList.add('completed');
    });
    
    // Update footer buttons
    document.getElementById('prevStep').style.display = step === 1 ? 'none' : 'block';
    document.getElementById('nextStep').style.display = step === 3 ? 'none' : 'block';
    document.getElementById('finishStep').style.display = step === 3 ? 'block' : 'none';
}

function openEventModal(data = null) {
    const modal = document.getElementById('eventModalOverlay');
    const titleEl = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');

    showEventStep(1);

    if (data) {
        titleEl.textContent = 'Edit Event';
        form.action = `/edit-event/${data.id}/`;
        document.getElementById('evTitle').value = data.title;
        document.getElementById('evMonth').value = data.month;
        document.getElementById('evDay').value = data.day;
        document.getElementById('evDate').value = data.date || '';
        document.getElementById('evStartTime').value = data.starttime || '';
        document.getElementById('evEndTime').value = data.endtime || '';
        document.getElementById('evTimeRange').value = data.timerange;
        document.getElementById('evLocation').value = data.location;
        document.getElementById('evType').value = data.type;
        // Extract only numbers from "X spots left"
        const numericSpots = data.spots ? data.spots.replace(/[^0-9]/g, '') : '';
        document.getElementById('evSpots').value = numericSpots;
        document.getElementById('evDescription').value = data.description;
        document.getElementById('evIsFeatured').checked = data.featured === 'true';
    } else {
        titleEl.textContent = 'Add New Event';
        form.action = '/create-event/';
        form.reset();
        document.getElementById('evIsFeatured').checked = false;
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

// Event form now submits normally to Django backend
document.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-ev]');
    if (editBtn) {
        const card = editBtn.closest('.event-admin-card');
        if (card) {
            openEventModal({
                id: card.dataset.evId,
                title: card.dataset.evTitle,
                description: card.dataset.evDescription,
                day: card.dataset.evDay,
                month: card.dataset.evMonth,
                timerange: card.dataset.evTimerange,
                location: card.dataset.evLocation,
                spots: card.dataset.evSpots,
                date: card.dataset.evDate,
                starttime: card.dataset.evStarttime,
                endtime: card.dataset.evEndtime,
                type: card.dataset.evType,
                featured: card.dataset.evFeatured
            });
        }
    }
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

function setupModalHandlers() {
    // Handle Delete Forms
    document.addEventListener('submit', e => {
        const form = e.target.closest('.delete-form');
        if (form && !form.dataset.confirmed) {
            e.preventDefault();
            const title = form.dataset.title || 'Are you sure?';
            const confirmMsg = form.dataset.confirm || 'This action cannot be undone.';
            openDeleteModal(title, confirmMsg, () => {
                form.dataset.confirmed = 'true';
                form.submit();
            });
        }
    });

    // Handle View Message Buttons
    document.addEventListener('click', e => {
        const btn = e.target.closest('.view-msg-btn');
        if (btn) {
            const { name, email, subject, message } = btn.dataset;
            document.getElementById('msgModalName').textContent = name;
            document.getElementById('msgModalEmail').textContent = email;
            document.getElementById('msgModalSubject').textContent = subject;
            document.getElementById('msgModalBody').textContent = message;
            document.getElementById('messageModalOverlay').style.display = 'flex';
        }
    });

    // Message Modal Close
    document.getElementById('messageModalClose')?.addEventListener('click', () => {
        document.getElementById('messageModalOverlay').style.display = 'none';
    });
    document.getElementById('messageModalOverlay')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });

    // Step navigation buttons
    document.getElementById('nextStep')?.addEventListener('click', () => {
        if (currentEventStep < 3) {
            // Validate current step before proceeding
            const currentStepEl = document.getElementById(`step${currentEventStep}`);
            const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
            let allValid = true;
            
            for (const input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    allValid = false;
                    break;
                }
            }
            
            if (allValid) showEventStep(currentEventStep + 1);
        }
    });

    document.getElementById('prevStep')?.addEventListener('click', () => {
        if (currentEventStep > 1) showEventStep(currentEventStep - 1);
    });
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

let currentEventStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    document.getElementById('loginThemeBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('appThemeBtn')?.addEventListener('click', toggleTheme);

    initLogin();

    const adminApp = document.getElementById('adminApp');
    if (adminApp) {
        initApp();
        setupEnrollmentFilters();
        setupModalHandlers();
        
        // Auto-populate Month and Day from Date input
        const dateInput = document.getElementById('evDate');
        const monthInput = document.getElementById('evMonth');
        const dayInput = document.getElementById('evDay');
        
        dateInput?.addEventListener('change', () => {
            if (!dateInput.value) return;
            
            const dateObj = new Date(dateInput.value);
            // Get 3-letter month (e.g., MAR)
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            // Get day number
            const day = dateObj.getDate();
            
            monthInput.value = month;
            dayInput.value = day;
            
            // Trigger change events if necessary for validation
            monthInput.dispatchEvent(new Event('input'));
            dayInput.dispatchEvent(new Event('input'));
        });

        // Auto-format Time Range from Start/End Time
        const startTimeInput = document.getElementById('evStartTime');
        const endTimeInput = document.getElementById('evEndTime');
        const timeRangeInput = document.getElementById('evTimeRange');

        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return `${h}:${minutes} ${ampm}`;
        };

        const updateTimeRange = () => {
            const startStr = formatTime(startTimeInput.value);
            const endStr = formatTime(endTimeInput.value);
            if (startStr && endStr) {
                timeRangeInput.value = `${startStr} – ${endStr}`;
            } else if (startStr) {
                timeRangeInput.value = startStr;
            } else {
                timeRangeInput.value = '';
            }
        };

        startTimeInput?.addEventListener('change', updateTimeRange);
        endTimeInput?.addEventListener('change', updateTimeRange);
    }

    // Hide skeleton loader after initialization
    const loader = document.getElementById('skeleton-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300); // Small delay for smooth transition
    }
});
