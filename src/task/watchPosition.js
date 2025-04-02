import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { Vibration } from 'react-native';
import Sound from 'react-native-sound';

// Convert degrees to radians
const toRad = (value) => (Math.PI * value) / 180;

// Function to calculate distance in meters
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of Earth in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Enable playback of sound
Sound.setCategory('Playback');

// Load sound files
const sound1 = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load sound1.mp3', error);
});
// const sound1 = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {

const sound2 = new Sound('far.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load sound2.mp3', error);
});

module.exports = async () => {
  console.log('Background Geolocation task started');

  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    locationProvider: 'playServices',
  });

  Geolocation.getCurrentPosition(
    async (pos) => {
      console.log(
        '[Background location]',
        pos.coords.latitude,
        '//',
        pos.coords.longitude,
        '//',
        pos.timestamp
      );

      // Calculate distance from fixed coordinates
      const distance = haversineDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        // 20.349305539229917,
        // 85.8076293756688

        // 20.34910321299701, 85.8080670315035
        // 20.349097531145492, 85.80816378147836
        20.348586322186808, 85.80776216297144
      );
    await AsyncStorage.setItem('distance', JSON.stringify(distance));
      console.log('Distance: in meters ', distance, 'meters');

      // Play corresponding sound based on distance
      if (distance < 70) {
        console.log('Playing sound1 (Distance < 100m)');
        sound1.play((success) => {
          if (!success) console.log('Sound1 playback failed');
        });
      } else {
        console.log('Playing sound2 (Distance >= 100m)');
        sound2.play((success) => {
          if (!success) console.log('Sound2 playback failed');
        });
      }

      // Store last known location
      await AsyncStorage.setItem('lastLocation', JSON.stringify(pos));
    },
    (err) => console.log('Location Error:', err),
    {
      maximumAge: 0,
      timeout: 20000,
    }
  );
};
