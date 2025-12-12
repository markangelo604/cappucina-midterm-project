// Global variables for modal map
let bookingModalMap = null;
let bookingDirectionsService = null;
let bookingDirectionsRenderer = null;
let bookingPickupMarker = null;
let bookingDestMarker = null;

// Load Google Maps API
async function loadGoogleMapsForBookings() {
    try {
        const response = await fetch('/../../Server/Models/get-api-key.php');
        const data = await response.json();

        if (!data.key) throw new Error('API key not found');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&callback=initBookingMaps`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

    } catch (error) {
        console.error('Error loading Google Maps:', error);
    }
}

// Initialize booking maps callback
function initBookingMaps() {
    console.log('✅ Google Maps loaded for bookings');
}

// Open booking modal with route details
async function openBookingModal(booking) {
    console.log('📍 Opening booking modal for:', booking);
    
    // Create modal if it doesn't exist
    if (!document.getElementById('bookingDetailsModal')) {
        createBookingDetailsModal();
    }
    
    const modal = document.getElementById('bookingDetailsModal');
    
    // Populate booking details
    document.getElementById('modal-booking-id').textContent = booking.id;
    document.getElementById('modal-booking-status').textContent = booking.status;
    document.getElementById('modal-booking-status').className = `status-badge status-${booking.status_class}`;
    document.getElementById('modal-driver-name').textContent = booking.driver_name;
    document.getElementById('modal-pickup-location').textContent = booking.pickup;
    document.getElementById('modal-destination').textContent = booking.destination;
    document.getElementById('modal-date').textContent = booking.date;
    document.getElementById('modal-passengers').textContent = booking.passengers;
    document.getElementById('modal-price').textContent = booking.price;
    document.getElementById('modal-plate').textContent = booking.plate_number;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Wait for modal to be visible, then initialize map
    setTimeout(() => {
        initializeBookingMap(booking);
    }, 300);
}

// Initialize map for booking details
async function initializeBookingMap(booking) {
    console.log('🗺️ Initializing booking details map...');
    
    if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps not loaded yet!');
        alert('Map is loading, please wait and try again.');
        return;
    }
    
    const mapContainer = document.getElementById('bookingMapContainer');
    if (!mapContainer) {
        console.error('❌ Map container not found!');
        return;
    }
    
    // Force container dimensions
    mapContainer.style.width = '100%';
    mapContainer.style.height = '400px';
    mapContainer.style.minHeight = '400px';
    
    try {
        // Create map instance
        bookingModalMap = new google.maps.Map(mapContainer, {
            center: { lat: 16.4023, lng: 120.5960 },
            zoom: 15,
            minZoom: 13,
            maxZoom: 18,
            restriction: {
                latLngBounds: {
                    north: 16.85,
                    south: 16.05,
                    west: 120.40,
                    east: 120.85
                },
                strictBounds: false
            },
            streetViewControl: false,
            mapTypeControl: true,
            zoomControl: true
        });
        
        console.log('✅ Map created successfully');
        
        // Initialize DirectionsService
        bookingDirectionsService = new google.maps.DirectionsService();
        bookingDirectionsRenderer = new google.maps.DirectionsRenderer({
            map: bookingModalMap,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#4CAF50',
                strokeWeight: 6,
                strokeOpacity: 0.8
            }
        });
        
        // Draw route
        await drawBookingRoute(booking);
        
    } catch (error) {
        console.error('❌ Error initializing map:', error);
        alert('Failed to load map. Please try again.');
    }
}

// Draw route on booking map
async function drawBookingRoute(booking) {
    console.log('🛣️ Drawing route from', booking.pickup, 'to', booking.destination);
    
    if (!booking.pickup || !booking.destination) {
        console.error('❌ Invalid origin or destination');
        return;
    }
    
    return new Promise((resolve, reject) => {
        bookingDirectionsService.route(
            {
                origin: booking.pickup,
                destination: booking.destination,
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'PH'
            },
            (response, status) => {
                if (status === google.maps.DirectionsStatus.OK && response) {
                    console.log('✅ Directions received');
                    
                    // Display route
                    bookingDirectionsRenderer.setDirections(response);
                    
                    // Get coordinates from response
                    const route = response.routes[0];
                    const originLocation = route.legs[0].start_location;
                    const destinationLocation = route.legs[0].end_location;
                    
                    // Add markers
                    addBookingMarkers(originLocation, destinationLocation, booking);
                    
                    // Check if this booking is ongoing - show pickup point
                    if (booking.status_class === 'ongoing' || booking.status === 'Confirmed') {
                        fetchAndShowPickupPoint(booking);
                    }
                    
                    resolve(response);
                } else {
                    console.error('❌ Directions request failed:', status);
                    reject(new Error(status));
                }
            }
        );
    });
}

// Add markers to booking map
function addBookingMarkers(originLocation, destinationLocation, booking) {
    console.log('📍 Adding route markers');
    
    // Clear existing markers
    if (bookingPickupMarker) bookingPickupMarker.setMap(null);
    if (bookingDestMarker) bookingDestMarker.setMap(null);
    
    // Add green marker for pickup
    bookingPickupMarker = new google.maps.Marker({
        position: originLocation,
        map: bookingModalMap,
        title: "Pickup: " + booking.pickup,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        zIndex: 500
    });
    
    // Add red marker for destination
    bookingDestMarker = new google.maps.Marker({
        position: destinationLocation,
        map: bookingModalMap,
        title: "Destination: " + booking.destination,
        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        zIndex: 500
    });
    
    console.log('✅ Route markers added');
}

// Fetch and show passenger's specific pickup point
async function fetchAndShowPickupPoint(booking) {
    try {
        console.log('📍 Fetching pickup point for booking:', booking.booking_id);
        
        // Fetch booking details from database to get pickup coordinates
        const response = await fetch(`../php/get-booking-details.php?booking_id=${booking.booking_id}`);
        const data = await response.json();
        
        if (data.success && data.booking.pickup_point) {
            const pickupCoords = data.booking.pickup_point.coordinates;
            
            console.log('✅ Pickup point found:', pickupCoords);
            
            // Add blue marker for passenger's pickup point
            const passengerPickupMarker = new google.maps.Marker({
                position: {
                    lat: pickupCoords.lat,
                    lng: pickupCoords.lng
                },
                map: bookingModalMap,
                title: "Your Pickup Point",
                icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new google.maps.Size(40, 40)
                },
                zIndex: 1000
            });
            
            // Pan map to show pickup point
            bookingModalMap.panTo({
                lat: pickupCoords.lat,
                lng: pickupCoords.lng
            });
            
            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="padding: 10px;">
                    <strong>Your Pickup Point</strong><br>
                    <small>${data.booking.pickup_point.address || 'Custom location'}</small>
                </div>`
            });
            
            passengerPickupMarker.addListener('click', () => {
                infoWindow.open(bookingModalMap, passengerPickupMarker);
            });
        }
    } catch (error) {
        console.warn('Could not fetch pickup point:', error);
    }
}

