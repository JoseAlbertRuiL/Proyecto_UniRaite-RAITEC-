import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

const initialRegion = {
  latitude: 19.275,
  longitude: -101.9,
  latitudeDelta: 2.25,
  longitudeDelta: 3.67,
};

export default function Map({navigation}: any) {
  return (
    <View style={styles.container}>
        <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        >
        <Marker
            draggable
            coordinate={{ 
            latitude: initialRegion.latitude, 
            longitude: initialRegion.longitude 
            }}
        >
        </Marker>
        </MapView>

        {/* BOTÓN ENCIMA DEL MAPA */}
    <TouchableOpacity style={styles.button}
    onPress={() => navigation.navigate("Home")}>
      <Text style={{ color: "white" }}>Regresar</Text>
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
  button: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
  },
});