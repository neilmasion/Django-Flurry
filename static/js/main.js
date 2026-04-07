import { state, loadState } from './modules/state.js';
import { initTheme } from './modules/theme.js';
import { setupNavigation } from './modules/navigation.js';
import { updateUIAfterLogin } from './modules/ui.js';
import { displayWorkshops, setupWorkshopFilters } from './modules/workshops.js';
import { setupFAQ, setupFAQAccordion } from './modules/faq.js';
import { setupPartnersCarousel } from './modules/carousel.js';
import { setupCloudParticles } from './modules/cloudparticles.js';
import { setupScrollAnimations, setupActiveNavOnScroll, setupScrollToTop } from './modules/animations.js';
import { setupTestimonialSlider } from './modules/testimonials.js';
import { setupOfficerDeck } from './modules/officers.js?v=single_flip_fix';
import { setupAccount } from './modules/account.js';
import { setupContactForm } from './modules/contact.js';
import { setupEventEnroll } from './modules/events.js';
import { setupProfile } from './modules/profile.js';
import { syncLocalEnrollments } from './modules/sync.js';
import { initSearch } from './modules/search.js?v=1.5';
import { setupEventModal } from './modules/event_modal.js';

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initTheme();
    loadState();
    if (state.isAuthenticated) updateUIAfterLogin();

    setupNavigation();
    setupAccount();
    setupWorkshopFilters();
    setupFAQ();
    setupFAQAccordion();
    setupPartnersCarousel();
    setupCloudParticles();
    setupScrollAnimations();
    setupActiveNavOnScroll();
    setupScrollToTop();
    setupTestimonialSlider();
    setupOfficerDeck();
    setupEventEnroll();
    setupProfile();
    syncLocalEnrollments();
    setupEventModal();

    if (document.getElementById('workshopsList')) displayWorkshops();

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => { window.location.href = '/account/?panel=login'; });

    const ctaSignup = document.getElementById('ctaSignup');
    if (ctaSignup) ctaSignup.addEventListener('click', () => { window.location.href = '/account/'; });

    const joinBtn = document.getElementById('joinCommunityBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('heroEmail');
            const email = emailInput ? emailInput.value : '';
            window.location.href = `/account/?panel=register&email=${encodeURIComponent(email)}`;
        });
    }

    // Hide skeleton loader after initialization
    const loader = document.getElementById('skeleton-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300); // Small delay for smooth transition
    }
});