// Configuration Data
const pageTitle = "Payment - MerryLift";
document.title = pageTitle;

const navItems = [
    { name: 'Find Rides', url: '../html/passenger-dashboard.html', active: false },
    { name: 'My Bookings', url: '../html/booking.html', active: false },
    { name: 'Payment', url: '../html/payment.html', active: true },
];

const footerLinks = {
    "Company": ["About Us", "How It Works", "Careers", "Press"],
    "Support": ["Help Center", "Safety", "Contact Us", "Trust & Safety"],
    "Quick Links": ["Find Rides", "Offer Ride", "My Bookings", "Trip History"]
};

// Promo codes
const promoCodes = {
    "WELCOME10": { discount: 0.10, type: "percentage" },
    "SAVE20": { discount: 20, type: "fixed" },
    "NEWUSER": { discount: 0.15, type: "percentage" },
    "RIDE50": { discount: 50, type: "fixed" }
};

// Get booking data from URL or sessionStorage
function getBookingData() {
    // Try to get from sessionStorage first
    const storedData = sessionStorage.getItem('bookingData');
    if (storedData) {
        return JSON.parse(storedData);
    }

    // Default data if nothing is stored
    return null;
}

// Initialize booking data
const bookingData = getBookingData();
let baseFare = parseFloat((bookingData?.price || bookingData?.fare || '₱0').toString().replace(/[^\d.]/g, ''));
let serviceFee = baseFare * 0.10;
let discountAmount = 0;
let appliedPromoCode = null;

// Render Navigation
const navMenu = document.getElementById("navMenu");
navItems.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.url}" class="${item.active ? "active" : ""}">${item.name}</a>`;
    navMenu.appendChild(li);
});

// Populate Summary
function populateSummary() {
    if (!bookingData) {
        console.error('No booking data found');
        return;
    }

    // ========================================
    // PICKUP LOCATION - Now correctly displays user's selected pickup point
    // ========================================
    const pickupLocation = bookingData.pickupPoint || 
                           bookingData.pickup || 
                           bookingData.from || 
                           'Not specified';
    
    document.getElementById("summary-pickup").textContent = pickupLocation;
    
    // If coordinates are available, show them as hint
    if (bookingData.pickupCoordinates) {
        const pickupElement = document.getElementById("summary-pickup");
        pickupElement.title = `Coordinates: ${bookingData.pickupCoordinates.lat.toFixed(6)}, ${bookingData.pickupCoordinates.lng.toFixed(6)}`;
    }

    // ========================================
    // DESTINATION - Driver's destination
    // ========================================
    const destinationLocation = bookingData.destination || 
                                bookingData.to || 
                                bookingData.arrival_location || 
                                'Not specified';
    
    document.getElementById("summary-destination").textContent = destinationLocation;

    // ========================================
    // TIME DISPLAY
    // ========================================
    const pickupTime = bookingData.time || 
                       bookingData.departure_time || 
                       '00:00';
    document.getElementById("summary-pickup-time").textContent = pickupTime;

    const arrivalTime = bookingData.arrival_time || 
                        calculateArrivalTime(pickupTime, bookingData.eta) || 
                        '00:00';
    document.getElementById("summary-arrival-time").textContent = arrivalTime;
    
    // ========================================
    // DRIVER INFORMATION
    // ========================================
    const driverName = bookingData.driver_name || 
                       bookingData.name || 
                       bookingData.username || 
                       'Unknown Driver';
    
    const driverAvatar = document.getElementById("summary-driver-avatar");
    const initials = getInitials(driverName);
    driverAvatar.textContent = initials;
    driverAvatar.style.backgroundColor = bookingData.driver_color || generateColor(driverName);
    
    document.getElementById("summary-driver-name").textContent = driverName;
    
    const rating = bookingData.rating || 
                   (bookingData.ratings?.average) || 
                   0;
    document.getElementById("summary-rating").textContent = rating.toFixed(1);
    
    const vehicle = bookingData.vehicle || 
                    bookingData.car_details?.model || 
                    'Vehicle';
    const seats = bookingData.seats || 
                  bookingData.available_seats || 
                  bookingData.car_details?.seats || 
                  4;
    document.getElementById("summary-vehicle").textContent = `${vehicle} • ${seats} Seats`;
   
    // ========================================
    // PASSENGER INFORMATION
    // ========================================
    document.getElementById("summary-passenger-name").textContent = 
        bookingData.passenger_name || "-";
    
    document.getElementById("summary-passenger-phone").textContent = 
        bookingData.passenger_phone || "-";
    
    const numPassengers = bookingData.num_passengers || 1;
    document.getElementById("summary-num-passengers").textContent = 
        `${numPassengers} Passenger${numPassengers > 1 ? 's' : ''}`;
    
    // ========================================
    // PRICE CALCULATION
    // ========================================
    updatePriceBreakdown();
    
    console.log('✅ Summary populated with pickup:', pickupLocation);
}

