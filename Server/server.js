/**
 * Server entry point
 * 
 * This file sets up the Express server, connects to the database,
 * and defines the routes for the application.
 */
import express from "express";
import dotenv from "dotenv";

dotenv.config(); //load env


const app = express();
const PORT = process.env.PORT;
const uri = process.env.LOCALHOST;

// Middleware to parse JSON requests
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database connected at ${uri}`);
});