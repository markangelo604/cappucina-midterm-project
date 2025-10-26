<?php
// Booking Configuration File

$page_title = "My Bookings - MerryLift";

// Nav Items
$nav_items = [
   ['name' => 'Home', 'url' => 'index.php', 'active' => false],
   ['name' => 'Find Rides', 'url' => '#', 'active' => false],
   ['name' => 'Bookings', 'url' => 'booking.php', 'active' => true],
   ['name' => 'Find My Trip', 'url' => 'about.php', 'active' => false]
];

// Sample bookings data
$bookings = [
    [
        'id' => '#12345',
        'status' => 'Confirmed',
        'status_class' => 'confirmed',
        'driver_name' => 'Juan Dela Cruz',
        'driver_initials' => 'JD',
        'driver_color' => '#4A90E2',
        'rating' => 4.8,
        'total_ratings' => '27 rates',
        'pickup' => 'Quezon City - UP Diliman',
        'destination' => 'Makati - Ayala Avenue',
        'date' => '7:30 AM - Oct 25, 2025',
        'passengers' => '1 seat booked',
        'payment_status' => 'Paid',
        'price' => '₱150'
    ],
    [
        'id' => '#12346',
        'status' => 'Completed',
        'status_class' => 'completed',
        'driver_name' => 'Maria Santos',
        'driver_initials' => 'MS',
        'driver_color' => '#7B68EE',
        'rating' => 4.9,
        'total_ratings' => '42 rates',
        'pickup' => 'Quezon City - Commonwealth',
        'destination' => 'Makati - BGC',
        'date' => '8:00 AM - Oct 20, 2025',
        'passengers' => '1 seat booked',
        'payment_status' => 'Ride completed',
        'price' => '₱180'
    ],
    [
        'id' => '#12347',
        'status' => 'Cancelled',
        'status_class' => 'cancelled',
        'driver_name' => 'Roberto Cruz',
        'driver_initials' => 'RC',
        'driver_color' => '#E74C3C',
        'rating' => 4.6,
        'total_ratings' => '18 rates',
        'pickup' => 'Quezon City - Cubao',
        'destination' => 'Makati - Salcedo Village',
        'date' => '7:00 AM - Oct 18, 2025',
        'passengers' => '1 seat booked',
        'payment_status' => 'Refunded',
        'cancel_reason' => 'Cancelled by driver',
        'price' => '₱140'
    ]
];
$footer_links = [
    'Company' => ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support' => ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links' => ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
];
?>