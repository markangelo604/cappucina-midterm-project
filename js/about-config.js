// ==============================
// About Page Configuration
// ==============================
const siteConfig = {
    siteTitle: "About MerryLift",
    siteName: "MerryLift",

    navItems: [
        { name: "Home", url: "index.html", active: false },
        { name: "Find Rides", url: "findrides.html", active: false },
        { name: "Bookings", url: "booking.html", active: false },
        { name: "About", url: "about.html", active: true }
    ],

    aboutStats: [
        { number: "50K", label: "Active Users" },
        { number: "100K+", label: "Completed Rides" },
        { number: "50K", label: "KM" },
        { number: "₱2M+", label: "Money Saved" }
    ],

    teamMembers: [
        { name: "Javier, Charles Louis", role: "CEO & Founder", image: "../images/charles.jpg" },
        { name: "Domalanta, Mark Angelo", role: "CTO", image: "../images/charles.jpg" },
        { name: "Beset, Sam Raleigh", role: "Head of Operations", image: "../images/charles.jpg" },
        { name: "Damocles, Jheezren", role: "Lead Developer", image: "../images/charles.jpg" },
        { name: "Bautista, Josh Marcus", role: "CEO & Founder", image: "../images/charles.jpg" },
        { name: "Contillo, Daniel Roi", role: "CTO", image: "../images/charles.jpg" },
        { name: "Manaois, John Michael", role: "Head of Operations", image: "../images/charles.jpg" }
    ],
};

const footerLinks = {
    "Company": ["About Us", "How It Works", "Careers", "Press"],
    "Support": ["Help Center", "Safety", "Contact Us", "Trust & Safety"],
    "Quick Links": ["Find Rides", "Offer Ride", "My Bookings", "Trip History"]
};

// ==============================
// About Page Script
// ==============================

// Set document title
document.title = siteConfig.siteTitle;

// Helper functions to generate HTML
const generateNav = () => siteConfig.navItems.map(item =>
    `<li><a href="${item.url}" class="${item.active ? 'active' : ''}">${item.name}</a></li>`
).join('');

const generateStats = () => siteConfig.aboutStats.map(stat =>
    `<div class="about-stat-card">
        <h3 class="about-stat-number">${stat.number}</h3>
        <p class="about-stat-label">${stat.label}</p>
    </div>`
).join('');

const generateTeam = () => siteConfig.teamMembers.map(member =>
    `<div class="team-card">
        <div class="team-image"><img src="${member.image}" alt="${member.name}"></div>
        <div class="team-info">
            <h3 class="team-name">${member.name}</h3>
            <p class="team-role">${member.role}</p>
        </div>
    </div>`
).join('');

const generateFooterLinks = () => Object.entries(siteConfig.footerLinks).map(([category, links]) => `
    <div class="footer-links">
        <h4>${category}</h4>
        <ul>
            ${links.map(link => `<li><a href="#">${link}</a></li>`).join('')}
        </ul>
    </div>
`).join('');

// Insert dynamic content into the page
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('navMenu').innerHTML = generateNav();
    document.getElementById('statsGrid').innerHTML = generateStats();
    document.getElementById('teamGrid').innerHTML = generateTeam();
    document.getElementById('footerLinks').innerHTML = generateFooterLinks();
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    document.getElementById('siteName').textContent = siteConfig.siteName;
});

// Render Footer
const footerContainer = document.getElementById("footerContent");
footerContainer.innerHTML = `
    <div class="footer-brand">
        <h3>MerryLift</h3>
        <p>Your trusted carpooling platform in the Philippines. Share rides, save money, and build community through travel.</p>
    </div>
    ${Object.entries(footerLinks).map(([category, links]) => `
        <div class="footer-links">
            <h4>${category}</h4>
            <ul>
                ${links.map(link => `<li><a href="#">${link}</a></li>`).join("")}
            </ul>
        </div>
    `).join("")}
`;
