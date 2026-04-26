import React, { useRef, useState, useEffect } from 'react';
import { Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const initialRegion = {
  latitude: 19.275,
  longitude: -101.9,
  latitudeDelta: 2.25,
  longitudeDelta: 3.67,
};

export default function Map({navigation}: any) {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
      }
    })();
  }, []);

  const locateUser = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Debes otorgar permisos de ubicación para usar esta función.');
        setLoadingLocation(false);
        return;
      }

      let userLoc = await Location.getCurrentPositionAsync({});
      setLocation(userLoc);

      mapRef.current?.animateToRegion({
        latitude: userLoc.coords.latitude,
        longitude: userLoc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual. Asegúrate de tener el GPS activado.');
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
        <MapView 
        ref={mapRef}
        style={styles.map} 
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        >
        <Marker
            draggable
            coordinate={{ 
            latitude: location ? location.coords.latitude : initialRegion.latitude, 
            longitude: location ? location.coords.longitude : initialRegion.longitude 
            }}
        />
        </MapView>

        {/* BOTÓN PARA UBICAR AL USUARIO */}
        <TouchableOpacity style={styles.locateButton} onPress={locateUser}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.locateText}>📍</Text>
          )}
        </TouchableOpacity>

        {/* BOTÓN ENCIMA DEL MAPA */}
        <TouchableOpacity style={styles.button}
        onPress={() => navigation.navigate("Home")}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Regresar</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locateButton: {
    position: "absolute",
    bottom: 110,
    right: 20,
    backgroundColor: "#1e3a8a", // Color azul oscuro para combinar con la app
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locateText: {
    fontSize: 22,
    color: "white",
  },
  button: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
});