import { MapMarker } from "./types";


export type RootStackParamList = {
  Map: undefined;
  MarkerDetails: { 
    marker: MapMarker; 
    id: string;       
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}