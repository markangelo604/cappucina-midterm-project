# MerryLift HTTPS Setup for Local Network (No Domain Required)

## 🎯 Quick Start - Copy & Paste These Commands

### Step 1: Install SSL Certificate

```bash
# Get your server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Your Server IP: $SERVER_IP"

# Create certificate directory
sudo mkdir -p /etc/ssl/merrylift
cd /etc/ssl/merrylift

# Generate self-signed certificate (valid for 1 year)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/merrylift/server.key \
  -out /etc/ssl/merrylift/server.crt \
  -subj "/C=PH/ST=Metro Manila/L=Taguig/O=MerryLift/CN=${SERVER_IP}" \
  -addext "subjectAltName=IP:${SERVER_IP},DNS:merrylift.local"

# Set proper permissions
sudo chmod 600 /etc/ssl/merrylift/server.key
sudo chmod 644 /etc/ssl/merrylift/server.crt

echo "✅ Certificate created!"
```

### Step 2: Configure Apache for HTTPS

```bash
# Enable SSL module
sudo a2enmod ssl
sudo a2enmod headers

# Create HTTPS configuration
SERVER_IP=$(hostname -I | awk '{print $1}')

sudo tee /etc/apache2/sites-available/merrylift-ssl.conf > /dev/null <<EOF
<VirtualHost *:443>
    ServerName ${SERVER_IP}
    DocumentRoot /var/www/merrylift
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/merrylift/server.crt
    SSLCertificateKeyFile /etc/ssl/merrylift/server.key
    
    <Directory /var/www/merrylift>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    
    ErrorLog \${APACHE_LOG_DIR}/merrylift_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/merrylift_ssl_access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName ${SERVER_IP}
    Redirect permanent / https://${SERVER_IP}/
</VirtualHost>
EOF

# Enable the site
sudo a2ensite merrylift-ssl.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2

echo "✅ Apache HTTPS enabled!"
```

### Step 3: Update Firewall

```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw allow 4443/tcp
sudo ufw reload

echo "✅ Firewall updated!"
```

### Step 4: Update .env File

```bash
cd /var/www/merrylift

# Backup original .env
sudo cp .env .env.backup

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Update .env to use HTTPS
sudo sed -i "s|http://|https://|g" .env
sudo sed -i "s|ADMIN_DASHBOARD_URL=.*|ADMIN_DASHBOARD_URL=https://${SERVER_IP}:4443|g" .env

echo "✅ Environment updated!"
cat .env | grep URL
```

### Step 5: Test Your Setup

```bash
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "Testing HTTPS setup..."
echo "Main site: https://${SERVER_IP}/"
echo "Admin panel: https://${SERVER_IP}:4443/admin/dashboard"

# Test with curl (ignore certificate warnings)
curl -k https://${SERVER_IP}/ | head -n 5
```

---

## 📱 Access from Client Devices (Phones/Tablets/Laptops)

### Method 1: Accept Security Warning (Quick & Easy)

1. **Open browser on your device**
2. **Navigate to**: `https://YOUR_SERVER_IP/`
   - Example: `https://192.168.1.100/`
3. **You'll see a warning**: "Your connection is not private" or "This site is unsafe"
4. **Click**: "Advanced" → "Proceed to [SERVER_IP] (unsafe)"
5. **Repeat** for admin panel: `https://YOUR_SERVER_IP:4443/`

### Method 2: Install Certificate (Better - No More Warnings)

#### For Android Devices:

```bash
# On server, make certificate downloadable
sudo cp /etc/ssl/merrylift/server.crt /var/www/merrylift/
sudo chmod 644 /var/www/merrylift/server.crt
```

**Then on Android:**
1. Open browser → Navigate to: `http://YOUR_SERVER_IP/server.crt`
2. Download the certificate file
3. Go to: **Settings** → **Security** → **Encryption & credentials** → **Install a certificate**
4. Select **CA certificate** → Choose the downloaded file
5. Name it "MerryLift SSL"

#### For iOS Devices:

**On server:**
```bash
sudo cp /etc/ssl/merrylift/server.crt /var/www/merrylift/
```

