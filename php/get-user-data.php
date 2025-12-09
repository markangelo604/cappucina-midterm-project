<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../Server/server.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['username'])) {
    $username = $_GET['username'];

    try {
        global $db;
        $users = $db->users;

        // Find user by username
        $user = $users->findOne(['username' => $username], [
            'projection' => [
                'vehicle' => 1
            ]
        ]);

        if ($user) {
            echo json_encode([
                "success" => true,
                "data" => [
                    "vehicle" => $user['vehicle'] ?? []
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "User not found"
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Server error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request"
    ]);
}
?>
