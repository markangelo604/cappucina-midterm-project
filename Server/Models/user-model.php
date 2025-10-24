<?php
/**
 * User Model - Passenger Functions (NoSQL Version)
 * MongoDB Implementation
 */

require_once __DIR__ . '/../../Server/server.php';
require_once __DIR__ . '/../../vendor/autoload.php'; 

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

// ===== Utility function for logging actions =====
function logAction($message) {
    $logDir = __DIR__ . "/../Server-Logs";
    $logFile = $logDir . "/user.log";

    // Ensure directory exists
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    // Prepare log message with timestamp
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;

    // Use file locking to prevent race conditions
    $fp = fopen($logFile, 'a');
    if ($fp) {
        flock($fp, LOCK_EX); // acquire exclusive lock
        fwrite($fp, $logMessage);
        fflush($fp);         // flush output before unlocking
        flock($fp, LOCK_UN); // release lock
        fclose($fp);
    }
}

// ========================================
// 1. CREATE USER PROFILE
// ========================================
function createUserProfile($data) {
    global $db;

    try {
        $users = $db->users;

        // Check username or email duplicates
        $existingUser = $users->findOne([
            '$or' => [
                ['username' => $data['username']],
                ['email' => $data['email']]
            ]
        ]);

        if ($existingUser) {
            return ["success" => false, "message" => "Username or email already exists."];
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // Create new user document
        $insertData = [
            "username" => $data['username'],
            "password" => $hashedPassword,
            "email" => $data['email'],
            "role" => "passenger",
            "profile" => [
                "name" => $data['name'],
                "phone" => $data['phone'] ?? null,
                "gender" => $data['gender'] ?? null,
                "address" => $data['address'] ?? null
            ],
            "account_status" => "active",
            "created_at" => new UTCDateTime()
        ];

        $result = $users->insertOne($insertData);

        logAction("User created: " . $data['username']);

        return [
            "success" => true,
            "message" => "User profile created successfully.",
            "user_id" => (string)$result->getInsertedId()
        ];

    } catch (Exception $e) {
        logAction("Error creating user: " . $e->getMessage());
        return ["success" => false, "message" => "Server error creating user."];
    }
}

// ========================================
// MANAGE USER PROFILE (UPDATE)
// ========================================
function manageUserProfile($user_id, $updates) {
    global $db;

    if (empty($updates)) return ["success" => false, "message" => "No updates provided."];

    try {
        $users = $db->users;
        $oid = new ObjectId($user_id);

        unset($updates['password'], $updates['role'], $updates['_id']);

        if (isset($updates['profile'])) {
            foreach ($updates['profile'] as $key => $val) {
                $updates["profile.$key"] = $val;
            }
            unset($updates['profile']);
        }

        $updateResult = $users->updateOne(
            ['_id' => $oid],
            ['$set' => $updates]
        );

        if ($updateResult->getModifiedCount() > 0) {
            logAction("User profile updated: " . $user_id);
            return ["success" => true, "message" => "Profile updated successfully."];
        }
        return ["success" => false, "message" => "No changes made."];

    } catch (Exception $e) {
        logAction("Error updating profile: " . $e->getMessage());
        return ["success" => false, "message" => "Update failed."];
    }
}

// ========================================
// 2. SEARCH FOR AVAILABLE RIDES
// ========================================
function searchAvailableRides($filters = []) {
    global $db;

    try {
        $rides = $db->rides;

        $query = [
            'ride_status' => 'upcoming',
            'available_seats' => ['$gt' => 0]
        ];

        if (!empty($filters['destination'])) $query['to'] = ['$regex' => $filters['destination'], '$options' => 'i'];
        if (!empty($filters['from'])) $query['from'] = ['$regex' => $filters['from'], '$options' => 'i'];
        if (!empty($filters['date'])) $query['date'] = $filters['date'];
        if (!empty($filters['route'])) $query['route.stops'] = ['$regex' => $filters['route'], '$options' => 'i'];

        $result = $rides->find($query, ['sort' => ['date' => 1, 'time' => 1]]);
        $ridesList = iterator_to_array($result);

        logAction("Search found " . count($ridesList) . " rides.");

        return ["success" => true, "rides" => $ridesList];

    } catch (Exception $e) {
        logAction("Error searching rides: " . $e->getMessage());
        return ["success" => false, "rides" => []];
    }
}

// ========================================
// 3. VIEW RIDE DETAILS
// ========================================
function viewRideDetails($ride_id) {
    global $db;

    try {
        $rides = $db->rides;
        $users = $db->users;

        $ride = $rides->findOne(['_id' => new ObjectId($ride_id)]);
        if (!$ride) return ["success" => false, "message" => "Ride not found."];

        $driver = $users->findOne(['_id' => $ride['driver_id']]);
        $ride['driver'] = $driver;

        logAction("Viewed ride details: $ride_id");

        return ["success" => true, "ride" => $ride];

    } catch (Exception $e) {
        logAction("Error viewing ride: " . $e->getMessage());
        return ["success" => false, "message" => "Error fetching ride details."];
    }
}

// ========================================
// 4. BOOK SEAT
// ========================================
function bookSeat($passenger_id, $ride_id) {
    global $db;

    try {
        $rides = $db->rides;
        $bookings = $db->bookings;
        $users = $db->users;

        $ride = $rides->findOne(['_id' => new ObjectId($ride_id)]);
        if (!$ride || $ride['ride_status'] != 'upcoming')
            return ["success" => false, "message" => "Ride not available."];

        if ($ride['available_seats'] <= 0)
            return ["success" => false, "message" => "No seats available."];

        if ((string)$ride['driver_id'] === $passenger_id)
            return ["success" => false, "message" => "Cannot book your own ride."];

        // Check duplicate booking
        $existing = $bookings->findOne([
            'ride_id' => new ObjectId($ride_id),
            'passenger_id' => new ObjectId($passenger_id),
            'status' => ['$in' => ['confirmed', 'pending']]
        ]);
        if ($existing)
            return ["success" => false, "message" => "Already booked this ride."];

        // Insert booking
        $booking = [
            'ride_id' => new ObjectId($ride_id),
            'passenger_id' => new ObjectId($passenger_id),
            'driver_id' => $ride['driver_id'],
            'fare' => $ride['fare'],
            'date' => $ride['date'],
            'status' => 'confirmed',
            'created_at' => new UTCDateTime()
        ];
        $result = $bookings->insertOne($booking);

        // Update ride seats
        $updateResult = $rides->updateOne(
            ['_id' => new ObjectId($ride_id), 'available_seats' => ['$gt' => 0]],
            ['$inc' => ['available_seats' => -1]]
        );
        if ($updateResult->getModifiedCount() === 0)
            return ["success" => false, "message" => "Seat no longer available."];

        logAction("Booked ride $ride_id by passenger $passenger_id");

        return ["success" => true, "booking_id" => (string)$result->getInsertedId()];

    } catch (Exception $e) {
        logAction("Booking error: " . $e->getMessage());
        return ["success" => false, "message" => "Booking failed."];
    }
}

// ========================================
// 5. CANCEL BOOKING
// ========================================
function cancelBooking($booking_id, $passenger_id) {
    global $db;

    try {
        $bookings = $db->bookings;
        $rides = $db->rides;

        $booking = $bookings->findOne(['_id' => new ObjectId($booking_id)]);
        if (!$booking)
            return ["success" => false, "message" => "Booking not found."];

        if ((string)$booking['passenger_id'] !== $passenger_id)
            return ["success" => false, "message" => "Unauthorized."];

        if ($booking['status'] === 'cancelled')
            return ["success" => false, "message" => "Already cancelled."];

        // Get current ride info
        $ride = $rides->findOne(['_id' => $booking['ride_id']]);
        if (!$ride)
            return ["success" => false, "message" => "Ride not found."];

        // Cancel booking
        $bookings->updateOne(
            ['_id' => new ObjectId($booking_id)],
            ['$set' => ['status' => 'cancelled']]
        );

        // Only restore seat if below total capacity
        if (isset($ride['total_seats']) && isset($ride['available_seats'])) {
            if ($ride['available_seats'] < $ride['total_seats']) {
                $rides->updateOne(
                    ['_id' => $booking['ride_id']],
                    ['$inc' => ['available_seats' => 1]]
                );
            }
        } else {
            // If no total_seats field is tracked, just increment
            $rides->updateOne(
                ['_id' => $booking['ride_id']],
                ['$inc' => ['available_seats' => 1]]
            );
        }

        logAction("Cancelled booking $booking_id by $passenger_id");
        return ["success" => true, "message" => "Booking cancelled successfully."];

    } catch (Exception $e) {
        logAction("Cancel error: " . $e->getMessage());
        return ["success" => false, "message" => "Cancellation failed."];
    }
}


// ========================================
// 6. RATE AND REVIEW DRIVER
// ========================================
function rateAndReviewDriver($data) {
    global $db;

    try {
        $bookings = $db->bookings;
        $reviews = $db->reviews;

        $booking = $bookings->findOne([
            '_id' => new ObjectId($data['booking_id']),
            'passenger_id' => new ObjectId($data['passenger_id'])
        ]);
        if ($data['rating'] < 1 || $data['rating'] > 5)
            return ["success" => false, "message" => "Rating must be between 1 and 5."];
        if (!$booking)
            return ["success" => false, "message" => "Booking not found."];
        if ($booking['status'] != 'completed')
            return ["success" => false, "message" => "Ride not completed."];
        if (isset($booking['rating_given']))
            return ["success" => false, "message" => "Already reviewed."];

        $review = [
            'ride_id' => $booking['ride_id'],
            'reviewer_id' => new ObjectId($data['passenger_id']),
            'reviewee_id' => $booking['driver_id'],
            'rating' => intval($data['rating']),
            'comment' => $data['comment'] ?? '',
            'created_at' => new UTCDateTime()
        ];
        $result = $reviews->insertOne($review);

        $bookings->updateOne(
            ['_id' => $booking['_id']],
            ['$set' => ['rating_given' => $data['rating']]]
        );

        logAction("Passenger {$data['passenger_id']} reviewed driver {$booking['driver_id']}");
        return ["success" => true, "review_id" => (string)$result->getInsertedId()];

    } catch (Exception $e) {
        logAction("Review error: " . $e->getMessage());
        return ["success" => false, "message" => "Review failed."];
    }
}
?>