let map;
let pickupAutocomplete;
let destinationAutocomplete;
let pickupMarker = null;
let destinationMarker = null;
let directionsService;
let directionsRenderer;
let routePolyline = null;
let isSelectingPickup = false;
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
    modalContent.style.maxWidth = '900px';
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflow = 'auto';
    
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
    modalBody.style.display = 'grid';
    modalBody.style.gridTemplateColumns = '1fr 1fr';
    modalBody.style.gap = '20px';
    
    // LEFT SIDE: Booking summary + form
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.flexDirection = 'column';
    leftSide.style.gap = '20px';
    
    const bookingSummary = createBookingSummary();
    const bookingForm = createBookingForm();
    
    leftSide.appendChild(bookingSummary);
    leftSide.appendChild(bookingForm);
    
    // RIGHT SIDE: Interactive Map
    const rightSide = document.createElement('div');
    rightSide.style.position = 'sticky';
    rightSide.style.top = '0';
    rightSide.style.height = 'fit-content';
    
    const mapTitle = document.createElement('h3');
    mapTitle.textContent = 'Select Your Pickup Point';
    mapTitle.style.marginBottom = '10px';
    mapTitle.style.fontSize = '16px';
    
    const mapInstruction = document.createElement('p');
    mapInstruction.style.fontSize = '13px';
    mapInstruction.style.color = '#2196F3';
    mapInstruction.style.marginBottom = '10px';
    mapInstruction.innerHTML = '📍 <strong>Drag the blue pin</strong> to your desired pickup location along the route';
    
    const mapContainer = document.createElement('div');
    mapContainer.id = 'modalMapContainer';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '400px';
    mapContainer.style.borderRadius = '8px';
    mapContainer.style.border = '2px solid #e0e0e0';
    
    rightSide.appendChild(mapTitle);
    rightSide.appendChild(mapInstruction);
    rightSide.appendChild(mapContainer);
    
    modalBody.appendChild(leftSide);
    modalBody.appendChild(rightSide);
    
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
// ========================================
// UNIFIED PICKUP POINT SELECTION SYSTEM
// Uses DirectionsService consistently throughout
// ========================================

// Global variables for modal map
let modalMap = null;
let modalDirectionsService = null;
let modalDirectionsRenderer = null;
let modalPickupMarker = null;
let modalDestinationMarker = null;
let pickupSelectionMarker = null;
let currentRouteCoordinates = [];

// Modified openBookingModal - MAIN ENTRY POINT
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
    
    console.log('🚗 Opening booking modal for route:', pickupLocation, '→', destinationLocation);
    
    // Update modal summary
    document.getElementById('modal-driver').textContent = driverName;
    document.getElementById('modal-from').textContent = pickupLocation;
    document.getElementById('modal-to').textContent = destinationLocation;
    document.getElementById('modal-date').textContent = `${tripDate} at ${departureTime}`;
    document.getElementById('modal-price').textContent = price;
    
    // Prefill booking form
    if (userData) {
        document.getElementById('passengerName').value = userData.name || "";
        document.getElementById('passengerEmail').value = userData.email || "";
        document.getElementById('passengerPhone').value = userData.phone || "";
    }
    
    // Show modal FIRST
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Wait for modal to be fully rendered, then initialize map
    setTimeout(() => {
        console.log('⏰ Initializing modal map...');
        initializeModalMapWithRoute(pickupLocation, destinationLocation);
    }, 300);
}

