// server.js
// ===============================================
// PURPOSE:
//  • Create Express server
//  • Connect to MongoDB using db.js
//  • Register routes
//  • Start HTTP server
// ===============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Mongo connection utilities
const { connectDB, getCollections } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to DB then start server
async function startServer() {
  try {
    await connectDB();
    const collections = getCollections();

    console.log("Collections loaded:", Object.keys(collections));

    // Example route
    app.get('/', (req, res) => {
      res.send('🚀 Server is running and MongoDB is connected!');
    });

    // Example API route using DB
    app.get('/users', async (req, res) => {
      const { users } = collections;
      const data = await users.find().toArray();
      res.json(data);
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
