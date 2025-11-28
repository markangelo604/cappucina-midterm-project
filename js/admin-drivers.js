// admin-drivers.js
let driversData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadDrivers();
    setupEventListeners();
});

async function loadDrivers() {
    try {
        showLoading(true);
        const response = await fetch('/api/drivers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        driversData = await response.json();
        renderDriversTable(driversData);
        showLoading(false);
    } catch (error) {
        console.error('Error loading drivers:', error);
        showNotification('Error loading drivers: ' + error.message, 'error');
        showLoading(false);
    }
}

function showLoading(show) {
    const tableBody = document.getElementById('driversTableBody');
    if (tableBody) {
        if (show) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
        }
    }
}

function renderDriversTable(data) {
    const tableBody = document.getElementById('driversTableBody');
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No drivers found</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(driver => {
        const vehicle = driver.vehicle?.[0] || {};
        return `
            <tr>
                <td>${driver.username || 'N/A'}</td>
                <td>${driver.profile?.name || 'N/A'}</td>
                <td>${driver.email || 'N/A'}</td>
                <td>${vehicle.plate_number || 'N/A'}</td>
                <td>${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.year || ''})</td>
                <td>${driver.account_status?.charAt(0).toUpperCase() + driver.account_status?.slice(1) || 'N/A'}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editDriver('${driver._id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteDriver('${driver._id}')" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) searchBtn.addEventListener('click', filterDrivers);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') filterDrivers();
        });
    }
    
    const addDriverBtn = document.getElementById('addDriverBtn');
    if (addDriverBtn) addDriverBtn.addEventListener('click', addNewDriver);
}

function filterDrivers() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusValue = document.getElementById('statusFilter').value;
    const verificationValue = document.getElementById('verificationFilter').value;
    
    let filtered = driversData;
    
    if (searchValue) {
        filtered = filtered.filter(driver => 
            (driver.username?.toLowerCase().includes(searchValue) ||
             driver.profile?.name?.toLowerCase().includes(searchValue) ||
             driver.email?.toLowerCase().includes(searchValue) ||
             driver.vehicle?.[0]?.plate_number?.toLowerCase().includes(searchValue))
        );
    }
    
    if (statusValue) {
        filtered = filtered.filter(driver => driver.account_status === statusValue);
    }
    
    if (verificationValue) {
        filtered = filtered.filter(driver => 
            driver.vehicle?.[0]?.verified === (verificationValue === 'verified')
        );
    }
    
    renderDriversTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const verificationFilter = document.getElementById('verificationFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (verificationFilter) verificationFilter.value = '';
    renderDriversTable(driversData);
}

async function editDriver(id) {
    try {
        const response = await fetch(`/api/drivers/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const driver = await response.json();
        const vehicle = driver.vehicle?.[0] || {};
        
        // Populate edit modal with driver data
        document.getElementById('editDriverId').value = driver._id;
        document.getElementById('editDriverUsername').value = driver.username || '';
        document.getElementById('editDriverName').value = driver.profile?.name || '';
        document.getElementById('editDriverEmail').value = driver.email || '';
        document.getElementById('editDriverPhone').value = driver.profile?.phone || '';
        document.getElementById('editDriverBrand').value = vehicle.brand || '';
        document.getElementById('editDriverPlate').value = vehicle.plate_number || '';
        document.getElementById('editDriverModel').value = vehicle.model || '';
        document.getElementById('editDriverYear').value = vehicle.year || '';
        document.getElementById('editDriverSeats').value = vehicle.available_seats || '';
        document.getElementById('editDriverStatus').value = driver.account_status || 'active';
        document.getElementById('editDriverVerification').value = vehicle.verified ? 'true' : 'false';
        
        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editDriverModal'));
        editModal.show();
    } catch (error) {
        console.error('Error fetching driver for edit:', error);
        showNotification('Error loading driver data: ' + error.message, 'error');
    }
}

async function updateDriver() {
    const form = document.getElementById('editDriverForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const driverId = document.getElementById('editDriverId').value;
    const formData = new FormData(form);
    
    const driverData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name'),
            phone: formData.get('phone')
        },
        email: formData.get('email'),
        account_status: formData.get('account_status'),
        vehicle: [{
            plate_number: formData.get('plate_number'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            year: parseInt(formData.get('year')) || 0,
            verified: formData.get('verification') === 'true',
            available_seats: parseInt(formData.get('available_seats')) || 4
        }]
    };
    
    // Only include password if provided
    const password = formData.get('password');
    if (password && password.trim() !== '') {
        driverData.password = password;
    }

    try {
        const response = await fetch(`/api/drivers/${driverId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(driverData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Driver updated successfully', 'success');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editDriverModal'));
            editModal.hide();
            await loadDrivers();
        } else {
            showNotification(result.message || 'Error updating driver', 'error');
        }
    } catch (error) {
        console.error('Error updating driver:', error);
        showNotification('Error updating driver: ' + error.message, 'error');
    }
}

async function deleteDriver(id) {
    if (confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
        try {
            const response = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (result.success) {
                showNotification('Driver deleted successfully', 'success');
                await loadDrivers();
            } else {
                showNotification(result.message || 'Error deleting driver', 'error');
            }
        } catch (error) {
            console.error('Error deleting driver:', error);
            showNotification('Error deleting driver: ' + error.message, 'error');
        }
    }
}

async function addNewDriver() {
    const form = document.getElementById('addDriverForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const driverData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name'),
            phone: formData.get('phone')
        },
        email: formData.get('email'),
        password: formData.get('password'),
        account_status: formData.get('account_status'),
        role: 'car_owner',
        vehicle: [{
            plate_number: formData.get('plate_number'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            year: parseInt(formData.get('year')) || 0,
            verified: formData.get('verification') === 'true',
            available_seats: parseInt(formData.get('available_seats')) || 4
        }]
    };

    try {
        const response = await fetch('/api/drivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(driverData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Driver created successfully', 'success');
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDriverModal'));
            modal.hide();
            await loadDrivers();
        } else {
            showNotification(result.message || 'Error creating driver', 'error');
        }
    } catch (error) {
        console.error('Error adding driver:', error);
        showNotification('Error creating driver: ' + error.message, 'error');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Export functions
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;
window.updateDriver = updateDriver;
