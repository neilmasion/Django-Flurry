export const state = {
    user: null,
    isAuthenticated: false,
    enrolledWorkshops: [],
    wishlist: []
};

export function loadState() {
    state.isAuthenticated = !!document.getElementById('userMenu');
    state.enrolledWorkshops = JSON.parse(localStorage.getItem('enrolledWorkshops') || '[]');
    state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
}