// Initialize modal map and draw route using DirectionsService
async function initializeModalMapWithRoute(origin, destination) {
    console.log('🗺️ Starting map initialization...');
    
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps not loaded yet!');
        alert('Map is still loading, please wait a moment and try again.');
        return;
    }
    
    const mapContainer = document.getElementById('modalMapContainer');
    if (!mapContainer) {
        console.error('❌ Map container #modalMapContainer not found!');
        return;
    }
    
    console.log('📦 Map container found');
    
    // Force container dimensions
    mapContainer.style.width = '100%';
    mapContainer.style.height = '400px';
    mapContainer.style.minHeight = '400px';
    
    try {
        // Create map instance
        console.log('🎨 Creating Google Map...');
        modalMap = new google.maps.Map(mapContainer, {
            center: { lat: 16.4023, lng: 120.5960 },
            zoom: 13,
            streetViewControl: false,
            mapTypeControl: true,
            zoomControl: true
        });
        
        console.log('✅ Map created successfully');
        
        // Create DirectionsService and Renderer
        modalDirectionsService = new google.maps.DirectionsService();
        modalDirectionsRenderer = new google.maps.DirectionsRenderer({
            map: modalMap,
            suppressMarkers: true, // We'll add custom markers
            polylineOptions: {
                strokeColor: '#4CAF50',
                strokeWeight: 6,
                strokeOpacity: 0.8
            }
        });
        
        console.log('✅ DirectionsService initialized');
        
        // Draw route using DirectionsService
        await drawDriverRoute(origin, destination);
        
    } catch (error) {
        console.error('❌ Error initializing modal map:', error);
        alert('Failed to load map. Please try again.');
    }
}
async function drawDriverRoute(origin, destination) {
    console.log('🛣️ Requesting directions from', origin, 'to', destination);
    
    if (!origin || !destination || origin === "TBD" || destination === "TBD") {
        console.error('❌ Invalid origin or destination');
        alert('Route information is incomplete. Please contact support.');
        return;
    }
    
    return new Promise((resolve, reject) => {
        modalDirectionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'PH' // Prioritize Philippines
            },
            (response, status) => {
                if (status === google.maps.DirectionsStatus.OK && response) {
                    console.log('✅ Directions received successfully');
                    
                    // Display the route on map
                    modalDirectionsRenderer.setDirections(response);
                    
                    // Extract route coordinates from the polyline
                    const route = response.routes[0];
                    currentRouteCoordinates = [];
                    
                    route.overview_path.forEach(point => {
                        currentRouteCoordinates.push({
                            lat: point.lat(),
                            lng: point.lng()
                        });
                    });
                    
                    console.log(`✅ Extracted ${currentRouteCoordinates.length} route points`);
                    
                    // Get origin and destination coordinates from directions response
                    const originLocation = route.legs[0].start_location;
                    const destinationLocation = route.legs[0].end_location;
                    
                    // Add start/end markers
                    addDriverMarkers(originLocation, destinationLocation, origin, destination);
                    
                    // Initialize draggable pickup marker
                    setTimeout(() => {
                        initializePickupMarker();
                    }, 500);
                    
                    resolve(response);
                    
                } else {
                    console.error('❌ Directions request failed:', status);
                    alert(`Could not find route: ${status}. Please verify the addresses.`);
                    reject(new Error(status));
                }
            }
        );
    });
}

function addDriverMarkers(originLocation, destinationLocation, originAddress, destAddress) {
    console.log('📍 Adding driver markers');
    
    // Clear existing markers
    if (modalPickupMarker) modalPickupMarker.setMap(null);
    if (modalDestinationMarker) modalDestinationMarker.setMap(null);
    
    // Add green marker for driver's start point
    modalPickupMarker = new google.maps.Marker({
        position: originLocation,
        map: modalMap,
        title: "Driver's Starting Point: " + originAddress,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        zIndex: 500
    });
    
    // Add red marker for driver's destination
    modalDestinationMarker = new google.maps.Marker({
        position: destinationLocation,
        map: modalMap,
        title: "Driver's Destination: " + destAddress,
        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        zIndex: 500
    });
    
    console.log('✅ Driver markers added');
}



