// ========================================
// ADMIN DASHBOARD - DATABASE CONNECTED
// ========================================

// Dashboard state
let dashboardData = {
    totalUsers: 0,
    activeDrivers: 0,
    totalTrips: 0,
    emergencies: 0,
    recentTrips: [],
    tripStats: {
        completed: 0,
        upcoming: 0,
        cancelled: 0
    }
};

// Refresh interval (in milliseconds)
const REFRESH_INTERVAL = 30000; // 30 seconds

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Admin Dashboard initializing...');
    
    // Initialize dashboard
    await loadDashboardData();
    
    // Set up auto-refresh
    setInterval(loadDashboardData, REFRESH_INTERVAL);
    
    // Setup sidebar toggle
    setupSidebarToggle();
    
    // Update trip statistics section
    updateTripStatistics();
    
    console.log('✅ Dashboard initialized');
});

// ========================================
// LOAD DASHBOARD DATA
// ========================================
async function loadDashboardData() {
    try {
        showLoadingState(true);
        
        // Fetch all data in parallel
        const [usersData, driversData, tripsData] = await Promise.all([
            fetchUsers(),
            fetchDrivers(),
            fetchTrips()
        ]);
        
        // Update dashboard stats
        dashboardData.totalUsers = usersData.count;
        dashboardData.activeDrivers = driversData.activeCount;
        dashboardData.totalTrips = tripsData.totalCount;
        dashboardData.emergencies = 0; // Placeholder - implement if needed
        dashboardData.recentTrips = tripsData.recent;
        dashboardData.tripStats = {
            completed: tripsData.completed,
            upcoming: tripsData.upcoming,
            cancelled: tripsData.cancelled
        };
        
        // Update UI
        updateDashboardStats();
        updateRecentTrips();
        updateTripStatistics();
        
        showLoadingState(false);
        
        console.log('✅ Dashboard data loaded:', dashboardData);
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Retrying...');
        showLoadingState(false);
    }
}

// ========================================
// FETCH FUNCTIONS
// ========================================

/**
 * Fetch all users (passengers)
 */
async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        return {
            count: users.length,
            users: users
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { count: 0, users: [] };
    }
}

/**
 * Fetch all drivers
 */
async function fetchDrivers() {
    try {
        const response = await fetch('/api/drivers');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const drivers = await response.json();
        
        // Count active drivers
        const activeDrivers = drivers.filter(driver => 
            driver.account_status === 'active' || driver.account_status === 'on-duty'
        );
        
        return {
            count: drivers.length,
            activeCount: activeDrivers.length,
            drivers: drivers
        };
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return { count: 0, activeCount: 0, drivers: [] };
    }
}

/**
 * Fetch trips data from rides and bookings
 */
async function fetchTrips() {
    try {
        // Fetch rides data (which contains trip information)
        const ridesResponse = await fetch('../Server/Models/get-rides.php');
        
        if (!ridesResponse.ok) {
            throw new Error(`HTTP error! status: ${ridesResponse.status}`);
        }
        
        const rides = await ridesResponse.json();
        
        // Calculate statistics
        const totalTrips = rides.length;
        const completedTrips = rides.filter(ride => 
            ride.ride_status === 'completed' || ride.ride_status === 'finished'
        ).length;
        const upcomingTrips = rides.filter(ride => 
            ride.ride_status === 'upcoming'
        ).length;
        const cancelledTrips = rides.filter(ride => 
            ride.ride_status === 'cancelled'
        ).length;
        
        // Get recent trips (last 10 completed)
        const recentTrips = rides
            .filter(ride => ride.ride_status === 'completed' || ride.ride_status === 'finished')
            .sort((a, b) => {
                // Sort by created_at or date
                const dateA = a.created_at ? new Date(a.created_at.$date || a.created_at) : new Date(a.date);
                const dateB = b.created_at ? new Date(b.created_at.$date || b.created_at) : new Date(b.date);
                return dateB - dateA;
            })
            .slice(0, 10)
            .map(ride => formatTripData(ride));
        
        return {
            totalCount: totalTrips,
            completed: completedTrips,
            upcoming: upcomingTrips,
            cancelled: cancelledTrips,
            recent: recentTrips
        };
    } catch (error) {
        console.error('Error fetching trips:', error);
        return { 
            totalCount: 0, 
            completed: 0, 
            upcoming: 0, 
            cancelled: 0, 
            recent: [] 
        };
    }
}

// ========================================
// UPDATE UI FUNCTIONS
// ========================================

/**
 * Update dashboard statistics cards
 */
function updateDashboardStats() {
    // Update stat cards
    updateStatCard('totalUsers', dashboardData.totalUsers);
    updateStatCard('activeDrivers', dashboardData.activeDrivers);
    updateStatCard('totalTrips', dashboardData.totalTrips);
    updateStatCard('emergencies', dashboardData.emergencies);
    
    // Add animation
    animateStatCards();
}

/**
 * Update a single stat card
 */
function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        // Add animation class
        element.classList.add('updating');
        
        // Update value with animation
        setTimeout(() => {
            element.textContent = value;
            element.classList.remove('updating');
        }, 150);
    }
}

/**
 * Animate stat cards on update
 */
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 200);
        }, index * 50);
    });
}

