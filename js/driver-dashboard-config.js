// ========================================
// DRIVER DASHBOARD JAVASCRIPT - WITH COMPLETE BUTTON
// ========================================

let map;
let startAutocomplete;
let destAutocomplete;
let startMarker = null;
let destMarker = null;
let directionsServiceDriver;
let directionsRendererDriver;
let startPlaceDriver = null;
let destPlaceDriver = null;
let userMarkerDriver = null;

// Get driver username from session
let driverUsername = null;
let destinations = [];

// DOM Elements
const addDestinationForm = document.getElementById('addDestinationForm');
const destinationsList = document.getElementById('destinationsList');
const emptyState = document.getElementById('emptyState');
const destinationCount = document.getElementById('destinationCount');
const currentYearSpan = document.getElementById('currentYear');


// ========================================
// GOOGLE MAPS
// ========================================
function initGoogleMap() {
    const baguioCity = { lat: 16.4023, lng: 120.5960 };
    map = new google.maps.Map(document.getElementById("map") || document.createElement('div'), {
        center: baguioCity,
        zoom: 13,
        streetView: null,       
        streetViewControl: false,
    });

    directionsServiceDriver = new google.maps.DirectionsService();
    directionsRendererDriver = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });

    initDriverAutocomplete();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (userMarkerDriver) userMarkerDriver.setMap(null);
            userMarkerDriver = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location",
                icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
            map.setCenter(userLocation);
        }, () => {
            // geolocation denied/failed
        });
    }
}

function initDriverAutocomplete() {
    const pickupInput = document.getElementById('pickup');
    const destInput = document.getElementById('destination');

    if (!pickupInput || !destInput || !google || !google.maps || !google.maps.places) {
        console.warn('Driver Autocomplete: inputs or Google Places not ready.');
        return;
    }

    const options = { fields: ['place_id', 'geometry', 'formatted_address', 'name'] };

    startAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
    destAutocomplete = new google.maps.places.Autocomplete(destInput, options);

    startAutocomplete.addListener('place_changed', async () => {
    const place = startAutocomplete.getPlace();
    if (!place.geometry) return;
    startPlaceDriver = place;
    placeDriverMarker('start', place.geometry.location, place.formatted_address || place.name);
    fitDriverBounds();
    drawDriverRoute();

    // Compute fare after selecting place
    await computeAndSetFare();
});

destAutocomplete.addListener('place_changed', async () => {
    const place = destAutocomplete.getPlace();
    if (!place.geometry) return;
    destPlaceDriver = place;
    placeDriverMarker('dest', place.geometry.location, place.formatted_address || place.name);
    fitDriverBounds();
    drawDriverRoute();

    // Compute fare after selecting place
    await computeAndSetFare();
});
}

function placeDriverMarker(type, latLng, title) {
    const icon = type === 'start'
        ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';

    if (type === 'start') {
        if (startMarker) startMarker.setMap(null);
        startMarker = new google.maps.Marker({ position: latLng, map: map, title, icon });
    } else {
        if (destMarker) destMarker.setMap(null);
        destMarker = new google.maps.Marker({ position: latLng, map: map, title, icon });
    }
}

function fitDriverBounds() {
    const bounds = new google.maps.LatLngBounds();
    let has = false;
    if (startMarker && startMarker.getPosition()) { bounds.extend(startMarker.getPosition()); has = true; }
    if (destMarker && destMarker.getPosition()) { bounds.extend(destMarker.getPosition()); has = true; }
    if (has) map.fitBounds(bounds, 100);
}

function drawDriverRoute() {
    if (!startPlaceDriver || !destPlaceDriver) return;
    const origin = startPlaceDriver.geometry.location;
    const destination = destPlaceDriver.geometry.location;

    directionsServiceDriver.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
    }, (result, status) => {
        if (status === 'OK' && result) {
            directionsRendererDriver.setDirections(result);
        } else {
            console.warn('Driver directions error:', status);
        }
    });
}

