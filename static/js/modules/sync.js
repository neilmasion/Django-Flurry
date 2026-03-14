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

export function syncLocalEnrollments() {
    if (document.body.dataset.authenticated !== 'true') return;
    
    const email = document.body.dataset.email || 'guest';
    const key = `enrolledWorkshops_${email}`;
    const enrolledData = localStorage.getItem(key);
    
    if (!enrolledData) return;
    
    const enrolled = JSON.parse(enrolledData);
    if (!enrolled.length) return;
    
    const titles = enrolled.map(e => e.title || e);
    
    console.log('Syncing enrollments to server...', titles);
    
    fetch('/sync-enrollments/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ titles })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log(`Successfully synced ${data.synced} enrollments.`);
            localStorage.removeItem(key);
            
            // If we are on a page that displays enrollment status, refresh to show DB state
            const path = window.location.pathname;
            if (data.synced > 0 && (path.includes('/profile') || path.includes('/events'))) {
                window.location.reload();
            }
        } else {
            console.error('Enrollment sync failed:', data.error);
        }
    })
    .catch(err => console.error('Enrollment sync network error:', err));
}
