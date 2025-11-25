// Admin Page JavaScript
// Note: common.js should be loaded before this file in the HTML

// Admin Management
let adminList = [
    {
        id: 1,
        name: 'CHARLES LOUISE C. JAVIER',
        email: '2241122@stu.edu.ph',
        status: 'active',
        role: 'user'
    },
    {
        id: 2,
        name: 'JHEZELEN ADRIANNA Z. DAMOCLES',
        email: '2241122@stu.edu.ph',
        status: 'restricted',
        role: 'admin'
    },
    {
        id: 3,
        name: 'RENEE NATHALIE APRILLE C. DELEMUNDO',
        email: '2241122@stu.edu.ph',
        status: 'inactive',
        role: 'super'
    }
];

// Render Admin Table
function renderAdminTable(data = adminList) {
    const tableBody = document.getElementById('adminTableBody');
    
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No administrators found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(admin => `
        <tr>
            <td>${admin.name}</td>
            <td>${admin.email || '-'}</td>
            <td>${admin.role.toUpperCase()}</td>
            <td>${admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editAdmin(${admin.id})" title="Edit">
                    ✏️
                </button>
                <button class="btn-action btn-delete" onclick="deleteAdmin(${admin.id})" title="Delete">
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
        searchBtn.addEventListener('click', filterAdmins);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterAdmins();
            }
        });
    }
    
    // Add Admin Form Handler
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', addNewAdmin);
    }
}

function filterAdmins() {
    let filtered = [...adminList];
    
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const roleFilter = document.getElementById('roleFilter');
    
    const searchValue = searchInput?.value.toLowerCase().trim();
    const searchTypeValue = searchType?.value;
    
    if (searchValue) {
        filtered = filtered.filter(admin => {
            if (searchTypeValue === 'Name') {
                return admin.name.toLowerCase().includes(searchValue);
            } else if (searchTypeValue === 'Email') {
                return admin.email.toLowerCase().includes(searchValue);
            } else {
                return admin.name.toLowerCase().includes(searchValue) || 
                       admin.email.toLowerCase().includes(searchValue);
            }
        });
    }
    
    const statusValue = statusFilter?.value;
    if (statusValue) {
        filtered = filtered.filter(admin => admin.status === statusValue);
    }
    
    const roleValue = roleFilter?.value;
    if (roleValue) {
        filtered = filtered.filter(admin => admin.role === roleValue);
    }
    
    renderAdminTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const roleFilter = document.getElementById('roleFilter');
    
    if (searchInput) searchInput.value = '';
    if (searchType) searchType.value = 'All';
    if (statusFilter) statusFilter.value = '';
    if (roleFilter) roleFilter.value = '';
    renderAdminTable();
}

// Edit Admin
function editAdmin(id) {
    const admin = adminList.find(a => a.id === id);
    if (admin) {
        alert(`Edit Admin: ${admin.name}\n\nThis would open an edit modal with the admin's information.`);
    }
}

// Delete Admin
function deleteAdmin(id) {
    const admin = adminList.find(a => a.id === id);
    if (admin && confirm(`Are you sure you want to delete ${admin.name}?`)) {
        adminList = adminList.filter(a => a.id !== id);
        renderAdminTable();
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('Administrator deleted successfully', 'success');
        }
    }
}

// Add Admin Form Handler
function addNewAdmin() {
    const addAdminForm = document.getElementById('addAdminForm');
    
    // Validate form
    if (!addAdminForm.checkValidity()) {
        addAdminForm.reportValidity();
        return;
    }
    
    const formData = new FormData(addAdminForm);
    const newAdmin = {
        id: adminList.length > 0 ? Math.max(...adminList.map(a => a.id)) + 1 : 1,
        name: formData.get('name'),
        email: formData.get('email'),
        status: formData.get('status'),
        role: formData.get('role')
    };
    
    adminList.push(newAdmin);
    renderAdminTable();
    
    // Close modal
    const modalElement = document.getElementById('addAdminModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    // Reset form
    addAdminForm.reset();
    
    // Show notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('Administrator added successfully', 'success');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderAdminTable();
    console.log('Admin page initialized');
});

// Export functions to global scope
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;