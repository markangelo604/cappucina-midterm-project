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
                'username' => 1,
                'email' => 1,
                'account_status' => 1,
                'created_at' => 1,
                // Flatten commonly used profile fields
                'profile' => 1,
                'phone' => 1,
                'vehicle' => 1
            ]
        ]);

        if ($user) {
            echo json_encode([
                "success" => true,
                "data" => [
                    "username" => $user['username'] ?? $username,
                    "email" => $user['email'] ?? null,
                    "account_status" => $user['account_status'] ?? 'active',
                    "created_at" => $user['created_at'] ?? null,
                    // Prefer top-level phone, fallback to profile.phone
                    "phone" => $user['phone'] ?? ($user['profile']['phone'] ?? null),
                    // Provide address and gender from profile
                    "profile" => [
                        "name" => $user['profile']['name'] ?? null,
                        "phone" => $user['profile']['phone'] ?? null,
                        "address" => $user['profile']['address'] ?? null,
                        "gender" => $user['profile']['gender'] ?? null
                    ],
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
