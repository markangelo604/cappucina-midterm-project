<?php
/**
 * Upgrade to Driver Endpoint
 * Upgrades existing passenger account to driver/car_owner
 * Allows users to become drivers without creating a new account
 * NOW WITH DOCUMENT UPLOAD SUPPORT
 */

error_reporting(0);
ini_set('display_errors', 0);

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\BSON\UTCDateTime;

// Logging function
function logUpgrade($message) {
    $logDir = __DIR__ . "/../Server/Server-Logs";
    $logFile = $logDir . "/driver-upgrades.log";

    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    logUpgrade("Upgrade request received: " . json_encode([
    'username' => $data['username'] ?? 'N/A',
    'has_vehicle' => isset($data['vehicle']),
    'has_documents' => isset($data['vehicle'][0]['document']) 
]));

    if (!$data) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);
        exit;
    }

    // Validate required fields
    $requiredFields = ['username', 'vehicle'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            logUpgrade("Missing field: $field");
            echo json_encode([
                "success" => false,
                "message" => "Missing required field: $field"
            ]);
            exit;
        }
    }

    // Validate vehicle data
    if (!is_array($data['vehicle']) || count($data['vehicle']) === 0) {
        logUpgrade("Invalid vehicle data");
        echo json_encode([
            "success" => false,
            "message" => "Vehicle information is required."
        ]);
        exit;
    }

    try {
        global $db;
        $users = $db->users;

        // Find existing user
        $existingUser = $users->findOne(['username' => $data['username']]);

        if (!$existingUser) {
            logUpgrade("User not found: " . $data['username']);
            echo json_encode([
                "success" => false,
                "message" => "User not found. Please log in first."
            ]);
            exit;
        }

        logUpgrade("User found: " . $data['username'] . " (Current role: " . ($existingUser['role'] ?? 'none') . ")");

        // Check if already a driver
        if (isset($existingUser['role']) && 
            ($existingUser['role'] === 'car_owner' || $existingUser['role'] === 'driver')) {
            logUpgrade("User already a driver: " . $data['username']);
            echo json_encode([
                "success" => false,
                "message" => "You are already registered as a driver."
            ]);
            exit;
        }

        // Prepare vehicle data with documents
        $vehicles = [];
        foreach ($data['vehicle'] as $vehicle) {
            // Validate vehicle fields
            if (empty($vehicle['plate_number']) || empty($vehicle['brand']) || 
                empty($vehicle['model']) || empty($vehicle['year'])) {
                logUpgrade("Incomplete vehicle data");
                echo json_encode([
                    "success" => false,
                    "message" => "All vehicle fields are required."
                ]);
                exit;
            }

            // Prepare base vehicle data
            $vehicleDoc = [
                'plate_number' => strtoupper(trim($vehicle['plate_number'])),
                'brand' => trim($vehicle['brand']),
                'model' => trim($vehicle['model']),
                'year' => intval($vehicle['year']),
                'color' => trim($vehicle['color'] ?? ''),
                'available_seats' => intval($vehicle['available_seats'] ?? 4),
                'verified' => false, // Will be verified by admin
                'document' => []
            ];

            // Store uploaded documents as base64
            if (isset($vehicle['document']) && is_array($vehicle['document'])) {
                $docs = $vehicle['document'];
                
                // Store driver's license
                if (!empty($docs['license']) && $docs['license'] !== 'PENDING_UPLOAD') {
                    $vehicleDoc['document']['license'] = $docs['license'];
                    $vehicleDoc['document']['license_uploaded_at'] = new UTCDateTime();
                    logUpgrade("✅ License document uploaded for " . $vehicle['plate_number']);
                } else {
                    $vehicleDoc['document']['license'] = 'PENDING_UPLOAD';
                }
                
                // Store vehicle registration
                if (!empty($docs['registration']) && $docs['registration'] !== 'PENDING_UPLOAD') {
                    $vehicleDoc['document']['registration'] = $docs['registration'];
                    $vehicleDoc['document']['registration_uploaded_at'] = new UTCDateTime();
                    logUpgrade("✅ Registration document uploaded for " . $vehicle['plate_number']);
                } else {
                    $vehicleDoc['document']['registration'] = 'PENDING_UPLOAD';
                }
                
                // Store vehicle photo
                if (!empty($docs['photo']) && $docs['photo'] !== 'PENDING_UPLOAD') {
                    $vehicleDoc['document']['photo'] = $docs['photo'];
                    $vehicleDoc['document']['photo_uploaded_at'] = new UTCDateTime();
                    logUpgrade("✅ Vehicle photo uploaded for " . $vehicle['plate_number']);
                } else {
                    $vehicleDoc['document']['photo'] = 'PENDING_UPLOAD';
                }
            } else {
                // No documents provided
                $vehicleDoc['document'] = [
                    'license' => 'PENDING_UPLOAD',
                    'registration' => 'PENDING_UPLOAD',
                    'photo' => 'PENDING_UPLOAD'
                ];
                logUpgrade("⚠️ No documents uploaded for " . $vehicle['plate_number']);
            }
            
            $vehicles[] = $vehicleDoc;
        }

        // Count uploaded documents
        $uploadedDocs = 0;
        if (isset($vehicles[0]['document'])) {
            if ($vehicles[0]['document']['license'] !== 'PENDING_UPLOAD') $uploadedDocs++;
            if ($vehicles[0]['document']['registration'] !== 'PENDING_UPLOAD') $uploadedDocs++;
            if ($vehicles[0]['document']['photo'] !== 'PENDING_UPLOAD') $uploadedDocs++;
        }
        
        logUpgrade("📊 Documents uploaded: $uploadedDocs/3");

        // Prepare update data
        $updateData = [
            'vehicle' => $vehicles,
            'driver_status' => 'pending',
            'account_status' => 'active', // Keep account active
            'upgraded_to_driver_at' => new UTCDateTime(),
            'documents_uploaded' => $uploadedDocs,
            'documents_verified' => false
        ];

        // Update profile information if provided
        if (isset($data['profile'])) {
            if (isset($data['profile']['phone']) && !empty($data['profile']['phone'])) {
                $updateData['profile.phone'] = $data['profile']['phone'];
            }
            if (isset($data['profile']['address']) && !empty($data['profile']['address'])) {
                $updateData['profile.address'] = $data['profile']['address'];
            }
        }

        logUpgrade("Updating user: " . $data['username'] . " with " . $uploadedDocs . " documents");

        // Perform the update
        $result = $users->updateOne(
            ['username' => $data['username']],
            ['$set' => $updateData]
        );

        if ($result->getModifiedCount() > 0 || $result->getMatchedCount() > 0) {
            logUpgrade("✅ Successfully upgraded user to driver: " . $data['username']);
            
            // Get updated user data
            $updatedUser = $users->findOne(['username' => $data['username']]);
            
            $message = "Successfully upgraded to driver!";
            if ($uploadedDocs === 3) {
                $message .= " All documents uploaded. Your account is pending approval.";
            } else {
                $message .= " Please note: Some documents are still pending. Upload remaining documents for faster approval.";
            }
            
            echo json_encode([
                "success" => true,
                "message" => $message,
                "user_id" => (string)$existingUser['_id'],
                "documents_uploaded" => $uploadedDocs,
                "documents_required" => 3,
                "user_data" => [
                    "username" => $updatedUser['username'],
                    "name" => $updatedUser['profile']['name'] ?? '',
                    "email" => $updatedUser['email'] ?? '',
                    "phone" => $updatedUser['profile']['phone'] ?? '',
                    "role" => $updatedUser['role'],
                    "driver_status" => $updatedUser['driver_status'] ?? 'pending',
                    "documents_uploaded" => $uploadedDocs
                ]
            ]);
        } else {
            logUpgrade("❌ Failed to upgrade user (no modifications): " . $data['username']);
            echo json_encode([
                "success" => false,
                "message" => "Failed to upgrade account. Please try again."
            ]);
        }

    } catch (Exception $e) {
        logUpgrade("❌ Exception during upgrade: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        
        echo json_encode([
            "success" => false,
            "message" => "Server error during upgrade: " . $e->getMessage()
        ]);
    }

} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method. Use POST."
    ]);
}
?>