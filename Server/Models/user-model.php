<?php
/**
 * User Model - Passenger Functions
 * 
 * Passengers (Clients) can:
 * ✓ Create and manage a user profile.
 * ✓ Search for available carpool rides based on destination, date, or route.
 * ✓ View ride details (driver info, available seats, cost, time).
 * ✓ Request or book a seat in a carpool.
 * ✓ Cancel bookings.
 * ✓ Rate and review car owners after ride completion.
 */

require_once __DIR__ . '/../Server/server.php';

// ===== Utility function for logging actions =====
function logAction($message) {
    $logDir = __DIR__ . "/../Server-Logs";
    $logFile = $logDir . "/user.log";

    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// ========================================
// 1. CREATE USER PROFILE
// ========================================
function createUserProfile($data) {
    global $conn;

    try {
        // Validate required fields
        if (empty($data['username']) || empty($data['password']) || empty($data['email']) || empty($data['name'])) {
            return [
                "success" => false,
                "message" => "Username, password, email, and name are required."
            ];
        }

        
        // Check if username already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$data['username']]);
        if ($stmt->fetch()) {
            logAction("Attempted registration with existing username: " . $data['username']);
            return [
                "success" => false,
                "message" => "Username already exists."
            ];
        }

        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            logAction("Attempted registration with existing email: " . $data['email']);
            return [
                "success" => false,
                "message" => "Email already exists."
            ];
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // Insert new user (passenger by default)
        $sql = "INSERT INTO users (username, password, email, role, name, phone, gender, address, account_status) 
                VALUES (?, ?, ?, 'passenger', ?, ?, ?, ?, 'active')";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['username'],
            $hashedPassword,
            $data['email'],
            $data['name'],
            $data['phone'] ?? null,
            $data['gender'] ?? null,
            $data['address'] ?? null
        ]);

        $userId = $conn->lastInsertId();
        logAction("User profile created successfully: " . $data['username'] . " (ID: $userId)");
        
        return [
            "success" => true,
            "message" => "User profile created successfully.",
            "user_id" => $userId
        ];

    } catch (PDOException $e) {
        logAction("Error creating user profile: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Profile creation failed due to server error."
        ];
    }
}

// ========================================
// MANAGE USER PROFILE (UPDATE)
// ========================================
function manageUserProfile($user_id, $updates) {
    global $conn;

    try {
        // Validate user exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        if (!$stmt->fetch()) {
            return ["success" => false, "message" => "User not found."];
        }

        // Remove fields that shouldn't be updated this way
        unset($updates['id']);
        unset($updates['password']); // Use separate password update function
        unset($updates['role']); // Can't change role
        unset($updates['created_at']);

        if (empty($updates)) {
            return ["success" => false, "message" => "No valid fields to update."];
        }

        // Build dynamic UPDATE query
        $fields = [];
        $values = [];
        
        foreach ($updates as $key => $value) {
            $fields[] = "$key = ?";
            $values[] = $value;
        }
        
        $values[] = $user_id; // for WHERE clause
        
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($values);

        if ($stmt->rowCount() > 0) {
            logAction("Profile updated for user_id: " . $user_id);
            return ["success" => true, "message" => "Profile updated successfully."];
        }
        
        return ["success" => false, "message" => "No changes made."];
        
    } catch (PDOException $e) {
        logAction("Profile update error: " . $e->getMessage());
        return ["success" => false, "message" => "Update failed."];
    }
}

// ========================================
// 2. SEARCH FOR AVAILABLE CARPOOL RIDES
// ========================================
function searchAvailableRides($filters = []) {
    global $conn;

    try {
        // Base condition - only show upcoming rides with available seats
        $conditions = ["r.ride_status = 'upcoming'", "r.available_seats > 0"];
        $params = [];

        // Filter by destination (to_location)
        if (!empty($filters['destination'])) {
            $conditions[] = "r.to_location LIKE ?";
            $params[] = '%' . $filters['destination'] . '%';
        }

        // Filter by origin (from_location)
        if (!empty($filters['from'])) {
            $conditions[] = "r.from_location LIKE ?";
            $params[] = '%' . $filters['from'] . '%';
        }

        // Filter by date
        if (!empty($filters['date'])) {
            $conditions[] = "r.date = ?";
            $params[] = $filters['date'];
        }

        // Filter by route (search in stops JSON)
        if (!empty($filters['route'])) {
            $conditions[] = "r.stops LIKE ?";
            $params[] = '%' . $filters['route'] . '%';
        }

        $sql = "SELECT 
                    r.id as ride_id,
                    r.from_location,
                    r.to_location,
                    r.date,
                    r.time,
                    r.fare,
                    r.available_seats,
                    r.stops,
                    r.distance_km,
                    r.estimated_duration_mins,
                    u.id as driver_id,
                    u.name as driver_name,
                    u.phone as driver_phone,
                    u.plate_number,
                    u.brand as vehicle_brand,
                    u.model as vehicle_model,
                    u.year as vehicle_year,
                    u.verified as vehicle_verified
                FROM rides r
                JOIN users u ON r.driver_id = u.id
                WHERE " . implode(" AND ", $conditions) . "
                ORDER BY r.date ASC, r.time ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $rides = $stmt->fetchAll();

        // Decode JSON stops for each ride
        foreach ($rides as &$ride) {
            $ride['stops'] = json_decode($ride['stops'], true);
        }

        logAction("Search completed: Found " . count($rides) . " available rides.");
        
        return [
            "success" => true,
            "count" => count($rides),
            "rides" => $rides
        ];

    } catch (PDOException $e) {
        logAction("Error searching rides: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Search failed.",
            "rides" => []
        ];
    }
}

