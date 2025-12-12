// ==========================================
// PASSENGER PROFILE JAVASCRIPT
// ==========================================

// Navigation Items
const navItems = [
    { name: 'Find Rides', url: '../html/passenger-dashboard.html', active: false },
    { name: 'My Bookings', url: '../html/booking.html', active: false },
];

// Footer Links
const footerLinks = {
    'Company': ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support': ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links': ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
};

// User Data
let userData = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page initializing...');
    
    // Load user data from session
    loadUserData();
    
    // Render navigation
    renderNavigation();
    
    // Render footer
    renderFooter();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load user profile
    loadUserProfile();
    
    // Load ride history
    loadRideHistory();
    
    console.log('✅ Profile page initialized');
});

// ==========================================
// LOAD USER DATA FROM SESSION
// ==========================================
function loadUserData() {
    const storedData = sessionStorage.getItem('userData');
    
    if (!storedData) {
        console.warn('⚠️ No user data found in session');
        showToast('Please log in to view your profile', 'error');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 2000);
        return;
    }
    
    try {
        userData = JSON.parse(storedData);
        console.log('✅ User data loaded:', userData.username);
    } catch (e) {
        console.error('❌ Error parsing user data:', e);
        showToast('Session error. Please log in again.', 'error');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 2000);
    }
}

// ==========================================
// RENDER NAVIGATION
// ==========================================
function renderNavigation() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = navItems.map(item => `
        <li>
            <a href="${item.url}" class="${item.active ? 'active' : ''}">
                ${item.name}
            </a>
        </li>
    `).join('');
}

// ==========================================
// RENDER FOOTER
// ==========================================
function renderFooter() {
    const footerContent = document.getElementById('footerContent');
    footerContent.innerHTML = `
        <div class="footer-brand">
            <h3>MerryLift</h3>
            <p>Your trusted carpooling platform in the Philippines. Share rides, save money, and build community through travel.</p>
        </div>
        ${Object.entries(footerLinks).map(([category, links]) => `
            <div class="footer-links">
                <h4>${category}</h4>
                <ul>
                    ${links.map(link => `<li><a href="#">${link}</a></li>`).join('')}
                </ul>
            </div>
        `).join('')}
    `;
    
    document.getElementById('year').textContent = new Date().getFullYear();
}

// ==========================================
// LOAD USER PROFILE
// ==========================================
async function loadUserProfile() {
    if (!userData || !userData.username) {
        console.error('❌ No user data available');
        return;
    }
    
    try {
        console.log('📥 Loading profile for:', userData.username);
        
        // Fetch full user profile from database
        const response = await fetch(`../php/get-user-profile.php?username=${encodeURIComponent(userData.username)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.user) {
            const user = result.user;
            
            // Update session storage with complete data
            userData = {
                ...userData,
                ...user
            };
            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            // Display profile data
            displayUserProfile(user);
            
        } else {
            console.warn('⚠️ Could not load full profile, using session data');
            displayUserProfile(userData);
        }
        
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        // Fallback to session data
        displayUserProfile(userData);
    }
}

// ==========================================
// DISPLAY USER PROFILE
// ==========================================
function displayUserProfile(user) {
    console.log('📊 Displaying profile:', user);
    
    // Avatar initials
    const name = user.name || user.username || 'User';
    const initials = getInitials(name);
    document.getElementById('avatarInitials').textContent = initials;
    
    // Profile header
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileUsername').textContent = user.username || 'username';
    
    // Member since
    let memberSince = 'Recently';
    if (user.created_at) {
        try {
            const date = new Date(user.created_at.$date || user.created_at);
            memberSince = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            console.warn('Could not parse date:', e);
        }
    }
    
    // Personal information display
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayEmail').textContent = user.email || 'Not provided';
    document.getElementById('displayPhone').textContent = user.phone || user.profile?.phone || 'Not provided';
    document.getElementById('displayUsernameInfo').textContent = user.username || 'Not set';
    document.getElementById('displayAddress').textContent = user.profile?.address || 'Not provided';
    document.getElementById('displayGender').textContent = user.profile?.gender ? 
        capitalizeFirst(user.profile.gender) : 'Not specified';
    
    // Account status
    const statusBadge = document.querySelector('#displayStatus .status-badge');
    const status = user.account_status || 'active';
    statusBadge.className = `status-badge ${status}`;
    statusBadge.textContent = capitalizeFirst(status);
    
    // Pre-fill edit form
    document.getElementById('editName').value = name;
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPhone').value = user.phone || user.profile?.phone || '';
    document.getElementById('editGender').value = user.profile?.gender || '';
    document.getElementById('editAddress').value = user.profile?.address || '';
}

// ==========================================
// LOAD RIDE HISTORY
// ==========================================
async function loadRideHistory() {
    if (!userData || !userData.username) return;
    
    try {
        console.log('📥 Loading ride history...');
        
        const response = await fetch(`../php/get-bookings.php?username=${encodeURIComponent(userData.username)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.bookings) {
            const bookings = result.bookings;
            
            // Update stats
            document.getElementById('totalRides').textContent = bookings.length;
            
            const upcomingCount = bookings.filter(b => 
                b.status === 'Confirmed' || b.status === 'Pending'
            ).length;
            document.getElementById('upcomingRides').textContent = upcomingCount;
            
            const completedBookings = bookings.filter(b => b.status === 'Completed');
            document.getElementById('completedRidesCount').textContent = completedBookings.length;
            
            // Calculate total spent
            const totalSpent = completedBookings.reduce((sum, booking) => {
                const price = parseFloat((booking.price || '0').replace(/[^\d.]/g, ''));
                return sum + price;
            }, 0);
            document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);
            
            // Display recent rides
            displayRecentRides(completedBookings.slice(0, 5));
            
        } else {
            console.warn('⚠️ No bookings found');
        }
        
    } catch (error) {
        console.error('❌ Error loading ride history:', error);
    }
}

