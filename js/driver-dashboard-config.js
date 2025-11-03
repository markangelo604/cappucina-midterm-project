// ========================================
// DRIVER DASHBOARD JAVASCRIPT
// ========================================

// Initialize destinations array from localStorage or empty array
let destinations = JSON.parse(localStorage.getItem('driverDestinations')) || [];

// DOM Elements
const addDestinationForm = document.getElementById('addDestinationForm');
const destinationsList = document.getElementById('destinationsList');
const emptyState = document.getElementById('emptyState');
const destinationCount = document.getElementById('destinationCount');
const currentYearSpan = document.getElementById('currentYear');

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    currentYearSpan.textContent = new Date().getFullYear();
    
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Render existing destinations
    renderDestinations();
    
    // Add form submit handler
    addDestinationForm.addEventListener('submit', handleAddDestination);
});

// ========================================
// FORM HANDLING
// ========================================

function handleAddDestination(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        id: Date.now(), // Unique ID using timestamp
        pickup: document.getElementById('pickup').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        seats: parseInt(document.getElementById('seats').value),
        price: parseFloat(document.getElementById('price').value),
        notes: document.getElementById('notes').value.trim(),
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    // Add to destinations array
    destinations.push(formData);
    
    // Save to localStorage
    saveDestinations();
    
    // Render updated list
    renderDestinations();
    
    // Reset form
    addDestinationForm.reset();
    
    // Show success message
    showSuccessMessage('Destination added successfully!');
    
    // Scroll to destinations list
    document.querySelector('.destinations-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderDestinations() {
    // Update count
    updateDestinationCount();
    
    // Check if there are destinations
    if (destinations.length === 0) {
        destinationsList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // Render destination cards
    destinationsList.innerHTML = destinations.map(dest => `
        <div class="destination-card" data-id="${dest.id}">
            <div class="destination-header">
                <span class="destination-status">${dest.status}</span>
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
                
                <div class="location-item">
                    <div class="location-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="8" r="3" stroke="#FEC708" stroke-width="2"/>
                            <path d="M10 2C6.5 2 4 4.5 4 7.5c0 5 6 10.5 6 10.5s6-5.5 6-10.5C16 4.5 13.5 2 10 2z" stroke="#FEC708" stroke-width="2"/>
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#6c757d">
                        <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <div>
                        <div class="detail-label">Date</div>
                        <div class="detail-value">${formatDate(dest.date)}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#6c757d">
                        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <line x1="8" y1="8" x2="8" y2="4" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <div>
                        <div class="detail-label">Time</div>
                        <div class="detail-value">${formatTime(dest.time)}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#6c757d">
                        <circle cx="5" cy="8" r="2"/>
                        <circle cx="11" cy="8" r="2"/>
                    </svg>
                    <div>
                        <div class="detail-label">Seats</div>
                        <div class="detail-value">${dest.seats} available</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#6c757d">
                        <text x="2" y="12" font-size="12" font-weight="bold">₱</text>
                    </svg>
                    <div>
                        <div class="detail-label">Price</div>
                        <div class="detail-value">₱${dest.price.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            ${dest.notes ? `<div class="destination-notes">"${dest.notes}"</div>` : ''}
            
            <div class="destination-actions">
                <button class="btn-edit" onclick="editDestination(${dest.id})">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn-delete" onclick="deleteDestination(${dest.id})">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// CRUD OPERATIONS
// ========================================

function deleteDestination(id) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this destination?')) {
        return;
    }
    
    // Filter out the destination
    destinations = destinations.filter(dest => dest.id !== id);
    
    // Save to localStorage
    saveDestinations();
    
    // Re-render
    renderDestinations();
    
    // Show success message
    showSuccessMessage('Destination deleted successfully!');
}

function editDestination(id) {
    // Find the destination
    const destination = destinations.find(dest => dest.id === id);
    
    if (!destination) return;
    
    // Populate form with destination data
    document.getElementById('pickup').value = destination.pickup;
    document.getElementById('destination').value = destination.destination;
    document.getElementById('date').value = destination.date;
    document.getElementById('time').value = destination.time;
    document.getElementById('seats').value = destination.seats;
    document.getElementById('price').value = destination.price;
    document.getElementById('notes').value = destination.notes || '';
    
    // Remove the old destination
    destinations = destinations.filter(dest => dest.id !== id);
    
    // Save changes
    saveDestinations();
    
    // Re-render
    renderDestinations();
    
    // Scroll to form
    document.querySelector('.add-destination-card').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Show message
    showSuccessMessage('Edit your destination and submit to save changes');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function saveDestinations() {
    localStorage.setItem('driverDestinations', JSON.stringify(destinations));
}

function updateDestinationCount() {
    const count = destinations.length;
    destinationCount.textContent = `${count} ${count === 1 ? 'destination' : 'destinations'}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showSuccessMessage(message) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.textContent = message;
    
    // Append to body
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// ========================================
// EXPORT FOR POTENTIAL API INTEGRATION
// ========================================

// Function to sync with backend (placeholder for future implementation)
async function syncWithBackend() {
    try {
        // Example: Send destinations to server
        // const response = await fetch('/api/driver/destinations', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(destinations)
        // });
        
        console.log('Ready for backend integration');
    } catch (error) {
        console.error('Sync error:', error);
    }
}