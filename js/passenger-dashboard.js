let map;
let pickupAutocomplete;
let destinationAutocomplete;
let pickupMarker = null;
let destinationMarker = null;
let directionsService;
let directionsRenderer;
function initGoogleMap() {
    // lat: 16.3846, lng: 120.5940 within SLU MaryHeights   
    const baguioCity = {  lat: 16.4023, lng: 120.5960 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: baguioCity,
        zoom: 15,
        streetView: null,         
        streetViewControl: false,
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true // we’ll use custom pickup/destination markers
    });
    initAutocomplete();
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                // Add user marker
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Your Location",
                    icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                });
            },
            (error) => {
                console.warn("Geolocation failed or denied.", error);
            }
        );
    } else {
        console.warn("Geolocation is not supported by this browser.");
    }
}
// Get user credentials from sessionStorage
let userData = {
    id: null,
    name: 'Guest',
    role: 'passenger'
};

// Load user data from sessionStorage
const storedUserData = sessionStorage.getItem('userData');
if (storedUserData) {
    userData = JSON.parse(storedUserData);
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

// DOM READY
document.addEventListener('DOMContentLoaded', function() {
    renderNavigation();
    loadUserProfile();
    setupDropdown();
    checkDriverStatus();
    renderMainContent();
    loadGoogleMaps();
    fetchAvailableRides();
});

// NAVIGATION RENDERING
function renderNavigation() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = '';
    
    navItems.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.name;
        if (item.active) {
            a.classList.add('active');
        }
        li.appendChild(a);
        navMenu.appendChild(li);
    });
}

async function checkDriverStatus() {
    try {
        if (!userData || !userData.username) {
            console.log('No user data available for driver status check');
            return;
        }
        
        const response = await fetch(`../php/check-driver-status.php?username=${encodeURIComponent(userData.username)}`);
        const result = await response.json();
        
        console.log('Driver status check:', result);
        
        if (result.success && result.is_driver) {
            // User is also a driver - show role switcher
            updateNavButtonsForDriver(result.driver_status);
        }
    } catch (error) {
        console.error('Error checking driver status:', error);
    }
}

function updateNavButtonsForDriver(driverStatus) {
    const navButtons = document.querySelector('.nav-buttons');
    
    if (!navButtons) {
        console.error('Nav buttons container not found');
        return;
    }
    
    // Find the "Become a Driver" button
    const becomeDriverBtn = Array.from(navButtons.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Become a Driver')
    );
    
    if (becomeDriverBtn) {
        // Replace "Become a Driver" with "Switch to Driver"
        becomeDriverBtn.className = 'btn-Outline role-switcher';
        becomeDriverBtn.innerHTML = '🚗 Switch to Driver';
        becomeDriverBtn.onclick = function(e) {
            e.preventDefault();
            window.location.href = '../html/driver-dashboard.html';
        };
        
        // Add status indicator badge if pending
        if (driverStatus === 'pending') {
            becomeDriverBtn.innerHTML = '🚗 Switch to Driver <span class="status-badge pending">Pending</span>';
        } else if (driverStatus === 'active') {
            becomeDriverBtn.innerHTML = '🚗 Switch to Driver <span class="status-badge active">Active</span>';
        }
        
        console.log('✅ Role switcher button added');
    } else {
        console.warn('Become a Driver button not found');
    }
}


// USER PROFILE
function loadUserProfile() {
    const profileImage = document.getElementById('profileImage');
    if (userData.image) {
        profileImage.src = userData.image;
    }
}

// DROPDOWN FUNCTIONALITY
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

// RENDER MAIN CONTENT
function renderMainContent() {
    const nav = document.querySelector('.navbar');
    
    // Create Map Section
    const mapSection = createMapSection();
    
    // Create Search Section
    const searchSection = createSearchSection();
    
    // Create Main Content Section
    const mainContent = createMainContentSection();
    
    // Create Booking Modal
    const bookingModal = createBookingModal();
    
    // Create Map Popup Modal
    const mapPopupModal = createMapPopupModal();
    
    // Insert after nav
    nav.after(mapSection, searchSection, mainContent, bookingModal, mapPopupModal);
    
    // Render safety features
    renderSafetyFeatures();
    
    // Attach event listeners
    attachEventListeners();
}

