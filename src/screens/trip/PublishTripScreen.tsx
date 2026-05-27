import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
} from "react-native-maps";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import Header from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { publicarViaje } from "../../services/trip/tripService";
import { useBackHandler } from "../../hooks/useBackHandler";
import { useVehiculo, useServerTime } from "../../hooks/queries/useViajes";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const REGION_MORELIA = {
  latitude: 19.7069,
  longitude: -101.1945,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

const ITM_COORDS = { latitude: 19.720909, longitude: -101.186786 };
const ITM_COORDS_ALT = { latitude: 19.723697, longitude: -101.184259 };
const ITM_TEXTO = "Avenida Tecnológico, 1500, Morelia";

interface Coordenada {
  latitude: number;
  longitude: number;
  texto: string;
}

interface TripForm {
  origen: Coordenada | null;
  destino: Coordenada | null;
  fecha: string;
  hora: string;
  asientos: number;
  precio: string;
  comentario: string;
}

const INITIAL_FORM: TripForm = {
  origen: null,
  destino: null,
  fecha: "",
  hora: "",
  asientos: 1,
  precio: "25",
  comentario: "",
};

const PublishTripScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "normal");
  const [form, setForm] = useState<TripForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTipo, setMapTipo] = useState<"origen" | "destino">("origen");
  const [markerTemp, setMarkerTemp] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [geocodingLoad, setGeocodingLoad] = useState(false);
  const mapRef = useRef<MapView>(null);
  const isPublishingRef = useRef(false);

  const { data: vehiculoData } = useVehiculo();
  const { data: serverTimeData } = useServerTime();

  const capacidadMaxima = vehiculoData?.vehiculo?.capacidad_pasajeros ?? 4;
  const serverTimeRef = useRef(new Date());
  const [serverTimeLoaded, setServerTimeLoaded] = useState(false);

  useEffect(() => {
    if (serverTimeData) {
      const serverDate = new Date(serverTimeData.serverTime);
      serverTimeRef.current = serverDate;
      setDate(serverDate);
      setForm((prev) => ({
        ...prev,
        fecha: formatFecha(serverDate),
        hora: formatHora(serverDate),
      }));
      setServerTimeLoaded(true);
    }
  }, [serverTimeData]);

  useEffect(() => {
    if (vehiculoData?.vehiculo?.capacidad_pasajeros) {
      const capacidad = vehiculoData.vehiculo.capacidad_pasajeros;
      setForm((prev) => ({
        ...prev,
        asientos: Math.min(prev.asientos, capacidad),
      }));
    }
  }, [vehiculoData]);

  const updateField = <K extends keyof TripForm>(
    field: K,
    value: TripForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const sanitizarPrecio = (text: string) => {
    let limpio = text.replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('');
    if (partes[1] && partes[1].length > 2) limpio = partes[0] + '.' + partes[1].slice(0, 2);

    setForm((p) => ({ ...p, precio: limpio }));

    const valor = parseFloat(limpio);
    if (limpio === '' || isNaN(valor)) {
      setPrecioError('Ingresa un precio válido.');
    } else if (valor < 1) {
      setPrecioError('El precio mínimo es $1 MXN.');
    } else if (valor > 70) {
      setPrecioError('El precio máximo es $70 MXN.');
    } else {
      setPrecioError(null);
    }
  };

  const formatFecha = (d: Date): string => {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    const meses = [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ];
    const dia = d.getDate();
    const mes = meses[d.getMonth()];
    if (d.toDateString() === hoy.toDateString()) return `Hoy, ${dia} ${mes}`;
    if (d.toDateString() === manana.toDateString())
      return `Mañana, ${dia} ${mes}`;
    return `${dia} ${mes}`;
  };

  const formatHora = (d: Date): string => {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const onChangeFecha = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const merged = new Date(date);
      merged.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setDate(merged);
      setForm((p) => ({ ...p, fecha: formatFecha(selectedDate) }));
    }
  };

  const onChangeHora = (_: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const merged = new Date(date);
      merged.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setDate(merged);
      setForm((p) => ({ ...p, hora: formatHora(selectedDate) }));
    }
  };

  const incrementarAsientos = () => {
    if (form.asientos < capacidadMaxima)
      setForm((p) => ({ ...p, asientos: p.asientos + 1 }));
  };
  const decrementarAsientos = () => {
    if (form.asientos > 1) setForm((p) => ({ ...p, asientos: p.asientos - 1 }));
  };

  const abrirMapa = (tipo: "origen" | "destino") => {
    setMapTipo(tipo);
    const puntoExistente = tipo === "origen" ? form.origen : form.destino;
    if (puntoExistente) {
      setMarkerTemp({
        latitude: puntoExistente.latitude,
        longitude: puntoExistente.longitude,
      });
    } else {
      setMarkerTemp(null);
    }
    setMapVisible(true);
  };

  const centrarEnUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMarkerTemp(coords);
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800,
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
    }
  };

  const onMapPress = (e: MapPressEvent) => {
    setMarkerTemp(e.nativeEvent.coordinate);
  };

  const confirmarPunto = async () => {
    if (!markerTemp) {
      Alert.alert(
        "Selecciona un punto",
        "Toca el mapa para elegir la ubicación.",
      );
      return;
    }
    setGeocodingLoad(true);
    try {
      const resultados = await Location.reverseGeocodeAsync(markerTemp);
      const r = resultados[0];
      const partes = [r?.street, r?.streetNumber, r?.district, r?.city].filter(
        Boolean,
      );
      const texto =
        partes.length > 0
          ? partes.join(", ")
          : `${markerTemp.latitude.toFixed(5)}, ${markerTemp.longitude.toFixed(5)}`;

      const coordenada: Coordenada = { ...markerTemp, texto };
      setForm((prev) => {
        const nuevo = { ...prev, [mapTipo]: coordenada };

        if (mapTipo === "origen" && texto !== ITM_TEXTO) {
          nuevo.destino = { ...ITM_COORDS, texto: ITM_TEXTO };
        }

        if (mapTipo === "origen" && texto === ITM_TEXTO) {
          nuevo.destino = null;
        }

        return nuevo;
      });
      setMapVisible(false);
    } catch (e) {
      const texto = `${markerTemp.latitude.toFixed(5)}, ${markerTemp.longitude.toFixed(5)}`;
      const coordenada: Coordenada = { ...markerTemp, texto };

      setForm((prev) => {
        const nuevo = { ...prev, [mapTipo]: coordenada };
        if (mapTipo === "origen") {
          nuevo.destino = { ...ITM_COORDS, texto: ITM_TEXTO };
        }
        return nuevo;
      });
      setMapVisible(false);
    } finally {
      setGeocodingLoad(false);
    }
  };

  const handlePublicar = async () => {
    if (isPublishingRef.current) {
      console.log("🔒 Publicación en curso, ignorando clic");
      return;
    }

    if (!form.origen) {
      Alert.alert("Faltan datos", "Por favor ingresa el origen del viaje.");
      return;
    }
    const precioVal = parseFloat(form.precio);
    if (!form.precio || isNaN(precioVal) || precioVal < 1 || precioVal > 70) {
      Alert.alert(
        "Precio inválido",
        "El precio por persona debe estar entre $1 y $70 MXN.",
      );
      return;
    }
    if (!form.destino) {
      Alert.alert("Faltan datos", "Por favor ingresa el destino del viaje.");
      return;
    }
    if (form.origen.texto === form.destino.texto) {
      Alert.alert(
        "Ruta inválida",
        "El origen y el destino no pueden ser el mismo punto.",
      );
      return;
    }
    const pasaPorITM =
      form.origen.texto === ITM_TEXTO || form.destino.texto === ITM_TEXTO;
    if (!pasaPorITM) {
      Alert.alert(
        "Ruta inválida",
        "Al menos el origen o el destino debe ser el Tecnológico de Morelia (Av. Tecnológico 1500).",
      );
      return;
    }
    if (!form.fecha) {
      Alert.alert("Faltan datos", "Por favor selecciona la fecha del viaje.");
      return;
    }
    if (!form.hora) {
      Alert.alert("Faltan datos", "Por favor selecciona la hora del viaje.");
      return;
    }

    const limiteFuturo = new Date(serverTimeRef.current.getTime() + 10 * 60 * 1000);
    if (date <= limiteFuturo) {
      Alert.alert(
        "Horario inválido",
        "El viaje debe programarse con al menos 10 minutos de anticipación.",
      );
      return;
    }

    isPublishingRef.current = true;
    setIsLoading(true);

    try {
      const data = await publicarViaje({
        origen_texto: form.origen!.texto,
        destino_texto: form.destino!.texto,
        latitud_origen: form.origen!.latitude,
        longitud_origen: form.origen!.longitude,
        latitud_destino: form.destino!.latitude,
        longitud_destino: form.destino!.longitude,
        fechaHoraISO: date.toISOString(),
        asientos: form.asientos,
        precio: parseFloat(form.precio),
      });

      if (data.success) {
        Alert.alert(
          "¡Viaje publicado!",
          "Tu viaje ya está disponible para pasajeros.",
        );
        navigation.goBack();
      } else {
        Alert.alert("Error", "No se pudo publicar el viaje.");
      }
    } catch (error: any) {
      console.log("Error al publicar viaje:", error);
      Alert.alert(
        "Error",
        error?.message || "Ocurrió un problema. Intenta de nuevo.",
      );
    } finally {
      setTimeout(() => {
        isPublishingRef.current = false;
      }, 1000);
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper hasFooter={false}>
      <Header navigation={navigation} title="Publica tu Viaje" />

      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={
              markerTemp
                ? { ...markerTemp, latitudeDelta: 0.001, longitudeDelta: 0.001 }
                : REGION_MORELIA
            }
            onPress={onMapPress}
          >
            {markerTemp && <Marker coordinate={markerTemp} />}
          </MapView>

          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text
              style={{ color: "white", textAlign: "center", fontWeight: "600" }}
            >
              {mapTipo === "origen"
                ? "📍 Toca para elegir el punto de origen"
                : "🏁 Toca para elegir el destino"}
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: 32,
              left: 16,
              right: 16,
              gap: 10,
            }}
          >
            {mapTipo === "origen" && (
              <TouchableOpacity
                onPress={centrarEnUbicacion}
                style={{
                  backgroundColor: "#1e3a8a",
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  📍 Usar mi ubicación actual
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setMapVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarPunto}
                disabled={geocodingLoad || !markerTemp}
                style={{
                  flex: 2,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                  backgroundColor: markerTemp ? "#2563eb" : "#93c5fd",
                }}
              >
                {geocodingLoad ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Confirmar punto
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-5 gap-5">
          <View className="bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-stretch gap-3">
              <View className="items-center mt-1">
                <View className="w-3 h-3 rounded-full bg-blue-600" />
                <View
                  className="w-0.5 flex-1 bg-gray-300 my-1"
                  style={{ minHeight: 36 }}
                />
                <View className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white" />
              </View>
              <View className="flex-1 gap-3">
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Origen
                  </Text>
                  <TouchableOpacity onPress={() => abrirMapa("origen")}>
                    <Text
                      className={`text-base font-semibold pb-2 border-b border-gray-200 ${form.origen ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {form.origen
                        ? form.origen.texto
                        : "Toca para seleccionar en el mapa"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Destino
                  </Text>
                  <TouchableOpacity onPress={() => abrirMapa("destino")}>
                    <Text
                      className={`text-base ${form.destino ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {form.destino
                        ? form.destino.texto
                        : "Toca para seleccionar en el mapa"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Fecha y Hora
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-xs text-gray-400 mb-0.5">Fecha</Text>
                <Text
                  className={`text-sm font-medium ${form.fecha ? "text-gray-900" : "text-gray-400"}`}
                >
                  {form.fecha || "Seleccionar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => setShowTimePicker(true)}
              >
                <Text className="text-xs text-gray-400 mb-0.5">Hora</Text>
                <Text
                  className={`text-sm font-medium ${form.hora ? "text-gray-900" : "text-gray-400"}`}
                >
                  {form.hora || "Seleccionar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={serverTimeLoaded ? serverTimeRef.current : new Date()}
              onChange={onChangeFecha}
              locale="es-MX"
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              is24Hour={false}
              onChange={onChangeHora}
            />
          )}

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Lugares disponibles
            </Text>
            <View className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
              <Text className="text-sm text-gray-700">
                Asientos Disponibles
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={decrementarAsientos}
                  className="w-8 h-8 rounded-full border border-blue-600 items-center justify-center"
                >
                  <Text className="text-blue-600 text-lg font-medium leading-none">
                    −
                  </Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 w-5 text-center">
                  {form.asientos}
                </Text>
                <TouchableOpacity
                  onPress={incrementarAsientos}
                  className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
                >
                  <Text className="text-white text-lg font-medium leading-none">
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row gap-2 mt-2">
              {Array.from({ length: capacidadMaxima }, (_, i) => i + 1).map(
                (i) => (
                  <View
                    key={i}
                    className={`w-8 h-8 rounded-full border items-center justify-center ${i <= form.asientos ? "bg-blue-50 border-blue-600" : "bg-white border-gray-200"}`}
                  >
                    <Text
                      className={`text-xs ${i <= form.asientos ? "text-blue-600" : "text-gray-300"}`}
                    >
                      👤
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Precio por persona
            </Text>
            <View
              className={`flex-row items-center gap-3 border rounded-xl px-4 py-3 ${
                precioError ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <View className="bg-blue-50 rounded-lg px-2 py-1">
                <Text className="text-blue-600 font-bold text-base">$</Text>
              </View>
              <TextInput
                value={form.precio}
                onChangeText={sanitizarPrecio}
                keyboardType="numeric"
                className="flex-1 text-2xl font-bold text-gray-900"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                maxLength={6}
              />
              <Text className="text-xs text-gray-400">MXN / persona</Text>
            </View>
            {precioError ? (
              <Text className="text-red-500 text-xs mt-1 ml-1">{precioError}</Text>
            ) : (
              <Text className="text-gray-400 text-xs mt-1 ml-1">Entre $1 y $70 MXN</Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Comentario adicional
            </Text>
            <TextInput
              value={form.comentario}
              onChangeText={(text) => updateField("comentario", text)}
              multiline
              numberOfLines={3}
              placeholder="Saldré de casa a las 5:45 para evitar tráfico"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700"
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />
          </View>

          <TouchableOpacity
            onPress={handlePublicar}
            disabled={isLoading}
            className={`rounded-2xl py-4 items-center mb-6 ${isLoading || isPublishingRef.current ? "bg-blue-300" : "bg-blue-600"}`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold">
                {isPublishingRef.current ? "Publicando..." : "Publicar viaje"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
};

export default PublishTripScreen;