async function loadGoogleMapsForDriver() {
    if (window.google && window.google.maps && window.google.maps.places) {
        initGoogleMap();
        return;
    }

    return new Promise((resolve, reject) => {
        if (document.getElementById('gmaps-driver-script')) {
            const check = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    clearInterval(check);
                    initGoogleMap();
                    resolve();
                }
            }, 200);
            return;
        }

        try {
            // Fetch key from PHP - use correct relative path
            fetch('/../../Server/Models/get-api-key.php')
                .then(response => response.json())
                .then(data => {
                    if (!data.key) throw new Error('API key not found');

                    const script = document.createElement('script');
                    script.id = 'gmaps-driver-script';
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
                    script.async = true;
                    script.defer = true;
                    script.onload = () => {
                        initGoogleMap();
                        resolve();
                    };
                    script.onerror = (e) => reject(e);
                    document.head.appendChild(script);
                })
                .catch(err => {
                    console.error('Failed to fetch API key:', err);
                    reject(err);
                });
        } catch (err) {
            console.error('Error loading Google Maps:', err);
            reject(err);
        }
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
     try {
        await loadGoogleMapsForDriver();
        await waitForGoogleMaps();
        attachFareComputation();
    } catch (err) {
        console.error('Failed to load Google Maps for driver dashboard', err);
    }

    console.log('=== DRIVER DASHBOARD INITIALIZED ===');
    
    // Set current year in footer
    currentYearSpan.textContent = new Date().getFullYear();
    
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Get driver username from session
    const userDataStr = sessionStorage.getItem('userData');
    console.log('Raw sessionStorage userData:', userDataStr);
    
    if (!userDataStr) {
        console.error('❌ No userData in sessionStorage');
        showError('Please log in first - No session data found');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 2000);
        return;
    }
    
    let userData;
    try {
        userData = JSON.parse(userDataStr);
        console.log('Parsed userData:', userData);
    } catch (e) {
        console.error('❌ Failed to parse userData:', e);
        showError('Session data corrupted. Please log in again.');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 2000);
        return;
    }
    
    // Check for username field
    if (!userData.username) {
        console.error('❌ No username in userData:', userData);
        showError('Username not found in session. Please log in again.');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 2000);
        return;
    }
    
    // Set driver username
    driverUsername = userData.username;
    console.log('✅ Driver authenticated:', {
        username: driverUsername,
        displayName: userData.name || userData.displayName,
        role: userData.role
    });
    
    // Load existing destinations from database
    await loadDestinations();
    
    // Add form submit handler
    addDestinationForm.addEventListener('submit', handleAddDestination);
});

// ========================================
// DATABASE FUNCTIONS
// ========================================

/**
 * Load destinations from database
 */
async function loadDestinations() {
    try {
        console.log('📥 Loading destinations for driver:', driverUsername);
        showLoading('Loading your rides...');
        
        const url = `../php/manage-driver-rides.php?driver_username=${encodeURIComponent(driverUsername)}`;
        console.log('GET request to:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Load destinations response:', data);
        
        if (data.success) {
            destinations = data.data.rides || [];
            console.log('✅ Loaded', destinations.length, 'destinations');
            renderDestinations();
            hideLoading();
        } else {
            console.error('❌ Failed to load rides:', data.message);
            showError(data.message || 'Failed to load rides');
            hideLoading();
        }
    } catch (error) {
        console.error('❌ Error loading destinations:', error);
        showError('Failed to connect to server: ' + error.message);
        hideLoading();
    }
}

/**
 * Create new ride in database
 */
