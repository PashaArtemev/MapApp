import { MapMarker, UserLocation } from '../types';
import LocationService from './location';
import NotificationService from './notification';

export class ProximityService {
  private notificationService: NotificationService;
  private checkInterval: any = null;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  // Проверка близости ко всем маркерам
  checkProximityToMarkers(
    userLocation: UserLocation,
    markers: MapMarker[]
  ): void {
    if (!markers.length) return;

    try {
      for (const marker of markers) {
        // Пропускаем маркеры с отключенными уведомлениями
        if (!marker.notificationEnabled) continue;

        this.checkProximityToMarker(marker, userLocation);
      }
    } catch (error) {
      console.error('❌ Error checking proximity:', error);
    }
  }

  // Проверка близости к конкретному маркеру
  private checkProximityToMarker(
    marker: MapMarker,
    userLocation: UserLocation
  ): void {
    const distance = LocationService.calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      marker.coordinate.latitude,
      marker.coordinate.longitude
    );

    const radius = marker.notificationRadius || 100;
    
    if (distance <= radius) {
      this.notificationService.showProximityNotification(
        marker.title,
        distance,
        marker.id
      );
    }
  }

  // Запуск периодической проверки
  startPeriodicChecking(
    getUserLocation: () => UserLocation | null,
    getMarkers: () => MapMarker[],
    intervalMs: number = 30000
  ): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      const userLocation = getUserLocation();
      const markers = getMarkers();
      
      if (userLocation && markers.length) {
        this.checkProximityToMarkers(userLocation, markers);
      }
    }, intervalMs);

    console.log(`⏰ Started periodic proximity checking every ${intervalMs / 1000} seconds`);
  }

  // Остановка периодической проверки
  stopPeriodicChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏰ Stopped periodic proximity checking');
    }
  }
}

// Экспорт по умолчанию для совместимости
export default ProximityService;