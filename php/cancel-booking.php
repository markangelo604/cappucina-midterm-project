<?php
/**
 * Cancel Booking Endpoint
 * Cancels a booking and updates seat availability
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log incoming request for debugging
    logAction("Incoming request: " . json_encode($input));

    if (!isset($input['booking_id']) || empty($input['booking_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Booking ID is required'
        ]);
        exit;
    }

    $bookingId = trim($input['booking_id']);
    $cancelReason = $input['cancel_reason'] ?? 'No reason provided';
    
    logAction("Processing cancellation for booking ID: $bookingId");

    // Get database connection
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];

    $bookingsCollection = $db->bookings;
    $ridesCollection = $db->rides;

    // Try to find booking - MongoDB IDs are usually 24-character hex strings
    $booking = null;
    
    // Try as MongoDB ObjectId (most common)
    if (strlen($bookingId) === 24 && ctype_xdigit($bookingId)) {
        try {
            $booking = $bookingsCollection->findOne(['_id' => new MongoDB\BSON\ObjectId($bookingId)]);
            logAction("Found booking using ObjectId");
        } catch (Exception $e) {
            logAction("Failed to use ObjectId: " . $e->getMessage());
        }
    }
    
    // Try as string if ObjectId failed
    if (!$booking) {
        $booking = $bookingsCollection->findOne(['_id' => $bookingId]);
        if ($booking) {
            logAction("Found booking using string ID");
        }
    }
    
    // Try as integer
    if (!$booking && is_numeric($bookingId)) {
        $booking = $bookingsCollection->findOne(['_id' => (int)$bookingId]);
        if ($booking) {
            logAction("Found booking using integer ID");
        }
    }

    if (!$booking) {
        logAction("Booking not found: $bookingId");
        throw new Exception('Booking not found. ID: ' . $bookingId);
    }

    logAction("Found booking: " . json_encode($booking));

    if ($booking['status'] === 'cancelled' || $booking['status'] === 'Cancelled') {
        throw new Exception('Booking is already cancelled.');
    }

    if ($booking['status'] === 'completed' || $booking['status'] === 'Completed') {
        throw new Exception('Cannot cancel a completed booking.');
    }

    // Get the ride_id in the correct format
    $rideId = $booking['ride_id'];
    
    // Find associated ride
    $ride = null;
    try {
        if (class_exists('MongoDB\BSON\ObjectId') && is_string($rideId)) {
            $ride = $ridesCollection->findOne(['_id' => new MongoDB\BSON\ObjectId($rideId)]);
        }
    } catch (Exception $e) {
        // Not an ObjectId
    }
    
    if (!$ride) {
        $ride = $ridesCollection->findOne(['_id' => $rideId]);
    }

    if (!$ride) {
        logAction("Associated ride not found: $rideId");
        throw new Exception('Associated ride not found.');
    }

    // Update booking status
    $bookingIdForUpdate = $booking['_id'];
    
    $updateResult = $bookingsCollection->updateOne(
        ['_id' => $bookingIdForUpdate],
        [
            '$set' => [
                'status' => 'Cancelled',
                'cancel_reason' => $cancelReason,
                'cancelled_at' => new MongoDB\BSON\UTCDateTime()
            ]
        ]
    );

    if ($updateResult->getModifiedCount() === 0) {
        logAction("Failed to update booking status");
        throw new Exception('Failed to cancel booking. Please try again.');
    }

    // Get number of passengers to restore
    $passengersToRestore = isset($booking['passengers']) ? (int)$booking['passengers'] : 1;

    // Restore seat availability
    $rideIdForUpdate = $ride['_id'];
    
    $seatUpdateResult = $ridesCollection->updateOne(
        ['_id' => $rideIdForUpdate],
        ['$inc' => ['available_seats' => $passengersToRestore]]
    );
    
    logAction("Restored $passengersToRestore seat(s) to ride");

    // Remove passenger from ride's passenger list if it exists
    if (isset($booking['passenger_username']) && !empty($booking['passenger_username'])) {
        $ridesCollection->updateOne(
            ['_id' => $rideIdForUpdate],
            ['$pull' => ['passengers' => $booking['passenger_username']]]
        );
        logAction("Removed passenger from ride passenger list");
    }

    // Log successful cancellation
    logAction("Booking cancelled successfully: $bookingId - Reason: $cancelReason");

    echo json_encode([
        'success' => true,
        'message' => 'Booking cancelled successfully.',
        'booking_id' => $bookingId
    ]);

} catch (Exception $e) {
    logAction("Cancel booking error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_details' => $e->getTraceAsString()
    ]);
}

// Logging helper
function logAction($message) {
    $logDir = __DIR__ . '/../Server-Logs';
    $logFile = $logDir . '/cancel-booking.log';

    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    $logMessage = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;

    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}
?>