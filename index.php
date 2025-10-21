<?php
// Set Title and site name
$site_title = "Merrylift Homepage";
$site_name = "Merrylift";

// Nav Items ; the # is the link to our pages
$nav_items = [
   ['name' => 'Home', 'url' => '#', 'active' => true],
   ['name' => 'Find Rides', 'url' => '#', 'active' => false],
   ['name' => 'Bookings', 'url' => '#', 'active' => false],
   ['name' => 'About', 'url' => '#', 'active' => false]
];

// Hero Section
$features = [
    [
        'title' => 'Lorem Ipsum dolor sit amet.',
        'description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod.',
    ],
    [
        'title' => 'Lorem Ipsum dolor sit amet.',
        'description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod.', 
    ],
    [
        'title' => 'Lorem Ipsum dolor sit amet.',
        'description' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod.', 
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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $site_title; ?></title>
    <link rel="stylesheet" href="css/index.css">
</head>
<body>
    
    <!-- Navigation Bar -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-content">
                <div class="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#FFC107"/>
                        <path d="M10 20C10 18 12 16 15 16H25C28 16 30 18 30 20V26H10V20Z" fill="#333"/>
                        <circle cx="14" cy="28" r="2" fill="#333"/>
                        <circle cx="26" cy="28" r="2" fill="#333"/>
                        <path d="M12 20H18V16H12V20Z" fill="#555"/>
                        <path d="M22 20H28V16H22V20Z" fill="#555"/>
                    </svg>
                </div>
            <ul class="nav-menu">
                <?php foreach ($nav_items as $items): ?>
                    <li>
                        <a href="<?php echo $items['url']; ?>" 
                        class="<?php echo $items['active'] ? 'active' : ''; ?>">
                        <?php echo $items['name']; ?>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
                <div class="nav-buttons">
                        <a class="btn-Outline" href="html/login.html">Sign In</a>
                        <button class="btn-primary">Join Now</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
     <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1 class="hero-title">
                        Lorem, ipsum. <br>
                        <span class="highlight">Inspirational.</span>
                    </h1>
                    <div class="feature-list">
                            <?php foreach ($features as $feature): ?>
                                <div class="feature-item">
                                    <div class="feature-icon"></div>
                                    <div class="feature-text">
                                        <h3><?php echo $feature['title']; ?></h3>
                                        <p><?php echo $feature['description']; ?></p>
                                    </div>
                                </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="../images/campus-bg-login.png" alt="Hero Image">
                </div>

            </div>
        </div>
     </section>

    <!-- Search Section -->
    <section class="search-section">
        <div class="container">
            <div class="search-card">
                <h2 class="search-title">Find Your Perfect Ride</h2>
                <p class="search-subtitle">Search available rides to your destination</p>
                <form class="search-form" method="POST" action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>">
                    <div class="form-group">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="6" r="2"/>
                                <path d="M8 0C5.2 0 3 2.2 3 5c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            Pickup
                        </label>
                        <input type="text" name="pickup" placeholder="Dito" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="6" r="2"/>
                                <path d="M8 0C5.2 0 3 2.2 3 5c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            Destination
                        </label>
                        <input type="text" name="destination" placeholder="Dito" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
                                <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/>
                                <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" stroke-width="1.5"/>
                                <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            Date
                        </label>
                        <input type="date" name="date" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="5" cy="8" r="2"/>
                                <circle cx="11" cy="8" r="2"/>
                            </svg>
                            Passengers
                        </label>
                        <input type="number" name="passengers" placeholder="1" min="1" max="8" class="form-input" required>
                    </div>
                    <button type="submit" class="btn-search">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
                            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Search
                    </button>
                </form>
            </div>
        </div>
    </section>

     <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="stats-grid">
                <?php foreach ($stats as $stat): ?>
                    <div class="stat-card">
                        <svg class="stat-icon" width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
                            <circle cx="18" cy="14" r="6"/>
                            <circle cx="30" cy="14" r="6"/>
                            <path d="M12 32c0-4 4-8 12-8s12 4 12 8v8H12v-8z"/>
                        </svg>
                        <h3 class="stat-number"><?php echo $stat['number']; ?></h3>
                        <p class="stat-label"><?php echo $stat['label']; ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    < <!-- Why Choose Section -->
    <section class="why-choose-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Why Choose MerryLift?</h2>
                <p class="section-subtitle">Your trusted carpooling platform in the Philippines. Share rides, save money, and build community through travel.</p>
            </div>
            <div class="features-grid">
                <?php foreach ($why_choose as $feature): ?>
                    <div class="feature-card">
                        <h3><?php echo $feature['title']; ?></h3>
                        <p><?php echo $feature['description']; ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Available Rides Section -->
    <section class="available-rides-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Available Rides</h2>
            </div>
            <div class="rides-grid">
                <?php foreach ($available_rides as $ride): ?>
                    <div class="ride-card">
                        <img src="<?php echo $ride['image']; ?>" alt="Ride" class="ride-image">
                        <div class="ride-content">
                            <h3 class="ride-driver"><?php echo $ride['driver']; ?></h3>
                            <div class="ride-rating">
                                <div class="stars">
                                    <?php for($i = 0; $i < 5; $i++): ?>
                                        <span class="star">★</span>
                                    <?php endfor; ?>
                                </div>
                                <span class="rating-count"><?php echo $ride['reviews']; ?></span>
                            </div>
                            <div class="ride-price">$ • <?php echo $ride['price']; ?></div>
                            <div class="ride-details">
                                <div class="ride-location">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <circle cx="8" cy="6" r="2"/>
                                        <path d="M8 0C5.2 0 3 2.2 3 5c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                                    </svg>
                                    <span class="location-text">Pickup: <?php echo $ride['pickup']; ?></span>
                                </div>
                                <div class="ride-location">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 0v16M4 12l4 4 4-4"/>
                                    </svg>
                                    <span class="location-text">Destination: <?php echo $ride['destination']; ?></span>
                                </div>
                            </div>
                            <button class="btn-book-ride">Book Ride</button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="how-it-works-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">How It Works</h2>
                <p class="section-subtitle">Get started with MerryLift in just 4 simple steps</p>
            </div>
            <div class="steps-grid">
                <?php foreach ($steps as $step): ?>
                    <div class="step-card">
                        <div class="step-number"><?php echo $step['number']; ?></div>
                        <h3><?php echo $step['title']; ?></h3>
                        <p><?php echo $step['description']; ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>


     <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>MerryLift</h3>
                    <p>Your trusted carpooling platform in the Philippines. Share rides, save money, and build community through travel.</p>
                    <div class="footer-social">
                        <div class="social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </div>
                        <div class="social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </div>
                        <div class="social-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <?php foreach ($footer_links as $category => $links): ?>
                    <div class="footer-links">
                        <h4><?php echo $category; ?></h4>
                        <ul>
                            <?php foreach ($links as $link): ?>
                                <li><a href="#"><?php echo $link; ?></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?php echo date("Y"); ?> MerryLift. All Rights Reserved.</p>
            </div>
        </div>
    </footer>

</body>
</html>