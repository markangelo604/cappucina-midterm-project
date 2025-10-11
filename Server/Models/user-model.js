/**
 * User model file;
 * 
 * this file contains the schema and model for User-related data.
 */
import dotenv from "dotenv";
import { Collection, MongoClient } from "mongodb";
dotenv.config();

const uri = process.env.LOCALHOST;
const client = new MongoClient(uri);

const dbName = process.env.DATABASE;
const collectionName = process.env.USERCOLLECTION;

// Register the user to the database
// return true if success
async function registerUser(data){
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const result = await collectionName.insertOne(data);

        console.log("User added with _id:", result.insertId);
        return true;
    } catch (err) {
        console.error("Error adding user:", err);   
    } finally {
        await client.close();
    }
}

// Login user to the web app
// return true if success
async function LoginUser(data){
    try{
        await client.connect();
        const db = client.db(dbName);
        
        const result = await collectionName.findOne(
            { username: data.username}, // Search username
            { projection:{password: 1}} // get password
        );

        if(result && result.password == data.password){
            return true;
        } else {
            return false;
        }
    }catch(err) {
        console.error("Incorrect username or password", err);
    } finally {
        await client.close();
    }
}

async function UpdateProfile(username, data) {
     try{
        await client.connect();
        const db = client.db(dbName);
        
        const result = await collectionName.updateOne(
            { username: username}, //find username
            { $set: data}           //set the updated data
        );

        if (result.matchedCount > 0) {
            console.log("User updated successfully");
            return true;
        } else {
            console.log("User not found");
            return false;
        }

    } catch (err) {
        console.error("Error updating user:", err);
    } finally {
        await client.close();
    }
}

// Return user history(ride)
async function TripHistory(data){
    try{
        await client.connect();
        const db = client.db(dbName);
        
        const result = await collectionName.findOne(
            { username: data.username}, // fetch the history of the said username
            { projection: {trip_history: 1}} // obtain the trip history
        );

        return result.trip_history;
    } catch (err){
        console.error("An error has occured:", err)
    } finally {
        await client.close();
    }
}

// Return user payment history
async function PaymentHistory(data) {
    try{
        await client.connect();
        const db = client.db(dbName);
        
        const result = await collectionName.findOne(
            { username: data.username}, // fetch the history of the said username
            { projection: {payment_history: 1}} // obtain the payment history
        );

        return result.payment_history;
    } catch (err){
        console.error("An error has occured:", err)
    } finally {
        await client.close();
    }
}

// Set the user destination
async function UserDestination(data) {
    return true;
}

// Set the currnt location of the user
// Or set the pick up location
// Or view the current location
async function UserLocation(data) {
    return true;
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

