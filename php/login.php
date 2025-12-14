<?php
//can be removed
error_reporting(0);
ini_set('display_errors', 0);
// -------------------
session_start();

// set response header
header('Content-Type: application/json');

require_once __DIR__ . '/../Server/Models/user-model.php';
require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php'; 

// This is expected to return a JSON of 
// ([
//         'success' => true,
//         'message' => 'Login successful!', => this is the message for the website
//         'userId' => $user['id'],
//         'name' => $user['name'],
//         'userType' => $user['userType']  // THIS IS KEY!
//     ]);

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

        // Success response
        $response = [
            "success" => true,
            "message" => "Login successful.",
            "name" => $user['profile']['name'] ?? $user['username'],
            "email" => $user['email'],
            "phone" => $user['profile']['phone'],
            "id" => (string)$user['_id'],
            "role" => $user['role']
        ];

        // Set session variables for authenticated flows
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        $_SESSION['username'] = $user['username'];
        $_SESSION['user_id'] = (string)$user['_id'];
        $_SESSION['role'] = $user['role'] ?? null;

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
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Call loginUser function
    $result = loginUser($data);

    // Return JSON response
    echo json_encode($result);
} else {
    // Method not allowed
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
}
?>