// ========================================
// 3. VIEW RIDE DETAILS
// ========================================
function viewRideDetails($ride_id) {
    global $conn;

    try {
        $sql = "SELECT 
                    r.id as ride_id,
                    r.from_location,
                    r.to_location,
                    r.date,
                    r.time,
                    r.fare,
                    r.available_seats,
                    r.ride_status,
                    r.stops,
                    r.distance_km,
                    r.estimated_duration_mins,
                    r.created_at as ride_created_at,
                    u.id as driver_id,
                    u.name as driver_name,
                    u.phone as driver_phone,
                    u.email as driver_email,
                    u.gender as driver_gender,
                    u.plate_number,
                    u.brand as vehicle_brand,
                    u.model as vehicle_model,
                    u.year as vehicle_year,
                    u.verified as vehicle_verified,
                    u.available_seats as total_vehicle_seats,
                    (SELECT COUNT(*) FROM bookings WHERE ride_id = r.id AND status IN ('confirmed', 'pending')) as current_bookings,
                    (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as driver_avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as driver_total_reviews
                FROM rides r
                JOIN users u ON r.driver_id = u.id
                WHERE r.id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->execute([$ride_id]);
        $ride = $stmt->fetch();

        if ($ride) {
            // Decode JSON stops
            $ride['stops'] = json_decode($ride['stops'], true);
            
            // Round average rating
            $ride['driver_avg_rating'] = $ride['driver_avg_rating'] ? round($ride['driver_avg_rating'], 1) : null;
            
            logAction("Viewed ride details for ride_id: " . $ride_id);
            
            return [
                "success" => true,
                "ride" => $ride
            ];
        }

        return [
            "success" => false,
            "message" => "Ride not found."
        ];

    } catch (PDOException $e) {
        logAction("Error viewing ride details: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Failed to retrieve ride details."
        ];
    }
}

// ========================================
// 4. REQUEST OR BOOK A SEAT
// ========================================
function bookSeat($passenger_id, $ride_id) {
    global $conn;

    try {
        $conn->beginTransaction();

        // Verify passenger exists and is a passenger
        $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$passenger_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $conn->rollBack();
            return ["success" => false, "message" => "User not found."];
        }

        // Check if ride exists and has available seats
        $stmt = $conn->prepare("SELECT driver_id, available_seats, fare, date, ride_status FROM rides WHERE id = ?");
        $stmt->execute([$ride_id]);
        $ride = $stmt->fetch();

        if (!$ride) {
            $conn->rollBack();
            return ["success" => false, "message" => "Ride not found."];
        }

        if ($ride['ride_status'] != 'upcoming') {
            $conn->rollBack();
            return ["success" => false, "message" => "Ride is not available for booking."];
        }

        if ($ride['available_seats'] <= 0) {
            $conn->rollBack();
            return ["success" => false, "message" => "No available seats."];
        }

        // Check if passenger is the driver (can't book own ride)
        if ($ride['driver_id'] == $passenger_id) {
            $conn->rollBack();
            return ["success" => false, "message" => "You cannot book your own ride."];
        }

        // Check if user already has an active booking for this ride
        $stmt = $conn->prepare("SELECT id, status FROM bookings WHERE ride_id = ? AND passenger_id = ? AND status IN ('pending', 'confirmed')");
        $stmt->execute([$ride_id, $passenger_id]);
        if ($stmt->fetch()) {
            $conn->rollBack();
            return ["success" => false, "message" => "You already have an active booking for this ride."];
        }

        // Create booking
        $stmt = $conn->prepare("INSERT INTO bookings (ride_id, passenger_id, driver_id, fare, date, status) VALUES (?, ?, ?, ?, ?, 'confirmed')");
        $stmt->execute([
            $ride_id,
            $passenger_id,
            $ride['driver_id'],
            $ride['fare'],
            $ride['date']
        ]);

        $bookingId = $conn->lastInsertId();

        // Decrease available seats
        $stmt = $conn->prepare("UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?");
        $stmt->execute([$ride_id]);

        $conn->commit();
        logAction("Booking created: passenger_id $passenger_id booked ride_id $ride_id (booking_id: $bookingId)");
        
        return [
            "success" => true,
            "message" => "Seat booked successfully!",
            "booking_id" => $bookingId,
            "fare" => $ride['fare']
        ];

    } catch (PDOException $e) {
        $conn->rollBack();
        logAction("Error booking seat: " . $e->getMessage());
        return ["success" => false, "message" => "Booking failed due to server error."];
    }
}

