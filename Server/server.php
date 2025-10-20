<?php
/**
 * Server entry point
 * 
 * Connects to MySQL using environment variables.
 * Other files can include this to use $conn.
 */

// Load .env file manually
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set as environment variable
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

// Load .env from project root
loadEnv(dirname(__DIR__) . '/.env');

// Get environment variables with defaults
$PORT = $_ENV['PORT'] ?? 8000;
$DB_HOST = $_ENV['DB_HOST'] ?? 'localhost';
$DB_USER = $_ENV['DB_USER'] ?? 'root';
$DB_PASS = $_ENV['DB_PASS'] ?? '';
$DB_NAME = $_ENV['DB_NAME'] ?? 'CarpoolDB';

// CORS Headers (if you're calling this from a frontend)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Connect to MySQL
    $conn = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    // Success response
    echo json_encode([
        "status" => "success",
        "message" => "Connected to MySQL successfully.",
        "database" => $DB_NAME,
        "host" => $DB_HOST,
        "timestamp" => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    // Connection error handling
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to connect to MySQL",
        "details" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit();
}
?>