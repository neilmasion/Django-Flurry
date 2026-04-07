export function setupEventModal() {
    const modal = document.getElementById('eventDetailsModal');
    const closeBtn = document.getElementById('closeEventModalBtn');
    const closeIcon = document.getElementById('closeEventModalIcon');
    
    if (!modal) return;
    
    // Elements to populate
    const titleEl = document.getElementById('modalEventTitle');
    const dateEl = document.getElementById('modalEventDate');
    const timeEl = document.getElementById('modalEventTime');
    const locationEl = document.getElementById('modalEventLocation');
    const descEl = document.getElementById('modalEventDescription');
    
    // Bind open events
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        // remove the annoying alert we temporarily set
        btn.onclick = null; 
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const parentCard = btn.closest('.event-card') || btn.closest('.workshop-item');
            if (!parentCard) return;
            
            // Get data from data attributes on the button
            const title = btn.getAttribute('data-title') || 'Untitled Event';
            const date = btn.getAttribute('data-date') || 'TBA';
            const time = btn.getAttribute('data-time') || 'TBA';
            const location = btn.getAttribute('data-location') || 'Online/TBA';
            
            // Get hidden description html
            const descContainer = parentCard.querySelector('.event-desc-hidden');
            const descHTML = descContainer ? descContainer.innerHTML : 'No description available.';
            
            // Populate modal
            if (titleEl) titleEl.textContent = title;
            if (dateEl) dateEl.textContent = date;
            if (timeEl) timeEl.textContent = time;
            if (locationEl) locationEl.textContent = location;
            if (descEl) descEl.innerHTML = descHTML;
            
            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close modal handlers
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeIcon) closeIcon.addEventListener('click', closeModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}
