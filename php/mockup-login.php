<?php
header('Content-Type: application/json');
session_start();

// Mock user data for testing
$testUsers = [
    [
        '_id' => '507f1f77bcf86cd799439011',
        'username' => 'admin',
        'password' => 'admin123',
        'name' => 'Admin User',
        'userType' => 'admin',
        'status' => 'active'
    ],
    [
        '_id' => '507f1f77bcf86cd799439012',
        'username' => 'driver',
        'password' => 'driver123',
        'name' => 'John Driver',
        'userType' => 'driver',
        'status' => 'active'
    ],
    [
        '_id' => '507f1f77bcf86cd799439013',
        'username' => 'client',
        'password' => 'client123',
        'name' => 'Jane Client',
        'userType' => 'client',
        'status' => 'active'
    ]
];

try {
    // Get JSON data
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $remember = $input['remember'] ?? false;

    // Validate input
    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit();
    }

    // Find user in test data
    $user = null;
    foreach ($testUsers as $testUser) {
        if ($testUser['username'] === $username) {
            $user = $testUser;
            break;
        }
    }

    // Check if user found
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
        exit();
    }

    // Verify password (simple comparison for testing)
    if ($user['password'] !== $password) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
        exit();
    }

    // Check if user is active
    if ($user['status'] !== 'active') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Your account is inactive'
        ]);
        exit();
    }

    // Store user data in session
    $_SESSION['user_id'] = $user['_id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_username'] = $user['username'];
    $_SESSION['user_type'] = $user['userType'];

    // Set session timeout
    if ($remember) {
        $_SESSION['remember_me'] = true;
        setcookie(session_name(), session_id(), time() + (30 * 24 * 60 * 60), '/');
    }

    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'userId' => $user['_id'],
        'name' => $user['name'],
        'userType' => $user['userType']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>