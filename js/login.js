// login.js
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// Dashboard redirect mapping
const dashboardRedirect = {
    'admin': 'http://localhost:4000/admin/dashboard',
    'driver': '../html/driver-dashboard.html',
    'car_owner': '../html/driver-dashboard.html',
    'passenger': '../html/passenger-dashboard.html'
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    errorMsg.textContent = '';
    successMsg.textContent = '';

    // Disable button during submission
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    // Get form data
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate form fields
    if (!username || !password) {
        errorMsg.textContent = 'Please enter both username and password.';
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return;
    }

    try {
        // TRY ADMIN LOGIN FIRST (Node.js server)
        console.log('Attempting admin login for:', username);
        
        let response = await fetch('http://localhost:4000/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        let data = await response.json();
        
        // If admin login successful
        if (data.success) {
            console.log('Admin login successful');
            successMsg.textContent = 'Admin login successful! Redirecting...';
            successMsg.style.display = 'block';
            
            // Store admin data
            const userData = {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role
            };
            
            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            setTimeout(() => {
                window.location.href = 'http://localhost:4000/admin/dashboard';
            }, 1000);
            return; // Exit after successful admin login
        }
        
        // If admin login failed, try regular user login (PHP server)
        console.log('Not an admin, trying regular user login');
        
        response = await fetch('http://localhost:3000/php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();

        if (data.success) {
            successMsg.textContent = data.message || 'Login successful! Redirecting...';
            successMsg.style.display = 'block';

            // Get the dashboard URL based on user role
            let role = data.role.toLowerCase();
            
            // Normalize car_owner to driver
            if (role === 'car_owner') {
                role = 'driver';
            }
            
            const dashboardUrl = dashboardRedirect[role];

            // Store user data
            const userData = {
                id: data.id,
                username: username,
                name: data.name,
                email: data.email,
                phone: data.phone,
                displayName: data.name,
                role: role
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));

            // Redirect after short delay
            if (dashboardUrl) {
                setTimeout(() => {
                    window.location.href = dashboardUrl;
                }, 1000);
            } else {
                errorMsg.textContent = `Invalid user role: ${data.role}`;
                errorMsg.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        } else {
            // Both admin and regular login failed
            errorMsg.textContent = 'Invalid username or password.';
            errorMsg.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred. Please try again later.';
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});