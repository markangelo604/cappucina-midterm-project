# MerryLift - Carpooling Platform

A comprehensive carpooling web application for SLU Maryheights Campus, built with PHP, Node.js, and MongoDB.

---

# USE THIS COMMANDS IN YOUR PROJECT FOLDER TO USE .ENV, MONGODB AND EXPRESS
- `composer require mongodb/mongodb vlucas/phpdotenv react/http psr/http-message react/socket`
- `npm install`

# TO RUN BOTH ADMIN AND CLIENT SERVERS EXECUTE THE admin_node.js USING:
- *Double click the start-servers.bat*
  or
- *use the command `.\start-servers.bat`*
# Team Cappucina's Midterm Project - Carpooling App

---

## 📌 Project Overview

MerryLift is a carpooling platform designed exclusively for the SLU Maryheights Campus community. The application connects students and faculty who want to share rides, reducing transportation costs and promoting sustainable commuting.

**Course**: Web Technologies (IT 312)  
**Instructor**: Britanny Baldovino  
**Project Type**: Midterm Project

---

## 👥 Team Members

- **Bautista, Josh Marcus** - [@jshmrcsb](https://github.com/jshmrcsb)
- **Beset, Sam Ryleigh** - [@yowghyt](https://github.com/yowghyt)
- **Contillo, Daniel Roi** - [@sora598](https://github.com/sora598)
- **Damocles, Jhezreen Adriana** - [@drianajd](https://github.com/drianajd)
- **Domalanta, Mark Angelo** - [@markangelo604](https://github.com/markangelo604)
- **Javier, Charles Louis** - [@JayJay3937](https://github.com/JayJay3937)
- **Manaois, John Michael** - [@mightjm](https://github.com/mightjm)

<a href="https://github.com/markangelo604/cappucina-midterm-project/graphs/contributors">
  <img class="dark-light" src="https://contrib.rocks/image?repo=markangelo604/cappucina-midterm-project&anon=0&columns=25&max=100&r=true" />
</a>

---

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3** - Structure and styling
- **JavaScript (ES6+)** - Client-side logic
- **Google Maps API** - Route visualization and location services

### Backend
- **PHP 8.x** - Server-side logic and API endpoints
- **Node.js** - Admin server and email notifications
- **Express.js** - Node.js web framework

### Database
- **MongoDB** - NoSQL database for flexible data storage

### Server
- **Apache 2.4** - Web server for PHP
- **Node.js Server** - Separate admin server

### Additional Tools
- **Composer** - PHP dependency management
- **npm** - Node.js package management
- **Docker** - MongoDB containerization
- **Nodemailer** - Email notifications

---

## ✨ Features

### Passenger Features
- 🔍 **Search & Book Rides** - Find available rides with advanced filters
- 📍 **Interactive Map** - View routes and select pickup points
- 💳 **Secure Payment** - Multiple payment options (Card, GCash, PayMaya, Cash)
- 📱 **Real-time Tracking** - Track driver location during rides
- 📊 **Booking Management** - View and manage ride bookings
- ⭐ **Rating System** - Rate and review drivers

### Driver Features
- 🚗 **Ride Management** - Create, update, and delete ride schedules
- 📍 **Route Planning** - Interactive route planning with Google Maps
- 💰 **Automatic Fare Calculation** - Distance-based pricing
- 👥 **Passenger Management** - View passenger pickup points
- 📊 **Dashboard** - Track rides and earnings

### Admin Features
- 👥 **User Management** - CRUD operations for all users
- 🚗 **Driver Verification** - Approve/reject driver applications
- 📧 **Email Notifications** - Automated approval/rejection emails
- 📊 **Analytics Dashboard** - View platform statistics
- 🔐 **Role-based Access** - Secure admin authentication

---

## 💻 Local Development Setup

### Prerequisites

- PHP 8.0 or higher
- Node.js 16.x or higher
- MongoDB 6.0 or higher
- Composer
- npm

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/markangelo604/cappucina-midterm-project.git
cd cappucina-midterm-project
```

2. **Install PHP dependencies**
```bash
composer require mongodb/mongodb vlucas/phpdotenv react/http psr/http-message react/socket
```

3. **Install Node.js dependencies**
```bash
npm install
```

4. **Set up environment variables**

Create a `.env` file in the root directory:

```env
PORT=3000
ADMIN_PORT=4000
LOCALHOST=mongodb://localhost:27017
DATABASE=CarpoolDB
USERCOLLECTION=users
RIDESCOLLECTION=rides
BOOKINGSCOLLECTION=bookings
REVIEWSCOLLECTION=reviews
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=grantify.jobs@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM="Carpool Support <carpool.support@gmail.com>"
ADMIN_DASHBOARD_URL=http://localhost:4000
```

5. **Start MongoDB**
```bash
mongod --dbpath /path/to/data/directory
```

6. **Start the servers**

On Windows:
```bash
start-servers.bat
```

Or manually:
```bash
# Terminal 1 - PHP Server
php -S localhost:3000

# Terminal 2 - Node.js Admin Server
node Server/admin-node.js
```

7. **Access the application**
- **Passenger/Driver Interface**: http://localhost:3000
- **Admin Dashboard**: http://localhost:4000/admin/dashboard

---

## 🚀 Production Deployment on Ubuntu Server

### System Requirements

- **OS**: Ubuntu Server 22.04 LTS
- **RAM**: 4GB minimum
- **CPU**: 4 cores
- **Storage**: 20GB minimum

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y apache2 php8.3 php8.3-cli php8.3-curl php8.3-mbstring \
    php8.3-xml php8.3-zip libapache2-mod-php8.3 curl git unzip

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Step 2: Install and Configure MongoDB with Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
# Or run: newgrp docker

# Create MongoDB data directory
sudo mkdir -p /data/mongodb
sudo chown -R $USER:$USER /data/mongodb

# Create Docker network for MongoDB
docker network create carpool-network

# Run MongoDB container with auto-restart
docker run -d \
  --name mongodb \
  --network carpool-network \
  --restart unless-stopped \
  -p 27017:27017 \
  -v /data/mongodb:/data/db \
  -e MONGO_INITDB_DATABASE=CarpoolDB \
  mongo:4.4.29

# Verify MongoDB is running
docker ps
docker logs mongodb
```

### Step 3: Configure Apache for PHP

```bash
# Get your server's IP address
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"

# Clone the repository
cd /var/www
sudo git clone https://github.com/markangelo604/cappucina-midterm-project.git merrylift
sudo chown -R cappucina:cappucina /var/www/merrylift
sudo chmod -R 755 merrylift

# Install PHP dependencies
cd merrylift
composer require mongodb/mongodb vlucas/phpdotenv react/http psr/http-message react/socket

# Install Node.js dependencies
npm install

# Create .env file with correct IP
sudo tee .env > /dev/null <<EOF
PORT=3000
ADMIN_PORT=4000
LOCALHOST=mongodb://localhost:27017
DATABASE=CarpoolDB
USERCOLLECTION=users
RIDESCOLLECTION=rides
BOOKINGSCOLLECTION=bookings
REVIEWSCOLLECTION=reviews
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=grantify.jobs@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM="Carpool Support <carpool.support@gmail.com>"
ADMIN_DASHBOARD_URL=http://${SERVER_IP}:4000
EOF

# Set permissions for .env
sudo chmod 600 .env
```

### Step 4: Configure Apache Virtual Host

```bash
# Create Apache configuration
sudo tee /etc/apache2/sites-available/merrylift.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName ${SERVER_IP}
    DocumentRoot /var/www/merrylift
    
    <Directory /var/www/merrylift>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # PHP Configuration
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    
    ErrorLog \${APACHE_LOG_DIR}/merrylift_error.log
    CustomLog \${APACHE_LOG_DIR}/merrylift_access.log combined
</VirtualHost>
EOF

# Enable site and required modules
sudo a2ensite merrylift.conf
sudo a2enmod rewrite
sudo a2dissite 000-default.conf

# Test Apache configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
sudo systemctl enable apache2
```

### Step 5: Configure Node.js Admin Server

Update `Server/admin-node.js` to use environment variables for IP binding:

```bash
# Edit the admin-node.js file
sudo nano Server/admin-node.js
```

Find the line with `app.listen(PORT, ...)` and modify it to:

```javascript
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
```

Update `.env` file:

```bash
# Add HOST variable
echo "HOST=0.0.0.0" | sudo tee -a /var/www/merrylift/.env
```

### Step 6: Create Systemd Services for Auto-Start

#### Create MongoDB startup service

```bash
# MongoDB starts automatically with Docker --restart unless-stopped
# Verify it's set to auto-start
docker update --restart unless-stopped mongodb
```

#### Create Node.js Admin Server Service

```bash
sudo tee /etc/systemd/system/merrylift-admin.service > /dev/null <<EOF
[Unit]
Description=MerryLift Admin Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
EnvironmentFile=/var/www/merrylift/.env
WorkingDirectory=/var/www/merrylift
ExecStart=/usr/bin/node Server/admin-node.js
User=cappucina
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable merrylift-admin.service
sudo systemctl start merrylift-admin.service

# Check status
sudo systemctl status merrylift-admin.service
```

### Step 7: Configure Firewall

```bash
# Allow HTTP, HTTPS, and Admin port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp
sudo ufw allow 22/tcp  # SSH

# Enable firewall
sudo ufw enable
sudo ufw status
```

### Step 8: Update Application URLs

Update all hardcoded `localhost` references to use the server IP:

```bash
# Find and replace localhost with server IP in PHP files
cd /var/www/merrylift
sudo find . -type f -name "*.php" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.php" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +

# Update JavaScript files
sudo find . -type f -name "*.js" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.js" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +

# Update HTML files
sudo find . -type f -name "*.html" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.html" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +
```

### Step 9: Create Admin User

```bash
# Connect to MongoDB and create admin user
docker exec -it mongodb mongo CarpoolDB

# In MongoDB shell:
db.users.insertOne({
  username: "admin",
  password: "$2y$10$323OpR74c7iZGaRRJKPGCeQE0GqOj8ch.kfvs9n1enF.yhQbXrdGy",  // Use bcrypt hash
  email: "admin@merrylift.com",
  role: "admin",
  profile: {
    name: "System Administrator"
  },
  account_status: "active",
  created_at: new Date()
})
```

### Step 10: Verify Deployment

```bash
# Check all services
sudo systemctl status apache2
sudo systemctl status merrylift-admin
docker ps

# Check logs
sudo journalctl -u merrylift-admin -f
sudo tail -f /var/log/apache2/merrylift_error.log

# Test connectivity
curl http://localhost
curl http://localhost:4000
```

#### Message for the Developer Team:
If there are error such as not reading the mongodb using the php but can access the admin check the extensions if there are in the php.ini:
```
ls /etc/php/8.3/

# It will list 3 folder:
# apache2  cli  mods-available

# Access the file in those 3 (apache2=php.ini  cli=php.ini  mods-available=mongodb.ini)
sudo nano /etc/php/8.3/

# Find for extension=mongodb.so in all 3 file .ini
```

### Access URLs

- **Passenger Interface**: `http://YOUR_SERVER_IP/`
- **Admin Dashboard**: `http://YOUR_SERVER_IP:4000/admin/dashboard`
- **Login Page**: `http://YOUR_SERVER_IP/html/login.html`

---

## 📅 Submission Details  
- **Course:** Web Technologies (9467 - IT 312)  
- **Instructor:** Britanny Baldovino 
- **Project:** Final Project
- **Due Date:** *To be determined*

## 📞 Contact & Support
For questions about this project:
- **Academic Inquiries:** Contact through the team members or course instructor
- **Technical Issues:** Create GitHub issue

## 📜 License & Usage
This project is created solely for educational purposes as part of our Web Technologies Final Project. All content is intended for academic evaluation and learning purposes.

---

**© 2025 Team Cappucina | Web Technologies IT 312 | Final Project**