// ========================================
// 5. CANCEL BOOKINGS
// ========================================
function cancelBooking($booking_id, $passenger_id) {
    global $conn;

    try {
        $conn->beginTransaction();

        // Get booking details
        $stmt = $conn->prepare("SELECT ride_id, passenger_id, status FROM bookings WHERE id = ?");
        $stmt->execute([$booking_id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            $conn->rollBack();
            return ["success" => false, "message" => "Booking not found."];
        }

        // Verify the booking belongs to this passenger
        if ($booking['passenger_id'] != $passenger_id) {
            $conn->rollBack();
            return ["success" => false, "message" => "Unauthorized: This booking does not belong to you."];
        }

        // Check if already cancelled
        if ($booking['status'] == 'cancelled') {
            $conn->rollBack();
            return ["success" => false, "message" => "Booking is already cancelled."];
        }

        // Check if ride is completed
        if ($booking['status'] == 'completed') {
            $conn->rollBack();
            return ["success" => false, "message" => "Cannot cancel a completed ride."];
        }

        // Cancel the booking
        $stmt = $conn->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$booking_id]);

        // Increase available seats back
        $stmt = $conn->prepare("UPDATE rides SET available_seats = available_seats + 1 WHERE id = ?");
        $stmt->execute([$booking['ride_id']]);

        $conn->commit();
        logAction("Booking cancelled: booking_id $booking_id by passenger_id $passenger_id");
        
        return [
            "success" => true,
            "message" => "Booking cancelled successfully."
        ];

    } catch (PDOException $e) {
        $conn->rollBack();
        logAction("Error cancelling booking: " . $e->getMessage());
        return ["success" => false, "message" => "Cancellation failed due to server error."];
    }
}

// ========================================
// 6. RATE AND REVIEW CAR OWNERS
// ========================================
function rateAndReviewDriver($data) {
    global $conn;

    try {
        // Validate required fields
        if (empty($data['booking_id']) || empty($data['passenger_id']) || empty($data['rating'])) {
            return ["success" => false, "message" => "Booking ID, passenger ID, and rating are required."];
        }

        // Validate rating range (1-5)
        if ($data['rating'] < 1 || $data['rating'] > 5) {
            return ["success" => false, "message" => "Rating must be between 1 and 5."];
        }

        // Verify the booking exists, is completed, and belongs to this passenger
        $stmt = $conn->prepare("SELECT ride_id, driver_id, status, rating_given FROM bookings WHERE id = ? AND passenger_id = ?");
        $stmt->execute([$data['booking_id'], $data['passenger_id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            return ["success" => false, "message" => "Booking not found or does not belong to you."];
        }

        if ($booking['status'] != 'completed') {
            return ["success" => false, "message" => "You can only review completed rides."];
        }

        if ($booking['rating_given']) {
            return ["success" => false, "message" => "You have already reviewed this ride."];
        }

        // Insert review
        $stmt = $conn->prepare("INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $booking['ride_id'],
            $data['passenger_id'],
            $booking['driver_id'],
            $data['rating'],
            $data['comment'] ?? ''
        ]);

        $reviewId = $conn->lastInsertId();

        // Update booking with rating
        $stmt = $conn->prepare("UPDATE bookings SET rating_given = ? WHERE id = ?");
        $stmt->execute([$data['rating'], $data['booking_id']]);

        logAction("Review submitted: passenger_id {$data['passenger_id']} rated driver_id {$booking['driver_id']} with {$data['rating']} stars (review_id: $reviewId)");
        
        return [
            "success" => true,
            "message" => "Review submitted successfully!",
            "review_id" => $reviewId
        ];

    } catch (PDOException $e) {
        logAction("Error submitting review: " . $e->getMessage());
        return ["success" => false, "message" => "Review submission failed due to server error."];
    }
}

// ========================================
// HELPER: GET USER'S BOOKINGS
// ========================================
function getUserBookings($passenger_id) {
    global $conn;

    try {
        $sql = "SELECT 
                    b.id as booking_id,
                    b.status as booking_status,
                    b.fare,
                    b.date as ride_date,
                    b.rating_given,
                    b.created_at as booked_at,
                    r.id as ride_id,
                    r.from_location,
                    r.to_location,
                    r.time,
                    r.ride_status,
                    u.name as driver_name,
                    u.phone as driver_phone,
                    u.plate_number,
                    u.brand as vehicle_brand,
                    u.model as vehicle_model
                FROM bookings b
                JOIN rides r ON b.ride_id = r.id
                JOIN users u ON b.driver_id = u.id
                WHERE b.passenger_id = ?
                ORDER BY b.created_at DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute([$passenger_id]);
        $bookings = $stmt->fetchAll();

        return [
            "success" => true,
            "count" => count($bookings),
            "bookings" => $bookings
        ];

    } catch (PDOException $e) {
        logAction("Error fetching user bookings: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Failed to retrieve bookings."
        ];
    }
}
?>