<?php
/**
 * Check Driver Status Endpoint
 * Checks if a user has driver/car_owner role
 * 
 * INSTALLATION:
 * Place this file in your php/ directory as: php/check-driver-status.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/server.php';

try {
    session_start();
    
    // Get username from query parameter or session
    $username = $_GET['username'] ?? $_SESSION['username'] ?? null;
    
    if (!$username) {
        echo json_encode([
            'success' => false,
            'message' => 'Username required',
            'is_driver' => false
        ]);
        exit;
    }
    
    // Get database connection
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $users = $db->users;
    
    // Find user
    $user = $users->findOne(['username' => $username]);
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'User not found',
            'is_driver' => false
        ]);
        exit;
    }
    
    // Check if user is a driver
    $isDriver = isset($user['role']) && 
                ($user['role'] === 'car_owner' || $user['role'] === 'driver');
    
    $driverStatus = 'none';
    if ($isDriver) {
        $driverStatus = $user['driver_status'] ?? 'active';
    }
    
    echo json_encode([
        'success' => true,
        'is_driver' => $isDriver,
        'driver_status' => $driverStatus,
        'role' => $user['role'] ?? 'passenger',
        'account_status' => $user['account_status'] ?? 'active'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'is_driver' => false
    ]);
}
?>