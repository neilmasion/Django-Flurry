export const workshopsData = [
    { id:1, title:"Advanced Web Development Masterclass", category:"technology", instructor:"John Doe", instructorInitial:"JD", description:"Learn advanced web development techniques including React, Node.js, and modern CSS.", price:"$149.99", rating:4.8, students:1250, image:"🚀", duration:"40 hours", level:"Advanced" },
    { id:2, title:"UX/UI Design Fundamentals", category:"design", instructor:"Sarah Chen", instructorInitial:"SC", description:"Master the principles of user experience and interface design for modern applications.", price:"$99.99", rating:4.9, students:2100, image:"🎨", duration:"30 hours", level:"Beginner" },
    { id:3, title:"Digital Marketing Strategy", category:"marketing", instructor:"Mike Johnson", instructorInitial:"MJ", description:"Comprehensive guide to digital marketing including SEO, social media, and analytics.", price:"$129.99", rating:4.7, students:890, image:"📱", duration:"35 hours", level:"Intermediate" },
    { id:4, title:"Data Science with Python", category:"technology", instructor:"Emma Wilson", instructorInitial:"EW", description:"Learn data analysis, visualization, and machine learning using Python and popular libraries.", price:"$179.99", rating:4.9, students:1650, image:"📊", duration:"45 hours", level:"Advanced" },
    { id:5, title:"E-commerce Business Essentials", category:"business", instructor:"John Doe", instructorInitial:"JD", description:"Build and scale your e-commerce business with proven strategies and tools.", price:"$119.99", rating:4.6, students:1120, image:"💼", duration:"25 hours", level:"Beginner" },
    { id:6, title:"Mobile App Development", category:"technology", instructor:"Alex Kumar", instructorInitial:"AK", description:"Create native and cross-platform mobile applications with React Native and Flutter.", price:"$149.99", rating:4.8, students:1890, image:"📲", duration:"50 hours", level:"Advanced" }
];

export function displayWorkshops(workshops) {
    workshops = workshops || workshopsData;
    const container = document.getElementById('workshopsList');
    if (!container) return;

    if (workshops.length === 0) {
        container.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div><h3>No workshops found</h3><p>Try adjusting your filters or search terms</p></div>';
        return;
    }

    container.innerHTML = workshops.map(w =>
        '<div class="workshop-card" data-id="' + w.id + '">' +
            '<div class="workshop-image">' + w.image + '</div>' +
            '<div class="workshop-content">' +
                '<span class="workshop-category">' + w.category + '</span>' +
                '<h3 class="workshop-title">' + w.title + '</h3>' +
                '<p class="workshop-description">' + w.description + '</p>' +
                '<div class="workshop-meta">' +
                    '<div class="workshop-instructor">' +
                        '<div class="instructor-avatar">' + w.instructorInitial + '</div>' +
                        '<span>' + w.instructor + '</span>' +
                    '</div>' +
                    '<div class="workshop-price">' + w.price + '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    ).join('');

    container.querySelectorAll('.workshop-card').forEach(card => {
        card.addEventListener('click', () => {
            const w = workshopsData.find(x => x.id == card.dataset.id);
            if (w) alert('Workshop: ' + w.title + '\n\nInstructor: ' + w.instructor + '\nPrice: ' + w.price + '\nDuration: ' + w.duration + '\nLevel: ' + w.level + '\nRating: ' + w.rating + '⭐\nStudents: ' + w.students + '+');
        });
    });
}

export function setupWorkshopFilters() {
    const searchInput    = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    if (searchInput)    searchInput.addEventListener('input', filterWorkshops);
    if (categoryFilter) categoryFilter.addEventListener('change', filterWorkshops);
}

export function filterWorkshops() {
    const term     = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const filtered = workshopsData.filter(w => {
        const matchSearch   = w.title.toLowerCase().includes(term) || w.description.toLowerCase().includes(term);
        const matchCategory = !category || w.category === category;
        return matchSearch && matchCategory;
    });
    displayWorkshops(filtered);
}