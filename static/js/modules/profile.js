const PHOTO_KEY = 'flurryUserPhoto';

const EVENT_INFO = {
    'AWS Cloud Practitioner Bootcamp':             { date: 'March 15, 2026',  time: '9:00 AM – 5:00 PM' },
    'Building Serverless APIs with Lambda':        { date: 'March 22, 2026',  time: '2:00 PM – 5:00 PM' },
    'Cloud Careers: From Student to AWS Engineer': { date: 'April 5, 2026',   time: '3:00 PM – 5:00 PM' },
    'IAM & Security Deep Dive':                    { date: 'April 19, 2026',  time: '1:00 PM – 4:00 PM' },
};

function backfillEnrolled() {
    const enrolled = JSON.parse(localStorage.getItem('enrolledWorkshops') || '[]');
    let changed = false;
    const updated = enrolled.map(e => {
        const info = EVENT_INFO[e.title || e];
        if (info && (!e.date || e.date === '—' || !e.time || e.time === '—')) {
            changed = true;
            return { ...e, date: info.date, time: info.time };
        }
        return e;
    });
    if (changed) localStorage.setItem('enrolledWorkshops', JSON.stringify(updated));
    return updated;
}

function getUser() {
    return JSON.parse(localStorage.getItem('flurryUser') || 'null');
}

function getPhoto() {
    return localStorage.getItem(PHOTO_KEY) || null;
}

function getInitials(user) {
    if (!user) return '?';
    const f = user.firstName?.[0] || '';
    const l = user.lastName?.[0] || '';
    return (f + l).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
}

function applyPhotoToEl(el, photo, initials) {
    if (!el) return;
    if (photo) {
        el.innerHTML = `<img src="${photo}" alt="Profile photo">`;
    } else {
        el.textContent = initials;
    }
}

