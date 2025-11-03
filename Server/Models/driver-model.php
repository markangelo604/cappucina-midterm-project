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
// 2. UPDATE RIDE SCHEDULE
// ========================================
/**
 * Updates existing ride schedule details.
 * 
 * sample use:
 * updateRideSchedule([
 *   'ride_id' => '6726f7c8bda1230012a9b110',
 *   'driver_id' => '6726f7c8bda1230012a9b111',
 *   'from' => 'Bakakeng',
 *   'to' => 'SLU Main',
 *   'fare' => 200,
 *   'available_seats' => 2,
 *   'time' => '09:00',
 *   'stops' => ['Bakakeng Arc', 'BGH']
 * ]);
 */
function updateRideSchedule($data) {
    global $db;
    try {
        $rides = $db->rides;

        if (empty($data['ride_id']) || empty($data['driver_id']))
            return ["success" => false, "message" => "Missing required identifiers."];

        $updateFields = [];

        // only update provided fields
        $fields = ['from', 'to', 'date', 'time', 'fare', 'available_seats'];
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updateFields[$field] = $data[$field];
            }
        }

        // route-related updates
        if (isset($data['stops']) || isset($data['distance_km']) || isset($data['estimated_duration_mins'])) {
            $updateFields['route'] = [
                'stops' => $data['stops'] ?? [],
                'distance_km' => $data['distance_km'] ?? null,
                'estimated_duration_mins' => $data['estimated_duration_mins'] ?? null
            ];
        }

        if (empty($updateFields))
            return ["success" => false, "message" => "No fields to update."];

        $result = $rides->updateOne(
            [
                '_id' => new ObjectId($data['ride_id']),
                'driver_id' => new ObjectId($data['driver_id'])
            ],
            ['$set' => $updateFields]
        );

        if ($result->getModifiedCount() > 0) {
            logAction("Ride {$data['ride_id']} updated by driver {$data['driver_id']}");
            return ["success" => true, "message" => "Ride updated successfully."];
        }

        return ["success" => false, "message" => "Ride not found or no changes made."];

    } catch (Exception $e) {
        logAction("Error updating ride: " . $e->getMessage());
        return ["success" => false, "message" => "Failed to update ride."];
    }
}

// ========================================
// 3. REMOVE RIDE SCHEDULE
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
// 4. START RIDE
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
// 5. COMPLETE RIDE
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
// 6. VIEW DRIVER RIDES
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