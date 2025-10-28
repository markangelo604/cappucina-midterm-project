// --- Navigation Items ---
const navItems = [
    { name: 'Home', url: 'index.html', active: false },
    { name: 'Find Rides', url: 'findrides.html', active: false },
    { name: 'Bookings', url: 'booking.html', active: true },
    { name: 'Find My Trip', url: 'about.html', active: false }
];

// --- Bookings Data ---
const bookings = [
    {
        id: '#12345',
        status: 'Confirmed',
        status_class: 'confirmed',
        driver_name: 'Juan Dela Cruz',
        driver_initials: 'JD',
        driver_color: '#4A90E2',
        rating: 4.8,
        total_ratings: '27 rates',
        pickup: 'Quezon City - UP Diliman',
        destination: 'Makati - Ayala Avenue',
        date: '7:30 AM - Oct 25, 2025',
        passengers: '1 seat booked',
        payment_status: 'Paid',
        price: '₱150'
    },
    {
        id: '#12346',
        status: 'Completed',
        status_class: 'completed',
        driver_name: 'Maria Santos',
        driver_initials: 'MS',
        driver_color: '#7B68EE',
        rating: 4.9,
        total_ratings: '42 rates',
        pickup: 'Quezon City - Commonwealth',
        destination: 'Makati - BGC',
        date: '8:00 AM - Oct 20, 2025',
        passengers: '1 seat booked',
        payment_status: 'Ride completed',
        price: '₱180'
    },
    {
        id: '#12347',
        status: 'Cancelled',
        status_class: 'cancelled',
        driver_name: 'Roberto Cruz',
        driver_initials: 'RC',
        driver_color: '#E74C3C',
        rating: 4.6,
        total_ratings: '18 rates',
        pickup: 'Quezon City - Cubao',
        destination: 'Makati - Salcedo Village',
        date: '7:00 AM - Oct 18, 2025',
        passengers: '1 seat booked',
        payment_status: 'Refunded',
        cancel_reason: 'Cancelled by driver',
        price: '₱140'
    }
];

// --- Footer Links ---
const footerLinks = {
    'Company': ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support': ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links': ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
};

// --- Populate Navigation ---
const navMenu = document.getElementById('navMenu');
navMenu.innerHTML = navItems.map(item => `
    <li>
        <a href="${item.url}" class="${item.active ? 'active' : ''}">
            ${item.name}
        </a>
    </li>
`).join('');

// --- Populate Bookings ---
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
                    ${booking.status === 'Confirmed' ? `
                        <button class="btn-secondary">View Details</button>
                        <button class="btn-danger">Cancel Booking</button>
                    ` : booking.status === 'Completed' ? `
                        <button class="btn-secondary">View Details</button>
                        <button class="btn-primary-action">Rate Driver</button>
                    ` : `
                        <button class="btn-secondary">View Details</button>
                    `}
                </div>
            </div>
        </div>
    </div>
`).join('');

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
        const cards = document.querySelectorAll('.booking-card');

        cards.forEach(card => {
            if (filter === 'all' || card.dataset.status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});