async function initializeModalMap(pickupLocation, destinationLocation) {
    console.log('🗺️ Starting map initialization...');
    
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps not loaded yet!');
        alert('Map is loading, please wait a moment and try again.');
        return;
    }
    
    const mapContainer = document.getElementById('modalMapContainer');
    if (!mapContainer) {
        console.error('❌ Map container not found!');
        return;
    }
    
    console.log('📦 Map container found:', mapContainer);
    
    // Force container to have dimensions
    mapContainer.style.width = '100%';
    mapContainer.style.height = '400px';
    mapContainer.style.minHeight = '400px';
    
    try {
        // Create new map instance
        console.log('🎨 Creating map instance...');
        modalMap = new google.maps.Map(mapContainer, {
            center: { lat: 16.4023, lng: 120.5960 },
            zoom: 13,
            streetViewControl: false,
            mapTypeControl: true
        });
        
        console.log('✅ Map created successfully');
        
        // Create directions renderer
        modalDirectionsRenderer = new google.maps.DirectionsRenderer({
            map: modalMap,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#4CAF50',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        
        // Geocode and draw route
        console.log('📍 Geocoding locations...');
        await geocodeAndDrawRoute(pickupLocation, destinationLocation);
        
    } catch (error) {
        console.error('❌ Error initializing modal map:', error);
        alert('Failed to load map. Please try again.');
    }
}

function initializePickupMarker() {
    console.log('🔵 Initializing passenger pickup marker...');
    
    if (!currentRouteCoordinates || currentRouteCoordinates.length === 0) {
        console.error('❌ No route coordinates available');
        alert('Route not loaded. Please close and try again.');
        return;
    }
    
    // Clear existing pickup marker
    if (pickupSelectionMarker) {
        pickupSelectionMarker.setMap(null);
    }
    
    // Try to get user's current location
    if (navigator.geolocation) {
        console.log('📱 Getting user location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('✅ User location:', userLocation);
                
                // Find nearest point on driver's route to user
                const nearestPoint = findNearestPointOnRoute(userLocation, currentRouteCoordinates);
                const distance = calculateDistance(userLocation, nearestPoint);
                
                console.log(`📏 User is ${(distance/1000).toFixed(2)}km from route`);
                
                // Place pickup marker at nearest point on route
                createDraggablePickupMarker(nearestPoint);
            },
            (error) => {
                console.warn('⚠️ Geolocation failed:', error.message);
                // Default to 1/4 along the route (near start but not at the very beginning)
                const defaultIndex = Math.floor(currentRouteCoordinates.length / 4);
                const defaultPoint = currentRouteCoordinates[defaultIndex];
                console.log('📍 Using default point at index', defaultIndex);
                createDraggablePickupMarker(defaultPoint);
            },
            {
                timeout: 5000,
                enableHighAccuracy: false
            }
        );
    } else {
        console.warn('⚠️ Geolocation not available');
        const defaultIndex = Math.floor(currentRouteCoordinates.length / 4);
        const defaultPoint = currentRouteCoordinates[defaultIndex];
        createDraggablePickupMarker(defaultPoint);
    }
}
function createDraggablePickupMarker(position) {
    console.log('🔵 Creating draggable pickup marker at:', position);
    
    pickupSelectionMarker = new google.maps.Marker({
        position: position,
        map: modalMap,
        title: "Your Pickup Point - Drag along the route to adjust",
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(50, 50)
        },
        draggable: true,
        zIndex: 1000,
        animation: google.maps.Animation.DROP
    });
    
    console.log('✅ Pickup marker created');
    
    // Update the pickup field immediately
    updatePickupPointField(position);
    
    // Center map to show the pickup point
    modalMap.panTo(position);
    
    // Add drag event listeners
    pickupSelectionMarker.addListener('dragstart', () => {
        console.log('🖱️ User started dragging pickup marker');
    });
    
    pickupSelectionMarker.addListener('dragend', (event) => {
        const draggedPos = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        
        console.log('🖱️ Marker dragged to:', draggedPos);
        
        // Snap to nearest point on route
        const snappedPoint = findNearestPointOnRoute(draggedPos, currentRouteCoordinates);
        const distanceFromRoute = calculateDistance(draggedPos, snappedPoint);
        
        console.log(`📏 Distance from route: ${distanceFromRoute.toFixed(0)}m`);
        
        // Warn if too far from route (more than 1km)
        if (distanceFromRoute > 1000) {
            alert('⚠️ Please select a pickup point closer to the driver\'s route (within 1km)');
        }
        
        // Snap marker to route
        pickupSelectionMarker.setPosition(snappedPoint);
        updatePickupPointField(snappedPoint);
        
        console.log('✅ Marker snapped to route:', snappedPoint);
    });
    
    // Add instruction text below pickup field
    showPickupInstruction();
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