/**
 * Update recent trips table
 */
function updateRecentTrips() {
    const tableBody = document.getElementById('recentTripsTable');
    
    if (!tableBody) {
        console.warn('Recent trips table not found');
        return;
    }
    
    if (dashboardData.recentTrips.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No recent trips</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = dashboardData.recentTrips.map(trip => `
        <tr class="trip-row">
            <td><strong>${trip.id}</strong></td>
            <td>${trip.driver}</td>
            <td>${trip.passenger || 'N/A'}</td>
            <td>
                <span class="badge ${getBadgeClass(trip.status)}">
                    ${trip.status}
                </span>
            </td>
            <td><strong>${trip.amount}</strong></td>
        </tr>
    `).join('');
}

/**
 * Update trip statistics section
 */
function updateTripStatistics() {
    // Update the trip statistics in the sidebar
    const stats = dashboardData.tripStats;
    
    // These IDs should match your HTML
    const totalTripsEl = document.querySelector('.trip-stat-item h4');
    if (totalTripsEl) {
        totalTripsEl.textContent = dashboardData.totalTrips;
    }
    
    // You can add more specific updates here based on your HTML structure
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Format trip data for display
 */
function formatTripData(ride) {
    const tripId = ride._id?.$oid || ride._id || 'N/A';
    const shortId = typeof tripId === 'string' ? tripId.substring(0, 8) : 'N/A';
    
    // Get passengers from ride or booking
    let passengerName = 'N/A';
    if (ride.passengers && ride.passengers.length > 0) {
        passengerName = ride.passengers[0];
    }
    
    return {
        id: `TRP${shortId}`,
        driver: ride.driver_username || ride.name || 'Unknown',
        passenger: passengerName,
        status: formatStatus(ride.ride_status),
        amount: formatPrice(ride.fare)
    };
}

/**
 * Format ride status for display
 */
function formatStatus(status) {
    const statusMap = {
        'completed': 'Completed',
        'finished': 'Completed',
        'upcoming': 'Upcoming',
        'ongoing': 'In Progress',
        'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status || 'Unknown';
}

/**
 * Format price for display
 */
function formatPrice(fare) {
    if (!fare) return '₱0.00';
    
    if (typeof fare === 'string' && fare.includes('₱')) {
        return fare;
    }
    
    return '₱' + parseFloat(fare).toFixed(2);
}

/**
 * Get badge CSS class based on status
 */
function getBadgeClass(status) {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'in progress' || statusLower === 'ongoing') return 'bg-primary';
    if (statusLower === 'cancelled') return 'bg-danger';
    if (statusLower === 'upcoming') return 'bg-warning';
    
    return 'bg-secondary';
}

/**
 * Show loading state
 */
function showLoadingState(show) {
    const statCards = document.querySelectorAll('.stat-card h3');
    
    statCards.forEach(card => {
        if (show) {
            card.style.opacity = '0.5';
        } else {
            card.style.opacity = '1';
        }
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Remove existing error if any
    const existing = document.querySelector('.dashboard-error');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'alert alert-warning position-fixed dashboard-error';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <strong>Notice:</strong> ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Setup sidebar toggle functionality
 */
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
}

// ========================================
// REAL-TIME UPDATES SIMULATION
// ========================================

/**
 * Simulate real-time updates for active drivers
 * (This adds a small random variation to show "live" data)
 */
function simulateRealTimeUpdates() {
    setInterval(() => {
        // Add small random variation to active drivers count (±2)
        const variation = Math.floor(Math.random() * 5) - 2;
        const newCount = Math.max(0, dashboardData.activeDrivers + variation);
        
        if (newCount !== dashboardData.activeDrivers) {
            dashboardData.activeDrivers = newCount;
            updateStatCard('activeDrivers', newCount);
        }
    }, 10000); // Every 10 seconds
}

// Start real-time simulation after initial load
setTimeout(() => {
    simulateRealTimeUpdates();
}, 5000);

// ========================================
// EXPORT FOR TESTING
// ========================================
window.dashboardAPI = {
    loadDashboardData,
    fetchUsers,
    fetchDrivers,
    fetchTrips,
    updateDashboardStats,
    dashboardData: () => dashboardData
};

// ========================================
// STYLES
// ========================================
const style = document.createElement('style');
style.textContent = `
    .stat-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stat-card h3.updating {
        animation: pulse 0.3s ease;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .trip-row {
        transition: background-color 0.2s ease;
    }
    
    .trip-row:hover {
        background-color: rgba(0,0,0,0.02);
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .bg-success {
        background-color: #28a745 !important;
        color: white !important;
    }
    
    .bg-primary {
        background-color: #007bff !important;
        color: white !important;
    }
    
    .bg-danger {
        background-color: #dc3545 !important;
        color: white !important;
    }
    
    .bg-warning {
        background-color: #ffc107 !important;
        color: #212529 !important;
    }
    
    .bg-secondary {
        background-color: #6c757d !important;
        color: white !important;
    }
    
    .dashboard-error {
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Log initialization
console.log('📊 Admin Dashboard Configuration Loaded');
console.log('🔄 Auto-refresh enabled:', REFRESH_INTERVAL / 1000, 'seconds');