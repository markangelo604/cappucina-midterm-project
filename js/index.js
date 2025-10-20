// Login Script request to server
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// Dashboard redirect mapping
const dashboardRedirect = {
    'admin': '../dashboard/admin-dashboard.php',
    'driver': '../dashboard/driver-dashboard.php',
    'client': '../dashboard/client-dashboard.php'
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

        // Parse the response
        const data = await response.json();

        // Handle response
        if (data.success) {
            successMsg.textContent = data.message || 'Login successful! Redirecting...';
            successMsg.style.display = 'block';

            // Get the dashboard URL based on user type
            const userType = data.userType.toLowerCase(); // admin, driver, client
            const dashboardUrl = dashboardRedirect[userType];

            // Log user for debugging
            console.log('User logged in:', {
                id: data.userId,
                name: data.name,
                type: data.userType
            });

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 1000);
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