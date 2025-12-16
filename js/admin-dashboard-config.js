// ========================================
// ADMIN ANALYTICS DASHBOARD
// ========================================

// Chart instances
let charts = {
    tripsOverTime: null,
    tripStatus: null,
    monthlyRevenue: null,
    topDrivers: null,
    peakHours: null,
    driverStatus: null
};

// Dashboard state
let dashboardData = {
    totalUsers: 0,
    activeDrivers: 0,
    totalTrips: 0,
    totalRevenue: 0,
    recentTrips: [],
    chartData: {}
};

// Current time period
let currentPeriod = 'all';

// Refresh interval
const REFRESH_INTERVAL = 30000; // 30 seconds

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Analytics Dashboard initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadDashboardData();
    
    // Initialize all charts
    initializeCharts();
    
    // Set up auto-refresh
    setInterval(loadDashboardData, REFRESH_INTERVAL);
    
    console.log('✅ Analytics Dashboard initialized');
});

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Time period buttons
    const periodButtons = document.querySelectorAll('[data-period]');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Update active state
            periodButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update period and reload data
            currentPeriod = e.target.dataset.period;
            await loadDashboardData();
            updateCharts();
        });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
            refreshBtn.disabled = true;
            
            await loadDashboardData();
            updateCharts();
            
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            refreshBtn.disabled = false;
        });
    }
}

// ========================================
// DATA LOADING
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
        dashboardData.totalRevenue = tripsData.totalRevenue;
        dashboardData.recentTrips = tripsData.recent;
        
        // Generate chart data
        dashboardData.chartData = generateChartData(tripsData, driversData);
        
        // Update UI
        updateDashboardStats();
        updateRecentActivity();
        
        showLoadingState(false);
        
        console.log('✅ Dashboard data loaded:', dashboardData);
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
        showLoadingState(false);
    }
}

// ========================================
// FETCH FUNCTIONS
// ========================================
async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        return { count: users.length, users: users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { count: 0, users: [] };
    }
}

async function fetchDrivers() {
    try {
        const response = await fetch('/api/drivers');
        if (!response.ok) throw new Error('Failed to fetch drivers');
        
        const drivers = await response.json();
        
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

async function fetchTrips() {
    try {
        const response = await fetch('../Server/Models/get-rides.php');
        if (!response.ok) throw new Error('Failed to fetch trips');
        
        const rides = await response.json();
        
        // Calculate statistics
        const totalTrips = rides.length;
        const completedTrips = rides.filter(ride => 
            ride.ride_status === 'completed' || ride.ride_status === 'finished'
        );
        
        // Calculate total revenue
        const totalRevenue = completedTrips.reduce((sum, ride) => {
            const fare = parseFloat(ride.fare) || 0;
            return sum + fare;
        }, 0);
        
        // Get recent trips
        const recentTrips = rides
            .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at.$date || a.created_at) : new Date(a.date);
                const dateB = b.created_at ? new Date(b.created_at.$date || b.created_at) : new Date(b.date);
                return dateB - dateA;
            })
            .slice(0, 15)
            .map(ride => formatTripData(ride));
        
        return {
            totalCount: totalTrips,
            totalRevenue: totalRevenue,
            recent: recentTrips,
            allRides: rides
        };
    } catch (error) {
        console.error('Error fetching trips:', error);
        return { 
            totalCount: 0, 
            totalRevenue: 0,
            recent: [],
            allRides: []
        };
    }
}