// CREATE MAP SECTION
function createMapSection() {
    const section = document.createElement('section');
    section.className = 'map-section';

    const mapContainer = document.createElement('div');
    mapContainer.className = 'map-container';

    // GOOGLE MAP DIV
    const mapDiv = document.createElement('div');
    mapDiv.id = "map";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";

    mapContainer.appendChild(mapDiv);
    section.appendChild(mapContainer);

    return section;
}

// CREATE SEARCH SECTION
function createSearchSection() {
    const section = document.createElement('section');
    section.className = 'search-section';
    
    const container = document.createElement('div');
    container.className = 'container-fluid';
    
    const form = document.createElement('form');
    form.className = 'search-form';
    form.id = 'searchForm';
    
    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    
    // Pickup input
    const pickupGroup = createFormGroup('Pickup', 'text', 'pickup', 'Enter pickup location', true);
    
    // Arrow icon
    const arrowIcon = document.createElement('div');
    arrowIcon.className = 'arrow-icon';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
    svg.appendChild(path);
    arrowIcon.appendChild(svg);
    
    // Destination input
    const destGroup = createFormGroup('Destination', 'text', 'destination', 'Enter destination', true);
    
    // Date input
    const dateGroup = createFormGroup('Date', 'date', 'date', '', true);
    
    // Passengers select
    const passengersGroup = createSelectGroup('Passengers', 'passengers', 
        ['', '1', '2', '3', '4', '5'], 
        ['Select', '1', '2', '3', '4', '5'], 
        true
    );
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-search';
    submitBtn.textContent = 'Search Ride';
    
    formRow.appendChild(pickupGroup);
    formRow.appendChild(arrowIcon);
    formRow.appendChild(destGroup);
    formRow.appendChild(dateGroup);
    formRow.appendChild(passengersGroup);
    formRow.appendChild(submitBtn);
    
    form.appendChild(formRow);
    container.appendChild(form);
    section.appendChild(container);
    
    return section;
}

// CREATE MAIN CONTENT SECTION
function createMainContentSection() {
    const section = document.createElement('section');
    section.className = 'main-content';
    
    const container = document.createElement('div');
    container.className = 'container-fluid';
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';
    
    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    const safetyCard = document.createElement('div');
    safetyCard.className = 'safety-card';
    safetyCard.id = 'safetyFeatures';
    sidebar.appendChild(safetyCard);
    
    // Rides section
    const ridesSection = document.createElement('div');
    ridesSection.className = 'rides-section';
    
    const ridesHeader = document.createElement('div');
    ridesHeader.className = 'rides-header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Available Rides';
    ridesHeader.appendChild(h2);
    
    const filterChips = document.createElement('div');
    filterChips.className = 'filter-chips';
    
    const filters = [
        { text: 'All Rides', filter: 'all', active: true },
        { text: 'Price: Low to High', filter: 'price-low', active: false }
    ];
    
    filters.forEach(({ text, filter, active }) => {
        const chip = document.createElement('button');
        chip.className = active ? 'chip active' : 'chip';
        chip.dataset.filter = filter;
        chip.textContent = text;
        filterChips.appendChild(chip);
    });
    
    const ridesList = document.createElement('div');
    ridesList.id = 'ridesList';
    ridesList.className = 'rides-list';
    
    const loadingText = document.createElement('p');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Loading available rides...';
    ridesList.appendChild(loadingText);
    
    ridesSection.appendChild(ridesHeader);
    ridesSection.appendChild(filterChips);
    ridesSection.appendChild(ridesList);
    
    contentWrapper.appendChild(sidebar);
    contentWrapper.appendChild(ridesSection);
    container.appendChild(contentWrapper);
    section.appendChild(container);
    
    return section;
}

// CREATE MAP POPUP MODAL
function createMapPopupModal() {
    const modal = document.createElement('div');
    modal.id = 'mapPopupModal';
    modal.className = 'map-popup-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'map-popup-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'map-popup-header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Route Details';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-popup';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeMapPopup);
    modalHeader.appendChild(h2);
    modalHeader.appendChild(closeBtn);
    
    // Map container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'popupMapContainer';
    mapContainer.className = 'popup-map-container';
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(mapContainer);
    modal.appendChild(modalContent);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeMapPopup();
    });
    
    return modal;
}

