// ========================================
// CONFIGURATION DATA
// ========================================

// Site Configuration
const siteConfig = {
    title: "Merrylift Homepage",
    name: "Merrylift"
};

// Navigation Items
const navItems = [
    { name: 'Home', url: '#', active: true },
    { name: 'Find Rides', url: '../html/findrides.html', active: false },
    { name: 'About', url: '../html/about.html', active: false }
];

// Hero Section Features
const features = [
    {
        title: 'Save Big.',
        description: 'Share rides, split costs—pay up to 70% less than solo commuting.',
    },
    {
        title: 'Go Green.',
        description: 'One full car = 4 fewer cars on the road. Reduce your carbon footprint.',
    },
    {
        title: 'Ride Safe.',
        description: 'Verified students & faculty only. Real-time tracking. Campus-approved.',
    }
];

// Why Choose Features
const whyChoose = [
    {
        title: 'Safe & Secure',
        description: 'All drivers are verified with background checks. Your safety is our top priority with 24/7 support.'
    },
    {
        title: 'Easy Booking',
        description: 'Book your ride in just a few clicks. Simple, fast, and hassle-free reservation process.'
    },
    {
        title: 'Flexible Schedule',
        description: 'Find rides that match your schedule. Travel at your convenience with multiple options available.'
    }
];

// Available Rides Data
const availableRides = [
    {
        image: '../images/campus-bg-login.png',
        driver: 'Manong Driver',
        rating: 4.5,
        reviews: 102,
        price: 'Dhaka, Cafe',
        pickup: 'Somewhere there',
        destination: 'Somewhere here'
    },
    {
        image: '../images/campus-bg-login.png',
        driver: 'Manong Driver',
        rating: 4.5,
        reviews: 102,
        price: 'Dhaka, Cafe',
        pickup: 'Somewhere there',
        destination: 'Somewhere here'
    },
    {
        image: '../images/campus-bg-login.png',
        driver: 'Manong Driver',
        rating: 4.5,
        reviews: 102,
        price: 'Dhaka, Cafe',
        pickup: 'Somewhere there',
        destination: 'Somewhere here'
    }
];

// How It Works Steps
const steps = [
    {
        number: '1',
        title: 'Create Account',
        description: 'Sign up for free and complete your profile with basic information.'
    },
    {
        number: '2',
        title: 'Search Rides',
        description: 'Enter your destination and find available rides that match your route.'
    },
    {
        number: '3',
        title: 'Book & Pay',
        description: 'Select your preferred ride and make secure payment through our platform.'
    },
    {
        number: '4',
        title: 'Enjoy Trip',
        description: 'Meet your driver at the pickup point and enjoy a comfortable journey.'
    }
];

const footerLinks = {
    "Company": ["About Us", "How It Works", "Careers", "Press"],
    "Support": ["Help Center", "Safety", "Contact Us", "Trust & Safety"],
    "Quick Links": ["Find Rides", "Offer Ride", "My Bookings", "Trip History"]
};

// Stats
const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '50K+', label: 'Active Users' },
    { number: '50K+', label: 'Active Users' },
    { number: '50K+', label: 'Active Users' }
];

// ========================================
// RENDERING FUNCTIONS
// ========================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Set page title
    document.title = siteConfig.title;
    
    // Render Navigation Menu
    renderNavigation();
    
    // Render Hero Features
    renderFeatures();
    
    // Render Stats
    renderStats();
    
    // Render Why Choose Section
    renderWhyChoose();
    
    // Render Available Rides
    fetchAvailableRides();
    
    // Render How It Works Steps
    renderSteps();
    
    // Render Footer Links
    // renderFooterLinks();
    
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Attach form submit handler
    document.getElementById('searchForm').addEventListener('submit', handleSearchSubmit);
});

// Render Navigation Menu
function renderNavigation() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = navItems.map(item => `
        <li>
            <a href="${item.url}" class="${item.active ? 'active' : ''}">
                ${item.name}
            </a>
        </li>
    `).join('');
}

// Render Hero Features
function renderFeatures() {
    const featureList = document.getElementById('featureList');
    featureList.innerHTML = features.map(feature => `
        <div class="feature-item">
            <div class="feature-icon"></div>
            <div class="feature-text">
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
            </div>
        </div>
    `).join('');
}

// Render Stats
function renderStats() {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <svg class="stat-icon" width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
                <circle cx="18" cy="14" r="6"/>
                <circle cx="30" cy="14" r="6"/>
                <path d="M12 32c0-4 4-8 12-8s12 4 12 8v8H12v-8z"/>
            </svg>
            <h3 class="stat-number">${stat.number}</h3>
            <p class="stat-label">${stat.label}</p>
        </div>
    `).join('');
}

// Render Why Choose Features
function renderWhyChoose() {
    const whyChooseGrid = document.getElementById('whyChooseGrid');
    whyChooseGrid.innerHTML = whyChoose.map(feature => `
        <div class="feature-card">
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        </div>
    `).join('');
}

// Render Available Rides
// ========================================
// Fetch and Render Available Rides
// ========================================
async function fetchAvailableRides() {
    try {
        const response = await fetch('../Server/Models/get-rides.php'); // adjust path if needed
        const rides = await response.json();
        renderAvailableRides(rides);
    } catch (error) {
        console.error('Error fetching rides:', error);
    }
}

function renderAvailableRides(rides) {
    const ridesGrid = document.getElementById('ridesGrid');
    if (!rides || rides.length === 0) {
        ridesGrid.innerHTML = '<p>No rides available at the moment.</p>';
        return;
    }

    ridesGrid.innerHTML = rides.map(ride => {
        // Map MongoDB document structure to frontend fields
        const driver = ride.name || ride.username || "Unknown Driver";
        const rating = ride.ratings?.average || 0;
        const reviews = ride.ratings?.count || 0;
        const car = ride.car_details?.model || "Unknown Car";
        const plate = ride.car_details?.license_plate || "N/A";
        const status = ride.profile_status || "unavailable";

        return `
            <div class="ride-card">
                <img src="${ride.image || '../images/campus-bg-login.png'}" alt="Ride" class="ride-image">
                <div class="ride-content">
                    <h3 class="ride-driver">${driver}</h3>
                    <div class="ride-rating">
                        <div class="stars">${'<span class="star">★</span>'.repeat(5)}</div>
                        <span class="rating-count">${reviews}</span>
                    </div>
                    <div class="ride-price">${car} (${plate})</div>
                    <div class="ride-details">
                        <div class="ride-location">Status: ${status}</div>
                        <div class="ride-location">Rating: ${rating}</div>
                    </div>
                    <button class="btn-book-ride">Book Ride</button>
                </div>
            </div>
        `;
    }).join('');
}



// Render How It Works Steps
function renderSteps() {
    const stepsGrid = document.getElementById('stepsGrid');
    stepsGrid.innerHTML = steps.map(step => `
        <div class="step-card">
            <div class="step-number">${step.number}</div>
            <h3>${step.title}</h3>
            <p>${step.description}</p>
        </div>
    `).join('');
}

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

// Handle form submission
function handleSearchSubmit(e) {
    e.preventDefault();
    
    const formData = {
        pickup: document.querySelector('input[name="pickup"]').value,
        destination: document.querySelector('input[name="destination"]').value,
        date: document.querySelector('input[name="date"]').value,
        passengers: document.querySelector('input[name="passengers"]').value
    };
    
    console.log('Search form submitted:', formData);
    // Add your search logic here (e.g., filter rides, redirect, etc.)
    alert(`Searching for rides from ${formData.pickup} to ${formData.destination}`);
}