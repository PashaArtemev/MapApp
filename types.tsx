import React from 'react';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  id: string;
  coordinate: Coordinate;
  title: string;
  description: string;
  images: string[];
  notificationEnabled?: boolean;
  notificationRadius?: number;
  created_at?: string;
}

export interface UserLocation {
  coords: Coordinate;
  timestamp: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}

export interface MarkerContextType {
  markers: MapMarker[];
  userLocation: UserLocation | null;
  isTrackingLocation: boolean;
  addMarker: (coordinate: any, title?: string, description?: string) => Promise<MapMarker>;
  updateMarker: (id: string, updates: Partial<MapMarker>) => Promise<MapMarker | null>;
  deleteMarker: (id: string) => Promise<boolean>;
  addImage: (markerId: string, imageUri: string) => Promise<boolean>;
  removeImage: (markerId: string, imageUri: string) => Promise<boolean>;
  getImages: (markerId: string) => string[];
  refreshMarkers: () => Promise<void>;
  getMarkerById: (id: string) => Promise<MapMarker | null>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  checkProximityToMarkers: (location: UserLocation) => Promise<void>;
}

export const MarkerContext = React.createContext<MarkerContextType | undefined>(undefined);

export const useMarkers = () => {
  const context = React.useContext(MarkerContext);
  if (context === undefined) {
    throw new Error('useMarkers must be used within a MarkerProvider');
  }
  return context;
};