function closeMapPopup() {
    const modal = document.getElementById('mapPopupModal');
    if (modal) modal.style.display = 'none';
}

// CREATE BOOKING MODAL
function createBookingModal() {
    const modal = document.createElement('div');
    modal.id = 'bookingModal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Complete Your Booking';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    modalHeader.appendChild(h2);
    modalHeader.appendChild(closeBtn);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Booking summary
    const bookingSummary = createBookingSummary();
    
    // Booking form
    const bookingForm = createBookingForm();
    
    modalBody.appendChild(bookingSummary);
    modalBody.appendChild(bookingForm);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    
    return modal;
}

// CREATE BOOKING SUMMARY
function createBookingSummary() {
    const summary = document.createElement('div');
    summary.className = 'booking-summary';
    
    const h3 = document.createElement('h3');
    h3.textContent = 'Ride Details';
    summary.appendChild(h3);
    
    const fields = [
        { label: 'Driver:', id: 'modal-driver' },
        { label: 'From:', id: 'modal-from' },
        { label: 'To:', id: 'modal-to' },
        { label: 'Date:', id: 'modal-date' },
        { label: 'Price:', id: 'modal-price', highlight: true }
    ];
    
    fields.forEach(({ label, id, highlight }) => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.textContent = label;
        
        const valueSpan = document.createElement('span');
        valueSpan.id = id;
        if (highlight) {
            valueSpan.className = 'price-highlight';
        }
        
        item.appendChild(labelSpan);
        item.appendChild(valueSpan);
        summary.appendChild(item);
    });
    
    return summary;
}

// CREATE BOOKING FORM
function createBookingForm() {
    const form = document.createElement('form');
    form.id = 'bookingForm';
    form.className = 'booking-form';
    
    // Full Name
    form.appendChild(createModalFormGroup('Full Name *', 'text', 'passengerName', 'Enter your full name', true));
    
    // Phone
    form.appendChild(createModalFormGroup('Phone Number *', 'tel', 'passengerPhone', '+63 912 345 6789', true));
    
    // Email
    form.appendChild(createModalFormGroup('Email Address *', 'email', 'passengerEmail', 'your.email@example.com', true));
    
    // Number of passengers
    const passengersGroup = document.createElement('div');
    passengersGroup.className = 'form-group-modal';
    const passengersLabel = document.createElement('label');
    passengersLabel.htmlFor = 'numPassengers';
    passengersLabel.textContent = 'Number of Passengers *';
    const passengersSelect = document.createElement('select');
    passengersSelect.id = 'numPassengers';
    passengersSelect.name = 'numPassengers';
    passengersSelect.required = true;
    
    const passengerOptions = [
        { value: '', text: 'Select number' },
        { value: '1', text: '1 Passenger' },
        { value: '2', text: '2 Passengers' },
        { value: '3', text: '3 Passengers' },
        { value: '4', text: '4 Passengers' },
        { value: '5', text: '5 Passengers' }
    ];
    
    passengerOptions.forEach(({ value, text }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        passengersSelect.appendChild(option);
    });
    
    passengersGroup.appendChild(passengersLabel);
    passengersGroup.appendChild(passengersSelect);
    form.appendChild(passengersGroup);
    
    // Pickup point
    form.appendChild(createModalFormGroup('Pickup Point', 'text', 'pickupPoint', 'Exact pickup location (optional)', false));
    
    // Special requests
    const requestsGroup = document.createElement('div');
    requestsGroup.className = 'form-group-modal';
    const requestsLabel = document.createElement('label');
    requestsLabel.htmlFor = 'specialRequests';
    requestsLabel.textContent = 'Special Requests';
    const requestsTextarea = document.createElement('textarea');
    requestsTextarea.id = 'specialRequests';
    requestsTextarea.name = 'specialRequests';
    requestsTextarea.rows = 3;
    requestsTextarea.placeholder = 'Any special requests or notes...';
    requestsGroup.appendChild(requestsLabel);
    requestsGroup.appendChild(requestsTextarea);
    form.appendChild(requestsGroup);
    
    // Form actions
    const formActions = document.createElement('div');
    formActions.className = 'form-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancel';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'submit';
    confirmBtn.className = 'btn-confirm';
    confirmBtn.textContent = 'Proceed To Payment';
    
    formActions.appendChild(cancelBtn);
    formActions.appendChild(confirmBtn);
    form.appendChild(formActions);
    
    return form;
}

