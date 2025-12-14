<?php
// Create recommended indexes for performance
require_once __DIR__ . '/../Server/server.php';

$config = require __DIR__ . '/../Server/server.php';
$db = $config['db'];

try {
    $db->rides->createIndex(['driver_username' => 1, 'date' => 1, 'time' => 1]);
    $db->bookings->createIndex(['ride_id' => 1, 'status' => 1]);
    $db->payments->createIndex(['booking_id' => 1]);

    echo json_encode(['success' => true, 'message' => 'Indexes created']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
