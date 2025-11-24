import React from 'react';

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  images: string[];
  created_at?: string;
}

export interface MarkerContextType {
  markers: MapMarker[];
  addMarker: (coordinate: any, title?: string, description?: string) => Promise<MapMarker>;
  updateMarker: (id: string, updates: Partial<MapMarker>) => Promise<MapMarker | null>;
  deleteMarker: (id: string) => Promise<boolean>;
  addImage: (markerId: string, imageUri: string) => Promise<boolean>;
  removeImage: (markerId: string, imageUri: string) => Promise<boolean>;
  getImages: (markerId: string) => string[];
  refreshMarkers: () => Promise<void>;
  getMarkerById: (id: string) => Promise<MapMarker | null>;
}

export const MarkerContext = React.createContext<MarkerContextType | undefined>(undefined);

// Экспортируем хук useMarkers
export const useMarkers = () => {
  const context = React.useContext(MarkerContext);
  if (context === undefined) {
    throw new Error('useMarkers must be used within a MarkerProvider');
  }
  return context;
};