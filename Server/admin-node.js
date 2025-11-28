// admin-node.js
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
app.use(express.static(path.join(__dirname, '..')));

function startPHPServer() {
  const phpPath = 'php';
  const serverScript = path.join(__dirname, '../Server/server.php');
  
  const phpServer = spawn(phpPath, [serverScript], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });

  phpServer.stdout.on('data', (data) => process.stdout.write(`[PHP] ${data}`));
  phpServer.stderr.on('data', (data) => process.stderr.write(`[PHP ERROR] ${data}`));

  phpServer.on('close', (code) => {
    console.log(`[PHP] Exited with code ${code}`);
  });

  return phpServer;
}


// Connect to DB then start Node server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    const collections = getCollections();

    console.log("Collections loaded:", Object.keys(collections));

    const phpProcess = startPHPServer(); //php sevrer

    // Routes
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../index.html'));
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