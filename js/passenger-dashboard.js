// ========================================
// PASSENGER DASHBOARD - REAL-TIME DATA
// ========================================

// Get user credentials from sessionStorage
let userData = null;

// Load user data
function loadUserData() {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
        userData = JSON.parse(storedUserData);
        return true;
    }
    return false;
}

// Navigation Items for Passenger
const navItems = [
    { name: 'Find Rides', url: '../html/passenger-dashboard.html', active: true },
    { name: 'My Bookings', url: '../html/booking.html', active: false },
];

// Safety Features
const safetyFeatures = [
    { icon: "🛡️", text: "Safety First" },
    { icon: "📍", text: "GPS Tracking" },
    { icon: "⭐", text: "Verified Drivers" },
    { icon: "💬", text: "In-App Chat" },
    { icon: "🔒", text: "Secure Payment" }
];

// Store current ride being booked
let currentRideData = null;

// ========================================
// DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!loadUserData()) {
        window.location.href = '../html/login.html';
        return;
    }
    
    // Render navigation
    renderNavigation();
    
    // Load user profile
    loadUserProfile();
    
    // Setup dropdown
    setupDropdown();
    
    // Render main content
    renderMainContent();
    
    // Fetch and display available rides
    fetchAvailableRides();
});

// ========================================
// NAVIGATION
// ========================================
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

// ========================================
// USER PROFILE
// ========================================
function loadUserProfile() {
    const profileImage = document.getElementById('profileImage');
    
    if (userData && userData.profile_image) {
        profileImage.src = userData.profile_image;
    }
}

function setupDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
}

