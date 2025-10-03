const EARTH_RADIUS_M = 6371000; // meters

/** Simple lat/lng type */
export type LatLng = { lat: number; lng: number };

/**
 * Get the current device location once
 * @returns Promise resolving to current lat/lng
 */
export function getCurrentLocation(): Promise<LatLng> {
    return new Promise<LatLng>((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
                const lat: number = position.coords.latitude;
                const lng: number = position.coords.longitude;
                resolve({ lat, lng });
            },
            (error: GeolocationPositionError) => reject(error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
}

/**
 * Watch device location and call callback on updates
 * @param callback Function called with latest lat/lng
 * @returns watchId to clear later
 */
export function watchLocation(callback: (lat: number, lng: number) => void): number {
    if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
    }

    const watchId: number = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
            const lat: number = position.coords.latitude;
            const lng: number = position.coords.longitude;
            callback(lat, lng);
        },
        (error: GeolocationPositionError) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return watchId;
}

/**
 * Alert current location (for testing)
 */
export async function alertCurrentLocation(): Promise<void> {
    try {
        const { lat, lng }: LatLng = await getCurrentLocation();
        alert(`Current location:\nLatitude: ${lat}\nLongitude: ${lng}`);
    } catch (err: any) {
        alert('Error getting location: ' + err);
    }
}

/**
 * Convert GPS coordinates to AR coordinates relative to user
 * @param lat Target latitude
 * @param lng Target longitude
 * @param userLat User latitude
 * @param userLng User longitude
 * @returns x/z offsets in meters relative to user
 */
export function getARPosition(
    lat: number,
    lng: number,
    userLat: number,
    userLng: number
): { x: number; z: number } {
    const deltaLat: number = (lat - userLat) * (Math.PI / 180) * EARTH_RADIUS_M;
    const deltaLng: number =
        (lng - userLng) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos((userLat * Math.PI) / 180);

    return { x: deltaLng, z: -deltaLat };
}
