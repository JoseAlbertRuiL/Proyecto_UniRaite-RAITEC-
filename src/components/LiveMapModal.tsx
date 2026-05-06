// src/components/LiveMapModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal   } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { getSocket, getLastDriverPosition } from "../services/socket";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface PuntoRecogida {
  latitude: number;
  longitude: number;
  nombre?: string;
}

interface Props {
  visible:    boolean;
  onClose:    () => void;
  viajeId:    number;
  mode: "pasajero" | "conductor";
  puntoEncuentro?: PuntoRecogida | null;
  pasajerosCoordenadas?: PuntoRecogida[];
  origen?:    { lat: number; lng: number };
  destino?:   { lat: number; lng: number };
}

const LiveMapModal: React.FC<Props> = ({
  visible, onClose, viajeId, mode,
  puntoEncuentro, pasajerosCoordenadas = [],
  origen, destino,
}) => {
  const mapRef = useRef<MapView>(null);
  const [conductorPos, setConductorPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [miPos, setMiPos] = useState<{latitude: number; longitude: number} | null>(null);
  const [ruta, setRuta] = useState<{ latitude: number; longitude: number }[]>([]);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  // const [conectado, setConectado] = useState(false);

  // Pasajero
  useEffect(() => {
    if (!visible || mode !== "pasajero") return;

    const socket = getSocket();
    if (!socket) return;

    // socket.emit('join_viaje', viajeId);
    const cached = getLastDriverPosition(viajeId);
    if (cached) {
      const coords = { latitude: cached.lat, longitude: cached.lng };
      setConductorPos(coords);
      setRuta([coords]);
      console.log(`✅ Posición del conductor restaurada desde caché`);
    }

    const onDriverLocation = (data: { lat: number; lng: number }) => {
      const coords = { latitude: data.lat, longitude: data.lng };
      setConductorPos(coords);
      setRuta((prev) => [...prev.slice(-50), coords]);

      mapRef.current?.animateToRegion({
        ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 500);
    };

    socket.on('driver_location_update', onDriverLocation);

    return () => {
      socket.off('driver_location_update', onDriverLocation);
      // socket.emit('leave_viaje', viajeId);
    };
  }, [visible, viajeId, mode]);

  // Conductor
  useEffect(() => {
    if (!visible || mode !== "conductor") return;

    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !active) return;

      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (loc) => {
          if (!active) return;
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setMiPos(coords);
          setRuta((prev) => [...prev.slice(-50), coords]);
          mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500
          );
        }
      );
    })();

    return () => {
      active = false;
      locationSub.current?.remove();
      locationSub.current = null;
    };
  }, [visible, mode]);

  useEffect(() => {
    if (!visible) {
      setRuta([]);
      setConductorPos(null);
      setMiPos(null);
    }
  }, [visible]);

  const posicionActual = mode === "conductor" ? miPos : conductorPos;

  const regionInicial = posicionActual 
    ? { ...posicionActual, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : origen
    ? { latitude: origen.lat, longitude: origen.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 19.7069, longitude: -101.1945, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const waypointsConductor: { latitude: number; longitude: number }[] =
    mode === "conductor"
      ? pasajerosCoordenadas.filter((p) => p.latitude && p.longitude)
      : puntoEncuentro
      ? [{ latitude: puntoEncuentro.latitude, longitude: puntoEncuentro.longitude }]
      : [];

  const estadoLabel =
    mode === "conductor"
      ? miPos ? "📍 Tu ruta en vivo" : "Obteniendo tu ubicación..."
      : conductorPos ? "🚗 Conductor en camino" : "Esperando al conductor...";

  const estadoColor =
    (mode === "conductor" ? miPos : conductorPos) ? "#22c55e" : "#ef4444";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={regionInicial}>

          {/* Ruta planeada */}
          {origen && destino && (
            <MapViewDirections
              origin={{ latitude: origen.lat, longitude: origen.lng }}
              destination={{ latitude: destino.lat, longitude: destino.lng }}
              waypoints={waypointsConductor} 
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={4}
              strokeColor="#3b82f6"
              language="es"
              optimizeWaypoints={false}
              onReady={(result) => {
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: { right: 50, bottom: 120, left: 50, top: 80 },
                });
              }}
            />
          )}

          {/* Ruta recorrida en tiempo real */}
          {ruta.length > 1 && (
            <Polyline coordinates={ruta} strokeColor="#1e3a8a" strokeWidth={5} />
          )}

          {/* Marcador del conductor (modo pasajero: socket | modo conductor: GPS) */}
          {mode === "pasajero" && conductorPos && (
            <Marker coordinate={conductorPos} title="Conductor">
              <Text style={{ fontSize: 30 }}>🚗</Text>
            </Marker>
          )}
          {mode === "conductor" && miPos && (
            <Marker coordinate={miPos} title="Tú">
              <Text style={{ fontSize: 30 }}>🚗</Text>
            </Marker>
          )}

          {/* Punto de recogida del pasajero (modo pasajero) */}
          {mode === "pasajero" && puntoEncuentro && (
            <Marker
              coordinate={{ latitude: puntoEncuentro.latitude, longitude: puntoEncuentro.longitude }}
              title="Tu punto de encuentro"
            >
              <Text style={{ fontSize: 30 }}>📍</Text>
            </Marker>
          )}

          {/* Puntos de recogida de pasajeros (modo conductor) */}
          {mode === "conductor" && pasajerosCoordenadas.map((p, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={p.nombre || `Pasajero ${i + 1}`}
            >
              <Text style={{ fontSize: 26 }}>👤</Text>
            </Marker>
          ))}

          {/* Destino */}
          {destino && (
            <Marker
              coordinate={{ latitude: destino.lat, longitude: destino.lng }}
              title="Destino"
            >
              <Text style={{ fontSize: 30 }}>🏁</Text>
            </Marker>
          )}
        </MapView>

        {/* Barra superior */}
        <View style={{
          position: "absolute", top: 16, left: 16, right: 16,
          backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 14, padding: 14,
          flexDirection: "row", alignItems: "center",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: estadoColor, marginRight: 10,
            }} />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
              {estadoLabel}
            </Text>
          </View>
        </View>

        {/* Leyenda de marcadores */}
        <View style={{
          position: "absolute", top: 72, left: 16,
          backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 10, gap: 4,
        }}>
          {mode === "conductor" && pasajerosCoordenadas.length > 0 && (
            <Text style={{ color: "white", fontSize: 12 }}>👤 Punto de recogida</Text>
          )}
          {mode === "pasajero" && puntoEncuentro && (
            <Text style={{ color: "white", fontSize: 12 }}>📍 Tu punto de encuentro</Text>
          )}
          <Text style={{ color: "white", fontSize: 12 }}>🏁 Destino</Text>
          <Text style={{ color: "#3b82f6", fontSize: 12 }}>— Ruta planeada</Text>
          <Text style={{ color: "#1e3a8a", fontSize: 12 }}>— Ruta recorrida</Text>
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