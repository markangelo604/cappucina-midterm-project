<?php
// Find Rides Configuration File

$page_title = "Find Rides - MerryLift";

// Nav Items
$nav_items = [
   ['name' => 'Home', 'url' => 'index.php', 'active' => false],
   ['name' => 'Find Rides', 'url' => 'findrides.php', 'active' => true],
   ['name' => 'Bookings', 'url' => 'booking.php', 'active' => false],
   ['name' => 'About', 'url' => 'about.php', 'active' => false]
];

// Safety Features
$safety_features = [
    ['icon' => '🛡️', 'text' => 'Safety First'],
    ['icon' => '📍', 'text' => 'GPS Tracking'],
    ['icon' => '⭐', 'text' => 'Verified Drivers'],
    ['icon' => '💬', 'text' => 'In-App Chat'],
    ['icon' => '🔒', 'text' => 'Secure Payment']
];

// Available Rides Data
$available_rides = [
    [
        'driver_name' => 'Josh Bautista',
        'driver_initials' => 'JB',
        'driver_color' => '#4CAF50',
        'price' => '₱200.00',
        'departure_time' => '18:00',
        'departure_location' => 'Baiuokong',
        'arrival_time' => '18:00',
        'arrival_location' => 'Camp 7',
        'date' => 'Oct 25, 2025',
        'eta' => '25 min',
        'vehicle' => 'SUV',
        'seats' => 5,
        'rating' => 4.8,
        'badge' => 'Book Now!'
    ],
    [
        'driver_name' => 'Josh Bautista',
        'driver_initials' => 'JB',
        'driver_color' => '#4CAF50',
        'price' => '₱200.00',
        'departure_time' => '18:00',
        'departure_location' => 'Baiuokong',
        'arrival_time' => '18:00',
        'arrival_location' => 'Camp 7',
        'date' => 'Oct 25, 2025',
        'eta' => '22 min',
        'vehicle' => 'SUV',
        'seats' => 5,
        'rating' => 4.8,
        'badge' => 'Book Now!'
    ],
    [
        'driver_name' => 'Maria Santos',
        'driver_initials' => 'MS',
        'driver_color' => '#2196F3',
        'price' => '₱180.00',
        'departure_time' => '17:30',
        'departure_location' => 'Quezon City',
        'arrival_time' => '18:15',
        'arrival_location' => 'Makati',
        'date' => 'Oct 25, 2025',
        'eta' => '30 min',
        'vehicle' => 'Sedan',
        'seats' => 4,
        'rating' => 4.9,
        'badge' => 'Popular'
    ]
];

$footer_links = [
    'Company' => ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support' => ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links' => ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
];
?>