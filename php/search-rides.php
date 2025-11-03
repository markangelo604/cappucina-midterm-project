<?php
/**
 * Search Rides Endpoint
 * Handles both search with filters and viewing all available rides
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../Server/Models/user-model.php';

try {
    // Check if search parameters are provided
    $hasFilters = false;
    $filters = [];

    // Get filters from query parameters (GET) or POST data
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!empty($_GET['pickup']) || !empty($_GET['from'])) {
            $filters['from'] = $_GET['pickup'] ?? $_GET['from'] ?? '';
            $hasFilters = true;
        }
        if (!empty($_GET['destination']) || !empty($_GET['to'])) {
            $filters['destination'] = $_GET['destination'] ?? $_GET['to'] ?? '';
            $hasFilters = true;
        }
        if (!empty($_GET['date'])) {
            $filters['date'] = $_GET['date'];
            $hasFilters = true;
        }
        if (!empty($_GET['passengers'])) {
            $filters['min_seats'] = intval($_GET['passengers']);
            $hasFilters = true;
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $postData = json_decode(file_get_contents('php://input'), true);
        if (!empty($postData['pickup']) || !empty($postData['from'])) {
            $filters['from'] = $postData['pickup'] ?? $postData['from'] ?? '';
            $hasFilters = true;
        }
        if (!empty($postData['destination']) || !empty($postData['to'])) {
            $filters['destination'] = $postData['destination'] ?? $postData['to'] ?? '';
            $hasFilters = true;
        }
        if (!empty($postData['date'])) {
            $filters['date'] = $postData['date'];
            $hasFilters = true;
        }
        if (!empty($postData['passengers'])) {
            $filters['min_seats'] = intval($postData['passengers']);
            $hasFilters = true;
        }
    }

    // Call appropriate function
    if ($hasFilters) {
        // Search with filters
        $result = searchAvailableRides($filters);
    } else {
        // View all available rides
        $result = viewAllAvailableRides();
    }

    if ($result['success']) {
        // Format rides for frontend
        $formattedRides = [];
        
        foreach ($result['rides'] as $ride) {
            // Match the exact structure from viewAllAvailableRides()
            $formattedRide = [
                '_id' => $ride['ride_id'] ?? '',
                'id' => $ride['ride_id'] ?? '',
                
                // Driver information
                'name' => $ride['driver']['name'] ?? 'Unknown Driver',
                'username' => $ride['driver']['name'] ?? 'Unknown Driver',
                'driver_phone' => $ride['driver']['phone'] ?? 'N/A',
                'driver_email' => $ride['driver']['email'] ?? 'N/A',
                
                // Location and time - matching viewAllAvailableRides() field names
                'pickup_location' => $ride['starting_point'] ?? 'N/A',
                'destination_location' => $ride['destination'] ?? 'N/A',
                'from' => $ride['starting_point'] ?? 'N/A',
                'to' => $ride['destination'] ?? 'N/A',
                'starting_point' => $ride['starting_point'] ?? 'N/A',
                'destination' => $ride['destination'] ?? 'N/A',
                
                // Date and time
                'trip_date' => $ride['date'] ?? 'N/A',
                'date' => $ride['date'] ?? 'N/A',
                'departure_time' => $ride['time'] ?? 'N/A',
                'time' => $ride['time'] ?? 'N/A',
                'arrival_time' => calculateArrivalTime(
                    $ride['time'] ?? '00:00',
                    $ride['route']['estimated_duration_mins'] ?? 0
                ),
                
                // Pricing and seats
                'price' => formatPrice($ride['fare'] ?? 0),
                'fare' => formatPrice($ride['fare'] ?? 0),
                'available_seats' => $ride['seat_available'] ?? 0,
                'seat_available' => $ride['seat_available'] ?? 0,
                
                // ETA and route
                'eta' => formatETA($ride['route']['estimated_duration_mins'] ?? null),
                'route' => [
                    'stops' => $ride['route']['stops'] ?? [],
                    'distance_km' => $ride['route']['distance_km'] ?? null,
                    'estimated_duration_mins' => $ride['route']['estimated_duration_mins'] ?? null
                ],
                
                // Car details
                'car_details' => [
                    'model' => 'Standard Vehicle',
                    'seats' => $ride['seat_available'] ?? 4
                ],
                
                // Ratings
                'ratings' => [
                    'average' => 0
                ]
            ];
            
            // Filter by minimum seats if specified
            if (isset($filters['min_seats'])) {
                if ($formattedRide['available_seats'] >= $filters['min_seats']) {
                    $formattedRides[] = $formattedRide;
                }
            } else {
                $formattedRides[] = $formattedRide;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => $result['message'] ?? 'Rides fetched successfully',
            'rides' => $formattedRides,
            'count' => count($formattedRides)
        ], JSON_PRETTY_PRINT);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $result['message'] ?? 'Failed to fetch rides',
            'rides' => []
        ], JSON_PRETTY_PRINT);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'rides' => []
    ], JSON_PRETTY_PRINT);
}

// Helper function to calculate arrival time
function calculateArrivalTime($departureTime, $durationMins) {
    if (empty($departureTime) || empty($durationMins) || $departureTime === 'N/A') {
        return 'N/A';
    }
    
    try {
        // Handle time format HH:MM
        $time = DateTime::createFromFormat('H:i', $departureTime);
        if (!$time) {
            $time = DateTime::createFromFormat('G:i', $departureTime);
        }
        if (!$time) {
            return 'N/A';
        }
        
        $time->add(new DateInterval('PT' . intval($durationMins) . 'M'));
        return $time->format('H:i');
    } catch (Exception $e) {
        return 'N/A';
    }
}

// Helper function to format price
function formatPrice($fare) {
    if (empty($fare) || $fare === 'N/A') {
        return '₱0.00';
    }
    
    // If already formatted, return as is
    if (is_string($fare) && strpos($fare, '₱') !== false) {
        return $fare;
    }
    
    // If numeric, format it
    if (is_numeric($fare)) {
        return '₱' . number_format($fare, 2);
    }
    
    return $fare;
}

// Helper function to format ETA
function formatETA($mins) {
    if (empty($mins) || !is_numeric($mins)) {
        return 'N/A';
    }
    
    $mins = intval($mins);
    $hours = floor($mins / 60);
    $minutes = $mins % 60;
    
    if ($hours > 0) {
        return $hours . 'h ' . $minutes . 'm';
    }
    return $minutes . 'm';
}
?>