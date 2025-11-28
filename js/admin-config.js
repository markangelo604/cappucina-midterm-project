// admin-config.js
let adminsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadAdmins();
    setupEventListeners();
});

async function loadAdmins() {
    try {
        showLoading(true);
        const response = await fetch('/api/admins');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        adminsData = await response.json();
        renderAdminTable(adminsData);
        showLoading(false);
    } catch (error) {
        console.error('Error loading admins:', error);
        showNotification('Error loading admins: ' + error.message, 'error');
        showLoading(false);
    }
}

function showLoading(show) {
    const tableBody = document.getElementById('adminTableBody');
    if (tableBody) {
        if (show) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
        }
    }
}

function renderAdminTable(data) {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No administrators found</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(admin => `
        <tr>
            <td>${admin.username || 'N/A'}</td>
            <td>${admin.profile?.name || 'N/A'}</td>
            <td>${admin.email || '-'}</td>
            <td>${admin.role?.toUpperCase() || 'ADMIN'}</td>
            <td>${admin.account_status?.charAt(0).toUpperCase() + admin.account_status?.slice(1) || 'N/A'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editAdmin('${admin._id}')" title="Edit">
                    ✏️
                </button>
                <button class="btn-action btn-delete" onclick="deleteAdmin('${admin._id}')" title="Delete">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) searchBtn.addEventListener('click', filterAdmins);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') filterAdmins();
        });
    }
    
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) addAdminBtn.addEventListener('click', addNewAdmin);
}

function filterAdmins() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusValue = document.getElementById('statusFilter').value;
    const roleValue = document.getElementById('roleFilter').value;
    
    let filtered = adminsData;
    
    if (searchValue) {
        filtered = filtered.filter(admin => 
            (admin.username?.toLowerCase().includes(searchValue) ||
             admin.profile?.name?.toLowerCase().includes(searchValue) ||
             admin.email?.toLowerCase().includes(searchValue))
        );
    }
    
    if (statusValue) {
        filtered = filtered.filter(admin => admin.account_status === statusValue);
    }
    
    if (roleValue) {
        filtered = filtered.filter(admin => admin.role === roleValue);
    }
    
    renderAdminTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const roleFilter = document.getElementById('roleFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (roleFilter) roleFilter.value = '';
    renderAdminTable(adminsData);
}

async function editAdmin(id) {
    try {
        const response = await fetch(`/api/admins/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const admin = await response.json();
        
        // Populate edit modal with admin data
        document.getElementById('editAdminId').value = admin._id;
        document.getElementById('editAdminUsername').value = admin.username || '';
        document.getElementById('editAdminName').value = admin.profile?.name || '';
        document.getElementById('editAdminEmail').value = admin.email || '';
        document.getElementById('editAdminStatus').value = admin.account_status || 'active';
        document.getElementById('editAdminRole').value = admin.role || 'admin';
        
        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editAdminModal'));
        editModal.show();
    } catch (error) {
        console.error('Error fetching admin for edit:', error);
        showNotification('Error loading admin data: ' + error.message, 'error');
    }
}

async function updateAdmin() {
    const form = document.getElementById('editAdminForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const adminId = document.getElementById('editAdminId').value;
    const formData = new FormData(form);
    
    const adminData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name')
        },
        email: formData.get('email'),
        role: formData.get('role'),
        account_status: formData.get('status')
    };
    
    // Only include password if provided
    const password = formData.get('password');
    if (password) {
        adminData.password = password;
    }

    try {
        const response = await fetch(`/api/admins/${adminId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Administrator updated successfully', 'success');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editAdminModal'));
            editModal.hide();
            await loadAdmins();
        } else {
            showNotification(result.message || 'Error updating administrator', 'error');
        }
    } catch (error) {
        console.error('Error updating admin:', error);
        showNotification('Error updating administrator: ' + error.message, 'error');
    }
}

async function deleteAdmin(id) {
    if (confirm('Are you sure you want to delete this administrator? This action cannot be undone.')) {
        try {
            const response = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (result.success) {
                showNotification('Administrator deleted successfully', 'success');
                await loadAdmins();
            } else {
                showNotification(result.message || 'Error deleting administrator', 'error');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            showNotification('Error deleting administrator: ' + error.message, 'error');
        }
    }
}

async function addNewAdmin() {
    const form = document.getElementById('addAdminForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const adminData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name')
        },
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        account_status: formData.get('status')
    };

    try {
        const response = await fetch('/api/admins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Administrator created successfully', 'success');
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAdminModal'));
            modal.hide();
            await loadAdmins();
        } else {
            showNotification(result.message || 'Error creating administrator', 'error');
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        showNotification('Error creating administrator: ' + error.message, 'error');
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
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.updateAdmin = updateAdmin;
