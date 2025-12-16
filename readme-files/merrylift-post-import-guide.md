# MerryLift - Post VM Import Setup Guide

## 📋 Prerequisites
- VM successfully imported and running
- SSH access to the server
- Internet connectivity on the VM

---

## Step 1: Check Server IP Address

After starting your VM, find the server's IP address:

```bash
# Check IP address
hostname -I | awk '{print $1}'

# Or use this for more details
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Save this IP address** - you'll need it for accessing the application.

Example output: `192.168.1.100`

---

## Step 2: Access the VM

```bash
# SSH into your server (from your local machine)
ssh your-username@YOUR_SERVER_IP

# Example:
# ssh cappucina@192.168.1.100
```

---

## Step 3: Navigate to Project Directory

```bash
# Go to the application directory
cd /var/www/merrylift

# Verify you're in the correct directory
pwd
# Should output: /var/www/merrylift
```

---

## Step 4: Pull Latest Changes from GitHub

```bash
# Check current branch
git branch

# Pull latest changes
git pull origin main

# If you encounter permission issues:
sudo chown -R $USER:$USER /var/www/merrylift
git pull origin main

# If merge conflicts occur, stash local changes first:
git stash
git pull origin main
```

---

## Step 5: Update Server IP in Configuration

```bash
# Get your current server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Your Server IP: $SERVER_IP"

# Update .env file with new IP
sudo nano /var/www/merrylift/.env
```

Update these lines in `.env`:
```env
ADMIN_DASHBOARD_URL=http://YOUR_SERVER_IP:4000
```

**Replace `YOUR_SERVER_IP` with the actual IP from Step 1**

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 6: Update Application URLs

Run these commands to update all localhost references to your server IP:

```bash
# Store IP in variable
SERVER_IP=$(hostname -I | awk '{print $1}')

# Update PHP files
sudo find . -type f -name "*.php" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.php" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +

# Update JavaScript files
sudo find . -type f -name "*.js" -not -path "./node_modules/*" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.js" -not -path "./node_modules/*" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +

# Update HTML files
sudo find . -type f -name "*.html" -exec sed -i "s|http://localhost:3000|http://${SERVER_IP}|g" {} +
sudo find . -type f -name "*.html" -exec sed -i "s|http://localhost:4000|http://${SERVER_IP}:4000|g" {} +

# Verify changes
echo "Updated to use IP: $SERVER_IP"
```

---

## Step 7: Install/Update Dependencies

```bash
# Update PHP dependencies
composer install --no-dev

# Update Node.js dependencies
npm install

# If you encounter permission errors:
sudo chown -R $USER:$USER node_modules
npm install
```

---

## Step 8: Restart All Services

```bash
# Restart Apache
sudo systemctl restart apache2

# Restart Node.js Admin Server
sudo systemctl restart merrylift-admin

# Restart MongoDB (if needed)
docker restart mongodb

# Check service status
sudo systemctl status apache2
sudo systemctl status merrylift-admin
docker ps
```

---

## Step 9: Verify Services are Running

```bash
# Check if all services are active
echo "=== Apache Status ==="
sudo systemctl is-active apache2

echo "=== Admin Server Status ==="
sudo systemctl is-active merrylift-admin

echo "=== MongoDB Status ==="
docker ps --filter name=mongodb --format "{{.Status}}"

# View logs if there are issues
# Apache logs:
sudo tail -f /var/log/apache2/merrylift_error.log

# Admin server logs:
sudo journalctl -u merrylift-admin -f

# MongoDB logs:
docker logs mongodb --tail 50
```

---

## Step 10: Test Application Access

From your **local machine** (not the server), open a web browser and test:

1. **Main Application**
   ```
   http://YOUR_SERVER_IP/
   ```

2. **Admin Dashboard**
   ```
   http://YOUR_SERVER_IP:4000/admin/dashboard
   ```

3. **Login Page**
   ```
   http://YOUR_SERVER_IP/html/login.html
   ```

**Replace `YOUR_SERVER_IP` with the actual IP from Step 1**

---

## 🔧 Common Troubleshooting

### Issue: "Can't connect to the application"

**Solution:**
```bash
# Check firewall
sudo ufw status

# If ports are blocked, allow them:
sudo ufw allow 80/tcp
sudo ufw allow 4000/tcp
sudo ufw reload
```

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Restart MongoDB
docker restart mongodb

# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs mongodb --tail 50

# Test MongoDB connection
docker exec -it mongodb mongo --eval "db.version()"
```

### Issue: "Admin server not responding"

**Solution:**
```bash
# Check admin server status
sudo systemctl status merrylift-admin

# Restart admin server
sudo systemctl restart merrylift-admin

# View real-time logs
sudo journalctl -u merrylift-admin -f
```

### Issue: "PHP errors showing"

**Solution:**
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/merrylift_error.log

# Verify PHP extensions
php -m | grep mongodb

# If mongodb extension missing:
sudo apt install php8.3-mongodb
sudo systemctl restart apache2
```

### Issue: "Changes not reflecting after git pull"

**Solution:**
```bash
# Clear any caches
sudo systemctl restart apache2
sudo systemctl restart merrylift-admin

# Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

# Check if files were actually updated
git log -1
git status
```

---

## 📝 Quick Command Reference

```bash
# View server IP
hostname -I | awk '{print $1}'

# Navigate to project
cd /var/www/merrylift

# Pull updates
git pull origin main

# Restart all services
sudo systemctl restart apache2 merrylift-admin && docker restart mongodb

# Check all service status
sudo systemctl status apache2 merrylift-admin && docker ps

# View logs
sudo tail -f /var/log/apache2/merrylift_error.log
sudo journalctl -u merrylift-admin -f
docker logs mongodb --tail 50
```

---

## 🎯 Post-Update Checklist

- [ ] Server IP identified
- [ ] Latest code pulled from GitHub
- [ ] .env file updated with correct IP
- [ ] All localhost URLs updated to server IP
- [ ] Dependencies installed/updated
- [ ] All services restarted
- [ ] Services verified as running
- [ ] Application accessible from browser
- [ ] Admin dashboard accessible
- [ ] Login functionality working

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the main README.md for detailed setup instructions
2. Review service logs for specific error messages
3. Create a GitHub issue with error details
4. Contact team members for support

---

**© 2025 Team Cappucina | MerryLift**