// ========================================
// RENDER MAIN CONTENT
// ========================================
function renderMainContent() {
    const body = document.querySelector('body');
    
    const mainContentHTML = `
        <!-- Map Section -->
        <section class="map-section">
            <div class="map-container">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123523.12345!2d121.0244!3d14.5995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90264a0f021%3A0x2b063c8c5b6d8c01!2sMetro%20Manila!5e0!3m2!1sen!2sph!4v1234567890"
                    width="100%"
                    height="100%"
                    style="border:0;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
        </section>

        <!-- Search Section -->
        <section class="search-section">
            <div class="container-fluid">
                <form class="search-form" id="searchForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Pickup</label>
                            <input type="text" name="pickup" placeholder="Enter pickup location" class="form-input" required>
                        </div>
                        <div class="arrow-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </div>
                        <div class="form-group">
                            <label>Destination</label>
                            <input type="text" name="destination" placeholder="Enter destination" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Passengers</label>
                            <select name="passengers" class="form-input" required>
                                <option value="">Select</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-search">Search Ride</button>
                    </div>
                </form>
            </div>
        </section>

        <!-- Main Content -->
        <section class="main-content">
            <div class="container-fluid">
                <div class="content-wrapper">
                    
                    <!-- Sidebar -->
                    <aside class="sidebar">
                        <div class="safety-card" id="safetyFeatures"></div>
                    </aside>

                    <!-- Rides List -->
                    <div class="rides-section">
                        <div class="rides-header">
                            <h2>Available Rides</h2>
                            <button class="btn-filter" onclick="toggleFilters()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 7h18M6 12h12M9 17h6"/>
                                </svg>
                                Filters
                            </button>
                        </div>

                        <div class="filter-chips">
                            <button class="chip active" data-filter="all">All Rides</button>
                            <button class="chip" data-filter="price-low">Price: Low to High</button>
                            <button class="chip" data-filter="rating">Best Rated</button>
                        </div>

                        <div id="ridesList" class="rides-list">
                            <p class="loading-text">Loading available rides...</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- Booking Modal -->
        <div id="bookingModal" class="modal">
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
                            <button type="button" class="btn-cancel" onclick="closeBookingModal()">Cancel</button>
                            <button type="submit" class="btn-confirm">Proceed To Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insert after nav
    const nav = document.querySelector('.navbar');
    nav.insertAdjacentHTML('afterend', mainContentHTML);
    
    // Render safety features
    renderSafetyFeatures();
    
    // Attach event listeners
    attachEventListeners();
    
    // Pre-fill user data in booking form
    prefillUserData();
}

function renderSafetyFeatures() {
    const safetyContainer = document.getElementById('safetyFeatures');
    safetyContainer.innerHTML = safetyFeatures.map(feature => `
        <div class="safety-item">
            <span class="safety-icon">${feature.icon}</span>
            <span class="safety-text">${feature.text}</span>
        </div>
    `).join('');
}

function prefillUserData() {
    setTimeout(() => {
        if (userData) {
            const nameField = document.getElementById('passengerName');
            const phoneField = document.getElementById('passengerPhone');
            const emailField = document.getElementById('passengerEmail');
            
            if (nameField && userData.name) nameField.value = userData.name;
            if (phoneField && userData.phone) phoneField.value = userData.phone;
            if (emailField && userData.email) emailField.value = userData.email;
        }
    }, 500);
}

// ========================================
// FETCH AVAILABLE RIDES
// ========================================
async function fetchAvailableRides(searchParams = null) {
    try {
        const ridesList = document.getElementById('ridesList');
        ridesList.innerHTML = '<p class="loading-text">Loading available rides...</p>';
        
        let url = '../php/search-rides.php';
        
        if (searchParams) {
            const params = new URLSearchParams(searchParams);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            ridesList.innerHTML = `<p class="error-text">${data.message || 'Failed to load rides.'}</p>`;
            return;
        }
        
        if (!data.rides || data.rides.length === 0) {
            ridesList.innerHTML = '<p class="no-rides-text">No rides available matching your search. Try adjusting your filters!</p>';
            return;
        }
        
        renderRides(data.rides);
        
    } catch (error) {
        console.error('Error fetching rides:', error);
        const ridesList = document.getElementById('ridesList');
        ridesList.innerHTML = '<p class="error-text">Failed to load rides. Please check your connection and try again.</p>';
    }
}

// ========================================
// RENDER RIDES
// ========================================
function renderRides(rides) {
    const ridesList = document.getElementById('ridesList');
    
    ridesList.innerHTML = rides.map((ride, index) => {
        const driverName = ride.driver?.name || ride.name || ride.username || "Unknown Driver";
        const driverInitials = getInitials(driverName);
        const driverColor = generateColor(driverName);
        const rating = ride.ratings?.average || 0;
        const vehicle = ride.car_details?.model || "Vehicle Info N/A";
        const seats = ride.seat_available || ride.available_seats || 0;
        const price = ride.fare || "₱0.00";
        
        const pickupLocation = ride.starting_point || ride.from || "TBD";
        const destinationLocation = ride.destination || ride.to || "TBD";
        const departureTime = ride.time || "TBD";
        const tripDate = ride.date || "TBD";
        
        const arrivalTime = calculateArrivalTime(departureTime, ride.route?.estimated_duration_mins);
        const eta = ride.route?.estimated_duration_mins 
            ? `${ride.route.estimated_duration_mins} mins` 
            : "N/A";
        const distance = ride.route?.distance_km 
            ? `${ride.route.distance_km} km` 
            : "";
        
        return `
            <div class="ride-card" data-ride-id="${ride.ride_id || ride._id}">
                <div class="ride-header">
                    <div class="driver-info">
                        <div class="driver-avatar" style="background-color: ${driverColor}">
                            ${driverInitials}
                        </div>
                        <span class="driver-name">${driverName}</span>
                    </div>
                    <div class="ride-price">${price}</div>
                </div>

                <div class="ride-route">
                    <div class="route-item">
                        <div class="route-dot pickup"></div>
                        <div class="route-details">
                            <span class="route-time">${departureTime}</span>
                            <span class="route-location">${pickupLocation}</span>
                        </div>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-item">
                        <div class="route-dot destination"></div>
                        <div class="route-details">
                            <span class="route-time">${arrivalTime}</span>
                            <span class="route-location">${destinationLocation}</span>
                        </div>
                    </div>
                </div>

                <div class="ride-meta">
                    <div class="meta-item">🕒 <span>${tripDate}</span></div>
                    ${eta !== "N/A" ? `<div class="meta-item">⏱️ <span>${eta}</span></div>` : ''}
                    ${distance ? `<div class="meta-item">📍 <span>${distance}</span></div>` : ''}
                    ${vehicle !== "Vehicle Info N/A" ? `<div class="meta-item">🚗 <span>${vehicle}</span></div>` : ''}
                    <div class="meta-item">👺 <span>${seats} Seats</span></div>
                    ${rating > 0 ? `<div class="meta-item">⭐ <span>${rating.toFixed(1)}</span></div>` : ''}
                </div>

                ${ride.route?.stops && ride.route.stops.length > 0 ? `
                    <div class="ride-stops">
                        <small><strong>Stops:</strong> ${ride.route.stops.join(' → ')}</small>
                    </div>
                ` : ''}

                <button class="btn-book-ride" data-ride-index="${index}">Book Now</button>
            </div>
        `;
    }).join('');
    
    window.availableRidesData = rides;
    attachBookNowListeners();
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function calculateArrivalTime(departureTime, durationMins) {
    if (!departureTime || !durationMins || departureTime === "TBD") return "TBD";
    
    try {
        const timeMatch = departureTime.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) return "TBD";
        
        let hours = parseInt(timeMatch[1]);
        let minutes = parseInt(timeMatch[2]);
        
        minutes += parseInt(durationMins);
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
        hours = hours % 24;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
        return "TBD";
    }
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function generateColor(str) {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

// ========================================
// EVENT LISTENERS
// ========================================
function attachEventListeners() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
    
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            filterRides(filterType);
            
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    const closeModal = document.querySelector('.close-modal');
    const btnCancel = document.querySelector('.btn-cancel');
    const modal = document.getElementById('bookingModal');
    
    if (closeModal) closeModal.addEventListener('click', closeBookingModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeBookingModal();
        });
    }
    
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
}

function attachBookNowListeners() {
    document.querySelectorAll('.btn-book-ride').forEach(button => {
        button.addEventListener('click', function() {
            const rideIndex = parseInt(this.getAttribute('data-ride-index'));
            openBookingModal(rideIndex);
        });
    });
}

function handleSearchSubmit(e) {
    e.preventDefault();
    
    const searchParams = {
        pickup: document.querySelector('input[name="pickup"]').value,
        destination: document.querySelector('input[name="destination"]').value,
        date: document.querySelector('input[name="date"]').value,
        passengers: document.querySelector('select[name="passengers"]').value
    };
    
    fetchAvailableRides(searchParams);
}

function filterRides(filterType) {
    if (!window.availableRidesData) return;
    
    let sortedRides = [...window.availableRidesData];
    
    switch(filterType) {
        case 'price-low':
            sortedRides.sort((a, b) => {
                const priceA = parseFloat((a.fare || '₱0').toString().replace(/[^\d.]/g, ''));
                const priceB = parseFloat((b.fare || '₱0').toString().replace(/[^\d.]/g, ''));
                return priceA - priceB;
            });
            break;
        case 'rating':
            sortedRides.sort((a, b) => {
                const ratingA = a.ratings?.average || 0;
                const ratingB = b.ratings?.average || 0;
                return ratingB - ratingA;
            });
            break;
    }
    
    renderRides(sortedRides);
}

function openBookingModal(rideIndex) {
    if (!window.availableRidesData) return;
    
    const ride = window.availableRidesData[rideIndex];
    currentRideData = ride;
    
    const driverName = ride.driver?.name || ride.name || ride.username || "Unknown Driver";
    const pickupLocation = ride.starting_point || ride.from || "TBD";
    const destinationLocation = ride.destination || ride.to || "TBD";
    const tripDate = ride.date || "TBD";
    const departureTime = ride.time || "TBD";
    const price = ride.fare || ride.price || "₱0.00";
    
    document.getElementById('modal-driver').textContent = driverName;
    document.getElementById('modal-from').textContent = pickupLocation;
    document.getElementById('modal-to').textContent = destinationLocation;
    document.getElementById('modal-date').textContent = `${tripDate} at ${departureTime}`;
    document.getElementById('modal-price').textContent = price;
    
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('bookingForm').reset();
    currentRideData = null;
    prefillUserData();
}

function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (!currentRideData) {
        alert('No ride selected');
        return;
    }
    
    const formData = {
        passenger_name: document.getElementById('passengerName').value,
        passenger_phone: document.getElementById('passengerPhone').value,
        passenger_email: document.getElementById('passengerEmail').value,
        num_passengers: document.getElementById('numPassengers').value,
        pickupPoint: document.getElementById('pickupPoint').value,
        specialRequests: document.getElementById('specialRequests').value
    };
    
    const bookingData = {
        ...currentRideData,
        ...formData,
        passenger_id: userData.id,
        booking_date: new Date().toISOString()
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    closeBookingModal();
    window.location.href = '../html/payment.html';
}