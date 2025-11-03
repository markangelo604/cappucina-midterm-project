<?php
/**
 * Read and print all MongoDB collections and their documents line by line
 */

require_once __DIR__ . '/Server/server.php'; // adjust path if needed

try {
    echo "<pre>"; // makes output readable in browser

    // Get all collection names in your database
    $collections = $db->listCollections();

    foreach ($collections as $collectionInfo) {
        $collectionName = $collectionInfo->getName();
        echo "=== Collection: $collectionName ===\n";

        // Get collection handle
        $collection = $db->$collectionName;

        // Fetch all documents in that collection
        $cursor = $collection->find();

        $count = 0;
        foreach ($cursor as $document) {
            $count++;
            echo "Document #$count:\n";
            print_r($document); // shows full structure
            echo "----------------------------------------\n";
        }

        if ($count === 0) {
            echo "(No documents found)\n";
        }

        echo "\n";
    }

    echo "</pre>";

} catch (Exception $e) {
    echo "Error reading collections: " . $e->getMessage();
}
?>