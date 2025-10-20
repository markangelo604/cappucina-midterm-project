// Login Script request to server
const loginForm = document.getElementsById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

// This will define what dashboard it will redirect based
const dashboardRedirect = {
    'admin': '../dashboard/admin-dashboard.php',
    'driver': '../dashboard/driver-dashboard.php',
    'client': '../dashboard/client-dashboard.php'
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';


    // Get form data
    const username = document.getElementById('username').value;
    const username = document.getElementById('username').value;
    const username = document.getElementById('username').value;
});