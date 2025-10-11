/**
 * User model file;
 * 
 * this file contains the schema and model for User-related data.
 */

// Register the user to the database
// return true if success
async function registerUser(data){
    return true;
}

// Login user to the web app
// return true if success
async function LoginUser(data){
    return true;
}

async function UpdateProfile(data) {
    return true;
}

// Return user history(ride/booking)
async function UserHistory(data){
    return true;
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

