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
let vehicleMaxSeats = null; // Store max seats from vehicle registration
let lastComputedFare = null; // Store last fare calculation for real-time seat updates

// DOM Elements
const addDestinationForm = document.getElementById('addDestinationForm');
const destinationsList = document.getElementById('destinationsList');
const emptyState = document.getElementById('emptyState');
const destinationCount = document.getElementById('destinationCount');
const currentYearSpan = document.getElementById('currentYear');


// ========================================
// GOOGLE MAPS
// ========================================

// Baguio City, Benguet bounds for location validation
const BAGUIO_CITY_BOUNDS_DRIVER = {
    north: 16.45,
    south: 16.35,
    east: 120.65,
    west: 120.50
};

// Function to check if location is within Baguio City
function isWithinBaguioCityDriver(lat, lng) {
    return lat >= BAGUIO_CITY_BOUNDS_DRIVER.south && 
           lat <= BAGUIO_CITY_BOUNDS_DRIVER.north && 
           lng >= BAGUIO_CITY_BOUNDS_DRIVER.west && 
           lng <= BAGUIO_CITY_BOUNDS_DRIVER.east;
}

// Function to check if location name contains Baguio City indicators
function isBaguioCityLocationDriver(address) {
    const baguioIndicators = ['baguio', 'benguet', 'baguio city'];
    const lowerAddress = address.toLowerCase();
    return baguioIndicators.some(indicator => lowerAddress.includes(indicator));
}