// HELPER: CREATE FORM GROUP
function createFormGroup(labelText, inputType, name, placeholder, required) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.type = inputType;
    input.name = name;
    input.className = 'form-input';
    if (placeholder) input.placeholder = placeholder;
    if (required) input.required = true;
    
    group.appendChild(label);
    group.appendChild(input);
    
    return group;
}

// CREATE SELECT GROUP
function createSelectGroup(labelText, name, values, texts, required) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const select = document.createElement('select');
    select.name = name;
    select.className = 'form-input';
    if (required) select.required = true;
    
    values.forEach((value, index) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = texts[index];
        select.appendChild(option);
    });
    
    group.appendChild(label);
    group.appendChild(select);
    
    return group;
}

// HELPER: CREATE MODAL FORM GROUP
function createModalFormGroup(labelText, inputType, id, placeholder, required) {
    const group = document.createElement('div');
    group.className = 'form-group-modal';
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.type = inputType;
    input.id = id;
    input.name = id;
    input.placeholder = placeholder;
    if (required) input.required = true;
    
    group.appendChild(label);
    group.appendChild(input);
    
    return group;
}

// RENDER SAFETY FEATURES
function renderSafetyFeatures() {
    const safetyContainer = document.getElementById('safetyFeatures');
    safetyContainer.innerHTML = '';
    
    safetyFeatures.forEach(feature => {
        const item = document.createElement('div');
        item.className = 'safety-item';
        
        const icon = document.createElement('span');
        icon.className = 'safety-icon';
        icon.textContent = feature.icon;
        
        const text = document.createElement('span');
        text.className = 'safety-text';
        text.textContent = feature.text;
        
        item.appendChild(icon);
        item.appendChild(text);
        safetyContainer.appendChild(item);
    });
}

// ========================================
// FETCH AVAILABLE RIDES FROM PHP
// ========================================
async function fetchAvailableRides(searchParams = null) {
    try {
        const ridesList = document.getElementById('ridesList');
        ridesList.innerHTML = '';
        
        const loadingText = document.createElement('p');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Loading available rides...';
        ridesList.appendChild(loadingText);
        
        let url = '../php/search-rides.php';
        
        if (searchParams) {
            const params = new URLSearchParams(searchParams);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            ridesList.innerHTML = '';
            const errorText = document.createElement('p');
            errorText.className = 'error-text';
            errorText.textContent = data.message || 'Failed to load rides.';
            ridesList.appendChild(errorText);
            return;
        }
        
        if (!data.rides || data.rides.length === 0) {
            ridesList.innerHTML = '';
            const noRidesText = document.createElement('p');
            noRidesText.className = 'no-rides-text';
            noRidesText.textContent = 'No rides available matching your search. Try adjusting your filters!';
            ridesList.appendChild(noRidesText);
            return;
        }
        
        renderRides(data.rides);
        
    } catch (error) {
        console.error('Error fetching rides:', error);
        const ridesList = document.getElementById('ridesList');
        ridesList.innerHTML = '';
        const errorText = document.createElement('p');
        errorText.className = 'error-text';
        errorText.textContent = 'Failed to load rides. Please check your connection and try again.';
        ridesList.appendChild(errorText);
    }
}

// RENDER RIDES
function renderRides(rides) {
    const ridesList = document.getElementById('ridesList');
    ridesList.innerHTML = '';
    
    rides.forEach((ride, index) => {
        const rideCard = createRideCard(ride, index);
        ridesList.appendChild(rideCard);
    });
    
    window.availableRidesData = rides;
    attachBookNowListeners();
}