function refreshAllAvatars(photo, initials) {
    applyPhotoToEl(document.getElementById('profileAvatar'),    photo, initials);
    applyPhotoToEl(document.getElementById('welcomeAvatar'),    photo, initials);
    applyPhotoToEl(document.getElementById('editPhotoPreview'), photo, initials);

    const navAvatar = document.getElementById('userAvatarNav');
    if (navAvatar) {
        if (photo) {
            navAvatar.innerHTML = `<img src="${photo}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
        } else {
            navAvatar.innerHTML = '';
            navAvatar.textContent = initials;
        }
    }
}

function setupTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
        });
    });
}

function loadProfileData() {
    const user = getUser();
    if (!user) { window.location.href = 'account.html'; return; }

    const initials = getInitials(user);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    const photo    = getPhoto();

    refreshAllAvatars(photo, initials);

    setEl('profileFullName', fullName);
    setEl('profileEmail',    user.email);
    setEl('profileCourse',   user.course);
    setEl('profileYear',     user.year);
    setEl('welcomeName',     user.firstName || fullName);
    setEl('userName',        user.firstName || fullName);

    const bioEl = document.getElementById('welcomeBio');
    if (bioEl) bioEl.textContent = user.bio || 'No bio yet. Add one in Edit Profile!';

    const enrolled = backfillEnrolled();
    setEl('statEnrolled', enrolled.length);
    renderEnrolled(enrolled);
    prefillEditForm(user);
}

function renderEnrolled(enrolled) {
    const grid = document.getElementById('enrolledGrid');
    if (!grid || !enrolled.length) return;

    const header = `<div class="enrolled-table-header">
        <span>Event</span>
        <span>Date</span>
        <span>Time</span>
        <span>Status</span>
    </div>`;

    const rows = enrolled.map(w => {
        const title = w.title || w;
        const date  = w.date  || '—';
        const time  = w.time  || '—';
        return `<div class="enrolled-card">
            <h4>${title}</h4>
            <div class="enrolled-card-date"><i class="fa-regular fa-calendar"></i> ${date}</div>
            <div class="enrolled-card-time"><i class="fa-regular fa-clock"></i> ${time}</div>
            <div><span class="enrolled-card-status"><i class="fa-solid fa-circle-check"></i> Enrolled</span></div>
        </div>`;
    }).join('');

    grid.innerHTML = header + rows;
}

function prefillEditForm(user) {
    const map = {
        editFirstName: user.firstName,
        editLastName:  user.lastName,
        editEmail:     user.email,
        editCourse:    user.course,
        editYear:      user.year,
        editBio:       user.bio
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
    });
}

function updateAvatarActionBtn() {
    const btn  = document.getElementById('avatarActionBtn');
    const icon = document.getElementById('avatarActionIcon');
    if (!btn || !icon) return;
    const hasPhoto = !!getPhoto();
    icon.className = hasPhoto ? 'fa-solid fa-trash' : 'fa-solid fa-camera';
    btn.title      = hasPhoto ? 'Remove photo' : 'Change photo';
    btn.dataset.mode = hasPhoto ? 'remove' : 'upload';
}

function doRemovePhoto() {
    localStorage.removeItem(PHOTO_KEY);
    refreshAllAvatars(null, getInitials(getUser()));
    ['avatarInput','avatarInput2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    updateAvatarActionBtn();
}

function setupPhotoUpload() {
    function handleFile(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
        const reader = new FileReader();
        reader.onload = e => {
            localStorage.setItem(PHOTO_KEY, e.target.result);
            refreshAllAvatars(e.target.result, getInitials(getUser()));
            updateAvatarActionBtn();
        };
        reader.readAsDataURL(file);
    }

    // Sidebar action button — camera or trash depending on state
    const actionBtn = document.getElementById('avatarActionBtn');
    const fileInput = document.getElementById('avatarInput');
    if (actionBtn && fileInput) {
        actionBtn.addEventListener('click', () => {
            if (actionBtn.dataset.mode === 'remove') {
                // Show confirm modal
                const modal = document.getElementById('removePhotoModal');
                if (modal) modal.style.display = 'flex';
            } else {
                fileInput.click();
            }
        });
        fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
    }

    // Confirm modal buttons
    document.getElementById('removePhotoConfirm')?.addEventListener('click', () => {
        doRemovePhoto();
        document.getElementById('removePhotoModal').style.display = 'none';
    });
    document.getElementById('removePhotoCancel')?.addEventListener('click', () => {
        document.getElementById('removePhotoModal').style.display = 'none';
    });
    // Close on backdrop click
    document.getElementById('removePhotoModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });

    // Edit tab upload button
    const avatarInput2 = document.getElementById('avatarInput2');
    if (avatarInput2) avatarInput2.addEventListener('change', () => handleFile(avatarInput2.files[0]));

    // Edit tab remove button
    document.getElementById('removePhotoBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('removePhotoModal');
        if (modal) modal.style.display = 'flex';
    });

    updateAvatarActionBtn();
}

function setupEditForm() {
    const form = document.getElementById('editForm');
    if (!form) return;

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input  = document.getElementById(btn.dataset.target);
            if (!input) return;
            const hidden = input.type === 'password';
            input.type   = hidden ? 'text' : 'password';
            btn.querySelector('i').classList.toggle('fa-eye-slash', !hidden);
            btn.querySelector('i').classList.toggle('fa-eye', hidden);
        });
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const successEl = document.getElementById('editSuccess');
        const errorEl   = document.getElementById('editError');
        successEl.style.display = 'none';
        errorEl.style.display   = 'none';

        const user = getUser();
        if (!user) return;

        const currentPw = document.getElementById('editCurrentPassword').value;
        const newPw     = document.getElementById('editNewPassword').value;
        const confirmPw = document.getElementById('editConfirmPassword').value;

        if (currentPw || newPw || confirmPw) {
            if (currentPw !== user.password) {
                errorEl.textContent = 'Current password is incorrect.';
                errorEl.style.display = 'inline'; return;
            }
            if (newPw.length < 6) {
                errorEl.textContent = 'New password must be at least 6 characters.';
                errorEl.style.display = 'inline'; return;
            }
            if (newPw !== confirmPw) {
                errorEl.textContent = 'Passwords do not match.';
                errorEl.style.display = 'inline'; return;
            }
            user.password = newPw;
        }

        user.firstName = document.getElementById('editFirstName').value.trim() || user.firstName;
        user.lastName  = document.getElementById('editLastName').value.trim()  || user.lastName;
        user.email     = document.getElementById('editEmail').value.trim()     || user.email;
        user.course    = document.getElementById('editCourse').value           || user.course;
        user.year      = document.getElementById('editYear').value             || user.year;
        user.bio       = document.getElementById('editBio').value.trim();

        localStorage.setItem('flurryUser', JSON.stringify(user));

        ['editCurrentPassword','editNewPassword','editConfirmPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        successEl.style.display = 'inline';
        setTimeout(() => { successEl.style.display = 'none'; }, 3000);
        loadProfileData();
    });
}

function setupLogout() {
    ['profileLogoutBtn','logoutBtn'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => {
            localStorage.removeItem('flurryAuth');
            window.location.href = 'index.html';
        });
    });
}

function setupUserMenu() {
    const menu    = document.getElementById('userMenu');
    const menuBtn = document.getElementById('userMenuBtn');
    if (!menu || !menuBtn) return;

    if (localStorage.getItem('flurryAuth') === 'true') {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        menu.style.display = 'block';
    }

    menuBtn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadProfileData();
    setupPhotoUpload();
    setupEditForm();
    setupLogout();
    setupUserMenu();
});