function initGoogleMap() {
    const baguioCity = { lat: 16.4023, lng: 120.5960 };
    map = new google.maps.Map(document.getElementById("map") || document.createElement('div'), {
        center: baguioCity,
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

    const baguioBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(BAGUIO_CITY_BOUNDS_DRIVER.south, BAGUIO_CITY_BOUNDS_DRIVER.west),
        new google.maps.LatLng(BAGUIO_CITY_BOUNDS_DRIVER.north, BAGUIO_CITY_BOUNDS_DRIVER.east)
    );

    const options = { 
        fields: ['place_id', 'geometry', 'formatted_address', 'name'],
        bounds: baguioBounds,
        strictBounds: true
    };

    startAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
    destAutocomplete = new google.maps.places.Autocomplete(destInput, options);

    startAutocomplete.addListener('place_changed', async () => {
    const place = startAutocomplete.getPlace();
    if (!place.geometry) return;
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name;
    
    // Validate location is within Baguio City
    if (!isWithinBaguioCityDriver(lat, lng) && !isBaguioCityLocationDriver(address)) {
        alert('Please select a location within Baguio City, Benguet only.');
        document.getElementById('pickup').value = '';
        return;
    }
    
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
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name;
    
    // Validate location is within Baguio City
    if (!isWithinBaguioCityDriver(lat, lng) && !isBaguioCityLocationDriver(address)) {
        alert('Please select a location within Baguio City, Benguet only.');
        document.getElementById('destination').value = '';
        return;
    }
    
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
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places,geometry`;
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
        // Load user data FIRST before initializing other components
        await loadUserData();
        
        await loadGoogleMapsForDriver();
        await waitForGoogleMaps();
        attachFareComputation();

        addRoleSwitcherToDriverDashboard();

    } catch (err) {
        console.error('Failed to initialize driver dashboard', err);
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

    // Check for overdue rides initially and set up periodic check
    await checkAndCancelOverdueRides();
    setInterval(checkAndCancelOverdueRides, 60000); // Check every minute

    // Add form submit handler
    addDestinationForm.addEventListener('submit', handleAddDestination);
});



// Add this new function to fetch and populate user data
async function loadUserData() {
    try {
        const userDataStr = sessionStorage.getItem('userData');
        if (!userDataStr) {
            console.error('No user data found in session');
            return;
        }

        const userData = JSON.parse(userDataStr);
        const username = userData.username;

        // Fetch user data from server
        const response = await fetch(`../php/get-user-data.php?username=${encodeURIComponent(username)}`);
        const result = await response.json();

        if (result.success && result.data.vehicle && result.data.vehicle.length > 0) {
            const vehicle = result.data.vehicle[0];
            const plateNumber = vehicle.plate_number;
            vehicleMaxSeats = vehicle.available_seats || 4; // Store max seats from vehicle
            
            const plateInput = document.getElementById('plateNumber');
            const seatsInput = document.getElementById('seats');
            
            if (plateInput) {
                plateInput.value = plateNumber;
                plateInput.readOnly = true; // Make it non-editable
                plateInput.classList.add('auto-filled');
                
                // Add visual indicator
                const hint = plateInput.parentNode.querySelector('.plate-hint');
                if (hint) {
                    hint.textContent = `Auto-filled from your vehicle registration (${plateNumber})`;
                    hint.classList.add('filled');
                }
            }
            
            // Set max seats for input validation
            if (seatsInput) {
                seatsInput.setAttribute('max', vehicleMaxSeats);
                seatsInput.value = Math.min(parseInt(seatsInput.value) || 1, vehicleMaxSeats);
                
                // Add helper text showing max seats
                const seatsGroup = seatsInput.closest('.form-group');
                if (seatsGroup) {
                    let seatsHint = seatsGroup.querySelector('.seats-hint');
                    if (!seatsHint) {
                        seatsHint = document.createElement('small');
                        seatsHint.className = 'seats-hint';
                        seatsHint.style.color = '#666';
                        seatsHint.style.display = 'block';
                        seatsHint.style.marginTop = '4px';
                        seatsGroup.appendChild(seatsHint);
                    }
                    seatsHint.textContent = `Maximum ${vehicleMaxSeats} seat${vehicleMaxSeats > 1 ? 's' : ''} available in your vehicle`;
                }
                
                // Add real-time validation
                seatsInput.addEventListener('input', function() {
                    const value = parseInt(this.value);
                    if (value > vehicleMaxSeats) {
                        this.value = vehicleMaxSeats;
                        showError(`Cannot exceed ${vehicleMaxSeats} seats for your vehicle`);
                    } else if (value < 1) {
                        this.value = 1;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

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
            const activeRide = destinations.find(d => d.status === 'departed');
            if (activeRide) {
                DriverTracker.start(activeRide.id);
            }
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
 * Cancel ride - mark as cancelled
 */
async function cancelRide(rideId) {
    try {
        console.log('❌ Cancelling ride:', rideId);
        showLoading('Cancelling ride...');

        const payload = {
            driver_username: driverUsername,
            ride_id: rideId,
            status: 'cancelled'
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
        console.log('Cancel ride response:', data);

        if (data.success) {
            console.log('✅ Ride cancelled successfully');
            hideLoading();
            await loadDestinations(); // Reload to update UI
            showSuccessMessage('Ride cancelled due to timeout!');
            return true;
        } else {
            console.error('❌ Failed to cancel ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to cancel ride');
            return false;
        }
    } catch (error) {
        console.error('❌ Error cancelling ride:', error);
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
    
    // Validate seats against vehicle capacity
    if (vehicleMaxSeats && formData.seats > vehicleMaxSeats) {
        console.error('❌ Validation failed: Seats exceed vehicle capacity');
        showError(`Cannot offer more than ${vehicleMaxSeats} seat${vehicleMaxSeats > 1 ? 's' : ''}. Your vehicle has ${vehicleMaxSeats} available seat${vehicleMaxSeats > 1 ? 's' : ''}.`);
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
            
            <div class="destination-route" onclick="displayDriverRouteOnMap('${dest.id}')" style="cursor: pointer;">
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
                    <button class="btn-depart" id="depart-btn-${dest.id}" onclick="handleDepartRide('${dest.id}')" ${!isRideTimeNow(dest.date, dest.time)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"/>
                        </svg>
                        Depart
                    </button>
                ` : dest.status === 'departed' ? `
                    <button class="btn-complete" id="complete-btn-${dest.id}" onclick="handleCompleteRide('${dest.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                        Complete
                    </button>
                ` : ''}
                <button class="btn-edit" onclick="editDestination('${dest.id}')" ${dest.passengers > 0 || dest.status === 'completed' || dest.status === 'departed' ? 'disabled title="Cannot edit ride with bookings or completed/departed rides"' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.854 1.146a.5.5 0 0 0-.708 0L11 2.293 13.707 5l1.147-1.146a.5.5 0 0 0 0-.708l-2-2zM10.5 2.793 2.793 10.5l-.793 3.793 3.793-.793 7.707-7.707L10.5 2.793z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn-delete" onclick="deleteDestination('${dest.id}')" ${dest.status === 'completed' || dest.status === 'cancelled' || dest.status === 'departed' ? 'disabled title="Cannot delete completed/cancelled/departed rides"' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
    destinations.forEach(dest => validateDriverDistanceForRide(dest));
    console.log('✅ Destinations rendered');
}

// ========================================
// DISPLAY ROUTE ON MAP
// ========================================

/**
 * Display driver's route on map when they click on a ride - in popup modal
 */
async function displayDriverRouteOnMap(destinationId) {
    try {
        const destination = destinations.find(d => d.id === destinationId);
        if (!destination) {
            showError('Ride not found');
            return;
        }

        // Add debugging log
        console.log('Full destination object from destinations array:', JSON.stringify(destination, null, 2));

        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps not ready yet');
            return;
        }

        // Support both field names: pickup/destination OR from/to
        const pickupLocation = destination.pickup || destination.from;
        const destinationLocation = destination.destination || destination.to;

        if (!pickupLocation || !destinationLocation) {
            showError('Ride locations not fully defined');
            return;
        }
        
        console.log('📍 Ride data:', {
            id: destinationId,
            status: destination.status || destination.ride_status,
            pickup: pickupLocation,
            destination: destinationLocation,
            pickupPoints: destination.pickup_points
        });

        // Show the modal
        const modal = document.getElementById('mapPopupModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }

        // Initialize popup map if not already done
        let popupMap = window.popupMapDriver;
        if (!popupMap) {
            const mapContainer = document.getElementById('popupMapContainer');
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }
            popupMap = new google.maps.Map(mapContainer, {
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
                streetViewControl: false
            });
            window.popupMapDriver = popupMap;
        }

        // Use PlacesService to search for location
        const searchPlaceByName = (address) => new Promise(resolve => {
            if (!address) return resolve(null);
            
            const service = new google.maps.places.PlacesService(popupMap);
            const request = {
                query: address,
                fields: ['geometry', 'formatted_address', 'name']
            };

            service.findPlaceFromQuery(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    resolve({
                        geometry: { location: results[0].geometry.location },
                        formatted_address: results[0].formatted_address || results[0].name
                    });
                } else {
                    console.warn('Place search failed for:', address, status);
                    resolve(null);
                }
            });
        });

        // Search for both locations in parallel
        const [pResult, dResult] = await Promise.all([
            searchPlaceByName(pickupLocation),
            searchPlaceByName(destinationLocation)
        ]);

        if (!pResult || !dResult) {
            showError('Could not locate one or both addresses');
            return;
        }

        // Clear previous markers
        if (window.popupStartMarker) window.popupStartMarker.setMap(null);
        if (window.popupDestMarker) window.popupDestMarker.setMap(null);
        if (window.popupDriverLocationMarker) window.popupDriverLocationMarker.setMap(null);
        
        // Clear previous passenger markers
        if (window.popupPassengerMarkers && window.popupPassengerMarkers.length > 0) {
            window.popupPassengerMarkers.forEach(marker => marker.setMap(null));
        }
        window.popupPassengerMarkers = [];

        // Clear previous route by setting empty directions
        if (window.popupDirectionsRendererDriver) {
            window.popupDirectionsRendererDriver.setDirections({ routes: [] });
        }

        // Add markers to popup map
        window.popupStartMarker = new google.maps.Marker({
            position: pResult.geometry.location,
            map: popupMap,
            title: 'Pickup: ' + pickupLocation,
            icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        window.popupDestMarker = new google.maps.Marker({
            position: dResult.geometry.location,
            map: popupMap,
            title: 'Destination: ' + destinationLocation,
            icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        // Add driver's current location marker if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const driverLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    if (window.popupDriverLocationMarker) window.popupDriverLocationMarker.setMap(null);
                    window.popupDriverLocationMarker = new google.maps.Marker({
                        position: driverLocation,
                        map: popupMap,
                        title: 'Your Location',
                        icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                },
                (error) => {
                    console.warn('Could not get driver location:', error);
                }
            );
        }

        // Support both 'status' and 'ride_status' field names
        const rideStatus = destination.status || destination.ride_status;
        
        // Prepare waypoints for passenger pickup points if ride is departed
        let waypoints = [];
        if (rideStatus === 'departed' && Array.isArray(destination.pickup_points) && destination.pickup_points.length > 0) {
            console.log('🚗 Departed ride - showing passenger pickup points:', destination.pickup_points.length);
            console.log('Pickup points data:', destination.pickup_points);
            
            // Show passenger legend
            const passengerLegend = document.getElementById('passengerLegend');
            if (passengerLegend) {
                passengerLegend.style.display = 'block';
            }
            
            destination.pickup_points.forEach((pickupPoint, index) => {
                console.log(`Creating marker ${index + 1}:`, pickupPoint);
                
                // Ensure coordinates are valid
                if (!pickupPoint.coordinates || typeof pickupPoint.coordinates.lat !== 'number' || typeof pickupPoint.coordinates.lng !== 'number') {
                    console.warn(`Invalid coordinates for passenger ${index + 1}:`, pickupPoint.coordinates);
                    return;
                }
                
                const passengerMarker = new google.maps.Marker({
                    position: {
                        lat: pickupPoint.coordinates.lat,
                        lng: pickupPoint.coordinates.lng
                    },
                    map: popupMap,  // Ensure map is set
                    title: `Passenger: ${pickupPoint.passenger_username}`,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                    label: {
                        text: `${index + 1}`,
                        color: 'white',
                        fontWeight: 'bold'
                    },
                    zIndex: 1000
                });

                // Add info window for passenger
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px;">
                            <strong>🚶 Passenger ${index + 1}</strong><br>
                            <strong>${pickupPoint.passenger_username}</strong><br>
                            <small>${pickupPoint.address || 'Pickup location'}</small>
                        </div>
                    `
                });

                passengerMarker.addListener('click', () => {
                    // Close other info windows
                    if (window.openInfoWindow) {
                        window.openInfoWindow.close();
                    }
                    infoWindow.open(popupMap, passengerMarker);
                    window.openInfoWindow = infoWindow;
                });

                window.popupPassengerMarkers.push(passengerMarker);
                
                // Add to waypoints for routing
                waypoints.push({
                    location: new google.maps.LatLng(pickupPoint.coordinates.lat, pickupPoint.coordinates.lng),
                    stopover: true
                });
                
                console.log(`✅ Marker ${index + 1} created at:`, pickupPoint.coordinates);
            });
            
            console.log('✅ All passenger markers created:', window.popupPassengerMarkers.length);
        } else {
            console.log('ℹ️ No passenger markers to show:', {
                rideStatus,
                hasPickupPoints: Array.isArray(destination.pickup_points),
                pickupPointsLength: Array.isArray(destination.pickup_points) ? destination.pickup_points.length : 0,
                pickupPointsType: typeof destination.pickup_points
            });
            
            // Hide passenger legend if no passengers
            const passengerLegend = document.getElementById('passengerLegend');
            if (passengerLegend) {
                passengerLegend.style.display = 'none';
            }
        }

        // Draw route on popup map (create once and reuse)
        if (!window.popupDirectionsRendererDriver) {
            window.popupDirectionsRendererDriver = new google.maps.DirectionsRenderer({
                map: popupMap,
                suppressMarkers: true
            });
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: pResult.geometry.location,
                destination: dResult.geometry.location,
                waypoints: waypoints,  // Include waypoints for departed rides with pickup points
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    window.popupDirectionsRendererDriver.setDirections(result);
                    // Fit bounds to show entire route including passenger markers
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pResult.geometry.location);
                    bounds.extend(dResult.geometry.location);
                    
                    // Include passenger pickup points in bounds
                    if (rideStatus === 'departed' && Array.isArray(destination.pickup_points)) {
                        destination.pickup_points.forEach(point => {
                            if (point.coordinates) {
                                bounds.extend(new google.maps.LatLng(
                                    point.coordinates.lat,
                                    point.coordinates.lng
                                ));
                            }
                        });
                    }
                    
                    popupMap.fitBounds(bounds, 100);
                    console.log('✅ Bounds fitted, markers should be visible');
                } else {
                    console.warn('Directions error:', status);
                }
            }
        );

        console.log('✅ Route displayed in popup map for destination:', destinationId);
    } catch (err) {
        console.error('❌ Error displaying route on map:', err);
        showError('Could not display route on map');
    }
}

function closeMapPopup() {
    const modal = document.getElementById('mapPopupModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

/**
 * Depart ride - mark as departed
 */
async function handleDepartRide(destinationId) {
     const destination = destinations.find(d => d.id === destinationId);

    // Prevent depart when not allowed
    if (!isRideTimeNow(destination.date, destination.time)) {
        showError("You cannot depart yet. The scheduled time has not arrived.");
        return;
    }
    // Require Google Maps geometry library
    if (!window.google || !google.maps || !google.maps.geometry) {
        showError('Maps not ready. Please wait a moment and try again.');
        return;
    }
    try {
        console.log('🚗 Departing ride:', destinationId);
        showLoading('Marking ride as departed...');

        // Validate driver is within 40 meters of pickup location
        const ARRIVAL_AT_PICKUP_DISTANCE = 40; // meters

        const pickupLocationName = destination.pickup || destination.from;
        if (!pickupLocationName) {
            hideLoading();
            showError('Pickup location is not set for this ride.');
            return false;
        }

        // Resolve pickup location to coordinates using PlacesService
        const mapForPlaces = map || (window.popupMapDriver);
        const placesService = new google.maps.places.PlacesService(mapForPlaces || document.createElement('div'));

        const pickupPlace = await new Promise((resolve) => {
            placesService.findPlaceFromQuery({
                query: pickupLocationName,
                fields: ['geometry', 'formatted_address', 'name']
            }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    resolve(results[0]);
                } else {
                    console.warn('Could not resolve pickup location:', pickupLocationName, status);
                    resolve(null);
                }
            });
        });

        if (!pickupPlace || !pickupPlace.geometry || !pickupPlace.geometry.location) {
            hideLoading();
            showError('Unable to validate pickup location. Please re-enter the pickup address.');
            return false;
        }

        // Get driver's current position
        if (!navigator.geolocation) {
            hideLoading();
            showError('Geolocation is not supported by your browser');
            return false;
        }

        const driverPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }).catch(err => {
            console.error('Geolocation error:', err);
            return null;
        });

        if (!driverPosition) {
            hideLoading();
            showError('Unable to get your current location');
            return false;
        }

        const driverLatLng = new google.maps.LatLng(driverPosition.lat, driverPosition.lng);
        const pickupLatLng = pickupPlace.geometry.location;
        const distanceToPickup = google.maps.geometry.spherical.computeDistanceBetween(driverLatLng, pickupLatLng);

        console.log(`Distance to pickup: ${Math.round(distanceToPickup)} meters`);

        if (distanceToPickup > ARRIVAL_AT_PICKUP_DISTANCE) {
            hideLoading();
            showError(`You must be within ${ARRIVAL_AT_PICKUP_DISTANCE} meters of the pickup location to depart.`);
            return false;
        }

        const payload = {
            driver_username: driverUsername,
            ride_id: destinationId,
            status: 'departed'
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
        console.log('Depart ride response:', data);

        if (data.success) {
            console.log('✅ Ride departed successfully');
            hideLoading();
            await loadDestinations();
            showSuccessMessage('Ride marked as departed!');
            DriverTracker.start(destinationId);
            return true;
        } else {
            console.error('❌ Failed to depart ride:', data.message);
            hideLoading();
            showError(data.message || 'Failed to depart ride');
            return false;
        }
    } catch (error) {
        console.error('❌ Error departing ride:', error);
        hideLoading();
        showError('Failed to connect to server: ' + error.message);
        return false;
    }
}

// ========================================
// EDIT, DELETE & COMPLETE FUNCTIONS
// ========================================

async function handleCompleteRide(destinationId) {
   const destination = destinations.find(d => d.id === destinationId);
    if (!destination) {
        showError("Ride not found");
        return;
    }

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }

    showLoading("Checking your location...");

    navigator.geolocation.getCurrentPosition(async (position) => {
        const driverLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        hideLoading();

        const destinationRequest = destination.place_id
            ? { placeId: destination.place_id }
            : destination.destination;

        const directions = new google.maps.DirectionsService();

        directions.route(
            {
                origin: driverLocation,
                destination: destinationRequest,
                travelMode: google.maps.TravelMode.DRIVING
            },
            async (result, status) => {
                if (status !== "OK" || !result) {
                    showError("Unable to calculate distance to the destination");
                    console.error("DirectionsService error:", status, result);
                    return;
                }

                const leg = result.routes[0].legs[0];
                const distanceMeters = leg.distance.value;

                console.log("Distance to destination:", distanceMeters, "meters");

                // REALISTIC NEAR DESTINATION THRESHOLD
                const ARRIVAL_DISTANCE = 200; // 100 meters

                if (distanceMeters > ARRIVAL_DISTANCE) {
                    showError("You must be within 100 meters of the destination to complete the ride.");
                    return;
                }

                // Confirm completion
                if (!confirm("You are near the destination. Mark this ride as completed?")) return;

                // Mark ride as completed in DB
                const success = await completeRide(destinationId);

                if (success) {
                    await loadDestinations();
                    showSuccessMessage("Ride completed!");
                }
            }
        );

    }, (err) => {
        hideLoading();
        showError("Unable to get your current location");
        console.error(err);
    }, { enableHighAccuracy: true });
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

/**
 * Check if current time is at or after ride departure time (within 15 minutes window after scheduled time)
 */
function isRideTimeNow(rideDate, rideTime) {
    if (!rideDate || !rideTime) return false;

    const now = new Date();
    const rideDateTime = new Date(`${rideDate}T${rideTime}`);

    // Check if ride is for today
    const today = now.toISOString().split('T')[0];
    if (rideDate !== today) return false;

    // Check if current time is at or after ride time, and within 15 minutes after
    const timeDiff = now - rideDateTime;
    const fifteenMinutes = 15 * 60 * 1000;

    return timeDiff >= 0 && timeDiff <= fifteenMinutes;
}

/**
 * Check if ride is overdue (more than 15 minutes past scheduled time)
 */
function isRideOverdue(rideDate, rideTime) {
    if (!rideDate || !rideTime) return false;

    const now = new Date();
    const rideDateTime = new Date(`${rideDate}T${rideTime}`);

    // Check if ride is for today
    const today = now.toISOString().split('T')[0];
    if (rideDate !== today) return false;

    // Check if more than 15 minutes have passed
    const timeDiff = now - rideDateTime;
    const fifteenMinutes = 15 * 60 * 1000;

    return timeDiff > fifteenMinutes;
}

/**
 * Check for overdue rides and cancel them
 */
async function checkAndCancelOverdueRides() {
    console.log('🔍 Checking for overdue rides...');

    const overdueRides = destinations.filter(dest =>
        dest.status === 'upcoming' && isRideOverdue(dest.date, dest.time)
    );

    if (overdueRides.length === 0) {
        console.log('✅ No overdue rides found');
        return;
    }

    console.log(`🚨 Found ${overdueRides.length} overdue ride(s), cancelling...`);

    for (const ride of overdueRides) {
        console.log(`❌ Cancelling overdue ride: ${ride.id}`);
        await cancelRide(ride.id);
    }

    // Reload destinations to update UI
    await loadDestinations();
}

function validateDriverDistanceForRide(dest) {
    const btn = document.getElementById(`complete-btn-${dest.id}`);
    if (!btn) return;

    if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
    }

    // Define ARRIVAL_DISTANCE
    const ARRIVAL_DISTANCE = 200; // meters

    navigator.geolocation.getCurrentPosition((pos) => {
        const driverLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };

        console.log(`Validating ride ${dest.id} — driver at`, driverLocation);

        const originRequest = driverLocation;

        // Destination can be place_id or string address
        const destinationRequest = dest.place_id
            ? { placeId: dest.place_id }
            : dest.destination;

        console.log("Destination request used for Directions:", destinationRequest);

        const directions = new google.maps.DirectionsService();

        directions.route(
            {
                origin: originRequest,
                destination: destinationRequest,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status !== "OK" || !result) {
                    console.error("Directions API failed:", status);
                    return;
                }

                const leg = result.routes[0].legs[0];
                const distanceMeters = leg.distance.value;

                console.log("Leg distance (meters):", distanceMeters);

                if (distanceMeters <= ARRIVAL_DISTANCE) {
                    btn.onclick = () => handleCompleteRide(dest.id);
                    console.log(
                        `Complete ENABLED for ${dest.id} — ${distanceMeters}m away`
                    );
                } else {
                    btn.onclick = () => showError(`You must be within ${ARRIVAL_DISTANCE} meters of the destination to complete the ride.`);
                    console.log(
                        `Complete DISABLED for ${dest.id} — ${distanceMeters}m away`
                    );
                }
            }
        );
    });
}
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
                const durationSeconds = leg.duration.value;
                const durationMinutes = Math.ceil(durationSeconds / 60);

                // Fare Calculation Factors
                const baseFare = 30;
                const ratePerKm = 8;
                const ratePerMinute = 3;
                const minuteInterval = 1; // Rate is applied every n minutes

                 // Calculate distance-based fare and time-based fare
                const distanceFare = distanceKm * ratePerKm;
                const chargeableMinutes = Math.ceil(durationMinutes / minuteInterval) * minuteInterval;
                const timeFare = (chargeableMinutes / minuteInterval) * ratePerMinute;
                
                // Total fare is base + distance + time
                const fare = baseFare + distanceFare + timeFare;

                resolve({
                    origin,
                    destination,
                    distanceKm,
                    durationMinutes,
                    duration: leg.duration.text,
                    distanceFare,
                    timeFare,
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
        // Store fare for real-time seat updates
        lastComputedFare = fareData;
        
        const seats = parseInt(seatsInput.value) || 1;
        const pricePerSeat = fareData.fare / seats;
        priceInput.value = pricePerSeat.toFixed(2);

        console.log(`Route: ${fareData.origin.formatted_address} → ${fareData.destination.formatted_address}`);
        console.log(`Distance: ${fareData.distanceKm.toFixed(2)} km`);
        console.log(`Duration: ${fareData.duration} (${fareData.durationMinutes} minutes)`);
        console.log(`Distance Fare: ₱${fareData.distanceFare.toFixed(2)} (${fareData.distanceKm.toFixed(2)} km × ₱8/km)`);
        console.log(`Time Fare: ₱${fareData.timeFare.toFixed(2)} (${fareData.durationMinutes} minutes × ₱2/min)`);
        console.log(`Base Fare: ₱30.00`);
        console.log(`Total Fare: ₱${fareData.fare.toFixed(2)}`);
        console.log(`Seats: ${seats}`);
        console.log(`Price per Seat: ₱${pricePerSeat.toFixed(2)}`);
    } else {
        priceInput.value = '';
        showError('Could not compute fare. Please try again.');
    }
}

// Real-time handler for seat changes - recalculates price per seat without recomputing full fare
function handleSeatsChange() {
    const seatsInput = document.getElementById('seats');
    const priceInput = document.getElementById('price');

    if (!seatsInput || !priceInput || !lastComputedFare) {
        return;
    }

    const seats = Math.max(1, Math.min(parseInt(seatsInput.value) || 1, vehicleMaxSeats));
    const pricePerSeat = lastComputedFare.fare / seats;
    priceInput.value = pricePerSeat.toFixed(2);
    
    console.log(`💺 Seats updated to ${seats} → Price per seat: ₱${pricePerSeat.toFixed(2)}`);
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

    // Attach listeners: use 'change' for location inputs (full fare recompute), 'input' for seats (real-time price update)
    pickupInput.addEventListener('change', computeAndSetFare);
    destInput.addEventListener('change', computeAndSetFare);
    seatsInput.addEventListener('input', handleSeatsChange); // Real-time update on every keystroke
    seatsInput.addEventListener('change', handleSeatsChange); // Also handle on blur
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

/**
 * Update depart button states based on current time
 */

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

function addRoleSwitcherToDriverDashboard() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        console.error('Navbar not found');
        return;
    }
    
    let navButtons = navbar.querySelector('.nav-buttons');
    
    if (!navButtons) {
        navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';
        
        const navContent = navbar.querySelector('.nav-content');
        if (navContent) {
            navContent.appendChild(navButtons);
        }
    }
    
    if (navButtons.querySelector('.role-switcher')) {
        return;
    }
    
    const switchBtn = document.createElement('button');
    switchBtn.className = 'btn-Outline role-switcher';
    switchBtn.innerHTML = '👤 Switch to Passenger';
    switchBtn.onclick = function(e) {
        e.preventDefault();
        window.location.href = '../html/passenger-dashboard.html';
    };
    
    const logoutBtn = navButtons.querySelector('.btn-primary');
    if (logoutBtn) {
        navButtons.insertBefore(switchBtn, logoutBtn);
    } else {
        navButtons.appendChild(switchBtn);
    }
    
    console.log('✅ Role switcher button added to driver dashboard');
}

const driverSwitcherStyle = document.createElement('style');
driverSwitcherStyle.textContent = `
.role-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.role-switcher:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
}

.nav-buttons .role-switcher {
    background: white;
    color: #073066;
    border: 2px solid #073066;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.nav-buttons .role-switcher:hover {
    background: #073066;
    color: white;
}
`;
document.head.appendChild(driverSwitcherStyle);