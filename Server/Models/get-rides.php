<?php
require_once __DIR__ . '/../../vendor/autoload.php';  // if using composer
$client = new MongoDB\Client("mongodb://localhost:27017");
$db = $client->CarPool;
$collection = $db->driver;

header('Content-Type: application/json');
$rides = $collection->find()->toArray();
echo json_encode($rides);
?>
