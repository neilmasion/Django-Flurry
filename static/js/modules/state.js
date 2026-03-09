export const state = {
    user: null,
    isAuthenticated: false,
    enrolledWorkshops: [],
    wishlist: []
};

export function loadState() {
    const auth = localStorage.getItem('flurryAuth');
    const user = localStorage.getItem('flurryUser');
    if (auth === 'true' && user) {
        state.user = JSON.parse(user);
        state.isAuthenticated = true;
        state.enrolledWorkshops = JSON.parse(localStorage.getItem('enrolledWorkshops') || '[]');
        state.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    }
}