// ========================================
// LOGIN HANDLER
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    checkExistingSession();
});

async function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    // Get form data
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;
    
    try {
        const response = await fetch('../php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data in sessionStorage
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'passenger') {
                    window.location.href = '../html/passenger-dashboard.html';
                } else if (data.user.role === 'car_owner' || data.user.role === 'driver') {
                    window.location.href = '../html/driver-dashboard.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 1000);
            
        } else {
            // Show error message
            showMessage(data.message || 'Login failed', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Connection error. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

async function checkExistingSession() {
    try {
        const response = await fetch('../php/check-session.php');
        const data = await response.json();
        
        if (data.logged_in && data.user) {
            // User is already logged in
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            
            // Redirect if on login page
            if (window.location.pathname.includes('login.html')) {
                if (data.user.role === 'passenger') {
                    window.location.href = '../html/passenger-dashboard.html';
                } else if (data.user.role === 'car_owner' || data.user.role === 'driver') {
                    window.location.href = '../html/driver-dashboard.html';
                } else {
                    window.location.href = '../index.html';
                }
            }
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.textContent = message;
    
    // Add styles
    messageDiv.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 16px;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
        animation: slideDown 0.3s ease;
    `;
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    // Insert before form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.insertAdjacentElement('beforebegin', messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);