window.DriverTracker = {
    interval: null,
    marker: null,

    start(rideId) {
        console.log("📡 Driver tracking started for ride:", rideId);

        // update every 10 seconds
        this.interval = setInterval(() => this.update(rideId), 10000);

        // immediate first update
        this.update(rideId);
    },

    update(rideId) {
        console.log("⏳ DriverTracker UPDATE running...");
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Update marker on driver map (if exists)
            if (window.userMarkerDriver) {
                window.userMarkerDriver.setPosition({ lat, lng });
            }

            // Send to server
            fetch("../php/update-driver-location.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ride_id: rideId,
                    lat: lat,
                    lng: lng
                })
            }).catch(err => console.error("Failed to update location:", err));
        });
    }
};
