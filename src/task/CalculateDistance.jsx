// Function to calculate distance between two coordinates
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (Math.PI * value) / 180; // Convert degrees to radians
    const R = 6371; // Radius of the Earth in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
};

// Example usage
const lat1 = 37.7749; // Latitude of Point 1
const lon1 = -122.4194; // Longitude of Point 1
const lat2 = 34.0522; // Latitude of Point 2
const lon2 = -118.2437; // Longitude of Point 2

const distance = haversineDistance(lat1, lon1, lat2, lon2);
console.log(`Distance: ${distance.toFixed(2)} km`); // Outputs the distance
