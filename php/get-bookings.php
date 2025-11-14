<?php
/**
 * Get Bookings Endpoint
 * Fetches bookings for a specific user from MongoDB
 * NOW WITH COMPLETED STATUS SUPPORT
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
    $sessionName = $_GET['name'] ?? ($_SESSION['name'] ?? '');
    $bookings = $bookingsCollection->find([
        '$or' => [
            ['passenger_username' => $username],
            ['passenger_username' => $sessionName],
        ]
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
        
        // Determine booking status based on both booking and ride status
        $bookingStatus = $booking['status'];
        $rideStatus = $ride['ride_status'] ?? 'upcoming';
        
        // If ride is completed, mark booking as completed too
        if ($rideStatus === 'completed' && $bookingStatus !== 'cancelled') {
            $bookingStatus = 'completed';
        }
        
        // Determine status class for UI
        $statusClass = strtolower($bookingStatus);
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
        
        // Determine payment/ride status message
        $paymentStatus = 'Pending';
        if ($bookingStatus === 'completed') {
            $paymentStatus = 'Ride completed';
        } elseif ($bookingStatus === 'cancelled') {
            $paymentStatus = 'Refunded';
        } elseif ($bookingStatus === 'confirmed' || $bookingStatus === 'pending') {
            $paymentStatus = ucfirst($bookingStatus);
        }
        
        // Format booking data
        $formattedBooking = [
            'id' => '#' . substr((string)$booking['_id'], -5),
            'booking_id' => (string)$booking['_id'],
            'ride_id' => (string)$booking['ride_id'],
            'status' => ucfirst($bookingStatus),
            'status_class' => $statusClass,
            'driver_name' => $driverName,
            'driver_username' => $booking['driver_username'],
            'driver_initials' => $initials,
            'driver_color' => $driverColor,
            'rating' => $rating,
            'total_ratings' => $totalRatings,
            'pickup' => $ride['from'] ?? 'N/A',
            'destination' => $ride['to'] ?? 'N/A',
            'date' => formatDateTime($ride['time'] ?? '', $ride['date'] ?? ''),
            'passengers' => '1 seat booked', // You can enhance this based on actual booking
            'payment_status' => $paymentStatus,
            'price' => formatPrice($booking['fare'] ?? 0),
            'plate_number' => $booking['plate_number'] ?? ($ride['plate_number'] ?? 'N/A')
        ];
        
        // Add cancellation info if cancelled
        if ($bookingStatus === 'cancelled') {
            $formattedBooking['cancel_reason'] = $booking['cancel_reason'] ?? 'Cancelled by user';
        }
        
        // Add completion timestamp if available
        if ($bookingStatus === 'completed') {
            if (isset($booking['completed_at'])) {
                $formattedBooking['completed_at'] = $booking['completed_at']->toDateTime()->format('Y-m-d H:i:s');
            } elseif (isset($ride['completed_at'])) {
                $formattedBooking['completed_at'] = $ride['completed_at']->toDateTime()->format('Y-m-d H:i:s');
            }
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