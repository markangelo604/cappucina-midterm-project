<?php
// to be used to connect to the user-model.php to call the methods.
//can be removed later on
error_reporting(0);
ini_set('display_errors', 0);
//------------
session_start();

// Set response header
header('Content-Type: application/json');

require_once __DIR__ .'/../Server/Models/user-model.php';

// Handle incoming POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // get json input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate that data was received
    if (!$data) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);
        exit;
    }

    // Prepare data for createUserProfile function
    $userData = [
        'name' => $data['name'] ?? '',
        'username' => $data['username'] ?? '',
        'email' => $data['email'] ?? '',
        'phone' => $data['phone'] ?? '',
        'password' => $data['password'] ?? ''
    ];

    $result = createUserProfile($userData);

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
