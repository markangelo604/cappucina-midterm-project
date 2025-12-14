<?php
// Logout endpoint: clears session and removes active_session_id from user document
error_reporting(0);
ini_set('display_errors', 0);
session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../Server/server.php';

$config = require __DIR__ . '/../Server/server.php';
$db = $config['db'];

try {
    if (session_status() === PHP_SESSION_ACTIVE && !empty($_SESSION['user_id'])) {
        $users = $db->users;
        $userId = $_SESSION['user_id'];

        // Clear active_session_id in DB for this user
        $users->updateOne(['_id' => new MongoDB\BSON\ObjectId($userId)], ['$unset' => ['active_session_id' => ""]]);

        // Destroy the session
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        echo json_encode(["success" => true, "message" => "Logged out successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "No active session to logout."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}

?>
