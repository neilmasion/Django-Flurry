export function setupAccount() {
    if (!document.getElementById('registerForm') && !document.getElementById('loginForm')) return;

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input   = document.getElementById(btn.dataset.target);
            if (!input) return;
            const isHidden = input.type === 'password';
            input.type     = isHidden ? 'text' : 'password';
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-eye-slash', !isHidden);
            icon.classList.toggle('fa-eye', isHidden);
        });
    });

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

    const savedEmail = localStorage.getItem('flurryRememberEmail');
    const loginEmail = document.getElementById('loginEmail');
    const rememberMe = document.getElementById('rememberMe');
    if (savedEmail && loginEmail) {
        loginEmail.value = savedEmail;
        if (rememberMe) rememberMe.checked = true;
    }

    const forgotLink = document.getElementById('forgotPassword');
    const forgotMsg  = document.getElementById('forgotMsg');
    if (forgotLink && forgotMsg) {
        forgotLink.addEventListener('click', e => {
            e.preventDefault();
            forgotMsg.style.display = forgotMsg.style.display === 'none' ? 'flex' : 'none';
        });
    }

    function showErr(id, msg) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
    }

    function clearErrs() {
        ['regEmailError','regCourseError','regYearError','regPasswordError','regConfirmError','regTermsError',
         'loginEmailError','loginPasswordError'].forEach(id => showErr(id, ''));
    }

    function validEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    document.getElementById('registerForm')?.addEventListener('submit', e => {
        e.preventDefault();
        clearErrs();

        const email     = document.getElementById('workEmail').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const course    = document.getElementById('course').value;
        const year      = document.getElementById('yearLevel').value;
        const password  = document.getElementById('regPassword').value;
        const confirm   = document.getElementById('regConfirmPassword').value;
        const terms     = document.getElementById('regTerms').checked;

        let valid = true;
        if (!validEmail(email))   { showErr('regEmailError',    'Please enter a valid email');              valid = false; }
        if (!course)              { showErr('regCourseError',   'Please select your course');               valid = false; }
        if (!year)                { showErr('regYearError',     'Please select your year');                 valid = false; }
        if (password.length < 6)  { showErr('regPasswordError', 'Password must be at least 6 characters'); valid = false; }
        if (password !== confirm)  { showErr('regConfirmError',  'Passwords do not match');                 valid = false; }
        if (!terms)               { showErr('regTermsError',    'You must accept the terms');               valid = false; }
        if (!valid) return;

        localStorage.setItem('flurryUser', JSON.stringify({ email, firstName, lastName, course, year, password }));
        localStorage.setItem('flurryAuth', 'true');
        window.location.href = 'index.html';
    });

    document.getElementById('loginForm')?.addEventListener('submit', e => {
        e.preventDefault();
        clearErrs();

        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe')?.checked;

        let valid = true;
        if (!validEmail(email)) { showErr('loginEmailError',    'Please enter a valid email'); valid = false; }
        if (!password)          { showErr('loginPasswordError', 'Password is required');       valid = false; }
        if (!valid) return;

        const stored = JSON.parse(localStorage.getItem('flurryUser') || 'null');
        if (!stored || stored.email !== email || stored.password !== password) {
            showErr('loginPasswordError', 'Invalid email or password');
            return;
        }

        if (remember) {
            localStorage.setItem('flurryRememberEmail', email);
        } else {
            localStorage.removeItem('flurryRememberEmail');
        }

        localStorage.setItem('flurryAuth', 'true');
        window.location.href = 'index.html';
    });
}