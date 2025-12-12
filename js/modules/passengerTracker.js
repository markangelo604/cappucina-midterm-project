window.PassengerTracker = {
    interval: null,
    marker: null,

    start(rideId, map) {
        console.log("👀 Passenger is now tracking driver for ride:", rideId);

        this.map = map;

        // Poll every 10 seconds
        this.interval = setInterval(() => this.fetchLocation(rideId), 10000);

        // First immediate load
        this.fetchLocation(rideId);
    },

    async fetchLocation(rideId) {
        console.log("📍 PassengerTracker FETCH running...");
        const res = await fetch(`../php/get-driver-location.php?ride_id=${rideId}`);
        const data = await res.json();

        if (!data.success || !data.lat || !data.lng) return;

        const pos = { lat: data.lat, lng: data.lng };

        if (!this.marker) {
            this.marker = new google.maps.Marker({
                map: this.map,
                position: pos,
                icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                title: "Driver Location"
            });
        } else {
            this.marker.setPosition(pos);
        }
    }
};
