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

    app.post('/admin/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const { users } = getCollections();
        
        // Find admin user
        const adminUser = await users.findOne({ 
          username: username,
          role: 'admin'
        });
        
        console.log('Looking for admin user:', username);
        console.log('Found user:', adminUser);
        
        if (!adminUser) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }
        
        // Handle PHP bcrypt hash format ($2y$ -> $2b$)
        let userPassword = adminUser.password;
        if (userPassword.startsWith('$2y$')) {
          userPassword = userPassword.replace('$2y$', '$2b$');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userPassword);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }
        
        // Successful login
        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role
          }
        });
      } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Server error during login' 
        });
      }
    });

    // Serve admin HTML files - matching the exact paths used in your HTML links
    app.get('/admin/admin-dashboard.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-dashboard.html'));
    });

    app.get('/admin/admin-users.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-users.html'));
    });

    app.get('/admin/admin-drivers.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-drivers.html'));
    });

    app.get('/admin/admin.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin.html'));
    });

    // Alternative routes without .html extension (for cleaner URLs)
    app.get('/admin/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-dashboard.html'));
    });

    app.get('/admin/users', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-users.html'));
    });

    app.get('/admin/drivers', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin-drivers.html'));
    });

    app.get('/admin/admins', (req, res) => {
      res.sendFile(path.join(__dirname, '../html/admin.html'));
    });
    
    // Admin API endpoints
    app.get('/api/admin/stats', async (req, res) => {
      try {
        const { users, rides, bookings } = getCollections();
        
        const totalUsers = await users.countDocuments();
        const activeDrivers = await users.countDocuments({ role: 'car_owner' });
        const totalTrips = await bookings.countDocuments();
        
        res.json({
          totalUsers,
          activeDrivers,
          totalTrips,
          emergencies: 24 // Static for now
        });
      } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
    
    // Serve index.html for root path
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../index.html'));
    });

    app.listen(PORT, () =>
      console.log(`Admin server running on http://localhost:${PORT}`)
    );

  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();