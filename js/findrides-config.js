// Configuration Data (replaces PHP arrays)

const pageTitle = "Find Rides - MerryLift";
document.title = pageTitle;

const navItems = [
    { name: "Home", url: "index.html", active: false },
    { name: "Find Rides", url: "findrides.html", active: true },
    { name: "Bookings", url: "booking.html", active: false },
    { name: "About", url: "about.html", active: false }
];

const safetyFeatures = [
    { icon: "🛡️", text: "Safety First" },
    { icon: "📍", text: "GPS Tracking" },
    { icon: "⭐", text: "Verified Drivers" },
    { icon: "💬", text: "In-App Chat" },
    { icon: "🔒", text: "Secure Payment" }
];

const availableRides = [
    {
        driver_name: "Josh Bautista",
        driver_initials: "JB",
        driver_color: "#4CAF50",
        price: "₱200.00",
        departure_time: "18:00",
        departure_location: "Baiuokong",
        arrival_time: "18:00",
        arrival_location: "Camp 7",
        date: "Oct 25, 2025",
        eta: "25 min",
        vehicle: "SUV",
        seats: 5,
        rating: 4.8,
        badge: "Book Now!"
    },
    {
        driver_name: "Josh Bautista",
        driver_initials: "JB",
        driver_color: "#4CAF50",
        price: "₱200.00",
        departure_time: "18:00",
        departure_location: "Baiuokong",
        arrival_time: "18:00",
        arrival_location: "Camp 7",
        date: "Oct 25, 2025",
        eta: "22 min",
        vehicle: "SUV",
        seats: 5,
        rating: 4.8,
        badge: "Book Now!"
    },
    {
        driver_name: "Maria Santos",
        driver_initials: "MS",
        driver_color: "#2196F3",
        price: "₱180.00",
        departure_time: "17:30",
        departure_location: "Quezon City",
        arrival_time: "18:15",
        arrival_location: "Makati",
        date: "Oct 25, 2025",
        eta: "30 min",
        vehicle: "Sedan",
        seats: 4,
        rating: 4.9,
        badge: "Popular"
    }
];

const footerLinks = {
    "Company": ["About Us", "How It Works", "Careers", "Press"],
    "Support": ["Help Center", "Safety", "Contact Us", "Trust & Safety"],
    "Quick Links": ["Find Rides", "Offer Ride", "My Bookings", "Trip History"]
};

// Render Navigation
const navMenu = document.getElementById("navMenu");
navItems.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.url}" class="${item.active ? "active" : ""}">${item.name}</a>`;
    navMenu.appendChild(li);
});

// Render Safety Features
const safetyContainer = document.getElementById("safetyFeatures");
safetyFeatures.forEach(feature => {
    const div = document.createElement("div");
    div.classList.add("safety-item");
    div.innerHTML = `
        <span class="safety-icon">${feature.icon}</span>
        <span class="safety-text">${feature.text}</span>
    `;
    safetyContainer.appendChild(div);
});

// Render Available Rides
const ridesList = document.getElementById("ridesList");
availableRides.forEach(ride => {
    const rideCard = document.createElement("div");
    rideCard.classList.add("ride-card");
    rideCard.innerHTML = `
        <div class="ride-header">
            <div class="driver-info">
                <div class="driver-avatar" style="background-color: ${ride.driver_color}">
                    ${ride.driver_initials}
                </div>
                <span class="driver-name">${ride.driver_name}</span>
            </div>
            <div class="ride-price">${ride.price}</div>
        </div>

        <div class="ride-route">
            <div class="route-item">
                <div class="route-dot pickup"></div>
                <div class="route-details">
                    <span class="route-time">${ride.departure_time}</span>
                    <span class="route-location">${ride.departure_location}</span>
                </div>
            </div>
            <div class="route-line"></div>
            <div class="route-item">
                <div class="route-dot destination"></div>
                <div class="route-details">
                    <span class="route-time">${ride.arrival_time}</span>
                    <span class="route-location">${ride.arrival_location}</span>
                </div>
            </div>
        </div>

        <div class="ride-meta">
            <div class="meta-item">🕒 <span>${ride.date}</span></div>
            <div class="meta-item">⏱️ <span>${ride.eta}</span></div>
            <div class="meta-item">🚗 <span>${ride.vehicle}</span></div>
            <div class="meta-item">💺 <span>${ride.seats} Seats</span></div>
        </div>

        ${ride.badge ? `<div class="ride-badge">${ride.badge}</div>` : ""}
    `;
    ridesList.appendChild(rideCard);
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

// Year
document.getElementById("year").textContent = new Date().getFullYear();
