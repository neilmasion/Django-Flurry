export function setupFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const h3 = item.querySelector('h3');
        if (h3) {
            h3.addEventListener('click', () => {
                item.classList.toggle('active');
                item.classList.toggle('closed');
            });
        }
    });
}

export function setupFAQAccordion() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item    = btn.closest('.faq-item');
            const wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
        });
    });
}