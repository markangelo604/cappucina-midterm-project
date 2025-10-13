// index.js

// Handle normal login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    // send credentials to server
    try {
        // how to send to server


        //if ok, determine if admin, driver, or user then redirect them to their designated dashboards or homepages.
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again.");
    }
});


// Handle Google Sign-In
// in the future
