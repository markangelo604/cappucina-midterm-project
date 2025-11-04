// ========================================
// DYNAMIC BOOKING CONFIGURATION
// ========================================

// Navigation Items
const navItems = [
    { name: 'Home', url: '../index.html', active: false },
    { name: 'Find Rides', url: '../html/findrides.html', active: false },
    { name: 'Bookings', url: '../html/booking.html', active: true },
    { name: 'About', url: '../html/about.html', active: false }
];

// Footer Links
const footerLinks = {
    'Company': ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support': ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links': ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
};

// Current filter
let currentFilter = 'all';

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Render navigation
    renderNavigation();
    
    // Render footer
    renderFooter();
    
    // Set year
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Fetch user bookings
    fetchUserBookings();
    
    // Attach filter listeners
    attachFilterListeners();
});

// ========================================
// AUTHENTICATION CHECK
// ========================================
function checkAuthentication() {
    const userData = sessionStorage.getItem('userData');
    
    if (!userData) {
        // Redirect to login if not authenticated
        window.location.href = '../html/login.html';
        return;
    }
}

// ========================================
// RENDER NAVIGATION
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
// FETCH USER BOOKINGS
// ========================================
async function fetchUserBookings(filter = 'all') {
    const bookingsList = document.getElementById('bookingsList');
    
    // Show loading
    bookingsList.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading your bookings...</p>
        </div>
    `;
    
    try {
        const url = filter === 'all' 
            ? '../php/get-user-bookings.php'
            : `../php/get-user-bookings.php?filter=${filter}`;
            
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch bookings');
        }
        
        if (data.bookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="no-bookings">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="8" y="8" width="48" height="48" rx="4"/>
                        <line x1="8" y1="20" x2="56" y2="20"/>
                        <line x1="20" y1="32" x2="44" y2="32"/>
                        <line x1="20" y1="44" x2="36" y2="44"/>
                    </svg>
                    <h3>No bookings found</h3>
                    <p>${filter === 'all' ? 'You haven\'t made any bookings yet.' : 'No ' + filter + ' bookings found.'}</p>
                    <a href="../html/findrides.html" class="btn-primary">Find Rides</a>
                </div>
            `;
            return;
        }
        
        renderBookings(data.bookings);
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        bookingsList.innerHTML = `
            <div class="error-container">
                <p class="error-message">Failed to load bookings: ${error.message}</p>
                <button onclick="fetchUserBookings('${filter}')" class="btn-retry">Retry</button>
            </div>
        `;
    }
}

