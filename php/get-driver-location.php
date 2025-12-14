<?php
// Use shared server bootstrap to get DB/collections from .env
$config = require __DIR__ . '/../Server/server.php';

$rideId = $_GET['ride_id'] ?? null;

if (!$rideId) {
    echo json_encode(["success" => false]);
    exit;
}

$ridesCollection = $config['rides'];

$ride = $ridesCollection->findOne([
    "_id" => new MongoDB\BSON\ObjectId($rideId)
]);

if (!$ride || !isset($ride['current_location'])) {
    echo json_encode(["success" => true, "lat" => null, "lng" => null]);
    exit;
}

// Access as array keys for BSONDocument compatibility
$coords = $ride['current_location']['coordinates'];

echo json_encode([
    "success" => true,
    "lat" => $coords['lat'] ?? null,
    "lng" => $coords['lng'] ?? null
]);
