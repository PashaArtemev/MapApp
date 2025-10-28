export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  images: string[]; 
}

// Хранилище маркеров
let markersStorage: MapMarker[] = [];

export const markerStore = {
  // Делаем копию массива, чтобы не удалить случайно из исходного
  getAll: (): MapMarker[] => {
    return [...markersStorage];
  },

  //Добавить новый маркер
  add: (coordinate: any, title?: string, description?: string): MapMarker => {
    const newMarker: MapMarker = {
      id: Date.now().toString(),
      coordinate,
      title: title || `Маркер ${markersStorage.length + 1}`,
      description: description || `Описание маркера ${markersStorage.length + 1}`,
      images: [],
    };

    markersStorage.push(newMarker);
    console.log("Маркер добавлен:", newMarker);
    return newMarker;
  },

  // Найти маркер по его ID
  findById: (id: string): MapMarker | undefined => {
    return markersStorage.find((marker) => marker.id === id);
  },

  // Удалить маркер по ID
  delete: (id: string): boolean => {
    const initialLength = markersStorage.length;
    markersStorage = markersStorage.filter((marker) => marker.id !== id);
    return markersStorage.length !== initialLength;
  },

  //Обновить существующий маркер
  update: (id: string, updates: Partial<MapMarker>): MapMarker | null => {
    const index = markersStorage.findIndex((marker) => marker.id === id);
    if (index !== -1) {
      markersStorage[index] = { ...markersStorage[index], ...updates };
      console.log("Маркер обновлен:", markersStorage[index]);
      return markersStorage[index];
    }
    return null;
  },


  // Добавить изображение к маркеру
  addImage: (markerId: string, imageUri: string): boolean => {
    const marker = markersStorage.find(m => m.id === markerId);
    if (marker) {
      // Убеждаемся что массив images существует
      if (!marker.images) {
        marker.images = [];
      }
      marker.images.push(imageUri);
      console.log("Изображение добавлено к маркеру:", markerId, imageUri);
      return true;
    }
    console.log("Маркер не найден для добавления изображения:", markerId);
    return false;
  },

  // Удалить изображение из маркера
  removeImage: (markerId: string, imageUri: string): boolean => {
    const marker = markersStorage.find(m => m.id === markerId);
    if (marker && marker.images) {
      const initialLength = marker.images.length;
      marker.images = marker.images.filter(img => img !== imageUri);
      const success = marker.images.length !== initialLength;
      if (success) {
        console.log("Изображение удалено из маркера:", markerId, imageUri);
      }
      return success;
    }
    return false;
  },

  // Получить все изображения маркера
  getImages: (markerId: string): string[] => {
    const marker = markersStorage.find(m => m.id === markerId);
    return marker?.images || []; // Возвращаем пустой массив если изображений нет
  },

  // Очистить все изображения маркера (опционально)
  clearImages: (markerId: string): boolean => {
    const marker = markersStorage.find(m => m.id === markerId);
    if (marker) {
      const hadImages = marker.images && marker.images.length > 0;
      marker.images = [];
      console.log("Все изображения удалены из маркера:", markerId);
      return hadImages;
    }
    return false;
  }
};