**Then on iPhone/iPad:**
1. Open Safari → Navigate to: `http://YOUR_SERVER_IP/server.crt`
2. Tap **Allow** to download profile
3. Go to: **Settings** → **Profile Downloaded** → **Install**
4. Go to: **Settings** → **General** → **About** → **Certificate Trust Settings**
5. **Enable** trust for MerryLift SSL

#### For Desktop (Chrome/Edge/Firefox):

**Download certificate from server:**
```bash
scp user@YOUR_SERVER_IP:/etc/ssl/merrylift/server.crt ~/Desktop/
```

**Windows:**
1. Double-click `server.crt`
2. Click **Install Certificate**
3. Select **Local Machine** → **Next**
4. Choose **Place all certificates in the following store**
5. Browse → Select **Trusted Root Certification Authorities**
6. **Finish** → Restart browser

**Mac:**
1. Double-click `server.crt`
2. Keychain Access opens → **Add** to System keychain
3. Find certificate → Right-click → **Get Info**
4. Expand **Trust** → Set to **Always Trust**
5. Restart browser

**Linux:**
```bash
sudo cp server.crt /usr/local/share/ca-certificates/merrylift.crt
sudo update-ca-certificates
```

---

## 🧪 Verify Geolocation Works

After setup, test geolocation:

```javascript
// Open browser console on your phone/laptop
// Navigate to: https://YOUR_SERVER_IP/

navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log('✅ Geolocation working!');
    console.log('Lat:', pos.coords.latitude);
    console.log('Lng:', pos.coords.longitude);
  },
  (err) => {
    console.error('❌ Geolocation failed:', err.message);
  }
);
```

---

## 📋 Quick Reference

| Service | HTTP (Old) | HTTPS (New) |
|---------|-----------|-------------|
| Main Site | `http://SERVER_IP/` | `https://SERVER_IP/` |
| Admin Panel | `http://SERVER_IP:4000/` | `https://SERVER_IP:4443/` |
| Certificate Download | - | `http://SERVER_IP/server.crt` |

---

## 🔧 Troubleshooting

### Issue: "NET::ERR_CERT_AUTHORITY_INVALID"
**Solution**: This is expected with self-signed certificates. Click "Advanced" → "Proceed anyway"

### Issue: Geolocation still not working
**Solution**: 
1. Make sure you're accessing via HTTPS (check address bar for 🔒)
2. Clear browser cache and cookies
3. Grant location permission when browser prompts

### Issue: Can't access from other devices
**Solution**:
```bash
# Check firewall
sudo ufw status

# Ensure these ports are open:
sudo ufw allow 443/tcp
sudo ufw allow 4443/tcp
sudo ufw reload
```

### Issue: Apache won't start
**Solution**:
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Test configuration
sudo apache2ctl configtest

# Check if port 443 is in use
sudo netstat -tlnp | grep :443
```

---

## 🎉 Success Checklist

- [ ] Certificate generated
- [ ] Apache HTTPS configured
- [ ] Firewall rules updated
- [ ] Can access main site via HTTPS
- [ ] Can access admin panel via HTTPS
- [ ] Geolocation permission prompt appears
- [ ] Location is detected successfully

---

## 📌 Notes for Your Project Demo

**For demonstration purposes**, you can tell testers:
1. Access the site using: `https://YOUR_SERVER_IP/`
2. When browser shows security warning: Click "Advanced" → "Proceed"
3. This is normal for local network testing
4. In production, you would use a real SSL certificate from Let's Encrypt (free)

**Certificate expires in 1 year.** To renew:
```bash
# Run the certificate generation command again
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/merrylift/server.key \
  -out /etc/ssl/merrylift/server.crt \
  -subj "/C=PH/ST=Metro Manila/L=Taguig/O=MerryLift/CN=$(hostname -I | awk '{print $1}')" \
  -addext "subjectAltName=IP:$(hostname -I | awk '{print $1}'),DNS:merrylift.local"

# Restart Apache
sudo systemctl restart apache2
```
