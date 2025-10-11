/**
 * User model file;
 * 
 * this file contains the schema and model for User-related data.
 */
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.LOCALHOST;
const client = new MongoClient(uri);

const dbName = process.env.DATABASE;
const collectionName = process.env.USERCOLLECTION;

// Logger
function logAction(message) {
    try {
        const logDir = path.join(__dirname, "../Server-Logs");
        const logFile = path.join(logDir, "user.log");

        // Create folder if it doesn’t exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logMessage = `${new Date().toISOString()} - ${message}\n`;
        fs.appendFileSync(logFile, logMessage);
    } catch (err) {
        console.error("Failed to write to log:", err);
    }
}

// Register the user to the database
async function registerUser(data) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const result = await db.collection(collectionName).insertOne(data);

        console.log("User added with _id:", result.insertedId);
        logAction("User added with _id: " + result.insertedId);
        return true;
    } catch (err) {
        console.error("Error adding user:", err);
        logAction("An error occurred while registering user: " + data.username);
        return false;
    } finally {
        await client.close();
    }
}

// Login user to the web app
async function LoginUser(data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        const result = await db.collection(collectionName).findOne(
            { username: data.username },
            { projection: { password: 1 } }
        );

        if (result && result.password === data.password) {
            logAction("Matched password with username: " + data.username);
            console.log("Correct password for username: " + data.username);
            return true;
        } else {
            logAction("Incorrect password for username: " + data.username);
            return false;
        }
    } catch (err) {
        console.error("Error logging in:", err);
        logAction("An error occurred while logging in user: " + data.username);
        return false;
    } finally {
        await client.close();
    }
}

// Update user profile
async function UpdateProfile(username, data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        // Add updated_at timestamp
        const result = await db.collection(collectionName).updateOne(
            { username: username },
            { $set: { ...data, updated_at: new Date() } }
        );

        if (result.matchedCount > 0) {
            console.log("User updated successfully");
            logAction("Successfully updated profile of username: " + username);
            return true;
        } else {
            console.log("User not found");
            logAction("Username to be updated not found: " + username);
            return false;
        }
    } catch (err) {
        console.error("Error updating user:", err);
        logAction("An error occurred while updating user: " + username);
        return false;
    } finally {
        await client.close();
    }
}

// Return user trip history
async function TripHistory(data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        const result = await db.collection(collectionName).findOne(
            { username: data.username },
            { projection: { trip_history: 1 } }
        );

        if (result && result.trip_history) {
            console.log("Trip history retrieved successfully for:", data.username);
            logAction("Trip history retrieved successfully for: " + data.username);
            return result.trip_history;
        } else {
            console.log("No trip history found for:", data.username);
            logAction("No trip history found for: " + data.username);
            return [];
        }
    } catch (err) {
        console.error("An error occurred:", err);
        logAction("Error has occurred while obtaining trip history for: " + data.username);
        return [];
    } finally {
        await client.close();
    }
}

// Return user payment history
async function PaymentHistory(data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        const result = await db.collection(collectionName).findOne(
            { username: data.username },
            { projection: { payment_history: 1 } }
        );

        if (result && result.payment_history) {
            console.log("Payment history retrieved successfully for:", data.username);
            logAction("Payment history retrieved successfully for: " + data.username);
            return result.payment_history;
        } else {
            console.log("No payment history found for:", data.username);
            logAction("No payment history found for: " + data.username);
            return [];
        }
    } catch (err) {
        console.error("An error occurred:", err);
        logAction("Error has occurred while obtaining payment history for: " + data.username);
        return [];
    } finally {
        await client.close();
    }
}

// Set the current location of the user
async function SetUserLocation(data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        const result = await db.collection(collectionName).updateOne(
            { username: data.username },
            {
                $set: {
                    current_location: {
                        type: "Point",
                        coordinates: [data.longitude, data.latitude]
                    },
                    updated_at: new Date()
                }
            }
        );

        if (result && result.matchedCount > 0) {
            console.log("Successfully updated user location: " + data.username);
            logAction("Successfully updated user location: " + data.username);
            return true;
        } else {
            console.log("Username not found: " + data.username);
            logAction("Username not found: " + data.username);
            return false;
        }
    } catch (err) {
        console.log("Error has occurred while setting user location for: " + data.username, err);
        logAction("Error has occurred while setting user location for: " + data.username);
        return false;
    } finally {
        await client.close();
    }
}

// View user current location
async function ViewUserLocation(data) {
    try {
        await client.connect();
        const db = client.db(dbName);

        const result = await db.collection(collectionName).findOne(
            { username: data.username },
            { projection: { current_location: 1, _id: 0 } }
        );

        if (result && result.current_location) {
            console.log("Successfully retrieved current location for:", data.username);
            logAction("Successfully retrieved current location for: " + data.username);
            return result.current_location;
        } else {
            console.log("No current location found for:", data.username);
            logAction("No current location found for: " + data.username);
            return null;
        }
    } catch (err) {
        console.error("Error occurred while obtaining user location:", err);
        logAction("Error occurred while obtaining user location for: " + data.username);
        return null;
    } finally {
        await client.close();
    }
}


// Cancel a booking
async function CancelBooking(data) {
    return true;
}

// returns the List of available rides
// with: driver name, car model, departure time, available seats, route
async function ListRides(data) {
    return true;
}

// Book a ride
// dito na dn ung advanced booking nosql naman gamit e
async function BookRide(data){
    return true;
}

// Return the following
// Driver, pickup time, location, companions in car
async function ViewTripDetails(data) {
    return true;
}

// Return the list of passengers in the car and their ratings
async function ViewPassengerRating(data) {
    return true;
}

// Return the current payment status of the user
async function PaymentStatus(data) {
    return true;
}

// Return the amount
async function PayForRide(data) {
    return true;
}

// Add a rating to the driver (ung mga nasakyan lang)
// return true if success
async function RateDriver(data) {
    return true;
}

// Add a rating to the other passengers
async function RateOtherPassenger(data) {
    return true;
}

