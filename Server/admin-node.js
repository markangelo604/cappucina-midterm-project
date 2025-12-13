// admin-node.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { spawn } = require("child_process");
const { connectDB, getCollections } = require("./Config/database.js");
const path = require("path");
const { ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.warn("⚠️ Email service not fully configured:", error.message);
    console.warn("📧 To enable email notifications, configure EMAIL_USER and EMAIL_PASSWORD in .env");
  } else {
    console.log("✅ Email service ready");
  }
});

// Email sending function
async function sendDriverEmail(recipientEmail, recipientName, status, additionalInfo = {}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("⚠️ Email not sent: EMAIL_USER or EMAIL_PASSWORD not configured");
    return false;
  }

  let subject = "";
  let htmlContent = "";

  if (status === "approved") {
    subject = "🎉 Your Driver Application Has Been Approved!";
    htmlContent = `
      <h2>Welcome to Cappucina, ${recipientName}!</h2>
      <p>Great news! Your driver application has been approved and verified.</p>
      <p><strong>Your account is now active and you can start accepting rides.</strong></p>
      <h3>Next Steps:</h3>
      <ul>
        <li>Log in to your driver dashboard</li>
        <li>Complete your profile if needed</li>
        <li>Review your vehicle details</li>
        <li>Start accepting rides!</li>
      </ul>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br><strong>Cappucina Team</strong></p>
    `;
  } else if (status === "rejected") {
    subject = "Application Status - Please Review";
    const reason = additionalInfo.reason || "The review process determined your application does not meet current requirements.";
    htmlContent = `
      <h2>Application Review - ${recipientName}</h2>
      <p>Thank you for your interest in becoming a Cappucina driver.</p>
      <p><strong>Status: Application Under Review / Pending Clarification</strong></p>
      <h3>Reason:</h3>
      <p>${reason}</p>
      <h3>What to do next:</h3>
      <ul>
        <li>Review the feedback provided above</li>
        <li>Address any issues mentioned</li>
        <li>You can resubmit your application or contact support for more information</li>
      </ul>
      <p>Contact us if you need further assistance.</p>
      <p>Best regards,<br><strong>Cappucina Team</strong></p>
    `;
  } else if (status === "pending") {
    subject = "📋 Your Driver Application is Under Review";
    htmlContent = `
      <h2>Application Received, ${recipientName}!</h2>
      <p>Thank you for submitting your driver application to Cappucina.</p>
      <p><strong>Your application status: Under Review</strong></p>
      <h3>What happens next:</h3>
      <ul>
        <li>Our team will review your documents and information</li>
        <li>We may request additional information if needed</li>
        <li>You will receive an email once your application is approved or if we need clarification</li>
        <li>Review process typically takes 1-3 business days</li>
      </ul>
      <p>Thank you for your patience!</p>
      <p>Best regards,<br><strong>Cappucina Team</strong></p>
    `;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Cappucina <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent to ${recipientEmail} (${status})`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${recipientEmail}:`, error.message);
    return false;
  }
}

// function startPHPServer() {
//   const phpPath = "php";
//   const serverScript = path.join(__dirname, "../Server/server.php");

//   const phpServer = spawn(phpPath, [serverScript], {
//     cwd: path.join(__dirname, ".."),
//     stdio: "pipe",
//   });

//   phpServer.stdout.on("data", (data) => process.stdout.write(`[PHP] ${data}`));
//   phpServer.stderr.on("data", (data) =>
//     process.stderr.write(`[PHP ERROR] ${data}`)
//   );

//   phpServer.on("close", (code) => {
//     console.log(`[PHP] Exited with code ${code}`);
//   });

//   return phpServer;
// }

// Function to hash password in PHP-compatible format
async function hashPasswordPHPCompatible(password) {
  // Use 10 rounds (PHP's PASSWORD_BCRYPT default)
  const hash = await bcrypt.hash(password, 10);

  // Convert $2b$ to $2y$ for PHP compatibility
  const phpCompatibleHash = hash.replace("$2b$", "$2y$");

  return phpCompatibleHash;
}

