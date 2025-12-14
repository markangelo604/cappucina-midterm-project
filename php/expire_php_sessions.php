<?php
// Delete PHP session files to force re-login on server restart
// Runs safely: uses configured session.save_path or system temp dir
try {
    $savePath = ini_get('session.save_path');
    if (!$savePath) {
        $savePath = sys_get_temp_dir();
    }

    $savePath = trim($savePath);
    if (!is_dir($savePath)) {
        echo "Session save path not a directory: {$savePath}\n";
        exit(0);
    }

    $files = glob($savePath . DIRECTORY_SEPARATOR . 'sess_*');
    $deleted = 0;
    foreach ($files as $f) {
        if (is_file($f)) {
            @unlink($f);
            $deleted++;
        }
    }
    echo "Deleted {$deleted} PHP session file(s) from {$savePath}\n";
} catch (Exception $e) {
    echo "Error clearing PHP sessions: " . $e->getMessage() . "\n";
}

?>
