<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';

function logBooking($message) {
    $logDir = __DIR__ . "/../Server/Server-Logs";
    $logFile = $logDir . "/booking-creation.log";
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    logBooking("Booking creation request: " . json_encode($input));
    
    // Validate required fields
    if (empty($input['passenger_username'])) {
        throw new Exception('Passenger username is required');
    }
    
    if (empty($input['ride_id'])) {
        throw new Exception('Ride ID is required');
    }
    
    if (empty($input['num_passengers']) || $input['num_passengers'] < 1) {
        throw new Exception('Number of passengers must be at least 1');
    }
    
    // ⚠️ VALIDATE PICKUP COORDINATES
    if (empty($input['pickup_coordinates']) || 
        !isset($input['pickup_coordinates']['lat']) || 
        !isset($input['pickup_coordinates']['lng'])) {
        throw new Exception('Valid pickup coordinates are required (lat/lng)');
    }
    
    $pickupLat = floatval($input['pickup_coordinates']['lat']);
    $pickupLng = floatval($input['pickup_coordinates']['lng']);
    
    if ($pickupLat === 0.0 || $pickupLng === 0.0) {
        throw new Exception('Invalid pickup coordinates (cannot be 0,0)');
    }
    
    logBooking("✅ Pickup coordinates validated: lat=$pickupLat, lng=$pickupLng");
    
    // Get database
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $rides = $db->rides;
    $bookings = $db->bookings;
    
    // Find ride
    $ride = $rides->findOne(['_id' => new MongoDB\BSON\ObjectId($input['ride_id'])]);
    
    if (!$ride) {
        throw new Exception('Ride not found');
    }
    
    logBooking("Ride found: " . $input['ride_id']);
    
    // Check ride status
    if ($ride['ride_status'] !== 'upcoming') {
        throw new Exception('Ride is not available for booking');
    }
    
    // Check available seats
    $numPassengers = intval($input['num_passengers']);
    if ($ride['available_seats'] < $numPassengers) {
        throw new Exception("Not enough seats. Only {$ride['available_seats']} seat(s) remaining.");
    }
    
    // Check for duplicate booking
    $existing = $bookings->findOne([
        'ride_id' => new MongoDB\BSON\ObjectId($input['ride_id']),
        'passenger_username' => $input['passenger_username'],
        'status' => ['$in' => ['pending', 'confirmed', 'completed']]
    ]);
    
    if ($existing) {
        throw new Exception('You have already booked this ride');
    }
    
    // ========================================
    // CREATE BOOKING WITH PICKUP COORDINATES
    // ========================================
    $bookingDoc = [
        'ride_id' => new MongoDB\BSON\ObjectId($input['ride_id']),
        'passenger_username' => $input['passenger_username'],
        'driver_username' => $ride['driver_username'] ?? 'Unknown',
        'plate_number' => $ride['plate_number'] ?? '',
        'fare' => $ride['fare'] ?? 0,
        'num_passengers' => $numPassengers,
        'date' => $ride['date'] ?? date('Y-m-d'),
        'status' => 'pending', // Pending until payment completes
        
        // ⭐ STORE PICKUP COORDINATES
        'pickup_point' => [
            'coordinates' => [
                'lat' => $pickupLat,
                'lng' => $pickupLng
            ],
            'address' => $input['pickup_address'] ?? 'Not specified'
        ],
        
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ];
    
    logBooking("Creating booking with pickup coordinates: lat=$pickupLat, lng=$pickupLng");
    
    // Insert booking
    $result = $bookings->insertOne($bookingDoc);
    
    if ($result->getInsertedCount() !== 1) {
        throw new Exception('Failed to create booking');
    }
    
    $bookingId = (string)$result->getInsertedId();
    logBooking("✅ Booking created: $bookingId");
    
    // ========================================
    // DECREMENT AVAILABLE SEATS
    // ========================================
    $updateResult = $rides->updateOne(
        [
            '_id' => new MongoDB\BSON\ObjectId($input['ride_id']),
            'available_seats' => ['$gte' => $numPassengers]
        ],
        ['$inc' => ['available_seats' => -$numPassengers]]
    );
    
    if ($updateResult->getModifiedCount() === 0) {
        // Rollback booking if seat update failed
        $bookings->deleteOne(['_id' => $result->getInsertedId()]);
        throw new Exception('Seats no longer available');
    }
    
    logBooking("✅ Decremented $numPassengers seat(s) from ride");
    
    // ========================================
    // ADD PASSENGER TO RIDE
    // ========================================
    $rides->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($input['ride_id'])],
        ['$addToSet' => ['passengers' => $input['passenger_username']]]
    );
    
    logBooking("✅ Added passenger to ride");
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => "Booking created successfully for $numPassengers passenger(s)",
        'booking_id' => $bookingId,
        'pickup_coordinates' => [
            'lat' => $pickupLat,
            'lng' => $pickupLng
        ]
    ]);
    
} catch (Exception $e) {
    logBooking("❌ Error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>