// ========================================
// RENDER BOOKINGS
// ========================================
function renderBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card" data-status="${booking.status.toLowerCase()}">
            <div class="card-left-border status-${booking.status_class}"></div>
            <div class="booking-main">
                <div class="booking-header-row">
                    <div class="status-badge status-${booking.status_class}">${booking.status}</div>
                    <div class="booking-id-price">
                        <span class="booking-id">Booking ${booking.id}</span>
                        <span class="booking-price">${booking.price}</span>
                    </div>
                </div>

                <div class="booking-body">
                    <div class="route-section">
                        <div class="route-item">
                            <svg width="12" height="12" viewBox="0 0 12 12" class="route-icon">
                                <circle cx="6" cy="6" r="4" fill="#E74C3C"/>
                            </svg>
                            <span class="route-text">${booking.pickup}</span>
                        </div>
                        <div class="route-item">
                            <svg width="12" height="12" viewBox="0 0 12 12" class="route-icon">
                                <circle cx="6" cy="6" r="4" fill="#9B59B6"/>
                            </svg>
                            <span class="route-text">${booking.destination}</span>
                        </div>
                    </div>

                    <div class="booking-details">
                        <div class="detail-item">
                            <span>${booking.date}</span>
                        </div>
                        <div class="detail-item">
                            <span>${booking.passengers}</span>
                        </div>
                        <div class="detail-item">
                            <span>${booking.payment_status}</span>
                        </div>
                        ${booking.cancel_reason ? `
                            <div class="detail-item cancel-reason">
                                <span>${booking.cancel_reason}</span>
                            </div>
                            <div class="detail-item refund-badge">
                                <span>Refunded</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="booking-footer">
                    <div class="driver-info">
                        <div class="driver-avatar" style="background-color: ${booking.driver_color};">
                            ${booking.driver_initials}
                        </div>
                        <div class="driver-details">
                            <h4>${booking.driver_name}</h4>
                            <div class="driver-rating">
                                <span class="star-icon">★</span>
                                <span>${booking.rating}</span>
                                <span class="rating-count">${booking.total_ratings}</span>
                            </div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        ${getActionButtons(booking.status, booking.booking_id)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Attach action button listeners
    attachActionListeners();
}

// ========================================
// GET ACTION BUTTONS BASED ON STATUS
// ========================================
function getActionButtons(status, bookingId) {
    if (status === 'Confirmed' || status === 'Pending') {
        return `
            <button class="btn-secondary" onclick="viewBookingDetails('${bookingId}')">View Details</button>
            <button class="btn-danger" onclick="cancelBooking('${bookingId}')">Cancel Booking</button>
        `;
    } else if (status === 'Completed') {
        return `
            <button class="btn-secondary" onclick="viewBookingDetails('${bookingId}')">View Details</button>
            <button class="btn-primary-action" onclick="rateDriver('${bookingId}')">Rate Driver</button>
        `;
    } else {
        return `
            <button class="btn-secondary" onclick="viewBookingDetails('${bookingId}')">View Details</button>
        `;
    }
}

// ========================================
// FILTER FUNCTIONALITY
// ========================================
function attachFilterListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Get filter value
            const filter = this.dataset.filter;
            currentFilter = filter;
            
            // Fetch filtered bookings
            fetchUserBookings(filter);
        });
    });
}

// ========================================
// ACTION HANDLERS
// ========================================
function attachActionListeners() {
    // These are already attached via onclick in getActionButtons
}

function viewBookingDetails(bookingId) {
    console.log('Viewing details for booking:', bookingId);
    // Implement modal or redirect to details page
    alert('View details for booking: ' + bookingId);
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        console.log('Canceling booking:', bookingId);
        // Make API call to cancel booking
        alert('Booking cancelled: ' + bookingId);
        fetchUserBookings(currentFilter);
    }
}

function rateDriver(bookingId) {
    console.log('Rating driver for booking:', bookingId);
    // Implement rating modal
    alert('Rate driver for booking: ' + bookingId);
}

// ========================================
// FOOTER
// ========================================
function renderFooter() {
    const footerContent = document.getElementById('footerContent');
    footerContent.innerHTML = `
        <div class="footer-brand">
            <h3>MerryLift</h3>
            <p>Your trusted carpooling platform in the Philippines. Share rides, save money, and build community through travel.</p>
        </div>
        ${Object.entries(footerLinks).map(([category, links]) => `
            <div class="footer-links">
                <h4>${category}</h4>
                <ul>
                    ${links.map(link => `<li><a href="#">${link}</a></li>`).join('')}
                </ul>
            </div>
        `).join('')}
    `;
}

// ========================================
// LOADING STYLES
// ========================================
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    .loading-container, .no-bookings, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #073066;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .no-bookings svg {
        color: #ccc;
        margin-bottom: 20px;
    }
    
    .no-bookings h3 {
        color: #073066;
        margin-bottom: 10px;
    }
    
    .no-bookings p {
        color: #666;
        margin-bottom: 20px;
    }
    
    .error-message {
        color: #dc3545;
        margin-bottom: 20px;
    }
    
    .btn-retry {
        padding: 10px 24px;
        background: #073066;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .btn-retry:hover {
        background: #052347;
    }
`;
document.head.appendChild(loadingStyles);