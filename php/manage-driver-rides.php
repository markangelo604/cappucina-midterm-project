<?php
/**
 * Driver Rides Management Endpoint
 * Handles CRUD operations for driver rides/destinations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../Server/server.php';

session_start();

// Helper function to send JSON response
function sendResponse($success, $message, $data = []) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => time()
    ]);
    exit;
}

// Helper function to get logged-in driver username
function getDriverUsername() {
    // Try to get from session
    if (isset($_SESSION['username'])) {
        return $_SESSION['username'];
    }
    
    // Try to get from POST data
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['driver_username'])) {
        return $input['driver_username'];
    }
    
    // Try to get from GET parameter
    if (isset($_GET['driver_username'])) {
        return $_GET['driver_username'];
    }
    
    return null;
}

try {
    // Get database connection
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $ridesCollection = $db->rides;
    $usersCollection = $db->users;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $driverUsername = getDriverUsername();
    
    // Verify driver exists
    if ($driverUsername) {
        $driver = $usersCollection->findOne(['username' => $driverUsername]);
        if (!$driver) {
            sendResponse(false, 'Driver not found');
        }
        
        // Get driver's vehicle info
        $plateNumber = null;
        if (isset($driver['vehicle']) && is_array($driver['vehicle']) && count($driver['vehicle']) > 0) {
            $plateNumber = $driver['vehicle'][0]['plate_number'] ?? null;
        }
    }
    
    // ==========================================
    // GET - Fetch driver's rides
    // ==========================================
    if ($method === 'GET') {
        if (!$driverUsername) {
            sendResponse(false, 'Driver username required');
        }
        
        // Fetch all rides for this driver
        $rides = $ridesCollection->find([
            'driver_username' => $driverUsername
        ])->toArray();
        
        $formattedRides = [];
        foreach ($rides as $ride) {
            $formattedRides[] = [
                '_id' => (string)$ride['_id'],
                'id' => (string)$ride['_id'],
                'pickup' => $ride['from'] ?? '',
                'destination' => $ride['to'] ?? '',
                'date' => $ride['date'] ?? '',
                'time' => $ride['time'] ?? '',
                'seats' => $ride['available_seats'] ?? 0,
                'price' => $ride['fare'] ?? 0,
                'notes' => $ride['notes'] ?? '',
                'status' => $ride['ride_status'] ?? 'upcoming',
                'passengers' => count($ride['passengers'] ?? []),
                'created_at' => isset($ride['created_at']) ? $ride['created_at']->toDateTime()->format('Y-m-d H:i:s') : null
            ];
        }
        
        sendResponse(true, 'Rides fetched successfully', [
            'rides' => $formattedRides,
            'count' => count($formattedRides)
        ]);
    }
    
    // ==========================================
    // POST - Create new ride
    // ==========================================
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$driverUsername) {
            sendResponse(false, 'Driver username required');
        }
        
        // Validate required fields
        $required = ['pickup', 'destination', 'date', 'time', 'seats', 'price'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                sendResponse(false, "Field '{$field}' is required");
            }
        }
        
        // Validate date is not in the past
        $rideDate = new DateTime($input['date'] . ' ' . $input['time']);
        $now = new DateTime();
        if ($rideDate < $now) {
            sendResponse(false, 'Cannot create ride in the past');
        }
        
        // Validate seats
        if ($input['seats'] < 1 || $input['seats'] > 8) {
            sendResponse(false, 'Seats must be between 1 and 8');
        }
        
        // Validate price
        if ($input['price'] < 0) {
            sendResponse(false, 'Price cannot be negative');
        }
        
        // Create ride document
        $newRide = [
            'driver_username' => $driverUsername,
            'plate_number' => $plateNumber ?? 'N/A',
            'from' => $input['pickup'],
            'to' => $input['destination'],
            'date' => $input['date'],
            'time' => $input['time'],
            'fare' => floatval($input['price']),
            'available_seats' => intval($input['seats']),
            'ride_status' => 'upcoming',
            'route' => [
                'stops' => [$input['pickup'], $input['destination']],
                'distance_km' => 0,
                'estimated_duration_mins' => 0
            ],
            'passengers' => [],
            'notes' => $input['notes'] ?? '',
            'created_at' => new MongoDB\BSON\UTCDateTime()
        ];
        
        $result = $ridesCollection->insertOne($newRide);
        
        if ($result->getInsertedCount() === 1) {
            $newRide['_id'] = (string)$result->getInsertedId();
            $newRide['id'] = (string)$result->getInsertedId();
            
            sendResponse(true, 'Ride created successfully', [
                'ride' => $newRide
            ]);
        } else {
            sendResponse(false, 'Failed to create ride');
        }
    }
    
    // ==========================================
    // PUT - Update existing ride
    // ==========================================
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$driverUsername) {
            sendResponse(false, 'Driver username required');
        }
        
        if (empty($input['ride_id'])) {
            sendResponse(false, 'Ride ID required');
        }
        
        try {
            $rideId = new MongoDB\BSON\ObjectId($input['ride_id']);
        } catch (Exception $e) {
            sendResponse(false, 'Invalid ride ID format');
        }
        
        // Verify ride belongs to this driver
        $ride = $ridesCollection->findOne([
            '_id' => $rideId,
            'driver_username' => $driverUsername
        ]);
        
        if (!$ride) {
            sendResponse(false, 'Ride not found or you do not have permission to edit it');
        }
        
        // Check if ride has passengers
        if (isset($ride['passengers']) && count($ride['passengers']) > 0) {
            sendResponse(false, 'Cannot edit ride with existing bookings. Please cancel the ride instead.');
        }
        
        // Prepare update data
        $updateData = [];
        
        if (isset($input['pickup'])) {
            $updateData['from'] = $input['pickup'];
            $updateData['route.stops.0'] = $input['pickup'];
        }
        if (isset($input['destination'])) {
            $updateData['to'] = $input['destination'];
            $updateData['route.stops.1'] = $input['destination'];
        }
        if (isset($input['date'])) {
            $updateData['date'] = $input['date'];
        }
        if (isset($input['time'])) {
            $updateData['time'] = $input['time'];
        }
        if (isset($input['seats'])) {
            $updateData['available_seats'] = intval($input['seats']);
        }
        if (isset($input['price'])) {
            $updateData['fare'] = floatval($input['price']);
        }
        if (isset($input['notes'])) {
            $updateData['notes'] = $input['notes'];
        }
        
        $updateData['updated_at'] = new MongoDB\BSON\UTCDateTime();
        
        // Update ride
        $result = $ridesCollection->updateOne(
            ['_id' => $rideId],
            ['$set' => $updateData]
        );
        
        if ($result->getModifiedCount() > 0 || $result->getMatchedCount() > 0) {
            sendResponse(true, 'Ride updated successfully', [
                'modified' => $result->getModifiedCount()
            ]);
        } else {
            sendResponse(false, 'No changes made to ride');
        }
    }
    
    // ==========================================
    // DELETE - Delete/Cancel ride
    // ==========================================
    if ($method === 'DELETE') {
        if (!$driverUsername) {
            sendResponse(false, 'Driver username required');
        }
        
        // Get ride ID from query parameter
        $rideId = $_GET['ride_id'] ?? null;
        
        if (empty($rideId)) {
            sendResponse(false, 'Ride ID required');
        }
        
        try {
            $rideObjectId = new MongoDB\BSON\ObjectId($rideId);
        } catch (Exception $e) {
            sendResponse(false, 'Invalid ride ID format');
        }
        
        // Verify ride belongs to this driver
        $ride = $ridesCollection->findOne([
            '_id' => $rideObjectId,
            'driver_username' => $driverUsername
        ]);
        
        if (!$ride) {
            sendResponse(false, 'Ride not found or you do not have permission to delete it');
        }
        
        // Check if ride has passengers
        if (isset($ride['passengers']) && count($ride['passengers']) > 0) {
            // Don't delete, just mark as cancelled
            $result = $ridesCollection->updateOne(
                ['_id' => $rideObjectId],
                ['$set' => [
                    'ride_status' => 'cancelled',
                    'cancelled_at' => new MongoDB\BSON\UTCDateTime()
                ]]
            );
            
            if ($result->getModifiedCount() > 0) {
                sendResponse(true, 'Ride cancelled successfully (had bookings)', [
                    'action' => 'cancelled'
                ]);
            } else {
                sendResponse(false, 'Failed to cancel ride');
            }
        } else {
            // No passengers, safe to delete
            $result = $ridesCollection->deleteOne(['_id' => $rideObjectId]);
            
            if ($result->getDeletedCount() > 0) {
                sendResponse(true, 'Ride deleted successfully', [
                    'action' => 'deleted'
                ]);
            } else {
                sendResponse(false, 'Failed to delete ride');
            }
        }
    }
    
} catch (Exception $e) {
    error_log('Driver rides error: ' . $e->getMessage());
    sendResponse(false, 'Server error: ' . $e->getMessage());
}
?>