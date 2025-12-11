import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Text, View } from "react-native";
import { db, initDatabase } from "./database";
import { MapMarker, MarkerContext } from "./types";

// Импортируем сервисы
import LocationService from "./services/location";
import NotificationService from "./services/notification";
import ProximityService from "./services/proximity";

export const MarkerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  
  // Используем useRef для хранения экземпляров сервисов
  const notificationServiceRef = useRef<NotificationService | null>(null);
  const locationServiceRef = useRef<LocationService | null>(null);
  const proximityServiceRef = useRef<ProximityService | null>(null);

  // Инициализация приложения
  useEffect(() => {
    initializeApp();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      stopLocationTracking();
      subscription.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing app...");
      
      // Инициализируем сервисы
      notificationServiceRef.current = new NotificationService();
      locationServiceRef.current = new LocationService(handleLocationUpdate);
      proximityServiceRef.current = new ProximityService(notificationServiceRef.current);
      
      // Инициализируем базу данных
      await initDatabase();
      
      // Загружаем маркеры
      await refreshMarkers();
      
      // Запрашиваем разрешения
      await requestPermissions();
      
      setIsInitialized(true);
      console.log("✅ App initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
    }
  };

  const requestPermissions = async () => {
    try {
      console.log("🔐 Requesting permissions...");
      
      if (locationServiceRef.current && notificationServiceRef.current) {
        const [locationGranted, notificationsGranted] = await Promise.all([
          locationServiceRef.current.requestPermissions(),
          notificationServiceRef.current.requestPermissions(),
        ]);

        console.log(`📍 Location permission: ${locationGranted ? 'granted' : 'denied'}`);
        console.log(`🔔 Notification permission: ${notificationsGranted ? 'granted' : 'denied'}`);

        return locationGranted && notificationsGranted;
      }
      return false;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  };

  // Обработчик обновления местоположения
  const handleLocationUpdate = (location: any) => {
    console.log("📍 Location updated:", location.coords);
    setUserLocation(location);
    
    // Проверяем близость при каждом обновлении местоположения
    if (proximityServiceRef.current) {
      proximityServiceRef.current.checkProximityToMarkers(location, markers);
    }
  };

  // Функция обновления списка маркеров
  const refreshMarkers = async (): Promise<void> => {
    try {
      console.log("🔄 Refreshing markers...");
      
      // Сначала получаем маркеры без изображений
      const markersResult = await db.getAllAsync(`
        SELECT 
          id,
          latitude,
          longitude,
          title,
          description,
          created_at
        FROM markers
        ORDER BY created_at DESC
      `);

      // Затем для каждого маркера получаем изображения
      const markersData: MapMarker[] = await Promise.all(
        markersResult.map(async (row: any) => {
          const imagesResult = await db.getAllAsync(
            `SELECT uri FROM marker_images WHERE marker_id = ?`,
            [row.id]
          );
          
          const images = imagesResult.map((img: any) => img.uri);
          
          // Пытаемся получить значения для новых колонок, если они есть
          let notificationEnabled = true;
          let notificationRadius = 100;
          
          try {
            const extendedInfo = await db.getFirstAsync(
              `SELECT notification_enabled, notification_radius FROM markers WHERE id = ?`,
              [row.id]
            );
            
            if (extendedInfo) {
              const info = extendedInfo as any;
              notificationEnabled = info.notification_enabled !== 0;
              notificationRadius = info.notification_radius || 100;
            }
          } catch (e) {
            console.log("ℹ️ Using default notification settings for marker:", row.id);
          }
          
          return {
            id: row.id.toString(),
            coordinate: {
              latitude: row.latitude,
              longitude: row.longitude,
            },
            title: row.title || "Без названия",
            description: row.description || "",
            images: images,
            notificationEnabled: notificationEnabled,
            notificationRadius: notificationRadius,
            created_at: row.created_at,
          };
        })
      );

      setMarkers(markersData);
      console.log(`✅ ${markersData.length} markers loaded`);
    } catch (error) {
      console.error("❌ Error refreshing markers:", error);
      setMarkers([]);
    }
  };

  // Добавление маркера
  const addMarker = async (
    coordinate: any,
    title?: string,
    description?: string
  ): Promise<MapMarker> => {
    try {
      console.log("➕ Adding marker...");
      
      const markerTitle = title || `Маркер ${markers.length + 1}`;
      const markerDescription = description || "";

      let result;
      try {
        // Пытаемся использовать запрос с новыми колонками
        result = await db.runAsync(
          "INSERT INTO markers (latitude, longitude, title, description, notification_enabled, notification_radius) VALUES (?, ?, ?, ?, 1, 100)",
          [
            coordinate.latitude,
            coordinate.longitude,
            markerTitle,
            markerDescription,
          ]
        );
      } catch (insertError) {
        // Если не получилось, используем старый запрос
        console.log("⚠️ Using fallback insert query");
        result = await db.runAsync(
          "INSERT INTO markers (latitude, longitude, title, description) VALUES (?, ?, ?, ?)",
          [
            coordinate.latitude,
            coordinate.longitude,
            markerTitle,
            markerDescription,
          ]
        );
      }

      const lastInsertRowId = (result as any).lastInsertRowId;

      const newMarker: MapMarker = {
        id: lastInsertRowId.toString(),
        coordinate,
        title: markerTitle,
        description: markerDescription,
        images: [],
        notificationEnabled: true,
        notificationRadius: 100,
      };

      await refreshMarkers();
      console.log("✅ Marker added:", newMarker);
      
      return newMarker;
    } catch (error) {
      console.error("❌ Error adding marker:", error);
      throw error;
    }
  };

  // Обновление маркера
  const updateMarker = async (
    id: string,
    updates: Partial<MapMarker>
  ): Promise<MapMarker | null> => {
    try {
      if (!updates.title) {
        throw new Error("Title is required for update");
      }

      console.log("✏️ Updating marker:", id);
      
      const title = updates.title;
      const description = updates.description || "";
      
      try {
        // Пытаемся использовать полный запрос с новыми колонками
        const notificationEnabled = updates.notificationEnabled ? 1 : 0;
        const notificationRadius = updates.notificationRadius || 100;
        
        await db.runAsync(
          "UPDATE markers SET title = ?, description = ?, notification_enabled = ?, notification_radius = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [
            title,
            description,
            notificationEnabled,
            notificationRadius,
            parseInt(id)
          ]
        );
      } catch (updateError) {
        // Если не получилось, используем старый запрос
        console.log("⚠️ Using fallback update query");
        await db.runAsync(
          "UPDATE markers SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [
            title,
            description,
            parseInt(id)
          ]
        );
      }

      await refreshMarkers();
      
      const updatedMarker = markers.find(m => m.id === id);
      console.log("✅ Marker updated");
      return updatedMarker || null;
    } catch (error) {
      console.error("❌ Error updating marker:", error);
      throw error;
    }
  };

  // Удаление маркера
  const deleteMarker = async (id: string): Promise<boolean> => {
    try {
      console.log("🗑️ Deleting marker:", id);
      
      await db.runAsync("DELETE FROM markers WHERE id = ?", [parseInt(id)]);
      await refreshMarkers();
      console.log("✅ Marker deleted:", id);
      return true;
    } catch (error) {
      console.error("❌ Error deleting marker:", error);
      throw error;
    }
  };

  // Добавление изображения
  const addImage = async (markerId: string, imageUri: string): Promise<boolean> => {
    try {
      console.log("🖼️ Adding image to marker:", markerId);
      
      await db.runAsync(
        "INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)",
        [parseInt(markerId), imageUri]
      );
      await refreshMarkers();
      console.log("✅ Image added to marker:", markerId);
      return true;
    } catch (error) {
      console.error("❌ Error adding image:", error);
      throw error;
    }
  };

  // Удаление изображения
  const removeImage = async (markerId: string, imageUri: string): Promise<boolean> => {
    try {
      console.log("🗑️ Removing image from marker:", markerId);
      
      await db.runAsync(
        "DELETE FROM marker_images WHERE marker_id = ? AND uri = ?",
        [parseInt(markerId), imageUri]
      );
      await refreshMarkers();
      console.log("✅ Image removed from marker:", markerId);
      return true;
    } catch (error) {
      console.error("❌ Error removing image:", error);
      throw error;
    }
  };

  // Получение изображений маркера
  const getImages = (markerId: string): string[] => {
    const marker = markers.find(m => m.id === markerId);
    return marker?.images || [];
  };

  // Получение маркера по ID
  const getMarkerById = async (id: string): Promise<MapMarker | null> => {
    try {
      console.log("🔍 Getting marker by ID:", id);
      
      // Получаем данные маркера
      const markerResult = await db.getFirstAsync(
        `
        SELECT 
          id,
          latitude,
          longitude,
          title,
          description,
          created_at
        FROM markers 
        WHERE id = ?
      `,
        [parseInt(id)]
      );

      if (!markerResult) return null;
      
      const row = markerResult as any;
      
      // Получаем изображения для этого маркера
      const imagesResult = await db.getAllAsync(
        `SELECT uri FROM marker_images WHERE marker_id = ?`,
        [parseInt(id)]
      );
      
      const images = imagesResult.map((img: any) => img.uri);
      
      // Пытаемся получить значения для новых колонок
      let notificationEnabled = true;
      let notificationRadius = 100;
      
      try {
        const extendedInfo = await db.getFirstAsync(
          `SELECT notification_enabled, notification_radius FROM markers WHERE id = ?`,
          [parseInt(id)]
        );
        
        if (extendedInfo) {
          const info = extendedInfo as any;
          notificationEnabled = info.notification_enabled !== 0;
          notificationRadius = info.notification_radius || 100;
        }
      } catch (e) {
        console.log("ℹ️ Using default notification settings");
      }
      
      const marker: MapMarker = {
        id: row.id.toString(),
        coordinate: {
          latitude: row.latitude,
          longitude: row.longitude,
        },
        title: row.title,
        description: row.description || "",
        images: images,
        notificationEnabled: notificationEnabled,
        notificationRadius: notificationRadius,
        created_at: row.created_at,
      };
      
      return marker;
    } catch (error) {
      console.error("❌ Error getting marker by ID:", error);
      return null;
    }
  };

  // Трекинг местоположения
  const startLocationTracking = async () => {
    try {
      if (!locationServiceRef.current || isTrackingLocation) return;
      
      console.log("📍 Starting location tracking");
      
      // Получаем текущее местоположение
      const currentLocation = await locationServiceRef.current.getCurrentLocation();
      if (currentLocation) {
        setUserLocation(currentLocation);
        
        // Немедленно проверяем близость
        if (proximityServiceRef.current) {
          proximityServiceRef.current.checkProximityToMarkers(currentLocation, markers);
        }
      }
      
      // Запускаем отслеживание
      await locationServiceRef.current.startTracking();
      
      // Запускаем периодическую проверку близости
      if (proximityServiceRef.current) {
        proximityServiceRef.current.startPeriodicChecking(
          () => userLocation,
          () => markers,
          30000
        );
      }
      
      setIsTrackingLocation(true);
      console.log("✅ Location tracking started");
      
    } catch (error) {
      console.error("❌ Error starting location tracking:", error);
      setIsTrackingLocation(false);
    }
  };

  const stopLocationTracking = () => {
    console.log("📍 Stopping location tracking");
    
    if (locationServiceRef.current) {
      locationServiceRef.current.stopTracking();
    }
    
    if (proximityServiceRef.current) {
      proximityServiceRef.current.stopPeriodicChecking();
    }
    
    setIsTrackingLocation(false);
  };

  // Проверка близости ко всем маркерам
  const checkProximityToMarkers = async (location: any) => {
    if (!proximityServiceRef.current) return;
    
    console.log("📏 Checking proximity to markers");
    proximityServiceRef.current.checkProximityToMarkers(location, markers);
  };

  // Обработка изменения состояния приложения
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log("📱 App state changed:", nextAppState);
    
    if (nextAppState === 'active') {
      startLocationTracking();
    } else if (nextAppState === 'background') {
      stopLocationTracking();
    }
  };

  const value = {
    markers,
    userLocation,
    isTrackingLocation,
    addMarker,
    updateMarker,
    deleteMarker,
    addImage,
    removeImage,
    getImages,
    refreshMarkers,
    getMarkerById,
    startLocationTracking,
    stopLocationTracking,
    checkProximityToMarkers,
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Инициализация приложения...</Text>
      </View>
    );
  }

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  );
};