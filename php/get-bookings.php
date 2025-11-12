<?php
/**
 * Get Bookings Endpoint
 * Fetches bookings for a specific user from MongoDB
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/server.php';

try {
    // Get user from session or query parameter
    session_start();
    
    // For testing, you can pass username as query parameter
    // In production, this should come from authenticated session
    $username = $_GET['username'] ?? $_SESSION['username'] ?? null;
    
    if (!$username) {
        echo json_encode([
            'success' => false,
            'message' => 'User not authenticated',
            'bookings' => []
        ]);
        exit;
    }
    
    // Get database connection
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    
    // Fetch bookings for the user
    $bookingsCollection = $db->bookings;
    $usersCollection = $db->users;
    $ridesCollection = $db->rides;
    
    // Find all bookings for this passenger
    $bookings = $bookingsCollection->find([
        'passenger_username' => $username
    ])->toArray();
    
    $formattedBookings = [];
    
    foreach ($bookings as $booking) {
        // Get ride details
        $ride = $ridesCollection->findOne([
            '_id' => $booking['ride_id']
        ]);
        
        if (!$ride) {
            continue; // Skip if ride not found
        }
        
        // Get driver details
        $driver = $usersCollection->findOne([
            'username' => $booking['driver_username']
        ]);
        
        if (!$driver) {
            continue; // Skip if driver not found
        }
        
        // Calculate driver initials
        $driverName = $driver['profile']['name'] ?? $booking['driver_username'];
        $nameParts = explode(' ', $driverName);
        $initials = '';
        foreach ($nameParts as $part) {
            if (!empty($part)) {
                $initials .= strtoupper($part[0]);
            }
        }
        $initials = substr($initials, 0, 2); // Max 2 letters
        
        // Generate random color for avatar (you can store this in user profile)
        $colors = ['#4A90E2', '#7B68EE', '#E74C3C', '#4CAF50', '#FF9800', '#9C27B0'];
        $colorIndex = ord($initials[0] ?? 'A') % count($colors);
        $driverColor = $colors[$colorIndex];
        
        // Determine status class
        $statusClass = strtolower($booking['status']);
        if ($statusClass === 'pending') {
            $statusClass = 'confirmed';
        }
        
        // Get average rating for driver (simplified - you may want to calculate this)
        $rating = 4.5; // Default rating
        $totalRatings = '0 rates';
        
        if (isset($driver['ratings']) && is_array($driver['ratings'])) {
            foreach ($driver['ratings'] as $ratingData) {
                if (isset($ratingData['Average_rating'])) {
                    $rating = $ratingData['Average_rating'];
                }
                if (isset($ratingData['Comments']) && is_array($ratingData['Comments'])) {
                    $totalRatings = count($ratingData['Comments']) . ' rates';
                }
            }
        }
        
        // Format booking data
        $formattedBooking = [
            'id' => '#' . substr((string)$booking['_id'], -5),
            'status' => ucfirst($booking['status']),
            'status_class' => $statusClass,
            'driver_name' => $driverName,
            'driver_initials' => $initials,
            'driver_color' => $driverColor,
            'rating' => $rating,
            'total_ratings' => $totalRatings,
            'pickup' => $ride['from'] ?? 'N/A',
            'destination' => $ride['to'] ?? 'N/A',
            'date' => formatDateTime($ride['time'] ?? '', $ride['date'] ?? ''),
            'passengers' => '1 seat booked', // You can enhance this based on actual booking
            'payment_status' => $booking['status'] === 'completed' ? 'Ride completed' : ucfirst($booking['status']),
            'price' => formatPrice($booking['fare'] ?? 0)
        ];
        
        // Add cancellation info if cancelled
        if ($booking['status'] === 'cancelled') {
            $formattedBooking['cancel_reason'] = $booking['cancel_reason'] ?? 'Cancelled by user';
            $formattedBooking['payment_status'] = 'Refunded';
        }
        
        $formattedBookings[] = $formattedBooking;
    }
    
    // Sort bookings by date (most recent first)
    usort($formattedBookings, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    echo json_encode([
        'success' => true,
        'message' => 'Bookings fetched successfully',
        'bookings' => $formattedBookings,
        'count' => count($formattedBookings)
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'bookings' => []
    ], JSON_PRETTY_PRINT);
}

// Helper function to format date and time
function formatDateTime($time, $date) {
    if (empty($time) || empty($date)) {
        return 'N/A';
    }
    
    try {
        $dateObj = new DateTime($date);
        $formattedDate = $dateObj->format('M d, Y');
        return $time . ' - ' . $formattedDate;
    } catch (Exception $e) {
        return 'N/A';
    }
}

// Helper function to format price
function formatPrice($fare) {
    if (empty($fare)) {
        return '₱0.00';
    }
    
    if (is_numeric($fare)) {
        return '₱' . number_format($fare, 2);
    }
    
    return $fare;
}
?>