function calculateArrivalTime(departureTime, eta) {
    if (!departureTime || !eta) return null;
    
    try {
        const [hours, minutes] = departureTime.split(':').map(Number);
        const etaMinutes = parseInt(eta) || 0;
        
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes + etaMinutes);
        
        return date.toTimeString().slice(0, 5);
    } catch (e) {
        return null;
    }
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function generateColor(str) {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

// Update Price Breakdown
function updatePriceBreakdown() {
    const total = baseFare + serviceFee - discountAmount;
    
    document.getElementById("base-fare").textContent = `₱${baseFare.toFixed(2)}`;
    document.getElementById("service-fee").textContent = `₱${serviceFee.toFixed(2)}`;
    document.getElementById("discount-amount").textContent = discountAmount > 0 ? `-₱${discountAmount.toFixed(2)}` : `-₱0.00`;
    document.getElementById("total-amount").textContent = `₱${total.toFixed(2)}`;
    
    // Update all pay buttons
    document.querySelectorAll('[id^="pay-amount"]').forEach(el => {
        el.textContent = total.toFixed(2);
    });
}

// Payment Method Selection
const paymentOptions = document.querySelectorAll('.payment-option');
const paymentForms = document.querySelectorAll('.payment-form');

paymentOptions.forEach(option => {
    option.addEventListener('click', function() {
        const method = this.dataset.method;
        
        // Update active states
        paymentOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // Update radio button
        this.querySelector('input[type="radio"]').checked = true;
        
        // Show corresponding form
        paymentForms.forEach(form => form.classList.remove('active'));
        document.getElementById(`${method}Form`).classList.add('active');
    });
});

// Card Number Formatting
const cardNumberInput = document.getElementById('cardNumber');
if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
}

// Card Expiry Formatting
const cardExpiryInput = document.getElementById('cardExpiry');
if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });
}

// CVV Input (numbers only)
const cardCVVInput = document.getElementById('cardCVV');
if (cardCVVInput) {
    cardCVVInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// Promo Code Application
function applyPromoCode(inputId) {
    const promoInput = document.getElementById(inputId);
    const code = promoInput.value.trim().toUpperCase();
    
    if (!code) {
        alert("Please enter a promo code");
        return;
    }
    
    if (promoCodes[code]) {
        const promo = promoCodes[code];
        
        if (promo.type === "percentage") {
            discountAmount = baseFare * promo.discount;
        } else if (promo.type === "fixed") {
            discountAmount = promo.discount;
        }
        
        // Ensure discount doesn't exceed base fare
        if (discountAmount > baseFare) {
            discountAmount = baseFare;
        }
        
        appliedPromoCode = code;
        updatePriceBreakdown();
        
        alert(`Promo code "${code}" applied successfully! You saved ₱${discountAmount.toFixed(2)}`);
        promoInput.value = code;
        promoInput.disabled = true;
    } else {
        alert("Invalid promo code. Please try again.");
    }
}

// Attach promo code event listeners
document.querySelectorAll('.btn-apply-promo').forEach(btn => {
    btn.addEventListener('click', function() {
        const form = this.closest('.payment-form');
        const promoInput = form.querySelector('.promo-input');
        applyPromoCode(promoInput.id);
    });
});

// Form Submissions
document.getElementById('cardForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processPayment('card');
});

