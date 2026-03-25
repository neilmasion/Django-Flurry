/**
 * Search module for global user discovery
 * Supports multiple instances via event delegation
 */

export function initSearch() {
    console.log('Initializing Global Search (v1.5)...');

    // Close all dropdowns on click outside
    document.addEventListener('click', (e) => {
        const isClickInsideSearch = e.target.closest('.nav-search');
        if (!isClickInsideSearch) {
            document.querySelectorAll('.search-results-dropdown').forEach(d => {
                d.style.display = 'none';
            });
        }
    });

    // Delegate input events to document
    document.addEventListener('input', (e) => {
        const searchInput = e.target.closest('.nav-search input');
        if (!searchInput) return;

        const container = searchInput.closest('.nav-search');
        const resultsDropdown = container.querySelector('.search-results-dropdown');
        const csrfToken = container.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                          document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

        if (!resultsDropdown) return;

        const query = searchInput.value.trim();
        console.log(`Search input detected in ${container.classList.contains('profile-search') ? 'profile' : 'nav'}: "${query}"`);

        if (query.length < 1) {
            resultsDropdown.style.display = 'none';
            resultsDropdown.innerHTML = '';
            return;
        }

        // Use a single timer tracked on the input element themselves to avoid overlap
        if (searchInput.debounceTimer) clearTimeout(searchInput.debounceTimer);
        
        searchInput.debounceTimer = setTimeout(() => {
            fetchUsers(query, resultsDropdown, csrfToken);
        }, 300);
    });

    // Handle Enter key for the first result
    document.addEventListener('keydown', (e) => {
        const searchInput = e.target.closest('.nav-search input');
        if (!searchInput || e.key !== 'Enter') return;

        const container = searchInput.closest('.nav-search');
        const resultsDropdown = container.querySelector('.search-results-dropdown');
        const firstResult = resultsDropdown?.querySelector('.search-result-item a');
        
        if (firstResult) {
            window.location.href = firstResult.href;
        }
    });

    // Show dropdown again on focus if has value
    document.addEventListener('focusin', (e) => {
        const searchInput = e.target.closest('.nav-search input');
        if (!searchInput) return;

        const container = searchInput.closest('.nav-search');
        const resultsDropdown = container.querySelector('.search-results-dropdown');
        
        if (resultsDropdown && searchInput.value.trim().length >= 1 && resultsDropdown.children.length > 0) {
            resultsDropdown.style.display = 'block';
        }
    });

    async function fetchUsers(query, dropdown, csrfToken) {
        try {
            const response = await fetch(`/search-users/?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            renderResults(data.users, dropdown, csrfToken);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    function renderResults(users, dropdown, csrfToken) {
        if (users.length === 0) {
            dropdown.innerHTML = `<div class="search-no-results">No members found with that name.</div>`;
            dropdown.style.display = 'block';
            return;
        }

        const html = users.map(user => {
            const avatar = user.profile_pic 
                ? `<img src="${user.profile_pic}" alt="${user.username}">`
                : user.username.charAt(0).toUpperCase();

            let actionHtml = '';
            if (user.connection_status === 'accepted') {
                actionHtml = `<span class="network-status-tag"><i class="fa-solid fa-check-circle"></i> Connected</span>`;
            } else if (user.connection_status === 'pending') {
                actionHtml = `<button class="btn btn-outline btn-small connect-btn" data-user-id="${user.id}" style="font-size: 0.7rem; padding: 0.3rem 0.6rem; opacity: 0.7;">Pending</button>`;
            } else if (user.connection_status === 'received') {
                actionHtml = `<button class="btn btn-primary btn-small connect-btn" data-user-id="${user.id}" data-connection-id="${user.connection_id}" data-action="accept" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">Accept</button>`;
            } else if (user.connection_status === 'self') {
                actionHtml = '';
            } else {
                actionHtml = `<button class="btn btn-primary btn-small connect-btn" data-user-id="${user.id}" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">Add Friend</button>`;
            }

            return `
                <div class="network-item search-result-item" style="cursor: default;">
                    <a href="/profile/id/${user.id}/" class="network-avatar" style="text-decoration: none; color: inherit;">
                        ${avatar}
                    </a>
                    <div class="network-info">
                        <a href="/profile/id/${user.id}/" class="network-name" style="text-decoration: none; color: inherit;">
                            ${user.first_name || user.username}
                        </a>
                        <div class="network-subtitle">${user.email} . ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                    </div>
                    <div class="network-actions">
                        ${actionHtml}
                    </div>
                </div>
            `;
        }).join('');

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
        
        // Setup Connect button listeners using delegation or local attachment
        const connectButtons = dropdown.querySelectorAll('.connect-btn');
        connectButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Avoid closing dropdown
                const userId = btn.dataset.userId;
                const connId = btn.dataset.connectionId;
                const isAccept = btn.dataset.action === 'accept';
                
                try {
                    const url = isAccept ? `/handle-connection/${connId}/` : `/connect/${userId}/`;
                    const options = {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        }
                    };
                    
                    if (isAccept) options.body = JSON.stringify({ action: 'accept' });

                    const response = await fetch(url, options);
                    const data = await response.json();
                    
                    if (data.success) {
                        if (isAccept || data.status === 'accepted') {
                            btn.parentElement.innerHTML = `<span class="network-status-tag"><i class="fa-solid fa-check-circle"></i> Connected</span>`;
                        } else if (data.status === 'pending') {
                            btn.textContent = 'Pending';
                            btn.style.opacity = '0.7';
                            btn.classList.replace('btn-primary', 'btn-outline');
                        } else if (data.status === null) {
                            btn.textContent = 'Add Friend';
                            btn.style.opacity = '1';
                            btn.classList.replace('btn-outline', 'btn-primary');
                        }
                    }
                } catch (error) {
                    console.error('Connection error:', error);
                }
            });
        });
    }
}
