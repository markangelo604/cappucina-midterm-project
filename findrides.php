<?php
require_once 'findrides-config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link rel="stylesheet" href="css/findrides.css">
</head>
<body>
    
    <!-- Navigation Bar -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-content">
                <div class="logo">
                    <img src="images/merrylift-transparent.png" alt="Logo">
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
                    <button class="btn-outline">Sign In</button>
                    <button class="btn-primary">Join Now</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Map Section -->
    <section class="map-section">
        <div class="map-container">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123523.12345!2d121.0244!3d14.5995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90264a0f021%3A0x2b063c8c5b6d8c01!2sMetro%20Manila!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style="border:0;"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade">
            </iframe>
            <div class="map-marker"></div>
        </div>
    </section>

    <!-- Search Section -->
    <section class="search-section">
        <div class="container-fluid">
            <form class="search-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Pickup</label>
                        <input type="text" placeholder="Dito" class="form-input" value="Dito">
                    </div>
                    <div class="arrow-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </div>
                    <div class="form-group">
                        <label>Destination</label>
                        <input type="text" placeholder="Dituy" class="form-input" value="Dituy">
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="text" placeholder="mm / dd / yyyy" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Passengers</label>
                        <select class="form-input">
                            <option>5</option>
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-search">Search Ride</button>
                </div>
            </form>
        </div>
    </section>

    <!-- Main Content Section -->
    <section class="main-content">
        <div class="container-fluid">
            <div class="content-wrapper">
                
                <!-- Sidebar -->
                <aside class="sidebar">
                    <div class="safety-card">
                        <?php foreach ($safety_features as $feature): ?>
                        <div class="safety-item">
                            <span class="safety-icon"><?php echo $feature['icon']; ?></span>
                            <span class="safety-text"><?php echo $feature['text']; ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </aside>

                <!-- Rides List -->
                <div class="rides-section">
                    <div class="rides-header">
                        <h2>Available Rides</h2>
                        <button class="btn-filter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 7h18M6 12h12M9 17h6"/>
                            </svg>
                            Filters
                        </button>
                    </div>

                    <div class="filter-chips">
                        <button class="chip active">All Rides</button>
                        <button class="chip">Price: Low to High</button>
                        <button class="chip">Best Rated</button>
                    </div>

                    <div class="rides-list">
                        <?php foreach ($available_rides as $ride): ?>
                        <div class="ride-card">
                            <div class="ride-header">
                                <div class="driver-info">
                                    <div class="driver-avatar" style="background-color: <?php echo $ride['driver_color']; ?>">
                                        <?php echo $ride['driver_initials']; ?>
                                    </div>
                                    <span class="driver-name"><?php echo $ride['driver_name']; ?></span>
                                </div>
                                <div class="ride-price"><?php echo $ride['price']; ?></div>
                            </div>

                            <div class="ride-route">
                                <div class="route-item">
                                    <div class="route-dot pickup"></div>
                                    <div class="route-details">
                                        <span class="route-time"><?php echo $ride['departure_time']; ?></span>
                                        <span class="route-location"><?php echo $ride['departure_location']; ?></span>
                                    </div>
                                </div>
                                <div class="route-line"></div>
                                <div class="route-item">
                                    <div class="route-dot destination"></div>
                                    <div class="route-details">
                                        <span class="route-time"><?php echo $ride['arrival_time']; ?></span>
                                        <span class="route-location"><?php echo $ride['arrival_location']; ?></span>
                                    </div>
                                </div>
                            </div>

                            <div class="ride-meta">
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                    </svg>
                                    <span>8:00 AM • <?php echo $ride['date']; ?></span>
                                </div>
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                    </svg>
                                    <span><?php echo $ride['eta']; ?></span>
                                </div>
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5 11l4-7h6l4 7v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z"/>
                                    </svg>
                                    <span><?php echo $ride['vehicle']; ?></span>
                                </div>
                                <div class="meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                        <circle cx="8.5" cy="7" r="4"/>
                                        <path d="M20 8v6M23 11h-6"/>
                                    </svg>
                                    <span><?php echo $ride['seats']; ?> Seats</span>
                                </div>
                            </div>

                            <?php if (isset($ride['badge'])): ?>
                            <div class="ride-badge"><?php echo $ride['badge']; ?></div>
                            <?php endif; ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>

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
            <div class="footer-bottom">
                <p>&copy; <?php echo date("Y"); ?> MerryLift. All Rights Reserved.</p>
            </div>
        </div>
    </footer>

</body>
</html>