import { state } from './state.js';

export function updateUIAfterLogin() {
    const menuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    
    // Load photo from local storage
    const navAvatar = document.getElementById('userAvatarNav');
    const userEmail = document.body.dataset.email || 'guest';
    const serverPhoto = document.body.dataset.profilePic || '';
    const cachedPhoto = localStorage.getItem(`flurryUserPhoto_${userEmail}`) || '';
    const username = document.body.dataset.username || 'U';
    const fallbackInitial = username.charAt(0).toUpperCase();

    if (navAvatar && (serverPhoto || cachedPhoto)) {
        const selectedPhoto = serverPhoto || cachedPhoto;
        navAvatar.innerHTML = `<img src="${selectedPhoto}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;

        const avatarImg = navAvatar.querySelector('img');
        if (avatarImg) {
            avatarImg.addEventListener('error', () => {
                if (cachedPhoto) {
                    localStorage.removeItem(`flurryUserPhoto_${userEmail}`);
                }
                navAvatar.textContent = fallbackInitial;
            }, { once: true });
        }
    }

    if (menuBtn && userMenu) {
        menuBtn.addEventListener('click', e => {
            e.stopPropagation();
            userMenu.classList.toggle('open');
            document.getElementById('notifDropdown')?.classList.remove('active');
        });
    }

    const notifToggle = document.getElementById('notifToggle');
    const notifDropdown = document.getElementById('notifDropdown');
    
    if (notifToggle && notifDropdown) {
        notifToggle.addEventListener('click', e => {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
            userMenu?.classList.remove('open');
        });
    }

    const mobileNotifToggle = document.getElementById('mobileNotifToggle');
    const mobileNotifDropdown = document.getElementById('mobileNotifDropdown');

    if (mobileNotifToggle && mobileNotifDropdown) {
        mobileNotifToggle.addEventListener('click', e => {
            e.stopPropagation();
            mobileNotifDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', () => {
        userMenu?.classList.remove('open');
        notifDropdown?.classList.remove('active');
        mobileNotifDropdown?.classList.remove('active');
    });
}