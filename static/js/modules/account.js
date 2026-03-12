export function setupAccount() {
    if (!document.getElementById('registerForm') && !document.getElementById('loginForm')) return;

    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-eye-slash', !isHidden);
            icon.classList.toggle('fa-eye', isHidden);
        });
    });

    // Panel switching
    document.getElementById('goToLogin')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('registerPanel').classList.remove('active');
        document.getElementById('loginPanel').classList.add('active');
    });

    document.getElementById('goToRegister')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('loginPanel').classList.remove('active');
        document.getElementById('registerPanel').classList.add('active');
    });

    // Forgot password toggle
    const forgotLink = document.getElementById('forgotPassword');
    const forgotMsg  = document.getElementById('forgotMsg');
    if (forgotLink && forgotMsg) {
        forgotLink.addEventListener('click', e => {
            e.preventDefault();
            forgotMsg.style.display = forgotMsg.style.display === 'none' ? 'flex' : 'none';
        });
    }
}