<?php
// server.php
// ===============================================
// PURPOSE:
//  • Loads environment variables from .env
//  • Connects to MongoDB
//  • Exports the connection and database handle
//  • Can be included by other PHP files
// ===============================================

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use MongoDB\Client;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Retrieve environment variables
$mongoUri   = $_ENV['LOCALHOST'];
$database   = $_ENV['DATABASE'];

// Create MongoDB client connection
try {
    $client = new Client($mongoUri);

    // Select database
    $db = $client->selectDatabase($database);

    // Optionally, collections
    $usersCollection     = $db->selectCollection($_ENV['USERCOLLECTION']);
    $ridesCollection     = $db->selectCollection($_ENV['RIDESCOLLECTION']);
    $bookingsCollection  = $db->selectCollection($_ENV['BOOKINGSCOLLECTION']);
    $reviewsCollection   = $db->selectCollection($_ENV['REVIEWSCOLLECTION']);

} catch (Exception $e) {
    die('Error connecting to MongoDB: ' . $e->getMessage());
}

// Export these variables for use in other PHP files
return [
    'client' => $client,
    'db' => $db,
    'users' => $usersCollection,
    'rides' => $ridesCollection,
    'bookings' => $bookingsCollection,
    'reviews' => $reviewsCollection,
];
