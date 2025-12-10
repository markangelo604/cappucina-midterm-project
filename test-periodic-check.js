// Test script for periodic overdue ride checking
// Simulates the behavior of setInterval(checkAndCancelOverdueRides, 60000)

// Mock destinations array with test data
let destinations = [
    {
        id: 1,
        status: 'upcoming',
        date: new Date().toISOString().split('T')[0], // Today
        time: new Date(Date.now() - 20 * 60 * 1000).toTimeString().slice(0, 5), // 20 minutes ago
        pickup: 'Test Pickup',
        destination: 'Test Destination'
    },
    {
        id: 2,
        status: 'upcoming',
        date: new Date().toISOString().split('T')[0], // Today
        time: new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5), // 30 minutes from now
        pickup: 'Future Pickup',
        destination: 'Future Destination'
    }
];

// Mock console.log to capture output
const originalConsoleLog = console.log;
let logOutput = [];
console.log = (...args) => {
    logOutput.push(args.join(' '));
    originalConsoleLog(...args);
};

// Mock cancelRide function
let cancelledRides = [];
async function cancelRide(rideId) {
    console.log(`❌ Cancelling overdue ride: ${rideId}`);
    cancelledRides.push(rideId);
    return true;
}

// Mock loadDestinations function
async function loadDestinations() {
    console.log('📥 Reloading destinations...');
    return true;
}

// Copy the actual functions from the driver dashboard
function isRideOverdue(rideDate, rideTime) {
    if (!rideDate || !rideTime) return false;

    const now = new Date();
    const rideDateTime = new Date(`${rideDate}T${rideTime}`);

    // Check if ride is for today
    const today = now.toISOString().split('T')[0];
    if (rideDate !== today) return false;

    // Check if more than 15 minutes have passed
    const timeDiff = now - rideDateTime;
    const fifteenMinutes = 15 * 60 * 1000;

    return timeDiff > fifteenMinutes;
}

async function checkAndCancelOverdueRides() {
    console.log('🔍 Checking for overdue rides...');

    const overdueRides = destinations.filter(dest =>
        dest.status === 'upcoming' && isRideOverdue(dest.date, dest.time)
    );

    if (overdueRides.length === 0) {
        console.log('✅ No overdue rides found');
        return;
    }

    console.log(`🚨 Found ${overdueRides.length} overdue ride(s), cancelling...`);

    for (const ride of overdueRides) {
        console.log(`❌ Cancelling overdue ride: ${ride.id}`);
        await cancelRide(ride.id);
    }

    // Reload destinations to update UI
    await loadDestinations();
}

// Test the periodic check
async function testPeriodicCheck() {
    console.log('🧪 Testing periodic overdue ride checking...\n');

    // Initial check
    console.log('=== INITIAL CHECK ===');
    await checkAndCancelOverdueRides();

    // Simulate time passing (add 5 minutes to the first ride to make it even more overdue)
    destinations[0].time = new Date(Date.now() - 25 * 60 * 1000).toTimeString().slice(0, 5);

    console.log('\n=== SECOND CHECK (after simulated time) ===');
    await checkAndCancelOverdueRides();

    // Check results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Cancelled rides: ${cancelledRides.length}`);
    console.log(`Expected cancelled rides: 1`);
    console.log(`Test ${cancelledRides.length === 1 ? 'PASSED' : 'FAILED'}: Correct number of rides cancelled`);

    // Check that the right ride was cancelled
    const correctRideCancelled = cancelledRides.includes(1);
    console.log(`Test ${correctRideCancelled ? 'PASSED' : 'FAILED'}: Correct ride (ID: 1) was cancelled`);

    // Check that future ride was not cancelled
    const futureRideNotCancelled = !cancelledRides.includes(2);
    console.log(`Test ${futureRideNotCancelled ? 'PASSED' : 'FAILED'}: Future ride (ID: 2) was not cancelled`);

    console.log('\n=== LOG OUTPUT ===');
    logOutput.forEach(log => console.log(log));
}

// Run the test
testPeriodicCheck().catch(console.error);