// CREATE RIDE CARD
function createRideCard(ride, index) {
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
    
    const eta = ride.route?.estimated_duration_mins 
        ? `${ride.route.estimated_duration_mins} mins` 
        : "N/A";
    
    const distance = ride.route?.distance_km 
        ? `${ride.route.distance_km} km` 
        : "";
    
    const card = document.createElement('div');
    card.className = 'ride-card';
    card.dataset.rideId = ride.ride_id || ride._id;
    
    // Ride header
    const rideHeader = document.createElement('div');
    rideHeader.className = 'ride-header';
    
    const driverInfo = document.createElement('div');
    driverInfo.className = 'driver-info';
    
    const driverAvatar = document.createElement('div');
    driverAvatar.className = 'driver-avatar';
    driverAvatar.style.backgroundColor = driverColor;
    driverAvatar.textContent = driverInitials;
    
    const driverNameSpan = document.createElement('span');
    driverNameSpan.className = 'driver-name';
    driverNameSpan.textContent = driverName;
    
    driverInfo.appendChild(driverAvatar);
    driverInfo.appendChild(driverNameSpan);
    
    const ridePrice = document.createElement('div');
    ridePrice.className = 'ride-price';
    ridePrice.textContent = price;
    
    rideHeader.appendChild(driverInfo);
    rideHeader.appendChild(ridePrice);
    
    // Ride route
    const rideRoute = document.createElement('div');
    rideRoute.className = 'ride-route';
    
    const pickupItem = createRouteItem(departureTime, pickupLocation, 'pickup');
    const routeLine = document.createElement('div');
    routeLine.className = 'route-line';
    const destItem = createRouteItem('', destinationLocation, 'destination');
    
    rideRoute.appendChild(pickupItem);
    rideRoute.appendChild(routeLine);
    rideRoute.appendChild(destItem);
    
    // Ride meta
    const rideMeta = document.createElement('div');
    rideMeta.className = 'ride-meta';
    
    rideMeta.appendChild(createMetaItem('🕒', tripDate));
    if (eta !== "N/A") rideMeta.appendChild(createMetaItem('⏱️', eta));
    if (distance) rideMeta.appendChild(createMetaItem('📍', distance));
    if (vehicle !== "Vehicle Info N/A") rideMeta.appendChild(createMetaItem('🚗', vehicle));
    rideMeta.appendChild(createMetaItem('💺', `${seats} Seats`));
    if (rating > 0) rideMeta.appendChild(createMetaItem('⭐', rating.toFixed(1)));
    
    // Ride stops (if any)
    let stopsDiv = null;
    if (ride.route?.stops && ride.route.stops.length > 0) {
        stopsDiv = document.createElement('div');
        stopsDiv.className = 'ride-stops';
        const small = document.createElement('small');
        const strong = document.createElement('strong');
        strong.textContent = 'Stops: ';
        small.appendChild(strong);
        small.appendChild(document.createTextNode(ride.route.stops.join(' → ')));
        stopsDiv.appendChild(small);
    }
    
    // Book button
    const bookBtn = document.createElement('button');
    bookBtn.className = 'btn-book-ride';
    bookBtn.dataset.rideIndex = index;
    bookBtn.textContent = 'Book Now';
    
    // Add click handler to display route on map when card is clicked
    card.addEventListener('click', (e) => {
        if (e.target !== bookBtn && !bookBtn.contains(e.target)) {
            displayRidePathOnMap(ride);
        }
    });
    
    // Assemble card
    card.appendChild(rideHeader);
    card.appendChild(rideRoute);
    card.appendChild(rideMeta);
    if (stopsDiv) card.appendChild(stopsDiv);
    card.appendChild(bookBtn);
    
    return card;
}

// CREATE ROUTE ITEM
function createRouteItem(time, location, type) {
    const item = document.createElement('div');
    item.className = 'route-item';
    
    const dot = document.createElement('div');
    dot.className = `route-dot ${type}`;
    
    const details = document.createElement('div');
    details.className = 'route-details';
    
    if (time) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'route-time';
        timeSpan.textContent = time;
        details.appendChild(timeSpan);
    }
    
    const locationSpan = document.createElement('span');
    locationSpan.className = 'route-location';
    locationSpan.textContent = location;
    details.appendChild(locationSpan);
    
    item.appendChild(dot);
    item.appendChild(details);
    
    return item;
}

// CREATE META ITEM
function createMetaItem(icon, text) {
    const item = document.createElement('div');
    item.className = 'meta-item';
    item.textContent = `${icon} `;
    
    const span = document.createElement('span');
    span.textContent = text;
    item.appendChild(span);
    
    return item;
}