// Function to verify password handling both formats
async function verifyPassword(password, hash) {
  try {
    // Handle both $2y$ (PHP) and $2b$ (Node.js) formats
    if (hash.startsWith("$2y$")) {
      // Convert $2y$ to $2b$ for Node.js bcrypt compatibility
      const compatibleHash = hash.replace("$2y$", "$2b$");
      return await bcrypt.compare(password, compatibleHash);
    } else {
      // Already in $2b$ format
      return await bcrypt.compare(password, hash);
    }
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

async function startServer() {
  try {
    await connectDB();
    const collections = getCollections();
    console.log("Collections loaded:", Object.keys(collections));

    // const phpProcess = startPHPServer();

    // Login endpoint
    app.post("/admin/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        const { users } = getCollections();

        const adminUser = await users.findOne({
          username: username,
          role: "admin",
        });

        if (!adminUser) {
          console.log("Admin user not found:", username);
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        console.log("Found admin user:", adminUser.username);
        console.log("Stored password hash:", adminUser.password);
        console.log("Login attempt with password:", password);

        // Verify password (handles both $2y$ and $2b$ formats)
        const isPasswordValid = await verifyPassword(
          password,
          adminUser.password
        );

        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        res.json({
          success: true,
          message: "Login successful",
          user: {
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
          },
        });
      } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({
          success: false,
          message: "Server error during login",
        });
      }
    });

    // API endpoints for user management
    // GET all users (passengers only)
    app.get("/api/users", async (req, res) => {
      try {
        const { users } = getCollections();
        const data = await users.find({ role: "passenger" }).toArray();
        res.json(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // GET single user by ID
    app.get("/api/users/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const user = await users.findOne({
          _id: new ObjectId(req.params.id),
          role: "passenger",
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // POST create new user
    app.post("/api/users", async (req, res) => {
      try {
        const { users } = getCollections();
        const userData = req.body;

        // Check if username already exists
        const existingUser = await users.findOne({
          username: userData.username,
          role: "passenger",
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }

        // Check if email already exists
        const existingEmail = await users.findOne({
          email: userData.email,
          role: "passenger",
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Hash password in PHP-compatible format
        const hashedPassword = await hashPasswordPHPCompatible(
          userData.password
        );

        // Prepare user document
        const newUser = {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: "passenger",
          profile: {
            name: userData.profile.name,
            phone: userData.profile.phone,
          },
          account_status: userData.account_status || "active",
          created_at: new Date(),
        };

        const result = await users.insertOne(newUser);
        res.status(201).json({
          success: true,
          message: "User created successfully",
          id: result.insertedId,
        });
      } catch (err) {
        console.error("Create user error:", err);
        res.status(500).json({
          success: false,
          message: "Error creating user",
          error: err.message,
        });
      }
    });

    // PUT update user
    app.put("/api/users/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const userId = req.params.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.role;
        delete updateData.created_at;

        // Handle password update
        if (updateData.password) {
          updateData.password = await hashPasswordPHPCompatible(
            updateData.password
          );
        } else {
          delete updateData.password;
        }

        const result = await users.updateOne(
          {
            _id: new ObjectId(userId),
            role: "passenger",
          },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          success: true,
          message: "User updated successfully",
        });
      } catch (err) {
        console.error("Update user error:", err);
        res.status(500).json({
          success: false,
          message: "Error updating user",
          error: err.message,
        });
      }
    });

    // DELETE user
    app.delete("/api/users/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const userId = req.params.id;

        const result = await users.deleteOne({
          _id: new ObjectId(userId),
          role: "passenger",
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          success: true,
          message: "User deleted successfully",
        });
      } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({
          success: false,
          message: "Error deleting user",
          error: err.message,
        });
      }
    });

    // API endpoints for driver management
    // GET all drivers
    app.get("/api/drivers", async (req, res) => {
      try {
        const { users } = getCollections();
        // Fetch drivers (car_owner role) and upgraded passengers with driver_status
        const data = await users
          .find({
            $or: [
              { role: "car_owner" },
              { driver_status: { $exists: true } }
            ]
          })
          .project({
            password: 0 // hide password for security
          })
          .toArray();

        res.json(data);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // GET single driver by ID
    app.get("/api/drivers/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const driver = await users.findOne({
          _id: new ObjectId(req.params.id),
          $or: [
            { role: "car_owner" },
            { driver_status: { $exists: true } }
          ]
        });
        if (!driver) {
          return res.status(404).json({ error: "Driver not found" });
        }
        res.json(driver);
      } catch (err) {
        console.error("Error fetching driver:", err);
        res.status(500).json({ error: err.message });
      }
    });
    // GET pending drivers
      app.get("/api/drivers/pending", async (req, res) => {
        try {
          const { users } = getCollections();

          const data = await users
            .find({ 
              role: "car_owner",
              driver_status: "pending",
              "vehicle.0.verified": false
            })
            .project({ password: 0 })
            .toArray();

          res.json(data);
        } catch (err) {
          console.error("Error fetching pending drivers:", err);
          res.status(500).json({ error: err.message });
        }
      });
      // GET active drivers
      app.get("/api/drivers/active", async (req, res) => {
        try {
          const { users } = getCollections();

          const data = await users
            .find({ role: "car_owner" || "passenger", driver_status: "active" })
            .project({ password: 0 })
            .toArray();

          res.json(data);
        } catch (err) {
          console.error("Error fetching active drivers:", err);
          res.status(500).json({ error: err.message });
        }
      });
    // POST create new driver
    app.post("/api/drivers", async (req, res) => {
      try {
        const { users } = getCollections();
        const driverData = req.body;

        // Check if username already exists
        const existingUser = await users.findOne({
          username: driverData.username,
          role: "car_owner",
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }

        // Check if email already exists
        const existingEmail = await users.findOne({
          email: driverData.email,
          role: "car_owner",
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Hash password in PHP-compatible format
        const hashedPassword = await hashPasswordPHPCompatible(
          driverData.password
        );

        // Prepare driver document - FIXED to match data structure
        const newDriver = {
          username: driverData.username,
          email: driverData.email,
          password: hashedPassword,
          role: "car_owner",
          // Ensure admin-created drivers have a driver_status field: pending if not verified
          driver_status:
            driverData.driver_status ||
            ((driverData.vehicle && Array.isArray(driverData.vehicle) && driverData.vehicle[0] && driverData.vehicle[0].verified === true)
              ? "active"
              : "pending"),
          profile: {
            name: driverData.profile.name,
            phone: driverData.profile.phone,
          },
          vehicle: [
            {
              plate_number: driverData.vehicle[0].plate_number,
              brand: driverData.vehicle[0].brand,
              model: driverData.vehicle[0].model,
              year: parseInt(driverData.vehicle[0].year) || 0,
              verified: driverData.vehicle[0].verified === true,
              available_seats:
                parseInt(driverData.vehicle[0].available_seats) || 4,
            },
          ],
          account_status: driverData.account_status || "active",
          created_at: new Date(),
        };

        const result = await users.insertOne(newDriver);
        
        // Send pending review email
        await sendDriverEmail(
          driverData.email,
          driverData.profile.name,
          "pending"
        );
        
        res.status(201).json({
          success: true,
          message: "Driver created successfully",
          id: result.insertedId,
        });
      } catch (err) {
        console.error("Create driver error:", err);
        res.status(500).json({
          success: false,
          message: "Error creating driver",
          error: err.message,
        });
      }
    });

    // PUT update driver
    app.put("/api/drivers/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const driverId = req.params.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.created_at;
        
        // Allow role update only if explicitly provided (for approve/reject scenarios)
        if (!updateData.role) {
          delete updateData.role;
        }

        // Handle password update
        if (updateData.password && updateData.password.trim() !== "") {
          updateData.password = await hashPasswordPHPCompatible(
            updateData.password
          );
        } else {
          delete updateData.password;
        }

        // Handle vehicle data - FIXED to match data structure
        if (updateData.vehicle && Array.isArray(updateData.vehicle)) {
          updateData.vehicle = [
            {
              plate_number: updateData.vehicle[0].plate_number,
              brand: updateData.vehicle[0].brand,
              model: updateData.vehicle[0].model,
              year: parseInt(updateData.vehicle[0].year) || 0,
              verified: updateData.vehicle[0].verified === true,
              available_seats:
                parseInt(updateData.vehicle[0].available_seats) || 4,
            },
          ];

          // If vehicle verification is passed in full object, update status accordingly
          if (typeof updateData.vehicle[0].verified === "boolean" && !updateData.driver_status) {
            updateData.driver_status = updateData.vehicle[0].verified ? "active" : "pending";
          }
        }

        // If using dot-notation ("vehicle.0.verified"), infer driver_status when not explicitly provided
        if (Object.prototype.hasOwnProperty.call(updateData, "vehicle.0.verified") && !updateData.driver_status) {
          updateData.driver_status = updateData["vehicle.0.verified"] === true ? "active" : "pending";
        }

        const result = await users.updateOne(
          {
            _id: new ObjectId(driverId),
            $or: [
              { role: "car_owner" },
              { driver_status: { $exists: true } }
            ]
          },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ 
            success: false,
            error: "Driver not found" 
          });
        }

        // Send approval or rejection email based on driver_status or rejection_reason
        const updatedDriver = await users.findOne({ _id: new ObjectId(driverId) });
        
        if (updatedDriver) {
          if (updatedDriver.driver_status === "active" && updateData.driver_status === "active") {
            // Driver was approved
            await sendDriverEmail(
              updatedDriver.email,
              updatedDriver.profile?.name,
              "approved"
            );
          } else if (updatedDriver.driver_status === "rejected") {
            // Driver was rejected
            await sendDriverEmail(
              updatedDriver.email,
              updatedDriver.profile?.name,
              "rejected",
              { reason: updatedDriver.rejection_reason }
            );
          }
        }

        res.json({
          success: true,
          message: "Driver updated successfully",
        });
      } catch (err) {
        console.error("Update driver error:", err);
        res.status(500).json({
          success: false,
          message: "Error updating driver",
          error: err.message,
        });
      }
    });

    // DELETE driver
    app.delete("/api/drivers/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const driverId = req.params.id;

        const result = await users.deleteOne({
          _id: new ObjectId(driverId),
          role: "car_owner",
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Driver not found" });
        }

        res.json({
          success: true,
          message: "Driver deleted successfully",
        });
      } catch (err) {
        console.error("Delete driver error:", err);
        res.status(500).json({
          success: false,
          message: "Error deleting driver",
          error: err.message,
        });
      }
    });

    // API endpoints for admin management
    // GET all admins
    app.get("/api/admins", async (req, res) => {
      try {
        const { users } = getCollections();
        const data = await users.find({ role: "admin" }).toArray();
        res.json(data);
      } catch (err) {
        console.error("Error fetching admins:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // GET single admin by ID
    app.get("/api/admins/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const admin = await users.findOne({
          _id: new ObjectId(req.params.id),
          role: "admin",
        });
        if (!admin) {
          return res.status(404).json({ error: "Admin not found" });
        }
        res.json(admin);
      } catch (err) {
        console.error("Error fetching admin:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // POST create new admin
    app.post("/api/admins", async (req, res) => {
      try {
        const { users } = getCollections();
        const adminData = req.body;

        // Check if username already exists
        const existingUser = await users.findOne({
          username: adminData.username,
          role: "admin",
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }

        // Check if email already exists
        const existingEmail = await users.findOne({
          email: adminData.email,
          role: "admin",
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Hash password in PHP-compatible format
        const hashedPassword = await hashPasswordPHPCompatible(
          adminData.password
        );

        // Prepare admin document
        const newAdmin = {
          username: adminData.username,
          email: adminData.email,
          password: hashedPassword,
          role: "admin",
          profile: {
            name: adminData.profile.name,
          },
          account_status: adminData.account_status || "active",
          created_at: new Date(),
        };

        const result = await users.insertOne(newAdmin);
        res.status(201).json({
          success: true,
          message: "Admin created successfully",
          id: result.insertedId,
        });
      } catch (err) {
        console.error("Create admin error:", err);
        res.status(500).json({
          success: false,
          message: "Error creating admin",
          error: err.message,
        });
      }
    });

    // PUT update admin
    app.put("/api/admins/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const adminId = req.params.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.role;
        delete updateData.created_at;

        // Handle password update
        if (updateData.password) {
          updateData.password = await hashPasswordPHPCompatible(
            updateData.password
          );
        } else {
          delete updateData.password;
        }

        const result = await users.updateOne(
          {
            _id: new ObjectId(adminId),
            role: "admin",
          },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Admin not found" });
        }

        res.json({
          success: true,
          message: "Admin updated successfully",
        });
      } catch (err) {
        console.error("Update admin error:", err);
        res.status(500).json({
          success: false,
          message: "Error updating admin",
          error: err.message,
        });
      }
    });

    // DELETE admin
    app.delete("/api/admins/:id", async (req, res) => {
      try {
        const { users } = getCollections();
        const adminId = req.params.id;

        const result = await users.deleteOne({
          _id: new ObjectId(adminId),
          role: "admin",
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Admin not found" });
        }

        res.json({
          success: true,
          message: "Admin deleted successfully",
        });
      } catch (err) {
        console.error("Delete admin error:", err);
        res.status(500).json({
          success: false,
          message: "Error deleting admin",
          error: err.message,
        });
      }
    });

    // Serve HTML files - Fixed routes
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });

    // Dashboard route
    app.get("/admin/dashboard", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-dashboard.html"));
    });

    // Users route
    app.get("/admin/users", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-users.html"));
    });

    // Drivers route
    app.get("/admin/drivers", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-drivers.html"));
    });

    // Admins route
    app.get("/admin/admins", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin.html"));
    });

    // Keep the old routes for backward compatibility
    app.get("/admin/admin-dashboard.html", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-dashboard.html"));
    });

    app.get("/admin/admin-users.html", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-users.html"));
    });

    app.get("/admin/admin-drivers.html", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin-drivers.html"));
    });

    app.get("/admin/admin.html", (req, res) => {
      res.sendFile(path.join(__dirname, "../html/admin.html"));
    });

    // ==========================================
    // SERVER CONFIGURATION - AUTO-DETECT IP
    // ==========================================
    const PORT = process.env.ADMIN_PORT || 4000;
    const HOST = '0.0.0.0'; // Bind to all interfaces

    // Auto-detect server IP for logging
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let serverIP = 'localhost';
    
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        // Skip internal (i.e., 127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          serverIP = net.address;
          break;
        }
      }
      if (serverIP !== 'localhost') break;
    }

    // Construct admin URL
    let ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL;
    
    if (!ADMIN_DASHBOARD_URL || ADMIN_DASHBOARD_URL.includes('${SERVER_IP}')) {
      ADMIN_DASHBOARD_URL = `http://${serverIP}:${PORT}`;
      console.log(`📍 Auto-constructed ADMIN_DASHBOARD_URL: ${ADMIN_DASHBOARD_URL}`);
    }

    // Start server
    app.listen(PORT, HOST, () => {
      console.log('='.repeat(60));
      console.log('🚀 MerryLift Admin Server Started');
      console.log('='.repeat(60));
      console.log(`📍 Server IP: ${serverIP}`);
      console.log(`🌐 Local Access: http://localhost:${PORT}`);
      console.log(`🌐 Network Access: http://${serverIP}:${PORT}`);
      console.log(`📊 Admin Dashboard: http://${serverIP}:${PORT}/admin/dashboard`);
      console.log(`🔑 Login Endpoint: http://${serverIP}:${PORT}/admin/login`);
      console.log('='.repeat(60));

    });

  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
