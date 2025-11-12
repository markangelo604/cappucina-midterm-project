// Login Script request to server
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// Dashboard redirect mapping - UPDATED to handle car_owner
const dashboardRedirect = {
    'admin': '../html/admin-dashboard.html',
    'driver': '../html/driver-dashboard.html',
    'car_owner': '../html/driver-dashboard.html',  // Handle car_owner role
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
        // Send POST request to PHP server
        const response = await fetch('../php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const data = await response.json();

        // Handle response
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

            // FIXED: Store BOTH username and display name in sessionStorage
            const userData = {
                id: data.id,
                username: username,           // ← ADDED: Store the actual username
                name: data.name,              // ← Keep display name for UI
                displayName: data.name,       // ← Explicit display name
                role: role                    // ← Normalized role
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));

            // Log user for debugging
            console.log('User logged in and credentials stored:', userData);

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
            errorMsg.textContent = data.message || 'Login failed. Please try again.';
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