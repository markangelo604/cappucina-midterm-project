<?php
//can be removed
error_reporting(0);
ini_set('display_errors', 0);
// -------------------
session_start();

// set response header
header('Content-Type: application/json');



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
            "id" => (string)$user['_id'],
            "role" => $user['role']
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

?>
