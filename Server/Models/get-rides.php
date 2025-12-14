<?php
// Use shared server bootstrap so .env and collection names are consistent
$config = require __DIR__ . '/../server.php';

header('Content-Type: application/json');

$ridesCollection = $config['rides'];

$rides = $ridesCollection->find()->toArray();
echo json_encode($rides);
?>
