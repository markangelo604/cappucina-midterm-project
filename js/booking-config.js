// --- Navigation Items ---
const navItems = [
    { name: 'Find Rides', url: '../html/passenger-dashboard.html', active: false  },
    { name: 'My Bookings', url: '../html/booking.html', active: true },
];

// --- Footer Links ---
const footerLinks = {
    'Company': ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support': ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links': ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
};

// Store bookings data
let bookings = [];

// --- Populate Navigation ---
const navMenu = document.getElementById('navMenu');
navMenu.innerHTML = navItems.map(item => `
    <li>
        <a href="${item.url}" class="${item.active ? 'active' : ''}">
            ${item.name}
        </a>
    </li>
`).join('');

// --- Fetch Bookings from Database ---
async function fetchBookings() {
    try {
     const urlParams = new URLSearchParams(window.location.search);
        const storedUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

        const name =
            urlParams.get('name') ||
            storedUser.name ||
            storedUser.displayName || 
            'guest';

        const response = await fetch(
            `../php/get-bookings.php?username=${(name)}`,
            { credentials: 'include' }
        );

        const data = await response.json();

        if (data.success) {
            bookings = data.bookings;
            displayBookings(bookings);
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        showError('Failed to load bookings. Please try again later.');
    }
}

// --- Display Bookings ---
function displayBookings(bookingsToShow) {
    const bookingsList = document.getElementById('bookingsList');
    
    if (bookingsToShow.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>No bookings found</h3>
                <p>You haven't made any bookings yet. Start by finding a ride!</p>
                <button class="btn-primary" onclick="window.location.href='../html/passenger-dashboard.html'">
                    Find Rides
                </button>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = bookingsToShow.map(booking => `
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
                        ${booking.status === 'Confirmed' || booking.status === 'Pending' ? `
                            <button class="btn-secondary" onclick="viewDetails('${booking.id}')">View Details</button>
                            <button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancel Booking</button>
                        ` : booking.status === 'Completed' ? `
                            <button class="btn-secondary" onclick="viewDetails('${booking.id}')">View Details</button>
                            <button class="btn-primary-action" onclick="rateDriver('${booking.id}')">Rate Driver</button>
                        ` : `
                            <button class="btn-secondary" onclick="viewDetails('${booking.id}')">View Details</button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// --- Show Error Message ---
function showError(message) {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = `
        <div class="error-message">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Error Loading Bookings</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="fetchBookings()">Retry</button>
        </div>
    `;
}

// --- Footer Links ---
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

// --- Year Update ---
document.getElementById('year').textContent = new Date().getFullYear();

// --- Filter Functionality ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const filter = this.dataset.filter;
        
        if (filter === 'all') {
            displayBookings(bookings);
        } else {
            const filtered = bookings.filter(booking => {
                const status = booking.status.toLowerCase();
                if (filter === 'confirmed') {
                    return status === 'confirmed' || status === 'pending';
                }
                return status === filter;
            });
            displayBookings(filtered);
        }
    });
});

// --- Action Functions ---
function viewDetails(bookingId) {
    alert(`Viewing details for booking ${bookingId}`);
    // Implement view details functionality
}

function cancelBooking(bookingId) {
    if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        // Implement cancel booking functionality
        alert(`Booking ${bookingId} has been cancelled.`);
        // Refresh bookings
        fetchBookings();
    }
}

function rateDriver(bookingId) {
    alert(`Opening rating dialog for booking ${bookingId}`);
    // Implement rating functionality
}

// --- Initialize ---
fetchBookings();