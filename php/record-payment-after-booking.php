<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';
session_start();

function logPayment($message) {
    $logDir = __DIR__ . "/../Server/Server-Logs";
    $logFile = $logDir . "/payment-recording.log";
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    logPayment("Payment recording request: " . json_encode($input));

    // Basic session-based authorization: if session exists, ensure user matches
    if (isset($_SESSION['username']) && !empty($input['passenger_username'])) {
        if ($_SESSION['username'] !== $input['passenger_username']) {
            throw new Exception('Unauthorized: session user does not match passenger');
        }
    } else {
        // No session - warn in logs (allows legacy clients that don't use sessions)
        logPayment("⚠️ No authenticated session present for passenger: " . ($input['passenger_username'] ?? 'unknown'));
    }
    
    // Validate required fields
    if (empty($input['passenger_username'])) {
        throw new Exception('Passenger username is required');
    }
    
    if (empty($input['ride_id'])) {
        throw new Exception('Ride ID is required');
    }
    
    if (empty($input['booking_id'])) {
        throw new Exception('Booking ID is required');
    }
    
    if (empty($input['payment_method'])) {
        throw new Exception('Payment method is required');
    }
    
    if (!isset($input['payment_amount']) || $input['payment_amount'] <= 0) {
        throw new Exception('Valid payment amount is required');
    }
    
    // Get database
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $payments = $db->payments;
    $bookings = $db->bookings;
    
    // Verify booking exists
    try {
        $bookingOid = new MongoDB\BSON\ObjectId($input['booking_id']);
    } catch (Exception $e) {
        throw new Exception('Invalid booking_id format');
    }

    $booking = $bookings->findOne([
        '_id' => $bookingOid,
        'passenger_username' => $input['passenger_username']
    ]);
    
    if (!$booking) {
        throw new Exception('Booking not found for payment');
    }
    
    logPayment("Booking found: " . $input['booking_id']);
    
    // Ensure ride_id in input matches booking's ride_id
    $bookingRideId = (string)($booking['ride_id'] ?? $booking['ride'] ?? '');
    if ($bookingRideId === '') {
        // booking may store ride_id as ObjectId under 'ride_id'
        if (isset($booking['ride_id']) && $booking['ride_id'] instanceof MongoDB\BSON\ObjectId) {
            $bookingRideId = (string)$booking['ride_id'];
        }
    }

    if ((string)$input['ride_id'] !== (string)$bookingRideId) {
        throw new Exception('Ride and booking mismatch');
    }

    // ========================================
    // CREATE PAYMENT RECORD
    // ========================================
    $paymentDoc = [
        'passenger_username' => $input['passenger_username'],
        'driver_username' => $booking['driver_username'] ?? 'Unknown',
        'ride_id' => new MongoDB\BSON\ObjectId($input['ride_id']),
        'booking_id' => new MongoDB\BSON\ObjectId($input['booking_id']),
        'amount' => floatval($input['payment_amount']),
        'status' => 'paid',
        'transaction_id' => 'TXN' . strtoupper(uniqid()),
        'method' => $input['payment_method'],
        'created_at' => new MongoDB\BSON\UTCDateTime(),
        'updated_at' => new MongoDB\BSON\UTCDateTime()
    ];
    
    // Check for existing paid payment for idempotency
    $existingPaid = $payments->findOne(['booking_id' => $bookingOid, 'status' => 'paid']);
    if ($existingPaid) {
        $existingId = (string)$existingPaid['_id'];
        $bookingOidStr = (string)$bookingOid;
        logPayment("ℹ️ Existing paid payment found for booking " . $bookingOidStr . ": " . $existingId);
        echo json_encode([
            'success' => true,
            'message' => 'Payment already recorded',
            'payment_id' => $existingId,
            'transaction_id' => $existingPaid['transaction_id'] ?? null,
            'booking_id' => $input['booking_id']
        ]);
        exit;
    }

    // Validate payment amount against booking fare (if available)
    if (isset($booking['fare'])) {
        $expected = floatval($booking['fare']);
        $provided = floatval($input['payment_amount']);
        if (abs($expected - $provided) > 0.01) {
            throw new Exception('Payment amount does not match booking fare');
        }
    }

    // Use a client session and transaction where available for atomicity
    $client = $config['client'] ?? null;
    $useTransaction = false;
    $session = null;
    if ($client && method_exists($client, 'startSession')) {
        try {
            $session = $client->startSession();
        } catch (Exception $e) {
            logPayment("ℹ️ MongoDB sessions/transactions not available: " . $e->getMessage());
            $session = null;
        }
    }

    if ($session) {
        try {
            $session->startTransaction();
            $useTransaction = true;

            $insertResult = $payments->insertOne($paymentDoc, ['session' => $session]);
            if ($insertResult->getInsertedCount() !== 1) {
                $session->abortTransaction();
                throw new Exception('Failed to record payment');
            }
            $paymentId = (string)$insertResult->getInsertedId();

            $updateResult = $bookings->updateOne(
                ['_id' => $bookingOid],
                ['$set' => [
                    'status' => 'confirmed',
                    'payment_id' => new MongoDB\BSON\ObjectId($paymentId),
                    'confirmed_at' => new MongoDB\BSON\UTCDateTime()
                ]],
                ['session' => $session]
            );

            if ($updateResult->getModifiedCount() === 0 && $updateResult->getMatchedCount() === 0) {
                $session->abortTransaction();
                throw new Exception('Failed to update booking status');
            }

            $session->commitTransaction();
            logPayment("✅ Payment recorded: {$paymentId} (TXN: {$paymentDoc['transaction_id']})");
        } catch (Exception $e) {
            if (isset($session)) {
                try { $session->abortTransaction(); } catch (Exception $_) {}
            }
            // If transaction failed for any reason, fall back to non-transactional flow
            logPayment("⚠️ Transactional payment failed, falling back: " . $e->getMessage());
            $useTransaction = false;
        }
    }

    // Fallback if transactions not available or transactional flow failed
    if (!$useTransaction) {
        $insertResult = $payments->insertOne($paymentDoc);
        if ($insertResult->getInsertedCount() !== 1) {
            throw new Exception('Failed to record payment');
        }
        $paymentId = (string)$insertResult->getInsertedId();
        logPayment("✅ Payment recorded: $paymentId (TXN: {$paymentDoc['transaction_id']})");

        $updateResult = $bookings->updateOne(
            ['_id' => $bookingOid],
            ['$set' => [
                'status' => 'confirmed',
                'payment_id' => new MongoDB\BSON\ObjectId($paymentId),
                'confirmed_at' => new MongoDB\BSON\UTCDateTime()
            ]]
        );

        if ($updateResult->getModifiedCount() === 0 && $updateResult->getMatchedCount() === 0) {
            // Compensating action: remove inserted payment to avoid orphaned payment
            try { $payments->deleteOne(['_id' => new MongoDB\BSON\ObjectId($paymentId)]); } catch (Exception $_) {}
            throw new Exception('Failed to update booking status after payment');
        }
    }
    
    if ($updateResult->getModifiedCount() > 0) {
        logPayment("✅ Booking status updated to confirmed");
    } else {
        logPayment("⚠️ Booking status not updated (may already be confirmed)");
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Payment recorded and booking confirmed',
        'payment_id' => $paymentId,
        'transaction_id' => $paymentDoc['transaction_id'],
        'booking_id' => $input['booking_id']
    ]);
    
} catch (Exception $e) {
    logPayment("❌ Error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>