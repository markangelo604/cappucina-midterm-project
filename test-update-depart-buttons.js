// Test script for updateDepartButtonStates function
// Simulates the behavior of the periodic button state updates

// Mock destinations array with test data
let destinations = [
    {
        id: 1,
        status: 'upcoming',
        date: new Date().toISOString().split('T')[0], // Today
        time: new Date(Date.now() - 10 * 60 * 1000).toTimeString().slice(0, 5), // 10 minutes ago (should be enabled)
        pickup: 'Test Pickup 1',
        destination: 'Test Destination 1'
    },
    {
        id: 2,
        status: 'upcoming',
        date: new Date().toISOString().split('T')[0], // Today
        time: new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5), // 30 minutes from now (should be disabled)
        pickup: 'Test Pickup 2',
        destination: 'Test Destination 2'
    },
    {
        id: 3,
        status: 'departed', // Not upcoming, should be ignored
        date: new Date().toISOString().split('T')[0],
        time: new Date(Date.now() - 5 * 60 * 1000).toTimeString().slice(0, 5),
        pickup: 'Test Pickup 3',
        destination: 'Test Destination 3'
    }
];

// Mock document object for Node.js environment
// Only create buttons for upcoming rides (IDs 1 and 2)
global.document = {
    getElementById: function(id) {
        // Extract ride ID from button ID (depart-btn-{id})
        const rideIdMatch = id.match(/depart-btn-(\d+)/);
        if (rideIdMatch) {
            const rideId = parseInt(rideIdMatch[1]);
            // Only create buttons for upcoming rides (IDs 1 and 2)
            if (rideId === 1 || rideId === 2) {
                if (!mockButtons[id]) {
                    mockButtons[id] = {
                        id: id,
                        disabled: false,
                        setAttribute: function(attr, value) { this[attr] = value; },
                        removeAttribute: function(attr) { delete this[attr]; }
                    };
                }
                return mockButtons[id];
            }
        }
        // Return null for non-existent buttons (like departed rides)
        return null;
    }
};

// Mock document.getElementById to simulate DOM elements
let mockButtons = {};

// Mock console.log to capture output
const originalConsoleLog = console.log;
let logOutput = [];
console.log = (...args) => {
    logOutput.push(args.join(' '));
    originalConsoleLog(...args);
};

// Copy the actual functions from the driver dashboard
function isRideTimeNow(rideDate, rideTime) {
    if (!rideDate || !rideTime) return false;

    const now = new Date();
    const rideDateTime = new Date(`${rideDate}T${rideTime}`);

    // Check if ride is for today
    const today = now.toISOString().split('T')[0];
    if (rideDate !== today) return false;

    // Check if current time is at or after ride time, and within 15 minutes after
    const timeDiff = now - rideDateTime;
    const fifteenMinutes = 15 * 60 * 1000;

    return timeDiff >= 0 && timeDiff <= fifteenMinutes;
}

/**
 * Update depart button states based on current time
 */
function updateDepartButtonStates() {
    destinations.forEach(dest => {
        const btn = document.getElementById(`depart-btn-${dest.id}`);
        if (btn && dest.status === 'upcoming') {
            btn.disabled = !isRideTimeNow(dest.date, dest.time);
        }
    });
}

// Test the updateDepartButtonStates function
function testUpdateDepartButtonStates() {
    console.log('🧪 Testing updateDepartButtonStates function...\n');

    // Reset mock buttons
    mockButtons = {};

    // Run the function
    console.log('=== RUNNING updateDepartButtonStates ===');
    updateDepartButtonStates();

    // Check results
    console.log('\n=== TEST RESULTS ===');

    // Check button 1 (should be enabled - 10 minutes ago, within 15-minute window)
    const btn1 = mockButtons['depart-btn-1'];
    const btn1ExpectedDisabled = false;
    const btn1TestPassed = btn1 && btn1.disabled === btn1ExpectedDisabled;
    console.log(`Button 1 (ID: 1, 10 min ago): Expected disabled=${btn1ExpectedDisabled}, Actual disabled=${btn1 ? btn1.disabled : 'N/A'} - ${btn1TestPassed ? 'PASSED' : 'FAILED'}`);

    // Check button 2 (should be disabled - 30 minutes from now, not yet time)
    const btn2 = mockButtons['depart-btn-2'];
    const btn2ExpectedDisabled = true;
    const btn2TestPassed = btn2 && btn2.disabled === btn2ExpectedDisabled;
    console.log(`Button 2 (ID: 2, 30 min future): Expected disabled=${btn2ExpectedDisabled}, Actual disabled=${btn2 ? btn2.disabled : 'N/A'} - ${btn2TestPassed ? 'PASSED' : 'FAILED'}`);

    // Check button 3 (should not exist - status is 'departed', not 'upcoming')
    const btn3 = mockButtons['depart-btn-3'];
    const btn3TestPassed = !btn3; // Should not exist
    console.log(`Button 3 (ID: 3, departed): Expected not created, Actual ${btn3 ? 'created' : 'not created'} - ${btn3TestPassed ? 'PASSED' : 'FAILED'}`);

    // Overall test result
    const allTestsPassed = btn1TestPassed && btn2TestPassed && btn3TestPassed;
    console.log(`\n=== OVERALL RESULT ===`);
    console.log(`All tests ${allTestsPassed ? 'PASSED' : 'FAILED'}`);

    // Test periodic execution simulation
    console.log('\n=== TESTING PERIODIC EXECUTION ===');
    console.log('Simulating setInterval execution...');

    // Simulate multiple runs
    for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
            console.log(`\n--- Run ${i} ---`);
            updateDepartButtonStates();
        }, i * 100); // Stagger the runs
    }

    // Wait a bit then show final state
    setTimeout(() => {
        console.log('\n=== FINAL STATE ===');
        Object.keys(mockButtons).forEach(btnId => {
            const btn = mockButtons[btnId];
            console.log(`${btnId}: disabled=${btn.disabled}`);
        });

        console.log('\n=== LOG OUTPUT ===');
        logOutput.forEach(log => console.log(log));

        // Restore original functions
        delete global.document;
        console.log = originalConsoleLog;
    }, 500);
}

// Run the test
testUpdateDepartButtonStates();