async function createRide(rideData) {
    try {
        console.log('📤 Creating new ride...');
        showLoading('Creating ride...');
        
        const payload = {
            driver_username: driverUsername,
            plate_number: rideData.plateNumber,
            pickup: rideData.pickup,
            destination: rideData.destination,
            date: rideData.date,
            time: rideData.time,
            seats: rideData.seats,
            price: rideData.price,
            notes: rideData.notes
        };
        
        console.log('POST request payload:', payload);
        
        const response = await fetch('../php/manage-driver-rides.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Create ride response:', data);
        
        if (data.success) {
            console.log('✅ Ride created successfully:', data.data.ride);
            hideLoading();
            return data.data.ride;
        } else {
            console.error('❌ Failed to create ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to create ride');
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating ride:', error);
        hideLoading();
        showError('Failed to connect to server: ' + error.message);
        return null;
    }
}

/**
 * Update ride in database
 */
async function updateRide(rideId, rideData) {
    try {
        console.log('📤 Updating ride:', rideId);
        showLoading('Updating ride...');
        
        const payload = {
            driver_username: driverUsername,
            ride_id: rideId,
            plate_number: rideData.plateNumber,
            pickup: rideData.pickup,
            destination: rideData.destination,
            date: rideData.date,
            time: rideData.time,
            seats: rideData.seats,
            price: rideData.price,
            notes: rideData.notes
        };
        
        console.log('PUT request payload:', payload);
        
        const response = await fetch('../php/manage-driver-rides.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Update ride response:', data);
        
        if (data.success) {
            console.log('✅ Ride updated successfully');
            hideLoading();
            return true;
        } else {
            console.error('❌ Failed to update ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to update ride');
            return false;
        }
    } catch (error) {
        console.error('❌ Error updating ride:', error);
        hideLoading();
        showError('Failed to connect to server: ' + error.message);
        return false;
    }
}

/**
 * Complete ride - mark as completed
 */
async function completeRide(rideId) {
    try {
        console.log('✅ Completing ride:', rideId);
        showLoading('Completing ride...');
        
        const payload = {
            driver_username: driverUsername,
            ride_id: rideId,
            status: 'completed'
        };
        
        console.log('PUT request payload:', payload);
        
        const response = await fetch('../php/manage-driver-rides.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Complete ride response:', data);
        
        if (data.success) {
            console.log('✅ Ride completed successfully');
            hideLoading();
            return true;
        } else {
            console.error('❌ Failed to complete ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to complete ride');
            return false;
        }
    } catch (error) {
        console.error('❌ Error completing ride:', error);
        hideLoading();
        showError('Failed to connect to server: ' + error.message);
        return false;
    }
}

/**
 * Delete ride from database
 */
async function deleteRideFromDB(rideId) {
    try {
        console.log('🗑️ Deleting ride:', rideId);
        showLoading('Deleting ride...');
        
        const url = `../php/manage-driver-rides.php?driver_username=${encodeURIComponent(driverUsername)}&ride_id=${rideId}`;
        console.log('DELETE request to:', url);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        console.log('Delete ride response:', data);
        
        if (data.success) {
            console.log('✅ Ride deleted successfully');
            hideLoading();
            return true;
        } else {
            console.error('❌ Failed to delete ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to delete ride');
            return false;
        }
    } catch (error) {
        console.error('❌ Error deleting ride:', error);
        hideLoading();
        showError('Failed to connect to server: ' + error.message);
        return false;
    }
}

// ========================================
// FORM HANDLING
// ========================================

async function handleAddDestination(e) {
    e.preventDefault();
    
    console.log('📝 Form submitted - Adding destination');
    
    // Get form data
    const formData = {
        plateNumber: document.getElementById('plateNumber').value.trim().toUpperCase(),
        pickup: document.getElementById('pickup').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        seats: parseInt(document.getElementById('seats').value),
        price: parseFloat(document.getElementById('price').value),
        notes: document.getElementById('notes').value.trim()
    };
    
    console.log('Form data:', formData);
    
    // Validate form data
    if (!formData.plateNumber) {
        console.error('❌ Validation failed: Missing plate number');
        showError('Please enter your vehicle plate number');
        return;
    }
    
    if (!formData.pickup || !formData.destination) {
        console.error('❌ Validation failed: Missing pickup or destination');
        showError('Please enter pickup and destination locations');
        return;
    }
    
    if (!formData.date || !formData.time) {
        console.error('❌ Validation failed: Missing date or time');
        showError('Please select date and time');
        return;
    }
    
    if (isNaN(formData.seats) || formData.seats < 1) {
        console.error('❌ Validation failed: Invalid seats');
        showError('Please enter valid number of seats');
        return;
    }
    
    if (isNaN(formData.price) || formData.price < 0) {
        console.error('❌ Validation failed: Invalid price');
        showError('Please enter valid price');
        return;
    }
    
    console.log('✅ Validation passed');
    
    // Create ride in database
    const newRide = await createRide(formData);
    
    if (newRide) {
        console.log('🎉 Ride created successfully, reloading list...');
        
        // Reload destinations from database
        await loadDestinations();
        
        // Reset form
        addDestinationForm.reset();
        
        // Show success message
        showSuccessMessage('Ride added successfully!');
        
        // Scroll to destinations list
        document.querySelector('.destinations-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderDestinations() {
    console.log('🎨 Rendering', destinations.length, 'destinations');
    
    // Update count
    updateDestinationCount();
    
    // Check if there are destinations
    if (destinations.length === 0) {
        destinationsList.innerHTML = '';
        emptyState.classList.add('show');
        console.log('📭 No destinations to display');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // Render destination cards
    destinationsList.innerHTML = destinations.map(dest => `
        <div class="destination-card" data-id="${dest.id}">
            <div class="destination-header">
                <span class="destination-status ${dest.status}">${dest.status}</span>
                <span class="plate-badge">${dest.plate_number || 'N/A'}</span>
                ${dest.passengers > 0 ? `<span class="passengers-badge">${dest.passengers} passenger${dest.passengers > 1 ? 's' : ''}</span>` : ''}
            </div>
            
            <div class="destination-route">
                <div class="location-item">
                    <div class="location-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="8" r="3" stroke="#073066" stroke-width="2"/>
                            <path d="M10 2C6.5 2 4 4.5 4 7.5c0 5 6 10.5 6 10.5s6-5.5 6-10.5C16 4.5 13.5 2 10 2z" stroke="#073066" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="location-text">
                        <div class="location-label">Pickup</div>
                        <div class="location-value">${dest.pickup}</div>
                    </div>
                </div>
                
                <div class="route-line"></div>
                
                <div class="location-item">
                    <div class="location-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="8" r="3" fill="#073066"/>
                            <path d="M10 2C6.5 2 4 4.5 4 7.5c0 5 6 10.5 6 10.5s6-5.5 6-10.5C16 4.5 13.5 2 10 2z" fill="#073066"/>
                        </svg>
                    </div>
                    <div class="location-text">
                        <div class="location-label">Destination</div>
                        <div class="location-value">${dest.destination}</div>
                    </div>
                </div>
            </div>
            
            <div class="destination-details">
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${formatDate(dest.date)}</span>
                </div>
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="8" y1="8" x2="8" y2="4" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="8" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${formatTime(dest.time)}</span>
                </div>
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="8" r="2"/>
                        <circle cx="11" cy="8" r="2"/>
                    </svg>
                    <span>${dest.seats} seat${dest.seats > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-item price">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <text x="3" y="12" font-size="12" font-weight="bold">₱</text>
                    </svg>
                    <span>₱${parseFloat(dest.price).toFixed(2)}</span>
                </div>
            </div>
            
            ${dest.notes ? `
                <div class="destination-notes">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="4" y1="5" x2="12" y2="5" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="4" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${dest.notes}</span>
                </div>
            ` : ''}
            
            <div class="destination-actions">
                ${dest.status === 'upcoming' ? `
                    <button class="btn-complete" onclick="handleCompleteRide('${dest.id}')" title="Mark as completed">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                        Complete
                    </button>
                ` : ''}
                <button class="btn-edit" onclick="editDestination('${dest.id}')" ${dest.passengers > 0 || dest.status === 'completed' ? 'disabled title="Cannot edit ride with bookings or completed rides"' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.854 1.146a.5.5 0 0 0-.708 0L11 2.293 13.707 5l1.147-1.146a.5.5 0 0 0 0-.708l-2-2zM10.5 2.793 2.793 10.5l-.793 3.793 3.793-.793 7.707-7.707L10.5 2.793z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn-delete" onclick="deleteDestination('${dest.id}')" ${dest.status === 'completed' || dest.status === 'cancelled' ? 'disabled title="Cannot delete completed or cancelled rides"' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Destinations rendered');
}

// ========================================
// EDIT, DELETE & COMPLETE FUNCTIONS
// ========================================

async function handleCompleteRide(destinationId) {
    if (!confirm('Mark this ride as completed?')) {
        return;
    }
    
    const success = await completeRide(destinationId);
    
    if (success) {
        // Reload destinations
        await loadDestinations();
        showSuccessMessage('Ride marked as completed!');
    }
}

async function deleteDestination(destinationId) {
    const destination = destinations.find(d => d.id === destinationId);
    
    // Check if ride is completed or cancelled
    if (destination && (destination.status === 'completed' || destination.status === 'cancelled')) {
        showError('Cannot delete completed or cancelled rides');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this ride?')) {
        return;
    }
    
    const success = await deleteRideFromDB(destinationId);
    
    if (success) {
        // Reload destinations
        await loadDestinations();
        showSuccessMessage('Ride deleted successfully!');
    }
}

function editDestination(destinationId) {
    const destination = destinations.find(d => d.id === destinationId);
    
    if (!destination) {
        showError('Ride not found');
        return;
    }
    
    // Check if ride has passengers or is completed
    if (destination.passengers > 0) {
        showError('Cannot edit ride with existing bookings');
        return;
    }
    
    if (destination.status === 'completed') {
        showError('Cannot edit completed rides');
        return;
    }
    
    // Populate form
    document.getElementById('plateNumber').value = destination.plate_number || '';
    document.getElementById('pickup').value = destination.pickup;
    document.getElementById('destination').value = destination.destination;
    document.getElementById('date').value = destination.date;
    document.getElementById('time').value = destination.time;
    document.getElementById('seats').value = destination.seats;
    document.getElementById('price').value = destination.price;
    document.getElementById('notes').value = destination.notes || '';
    
    // Store editing ID
    addDestinationForm.dataset.editingId = destinationId;
    
    // Change submit button text
    const submitBtn = addDestinationForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.854 1.146a.5.5 0 0 0-.708 0L11 2.293 13.707 5l1.147-1.146a.5.5 0 0 0 0-.708l-2-2zM10.5 2.793 2.793 10.5l-.793 3.793 3.793-.793 7.707-7.707L10.5 2.793z"/>
        </svg>
        Update Destination
    `;
    
    // Change form handler
    addDestinationForm.removeEventListener('submit', handleAddDestination);
    addDestinationForm.addEventListener('submit', handleUpdateDestination);
    
    // Scroll to form
    addDestinationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleUpdateDestination(e) {
    e.preventDefault();
    
    const rideId = addDestinationForm.dataset.editingId;
    
    if (!rideId) {
        showError('No ride selected for editing');
        return;
    }
    
    // Get form data
    const formData = {
        plateNumber: document.getElementById('plateNumber').value.trim().toUpperCase(),
        pickup: document.getElementById('pickup').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        seats: parseInt(document.getElementById('seats').value),
        price: parseFloat(document.getElementById('price').value),
        notes: document.getElementById('notes').value.trim()
    };
    
    // Update ride in database
    const success = await updateRide(rideId, formData);
    
    if (success) {
        // Reload destinations
        await loadDestinations();
        
        // Reset form
        cancelEdit();
        
        // Show success message
        showSuccessMessage('Ride updated successfully!');
    }
}

function cancelEdit() {
    // Reset form
    addDestinationForm.reset();
    delete addDestinationForm.dataset.editingId;
    
    // Reset button
    const submitBtn = addDestinationForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="2"/>
        </svg>
        Add Destination
    `;
    
    // Restore original handler
    addDestinationForm.removeEventListener('submit', handleUpdateDestination);
    addDestinationForm.addEventListener('submit', handleAddDestination);
}

// ========================================
// HELPER FUNCTIONS
// ========================================
async function computeFare(origin, destination) {
    return new Promise((resolve) => {

        // Prepare origin/destination request
        const originRequest = origin.place_id ? { placeId: origin.place_id } : origin.address ? origin.address : null;
        const destinationRequest = destination.place_id ? { placeId: destination.place_id } : destination.address ? destination.address : null;

        // Stop early if missing place_id or address
        if (!originRequest || !destinationRequest) {
            console.error("Missing place_id or address for origin/destination");
            return resolve(null);
        }

        const directions = new google.maps.DirectionsService();

        directions.route(
            {
                origin: originRequest,
                destination: destinationRequest,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                console.log("Directions API status:", status);
                console.log("Directions API result:", result);

                if (status !== "OK" || !result) {
                    return resolve(null);
                }

                const leg = result.routes[0].legs[0];
                const distanceKm = leg.distance.value / 1000;

                const baseFare = 30;
                const ratePerKm = 5;
                const fare = baseFare + distanceKm * ratePerKm;

                resolve({
                    origin,
                    destination,
                    distanceKm,
                    duration: leg.duration.text,
                    fare: Math.round(fare)
                });
            }
        );
    });
}


async function computeAndSetFare() {
    const priceInput = document.getElementById('price');
    const seatsInput = document.getElementById('seats');

    if (!startPlaceDriver || !destPlaceDriver || !priceInput || !seatsInput) {
        return;
    }

    showLoading('Computing fare...');
    const fareData = await computeFare(startPlaceDriver, destPlaceDriver);
    hideLoading();

    console.log('fareData:', fareData); // debug

    if (fareData) {
        const seats = parseInt(seatsInput.value) || 1;
        const pricePerSeat = fareData.fare / seats;
        priceInput.value = pricePerSeat.toFixed(2);

        console.log(`Route: ${fareData.origin.formatted_address} → ${fareData.destination.formatted_address}`);
        console.log(`Distance: ${fareData.distanceKm} km`);
        console.log(`Duration: ${fareData.duration}`);
        console.log(`Total Fare: ₱${fareData.fare.toFixed(2)}`);
        console.log(`Seats: ${seats}`);
        console.log(`Price per Seat: ₱${pricePerSeat.toFixed(2)}`);
    } else {
        priceInput.value = '';
        showError('Could not compute fare. Please try again.');
    }
}

// Call computeFare when both pickup and destination are selected
function attachFareComputation() {
    const pickupInput = document.getElementById('pickup');
    const destInput = document.getElementById('destination');
    const priceInput = document.getElementById('price');
    const seatsInput = document.getElementById('seats');

    if (!pickupInput || !destInput || !priceInput || !seatsInput) {
        return;
    }

    // Attach listeners to both inputs
    pickupInput.addEventListener('change', computeAndSetFare);
    destInput.addEventListener('change', computeAndSetFare);
    seatsInput.addEventListener('change', computeAndSetFare);
}

async function waitForGoogleMaps() {
    return new Promise(resolve => {
        const timer = setInterval(() => {
            if (window.google && google.maps && google.maps.DirectionsService) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
    });
}

function updateDestinationCount() {
    const count = destinations.length;
    destinationCount.textContent = `${count} ${count === 1 ? 'destination' : 'destinations'}`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showSuccessMessage(message) {
    // Remove existing messages
    const existing = document.querySelector('.success-message');
    if (existing) {
        existing.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm-1.5 14.5L3 9l1.5-1.5L9 12l6.5-6.5L17 7l-8.5 8.5z"/>
        </svg>
        <span>${message}</span>
    `;
    
    // Append to body
    document.body.appendChild(messageEl);
    
    // Show with animation
    setTimeout(() => messageEl.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

function showError(message) {
    console.error('🚨 ERROR:', message);
    
    // Remove existing messages
    const existing = document.querySelector('.error-message');
    if (existing) {
        existing.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message';
    messageEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm1 14H9v-2h2v2zm0-3H9V5h2v6z"/>
        </svg>
        <span>${message}</span>
    `;
    
    // Append to body
    document.body.appendChild(messageEl);
    
    // Show with animation
    setTimeout(() => messageEl.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

function showLoading(message = 'Loading...') {
    // Remove existing loader
    const existing = document.querySelector('.loading-overlay');
    if (existing) {
        existing.remove();
    }
    
    // Create loader
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loader);
    setTimeout(() => loader.classList.add('show'), 10);
}

function hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('show');
        setTimeout(() => loader.remove(), 300);
    }
}

// ========================================
// STYLES FOR MESSAGES AND LOADING
// ========================================

// Inject styles
const style = document.createElement('style');
style.textContent = `
.success-message, .error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
}

.success-message.show, .error-message.show {
    opacity: 1;
    transform: translateX(0);
}

.success-message {
    border-left: 4px solid #4CAF50;
    color: #2d5016;
}

.success-message svg {
    fill: #4CAF50;
}

.error-message {
    border-left: 4px solid #f44336;
    color: #7f231c;
}

.error-message svg {
    fill: #f44336;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.loading-overlay.show {
    opacity: 1;
}

.loading-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #073066;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-content p {
    margin: 0;
    color: #333;
    font-weight: 500;
}

.btn-edit:disabled, .btn-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-delete:disabled:hover {
    background: #dc3545;
    transform: none;
    box-shadow: none;
}

.btn-complete {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.btn-complete:hover {
    background: #218838;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.btn-complete:active {
    transform: translateY(0);
}

.destination-status.completed {
    background: #28a745;
    color: white;
}

.destination-status.cancelled {
    background: #dc3545;
    color: white;
}

.empty-state {
    display: none;
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.empty-state.show {
    display: block;
}

.empty-state svg {
    margin-bottom: 20px;
    opacity: 0.5;
}

.empty-state h3 {
    margin-bottom: 10px;
    color: #333;
}

.plate-badge {
    background: #073066;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
}
`;
document.head.appendChild(style);