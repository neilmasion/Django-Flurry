import { state } from './state.js';

export function updateUIAfterLogin() {
    const menuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    
    // Load photo from local storage
    const navAvatar = document.getElementById('userAvatarNav');
    const userEmail = document.body.dataset.email || 'guest';
    const photo = localStorage.getItem(`flurryUserPhoto_${userEmail}`);
    if (navAvatar && photo) {
        navAvatar.innerHTML = `<img src="${photo}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
    }

    if (menuBtn && userMenu) {
        menuBtn.addEventListener('click', e => {
            e.stopPropagation();
            userMenu.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            userMenu.classList.remove('open');
        });
    }
}