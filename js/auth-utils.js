// ========================================
// AUTHENTICATION UTILITIES
// ========================================

/**
 * Get current logged-in user data from sessionStorage
 * @returns {Object|null} User data object or null if not logged in
 */
function getCurrentUser() {
    try {
        const userData = sessionStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
}

/**
 * Get user's role
 * @returns {string|null} User role (admin, driver, passenger) or null
 */
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

/**
 * Get user's name
 * @returns {string} User name or 'Guest'
 */
function getUserName() {
    const user = getCurrentUser();
    return user ? user.name : 'Guest';
}

/**
 * Get user initials for avatar
 * @returns {string} User initials
 */
function getUserInitials() {
    const name = getUserName();
    if (name === 'Guest') return 'G';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Logout user and redirect to home
 */
function logoutUser() {
    // Clear session storage
    sessionStorage.removeItem('userData');
    
    // Redirect to home page
    window.location.href = '../index.html';
}

/**
 * Render dynamic navigation based on login status
 * @param {string} currentPage - Current active page
 */
function renderDynamicNavigation(currentPage = '') {
    const navMenu = document.getElementById('navMenu');
    const navButtons = document.querySelector('.nav-buttons');
    
    if (!navMenu || !navButtons) return;
    
    const user = getCurrentUser();
    
    // Base navigation items
    const baseNavItems = [
        { name: 'Home', url: '../index.html', page: 'home' },
        { name: 'Find Rides', url: '../html/findrides.html', page: 'findrides' },
    ];
    
    // Navigation items based on login status
    let navItems = [...baseNavItems];
    
    if (user) {
        // Add role-specific nav items
        if (user.role === 'driver') {
            navItems.push({ name: 'My Rides', url: '../html/driver-dashboard.html', page: 'driver-dashboard' });
        }
        navItems.push({ name: 'Bookings', url: '../html/booking.html', page: 'booking' });
        navItems.push({ name: 'About', url: '../html/about.html', page: 'about' });
    } else {
        navItems.push({ name: 'About', url: '../html/about.html', page: 'about' });
    }
    
    // Render navigation menu
    navMenu.innerHTML = navItems.map(item => `
        <li>
            <a href="${item.url}" class="${item.page === currentPage ? 'active' : ''}">
                ${item.name}
            </a>
        </li>
    `).join('');
    
    // Render navigation buttons
    if (user) {
        // Logged in - show user menu
        navButtons.innerHTML = `
            <div class="user-menu">
                <button class="user-avatar" id="userMenuBtn">
                    ${getUserInitials()}
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-role">${capitalizeRole(user.role)}</div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="../html/${user.role}-dashboard.html" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="2" y="2" width="5" height="5" rx="1"/>
                            <rect x="9" y="2" width="5" height="5" rx="1"/>
                            <rect x="2" y="9" width="5" height="5" rx="1"/>
                            <rect x="9" y="9" width="5" height="5" rx="1"/>
                        </svg>
                        Dashboard
                    </a>
                    <a href="../html/profile.html" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="5" r="3"/>
                            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                        </svg>
                        Profile
                    </a>
                    <a href="../html/booking.html" class="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="3" y="3" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <line x1="3" y1="6" x2="13" y2="6" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        My Bookings
                    </a>
                    <div class="dropdown-divider"></div>
                    <button onclick="logoutUser()" class="dropdown-item logout-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M10 2v2h3v8h-3v2h5V2h-5z"/>
                            <path d="M6 4L2 8l4 4V9h6V7H6V4z"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
        
        // Add dropdown toggle functionality
        setTimeout(() => {
            const userMenuBtn = document.getElementById('userMenuBtn');
            const userDropdown = document.getElementById('userDropdown');
            
            if (userMenuBtn && userDropdown) {
                userMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                        userDropdown.classList.remove('show');
                    }
                });
            }
        }, 100);
        
    } else {
        // Not logged in - show sign in/join buttons
        navButtons.innerHTML = `
            <button class="btn-Outline" onclick="window.location.href='../html/login.html'">Sign In</button>
            <button class="btn-primary" onclick="window.location.href='../html/signup.html'">Join Now</button>
        `;
    }
}

/**
 * Capitalize role name
 * @param {string} role 
 * @returns {string}
 */
function capitalizeRole(role) {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Protect page - redirect to login if not authenticated
 * @param {string[]} allowedRoles - Array of allowed roles (optional)
 */
function protectPage(allowedRoles = null) {
    const user = getCurrentUser();
    
    if (!user) {
        // Not logged in - redirect to login
        window.location.href = '../html/login.html';
        return false;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User role not allowed - redirect to appropriate dashboard
        alert('You do not have permission to access this page.');
        window.location.href = `../html/${user.role}-dashboard.html`;
        return false;
    }
    
    return true;
}

/**
 * Add styles for user menu (call this once in your main CSS or add to page)
 */
function addUserMenuStyles() {
    if (document.getElementById('userMenuStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'userMenuStyles';
    style.textContent = `
        .user-menu {
            position: relative;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #073066, #FEC708);
            color: white;
            border: none;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        
        .user-avatar:hover {
            transform: scale(1.05);
        }
        
        .user-dropdown {
            position: absolute;
            top: 50px;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            min-width: 200px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .user-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .user-info {
            padding: 16px;
        }
        
        .user-name {
            font-weight: 600;
            color: #073066;
            margin-bottom: 4px;
        }
        
        .user-role {
            font-size: 12px;
            color: #6c757d;
            text-transform: capitalize;
        }
        
        .dropdown-divider {
            height: 1px;
            background: #e9ecef;
            margin: 8px 0;
        }
        
        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: #073066;
            text-decoration: none;
            transition: background 0.2s;
            cursor: pointer;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-size: 14px;
        }
        
        .dropdown-item:hover {
            background: #f8f9fa;
        }
        
        .dropdown-item svg {
            flex-shrink: 0;
        }
        
        .logout-btn {
            color: #dc3545;
        }
        
        .logout-btn:hover {
            background: #fff5f5;
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize styles when script loads
addUserMenuStyles();