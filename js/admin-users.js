// admin-users.js
let usersData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    setupEventListeners();
});

async function loadUsers() {
    try {
        showLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        usersData = await response.json();
        renderUsersTable(usersData);
        showLoading(false);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users: ' + error.message, 'error');
        showLoading(false);
    }
}

function showLoading(show) {
    const tableBody = document.getElementById('usersTableBody');
    if (tableBody) {
        if (show) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
        }
    }
}

function renderUsersTable(data) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(user => `
        <tr>
            <td>${user.username || 'N/A'}</td>
            <td>${user.profile?.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.profile?.phone || 'N/A'}</td>
            <td>${user.account_status?.charAt(0).toUpperCase() + user.account_status?.slice(1) || 'N/A'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editUser('${user._id}')" title="Edit">
                    ✏️
                </button>
                <button class="btn-action btn-delete" onclick="deleteUser('${user._id}')" title="Delete">
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
    
    if (searchBtn) searchBtn.addEventListener('click', filterUsers);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') filterUsers();
        });
    }
    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.addEventListener('click', addNewUser);
}

function filterUsers() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusValue = document.getElementById('statusFilter').value;
    
    let filtered = usersData;
    
    if (searchValue) {
        filtered = filtered.filter(user => 
            (user.username?.toLowerCase().includes(searchValue) ||
             user.profile?.name?.toLowerCase().includes(searchValue) ||
             user.email?.toLowerCase().includes(searchValue) ||
             user.profile?.phone?.toLowerCase().includes(searchValue))
        );
    }
    
    if (statusValue) {
        filtered = filtered.filter(user => user.account_status === statusValue);
    }
    
    renderUsersTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    renderUsersTable(usersData);
}

async function editUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const user = await response.json();
        
        // Populate edit modal with user data
        document.getElementById('editUserId').value = user._id;
        document.getElementById('editUserUsername').value = user.username || '';
        document.getElementById('editUserName').value = user.profile?.name || '';
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserPhone').value = user.profile?.phone || '';
        document.getElementById('editUserStatus').value = user.account_status || 'active';
        
        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editModal.show();
    } catch (error) {
        console.error('Error fetching user for edit:', error);
        showNotification('Error loading user data: ' + error.message, 'error');
    }
}

async function updateUser() {
    const form = document.getElementById('editUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const userId = document.getElementById('editUserId').value;
    const formData = new FormData(form);
    
    const userData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name'),
            phone: formData.get('phone')
        },
        email: formData.get('email'),
        account_status: formData.get('status')
    };
    
    // Only include password if provided
    const password = formData.get('password');
    if (password) {
        userData.password = password;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('User updated successfully', 'success');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            editModal.hide();
            await loadUsers();
        } else {
            showNotification(result.message || 'Error updating user', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user: ' + error.message, 'error');
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (result.success) {
                showNotification('User deleted successfully', 'success');
                await loadUsers();
            } else {
                showNotification(result.message || 'Error deleting user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user: ' + error.message, 'error');
        }
    }
}

async function addNewUser() {
    const form = document.getElementById('addUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const userData = {
        username: formData.get('username'),
        profile: {
            name: formData.get('name'),
            phone: formData.get('phone')
        },
        email: formData.get('email'),
        password: formData.get('password'),
        account_status: formData.get('status')
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('User created successfully', 'success');
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            await loadUsers();
        } else {
            showNotification(result.message || 'Error creating user', 'error');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Error creating user: ' + error.message, 'error');
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
window.editUser = editUser;
window.deleteUser = deleteUser;
window.updateUser = updateUser;
