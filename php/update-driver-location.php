<?php
// Use shared server bootstrap to honor .env and collection names
$config = require __DIR__ . '/../Server/server.php';

$data = json_decode(file_get_contents("php://input"), true);

$rideId = $data['ride_id'] ?? null;
$lat = $data['lat'] ?? null;
$lng = $data['lng'] ?? null;

if (!$rideId || !$lat || !$lng) {
    echo json_encode(["success" => false, "message" => "Invalid data"]);
    exit;
}

$ridesCollection = $config['rides'];

$update = $ridesCollection->updateOne(
    [ "_id" => new MongoDB\BSON\ObjectId($rideId) ],
    [
        '$set' => [
            "current_location" => [
                "coordinates" => ["lat" => (float)$lat, "lng" => (float)$lng],
                "last_updated" => new MongoDB\BSON\UTCDateTime()
            ]
        ]
    ]
);

echo json_encode(["success" => true]);
?>
