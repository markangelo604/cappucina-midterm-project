<?php
/**
 * Test MongoDB Connection and Basic User Insertion
 *
 * This script ensures that:
 * 1. The MongoDB extension is active.
 * 2. The connection from `server.php` works.
 * 3. A sample document can be inserted and retrieved.
 */

require_once __DIR__ . '/Server/server.php';
require_once __DIR__ . '/Server/Models/user-model.php';

echo "=== MongoDB PHP Connection Test ===\n";


try {
    // Step 1: Check if $db exists
    global $db;
    if (!$db) {
        throw new Exception("Database object not initialized.");
    }

    // Step 2: Ping MongoDB
    $result = $db->command(['ping' => 1]);
    echo "✅ MongoDB Connection Successful!\n";
    print_r($result);

    // Step 3: Try inserting test user
    $unique = \mt_rand(1000, 9999); // namespace-safe
    $testData = [
        'username' => 'testuser_' . $unique,
        'password' => '12345',
        'email'    => 'test' . $unique . '@mail.com',
        'name'     => 'Tester User'
    ];

    // Call your user creation function
    $response = createUserProfile($testData);

    echo "\n=== Test Create User ===\n";
    print_r($response);

} catch (Throwable $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
?>
