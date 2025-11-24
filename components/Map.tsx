import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useMarkers } from "../types";

export default function Map() {
  const { markers, addMarker } = useMarkers();
  const router = useRouter();

  const handleLongPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    try {
      await addMarker(coordinate);
      console.log("Маркер успешно добавлен");
    } catch (error) {
      console.error("Ошибка при добавлении маркера:", error);
    }
  };

  const handleMarkerPress = (marker: any) => {
    console.log("Переход к маркеру:", marker.id);
    router.push(`/marker/${marker.id}` as any);
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 57.999916828345825,
        longitude: 56.248418970371034,
        latitudeDelta: 0.01,
        longitudeDelta: 0.001,
      }}
      onLongPress={handleLongPress}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          onPress={() => handleMarkerPress(marker)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});