document.getElementById('gcashForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processPayment('gcash');
});

document.getElementById('paymayaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processPayment('paymaya');
});

document.getElementById('cashForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processPayment('cash');
});

// Process Payment
async function processPayment(method) {
    const total = baseFare + serviceFee - discountAmount;
    
    // Validate booking data exists
    if (!bookingData) {
        alert('Booking data is missing. Please start over.');
        return;
    }

    // Validate pickup coordinates exist
    if (!bookingData.pickupCoordinates || 
        !bookingData.pickupCoordinates.lat || 
        !bookingData.pickupCoordinates.lng) {
        alert('Pickup location is missing. Please select a valid pickup point.');
        return;
    }

    // Create payment data object
    const paymentData = {
        booking_id: 'BK' + Date.now(),
        method: method,
        amount: total.toFixed(2),
        booking_details: bookingData,
        promo_code: appliedPromoCode,
        discount: discountAmount.toFixed(2),
        timestamp: new Date().toISOString()
    };
    
    // Store payment data
    sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
    
    // Show loading state
    const submitBtn = event.target.querySelector('.btn-pay');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Processing...</span>';
    submitBtn.disabled = true;
    
    // Simulate payment processing
    setTimeout(() => {
        // For e-wallets, simulate redirect
        if (method === 'gcash' || method === 'paymaya') {
            alert(`Redirecting to ${method.toUpperCase()}...`);
            setTimeout(() => {
                redirectToConfirmation(paymentData);
            }, 1000);
        } else {
            redirectToConfirmation(paymentData);
        }
    }, 2000);
}

// Redirect to Confirmation Page
async function redirectToConfirmation(paymentData) {
    try {
        console.log('💳 Processing payment and creating booking...');
        
        const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
        const userData = JSON.parse(sessionStorage.getItem('userData')) || {};

        if (!userData?.username || !bookingData?._id) {
            alert('Missing booking or user data. Cannot continue.');
            return;
        }

        // Validate pickup coordinates
        if (!bookingData.pickupCoordinates || 
            !bookingData.pickupCoordinates.lat || 
            !bookingData.pickupCoordinates.lng) {
            alert('Pickup coordinates missing. Cannot continue.');
            return;
        }

        console.log('Pickup coordinates:', bookingData.pickupCoordinates);

        // ========================================
        // STEP 1: Create Booking (happens AFTER payment intent)
        // ========================================
        const bookingPayload = {
            passenger_username: userData.username,
            ride_id: bookingData._id || bookingData.id,
            num_passengers: bookingData.num_passengers || 1,
            pickup_coordinates: {
                lat: parseFloat(bookingData.pickupCoordinates.lat),
                lng: parseFloat(bookingData.pickupCoordinates.lng)
            },
            pickup_address: bookingData.pickupPoint || 'Not specified'
        };

        console.log('Creating booking with payload:', bookingPayload);

        const bookingRes = await fetch('../php/create-booking-after-payment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        const bookingResult = await bookingRes.json();
        console.log('Booking response:', bookingResult);

        if (!bookingResult.success) {
            alert(`Failed to create booking: ${bookingResult.message}`);
            return;
        }

        const bookingId = bookingResult.booking_id;
        console.log('Booking created:', bookingId);

        // ========================================
        // STEP 2: Record Payment
        // ========================================
        const paymentPayload = {
            passenger_username: userData.username,
            ride_id: bookingData._id || bookingData.id,
            booking_id: bookingId,
            payment_method: paymentData.method,
            payment_amount: paymentData.amount
        };

        console.log('Recording payment with payload:', paymentPayload);

        const paymentRes = await fetch('../php/record-payment-after-booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentPayload)
        });

        const paymentResult = await paymentRes.json();
        console.log('💳 Payment response:', paymentResult);

        if (!paymentResult.success) {
            alert(`Payment recorded but with issues: ${paymentResult.message}`);
            // Continue anyway since booking was created
        }

        // ========================================
        // STEP 3: Update Ride with Pickup Point (NEW!)
        // ========================================
        const updateRidePayload = {
            ride_id: bookingData._id || bookingData.id,
            passenger_username: userData.username,
            pickup_coordinates: {
                lat: parseFloat(bookingData.pickupCoordinates.lat),
                lng: parseFloat(bookingData.pickupCoordinates.lng),
                address: bookingData.pickupPoint || 'Not specified'
            }
        };

        console.log('Updating ride with pickup point:', updateRidePayload);

        const updateRideRes = await fetch('../php/update-ride-pickup-point.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateRidePayload)
        });

        const updateRideResult = await updateRideRes.json();
        console.log('📍 Ride update response:', updateRideResult);

        if (updateRideResult.success) {
            console.log('Pickup point added to ride document');
        } else {
            console.warn('Failed to update ride with pickup point:', updateRideResult.message);
            // Don't fail the entire transaction for this
        }

        // ========================================
        // SUCCESS!
        // ========================================
        alert(`Payment Successful!\n\nBooking ID: ${bookingId}\nYour ride is confirmed!`);

        // Clear session data
        sessionStorage.removeItem('bookingData');
        sessionStorage.removeItem('paymentData');

        // Redirect to bookings page
        setTimeout(() => {
            window.location.href = '../html/booking.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Error processing payment/booking:', error);
        alert('An error occurred while processing your payment. Please contact support.');
    }
}