// HELPER FUNCTIONS
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

// EVENT LISTENERS
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
    if (btnCancel) btnCancel.addEventListener('click', closeBookingModal);
    
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

// SEARCH FUNCTIONALITY
function handleSearchSubmit(e) {
    e.preventDefault();
    
    const searchParams = {
        pickup: document.querySelector('input[name="pickup"]').value,
        destination: document.querySelector('input[name="destination"]').value,
        date: document.querySelector('input[name="date"]').value,
        passengers: document.querySelector('select[name="passengers"]').value
    };
    
    console.log('Search params:', searchParams);
    fetchAvailableRides(searchParams);
}

// FILTER FUNCTIONALITY
function filterRides(filterType) {
    if (!window.availableRidesData) return;
    
    let sortedRides = [...window.availableRidesData];
    
    switch(filterType) {
        case 'price-low':
            sortedRides.sort((a, b) => {
                const priceA = parseFloat((a.fare || a.price || '₱0').toString().replace(/[^\d.]/g, ''));
                const priceB = parseFloat((b.fare || b.price || '₱0').toString().replace(/[^\d.]/g, ''));
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
        case 'all':
        default:
            break;
    }
    
    renderRides(sortedRides);
}

// BOOKING MODAL (TESTING KUNG PWEDE NA MAG BOOK UNG USER BASED DOON SA STARTING)
async function openBookingModal(rideIndex) {
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
    
    // Prefill booking form contact info
     if (userData) {
        document.getElementById('passengerName').value = userData.name || "";
        document.getElementById('passengerEmail').value = userData.email || "";
        document.getElementById('passengerPhone').value = userData.phone || "";
    }

    // Prefill pickup/destination inputs in the search form so the map shows the ride's locations
    const pickupInput = document.querySelector('input[name="pickup"]');
    const destinationInput = document.querySelector('input[name="destination"]');
    if (pickupInput) pickupInput.value = pickupLocation;
    if (destinationInput) destinationInput.value = destinationLocation;

    // Also store the pickup point inside the modal's pickupPoint field (user can edit if needed)
    const modalPickup = document.getElementById('pickupPoint');
    if (modalPickup) modalPickup.value = pickupLocation;

    // Try to geocode addresses and show markers + route on the map
    try {
        // wait until maps API is ready
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps not ready yet');
        } else {
            const geocode = (address) => new Promise(resolve => {
                if (!address) return resolve(null);
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address }, (results, status) => {
                    if (status === google.maps.GeocoderStatus.OK && results[0]) {
                        resolve(results[0]);
                    } else {
                        resolve(null);
                    }
                });
            });

            // Geocode both addresses in parallel
            const [pResult, dResult] = await Promise.all([
                geocode(pickupLocation),
                geocode(destinationLocation)
            ]);

            // convert geocode results to place-like objects used by the rest of the code
            pickupPlace = pResult ? { geometry: { location: pResult.geometry.location }, formatted_address: pResult.formatted_address } : null;
            destinationPlace = dResult ? { geometry: { location: dResult.geometry.location }, formatted_address: dResult.formatted_address } : null;

            // add markers and draw route if both were found
            addRideMarkers(pickupPlace, destinationPlace);
            adjustMapBounds();
            drawRoute();
        }
    } catch (err) {
        console.warn('Could not geocode ride locations:', err);
    }
    
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// DISPLAY RIDE PATH ON MAP (when ride card is clicked - in popup modal)
async function displayRidePathOnMap(ride) {
    try {
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps not ready yet');
            return;
        }

        const pickupLocation = ride.starting_point || ride.from || "TBD";
        const destinationLocation = ride.destination || ride.to || "TBD";

        if (pickupLocation === "TBD" || destinationLocation === "TBD") {
            console.warn('Ride locations not fully defined');
            return;
        }

        // Show the modal
        const modal = document.getElementById('mapPopupModal');
        modal.style.display = 'flex';

        // Initialize popup map if not already done
        let popupMap = window.popupMap;
        if (!popupMap) {
            const mapContainer = document.getElementById('popupMapContainer');
            popupMap = new google.maps.Map(mapContainer, {
                center: { lat: 16.4023, lng: 120.5960 },
                zoom: 13,
                streetViewControl: false
            });
            window.popupMap = popupMap;
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
            console.warn('Could not locate one or both addresses');
            return;
        }

        // Clear previous markers
        if (window.popupPickupMarker) window.popupPickupMarker.setMap(null);
        if (window.popupDestMarker) window.popupDestMarker.setMap(null);
        if (window.popupUserLocationMarker) window.popupUserLocationMarker.setMap(null);

        // Clear previous route by setting empty directions
        if (window.popupDirectionsRenderer) {
            window.popupDirectionsRenderer.setDirections({ routes: [] });
        }

        // Add markers to popup map
        window.popupPickupMarker = new google.maps.Marker({
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

        // Add user's current location marker if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    if (window.popupUserLocationMarker) window.popupUserLocationMarker.setMap(null);
                    window.popupUserLocationMarker = new google.maps.Marker({
                        position: userLocation,
                        map: popupMap,
                        title: 'Your Location',
                        icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                },
                (error) => {
                    console.warn('Could not get user location:', error);
                }
            );
        }

        // Draw route on popup map (create once and reuse)
        if (!window.popupDirectionsRenderer) {
            window.popupDirectionsRenderer = new google.maps.DirectionsRenderer({
                map: popupMap,
                suppressMarkers: true
            });
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: pResult.geometry.location,
                destination: dResult.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    window.popupDirectionsRenderer.setDirections(result);
                    // Fit bounds to show entire route
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pResult.geometry.location);
                    bounds.extend(dResult.geometry.location);
                    popupMap.fitBounds(bounds, 100);
                } else {
                    console.warn('Directions error:', status);
                }
            }
        );

        console.log('✅ Route displayed in popup map for ride:', ride);
    } catch (err) {
        console.warn('Could not display ride path on map:', err);
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('bookingForm').reset();
    currentRideData = null;
}
// --------------------- Maps ---------------------
// Baguio City, Benguet bounds for location validation
const BAGUIO_CITY_BOUNDS = {
    north: 16.45,
    south: 16.35,
    east: 120.65,
    west: 120.50
};

