import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useMarkers } from "../types";

export default function Map() {
  const { markers, addMarker, userLocation, startLocationTracking } = useMarkers();
  const router = useRouter();

  useEffect(() => {
    startLocationTracking();
  }, []);

  const handleLongPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    try {
      await addMarker(coordinate);
      console.log("Маркер добавлен");
    } catch (error) {
      console.error("Ошибка при добавлении маркера:", error);
    }
  };

  const handleMarkerPress = (marker: any) => {
    router.push(`/marker/${marker.id}` as any);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 57.999916828345825,
          longitude: 56.248418970371034,
          latitudeDelta: 0.01,
          longitudeDelta: 0.001,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onLongPress={handleLongPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            pinColor={marker.notificationEnabled ? "#FF3B30" : "#34C759"}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>
      
      {userLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Точность: {userLocation.accuracy ? `${Math.round(userLocation.accuracy)} м` : '---'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});