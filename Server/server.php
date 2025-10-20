<?php
/**
 * Server entry point
 * 
 * This file sets up a basic PHP server, loads environment variables,
 * and simulates database connection details.
 */

// Load Composer's autoloader if you’re using libraries like vlucas/phpdotenv
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Get environment variables
$PORT = $_ENV['PORT'];
$URI = $_ENV['LOCALHOST'];

// Set header to handle JSON requests
header("Content-Type: application/json");

// Simple route handling example
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Basic routing (you can extend this)
if ($requestUri === '/api' && $requestMethod === 'GET') {
    echo json_encode([
        "message" => "Server is running on port $PORT",
        "database" => "Connected at $URI"
    ]);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Endpoint not found"]);
}

// Optional: message to console (in CLI)
if (php_sapi_name() === 'cli-server') {
    echo "Server is running on port $PORT\n";
    echo "Database connected at $URI\n";
}
?>
