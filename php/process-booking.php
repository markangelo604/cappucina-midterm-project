<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in.'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.'
    ]);
    exit;
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate required fields
    $required = ['ride_id', 'driver_username', 'num_passengers', 'fare'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    $bookingsCollection = $db->bookings;
    $ridesCollection = $db->rides;
    
    // Check if ride exists and has available seats
    $ride = $ridesCollection->findOne(['_id' => new ObjectId($data['ride_id'])]);
    
    if (!$ride) {
        throw new Exception('Ride not found');
    }
    
    if ($ride['available_seats'] < intval($data['num_passengers'])) {
        throw new Exception('Not enough available seats');
    }
    
    // Create booking
    $booking = [
        'ride_id' => new ObjectId($data['ride_id']),
        'passenger_username' => $_SESSION['username'],
        'driver_username' => $data['driver_username'],
        'plate_number' => $ride['plate_number'] ?? 'N/A',
        'fare' => floatval($data['fare']),
        'num_passengers' => intval($data['num_passengers']),
        'pickup_point' => $data['pickup_point'] ?? '',
        'special_requests' => $data['special_requests'] ?? '',
        'date' => $ride['date'],
        'status' => 'pending',
        'created_at' => new UTCDateTime(),
        'updated_at' => new UTCDateTime()
    ];
    
    $result = $bookingsCollection->insertOne($booking);
    
    if ($result->getInsertedCount() > 0) {
        // Update ride available seats
        $newSeats = $ride['available_seats'] - intval($data['num_passengers']);
        $ridesCollection->updateOne(
            ['_id' => new ObjectId($data['ride_id'])],
            ['$set' => ['available_seats' => $newSeats]]
        );
        
        // Add passenger to ride's passengers array
        $ridesCollection->updateOne(
            ['_id' => new ObjectId($data['ride_id'])],
            ['$push' => ['passengers' => [
                'username' => $_SESSION['username'],
                'status' => 'confirmed',
                'rating_given' => null
            ]]]
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking_id' => (string)$result->getInsertedId()
        ]);
    } else {
        throw new Exception('Failed to create booking');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>