// Create booking details modal
function createBookingDetailsModal() {
    const modal = document.createElement('div');
    modal.id = 'bookingDetailsModal';
    modal.className = 'booking-modal';
    modal.innerHTML = `
        <div class="booking-modal-content">
            <div class="booking-modal-header">
                <h2>Booking Details</h2>
                <button class="close-booking-modal" onclick="closeBookingModal()">&times;</button>
            </div>
            <div class="booking-modal-body">
                <div class="booking-info-section">
                    <h3>Trip Information</h3>
                    <div class="info-row">
                        <span class="info-label">Booking ID:</span>
                        <span id="modal-booking-id" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span id="modal-booking-status" class="status-badge">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Driver:</span>
                        <span id="modal-driver-name" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Pickup:</span>
                        <span id="modal-pickup-location" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Destination:</span>
                        <span id="modal-destination" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span id="modal-date" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Passengers:</span>
                        <span id="modal-passengers" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Price:</span>
                        <span id="modal-price" class="info-value price-highlight">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Plate Number:</span>
                        <span id="modal-plate" class="info-value">-</span>
                    </div>
                </div>
                <div class="booking-map-section">
                    <h3>Route Map</h3>
                    <div id="bookingMapContainer" class="booking-map-container"></div>
                    <div class="map-legend">
                        <div class="legend-item">
                            <span class="legend-marker" style="background: #34A853;"></span>
                            <span>Pickup Location</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-marker" style="background: #EA4335;"></span>
                            <span>Destination</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-marker" style="background: #4285F4;"></span>
                            <span>Your Pickup Point</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .booking-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        
        .booking-modal.show {
            display: flex !important;
        }
        
        .booking-modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .booking-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .booking-modal-header h2 {
            margin: 0;
            font-size: 20px;
            color: #333;
        }
        
        .close-booking-modal {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 32px;
            height: 32px;
        }
        
        .close-booking-modal:hover {
            color: #333;
        }
        
        .booking-modal-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .booking-info-section, .booking-map-section {
            display: flex;
            flex-direction: column;
        }
        
        .booking-info-section h3, .booking-map-section h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .info-label {
            font-weight: 500;
            color: #666;
        }
        
        .info-value {
            color: #333;
            text-align: right;
        }
        
        .price-highlight {
            color: #4CAF50;
            font-weight: 600;
            font-size: 18px;
        }
        
        .booking-map-container {
            width: 100%;
            height: 400px;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
        }
        
        .map-legend {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 12px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .legend-marker {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .clickable-booking {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .clickable-booking:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .view-route-hint {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: #4CAF50;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .booking-modal-body {
                grid-template-columns: 1fr;
            }
            
            .booking-modal-content {
                width: 95%;
                max-height: 95vh;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeBookingModal();
    });
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear markers
        if (bookingPickupMarker) bookingPickupMarker.setMap(null);
        if (bookingDestMarker) bookingDestMarker.setMap(null);
        
        // Clear route
        if (bookingDirectionsRenderer) {
            bookingDirectionsRenderer.setDirections({ routes: [] });
        }
    }
}

// Update the displayBookings function to make cards clickable
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
        <div class="booking-card clickable-booking" data-status="${booking.status.toLowerCase()}" onclick='openBookingModal(${JSON.stringify(booking).replace(/'/g, "&#39;")})'>
            <div class="card-left-border status-${booking.status_class}"></div>
            <div class="booking-main">
                <div class="booking-header-row">
                    <div class="status-badge status-${booking.status_class}">${booking.status}</div>
                    <div class="booking-id-price">
                        <span class="booking-id">${booking.id}</span>
                        <span class="booking-price">${booking.price}</span>
                    </div>
                </div>

                <div class="booking-body">
                    <div class="route-section">
                        <div class="route-item">
                            <svg width="12" height="12" viewBox="0 0 12 12" class="route-icon">
                                <circle cx="6" cy="6" r="4" fill="#34A853"/>
                            </svg>
                            <span class="route-text">${booking.pickup}</span>
                        </div>
                        <div class="route-item">
                            <svg width="12" height="12" viewBox="0 0 12 12" class="route-icon">
                                <circle cx="6" cy="6" r="4" fill="#EA4335"/>
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
                        </div>
                    </div>
                    <div class="view-route-hint">
                        <span>📍 Click to view route</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize Google Maps on page load
document.addEventListener('DOMContentLoaded', function() {
    loadGoogleMapsForBookings();
});