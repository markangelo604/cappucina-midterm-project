<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/server.php';
require_once __DIR__ . '/../vendor/autoload.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in.'
    ]);
    exit;
}

try {
    $username = $_SESSION['username'];
    $role = $_SESSION['role'];
    
    $bookingsCollection = $db->bookings;
    $ridesCollection = $db->rides;
    $usersCollection = $db->users;
    
    // Query based on user role
    if ($role === 'passenger') {
        $query = ['passenger_username' => $username];
    } elseif ($role === 'car_owner' || $role === 'driver') {
        $query = ['driver_username' => $username];
    } else {
        throw new Exception('Invalid user role');
    }
    
    // Get filter from query params
    $filter = $_GET['filter'] ?? 'all';
    
    if ($filter !== 'all') {
        $query['status'] = $filter;
    }
    
    // Fetch bookings
    $bookings = $bookingsCollection->find($query, [
        'sort' => ['created_at' => -1]
    ])->toArray();
    
    $formattedBookings = [];
    
    foreach ($bookings as $booking) {
        // Get ride details
        $ride = $ridesCollection->findOne(['_id' => $booking['ride_id']]);
        
        // Get driver details
        $driver = $usersCollection->findOne(['username' => $booking['driver_username']]);
        
        // Get passenger details (if car owner viewing)
        $passenger = null;
        if ($role !== 'passenger') {
            $passenger = $usersCollection->findOne(['username' => $booking['passenger_username']]);
        }
        
        // Calculate driver initials and color
        $driverName = $driver['profile']['name'] ?? $booking['driver_username'];
        $driverInitials = getInitials($driverName);
        $driverColor = generateColor($driverName);
        
        // Format booking
        $formattedBooking = [
            'id' => '#' . substr((string)$booking['_id'], -5),
            'booking_id' => (string)$booking['_id'],
            'status' => ucfirst($booking['status']),
            'status_class' => strtolower($booking['status']),
            'driver_name' => $driverName,
            'driver_initials' => $driverInitials,
            'driver_color' => $driverColor,
            'rating' => $driver['ratings'][0]['Average_rating'] ?? 0,
            'total_ratings' => count($driver['ratings'][0]['Comments'] ?? []) . ' rates',
            'pickup' => $ride['from'] ?? 'N/A',
            'destination' => $ride['to'] ?? 'N/A',
            'date' => formatDateTime($ride['time'] ?? '00:00', $booking['date']),
            'passengers' => '1 seat booked',
            'payment_status' => ucfirst($booking['status']),
            'price' => '₱' . number_format($booking['fare'], 2)
        ];
        
        // Add passenger info if viewing as driver
        if ($passenger) {
            $formattedBooking['passenger_name'] = $passenger['profile']['name'] ?? $booking['passenger_username'];
            $formattedBooking['passenger_phone'] = $passenger['profile']['phone'] ?? 'N/A';
        }
        
        $formattedBookings[] = $formattedBooking;
    }
    
    echo json_encode([
        'success' => true,
        'bookings' => $formattedBookings,                             
        'count' => count($formattedBookings)
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching bookings: ' . $e->getMessage()
    ]);
}

function getInitials($name) {
    $parts = explode(' ', $name);
    if (count($parts) >= 2) {
        return strtoupper(substr($parts[0], 0, 1) . substr($parts[1], 0, 1));
    }
    return strtoupper(substr($name, 0, 2));
}

function generateColor($str) {
    $colors = ['#4A90E2', '#7B68EE', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'];
    $hash = array_sum(array_map('ord', str_split($str)));
    return $colors[$hash % count($colors)];
}

function formatDateTime($time, $date) {
    try {
        $dateTime = new DateTime($date);
        return $time . ' - ' . $dateTime->format('M d, Y');
    } catch (Exception $e) {
        return $time . ' - ' . $date;
    }
}
?>