<?php
require_once __DIR__ . '/vendor/autoload.php'; // Make sure MongoDB library is installed

use MongoDB\Client;
use MongoDB\BSON\UTCDateTime;

$client = new Client("mongodb://localhost:27017");
$db = $client->CarpoolDB;

// Clear old data first (optional)
$db->users->drop();
$db->rides->drop();
$db->bookings->drop();
$db->reviews->drop();
$db->payments->drop();

// ===== USERS =====
$users = [
    [
        "username" => "carowner123",
        "password" => password_hash("password123", PASSWORD_DEFAULT),
        "email" => "carowner@gmail.com",
        "role" => "car_owner",
        "profile" => [
            "name" => "Juan Dela Cruz",
            "phone" => "+639123456789",
            "gender" => "male",
            "address" => "Quezon City"
        ],
        "ratings" => [[
            "Average_rating" => 4.2,
            "Comments" => [
                ["username" => "charles", "comment" => "good car smell - it doesn’t smell like someone I know very well"],
                ["username" => "mark", "comment" => "he’s a good driver, and a rider for me, very approachable (๑ᵔ⤙ᵔ๑)"]
            ]
        ]],
        "vehicle" => [[
            "plate_number" => "ABC-1234",
            "brand" => "Toyota",
            "model" => "Vios",
            "year" => 2022,
            "verified" => true,
            "available_seats" => 4,
            "document" => [
                "license" => "BSON_PRO_DL_PLACEHOLDER",
                "medical_certificate" => "BSON_MED_CERT_PLACEHOLDER"
            ]
        ]],
        "account_status" => "active",
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:00:00Z") * 1000)
    ],
    [
        "username" => "passenger1",
        "password" => password_hash("password123", PASSWORD_DEFAULT),
        "email" => "passenger@gmail.com",
        "role" => "passenger",
        "profile" => [
            "name" => "Maria Santos",
            "phone" => "+639987654321",
            "gender" => "female",
            "address" => "Baguio City"
        ],
        "account_status" => "active",
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:05:00Z") * 1000)
    ]
];

$db->users->insertMany($users);

// ===== RIDES =====
$rides = [
    [
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "from" => "SLU Bakakeng",
        "to" => "SM Baguio",
        "date" => "2025-10-25",
        "time" => "08:30",
        "fare" => 150,
        "available_seats" => 3,
        "ride_status" => "upcoming",
        "route" => [
            "stops" => ["SLU Bakakeng", "Bakakeng Arc", "BGH", "SM Baguio"],
            "distance_km" => 15.4,
            "estimated_duration_mins" => 45
        ],
        "passengers" => [[
            "username" => "passenger1",
            "status" => "confirmed",
            "rating_given" => null
        ]],
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:00:00Z") * 1000)
    ],
    [
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "from" => "SLU Bakakeng",
        "to" => "Session Road",
        "date" => "2025-10-23",
        "time" => "09:00",
        "fare" => 120,
        "available_seats" => 2,
        "ride_status" => "ongoing",
        "route" => [
            "stops" => ["SLU Bakakeng", "BGH", "Session Road"],
            "distance_km" => 12.0,
            "estimated_duration_mins" => 30
        ],
        "passengers" => [[
            "username" => "passenger1",
            "status" => "confirmed",
            "rating_given" => null
        ]],
        "created_at" => new UTCDateTime(strtotime("2025-10-18T09:00:00Z") * 1000)
    ],
    [
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "from" => "SLU Bakakeng",
        "to" => "Burnham Park",
        "date" => "2025-10-20",
        "time" => "07:30",
        "fare" => 100,
        "available_seats" => 0,
        "ride_status" => "finished",
        "route" => [
            "stops" => ["SLU Bakakeng", "BGH", "Burnham Park"],
            "distance_km" => 10.2,
            "estimated_duration_mins" => 25
        ],
        "passengers" => [[
            "username" => "passenger1",
            "status" => "confirmed",
            "rating_given" => 5
        ]],
        "created_at" => new UTCDateTime(strtotime("2025-10-19T09:00:00Z") * 1000)
    ],
    [
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "from" => "SLU Bakakeng",
        "to" => "La Trinidad",
        "date" => "2025-10-15",
        "time" => "10:00",
        "fare" => 180,
        "available_seats" => 4,
        "ride_status" => "cancelled",
        "route" => [
            "stops" => ["SLU Bakakeng", "BGH", "La Trinidad"],
            "distance_km" => 18.0,
            "estimated_duration_mins" => 50
        ],
        "passengers" => [],
        "created_at" => new UTCDateTime(strtotime("2025-10-14T10:00:00Z") * 1000)
    ]
];

$rideInsert = $db->rides->insertMany($rides);
$rideIds = $rideInsert->getInsertedIds();
$finishedRideId = $rideIds[2];
$upcomingRideId = $rideIds[0];

// ===== BOOKINGS =====
$bookings = [
    [
        "ride_id" => $finishedRideId,
        "passenger_username" => "passenger1",
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "fare" => 100,
        "date" => "2025-10-20",
        "status" => "completed",
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:00:00Z") * 1000)
    ],
    [
        "ride_id" => $upcomingRideId,
        "passenger_username" => "passenger1",
        "driver_username" => "carowner123",
        "plate_number" => "ABC-1234",
        "fare" => 150,
        "date" => "2025-10-25",
        "status" => "pending",
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:10:00Z") * 1000)
    ]
];
$db->bookings->insertMany($bookings);

// ===== REVIEWS =====
$reviews = [
    [
        "ride_id" => $finishedRideId,
        "reviewer_username" => "passenger1",
        "reviewee_username" => "carowner123",
        "rating" => 4,
        "comment" => "Very smooth ride!",
        "created_at" => new UTCDateTime(strtotime("2025-10-19T10:00:00Z") * 1000)
    ]
];
$db->reviews->insertMany($reviews);

// ===== PAYMENTS =====
$payments = [
    [
        "passenger_username" => "passenger1",
        "driver_username" => "carowner123",
        "ride_id" => $finishedRideId,
        "amount" => 100,
        "status" => "paid",
        "transaction_id" => "TXN123456789",
        "method" => "gcash",
        "created_at" => new UTCDateTime(),
        "updated_at" => new UTCDateTime()
    ],
    [
        "passenger_username" => "passenger1",
        "driver_username" => "carowner123",
        "ride_id" => $upcomingRideId,
        "amount" => 150,
        "status" => "pending",
        "transaction_id" => "TXN987654321",
        "method" => "cash",
        "created_at" => new UTCDateTime(),
        "updated_at" => new UTCDateTime()
    ]
];
$db->payments->insertMany($payments);

echo "✅ MongoDB sample data inserted successfully into CarpoolDB (using usernames).\n";