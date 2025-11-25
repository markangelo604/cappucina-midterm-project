
// Drivers Management
let driversList = [
    {
        id: 1,
        name: 'PEDRO GARCIA',
        email: 'pedro.garcia@email.com',
        license: 'N01-12-345678',
        vehicle: 'Toyota Vios',
        plate: 'ABC 1234',
        verification: 'verified',
        status: 'on-duty'
    },
    {
        id: 2,
        name: 'RICARDO CRUZ',
        email: 'ricardo.cruz@email.com',
        license: 'N02-23-456789',
        vehicle: 'Honda City',
        plate: 'XYZ 5678',
        verification: 'verified',
        status: 'active'
    },
    {
        id: 3,
        name: 'MIGUEL RAMOS',
        email: 'miguel.ramos@email.com',
        license: 'N03-34-567890',
        vehicle: 'Nissan Almera',
        plate: 'DEF 9012',
        verification: 'pending',
        status: 'off-duty'
    }
];

// Render Drivers Table
function renderDriversTable(data = driversList) {
    const tableBody = document.getElementById('driversTableBody');
    
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No drivers found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(driver => `
        <tr>
            <td>${driver.name}</td>
            <td>${driver.email}</td>
            <td>${driver.license}</td>
            <td>${driver.vehicle} (${driver.plate})</td>
            <td>${driver.verification.charAt(0).toUpperCase() + driver.verification.slice(1)}</td>
            <td>${driver.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editDriver(${driver.id})" title="Edit">
                    ✏️
                </button>
                <button class="btn-action btn-delete" onclick="deleteDriver(${driver.id})" title="Delete">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Search and Filter Functionality
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterDrivers);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterDrivers();
            }
        });
    }
    
    // Add Driver Form Handler
    const addDriverBtn = document.getElementById('addDriverBtn');
    if (addDriverBtn) {
        addDriverBtn.addEventListener('click', addNewDriver);
    }
}

function filterDrivers() {
    let filtered = [...driversList];
    
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const verificationFilter = document.getElementById('verificationFilter');
    
    const searchValue = searchInput?.value.toLowerCase().trim();
    const searchTypeValue = searchType?.value;
    
    if (searchValue) {
        filtered = filtered.filter(driver => {
            if (searchTypeValue === 'Name') {
                return driver.name.toLowerCase().includes(searchValue);
            } else if (searchTypeValue === 'Email') {
                return driver.email.toLowerCase().includes(searchValue);
            } else if (searchTypeValue === 'License') {
                return driver.license.toLowerCase().includes(searchValue);
            } else {
                return driver.name.toLowerCase().includes(searchValue) || 
                       driver.email.toLowerCase().includes(searchValue) ||
                       driver.license.toLowerCase().includes(searchValue);
            }
        });
    }
    
    const statusValue = statusFilter?.value;
    if (statusValue) {
        filtered = filtered.filter(driver => driver.status === statusValue);
    }
    
    const verificationValue = verificationFilter?.value;
    if (verificationValue) {
        filtered = filtered.filter(driver => driver.verification === verificationValue);
    }
    
    renderDriversTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const verificationFilter = document.getElementById('verificationFilter');
    
    if (searchInput) searchInput.value = '';
    if (searchType) searchType.value = 'All';
    if (statusFilter) statusFilter.value = '';
    if (verificationFilter) verificationFilter.value = '';
    renderDriversTable();
}

// Edit Driver
function editDriver(id) {
    const driver = driversList.find(d => d.id === id);
    if (driver) {
        alert(`Edit Driver: ${driver.name}\n\nThis would open an edit modal with the driver's information.`);
    }
}

// Delete Driver
function deleteDriver(id) {
    const driver = driversList.find(d => d.id === id);
    if (driver && confirm(`Are you sure you want to delete ${driver.name}?`)) {
        driversList = driversList.filter(d => d.id !== id);
        renderDriversTable();
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('Driver deleted successfully', 'success');
        }
    }
}

// Add Driver Form Handler
function addNewDriver() {
    const addDriverForm = document.getElementById('addDriverForm');
    
    // Validate form
    if (!addDriverForm.checkValidity()) {
        addDriverForm.reportValidity();
        return;
    }
    
    const formData = new FormData(addDriverForm);
    const newDriver = {
        id: driversList.length > 0 ? Math.max(...driversList.map(d => d.id)) + 1 : 1,
        name: formData.get('name'),
        email: formData.get('email'),
        license: formData.get('license'),
        vehicle: formData.get('vehicle'),
        plate: formData.get('plate'),
        verification: formData.get('verification'),
        status: formData.get('status')
    };
    
    driversList.push(newDriver);
    renderDriversTable();
    
    // Close modal
    const modalElement = document.getElementById('addDriverModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    // Reset form
    addDriverForm.reset();
    
    // Show notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('Driver added successfully', 'success');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderDriversTable();
    console.log('Drivers page initialized');
});

// Export functions
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;