// Close booking modal and cleanup
function closeBookingModal() {
    console.log('🚪 Closing booking modal');
    
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    const form = document.getElementById('bookingForm');
    if (form) form.reset();
    
    // Clear all markers
    if (pickupSelectionMarker) {
        pickupSelectionMarker.setMap(null);
        pickupSelectionMarker = null;
    }
    if (modalPickupMarker) {
        modalPickupMarker.setMap(null);
        modalPickupMarker = null;
    }
    if (modalDestinationMarker) {
        modalDestinationMarker.setMap(null);
        modalDestinationMarker = null;
    }
    
    // Clear route
    if (modalDirectionsRenderer) {
        modalDirectionsRenderer.setDirections({ routes: [] });
    }
    
    // Remove instruction text
    const instruction = document.getElementById('pickupInstruction');
    if (instruction) instruction.remove();
    
    // Clear route data
    currentRouteCoordinates = [];
    currentRideData = null;
    
    // Destroy map instances to force fresh initialization next time
    modalMap = null;
    modalDirectionsService = null;
    modalDirectionsRenderer = null;
    
    console.log('✅ Modal cleanup complete');
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
// Handle booking form submission
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Submitting booking...');
    
    if (!currentRideData) {
        alert('❌ No ride selected');
        return;
    }
    
    const pickupField = document.getElementById('pickupPoint');
    const pickupLat = pickupField.dataset.lat;
    const pickupLng = pickupField.dataset.lng;
    
    // Validate that pickup coordinates exist
    if (!pickupLat || !pickupLng) {
        alert('⚠️ Please select a pickup point on the map by dragging the blue pin along the route');
        return;
    }
    
    console.log('✅ Pickup coordinates validated:', { lat: pickupLat, lng: pickupLng });
    
    const numPassengers = parseInt(document.getElementById('numPassengers').value);
    const availableSeats = currentRideData.available_seats || currentRideData.seat_available || 0;

    if (numPassengers > availableSeats) {
        alert(`Not enough seats. Only ${availableSeats} remaining.`);
        return;
    }

    const formData = {
        passenger_name: document.getElementById('passengerName').value,
        passenger_phone: document.getElementById('passengerPhone').value,
        passenger_email: document.getElementById('passengerEmail').value,
        num_passengers: numPassengers,
        pickupPoint: pickupField.value,
        pickupCoordinates: {
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng)
        },
        specialRequests: document.getElementById('specialRequests').value
    };

    const bookingData = {
        ...currentRideData,
        ...formData,
        passenger_id: userData.id,
        booking_date: new Date().toISOString()
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    console.log('✅ Booking data saved to session storage');
    console.log('📍 Pickup address:', bookingData.pickupPoint);
    console.log('📍 Pickup coordinates:', bookingData.pickupCoordinates);
    
    closeBookingModal();
    window.location.href = '../html/payment.html';
}


