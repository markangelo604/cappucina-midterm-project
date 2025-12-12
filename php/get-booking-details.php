<?php
/**
 * Get Booking Details Endpoint
 * Fetches detailed booking information including pickup coordinates
 * 
 * INSTALLATION: Save as php/get-booking-details.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/server.php';

try {
    // Get booking ID from query parameter
    $bookingId = $_GET['booking_id'] ?? null;
    
    if (!$bookingId) {
        echo json_encode([
            'success' => false,
            'message' => 'Booking ID is required'
        ]);
        exit;
    }
    
    // Get database connection
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $bookingsCollection = $db->bookings;
    $ridesCollection = $db->rides;
    $usersCollection = $db->users;
    
    // Try to find booking with different ID formats
    $booking = null;
    
    // Try as MongoDB ObjectId (most common - 24 character hex)
    if (strlen($bookingId) === 24 && ctype_xdigit($bookingId)) {
        try {
            $booking = $bookingsCollection->findOne(['_id' => new MongoDB\BSON\ObjectId($bookingId)]);
        } catch (Exception $e) {
            // Not a valid ObjectId
        }
    }
    
    // Try as string if ObjectId failed
    if (!$booking) {
        $booking = $bookingsCollection->findOne(['_id' => $bookingId]);
    }
    
    // Try removing # prefix if present
    if (!$booking && strpos($bookingId, '#') === 0) {
        $cleanId = substr($bookingId, 1);
        if (strlen($cleanId) === 24 && ctype_xdigit($cleanId)) {
            try {
                $booking = $bookingsCollection->findOne(['_id' => new MongoDB\BSON\ObjectId($cleanId)]);
            } catch (Exception $e) {
                // Not a valid ObjectId
            }
        }
    }
    
    if (!$booking) {
        echo json_encode([
            'success' => false,
            'message' => 'Booking not found',
            'booking_id' => $bookingId
        ]);
        exit;
    }
    
    // Get ride details
    $ride = $ridesCollection->findOne(['_id' => $booking['ride_id']]);
    
    // Get driver details
    $driver = $usersCollection->findOne(['username' => $booking['driver_username']]);
    
    // Format booking details
    $bookingDetails = [
        'booking_id' => (string)$booking['_id'],
        'ride_id' => (string)$booking['ride_id'],
        'status' => $booking['status'] ?? 'pending',
        'passenger_username' => $booking['passenger_username'] ?? '',
        'driver_username' => $booking['driver_username'] ?? '',
        'fare' => $booking['fare'] ?? 0,
        'num_passengers' => $booking['num_passengers'] ?? 1,
        'date' => $booking['date'] ?? 'N/A',
        'created_at' => isset($booking['created_at']) ? 
            $booking['created_at']->toDateTime()->format('Y-m-d H:i:s') : null,
        
        // Pickup point with coordinates
        'pickup_point' => null,
        
        // Ride information
        'ride' => null,
        
        // Driver information
        'driver' => null
    ];
    
    // Add pickup point if exists
    if (isset($booking['pickup_point'])) {
        $bookingDetails['pickup_point'] = [
            'coordinates' => [
                'lat' => floatval($booking['pickup_point']['coordinates']['lat'] ?? 0),
                'lng' => floatval($booking['pickup_point']['coordinates']['lng'] ?? 0)
            ],
            'address' => $booking['pickup_point']['address'] ?? 'Not specified'
        ];
    }
    
    // Add ride information
    if ($ride) {
        $bookingDetails['ride'] = [
            'from' => $ride['from'] ?? 'N/A',
            'to' => $ride['to'] ?? 'N/A',
            'date' => $ride['date'] ?? 'N/A',
            'time' => $ride['time'] ?? 'N/A',
            'ride_status' => $ride['ride_status'] ?? 'upcoming',
            'plate_number' => $ride['plate_number'] ?? 'N/A',
            'route' => $ride['route'] ?? []
        ];
    }
    
    // Add driver information
    if ($driver) {
        $bookingDetails['driver'] = [
            'name' => $driver['profile']['name'] ?? $booking['driver_username'],
            'phone' => $driver['profile']['phone'] ?? 'N/A',
            'email' => $driver['email'] ?? 'N/A',
            'rating' => 4.5 // You can calculate actual rating
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking details fetched successfully',
        'booking' => $bookingDetails
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>