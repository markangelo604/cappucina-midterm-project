<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';

function logPickupUpdate($message) {
    $logDir = __DIR__ . "/../Server/Server-Logs";
    $logFile = $logDir . "/pickup-updates.log";
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    logPickupUpdate("Pickup point update request: " . json_encode($input));
    
    // Validate required fields
    if (empty($input['ride_id'])) {
        throw new Exception('Ride ID is required');
    }
    
    if (empty($input['passenger_username'])) {
        throw new Exception('Passenger username is required');
    }
    
    if (empty($input['pickup_coordinates']) || 
        !isset($input['pickup_coordinates']['lat']) || 
        !isset($input['pickup_coordinates']['lng'])) {
        throw new Exception('Valid pickup coordinates are required');
    }
    
    $pickupLat = floatval($input['pickup_coordinates']['lat']);
    $pickupLng = floatval($input['pickup_coordinates']['lng']);
    
    if ($pickupLat === 0.0 || $pickupLng === 0.0) {
        throw new Exception('Invalid pickup coordinates');
    }
    
    // Get database
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $rides = $db->rides;
    
    // Find ride
    $ride = $rides->findOne(['_id' => new MongoDB\BSON\ObjectId($input['ride_id'])]);
    
    if (!$ride) {
        throw new Exception('Ride not found');
    }
    
    logPickupUpdate("Ride found: " . $input['ride_id']);
    
    // ========================================
    // ADD PICKUP POINT TO ARRAY
    // ========================================
    $pickupPointData = [
        'passenger_username' => $input['passenger_username'],
        'coordinates' => [
            'lat' => $pickupLat,
            'lng' => $pickupLng
        ],
        'address' => $input['pickup_coordinates']['address'] ?? 'Not specified',
        'added_at' => new MongoDB\BSON\UTCDateTime()
    ];
    
    logPickupUpdate("Adding pickup point: " . json_encode($pickupPointData));
    
    // Use $addToSet to prevent duplicates
    $result = $rides->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($input['ride_id'])],
        ['$addToSet' => ['pickup_points' => $pickupPointData]]
    );
    
    if ($result->getModifiedCount() > 0) {
        logPickupUpdate("✅ Pickup point added to ride for passenger: {$input['passenger_username']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Pickup point added to ride successfully',
            'pickup_coordinates' => [
                'lat' => $pickupLat,
                'lng' => $pickupLng
            ]
        ]);
    } else if ($result->getMatchedCount() > 0) {
        // Matched but not modified - pickup point may already exist
        logPickupUpdate("⚠️ Pickup point may already exist for this passenger");
        
        echo json_encode([
            'success' => true,
            'message' => 'Pickup point already exists or ride updated',
            'pickup_coordinates' => [
                'lat' => $pickupLat,
                'lng' => $pickupLng
            ]
        ]);
    } else {
        throw new Exception('Failed to update ride with pickup point');
    }
    
} catch (Exception $e) {
    logPickupUpdate("❌ Error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>