
function recordPoint() {
    document.getElementById('record-point').addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy; // Accuracy in meters

                const locationData = { latitude, longitude, accuracy };

                fetch('//api/record-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(locationData)
                });

                alert(`Your location is: Latitude: ${latitude}, Longitude: ${longitude} (Accuracy: ${accuracy} meters)`);
            },
            (error) => {
                alert("Error: Unable to retrieve location. " + error.toString());
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,  // Timeout after 5 seconds
                maximumAge: 0  // No cached position
            }
        );
    });
}