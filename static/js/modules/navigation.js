import { updateThemeIcon } from './theme.js';

export function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu   = document.querySelector('.nav-menu');
    const overlay = document.createElement('div');

    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function openNav() {
        hamburger?.classList.add('active');
        navMenu?.classList.add('active');
        overlay.classList.add('visible');
    }

    function closeNav() {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
        overlay.classList.remove('visible');
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu?.classList.contains('active') ? closeNav() : openNav();
        });
    }

    overlay.addEventListener('click', closeNav);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeNav);
    });

    const toggles = document.querySelectorAll('.theme-toggle');
    if (toggles.length) {
        updateThemeIcon(document.documentElement.getAttribute('data-theme'));
        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('lumioTheme', next);
                updateThemeIcon(next);
            });
        });
    }
}