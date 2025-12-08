<?php
require __DIR__ . '/../../Server/server.php'; 
header('Content-Type: application/json');

echo json_encode(['key' => $_ENV['GOOGLE_MAPS_API_KEY']]);
?>
