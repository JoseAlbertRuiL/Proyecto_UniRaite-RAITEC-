// src/components/LiveMapModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getSocket } from "../services/socket";

interface Props {
  visible:    boolean;
  onClose:    () => void;
  viajeId:    number;
  // Punto de recogida del pasajero
  puntoEncuentro?: { latitude: number; longitude: number } | null;
  // Origen y destino del viaje
  origen?:    { lat: number; lng: number };
  destino?:   { lat: number; lng: number };
}

const LiveMapModal: React.FC<Props> = ({
  visible, onClose, viajeId, puntoEncuentro, origen, destino,
}) => {
  const mapRef = useRef<MapView>(null);
  const [conductorPos, setConductorPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [ruta, setRuta] = useState<{ latitude: number; longitude: number }[]>([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_viaje', viajeId);
    setConectado(true);

    const onDriverLocation = (data: { lat: number; lng: number }) => {
      const coords = { latitude: data.lat, longitude: data.lng };
      setConductorPos(coords);
      setRuta((prev) => [...prev.slice(-50), coords]); // máximo 50 puntos

      // Centrar mapa en conductor
      mapRef.current?.animateToRegion({
        ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 500);
    };

    socket.on('driver_location_update', onDriverLocation);

    return () => {
      socket.off('driver_location_update', onDriverLocation);
      socket.emit('leave_viaje', viajeId);
      setConectado(false);
    };
  }, [visible, viajeId]);

  const regionInicial = conductorPos 
    ? { ...conductorPos, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : (origen
        ? { latitude: origen.lat, longitude: origen.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        : { latitude: 19.7069, longitude: -101.1945, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={regionInicial}>

          {/* Marcador del conductor */}
          {conductorPos && (
            <Marker coordinate={conductorPos} title="Conductor">
              <Text style={{ fontSize: 28 }}>🚗</Text>
            </Marker>
          )}

          {/* Marcador de recogida del pasajero */}
          {puntoEncuentro && (
            <Marker coordinate={puntoEncuentro} title="Tu punto de encuentro">
              <Text style={{ fontSize: 28 }}>📍</Text>
            </Marker>
          )}

          {/* Marcador destino */}
          {destino && (
            <Marker
              coordinate={{ latitude: destino.lat, longitude: destino.lng }}
              title="Destino"
            >
              <Text style={{ fontSize: 28 }}>🏁</Text>
            </Marker>
          )}

          {/* Ruta recorrida por el conductor */}
          {ruta.length > 1 && (
            <Polyline
              coordinates={ruta}
              strokeColor="#1e3a8a"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Barra superior */}
        <View style={{
          position: "absolute", top: 16, left: 16, right: 16,
          backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 12, padding: 12,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: conectado && conductorPos ? "#22c55e" : "#ef4444",
              marginRight: 8,
            }} />
            <Text style={{ color: "white", fontWeight: "600" }}>
              {conductorPos ? "Conductor en camino" : "Esperando ubicación del conductor..."}
            </Text>
          </View>
        </View>

        {/* Botón cerrar */}
        <View style={{ position: "absolute", bottom: 32, left: 16, right: 16 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: "#1e3a8a", borderRadius: 14, padding: 16, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              Cerrar mapa
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LiveMapModal;