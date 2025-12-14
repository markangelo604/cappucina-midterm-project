<?php
try {
    $config = require __DIR__ . '/../Server/server.php';
    $db = $config['db'];
    $result = $db->users->updateOne(['username' => 'carowner123'], ['$unset' => ['active_session_id' => '']]);
    echo "modified: " . $result->getModifiedCount() . "\n";
} catch (Exception $e) {
    echo "error: " . $e->getMessage() . "\n";
}
?>