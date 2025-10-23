<?php
// Set Title and site name
$site_title = "Merrylift Homepage";
$site_name = "Merrylift";

// Nav Items ; the # is the link to our pages
$nav_items = [
   ['name' => 'Home', 'url' => '#', 'active' => true],
   ['name' => 'Find Rides', 'url' => '#', 'active' => false],
   ['name' => 'Bookings', 'url' => '#', 'active' => false],
   ['name' => 'About', 'url' => 'about.php', 'active' => false]
];

// Hero Section
$features = [
    [
        'title' => 'Save Big.',
        'description' => 'Share rides, split costs—pay up to 70% less than solo commuting.',
    ],
    [
        'title' => 'Go Green.',
        'description' => 'One full car = 4 fewer cars on the road. Reduce your carbon footprint.', 
    ],
    [
        'title' => 'Ride Safe.',
        'description' => 'Verified students & faculty only. Real-time tracking. Campus-approved.', 
    ]
];

// Why Choose features
$why_choose = [
    [
        'title' => 'Safe & Secure',
        'description' => 'All drivers are verified with background checks. Your safety is our top priority with 24/7 support.'
    ],
    [
        'title' => 'Easy Booking',
        'description' => 'Book your ride in just a few clicks. Simple, fast, and hassle-free reservation process.'
    ],
    [
        'title' => 'Flexible Schedule',
        'description' => 'Find rides that match your schedule. Travel at your convenience with multiple options available.'
    ]
];

// Sample available rides data
$available_rides = [
    [
        'image' => '../images/campus-bg-login.png',
        'driver' => 'Manong Driver',
        'rating' => 4.5,
        'reviews' => 102,
        'price' => 'Dhaka, Cafe',
        'pickup' => 'Somewhere there',
        'destination' => 'Somewhere here'
    ],
    [
        'image' => '../images/campus-bg-login.png',
        'driver' => 'Manong Driver',
        'rating' => 4.5,
        'reviews' => 102,
        'price' => 'Dhaka, Cafe',
        'pickup' => 'Somewhere there',
        'destination' => 'Somewhere here'
    ],
    [
        'image' => '../images/campus-bg-login.png',
        'driver' => 'Manong Driver',
        'rating' => 4.5,
        'reviews' => 102,
        'price' => 'Dhaka, Cafe',
        'pickup' => 'Somewhere there',
        'destination' => 'Somewhere here'
    ]
];

// How it works steps
$steps = [
    [
        'number' => '1',
        'title' => 'Create Account',
        'description' => 'Sign up for free and complete your profile with basic information.'
    ],
    [
        'number' => '2',
        'title' => 'Search Rides',
        'description' => 'Enter your destination and find available rides that match your route.'
    ],
    [
        'number' => '3',
        'title' => 'Book & Pay',
        'description' => 'Select your preferred ride and make secure payment through our platform.'
    ],
    [
        'number' => '4',
        'title' => 'Enjoy Trip',
        'description' => 'Meet your driver at the pickup point and enjoy a comfortable journey.'
    ]
];

// Footer links
$footer_links = [
    'Company' => ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support' => ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links' => ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
];

// Stats
$stats = [
    ['number' => '50K+', 'label' => 'Active Users'],
    ['number' => '50K+', 'label' => 'Active Users'],
    ['number' => '50K+', 'label' => 'Active Users'],
    ['number' => '50K+', 'label' => 'Active Users']
];

// Handle form submission ; I just Ai this part needed to be study huhu
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pickup = htmlspecialchars($_POST['pickup'] ?? '');
    $destination = htmlspecialchars($_POST['destination'] ?? '');
    $date = htmlspecialchars($_POST['date'] ?? '');
    $passengers = htmlspecialchars($_POST['passengers'] ?? '');
    
    // Process the search (you can add database queries here)
    // For now, we'll just store in session or redirect
}

?>