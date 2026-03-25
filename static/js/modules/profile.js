const userEmail = document.body.dataset.email || 'guest';
const PHOTO_KEY = `flurryUserPhoto_${userEmail}`;

function getPhoto() {
    // We now primarily use the server-side photo. 
    // This can return the URL from data attributes if needed, or we just rely on the initial load.
    return document.body.dataset.profilePic || null;
}

function getInitials() {
    const username = document.body.dataset.username || 'U';
    return username.charAt(0).toUpperCase();
}

function applyPhotoToEl(el, photo, initials) {
    if (!el) return;
    const fallBack = initials || getInitials();
    if (photo) {
        el.innerHTML = `<img src="${photo}" alt="Profile photo">`;
    } else {
        el.textContent = fallBack;
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
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById('tab-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });

    // Auto-switch tab based on URL param
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    if (targetTab) {
        const tabBtn = document.querySelector(`.profile-tab[data-tab="${targetTab}"]`);
        if (tabBtn) tabBtn.click();
    }
}

function loadProfileData() {
    const photo = getPhoto();
    const initials = getInitials();
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

async function doRemovePhoto() {
    const formData = new FormData();
    formData.append('action', 'remove');

    try {
        const response = await fetch('/upload-avatar/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '')
            },
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            document.body.dataset.profilePic = '';
            const navAvatar = document.getElementById('userAvatarNav');
            const initials  = navAvatar?.textContent?.trim() || '?';
            refreshAllAvatars(null, initials);
            ['avatarInput', 'avatarInput2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            updateAvatarActionBtn();
        }
    } catch (err) {
        console.error('Error removing photo:', err);
    }
}

function setupPhotoUpload() {
    let selectedFile = null;

    async function handleFile(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
        
        selectedFile = file;

        // Show preview in modal
        const reader = new FileReader();
        reader.onload = e => {
            const previewEl = document.getElementById('savePhotoPreview');
            if (previewEl) {
                previewEl.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
            document.getElementById('savePhotoModal').style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    async function uploadSelectedFile() {
        if (!selectedFile) return;

        const confirmBtn = document.getElementById('savePhotoConfirm');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData();
        formData.append('profile_picture', selectedFile);

        try {
            const response = await fetch('/upload-avatar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '')
                },
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                document.body.dataset.profilePic = data.url;
                const navAvatar = document.getElementById('userAvatarNav');
                const initials  = navAvatar?.textContent?.trim() || '?';
                refreshAllAvatars(data.url, initials);
                updateAvatarActionBtn();
                document.getElementById('savePhotoModal').style.display = 'none';
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to save photo. Please try again.');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            selectedFile = null;
        }
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

    document.getElementById('savePhotoConfirm')?.addEventListener('click', uploadSelectedFile);
    document.getElementById('savePhotoCancel')?.addEventListener('click', () => {
        document.getElementById('savePhotoModal').style.display = 'none';
        selectedFile = null;
        if (fileInput) fileInput.value = '';
    });
    document.getElementById('savePhotoModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });

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
            school: document.getElementById('editSchool').value,
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
                const schoolLabel = document.getElementById('profileSchool');
                if (courseLabel) courseLabel.textContent = data.course_display;
                if (yearLabel) yearLabel.textContent = data.year_display;
                if (schoolLabel) schoolLabel.textContent = payload.school || 'Not specified';
                
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

function setupProfileNote() {
    const bubble = document.getElementById('profileNoteBubble');
    const noteText = document.getElementById('profileNoteText');
    const welcomeBio = document.getElementById('welcomeBio');
    const bioInput = document.getElementById('editBio');
    const editTabBtn = document.querySelector('.profile-tab[data-tab="edit"]');

    if (!bubble || !bioInput) return;

    // Click bubble to edit
    bubble.addEventListener('click', () => {
        if (editTabBtn) {
            editTabBtn.click();
            // Optional: smooth scroll to bio input if it's far
            setTimeout(() => {
                bioInput.focus();
                bioInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });

    // Real-time sync
    bioInput.addEventListener('input', () => {
        const val = bioInput.value.trim();
        const displayVal = val || "Share a thought...";
        const welcomeVal = val || "Ready to learn more about the cloud today?";

        if (noteText) noteText.textContent = displayVal;
        if (welcomeBio) welcomeBio.textContent = welcomeVal;
    });
}

function setupConnections() {
    // Handle Connect/Cancel on profile or search
    document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            try {
                const res = await fetch(`/connect/${userId}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '') }
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else if (data.error) {
                    alert(data.error);
                }
            } catch (e) { console.error('Connection error:', e); }
        });
    });

    // Handle Accept/Decline
    document.querySelectorAll('.handle-conn-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const connId = btn.dataset.connId;
            const action = btn.dataset.action;
            try {
                const res = await fetch(`/handle-connection/${connId}/`, {
                    method: 'POST',
                    headers: { 
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : ''),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: action })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                }
            } catch (e) { console.error('Handle connection error:', e); }
        });
    });

    // Handle Remove Friend
    let connectionUserIdToRemove = null;
    const removeConnModal = document.getElementById('removeConnectionModal');
    
    document.querySelectorAll('.remove-friend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            connectionUserIdToRemove = btn.dataset.userId;
            if (removeConnModal) removeConnModal.style.display = 'flex';
        });
    });

    document.getElementById('removeConnectionConfirm')?.addEventListener('click', async () => {
        if (!connectionUserIdToRemove) return;
        try {
            const res = await fetch(`/remove-connection/${connectionUserIdToRemove}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || (typeof CSRF_TOKEN !== 'undefined' ? CSRF_TOKEN : '') }
            });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (e) { console.error('Remove connection error:', e); }
        if (removeConnModal) removeConnModal.style.display = 'none';
    });

    document.getElementById('removeConnectionCancel')?.addEventListener('click', () => {
        if (removeConnModal) removeConnModal.style.display = 'none';
        connectionUserIdToRemove = null;
    });

    if (removeConnModal) {
        removeConnModal.addEventListener('click', (e) => {
            if (e.target === removeConnModal) {
                removeConnModal.style.display = 'none';
                connectionUserIdToRemove = null;
            }
        });
    }
}

export { setupTabs };

export function setupProfile() {
    setupTabs();
    loadProfileData();
    setupPhotoUpload();
    setupProfileUpdate();
    setupProfileNote();
    setupConnections();
    // Enrollment is now handled server-side in profile.html
}