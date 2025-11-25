
// Users Management
let usersList = [
    {
        id: 1,
        name: 'MARIA SANTOS',
        email: 'maria.santos@email.com',
        phone: '+63 912 345 6789',
        accountType: 'premium',
        status: 'active'
    },
    {
        id: 2,
        name: 'JUAN DELA CRUZ',
        email: 'juan.delacruz@email.com',
        phone: '+63 923 456 7890',
        accountType: 'regular',
        status: 'active'
    },
    {
        id: 3,
        name: 'ANNA REYES',
        email: 'anna.reyes@email.com',
        phone: '+63 934 567 8901',
        accountType: 'verified',
        status: 'suspended'
    }
];

// Render Users Table
function renderUsersTable(data = usersList) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}</td>
            <td>${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editUser(${user.id})" title="Edit">
                    ✏️
                </button>
                <button class="btn-action btn-delete" onclick="deleteUser(${user.id})" title="Delete">
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
        searchBtn.addEventListener('click', filterUsers);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterUsers();
            }
        });
    }
    
    // Add User Form Handler
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', addNewUser);
    }
}

function filterUsers() {
    let filtered = [...usersList];
    
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const accountTypeFilter = document.getElementById('accountTypeFilter');
    
    const searchValue = searchInput?.value.toLowerCase().trim();
    const searchTypeValue = searchType?.value;
    
    if (searchValue) {
        filtered = filtered.filter(user => {
            if (searchTypeValue === 'Name') {
                return user.name.toLowerCase().includes(searchValue);
            } else if (searchTypeValue === 'Email') {
                return user.email.toLowerCase().includes(searchValue);
            } else if (searchTypeValue === 'Phone') {
                return user.phone.toLowerCase().includes(searchValue);
            } else {
                return user.name.toLowerCase().includes(searchValue) || 
                       user.email.toLowerCase().includes(searchValue) ||
                       user.phone.toLowerCase().includes(searchValue);
            }
        });
    }
    
    const statusValue = statusFilter?.value;
    if (statusValue) {
        filtered = filtered.filter(user => user.status === statusValue);
    }
    
    const accountTypeValue = accountTypeFilter?.value;
    if (accountTypeValue) {
        filtered = filtered.filter(user => user.accountType === accountTypeValue);
    }
    
    renderUsersTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const statusFilter = document.getElementById('statusFilter');
    const accountTypeFilter = document.getElementById('accountTypeFilter');
    
    if (searchInput) searchInput.value = '';
    if (searchType) searchType.value = 'All';
    if (statusFilter) statusFilter.value = '';
    if (accountTypeFilter) accountTypeFilter.value = '';
    renderUsersTable();
}

// Edit User
function editUser(id) {
    const user = usersList.find(u => u.id === id);
    if (user) {
        alert(`Edit User: ${user.name}\n\nThis would open an edit modal with the user's information.`);
    }
}

// Delete User
function deleteUser(id) {
    const user = usersList.find(u => u.id === id);
    if (user && confirm(`Are you sure you want to delete ${user.name}?`)) {
        usersList = usersList.filter(u => u.id !== id);
        renderUsersTable();
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('User deleted successfully', 'success');
        }
    }
}

// Add User Form Handler
function addNewUser() {
    const addUserForm = document.getElementById('addUserForm');
    
    // Validate form
    if (!addUserForm.checkValidity()) {
        addUserForm.reportValidity();
        return;
    }
    
    const formData = new FormData(addUserForm);
    const newUser = {
        id: usersList.length > 0 ? Math.max(...usersList.map(u => u.id)) + 1 : 1,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        accountType: formData.get('accountType'),
        status: formData.get('status')
    };
    
    usersList.push(newUser);
    renderUsersTable();
    
    // Close modal
    const modalElement = document.getElementById('addUserModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    // Reset form
    addUserForm.reset();
    
    // Show notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('User added successfully', 'success');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderUsersTable();
    console.log('Users page initialized');
});

// Export functions
window.editUser = editUser;
window.deleteUser = deleteUser;