<?php
// Simple DB check script — prints document counts for main collections
$config = require __DIR__ . '/../Server/server.php';
$db = $config['db'];

$collections = [
    'users' => ($config['users'] ?? $db->selectCollection('users')),
    'rides' => ($config['rides'] ?? $db->selectCollection('rides')),
    'bookings' => ($config['bookings'] ?? $db->selectCollection('bookings')),
    'reviews' => ($config['reviews'] ?? $db->selectCollection('reviews')),
    // payments may not be returned by server.php, select directly
    'payments' => $db->selectCollection('payments')
];

header('Content-Type: application/json');
$result = [];

try {
    foreach ($collections as $name => $col) {
        $count = 0;
        try {
            $count = $col->countDocuments();
        } catch (Exception $e) {
            $count = null;
        }
        $result[$name] = $count;
    }
    echo json_encode(['success' => true, 'counts' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>