// Configuration Data (replaces PHP arrays)

const pageTitle = "Find Rides - MerryLift";
document.title = pageTitle;

const navItems = [
    { name: "Home", url: "../index.html", active: false },
    { name: "Find Rides", url: "../html/findrides.html", active: true },
    { name: "About", url: "../html/about.html", active: false }
];

const safetyFeatures = [
    { icon: "🛡️", text: "Safety First" },
    { icon: "📍", text: "GPS Tracking" },
    { icon: "⭐", text: "Verified Drivers" },
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
        rating: 4.8
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
        rating: 4.8
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
        rating: 4.9
    }
];

const footerLinks = {
    "Company": ["About Us", "How It Works", "Careers", "Press"],
    "Support": ["Help Center", "Safety", "Contact Us", "Trust & Safety"],
    "Quick Links": ["Find Rides", "Offer Ride", "My Bookings", "Trip History"]
};

// Store current ride being booked
let currentRideIndex = null;

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
availableRides.forEach((ride, index) => {
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

        <button class="btn-book-ride" data-ride-index="${index}">Book Now</button>
    `;
    ridesList.appendChild(rideCard);
});

// Create Modal
const modal = document.createElement("div");
modal.id = "bookingModal";
modal.className = "modal";
modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2>Complete Your Booking</h2>
            <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="booking-summary">
                <h3>Ride Details</h3>
                <div class="summary-item">
                    <span class="label">Driver:</span>
                    <span id="modal-driver"></span>
                </div>
                <div class="summary-item">
                    <span class="label">From:</span>
                    <span id="modal-from"></span>
                </div>
                <div class="summary-item">
                    <span class="label">To:</span>
                    <span id="modal-to"></span>
                </div>
                <div class="summary-item">
                    <span class="label">Date:</span>
                    <span id="modal-date"></span>
                </div>
                <div class="summary-item">
                    <span class="label">Price:</span>
                    <span id="modal-price" class="price-highlight"></span>
                </div>
            </div>

            <form id="bookingForm" class="booking-form">
                <div class="form-group-modal">
                    <label for="passengerName">Full Name *</label>
                    <input type="text" id="passengerName" name="passengerName" required placeholder="Enter your full name">
                </div>

                <div class="form-group-modal">
                    <label for="passengerPhone">Phone Number *</label>
                    <input type="tel" id="passengerPhone" name="passengerPhone" required placeholder="+63 912 345 6789">
                </div>

                <div class="form-group-modal">
                    <label for="passengerEmail">Email Address *</label>
                    <input type="email" id="passengerEmail" name="passengerEmail" required placeholder="your.email@example.com">
                </div>

                <div class="form-group-modal">
                    <label for="numPassengers">Number of Passengers *</label>
                    <select id="numPassengers" name="numPassengers" required>
                        <option value="">Select number</option>
                        <option value="1">1 Passenger</option>
                        <option value="2">2 Passengers</option>
                        <option value="3">3 Passengers</option>
                        <option value="4">4 Passengers</option>
                        <option value="5">5 Passengers</option>
                    </select>
                </div>

                <div class="form-group-modal">
                    <label for="pickupPoint">Pickup Point</label>
                    <input type="text" id="pickupPoint" name="pickupPoint" placeholder="Exact pickup location (optional)">
                </div>

                <div class="form-group-modal">
                    <label for="specialRequests">Special Requests</label>
                    <textarea id="specialRequests" name="specialRequests" rows="3" placeholder="Any special requests or notes..."></textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-confirm">Proceed To Payment</button>
                </div>
            </form>
        </div>
    </div>
`;
document.body.appendChild(modal);

// Modal Functions
function openBookingModal(rideIndex) {
    currentRideIndex = rideIndex; // Store the current ride index
    const ride = availableRides[rideIndex];
    
    // Populate modal with ride details
    document.getElementById("modal-driver").textContent = ride.driver_name;
    document.getElementById("modal-from").textContent = ride.departure_location;
    document.getElementById("modal-to").textContent = ride.arrival_location;
    document.getElementById("modal-date").textContent = `${ride.date} at ${ride.departure_time}`;
    document.getElementById("modal-price").textContent = ride.price;
    
    // Show modal
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeBookingModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    document.getElementById("bookingForm").reset();
    currentRideIndex = null;
}

// Filter Functionality
let currentFilter = 'all';

function filterRides(filterType) {
    let sortedRides = [...availableRides];
    
    switch(filterType) {
        case 'price-low':
            sortedRides.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('₱', '').replace(',', ''));
                const priceB = parseFloat(b.price.replace('₱', '').replace(',', ''));
                return priceA - priceB;
            });
            break;
        case 'rating':
            sortedRides.sort((a, b) => b.rating - a.rating);
            break;
        case 'all':
        default:
            // Keep original order
            break;
    }
    
    currentFilter = filterType;
    renderRides(sortedRides);
    updateFilterChips(filterType);
}

