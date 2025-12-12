<?php
require_once "../Server/server.php";  // MongoDB connection

$data = json_decode(file_get_contents("php://input"), true);

$rideId = $data['ride_id'] ?? null;
$lat = $data['lat'] ?? null;
$lng = $data['lng'] ?? null;

if (!$rideId || !$lat || !$lng) {
    echo json_encode(["success" => false, "message" => "Invalid data"]);
    exit;
}

$collection = $client->CarpoolDB->Rides;

$update = $collection->updateOne(
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