// Function to check if location is within Baguio City
function isWithinBaguioCity(lat, lng) {
    return lat >= BAGUIO_CITY_BOUNDS.south && 
           lat <= BAGUIO_CITY_BOUNDS.north && 
           lng >= BAGUIO_CITY_BOUNDS.west && 
           lng <= BAGUIO_CITY_BOUNDS.east;
}

// Function to check if location name contains Baguio City indicators
function isBaguioCityLocation(address) {
    const baguioIndicators = ['baguio', 'benguet', 'baguio city'];
    const lowerAddress = address.toLowerCase();
    return baguioIndicators.some(indicator => lowerAddress.includes(indicator));
}

// autocomplete for pickup and destination
function initAutocomplete() {
    const pickupInput = document.querySelector('input[name="pickup"]');
    const destinationInput = document.querySelector('input[name="destination"]');

    const baguioBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(BAGUIO_CITY_BOUNDS.south, BAGUIO_CITY_BOUNDS.west),
        new google.maps.LatLng(BAGUIO_CITY_BOUNDS.north, BAGUIO_CITY_BOUNDS.east)
    );

    pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, {
        fields: ["geometry", "formatted_address", "name"],
        bounds: baguioBounds,
        strictBounds: true
    });

    destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
        fields: ["geometry", "formatted_address", "name"],
        bounds: baguioBounds,
        strictBounds: true
    });

