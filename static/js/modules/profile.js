const userEmail = document.body.dataset.email || 'guest';
const PHOTO_KEY = `flurryUserPhoto_${userEmail}`;

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

function setupProfileUpdate() {
    const editForm = document.getElementById('editForm');
    if (!editForm) return;

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = editForm.querySelector('button[type="submit"]');
        const successMsg = document.getElementById('editSuccess');
        const errorMsg = document.getElementById('editError');
        const cooldownMsg = document.getElementById('usernameCooldownMsg');

        // Reset UI
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const payload = {
            first_name: document.getElementById('editFirstName').value,
            last_name: document.getElementById('editLastName').value,
            email: document.getElementById('editEmail').value,
            course: document.getElementById('editCourse').value,
            year_level: document.getElementById('editYear').value,
            bio: document.getElementById('editBio').value,
            username: document.getElementById('editUsername').value
        };

        try {
            const response = await fetch('/update-profile/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '')
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                // Update local UI
                document.getElementById('profileFullName').textContent = `${payload.first_name} ${payload.last_name}`;
                document.getElementById('profileEmail').textContent = payload.email;
                document.getElementById('welcomeName').textContent = payload.first_name;
                
                // Update course/year labels in sidebar
                const courseLabel = document.getElementById('profileCourse');
                const yearLabel = document.getElementById('profileYear');
                if (courseLabel) courseLabel.textContent = data.course_display;
                if (yearLabel) yearLabel.textContent = data.year_display;
                
                // Update navigation name if exists
                const navName = document.getElementById('userName');
                if (navName) navName.textContent = payload.first_name || data.username;

                // Update initials if username changed
                if (data.username) {
                    const initials = data.username.slice(0, 1).toUpperCase();
                    refreshAllAvatars(getPhoto(), initials);
                }

                successMsg.style.display = 'block';
                
                if (data.cooldown_active) {
                    cooldownMsg.querySelector('span')?.remove(); // Clean up if I add spans later
                    cooldownMsg.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Changed recently. Next update available in ${data.cooldown_remaining}.`;
                    cooldownMsg.style.display = 'block';
                } else {
                    cooldownMsg.style.display = 'none';
                }
                
                // Update body data attributes
                document.body.dataset.firstName = payload.first_name;
                document.body.dataset.lastName = payload.last_name;
                document.body.dataset.username = data.username;

                setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
            } else {
                errorMsg.textContent = data.error || 'Failed to update profile.';
                errorMsg.style.display = 'block';
                if (data.error && data.error.includes('Username can only be changed')) {
                    cooldownMsg.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Profile update error:', error);
            errorMsg.textContent = 'An error occurred. Please try again.';
            errorMsg.style.display = 'block';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });
}

export function setupProfile() {
    setupTabs();
    loadProfileData();
    setupPhotoUpload();
    setupProfileUpdate();
    // Enrollment is now handled server-side in profile.html
}