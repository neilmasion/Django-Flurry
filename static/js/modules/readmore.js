export function setupReadMore() {
    const wrappers = document.querySelectorAll('.event-desc-wrapper');
    
    wrappers.forEach(wrapper => {
        const p = wrapper.querySelector('.event-description');
        const btn = wrapper.querySelector('.read-more-btn');
        
        if (p && btn) {
            // First we check if the text really overflows 4 lines
            // Set line-clamp to unset to get the real height, then back to 4 to compare
            // To prevent flicker, this is usually calculated fast enough
            p.classList.remove('text-clamp');
            const fullHeight = p.scrollHeight;
            p.classList.add('text-clamp');
            
            // To ensure we get the clamped scrollHeight properly across browsers
            const clampedHeight = p.clientHeight;
            
            if (fullHeight > clampedHeight) {
                btn.style.display = 'inline-block';
                
                btn.addEventListener('click', () => {
                    p.classList.toggle('expanded');
                    if (p.classList.contains('expanded')) {
                        btn.textContent = 'Read less';
                    } else {
                        btn.textContent = 'Read more';
                    }
                });
            }
        }
    });
}
