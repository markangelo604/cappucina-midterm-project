// admin-node.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const { connectDB, getCollections } = require("./Config/database.js");
const path = require("path");
const { ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

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
        const data = await users.find({ driver_status: { $exists: true } }).toArray();
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
          driver_status: { $exists: true },
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
        }

        const result = await users.updateOne(
          {
            _id: new ObjectId(driverId),
            driver_status: { $exists: true },
          },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Driver not found" });
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

    const PORT = process.env.ADMIN_PORT;
    app.listen(PORT, () =>
      console.log(`Admin server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
