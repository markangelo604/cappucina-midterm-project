// admin-drivers.js - Enhanced with status tabs, document review, and add driver functionality
let driversData = [];
let currentStatus = 'pending';
let currentDriver = null;

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
        updateCounts();
        renderDriversTable(filterByStatus(currentStatus));
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
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';
        }
    }
}

function filterByStatus(status) {
    return driversData.filter(driver => {
        const driverStatus = driver.driver_status || 'pending';
        const vehicleVerified = driver.vehicle?.[0]?.verified || false;
        
        if (status === 'pending') {
            return driverStatus === 'pending' && !vehicleVerified;
        } else if (status === 'verified') {
            return vehicleVerified === true || driverStatus === 'active';
        } else if (status === 'rejected') {
            return driverStatus === 'rejected' || driver.account_status === 'rejected';
        }
        return false;
    });
}

function updateCounts() {
    const pending = filterByStatus('pending').length;
    const verified = filterByStatus('verified').length;
    const rejected = filterByStatus('rejected').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('verifiedCount').textContent = verified;
    document.getElementById('rejectedCount').textContent = rejected;
}

function switchTab(status) {
    currentStatus = status;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-btn[data-status="${status}"]`).classList.add('active');
    
    // Render filtered drivers
    renderDriversTable(filterByStatus(status));
}

function renderDriversTable(data) {
    const tableBody = document.getElementById('driversTableBody');
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No drivers found</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(driver => {
        const vehicle = driver.vehicle?.[0] || {};
        const documents = vehicle.document || {};
        const hasLicense = documents.license && documents.license !== 'PENDING_UPLOAD';
        const hasRegistration = documents.registration && documents.registration !== 'PENDING_UPLOAD';
        const hasPhoto = documents.photo && documents.photo !== 'PENDING_UPLOAD';
        const docsUploaded = [hasLicense, hasRegistration, hasPhoto].filter(Boolean).length;
        
        let docBadgeClass = 'none';
        let docBadgeText = 'No Docs';
        if (docsUploaded === 3) {
            docBadgeClass = 'complete';
            docBadgeText = '✓ Complete';
        } else if (docsUploaded > 0) {
            docBadgeClass = 'incomplete';
            docBadgeText = `${docsUploaded}/3 Docs`;
        }

        const driverStatus = driver.driver_status || (vehicle.verified ? 'verified' : 'pending');
        let statusBadgeClass = 'pending';
        let statusText = 'Pending';
        
        if (vehicle.verified || driverStatus === 'active') {
            statusBadgeClass = 'verified';
            statusText = 'Verified';
        } else if (driverStatus === 'rejected' || driver.account_status === 'rejected') {
            statusBadgeClass = 'rejected';
            statusText = 'Rejected';
        }

        return `
            <tr>
                <td>${driver.username || 'N/A'}</td>
                <td>${driver.profile?.name || 'N/A'}</td>
                <td>${driver.email || 'N/A'}</td>
                <td>${driver.profile?.phone || 'N/A'}</td>
                <td>${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.year || ''})</td>
                <td><strong>${vehicle.plate_number || 'N/A'}</strong></td>
                <td>
                    <span class="doc-badge ${docBadgeClass}" onclick="reviewDriver('${driver._id}')" title="Click to view documents">
                        ${docBadgeText}
                    </span>
                </td>
                <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns">
                        ${currentStatus === 'pending' ? `
                            <button class="btn-review" onclick="reviewDriver('${driver._id}')" title="Review Application">
                                <i class="bi bi-file-text"></i> Review
                            </button>
                        ` : ''}
                        ${currentStatus === 'verified' || currentStatus === 'rejected' ? `
                            <button class="btn-action btn-edit" onclick="editDriver('${driver._id}')" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteDriver('${driver._id}')" title="Delete">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function reviewDriver(id) {
    try {
        const response = await fetch(`/api/drivers/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const driver = await response.json();
        currentDriver = driver;
        
        const vehicle = driver.vehicle?.[0] || {};
        const documents = vehicle.document || {};
        
        // Populate driver information
        document.getElementById('reviewUsername').textContent = driver.username || 'N/A';
        document.getElementById('reviewName').textContent = driver.profile?.name || 'N/A';
        document.getElementById('reviewEmail').textContent = driver.email || 'N/A';
        document.getElementById('reviewPhone').textContent = driver.profile?.phone || 'N/A';
        document.getElementById('reviewVehicle').textContent = 
            `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.year || ''})`;
        document.getElementById('reviewPlate').textContent = vehicle.plate_number || 'N/A';
        
        // Load documents
        const documentsContainer = document.getElementById('documentsContainer');
        documentsContainer.innerHTML = '';
        
        const docTypes = [
            { key: 'license', label: "Driver's License" },
            { key: 'registration', label: 'Vehicle Registration (OR/CR)' },
            { key: 'photo', label: 'Vehicle Photo' }
        ];
        
        docTypes.forEach(docType => {
            const docData = documents[docType.key];
            const docDiv = document.createElement('div');
            docDiv.className = 'document-item';
            
            const docHeader = document.createElement('h6');
            docHeader.textContent = docType.label;
            docDiv.appendChild(docHeader);
            
            if (docData && docData !== 'PENDING_UPLOAD') {
                // Check if it's a base64 image
                if (docData.startsWith('data:image')) {
                    const img = document.createElement('img');
                    img.src = docData;
                    img.alt = docType.label;
                    img.style.maxWidth = '100%';
                    docDiv.appendChild(img);
                } else if (docData.startsWith('data:application/pdf')) {
                    const embedPdf = document.createElement('embed');
                    embedPdf.src = docData;
                    embedPdf.type = 'application/pdf';
                    embedPdf.style.width = '100%';
                    embedPdf.style.height = '500px';
                    docDiv.appendChild(embedPdf);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'document-placeholder';
                    placeholder.textContent = '📄 Document uploaded (unsupported preview format)';
                    docDiv.appendChild(placeholder);
                }
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'document-placeholder';
                placeholder.textContent = '❌ No document uploaded';
                docDiv.appendChild(placeholder);
            }
            
            documentsContainer.appendChild(docDiv);
        });
        
        // Reset rejection reason section
        document.getElementById('rejectionReasonSection').style.display = 'none';
        document.getElementById('rejectionReason').value = '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reviewDriverModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading driver details:', error);
        showNotification('Error loading driver details: ' + error.message, 'error');
    }
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
    
    // Approve button
    const btnApprove = document.getElementById('btnApproveDriver');
    if (btnApprove) {
        btnApprove.addEventListener('click', approveDriver);
    }
    
    // Reject button
    const btnReject = document.getElementById('btnRejectDriver');
    if (btnReject) {
        btnReject.addEventListener('click', () => {
            const reasonSection = document.getElementById('rejectionReasonSection');
            if (reasonSection.style.display === 'none') {
                reasonSection.style.display = 'block';
                btnReject.textContent = 'Confirm Rejection';
            } else {
                rejectDriver();
            }
        });
    }
    
    // Add driver button
    const addDriverBtn = document.getElementById('addDriverBtn');
    if (addDriverBtn) {
        addDriverBtn.addEventListener('click', addNewDriver);
    }
}

