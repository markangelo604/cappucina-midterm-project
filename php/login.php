<?php
session_start();

// Set response header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/Models/user-model.php';
require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php'; 

function loginUser($data) {
    global $db;

    try {
        $users = $db->users;

        // Validate input
        if (empty($data['username']) || empty($data['password'])) {
            return [
                "success" => false,
                "message" => "Username and password are required."
            ];
        }

        // Find user by username
        $user = $users->findOne(['username' => $data['username']]);
        if (!$user) {
            return [
                "success" => false,
                "message" => "Invalid username or password."
            ];
        }

        // Verify hashed password
        if (!password_verify($data['password'], $user['password'])) {
            return [
                "success" => false,
                "message" => "Invalid username or password."
            ];
        }

        // Check account status
        if (isset($user['account_status']) && $user['account_status'] !== 'active') {
            return [
                "success" => false,
                "message" => "Account is inactive or suspended."
            ];
        }

        // Set session variables
        $_SESSION['user_id'] = (string)$user['_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['profile']['name'] ?? $user['username'];
        $_SESSION['logged_in'] = true;

        // Success response with full user data
        $response = [
            "success" => true,
            "message" => "Login successful.",
            "user" => [
                "id" => (string)$user['_id'],
                "username" => $user['username'],
                "name" => $user['profile']['name'] ?? $user['username'],
                "email" => $user['email'] ?? '',
                "phone" => $user['profile']['phone'] ?? '',
                "role" => $user['role'],
                "profile_image" => $user['profile']['image'] ?? null,
                "account_status" => $user['account_status'] ?? 'active'
            ]
        ];

        logAction("User logged in: {$user['username']} ({$user['role']})");

        return $response;

    } catch (Exception $e) {
        logAction("Login error: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Server error during login."
        ];
    }
}

// Handle incoming POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $result = loginUser($data);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
}
?>