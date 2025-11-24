import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { db, initDatabase } from "./database";
import { MapMarker, MarkerContext } from "./types";

export const MarkerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация базы данных при запуске
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await initDatabase();
      await refreshMarkers();
      setIsInitialized(true);
      console.log("Database and markers loaded successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  };

  // MarkerProvider.tsx - улучшенная функция refreshMarkers
  const refreshMarkers = async (): Promise<void> => {
    try {
      console.log("Refreshing markers from DB...");

      const result = await db.getAllAsync(`
      SELECT 
        m.id,
        m.latitude,
        m.longitude,
        m.title,
        m.description,
        m.created_at,
        GROUP_CONCAT(mi.uri) as images
      FROM markers m
      LEFT JOIN marker_images mi ON m.id = mi.marker_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);

      console.log("Raw data from DB:", result);

      const markersData: MapMarker[] = result.map((row: any) => {
        const marker = {
          id: row.id.toString(),
          coordinate: {
            latitude: row.latitude,
            longitude: row.longitude,
          },
          title: row.title || "Без названия",
          description: row.description || "",
          images: row.images ? row.images.split(",") : [],
          created_at: row.created_at,
        };

        console.log("Processed marker:", marker);
        return marker;
      });

      setMarkers(markersData);
      console.log("Total markers loaded:", markersData.length);
    } catch (error) {
      console.error("Error refreshing markers:", error);
      throw error;
    }
  };

  // MarkerProvider.tsx - исправленная функция addMarker
  const addMarker = async (
    coordinate: any,
    title?: string,
    description?: string
  ): Promise<MapMarker> => {
    try {
      const markerTitle = title || `Маркер ${markers.length + 1}`;
      const markerDescription = description || "";

      console.log("Adding marker to DB:", {
        coordinate,
        markerTitle,
        markerDescription,
      });

      const result = await db.runAsync(
        "INSERT INTO markers (latitude, longitude, title, description) VALUES (?, ?, ?, ?)",
        [
          coordinate.latitude,
          coordinate.longitude,
          markerTitle,
          markerDescription,
        ]
      );

      const lastInsertRowId = (result as any).lastInsertRowId;

      if (!lastInsertRowId) {
        throw new Error("Failed to get last insert ID");
      }

      const newMarker: MapMarker = {
        id: lastInsertRowId.toString(),
        coordinate,
        title: markerTitle,
        description: markerDescription,
        images: [],
      };

      await refreshMarkers();
      console.log("Маркер добавлен в БД:", newMarker);
      return newMarker;
    } catch (error) {
      console.error("Error adding marker to database:", error);
      throw error;
    }
  };

  // MarkerProvider.tsx - исправленная функция updateMarker
  const updateMarker = async (
    id: string,
    updates: Partial<MapMarker>
  ): Promise<MapMarker | null> => {
    try {
      // Проверяем наличие обязательных полей
      if (!updates.title) {
        throw new Error("Title is required for update");
      }

      console.log("Updating marker in DB:", { id, updates });

      await db.runAsync(
        "UPDATE markers SET title = ?, description = ? WHERE id = ?",
        [updates.title, updates.description || "", parseInt(id)]
      );

      await refreshMarkers();

      // Получаем обновленный маркер из БД
      const updatedMarkers = await db.getAllAsync(
        `
      SELECT * FROM markers WHERE id = ?
    `,
        [parseInt(id)]
      );

      if (updatedMarkers.length > 0) {
        const row = updatedMarkers[0] as any;
        const updatedMarker: MapMarker = {
          id: row.id.toString(),
          coordinate: {
            latitude: row.latitude,
            longitude: row.longitude,
          },
          title: row.title,
          description: row.description || "",
          images: [], // Будет заполнено при refreshMarkers
        };

        console.log("Маркер обновлен в БД:", updatedMarker);
        return updatedMarker;
      }

      return null;
    } catch (error) {
      console.error("Error updating marker in database:", error);
      throw error;
    }
  };

  const deleteMarker = async (id: string): Promise<boolean> => {
    try {
      await db.runAsync("DELETE FROM markers WHERE id = ?", [parseInt(id)]);

      await refreshMarkers();
      console.log("Маркер удален из БД:", id);
      return true;
    } catch (error) {
      console.error("Error deleting marker from database:", error);
      throw error;
    }
  };

  const addImage = async (
    markerId: string,
    imageUri: string
  ): Promise<boolean> => {
    try {
      await db.runAsync(
        "INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)",
        [parseInt(markerId), imageUri]
      );

      await refreshMarkers();
      console.log("Изображение добавлено к маркеру:", markerId, imageUri);
      return true;
    } catch (error) {
      console.error("Error adding image to database:", error);
      throw error;
    }
  };

  const removeImage = async (
    markerId: string,
    imageUri: string
  ): Promise<boolean> => {
    try {
      await db.runAsync(
        "DELETE FROM marker_images WHERE marker_id = ? AND uri = ?",
        [parseInt(markerId), imageUri]
      );

      await refreshMarkers();
      console.log("Изображение удалено из маркера:", markerId, imageUri);
      return true;
    } catch (error) {
      console.error("Error removing image from database:", error);
      throw error;
    }
  };

  const getImages = (markerId: string): string[] => {
    const marker = markers.find((m) => m.id === markerId);
    return marker?.images || [];
  };

  const getMarkerById = async (id: string): Promise<MapMarker | null> => {
    try {
      const result = await db.getFirstAsync(
        `
        SELECT 
          m.id,
          m.latitude,
          m.longitude,
          m.title,
          m.description,
          m.created_at,
          GROUP_CONCAT(mi.uri) as images
        FROM markers m
        LEFT JOIN marker_images mi ON m.id = mi.marker_id
        WHERE m.id = ?
        GROUP BY m.id
      `,
        [parseInt(id)]
      );

      // Явно типизируем результат
      const row = result as any;

      if (row) {
        const marker: MapMarker = {
          id: row.id.toString(),
          coordinate: {
            latitude: row.latitude,
            longitude: row.longitude,
          },
          title: row.title,
          description: row.description || "",
          images: row.images ? row.images.split(",") : [],
          created_at: row.created_at,
        };
        return marker;
      }

      return null;
    } catch (error) {
      console.error("Error getting marker by ID:", error);
      throw error;
    }
  };

  const value = {
    markers,
    addMarker,
    updateMarker,
    deleteMarker,
    addImage,
    removeImage,
    getImages,
    refreshMarkers,
    getMarkerById,
  };

  // Показываем загрузку пока БД не инициализирована
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Загрузка базы данных...</Text>
      </View>
    );
  }

  return (
    <MarkerContext.Provider value={value}>{children}</MarkerContext.Provider>
  );
};