// ========================================
// CHART DATA GENERATION
// ========================================
function generateChartData(tripsData, driversData) {
    const rides = tripsData.allRides || [];
    
    // Determine date range based on current period
    let dateRange = getLast7Days();
    let labelsFormatter = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (currentPeriod === 'today') {
        dateRange = getTodayHours();
        labelsFormatter = (d, i) => `${i}:00`;
    } else if (currentPeriod === 'week') {
        dateRange = getLast7Days();
        labelsFormatter = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (currentPeriod === 'month') {
        dateRange = getLast30Days();
        labelsFormatter = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (currentPeriod === 'year') {
        dateRange = getLast12Months();
        labelsFormatter = (d) => d.toLocaleDateString('en-US', { month: 'short' });
    } else if (currentPeriod === 'all') {
        dateRange = getLast7Days(); // Default to 7 days for 'all'
        labelsFormatter = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Trips over time
    const tripsByDay = dateRange.map((dateOrHour, index) => {
        if (currentPeriod === 'today') {
            // For today, filter by hour
            const hour = index;
            return rides.filter(ride => {
                const rideDate = ride.created_at ? 
                    new Date(ride.created_at.$date || ride.created_at) : 
                    new Date(ride.date);
                return rideDate.getHours() === hour && 
                       rideDate.toDateString() === new Date().toDateString() &&
                       (ride.ride_status === 'completed' || ride.ride_status === 'finished');
            }).length;
        } else {
            // For other periods, filter by date
            return rides.filter(ride => {
                const rideDate = ride.created_at ? 
                    new Date(ride.created_at.$date || ride.created_at) : 
                    new Date(ride.date);
                return rideDate.toDateString() === dateOrHour.toDateString() &&
                       (ride.ride_status === 'completed' || ride.ride_status === 'finished');
            }).length;
        }
    });
    
    // Trip status distribution
    const statusCounts = {
        completed: rides.filter(r => r.ride_status === 'completed' || r.ride_status === 'finished').length,
        ongoing: rides.filter(r => r.ride_status === 'ongoing').length,
        upcoming: rides.filter(r => r.ride_status === 'upcoming').length,
        cancelled: rides.filter(r => r.ride_status === 'cancelled').length
    };
    
    // Monthly revenue (last 6 months)
    const last6Months = getLast6Months();
    const revenueByMonth = last6Months.map(month => {
        return rides.filter(ride => {
            const rideDate = ride.created_at ? 
                new Date(ride.created_at.$date || ride.created_at) : 
                new Date(ride.date);
            return rideDate.getMonth() === month.getMonth() && 
                   rideDate.getFullYear() === month.getFullYear() &&
                   (ride.ride_status === 'completed' || ride.ride_status === 'finished');
        }).reduce((sum, ride) => sum + (parseFloat(ride.fare) || 0), 0);
    });
    
    // Top drivers by trips
    const driverTrips = {};
    rides.forEach(ride => {
        const driverName = ride.driver_username || ride.name || 'Unknown';
        driverTrips[driverName] = (driverTrips[driverName] || 0) + 1;
    });
    
    const topDrivers = Object.entries(driverTrips)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Peak hours
    const hourCounts = new Array(24).fill(0);
    rides.forEach(ride => {
        const rideDate = ride.created_at ? 
            new Date(ride.created_at.$date || ride.created_at) : 
            new Date(ride.date);
        const hour = rideDate.getHours();
        hourCounts[hour]++;
    });
    
    // Driver status distribution
    const drivers = driversData.drivers || [];
    const driverStatusCounts = {
        active: drivers.filter(d => d.account_status === 'active' || d.account_status === 'on-duty').length,
        offline: drivers.filter(d => d.account_status === 'offline' || d.account_status === 'inactive').length,
        pending: drivers.filter(d => d.account_status === 'pending').length
    };
    
    return {
        tripsByDay,
        labels: dateRange.map((d, i) => labelsFormatter(d, i)),
        statusCounts,
        revenueByMonth,
        topDrivers,
        hourCounts,
        driverStatusCounts,
        last7Days,
        last6Months
    };
}

// ========================================
// CHART INITIALIZATION
// ========================================
function initializeCharts() {
    // Trips Over Time Chart (Line)
    const tripsCtx = document.getElementById('tripsOverTimeChart');
    if (tripsCtx) {
        charts.tripsOverTime = new Chart(tripsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Trips',
                    data: [],
                    borderColor: '#073066',
                    backgroundColor: 'rgba(7, 48, 102, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Trip Status Chart (Doughnut)
    const statusCtx = document.getElementById('tripStatusChart');
    if (statusCtx) {
        charts.tripStatus = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Ongoing', 'Upcoming', 'Cancelled'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Monthly Revenue Chart (Bar)
    const revenueCtx = document.getElementById('monthlyRevenueChart');
    if (revenueCtx) {
        charts.monthlyRevenue = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue (₱)',
                    data: [],
                    backgroundColor: '#FEC708',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Top Drivers Chart (Horizontal Bar)
    const driversCtx = document.getElementById('topDriversChart');
    if (driversCtx) {
        charts.topDrivers = new Chart(driversCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Trips',
                    data: [],
                    backgroundColor: '#073066',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }
    
    // Peak Hours Chart (Bar)
    const hoursCtx = document.getElementById('peakHoursChart');
    if (hoursCtx) {
        charts.peakHours = new Chart(hoursCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Trips',
                    data: new Array(24).fill(0),
                    backgroundColor: '#7b1fa2',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Driver Status Chart (Pie)
    const driverStatusCtx = document.getElementById('driverStatusChart');
    if (driverStatusCtx) {
        charts.driverStatus = new Chart(driverStatusCtx, {
            type: 'pie',
            data: {
                labels: ['Active', 'Offline', 'Pending'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#28a745', '#6c757d', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Update charts with data
    updateCharts();
}

// ========================================
// UPDATE CHARTS
// ========================================
function updateCharts() {
    const chartData = dashboardData.chartData;
    
    if (!chartData) return;
    
    // Update Trips Over Time
    if (charts.tripsOverTime) {
        charts.tripsOverTime.data.labels = chartData.labels;
        charts.tripsOverTime.data.datasets[0].data = chartData.tripsByDay;
        charts.tripsOverTime.update();
    }
    
    // Update Trip Status
    if (charts.tripStatus) {
        const status = chartData.statusCounts;
        charts.tripStatus.data.datasets[0].data = [
            status.completed,
            status.ongoing,
            status.upcoming,
            status.cancelled
        ];
        charts.tripStatus.update();
    }
    
    // Update Monthly Revenue
    if (charts.monthlyRevenue) {
        charts.monthlyRevenue.data.labels = chartData.last6Months.map(d => 
            d.toLocaleDateString('en-US', { month: 'short' })
        );
        charts.monthlyRevenue.data.datasets[0].data = chartData.revenueByMonth;
        charts.monthlyRevenue.update();
    }
    
    // Update Top Drivers
    if (charts.topDrivers && chartData.topDrivers.length > 0) {
        charts.topDrivers.data.labels = chartData.topDrivers.map(d => d[0]);
        charts.topDrivers.data.datasets[0].data = chartData.topDrivers.map(d => d[1]);
        charts.topDrivers.update();
    }
    
    // Update Peak Hours
    if (charts.peakHours) {
        charts.peakHours.data.datasets[0].data = chartData.hourCounts;
        charts.peakHours.update();
    }
    
    // Update Driver Status
    if (charts.driverStatus) {
        const driverStatus = chartData.driverStatusCounts;
        charts.driverStatus.data.datasets[0].data = [
            driverStatus.active,
            driverStatus.offline,
            driverStatus.pending
        ];
        charts.driverStatus.update();
    }
}

// ========================================
// UPDATE UI
// ========================================
function updateDashboardStats() {
    updateStatCard('totalUsers', dashboardData.totalUsers);
    updateStatCard('activeDrivers', dashboardData.activeDrivers);
    updateStatCard('totalTrips', dashboardData.totalTrips);
    updateStatCard('totalRevenue', '₱' + dashboardData.totalRevenue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }));
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('updating');
        setTimeout(() => {
            element.textContent = value;
            element.classList.remove('updating');
        }, 150);
    }
}

function updateRecentActivity() {
    const tableBody = document.getElementById('recentActivityTable');
    
    if (!tableBody) return;
    
    if (dashboardData.recentTrips.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No recent activity</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = dashboardData.recentTrips.map(trip => `
        <tr>
            <td>${trip.time}</td>
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

// ========================================
// HELPER FUNCTIONS
// ========================================
function formatTripData(ride) {
    const tripId = ride._id?.$oid || ride._id || 'N/A';
    const shortId = typeof tripId === 'string' ? tripId.substring(0, 8) : 'N/A';
    
    const rideDate = ride.created_at ? 
        new Date(ride.created_at.$date || ride.created_at) : 
        new Date(ride.date);
    
    let passengerName = 'N/A';
    if (ride.passengers && ride.passengers.length > 0) {
        passengerName = ride.passengers[0];
    }
    
    return {
        id: `TRP${shortId}`,
        driver: ride.driver_username || ride.name || 'Unknown',
        passenger: passengerName,
        status: formatStatus(ride.ride_status),
        amount: formatPrice(ride.fare),
        time: rideDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
}

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

function formatPrice(fare) {
    if (!fare) return '₱0.00';
    if (typeof fare === 'string' && fare.includes('₱')) return fare;
    return '₱' + parseFloat(fare).toFixed(2);
}

function getBadgeClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'in progress' || statusLower === 'ongoing') return 'bg-primary';
    if (statusLower === 'cancelled') return 'bg-danger';
    if (statusLower === 'upcoming') return 'bg-warning';
    return 'bg-secondary';
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function getTodayHours() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        hours.push(i);
    }
    return hours;
}

function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function getLast12Months() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date);
    }
    return months;
}

function getLast6Months() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date);
    }
    return months;
}

function showLoadingState(show) {
    const statCards = document.querySelectorAll('.stat-card h3');
    statCards.forEach(card => {
        card.style.opacity = show ? '0.5' : '1';
    });
}

function showError(message) {
    const existing = document.querySelector('.dashboard-error');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'alert alert-warning position-fixed dashboard-error';
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `<strong>Notice:</strong> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
}

// ========================================
// EXPORT FOR DEBUGGING
// ========================================
window.dashboardAPI = {
    loadDashboardData,
    updateCharts,
    dashboardData: () => dashboardData,
    charts: () => charts
};

console.log('📊 Analytics Dashboard Configuration Loaded');