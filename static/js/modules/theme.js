export function initTheme() {
    const saved  = localStorage.getItem('lumioTheme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved || system);
}

export function updateThemeIcon(theme) {
    const resolvedTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
    document.querySelectorAll('.theme-icon').forEach(img => {
        img.style.filter = resolvedTheme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';
    });
}