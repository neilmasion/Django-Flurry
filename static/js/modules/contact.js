export function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const name    = document.getElementById('cfName').value.trim();
        const email   = document.getElementById('cfEmail').value.trim();
        const subject = document.getElementById('cfSubject').value;
        const message = document.getElementById('cfMessage').value.trim();
        let valid     = true;

        ['cfNameError','cfEmailError','cfSubjectError','cfMessageError'].forEach(id => {
            document.getElementById(id).textContent = '';
        });

        if (!name)    { document.getElementById('cfNameError').textContent = 'Name is required'; valid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('cfEmailError').textContent = 'Enter a valid email'; valid = false; }
        if (!subject) { document.getElementById('cfSubjectError').textContent = 'Please select a topic'; valid = false; }
        if (!message) { document.getElementById('cfMessageError').textContent = 'Message cannot be empty'; valid = false; }
        if (!valid) return;

        document.getElementById('formSuccess').classList.add('visible');
        form.reset();
    });
}