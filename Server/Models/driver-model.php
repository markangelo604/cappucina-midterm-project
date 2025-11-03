<?php
/**
 * Driver Model - NoSQL Version (MongoDB)
 * Handles driver ride operations.
 */

require_once __DIR__ . '/../../Server/server.php';
require_once __DIR__ . '/../../vendor/autoload.php'; 

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

// ========================================
// LOGGING UTILITY
// ========================================
function logAction($message) {
    $logDir = __DIR__ . "/../Server-Logs";
    $logFile = $logDir . "/driver.log";

    if (!file_exists($logDir)) mkdir($logDir, 0777, true);

    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;

    $fp = fopen($logFile, 'a');
    if ($fp) {
        flock($fp, LOCK_EX);
        fwrite($fp, $logMessage);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

// ========================================
// 1. ADD RIDE SCHEDULE
// ========================================
/**
 * sample use:
 * addRideSchedule([
 * 'driver_id' => '6726f7c8bda1230012a9b110',
 * 'from' => 'SLU Bakakeng',
 * 'to' => 'SM Baguio',
 * 'date' => '2025-11-04',
 * 'time' => '08:00',
 * 'fare' => 150,
 * 'available_seats' => 3,
 * 'stops' => ['Bakakeng Arc', 'BGH']
 * ]);
 * @param mixed $data
 * @return array{message: string, success: bool|array{ride_id: string, success: bool}}
 */
function addRideSchedule($data) {
    global $db;
    try {
        $rides = $db->rides;

        if (empty($data['driver_id']) || empty($data['from']) || empty($data['to']))
            return ["success" => false, "message" => "Missing required fields."];

        $rideData = [
            'driver_id' => new ObjectId($data['driver_id']),
            'from' => $data['from'],
            'to' => $data['to'],
            'date' => $data['date'] ?? date('Y-m-d'),
            'time' => $data['time'] ?? date('H:i'),
            'fare' => (float)($data['fare'] ?? 0),
            'available_seats' => (int)($data['available_seats'] ?? 1),
            'ride_status' => 'upcoming',
            'route' => [
                'stops' => $data['stops'] ?? [],
                'distance_km' => $data['distance_km'] ?? null,
                'estimated_duration_mins' => $data['estimated_duration_mins'] ?? null
            ],
            'passengers' => [],
            'created_at' => new UTCDateTime()
        ];

        $result = $rides->insertOne($rideData);
        logAction("Ride added by driver {$data['driver_id']} from {$data['from']} to {$data['to']}");

        return ["success" => true, "ride_id" => (string)$result->getInsertedId()];
    } catch (Exception $e) {
        logAction("Error adding ride: " . $e->getMessage());
        return ["success" => false, "message" => "Failed to add ride."];
    }
}

// ========================================
// 2. REMOVE RIDE SCHEDULE
// ========================================
function removeRideSchedule($data) {
    global $db;
    try {
        $rides = $db->rides;
        $ride_id = new ObjectId($data['ride_id']);
        $driver_id = new ObjectId($data['driver_id']);

        $result = $rides->deleteOne([
            '_id' => $ride_id,
            'driver_id' => $driver_id
        ]);

        if ($result->getDeletedCount() > 0) {
            logAction("Ride $ride_id deleted by driver {$data['driver_id']}");
            return ["success" => true, "message" => "Ride removed successfully."];
        }

        return ["success" => false, "message" => "Ride not found or unauthorized."];

    } catch (Exception $e) {
        logAction("Error removing ride: " . $e->getMessage());
        return ["success" => false, "message" => "Failed to remove ride."];
    }
}

// ========================================
// 3. START RIDE
// ========================================
function startRide($data) {
    global $db;
    try {
        $rides = $db->rides;
        $update = $rides->updateOne(
            [
                '_id' => new ObjectId($data['ride_id']),
                'driver_id' => new ObjectId($data['driver_id']),
                'ride_status' => 'upcoming'
            ],
            ['$set' => ['ride_status' => 'ongoing']]
        );

        if ($update->getModifiedCount() > 0) {
            logAction("Ride {$data['ride_id']} started by driver {$data['driver_id']}");
            return ["success" => true, "message" => "Ride started successfully."];
        }
        return ["success" => false, "message" => "Unable to start ride (not found or already started)."];

    } catch (Exception $e) {
        logAction("Error starting ride: " . $e->getMessage());
        return ["success" => false, "message" => "Failed to start ride."];
    }
}

// ========================================
// 4. COMPLETE RIDE
// ========================================
function completeRide($data) {
    global $db;
    try {
        $rides = $db->rides;
        $update = $rides->updateOne(
            [
                '_id' => new ObjectId($data['ride_id']),
                'driver_id' => new ObjectId($data['driver_id']),
                'ride_status' => 'ongoing'
            ],
            ['$set' => ['ride_status' => 'finished']]
        );

        if ($update->getModifiedCount() > 0) {
            logAction("Ride {$data['ride_id']} completed by driver {$data['driver_id']}");
            return ["success" => true, "message" => "Ride marked as completed."];
        }
        return ["success" => false, "message" => "Unable to complete ride (not found or not ongoing)."];

    } catch (Exception $e) {
        logAction("Error completing ride: " . $e->getMessage());
        return ["success" => false, "message" => "Failed to complete ride."];
    }
}

// ========================================
// 5. VIEW DRIVER RIDES
// ========================================
function viewDriverRides($data) {
    global $db;
    try {
        $rides = $db->rides;
        $cursor = $rides->find([
            'driver_id' => new ObjectId($data['driver_id'])
        ], [
            'sort' => ['created_at' => -1]
        ]);

        $ridesList = iterator_to_array($cursor);
        logAction("Driver {$data['driver_id']} viewed their rides.");

        return ["success" => true, "rides" => $ridesList];
    } catch (Exception $e) {
        logAction("Error viewing rides: " . $e->getMessage());
        return ["success" => false, "rides" => []];
    }
}
?>
