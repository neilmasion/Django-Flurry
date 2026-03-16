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

async function handleEnroll(btn) {
    if (!isLoggedIn()) {
        const nextUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/account/?next=${nextUrl}`;
        return;
    }

    const eventId = btn.dataset.id;
    const title   = btn.dataset.title;
    
    if (!eventId) {
        console.error('No event ID found on button');
        return;
    }

    // Visual feedback
    const originalText = btn.textContent;
    btn.textContent = 'Enrolling...';
    btn.disabled = true;

    try {
        const response = await fetch(`/enroll-event/${eventId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            btn.textContent   = 'Enrolled ✓';
            btn.disabled      = true;
            btn.style.opacity = '0.65';
            showToast(data.message || `Enrolled in "${title}" successfully!`);
        } else if (data.message === 'VERIFY_EMAIL_REQUIRED') {
            btn.textContent = originalText;
            btn.disabled = false;
            if (typeof toggleVerificationModal === 'function') {
                toggleVerificationModal(true);
            } else {
                showToast('Please verify your email address in your profile.', false);
            }
        } else {
            btn.textContent = originalText;
            btn.disabled = false;
            showToast(data.message || 'Enrollment failed.', false);
        }
    } catch (err) {
        console.error('Enrollment error:', err);
        btn.textContent = originalText;
        btn.disabled = false;
        showToast('An error occurred. Please try again.', false);
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function setupEventEnroll() {
    const btns = document.querySelectorAll('.enroll-btn');
    btns.forEach(btn => {
        // Only add listener if button is not already disabled (by server)
        if (!btn.disabled) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleEnroll(btn);
            });
        }
    });
}