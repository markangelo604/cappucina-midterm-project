<?php
/**
 * Driver Registration Endpoint
 * Handles driver/car owner registration with vehicle information and documents
 */

error_reporting(0);
ini_set('display_errors', 0);

session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\BSON\UTCDateTime;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);
        exit;
    }

    // Validate required fields
    $requiredFields = ['username', 'email', 'password', 'profile', 'vehicle'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            echo json_encode([
                "success" => false,
                "message" => "Missing required field: $field"
            ]);
            exit;
        }
    }

    // Validate vehicle data
    if (!is_array($data['vehicle']) || count($data['vehicle']) === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Vehicle information is required."
        ]);
        exit;
    }

    try {
        global $db;
        $users = $db->users;

        // Check if username or email already exists
        $existingUser = $users->findOne([
            '$or' => [
                ['username' => $data['username']],
                ['email' => $data['email']]
            ]
        ]);

        if ($existingUser) {
            echo json_encode([
                "success" => false,
                "message" => "Username or email already exists."
            ]);
            exit;
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // Prepare vehicle data with documents
        $vehicles = [];
        foreach ($data['vehicle'] as $vehicle) {
            $vehicleDoc = [
                'plate_number' => $vehicle['plate_number'] ?? '',
                'brand' => $vehicle['brand'] ?? '',
                'model' => $vehicle['model'] ?? '',
                'year' => intval($vehicle['year'] ?? 0),
                'color' => $vehicle['color'] ?? '',
                'available_seats' => intval($vehicle['available_seats'] ?? 4),
                'verified' => $vehicle['verified'] ?? false,
                'document' => []
            ];
            
            // Store uploaded documents as base64
            if (isset($vehicle['document'])) {
                $docs = $vehicle['document'];
                
                // Store driver's license
                if (!empty($docs['license'])) {
                    $vehicleDoc['document']['license'] = $docs['license'];
                    $vehicleDoc['document']['license_uploaded_at'] = new UTCDateTime();
                } else {
                    $vehicleDoc['document']['license'] = 'PENDING_UPLOAD';
                }
                
                // Store vehicle registration
                if (!empty($docs['registration'])) {
                    $vehicleDoc['document']['registration'] = $docs['registration'];
                    $vehicleDoc['document']['registration_uploaded_at'] = new UTCDateTime();
                } else {
                    $vehicleDoc['document']['registration'] = 'PENDING_UPLOAD';
                }
                
                // Store vehicle photo
                if (!empty($docs['photo'])) {
                    $vehicleDoc['document']['photo'] = $docs['photo'];
                    $vehicleDoc['document']['photo_uploaded_at'] = new UTCDateTime();
                } else {
                    $vehicleDoc['document']['photo'] = 'PENDING_UPLOAD';
                }
            } else {
                $vehicleDoc['document'] = [
                    'license' => 'PENDING_UPLOAD',
                    'registration' => 'PENDING_UPLOAD',
                    'photo' => 'PENDING_UPLOAD'
                ];
            }
            
            $vehicles[] = $vehicleDoc;
        }

        // Create new driver/car_owner document
        $insertData = [
            "username" => $data['username'],
            "password" => $hashedPassword,
            "email" => $data['email'],
            "role" => $data['role'] ?? 'car_owner',
            "profile" => [
                "name" => $data['profile']['name'] ?? '',
                "phone" => $data['profile']['phone'] ?? null,
                "address" => $data['profile']['address'] ?? null,
                "gender" => $data['profile']['gender'] ?? null
            ],
            "vehicle" => $vehicles,
            // Align with upgrade flow: new drivers start with pending driver_status
            "driver_status" => $data['driver_status'] ?? 'pending',
            "account_status" => $data['account_status'] ?? 'pending',
            "created_at" => new UTCDateTime()
        ];

        // Insert into database
        $result = $users->insertOne($insertData);

        // Log the action
        $logDir = __DIR__ . "/../Server/Server-Logs";
        $logFile = $logDir . "/driver-registration.log";

        if (!file_exists($logDir)) {
            mkdir($logDir, 0777, true);
        }

        $logMessage = "[" . date('Y-m-d H:i:s') . "] Driver registered: " . $data['username'] . " (with documents)" . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success" => true,
            "message" => "Driver registration successful. Your account is pending approval.",
            "user_id" => (string)$result->getInsertedId()
        ]);

    } catch (Exception $e) {
        $logDir = __DIR__ . "/../Server/Server-Logs";
        $logFile = $logDir . "/driver-registration.log";

        if (!file_exists($logDir)) {
            mkdir($logDir, 0777, true);
        }

        $logMessage = "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success" => false,
            "message" => "Server error during registration. Please try again."
        ]);
    }

} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
}
?>