async function approveDriver() {
    if (!currentDriver) return;
    
    if (!confirm('Are you sure you want to approve and verify this driver? This will allow them to start accepting rides.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/drivers/${currentDriver._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_status: 'active',
                account_status: 'active',
                'vehicle.0.verified': true,
                verified_at: new Date().toISOString(),
                verified_by: 'admin'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Driver approved and verified successfully!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewDriverModal'));
            modal.hide();
            await loadDrivers();
        } else {
            showNotification(result.message || 'Error approving driver', 'error');
        }
    } catch (error) {
        console.error('Error approving driver:', error);
        showNotification('Error approving driver: ' + error.message, 'error');
    }
}

async function rejectDriver() {
    if (!currentDriver) return;
    
    const reason = document.getElementById('rejectionReason').value.trim();
    if (!reason) {
        alert('Please provide a reason for rejection.');
        return;
    }
    
    try {
        const response = await fetch(`/api/drivers/${currentDriver._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_status: 'rejected',
                account_status: 'rejected',
                rejection_reason: reason,
                rejected_at: new Date().toISOString(),
                rejected_by: 'admin'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Driver application rejected.', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewDriverModal'));
            modal.hide();
            await loadDrivers();
        } else {
            showNotification(result.message || 'Error rejecting driver', 'error');
        }
    } catch (error) {
        console.error('Error rejecting driver:', error);
        showNotification('Error rejecting driver: ' + error.message, 'error');
    }
}

function filterDrivers() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = filterByStatus(currentStatus);
    
    if (searchValue) {
        filtered = filtered.filter(driver => 
            (driver.username?.toLowerCase().includes(searchValue) ||
             driver.profile?.name?.toLowerCase().includes(searchValue) ||
             driver.email?.toLowerCase().includes(searchValue) ||
             driver.vehicle?.[0]?.plate_number?.toLowerCase().includes(searchValue))
        );
    }
    
    renderDriversTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    renderDriversTable(filterByStatus(currentStatus));
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
        role: 'car_owner',
        account_status: formData.get('account_status'),
        vehicle: [{
            plate_number: formData.get('plate_number').toUpperCase(),
            brand: formData.get('brand'),
            model: formData.get('model'),
            year: parseInt(formData.get('year')) || 0,
            verified: formData.get('verification') === 'true',
            available_seats: parseInt(formData.get('available_seats')) || 4,
            document: {
                license: 'PENDING_UPLOAD',
                registration: 'PENDING_UPLOAD',
                photo: 'PENDING_UPLOAD'
            }
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
window.switchTab = switchTab;
window.reviewDriver = reviewDriver;
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;
window.updateDriver = updateDriver;