pickupAutocomplete.addListener("place_changed", () => {
    pickupPlace = pickupAutocomplete.getPlace();
    
    if (pickupPlace && pickupPlace.geometry) {
        const lat = pickupPlace.geometry.location.lat();
        const lng = pickupPlace.geometry.location.lng();
        const address = pickupPlace.formatted_address || pickupPlace.name;
        
        // Validate location is within Baguio City
        if (!isWithinBaguioCity(lat, lng) && !isBaguioCityLocation(address)) {
            alert('Please select a location within Baguio City, Benguet only.');
            document.querySelector('input[name="pickup"]').value = '';
            if (pickupMarker) pickupMarker.setMap(null);
            pickupPlace = null;
            return;
        }
        
        if (pickupMarker) pickupMarker.setMap(null);
        pickupMarker = new google.maps.Marker({
            map: map,
            position: pickupPlace.geometry.location,
            title: "Pickup: " + pickupPlace.formatted_address,
            icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
    }

    adjustMapBounds();
    drawRoute(); // Draw the route if both points exist
});

destinationAutocomplete.addListener("place_changed", () => {
    destinationPlace = destinationAutocomplete.getPlace();
    
    if (destinationPlace && destinationPlace.geometry) {
        const lat = destinationPlace.geometry.location.lat();
        const lng = destinationPlace.geometry.location.lng();
        const address = destinationPlace.formatted_address || destinationPlace.name;
        
        // Validate location is within Baguio City
        if (!isWithinBaguioCity(lat, lng) && !isBaguioCityLocation(address)) {
            alert('Please select a location within Baguio City, Benguet only.');
            document.querySelector('input[name="destination"]').value = '';
            if (destinationMarker) destinationMarker.setMap(null);
            destinationPlace = null;
            return;
        }
        
        if (destinationMarker) destinationMarker.setMap(null);
        destinationMarker = new google.maps.Marker({
            map: map,
            position: destinationPlace.geometry.location,
            title: "Destination: " + destinationPlace.formatted_address,
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        });
    }

    adjustMapBounds();
    drawRoute();
});
}
// add marker for pickup and destination
function addRideMarkers(pickupPlace, destinationPlace) {
   if (pickupMarker) pickupMarker.setMap(null);
    if (destinationMarker) destinationMarker.setMap(null);

    if (pickupPlace && pickupPlace.geometry) {
        pickupMarker = new google.maps.Marker({
            map: map,
            position: pickupPlace.geometry.location,
            title: "Pickup: " + pickupPlace.formatted_address,
            icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
    }

    if (destinationPlace && destinationPlace.geometry) {
        destinationMarker = new google.maps.Marker({
            map: map,
            position: destinationPlace.geometry.location,
            title: "Destination: " + destinationPlace.formatted_address,
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        });
    }

    if (pickupMarker && destinationMarker) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupMarker.getPosition());
        bounds.extend(destinationMarker.getPosition());
        map.fitBounds(bounds);
    }
}
function adjustMapBounds() {
        const bounds = new google.maps.LatLngBounds();
    let hasBothMarkers = pickupMarker && destinationMarker;

    if (pickupMarker) bounds.extend(pickupMarker.getPosition());
    if (destinationMarker) bounds.extend(destinationMarker.getPosition());

    if (hasBothMarkers) {
        // Fit bounds only if both markers are present
        map.fitBounds(bounds);
    } else if (pickupMarker) {
        map.setCenter(pickupMarker.getPosition());
        map.setZoom(15); // default zoom
    } else if (destinationMarker) {
        map.setCenter(destinationMarker.getPosition());
        map.setZoom(15); // default zoom
    }
}
function drawRoute() {
    if (!pickupPlace || !destinationPlace) return; // Need both places to draw

    directionsService.route(
        {
            origin: pickupPlace.geometry.location,
            destination: destinationPlace.geometry.location,
            travelMode: google.maps.TravelMode.DRIVING // or WALKING
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            } else {
                console.error("Error fetching directions", status);
            }
        }
    );
}
async function loadGoogleMaps() {
    try {
        // Fetch key from PHP 
        const response = await fetch('/../../Server/Models/get-api-key.php');
        const data = await response.json();

        if (!data.key) throw new Error('API key not found');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&callback=initGoogleMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

    } catch (error) {
        console.error('Error loading Google Maps:', error);
    }
}
// BOOKING SUBMISSION
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
    
    console.log('Booking data stored:', bookingData);
    
    closeBookingModal();
    window.location.href = '../html/payment.html';
}

const passengerSwitcherStyle = document.createElement('style');
passengerSwitcherStyle.textContent = `
.role-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-badge.pending {
    background: #ff9800;
    color: white;
}

.status-badge.active {
    background: #4CAF50;
    color: white;
}

.role-switcher:hover .status-badge {
    transform: scale(1.05);
}
`;
document.head.appendChild(passengerSwitcherStyle);