function renderRides(rides) {
    ridesList.innerHTML = '';
    
    rides.forEach((ride, index) => {
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
                ${ride.rating ? `<div class="meta-item">⭐ <span>${ride.rating}</span></div>` : ''}
            </div>

            <button class="btn-book-ride" data-ride-index="${index}">Book Now</button>
        `;
        ridesList.appendChild(rideCard);
    });
    
    // Re-attach event listeners to new buttons
    attachBookNowListeners();
}

function updateFilterChips(activeFilter) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.classList.remove('active');
    });
    
    const filterMap = {
        'all': 0,
        'price-low': 1,
        'rating': 2
    };
    
    if (filterMap[activeFilter] !== undefined) {
        chips[filterMap[activeFilter]].classList.add('active');
    }
}

function attachBookNowListeners() {
    document.querySelectorAll(".btn-book-ride").forEach(button => {
        button.addEventListener("click", function() {
            const rideIndex = parseInt(this.getAttribute("data-ride-index"));
            openBookingModal(rideIndex);
        });
    });
}

// Event Listeners for Book Now buttons (initial render)
attachBookNowListeners();

// Event Listeners for Filter Chips
document.querySelectorAll('.chip').forEach((chip, index) => {
    chip.addEventListener('click', function() {
        const filters = ['all', 'price-low', 'rating'];
        filterRides(filters[index]);
    });
});

// Close modal events
document.querySelector(".close-modal").addEventListener("click", closeBookingModal);
document.querySelector(".btn-cancel").addEventListener("click", closeBookingModal);

// Close modal when clicking outside
modal.addEventListener("click", function(e) {
    if (e.target === modal) {
        closeBookingModal();
    }
});

// Form submission - UPDATED TO REDIRECT TO PAYMENT
document.getElementById("bookingForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Get the selected ride data
    const ride = availableRides[currentRideIndex];
    
    // Get form data
    const formData = {
        passenger_name: document.getElementById("passengerName").value,
        passenger_phone: document.getElementById("passengerPhone").value,
        passenger_email: document.getElementById("passengerEmail").value,
        num_passengers: document.getElementById("numPassengers").value,
        pickupPoint: document.getElementById("pickupPoint").value,
        specialRequests: document.getElementById("specialRequests").value
    };
    
    // Combine ride data with passenger data
    const bookingData = {
        ...ride, // All ride information
        ...formData // All passenger information
    };
    
    // Store booking data in sessionStorage
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Log for debugging
    console.log("Booking data stored:", bookingData);
    
    // Close modal
    closeBookingModal();
    
    // Redirect to payment page
    window.location.href = '../html/payment.html';
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

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
    
    // Add buttons to mobile menu if not already added
    if (navMenu.classList.contains('active') && !navMenu.querySelector('.mobile-nav-buttons')) {
        const mobileButtons = document.createElement('div');
        mobileButtons.className = 'mobile-nav-buttons';
        mobileButtons.innerHTML = `
            <button class="btn-Outline" onclick="window.location.href='html/login.html'">Sign In</button>
            <button class="btn-primary" onclick="window.location.href='html/signup.html'">Join Now</button>
        `;
        navMenu.appendChild(mobileButtons);
    }
}

// Initialize mobile menu functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && navMenu.classList.contains('active') && 
            !navMenu.contains(event.target) && 
            menuToggle && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('active');
        }
    });

    // Close menu when window is resized to desktop
    window.addEventListener('resize', function() {
        const navMenu = document.getElementById('navMenu');
        if (window.innerWidth > 768 && navMenu) {
            navMenu.classList.remove('active');
        }
    });
    
    // Close menu when clicking on nav links
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.addEventListener('click', function(event) {
            if (event.target.tagName === 'A') {
                navMenu.classList.remove('active');
            }
        });
    }
});