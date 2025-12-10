<?php
/**
 * Driver Rides Management Endpoint
 * Handles CRUD operations for driver rides/destinations
 * NOW WITH COMPLETE RIDE SUPPORT
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
            'plate_number' => $ride['plate_number'] ?? 'N/A',
            'pickup' => $ride['from'] ?? '',
            'destination' => $ride['to'] ?? '',
            'date' => $ride['date'] ?? '',
            'time' => $ride['time'] ?? '',
            'seats' => $ride['available_seats'] ?? 0,
            'price' => $ride['fare'] ?? 0,
            'notes' => $ride['notes'] ?? '',
            'status' => $ride['ride_status'] ?? 'upcoming',
            'passengers' => count($ride['passengers'] ?? []),
            'created_at' => isset($ride['created_at']) ? $ride['created_at']->toDateTime()->format('Y-m-d H:i:s') : null,
            'pickup_points' => $ride['pickup_points'] ?? []  // ADD THIS LINE
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
        $required = ['plate_number', 'pickup', 'destination', 'date', 'time', 'seats', 'price'];
        foreach ($required as $field) {
            if (empty($input[$field]) && $input[$field] !== 0) {
                sendResponse(false, "Field '{$field}' is required");
            }
        }
        
        // Validate plate number format (basic validation)
        $plateNumber = strtoupper(trim($input['plate_number']));
        if (strlen($plateNumber) < 3 || strlen($plateNumber) > 15) {
            sendResponse(false, 'Invalid plate number format');
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
            'plate_number' => $plateNumber,
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
    // PUT - Update existing ride OR Complete ride
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
        
        // CHECK IF THIS IS A COMPLETE REQUEST
        if (isset($input['status']) && $input['status'] === 'completed') {
            // Mark ride as completed
            $result = $ridesCollection->updateOne(
                ['_id' => $rideId],
                ['$set' => [
                    'ride_status' => 'completed',
                    'completed_at' => new MongoDB\BSON\UTCDateTime()
                ]]
            );

            if ($result->getModifiedCount() > 0 || $result->getMatchedCount() > 0) {
                // ALSO UPDATE ALL BOOKINGS FOR THIS RIDE TO COMPLETED STATUS
                $bookingsCollection = $db->bookings;
                $bookingsResult = $bookingsCollection->updateMany(
                    [
                        'ride_id' => $rideId,
                        'status' => ['$in' => ['pending', 'confirmed']]
                    ],
                    ['$set' => [
                        'status' => 'completed',
                        'completed_at' => new MongoDB\BSON\UTCDateTime()
                    ]]
                );

                sendResponse(true, 'Ride marked as completed', [
                    'modified' => $result->getModifiedCount(),
                    'bookings_updated' => $bookingsResult->getModifiedCount()
                ]);
            } else {
                sendResponse(false, 'Failed to complete ride');
            }
        }

        // CHECK IF THIS IS A DEPART REQUEST
        if (isset($input['status']) && $input['status'] === 'departed') {
            // Mark ride as departed - allow even with passengers
            $result = $ridesCollection->updateOne(
                ['_id' => $rideId],
                ['$set' => [
                    'ride_status' => 'departed',
                    'departed_at' => new MongoDB\BSON\UTCDateTime()
                ]]
            );

            if ($result->getModifiedCount() > 0 || $result->getMatchedCount() > 0) {
                // ALSO UPDATE ALL BOOKINGS FOR THIS RIDE TO ONGOING STATUS
                $bookingsCollection = $db->bookings;
                $bookingsResult = $bookingsCollection->updateMany(
                    [
                        'ride_id' => $rideId,
                        'status' => ['$in' => ['pending', 'confirmed']]
                    ],
                    ['$set' => [
                        'status' => 'ongoing',
                        'departed_at' => new MongoDB\BSON\UTCDateTime()
                    ]]
                );

                sendResponse(true, 'Ride marked as departed', [
                    'modified' => $result->getModifiedCount(),
                    'bookings_updated' => $bookingsResult->getModifiedCount()
                ]);
            } else {
                sendResponse(false, 'Failed to depart ride');
            }
        }

        // OTHERWISE, THIS IS A REGULAR UPDATE

        // Check if ride has passengers - only block actual edits, not status changes
        if (isset($ride['passengers']) && count($ride['passengers']) > 0) {
            sendResponse(false, 'Cannot edit ride with existing bookings. Please cancel the ride instead.');
        }
        
        // Check if ride is completed
        if (isset($ride['ride_status']) && $ride['ride_status'] === 'completed') {
            sendResponse(false, 'Cannot edit completed rides');
        }
        
        // Prepare update data
        $updateData = [];
        
        if (isset($input['plate_number'])) {
            $plateNumber = strtoupper(trim($input['plate_number']));
            if (strlen($plateNumber) < 3 || strlen($plateNumber) > 15) {
                sendResponse(false, 'Invalid plate number format');
            }
            $updateData['plate_number'] = $plateNumber;
        }
        
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
                    'cancelled_at' => new MongoDB\BSON\UTCDateTime(),
                    'cancelled_by' => 'driver'
                ]]
            );
            
            if ($result->getModifiedCount() > 0) {
                // ALSO CANCEL ALL BOOKINGS FOR THIS RIDE
                $bookingsCollection = $db->bookings;
                $bookingsResult = $bookingsCollection->updateMany(
                    [
                        'ride_id' => $rideObjectId,
                        'status' => ['$in' => ['pending', 'confirmed', 'ongoing']]
                    ],
                    ['$set' => [
                        'status' => 'cancelled',
                        'cancelled_at' => new MongoDB\BSON\UTCDateTime(),
                        'cancelled_by' => 'driver',
                        'cancel_reason' => 'Ride cancelled by driver'
                    ]]
                );
                
                sendResponse(true, 'Ride cancelled successfully (had bookings)', [
                    'action' => 'cancelled',
                    'bookings_cancelled' => $bookingsResult->getModifiedCount()
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