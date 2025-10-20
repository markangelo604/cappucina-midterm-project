<?php
/**
 * User model file;
 * 
 * this file contains the schema and model for User-related data.
 * 
 * WEB APP REQUIREMENTS INCLUDES:
 * - Create and manage a user profile.
 * - Search for available carpool rides based on destination, date, or route.
 * - View ride details (driver info, available seats, cost, time).
 * - Request or book a seat in a carpool.
 * - Cancel bookings.
 * - Rate and review car owners after ride completion.
 */

require_once __DIR__ . '/vendor/autoload.php';
use Dotenv\Dotenv;
use MongoDB\Client as MongoClient;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$uri = $_ENV['LOCALHOST'];
$dbName = $_ENV['DATABASE'];
$collectionName = $_ENV['USERCOLLECTION'];

$client = new MongoClient($uri);
$db = $client->$dbName;
$collection = $db->$collectionName;

// ===== Utility function for logging actions =====
function logAction($message) {
    $logDir = __DIR__ . "/../Server-Logs";
    $logFile = $logDir . "/user.log";

    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }

    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Register the user to the database
function registerUser($data) {
    global $collection;

    try {
        // 1. Check if the username already exists
        $existingUser = $collection->findOne(
            ['username' => $data['username']]
        );
        if ($existingUser) {
            logAction("Attempted registration with existing username: " . $data['username']);
            return [
                "success" => false,
                "message" => "Username already exists."
            ];
        }

        // 2. If not existing, insert new user
        $result = $collection->insertOne($data);
        logAction("User added with _id: " . $result->getInsertedId());
        return [
            "success" => true,
            "message" => "User registered successfully."
        ];
    } catch (Exception $e) {
        logAction("Error registering user: " . $e->getMessage());
        return [
            "success" => false,
            "message" => "Registration failed due to server error."
        ];
    }
}

// ====== Login User ======
function loginUser($data) {
    global $collection;

    try {
        $user = $collection->findOne(
            ['username' => $data['username']], 
            ['projection' => ['password' => 1]]
        );
        if ($user && $user['password'] === $data['password']) {
            logAction("Matched password for username: " . $data['username']);
            return true;
        } else {
            logAction("Incorrect password for username: " . $data['username']);
            return false;
        }
    } catch (Exception $e) {
        logAction("Error logging in user: " . $e->getMessage());
        return false;
    }
}

// ========== Update Profile ==========
function updateAccount($username, $updates) {
    global $collection;
    try {
        $updates['updated_at'] = new MongoDB\BSON\UTCDateTime();
        $result = $collection->updateOne(
            ['username' => $username], 
            ['$set' => $updates]
        );
        if ($result->getMatchedCount() > 0) {
            logAction("Account updated for: " . $username);
            return ["success" => true];
        }
        return ["success" => false, "message" => "Account not found."];
    } catch (Exception $e) {
        logAction("Update error: " . $e->getMessage());
        return ["success" => false, "message" => "Update failed."];
    }
}


// SEARCH FOR AVAILABLE CARPOOL RIDES BASED ON DESTINATION, DATE, ROUTE
function searchAvailableRides($data){ //route, departure_time, date, ride_status
    global $collection;

    try {
        // Extract filters from input data
        $route = isset($data['route']) ? $data['route'] : null;
        $destination = isset($data['destination']) ? $data['destination'] : null;
        $date = isset($data['date']) ? $data['date'] : null;
        $status = isset($data['ride_status']) ? $data['ride_status'] : 'upcoming';

        // Build dynamic match conditions
        $matchConditions = [
            'role' => 'car_owner',
            'rides.ride_status' => $status
        ];

        if ($destination) {
            $matchConditions['rides.to'] = $destination;
        }
        if ($date) {
            $matchConditions['rides.date'] = $date;
        }
        if ($route) {
            $matchConditions['rides.route.stops'] = $route; // search if route includes this stop
        }

        // MongoDB aggregation pipeline
        $pipeline = [
            ['$unwind' => '$rides'],
            ['$match' => $matchConditions],
            [
                '$project' => [
                    '_id' => 0,
                    'driver_name' => '$profile.name',
                    'vehicle' => '$vehicle',
                    'from' => '$rides.from',
                    'to' => '$rides.to',
                    'date' => '$rides.date',
                    'time' => '$rides.time',
                    'fare' => '$rides.fare',
                    'available_seats' => '$rides.available_seats',
                    'ride_status' => '$rides.ride_status',
                    'route' => '$rides.route'
                ]
            ]
        ];

        $cursor = $collection->aggregate($pipeline);
        $rides = iterator_to_array($cursor);

        if (count($rides) > 0) {
            logAction("Found " . count($rides) . " matching rides.\n");
            return $rides;
        } else {
            logAction("No rides found matching the criteria.\n");
            return [];
        }
    } catch (Exception $e) {
        logAction("Error searching rides: " . $e->getMessage());
        return [];
    }
}




