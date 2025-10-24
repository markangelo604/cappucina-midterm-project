<?php
// about-config.php - Configuration file for About page

// Set Title and site name
$site_title = "About MerryLift";
$site_name = "Merrylift";

// Nav Items
$nav_items = [
   ['name' => 'Home', 'url' => 'index.php', 'active' => false],
   ['name' => 'Find Rides', 'url' => '#', 'active' => false],
   ['name' => 'Bookings', 'url' => '#', 'active' => false],
   ['name' => 'About', 'url' => 'about.php', 'active' => true]
];

// Stats for About page
$about_stats = [
    ['number' => '50K', 'label' => 'Active Users'],
    ['number' => '100K+', 'label' => 'Completed Rides'],
    ['number' => '50K', 'label' => 'KM'],
    ['number' => '₱2M+', 'label' => 'Money Saved']
];

// Team members
$team_members = [
    [
        'name' => 'Javier, Charles Louis',
        'role' => 'CEO & Founder',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Domalanta, Mark Angelo',
        'role' => 'CTO',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Beset, Sam Raleigh',
        'role' => 'Head of Operations',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Damocles, Jheezren',
        'role' => 'Lead Developer',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Bautista, Josh Marcus',
        'role' => 'CEO & Founder',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Contillo, Daniel Roi',
        'role' => 'CTO',
        'image' => 'images/charles.jpg'
    ],
    [
        'name' => 'Manaois, John Michael',
        'role' => 'Head of Operations',
        'image' => 'images/charles.jpg'
    ]
];

// Footer links
$footer_links = [
    'Company' => ['About Us', 'How It Works', 'Careers', 'Press'],
    'Support' => ['Help Center', 'Safety', 'Contact Us', 'Trust & Safety'],
    'Quick Links' => ['Find Rides', 'Offer Ride', 'My Bookings', 'Trip History']
];

// Current year for footer
$current_year = date("Y");
?>