<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Server/server.php';

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
    $booking = $bookings->findOne([
        '_id' => new MongoDB\BSON\ObjectId($input['booking_id']),
        'passenger_username' => $input['passenger_username']
    ]);
    
    if (!$booking) {
        throw new Exception('Booking not found for payment');
    }
    
    logPayment("Booking found: " . $input['booking_id']);
    
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
    
    $result = $payments->insertOne($paymentDoc);
    
    if ($result->getInsertedCount() !== 1) {
        throw new Exception('Failed to record payment');
    }
    
    $paymentId = (string)$result->getInsertedId();
    logPayment("✅ Payment recorded: $paymentId (TXN: {$paymentDoc['transaction_id']})");
    
    // ========================================
    // UPDATE BOOKING STATUS TO CONFIRMED
    // ========================================
    $updateResult = $bookings->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($input['booking_id'])],
        ['$set' => [
            'status' => 'confirmed',
            'payment_id' => new MongoDB\BSON\ObjectId($paymentId),
            'confirmed_at' => new MongoDB\BSON\UTCDateTime()
        ]]
    );
    
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