// // Return user trip history
// async function TripHistory(data) {
//     try {
//         await client.connect();
//         const db = client.db(dbName);

//         const result = await db.collection(collectionName).findOne(
//             { username: data.username },
//             { projection: { trip_history: 1 } }
//         );

//         if (result && result.trip_history) {
//             console.log("Trip history retrieved successfully for:", data.username);
//             logAction("Trip history retrieved successfully for: " + data.username);
//             return result.trip_history;
//         } else {
//             console.log("No trip history found for:", data.username);
//             logAction("No trip history found for: " + data.username);
//             return [];
//         }
//     } catch (err) {
//         console.error("An error occurred:", err);
//         logAction("Error has occurred while obtaining trip history for: " + data.username);
//         return [];
//     } finally {
//         await client.close();
//     }
// }

// // Return user payment history
// async function PaymentHistory(data) {
//     try {
//         await client.connect();
//         const db = client.db(dbName);

//         const result = await db.collection(collectionName).findOne(
//             { username: data.username },
//             { projection: { payment_history: 1 } }
//         );

//         if (result && result.payment_history) {
//             console.log("Payment history retrieved successfully for:", data.username);
//             logAction("Payment history retrieved successfully for: " + data.username);
//             return result.payment_history;
//         } else {
//             console.log("No payment history found for:", data.username);
//             logAction("No payment history found for: " + data.username);
//             return [];
//         }
//     } catch (err) {
//         console.error("An error occurred:", err);
//         logAction("Error has occurred while obtaining payment history for: " + data.username);
//         return [];
//     } finally {
//         await client.close();
//     }
// }

// // Set the current location of the user
// async function SetUserLocation(data) {
//     try {
//         await client.connect();
//         const db = client.db(dbName);

//         const result = await db.collection(collectionName).updateOne(
//             { username: data.username },
//             {
//                 $set: {
//                     current_location: {
//                         type: "Point",
//                         coordinates: [data.longitude, data.latitude]
//                     },
//                     updated_at: new Date()
//                 }
//             }
//         );

//         if (result && result.matchedCount > 0) {
//             console.log("Successfully updated user location: " + data.username);
//             logAction("Successfully updated user location: " + data.username);
//             return true;
//         } else {
//             console.log("Username not found: " + data.username);
//             logAction("Username not found: " + data.username);
//             return false;
//         }
//     } catch (err) {
//         console.log("Error has occurred while setting user location for: " + data.username, err);
//         logAction("Error has occurred while setting user location for: " + data.username);
//         return false;
//     } finally {
//         await client.close();
//     }
// }

// // View user current location
// async function ViewUserLocation(data) {
//     try {
//         await client.connect();
//         const db = client.db(dbName);

//         const result = await db.collection(collectionName).findOne(
//             { username: data.username },
//             { projection: { current_location: 1, _id: 0 } }
//         );

//         if (result && result.current_location) {
//             console.log("Successfully retrieved current location for:", data.username);
//             logAction("Successfully retrieved current location for: " + data.username);
//             return result.current_location;
//         } else {
//             console.log("No current location found for:", data.username);
//             logAction("No current location found for: " + data.username);
//             return null;
//         }
//     } catch (err) {
//         console.error("Error occurred while obtaining user location:", err);
//         logAction("Error occurred while obtaining user location for: " + data.username);
//         return null;
//     } finally {
//         await client.close();
//     }
// }

?>