// ==========================================
// DISPLAY RECENT RIDES
// ==========================================
function displayRecentRides(rides) {
    const container = document.getElementById('recentRidesList');
    
    if (!rides || rides.length === 0) {
        return; // Keep empty state
    }
    
    container.innerHTML = rides.map(ride => `
        <div class="ride-history-item">
            <div class="ride-info">
                <div class="ride-route">
                    <span class="route-point">${ride.pickup || 'N/A'}</span>
                    <span class="route-arrow">→</span>
                    <span class="route-point">${ride.destination || 'N/A'}</span>
                </div>
                <div class="ride-meta">
                    <span>${ride.date}</span>
                    <span>•</span>
                    <span>${ride.driver_name}</span>
                </div>
            </div>
            <div class="ride-price">${ride.price}</div>
        </div>
    `).join('');
}

// ==========================================
// SETUP EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    document.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.style.display = 'none';
    });
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
    
    // Edit profile button
    const btnEditProfile = document.getElementById('btnEditProfile');
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', toggleEditMode);
    }
    
    // Cancel edit button
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', toggleEditMode);
    }
    
    // Edit form submission
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Change password button
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', openPasswordModal);
    }
    
    // Password modal close buttons
    const closePasswordModal = document.getElementById('closePasswordModal');
    const btnCancelPassword = document.getElementById('btnCancelPassword');
    
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', closePasswordModalFunc);
    }
    if (btnCancelPassword) {
        btnCancelPassword.addEventListener('click', closePasswordModalFunc);
    }
    
    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Settings toggles
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');
    
    if (emailNotifications) {
        emailNotifications.addEventListener('change', function() {
            saveSettingPreference('email_notifications', this.checked);
        });
    }
    
    if (smsNotifications) {
        smsNotifications.addEventListener('change', function() {
            saveSettingPreference('sms_notifications', this.checked);
        });
    }
    
    // Profile visibility
    const profileVisibility = document.getElementById('profileVisibility');
    if (profileVisibility) {
        profileVisibility.addEventListener('change', function() {
            saveSettingPreference('profile_visibility', this.value);
        });
    }
}

// ==========================================
// SWITCH SECTION
// ==========================================
function switchSection(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// ==========================================
// TOGGLE EDIT MODE
// ==========================================
function toggleEditMode() {
    const infoDisplay = document.getElementById('infoDisplay');
    const editForm = document.getElementById('editForm');
    const btnEditProfile = document.getElementById('btnEditProfile');
    
    const isEditing = editForm.style.display !== 'none';
    
    if (isEditing) {
        // Cancel editing
        infoDisplay.style.display = 'grid';
        editForm.style.display = 'none';
        btnEditProfile.style.display = 'inline-flex';
    } else {
        // Start editing
        infoDisplay.style.display = 'none';
        editForm.style.display = 'block';
        btnEditProfile.style.display = 'none';
    }
}

// ==========================================
// HANDLE PROFILE UPDATE
// ==========================================
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!userData || !userData.username) {
        showToast('Session error. Please log in again.', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const updateData = {
        username: userData.username,
        profile: {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            gender: formData.get('gender')
        },
        email: formData.get('email')
    };
    
    console.log('📤 Updating profile:', updateData);
    
    try {
        const response = await fetch('../php/update-user-profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Profile updated successfully');
            
            // Update session storage
            userData = {
                ...userData,
                name: updateData.profile.name,
                email: updateData.email,
                phone: updateData.profile.phone,
                profile: {
                    ...userData.profile,
                    ...updateData.profile
                }
            };
            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            // Refresh display
            displayUserProfile(userData);
            
            // Exit edit mode
            toggleEditMode();
            
            // Show success message
            showToast('Profile updated successfully!', 'success');
            
        } else {
            console.error('❌ Update failed:', result.message);
            showToast(result.message || 'Failed to update profile', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}

// ==========================================
// PASSWORD MODAL FUNCTIONS
// ==========================================
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closePasswordModalFunc() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('passwordForm').reset();
    }
}

// ==========================================
// HANDLE PASSWORD CHANGE
// ==========================================
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    // Validate password length
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (!userData || !userData.username) {
        showToast('Session error. Please log in again.', 'error');
        return;
    }
    
    console.log('📤 Changing password for:', userData.username);
    
    try {
        const response = await fetch('../php/change-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: userData.username,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Password changed successfully');
            closePasswordModalFunc();
            showToast('Password updated successfully!', 'success');
        } else {
            console.error('❌ Password change failed:', result.message);
            showToast(result.message || 'Failed to change password', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}

// ==========================================
// SAVE SETTING PREFERENCE
// ==========================================
function saveSettingPreference(setting, value) {
    console.log(`💾 Saving setting: ${setting} = ${value}`);
    
    // Store in localStorage for now
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings[setting] = value;
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    showToast('Setting saved', 'success');
    
    // TODO: Sync with backend
}

// ==========================================
// SHOW TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // Update icon based on type
    if (type === 'error') {
        toastIcon.textContent = '✗';
        toastIcon.style.background = 'var(--error-red)';
    } else {
        toastIcon.textContent = '✓';
        toastIcon.style.background = 'var(--success-green)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getInitials(name) {
    if (!name) return 'U';
    
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ==========================================
// EXPORT FOR DEBUGGING
// ==========================================
window.profileDebug = {
    userData: () => userData,
    loadProfile: loadUserProfile,
    loadHistory: loadRideHistory
};

console.log('📋 Profile script loaded successfully');