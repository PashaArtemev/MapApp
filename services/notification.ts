import * as Notifications from 'expo-notifications';

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
}

export class NotificationService {
  private shownNotificationIds: Set<string> = new Set();

  constructor() {
    this.setupNotificationHandler();
  }

  // Настройка обработчика уведомлений
  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // Запрос разрешений на уведомления
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      
      if (!granted) {
        console.warn('⚠️ Notification permission not granted');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  // Показ уведомления
  async showNotification(options: NotificationOptions): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: options.sound ?? true,
        },
        trigger: null, // Немедленное уведомление
      });
      
      console.log(`🔔 Notification sent: ${options.title}`);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      throw error;
    }
  }

  // Показ уведомления о близости к маркеру
  async showProximityNotification(markerTitle: string, distance: number, markerId: string): Promise<void> {
    const notificationId = `proximity_${markerId}`;
    
    // Проверяем, не показывали ли уже это уведомление
    if (this.shownNotificationIds.has(notificationId)) {
      return;
    }

    try {
      await this.showNotification({
        title: 'Вы рядом с маркером! 📍',
        body: `"${markerTitle}" находится в ${distance.toFixed(0)} метрах от вас`,
        data: { markerId },
        sound: true,
      });

      // Запоминаем показанное уведомление
      this.shownNotificationIds.add(notificationId);
      
      // Удаляем из памяти через 5 минут
      setTimeout(() => {
        this.shownNotificationIds.delete(notificationId);
      }, 5 * 60 * 1000);
      
      console.log(`🔔 Proximity notification sent for marker: ${markerTitle}, distance: ${distance}m`);
    } catch (error) {
      console.error('❌ Error showing proximity notification:', error);
    }
  }

  // Очистка всех уведомлений
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      this.shownNotificationIds.clear();
      console.log('🗑️ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  // Удаление конкретного уведомления из памяти
  removeNotificationFromMemory(notificationId: string): void {
    this.shownNotificationIds.delete(notificationId);
  }

  // Проверка, было ли уже показано уведомление
  hasNotificationBeenShown(notificationId: string): boolean {
    return this.shownNotificationIds.has(notificationId);
  }
}

// Экспорт по умолчанию для совместимости
export default NotificationService;