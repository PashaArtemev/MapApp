import * as Location from 'expo-location';
import { UserLocation } from '../types';

export class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private onLocationUpdate?: (location: UserLocation) => void;

  constructor(onLocationUpdate?: (location: UserLocation) => void) {
    this.onLocationUpdate = onLocationUpdate;
  }

  // Запрос разрешений
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        console.warn('⚠️ Location permission not granted');
        return false;
      }

      await Location.enableNetworkProviderAsync();
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  // Получение текущего местоположения
  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: location.timestamp,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        accuracy: location.coords.accuracy ?? undefined,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  // Начало отслеживания местоположения
  async startTracking(options?: {
    accuracy?: Location.LocationAccuracy;
    distanceInterval?: number;
    timeInterval?: number;
  }): Promise<void> {
    if (this.isTracking) return;

    try {
      console.log('📍 Starting location tracking');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 10,
          timeInterval: options?.timeInterval || 5000,
        },
        (newLocation) => {
          const userLocation: UserLocation = {
            coords: {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            },
            timestamp: newLocation.timestamp,
            heading: newLocation.coords.heading ?? undefined,
            speed: newLocation.coords.speed ?? undefined,
            accuracy: newLocation.coords.accuracy ?? undefined,
          };

          if (this.onLocationUpdate) {
            this.onLocationUpdate(userLocation);
          }
        }
      );

      this.isTracking = true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }

  // Остановка отслеживания
  stopTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('📍 Location tracking stopped');
  }

  // Проверка, активно ли отслеживание
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  // Расчет расстояния между двумя точками
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Расстояние в метрах
  }

  // Проверка близости к точке
  static isWithinRadius(
    userLat: number,
    userLon: number,
    markerLat: number,
    markerLon: number,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, markerLat, markerLon);
    return distance <= radius;
  }
}

// Экспорт по умолчанию для совместимости
export default LocationService;