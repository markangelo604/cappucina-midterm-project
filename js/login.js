// login.js
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// Dashboard redirect mapping
const dashboardRedirect = {
    'admin': '/admin/dashboard',
    'driver': '../html/passenger-dashboard.html',
    'car_owner': '../html/passenger-dashboard.html',
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

        // Get current host and construct admin URL
        const currentHost = window.location.hostname;
        const adminPort = 4000;
        const adminUrl = `http://${currentHost}:${adminPort}/admin/login`;

        console.log('Attempting admin login at:', adminUrl);
        
        let response = await fetch(adminUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        
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
                window.location.href = adminUrl.replace('/admin/login', '/admin/dashboard');
            }, 1000);
            return; // Exit after successful admin login
        }
        
        // If admin login failed, try regular user login (PHP server)
        console.log('Not an admin, trying regular user login');
        
        response = await fetch('/php/login.php', {
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
                    if (role === 'admin') {
                        // For admin, use the constructed admin URL
                        window.location.href = `http://${currentHost}:${adminPort}${dashboardUrl}`;
                    } else {
                        // For other roles, use relative path
                        window.location.href = dashboardUrl;
                    }
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