import { state } from './state.js';

export function updateUIAfterLogin() {
    const loginBtn  = document.getElementById('loginBtn');
    const userMenu  = document.getElementById('userMenu');
    const menuBtn   = document.getElementById('userMenuBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';

    const avatarEl = document.getElementById('userAvatarNav');
    const nameEl   = document.getElementById('userName');
    const user     = state.user;

    if (user) {
        const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase()
                         || user.email?.[0]?.toUpperCase() || '?';

        if (nameEl) nameEl.textContent = user.firstName || user.name || '';

        if (avatarEl) {
            const photo = localStorage.getItem('flurryUserPhoto');
            if (photo) {
                avatarEl.innerHTML = `<img src="${photo}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
            } else {
                avatarEl.textContent = initials;
            }
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('userMenu')?.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            document.getElementById('userMenu')?.classList.remove('open');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('flurryAuth');
            window.location.href = 'index.html';
        });
    }
}