const userEmail = document.body.dataset.email || 'guest';
const PHOTO_KEY = `flurryUserPhoto_${userEmail}`;
const ENROLLED_KEY = `enrolledWorkshops_${userEmail}`;

function getPhoto() {
    return localStorage.getItem(PHOTO_KEY) || null;
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
    const navAvatar = document.getElementById('userAvatarNav');
    const initials  = navAvatar?.textContent?.trim() || '?';
    const photo     = getPhoto();
    refreshAllAvatars(photo, initials);
    updateAvatarActionBtn();
}

function updateAvatarActionBtn() {
    const btn  = document.getElementById('avatarActionBtn');
    const icon = document.getElementById('avatarActionIcon');
    if (!btn || !icon) return;
    const hasPhoto = !!getPhoto();
    icon.className   = hasPhoto ? 'fa-solid fa-trash' : 'fa-solid fa-camera';
    btn.title        = hasPhoto ? 'Remove photo' : 'Change photo';
    btn.dataset.mode = hasPhoto ? 'remove' : 'upload';
}

function doRemovePhoto() {
    localStorage.removeItem(PHOTO_KEY);
    const navAvatar = document.getElementById('userAvatarNav');
    const initials  = navAvatar?.textContent?.trim() || '?';
    refreshAllAvatars(null, initials);
    ['avatarInput', 'avatarInput2'].forEach(id => {
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
            const navAvatar = document.getElementById('userAvatarNav');
            const initials  = navAvatar?.textContent?.trim() || '?';
            refreshAllAvatars(e.target.result, initials);
            updateAvatarActionBtn();
        };
        reader.readAsDataURL(file);
    }

    const actionBtn = document.getElementById('avatarActionBtn');
    const fileInput = document.getElementById('avatarInput');
    if (actionBtn && fileInput) {
        actionBtn.addEventListener('click', () => {
            if (actionBtn.dataset.mode === 'remove') {
                const modal = document.getElementById('removePhotoModal');
                if (modal) modal.style.display = 'flex';
            } else {
                fileInput.click();
            }
        });
        fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
    }

    document.getElementById('removePhotoConfirm')?.addEventListener('click', () => {
        doRemovePhoto();
        document.getElementById('removePhotoModal').style.display = 'none';
    });
    document.getElementById('removePhotoCancel')?.addEventListener('click', () => {
        document.getElementById('removePhotoModal').style.display = 'none';
    });
    document.getElementById('removePhotoModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });

    const avatarInput2 = document.getElementById('avatarInput2');
    if (avatarInput2) avatarInput2.addEventListener('change', () => handleFile(avatarInput2.files[0]));

    document.getElementById('removePhotoBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('removePhotoModal');
        if (modal) modal.style.display = 'flex';
    });

    updateAvatarActionBtn();
}

function renderEnrolledWorkshops() {
    if (!document.body.dataset.authenticated || document.body.dataset.authenticated === 'false') {
        const grid = document.getElementById('enrolledGrid');
        if (grid) {
             grid.innerHTML = `
                <div class="enrolled-empty">
                    <i class="fa-solid fa-book-open"></i>
                    <h4>Please Login</h4>
                    <p>You must be logged in to view enrolled workshops.</p>
                </div>
            `;
        }
        return;
    }
    const enrolled = JSON.parse(localStorage.getItem(ENROLLED_KEY) || '[]');
    const grid = document.getElementById('enrolledGrid');
    const statEnrolled = document.getElementById('statEnrolled');
    
    if (statEnrolled) {
        statEnrolled.textContent = enrolled.length;
    }
    
    if (!grid) return;
    
    if (enrolled.length === 0) {
        grid.innerHTML = `
            <div class="enrolled-empty">
                <i class="fa-solid fa-book-open"></i>
                <h4>No workshops yet</h4>
                <p>Browse events and enroll in a workshop to see it here.</p>
                <a href="/events/" class="btn btn-primary">Explore Workshops</a>
            </div>
        `;
        return;
    }
    
    const headerHtml = `
        <div class="enrolled-table-header">
            <span>Workshop</span>
            <span>Date</span>
            <span>Time</span>
            <span>Status</span>
        </div>
    `;

    const cardsHtml = enrolled.map(w => `
        <div class="enrolled-card">
            <h4>${w.title}</h4>
            <div class="enrolled-card-date"><i class="fa-regular fa-calendar"></i> ${w.date}</div>
            <div class="enrolled-card-time"><i class="fa-regular fa-clock"></i> ${w.time}</div>
            <div class="enrolled-card-status">Enrolled</div>
        </div>
    `).join('');

    grid.innerHTML = headerHtml + cardsHtml;
}

export function setupProfile() {
    setupTabs();
    loadProfileData();
    setupPhotoUpload();
    renderEnrolledWorkshops();
    // Note: user menu dropdown is handled by ui.js via main.js — no duplicate setup here
}