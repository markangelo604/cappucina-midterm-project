<?php
header('Content-Type: application/json');

try {
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];

    $collections = ['rides', 'bookings', 'payments'];
    $results = [];

    foreach ($collections as $c) {
        try {
            $db->dropCollection($c);
            $results[$c] = 'dropped';
        } catch (Exception $e) {
            $results[$c] = 'error: ' . $e->getMessage();
        }
    }

    echo json_encode(['success' => true, 'results' => $results]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
