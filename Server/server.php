<?php
// server.php
// ===============================================
// PURPOSE:
//  • Loads environment variables from .env
//  • Connects to MongoDB
//  • Can be used as a library (returns connections) or as a server (starts HTTP server)
// ===============================================

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use MongoDB\Client;
use React\Http\HttpServer;
use React\Http\Message\Response;
use React\EventLoop\Factory;
use Psr\Http\Message\ServerRequestInterface;

$projectRoot = dirname(__DIR__);

// Load environment variables
$dotenv = Dotenv::createImmutable($projectRoot);
$dotenv->load();

$mongoUri  = $_ENV['LOCALHOST'] ?? getenv('LOCALHOST');
$database  = $_ENV['DATABASE'] ?? getenv('DATABASE');
$port      = $_ENV['PORT'] ?? getenv('PORT');

try {
    $client = new Client($mongoUri);
    $db = $client->selectDatabase($database);
    
    $usersCollection     = $db->selectCollection($_ENV['USERCOLLECTION'] ?? getenv('USERCOLLECTION'));
    $ridesCollection     = $db->selectCollection($_ENV['RIDESCOLLECTION'] ?? getenv('RIDESCOLLECTION'));
    $bookingsCollection  = $db->selectCollection($_ENV['BOOKINGSCOLLECTION'] ?? getenv('BOOKINGSCOLLECTION'));
    $reviewsCollection   = $db->selectCollection($_ENV['REVIEWSCOLLECTION'] ?? getenv('REVIEWSCOLLECTION'));

    echo "Connected to MongoDB database '{$database}' successfully.\n";

} catch (Exception $e) {
    die('Error connecting to MongoDB: ' . $e->getMessage());
} 
// Create ReactPHP event loop
$loop = Factory::create();

// Create HTTP server
$server = new HttpServer(function (ServerRequestInterface $request) use ($usersCollection, $ridesCollection) {
    $path = $request->getUri()->getPath();

    // Serve HTML files from Client/html
    if ($path === '/' || str_ends_with($path, '.html')) {
        $filePath = __DIR__ . '/../' . ($path === '/' ? '/index.html' : $path);
        if (file_exists($filePath)) {
            $html = file_get_contents($filePath);
            return new Response(
                200,
                ['Content-Type' => 'text/html'],
                $html
            );
        } else {
            return new Response(404, ['Content-Type' => 'text/plain'], "HTML file not found");
        }
    }

    // Serve CSS, JS, and images from Client folder
    $staticFile = __DIR__ . '/../' . $path;
    if (file_exists($staticFile) && is_file($staticFile)) {
        $ext = pathinfo($staticFile, PATHINFO_EXTENSION);
        $mime = match($ext) {
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'png'  => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'svg'  => 'image/svg+xml',
            default => 'application/octet-stream',
        };

        return new Response(
            200,
            ['Content-Type' => $mime],
            file_get_contents($staticFile)
        );
    }

    // API example
    if ($path === '/users') {
        $users = iterator_to_array($usersCollection->find());
        return new Response(
            200,
            ['Content-Type' => 'application/json'],
            json_encode($users)
        );
    }

    return new Response(404, ['Content-Type' => 'text/plain'], "Not Found");
});

// Listen on specified port
$socket = new React\Socket\SocketServer("0.0.0.0:$port");
$server->listen($socket);

echo "Server running at http://localhost:$port\n";

$loop->run();