async function createBookingAfterPayment() {
    const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));
    const userData = JSON.parse(sessionStorage.getItem('userData'));

    console.log('bookingData:', bookingData);
    console.log('userData:', userData);

    if (!userData?.name || !bookingData?._id) {
        alert('Missing booking or user data. Cannot create booking.');
        return;
    }

    const payload = {
        passenger_username: userData.name,  
        ride_id: bookingData._id || bookingData.id 
    };

    console.log('Sending payload:', payload);

    const response = await fetch('../php/user-model.php?action=createBooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('API result:', result);

    if (result.success) {
        alert(`Booking created!\nBooking ID: ${result.booking_id}`);
    } else {
        alert(`Booking failed: ${result.message}`);
    }
}

// Phone number formatting
function formatPhoneNumber(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('63')) {
            value = value.slice(0, 12);
            if (value.length > 2) {
                value = '+63 ' + value.slice(2, 5) + (value.length > 5 ? ' ' + value.slice(5, 8) : '') + (value.length > 8 ? ' ' + value.slice(8) : '');
            } else {
                value = '+' + value;
            }
        } else if (value.startsWith('0')) {
            value = value.slice(0, 11);
            if (value.length > 4) {
                value = value.slice(0, 4) + ' ' + value.slice(4, 7) + (value.length > 7 ? ' ' + value.slice(7) : '');
            }
        }
        e.target.value = value;
    });
}
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}
// Apply phone formatting to all phone inputs
const gcashNumber = document.getElementById('gcashNumber');
const paymayaNumber = document.getElementById('paymayaNumber');
if (gcashNumber) formatPhoneNumber(gcashNumber);
if (paymayaNumber) formatPhoneNumber(paymayaNumber);

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

// Set year
document.getElementById("year").textContent = new Date().getFullYear();

// Initialize
populateSummary();

// Handle back button
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        location.reload();
    }
});

// Clear session storage on successful payment (called from redirectToConfirmation)
// This prevents back button issues
function clearPaymentSession() {
    sessionStorage.removeItem('bookingData');
    sessionStorage.removeItem('paymentData');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Payment page loaded');
    console.log('📦 Booking data:', bookingData);
    
    if (!bookingData) {
        console.error('❌ No booking data found!');
        alert('No booking information found. Please start from the booking page.');
        window.location.href = '../html/passenger-dashboard.html';
        return;
    }
    
    populateSummary();
});