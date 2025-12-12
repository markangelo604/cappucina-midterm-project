<?php
require_once "../Server/server.php";

$rideId = $_GET['ride_id'] ?? null;

if (!$rideId) {
    echo json_encode(["success" => false]);
    exit;
}

$collection = $client->CarpoolDB->Rides;

$ride = $collection->findOne([
    "_id" => new MongoDB\BSON\ObjectId($rideId)
]);

if (!$ride || !isset($ride->current_location)) {
    echo json_encode(["success" => true, "lat" => null, "lng" => null]);
    exit;
}

echo json_encode([
    "success" => true,
    "lat" => $ride->current_location->coordinates->lat,
    "lng" => $ride->current_location->coordinates->lng
]);
