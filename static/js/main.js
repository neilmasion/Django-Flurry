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
import { setupOfficerDeck } from './modules/officers.js';
import { setupAccount } from './modules/account.js';
import { setupContactForm } from './modules/contact.js';
import { setupEventEnroll } from './modules/events.js';

document.addEventListener('DOMContentLoaded', () => {
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
    setupContactForm();
    setupEventEnroll();

    if (document.getElementById('workshopsList')) displayWorkshops();

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => { window.location.href = 'account.html'; });

    const ctaSignup = document.getElementById('ctaSignup');
    if (ctaSignup) ctaSignup.addEventListener('click', () => { window.location.href = 'account.html'; });

    const joinBtn = document.getElementById('joinCommunityBtn');
    if (joinBtn) joinBtn.addEventListener('click', () => { window.location.href = 'account.html'; });
});