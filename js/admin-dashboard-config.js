// Dashboard JavaScript

// Import common functions
document.write('<script src="../js/common.js"><\/script>');

// Dashboard Data and Statistics
const dashboardData = {
    totalUsers: 0,
    activeDrivers: 37,
    totalTrips: 0,
    emergencies: 24,
    recentTrips: []
};

// Update Dashboard Stats
function updateDashboardStats() {
    document.getElementById('totalUsers').textContent = dashboardData.totalUsers;
    document.getElementById('activeDrivers').textContent = dashboardData.activeDrivers;
    document.getElementById('totalTrips').textContent = dashboardData.totalTrips;
    document.getElementById('emergencies').textContent = dashboardData.emergencies;
}

// Recent Trips Data
function loadRecentTrips() {
    const trips = [
        { id: 'TRP001', driver: 'John Doe', passenger: 'Jane Smith', status: 'Completed', amount: '₱250' },
        { id: 'TRP002', driver: 'Mike Johnson', passenger: 'Sarah Williams', status: 'In Progress', amount: '₱180' },
        { id: 'TRP003', driver: 'Robert Brown', passenger: 'Emily Davis', status: 'Completed', amount: '₱320' }
    ];
    
    const tableBody = document.getElementById('recentTripsTable');
    if (!tableBody) return;
    
    if (trips.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent trips</td></tr>';
        return;
    }
    
    tableBody.innerHTML = trips.map(trip => `
        <tr>
            <td>${trip.id}</td>
            <td>${trip.driver}</td>
            <td>${trip.passenger}</td>
            <td>
                <span class="badge ${trip.status === 'Completed' ? 'bg-success' : 'bg-primary'}">
                    ${trip.status}
                </span>
            </td>
            <td>${trip.amount}</td>
        </tr>
    `).join('');
}

// Real-time Updates Simulation
function simulateRealTimeUpdates() {
    setInterval(() => {
        dashboardData.activeDrivers = Math.floor(Math.random() * 10) + 30;
        document.getElementById('activeDrivers').textContent = dashboardData.activeDrivers;
    }, 10000);
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    loadRecentTrips();
    simulateRealTimeUpdates();
    console.log('Dashboard initialized');
});