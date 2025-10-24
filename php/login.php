<?php
//can be removed
error_reporting(0);
ini_set('display_errors', 0);
// -------------------
session_start();

// set response header
header('Content-Type: application/json');



// This is expected to return a JSON of 
// ([
//         'success' => true,
//         'message' => 'Login successful!', => this is the message for the website
//         'userId' => $user['id'],
//         'name' => $user['name'],
//         'userType' => $user['userType']  // THIS IS KEY!
//     ]);

?>
