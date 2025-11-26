// admin_node.js
// ===============================================
// PURPOSE:
//  • Create Express server
//  • Connect to MongoDB using db.js
//  • Register routes
//  • Start HTTP server
//  • Automatically start PHP client server
// ===============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

// Import Mongo connection utilities
const { connectDB, getCollections } = require('./Config/database.js');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to DB then start Node server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    const collections = getCollections();

    console.log("Collections loaded:", Object.keys(collections));

    // Routes
    app.get('/', (req, res) => {
      res.send('🚀 Admin server is running and MongoDB is connected!');
    });

    app.get('/users', async (req, res) => {
      try {
        const { users } = collections;
        const data = await users.find().toArray();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const PORT = process.env.ADMIN_PORT || 9999;
    app.listen(PORT, () =>
      console.log(`Admin server running on http://localhost:${PORT}`)
    );

  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();