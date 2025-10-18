<?php
// Autoload dependencies (requires Composer with vlucas/phpdotenv installed)
require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env file
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Get PORT and LOCALHOST from env
$port = $_ENV['PORT'] ?? 8000;
$uri = $_ENV['LOCALHOST'] ?? 'localhost';

// Display server and DB connection info
echo "Server is running on port {$port}\n";
echo "Database connected at {$uri}\n";

// Start built-in PHP web server (manual)
echo "To start the PHP server, run the following in terminal:\n";
echo "php -S {$uri}:{$port} server.php\n";
