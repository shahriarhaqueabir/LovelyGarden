/**
 * Browser geolocation service for getting user's location
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Gets user's current location using browser geolocation API
 * @returns Promise with latitude and longitude
 */
export const getUserLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage;
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location access denied. Please enable location services in your browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'The request to get your location timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving your location.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        timeout: 10000, // 10 seconds
        enableHighAccuracy: true,
        maximumAge: 600000, // 10 minutes
      }
    );
  });
};

/**
 * Watches user's location for updates
 * @param callback - Function to call when location updates
 * @returns Cleanup function to stop watching
 */
export const watchUserLocation = (callback: (coords: Coordinates) => void): (() => void) => {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser');
    return () => {}; // Return noop function
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error('Error watching location:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 300000, // 5 minutes
      timeout: 10000, // 10 seconds
    }
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};