async function drawRouteWithPickupSelection(pickupPlace, destinationPlace) {
    if (!pickupPlace || !destinationPlace) return;

    // Clear previous markers and route
    if (pickupMarker) pickupMarker.setMap(null);
    if (destinationMarker) destinationMarker.setMap(null);
    if (pickupSelectionMarker) pickupSelectionMarker.setMap(null);
    if (routePolyline) routePolyline.setMap(null);

    return new Promise((resolve) => {
        directionsService.route(
            {
                origin: pickupPlace.geometry.location,
                destination: destinationPlace.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    // Draw the route
                    directionsRenderer.setDirections(result);

                    // Extract route coordinates
                    const route = result.routes[0];
                    currentRouteCoordinates = [];
                    route.overview_path.forEach(point => {
                        currentRouteCoordinates.push({
                            lat: point.lat(),
                            lng: point.lng()
                        });
                    });

                    // Add driver's start and end markers
                    pickupMarker = new google.maps.Marker({
                        position: pickupPlace.geometry.location,
                        map: map,
                        title: "Driver Start: " + pickupPlace.formatted_address,
                        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    });

                    destinationMarker = new google.maps.Marker({
                        position: destinationPlace.geometry.location,
                        map: map,
                        title: "Driver End: " + destinationPlace.formatted_address,
                        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    });

                    // Add user's current location marker
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const userLocation = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                
                                // Find nearest point on route to user
                                const nearestPoint = findNearestPointOnRoute(userLocation, currentRouteCoordinates);
                                
                                // Place draggable pickup marker at nearest point
                                if (pickupSelectionMarker) pickupSelectionMarker.setMap(null);
                                
                                pickupSelectionMarker = new google.maps.Marker({
                                    position: nearestPoint,
                                    map: map,
                                    title: "Your Pickup Point (drag to adjust)",
                                    icon: {
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                        scaledSize: new google.maps.Size(40, 40)
                                    },
                                    draggable: true,
                                    zIndex: 1000
                                });

                                // Update pickup point field with coordinates
                                updatePickupPointField(nearestPoint);

                                // Add drag listener to snap to route
                                pickupSelectionMarker.addListener('dragend', (event) => {
                                    const draggedPos = {
                                        lat: event.latLng.lat(),
                                        lng: event.latLng.lng()
                                    };
                                    
                                    // Snap to nearest point on route
                                    const snappedPoint = findNearestPointOnRoute(draggedPos, currentRouteCoordinates);
                                    pickupSelectionMarker.setPosition(snappedPoint);
                                    updatePickupPointField(snappedPoint);
                                });

                                // Show instruction
                                showPickupInstruction();
                            },
                            (error) => {
                                console.warn('Geolocation failed:', error);
                                // Default to start of route
                                const defaultPoint = currentRouteCoordinates[0];
                                pickupSelectionMarker = new google.maps.Marker({
                                    position: defaultPoint,
                                    map: map,
                                    title: "Your Pickup Point (drag to adjust)",
                                    icon: {
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                        scaledSize: new google.maps.Size(40, 40)
                                    },
                                    draggable: true,
                                    zIndex: 1000
                                });
                                updatePickupPointField(defaultPoint);
                                showPickupInstruction();
                            }
                        );
                    }

                    // Fit map to show entire route
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pickupPlace.geometry.location);
                    bounds.extend(destinationPlace.geometry.location);
                    map.fitBounds(bounds, 100);

                    resolve();
                } else {
                    console.error("Error fetching directions", status);
                    resolve();
                }
            }
        );
    });
}

// Find nearest point on route to a given location
function findNearestPointOnRoute(location, routeCoordinates) {
    if (!routeCoordinates || routeCoordinates.length === 0) {
        return location;
    }
    
    let minDistance = Infinity;
    let nearestPoint = routeCoordinates[0];
    
    routeCoordinates.forEach(point => {
        const distance = calculateDistance(location, point);
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
        }
    });
    
    return nearestPoint;
}

// Calculate distance between two lat/lng points using Haversine formula
function calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
}
// Update pickup point field with address using reverse geocoding
function updatePickupPointField(point) {
    const pickupField = document.getElementById('pickupPoint');
    if (!pickupField) {
        console.warn('⚠️ Pickup field not found');
        return;
    }
    
    // Store coordinates immediately in data attributes
    pickupField.dataset.lat = point.lat;
    pickupField.dataset.lng = point.lng;
    
    console.log('💾 Stored coordinates:', { lat: point.lat, lng: point.lng });
    
    // Show loading state
    pickupField.value = 'Getting address...';
    
    // Reverse geocode to get human-readable address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: point }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
            pickupField.value = results[0].formatted_address;
            console.log('✅ Address updated:', results[0].formatted_address);
        } else {
            // Fallback to coordinates if geocoding fails
            pickupField.value = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
            console.warn('⚠️ Geocoding failed, using coordinates');
        }
    });
}
// Show instruction text below pickup field
function showPickupInstruction() {
    const pickupField = document.getElementById('pickupPoint');
    if (!pickupField || !pickupField.parentElement) return;
    
    // Check if instruction already exists
    if (document.getElementById('pickupInstruction')) return;
    
    const instruction = document.createElement('small');
    instruction.id = 'pickupInstruction';
    instruction.style.color = '#2196F3';
    instruction.style.display = 'block';
    instruction.style.marginTop = '5px';
    instruction.style.fontSize = '12px';
    instruction.innerHTML = '📍 <strong>Drag the blue pin on the map</strong> to adjust your pickup point along the driver\'s route';
    
    pickupField.parentElement.appendChild(instruction);
    console.log('✅ Instruction text added');
}
