// Signup Script request to server
const signupForm = document.getElementById('signupForm');
const signupBtn = document.getElementById('signupBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    errorMsg.textContent = '';
    successMsg.textContent = '';

    // Disable button during submission
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';

    // Get form data
    const name = document.getElementById('name').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // Validate form fields
    if (!name || !username || !email || !password || !confirmPassword) {
        errorMsg.textContent = 'Please fill in all fields.';
        errorMsg.style.display = 'block';
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        errorMsg.style.display = 'block';
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
        return;
    }

    // Validate password length
    if (password.length < 8) {
        errorMsg.textContent = 'Password must be at least 8 characters long.';
        errorMsg.style.display = 'block';
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match.';
        errorMsg.style.display = 'block';
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
        return;
    }

    try {
        // Send POST request to PHP server
        const response = await fetch('../php/signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                username: username,
                email: email,
                password: password
            })
        });

        // Parse the response
        const data = await response.json();

        // Handle response
        if (data.success) {
            successMsg.textContent = data.message || 'Account created successfully! Redirecting to login...';
            successMsg.style.display = 'block';

            // Clear form
            signupForm.reset();

            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = '../html/login.html';
            }, 2000);
        } else {
            errorMsg.textContent = data.message || 'Signup failed. Please try again.';
            errorMsg.style.display = 'block';
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred. Please try again later.';
        errorMsg.style.display = 'block';
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
    }
});