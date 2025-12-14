<?php
// Clears active_session_id for all users. Safe to run on server restart.
require_once __DIR__ . '/../Server/server.php';
$config = require __DIR__ . '/../Server/server.php';
$db = $config['db'];
try {
    $res = $db->users->updateMany([], ['$unset' => ['active_session_id' => '']]);
    echo "Cleared active_session_id for " . $res->getModifiedCount() . " users\n";
} catch (Exception $e) {
    echo "Error clearing sessions: " . $e->getMessage() . "\n";
}
?>
