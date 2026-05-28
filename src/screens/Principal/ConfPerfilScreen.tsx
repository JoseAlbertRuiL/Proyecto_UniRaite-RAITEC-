import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderBack from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { getVehiculo } from "../../services/trip/tripService";
import { getPerfil, logout } from "../../services/auth/authService";
import { orpc, BASE_URL } from "../../services/api/apiClient";
import { disconnectSocket } from "../../services/socket";
import { useConductorMode } from "../../context/ConductorModeContext";
import { useBackHandler } from "../../hooks/useBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ConfigPerfilScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [viajesComoConductor, setViajesComoConductor] = useState(0);
  const [viajesComoPasajero, setViajesComoPasajero] = useState(0);
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const { esConductorActivo, activarModoConductor, desactivarModoConductor } = useConductorMode();
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [modalVisibleVehiculo, setModalVisibleVehiculo] = useState(false);
  const insets = useSafeAreaInsets();

  // Modales para configuraciones
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [modalCarreraVisible, setModalCarreraVisible] = useState(false);
  const [modalContactoVisible, setModalContactoVisible] = useState(false);

  // Estados para cambiar nombre
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");

  // Estados para cambiar contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // Estados para cambiar contacto de emergencia
  const [contactoEmergencia, setContactoEmergencia] = useState("");

  // Estado para cambiar carrera
  const [carrera, setCarrera] = useState("");

  // Estado para foto de perfil
  const [uploadingFoto, setUploadingFoto] = useState(false);
 
  // Estados para la credencial
  const [nuevaFotoCredencial, setNuevaFotoCredencial] = useState<string | null>(null);
  const [uploadingCredencial, setUploadingCredencial] = useState(false);
  
  // NUEVO ESTADO: Controla el modal de opciones de foto
  const [modalOpcionesCredencialVisible, setModalOpcionesCredencialVisible] = useState(false);

  // Lista de carreras
  const carreras = [
    "Bioquímica",
    "Biomédica",
    "Eléctrica",
    "Electrónica",
    "Industrial",
    "Mecánica",
    "Mecatrónica",
    "Materiales",
    "Gestión Empresarial",
    "Sistemas Computacionales",
    "Tecnologías de la Información y Comunicaciones",
    "Informática",
  ];

  useBackHandler(navigation, "normal");

  useEffect(() => {
    obtenerPerfil();
    obtenerEstadisticas();
  }, []);

  useEffect(() => {
    if (esConductorActivo && !vehiculo) {
      obtenerVehiculo();
    }
  }, [esConductorActivo]);

  const obtenerPerfil = async () => {
    try {
      const data = await getPerfil();
      setUser(data.user);
      setNombre(data.user?.nombre || "");
      setApellidoPaterno(data.user?.apellido_paterno || "");
      setApellidoMaterno(data.user?.apellido_materno || "");
      setCarrera(data.user?.carrera || "");
      setContactoEmergencia(data.user?.contacto_emergencia || "");
    } catch (error) {
      console.log("ERROR al obtener perfil:", error);
      navigation.navigate("Login");
    }
  };

  const obtenerEstadisticas = async () => {
    try {
      const historialConductor = await orpc.viajes.historialConductor();
      if (historialConductor.success) {
        setViajesComoConductor(historialConductor.viajes?.length || 0);
      }

      const solicitudes = await orpc.solicitudes.misSolicitudes?.();
      if (solicitudes?.success) {
        const aceptadas =
          solicitudes.solicitudes?.filter(
            (s: any) => s.estado_solicitud === "aceptada",
          ).length || 0;
        setViajesComoPasajero(aceptadas);
      }
    } catch (error) {
      console.log("Error al obtener estadísticas:", error);
    }
  };

  const obtenerVehiculo = async () => {
    try {
      const data = await getVehiculo();
      if (data.success) setVehiculo(data.vehiculo);
    } catch (error) {
      console.log("Error al obtener vehículo:", error);
    }
  };

  const handleModoConductor = async (value: boolean) => {
    if (value) {
      if (user?.es_conductor) {
        await activarModoConductor();
      } else {
        navigation.navigate("Licencia");
      }
    } else {
      await desactivarModoConductor();
    }
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Quedarme", style: "cancel" },
      {
        text: "Cerrar sesión",
        onPress: async () => {
          await logout();
          await disconnectSocket();

          await AsyncStorage.multiRemove([
            "punto_encuentro",
            "modo_conductor_activo",
            "user",
            "token",
          ]);

          navigation.navigate("Login");
        },
        style: "destructive",
      },
    ]);
  };

  const tomarFotoCredencial = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: false,
    });

    if (!result.canceled && result.assets[0].uri) {
      setNuevaFotoCredencial(result.assets[0].uri);
    }
    setModalOpcionesCredencialVisible(false); // Cerramos el menú
  };

  const elegirDeGaleriaCredencial = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setNuevaFotoCredencial(result.assets[0].uri);
    }
    setModalOpcionesCredencialVisible(false); // Cerramos el menú
  };

  const subirCredencialAlServidor = async (uri: string) => {
    const formData = new FormData();
    const fileExtension = uri.split(".").pop() || "jpg";
    const fileName = `credencial_${Date.now()}.${fileExtension}`;
    const mimeType = fileExtension === "jpg" ? "image/jpeg" : `image/${fileExtension}`;

    formData.append("foto_credencial", {
      uri: uri,
      type: mimeType,
      name: fileName,
    } as any);

    const token = await AsyncStorage.getItem("token");
    // NOTA: Asegúrate de que el endpoint corresponda a tu API express donde guardas temporalmente
    const response = await fetch(`${BASE_URL}/upload/credentials`, { 
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error al subir credencial temporal");
    
    // Suponemos que el endpoint Express devuelve { foto_credencial: 'nombre_del_archivo.jpg' }
    return data.foto_credencial; 
  };

  const cambiarNombre = async () => {
    if (!nombre || !apellidoPaterno) {
      Alert.alert("Error", "Nombre y apellido paterno son obligatorios");
      return;
    }

    if (!nuevaFotoCredencial) {
      Alert.alert("Error", "Debes subir una foto actualizada de tu credencial escolar para validar el cambio.");
      return;
    }

    try {
      setUploadingCredencial(true);
      // Subir la imagen temporalmente mediante Express
      const filenameCredencial = await subirCredencialAlServidor(nuevaFotoCredencial);

      const result = await orpc.usuarios.actualizarPerfil({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        foto_credencial: filenameCredencial
      });

      if (result.success) {
        Alert.alert("Éxito", "Datos actualizados correctamente");
        setModalNombreVisible(false);
        setNuevaFotoCredencial(null);
        obtenerPerfil();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar o validar tu identidad");
    } finally {
      setUploadingCredencial(false);
    }
  };

  const cambiarPassword = async () => {
    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    if (nuevaPassword.length < 6) {
      Alert.alert(
        "Error",
        "La nueva contraseña debe tener al menos 6 caracteres",
      );
      return;
    }

    try {
      const result = await orpc.usuarios.cambiarPassword({
        passwordActual,
        nuevaPassword,
      });
      if (result.success) {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
        setModalPasswordVisible(false);
        setPasswordActual("");
        setNuevaPassword("");
        setConfirmarPassword("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cambiar la contraseña");
    }
  };

  const cambiarCarrera = async () => {
    if (!carrera) {
      Alert.alert("Error", "Debes seleccionar una carrera");
      return;
    }

    try {
      const result = await orpc.usuarios.actualizarCarrera({ carrera });
      if (result.success) {
        Alert.alert("Éxito", "Carrera actualizada correctamente");
        setModalCarreraVisible(false);
        obtenerPerfil();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar la carrera");
    }
  };

  const cambiarContactoEmergencia = async () => {
    if (!contactoEmergencia) {
      Alert.alert("Error", "Debes ingresar un número");
      return;
    }

    try {
      const result = await orpc.usuarios.actualizarContactoEmergencia({
        contacto_emergencia: contactoEmergencia,
      });

      if (result.success) {
        Alert.alert("Éxito", "Contacto actualizado correctamente");
        setModalContactoVisible(false);
        obtenerPerfil();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar");
    }
  };

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0].uri) {
      await subirFoto(result.assets[0].uri);
    }
    setModalFotoVisible(false);
  };

  const elegirDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0].uri) {
      await subirFoto(result.assets[0].uri);
    }
    setModalFotoVisible(false);
  };

  const subirFoto = async (uri: string) => {
    if (uploadingFoto) {
      return;
    }

    setUploadingFoto(true);

    try {
      console.log("📸 Iniciando subida de foto...");
      console.log("📸 URI:", uri);

      const formData = new FormData();

      const fileExtension = uri.split(".").pop() || "jpg";
      const fileName = `perfil_${Date.now()}.${fileExtension}`;
      const mimeType =
        fileExtension === "jpg" ? "image/jpeg" : `image/${fileExtension}`;

      formData.append("foto_perfil", {
        uri: uri,
        type: mimeType,
        name: fileName,
      } as any);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        setUploadingFoto(false);
        return;
      }

      console.log("🔑 Token disponible, enviando petición...");

      const response = await fetch(`${BASE_URL}/upload/perfil`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log("📥 Status code:", response.status);

      const data = await response.json();
      console.log("📥 Respuesta del servidor:", data);

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      if (data.foto_perfil) {
        const result = await orpc.usuarios.actualizarFotoPerfil({
          foto_perfil: data.foto_perfil,
        });

        if (result.success) {
          await obtenerPerfil();
          Alert.alert("Éxito", "Foto de perfil actualizada");
        } else {
          throw new Error("No se pudo actualizar la foto en el perfil");
        }
      } else {
        throw new Error("No se recibió la URL de la foto");
      }
    } catch (error: any) {
      console.error("❌ Error al subir foto:", error);
      Alert.alert("Error", error.message || "No se pudo actualizar la foto");
    } finally {
      setUploadingFoto(false);
    }
  };

  const fotoUrl = user?.foto_perfil ? user.foto_perfil : null;

  return (
    <ScreenWrapper hasFooter={false}>
      <HeaderBack navigation={navigation} title="Mi Perfil" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Foto de perfil y nombre */}
        <View className="items-center mt-6 mb-4">
          <TouchableOpacity
            onPress={() => setModalFotoVisible(true)}
            activeOpacity={0.8}
            disabled={uploadingFoto}
          >
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-28 h-28 rounded-full border-2 border-blue-900"
              />
            ) : (
              <View className="w-28 h-28 bg-gray-300 rounded-full items-center justify-center">
                <Text className="text-5xl">👤</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center">
              {uploadingFoto ? (
                <Text className="text-white text-xs">⏳</Text>
              ) : (
                <Text className="text-white text-xs">✎</Text>
              )}
            </View>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900 mt-3">
            {user?.nombre} {user?.apellido_paterno?.charAt(0)}.
          </Text>

          <Text className="text-gray-500 text-sm mt-1">
            {user?.carrera || "Carrera no especificada"}
          </Text>

          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500 text-lg mr-1">★</Text>
            <Text className="text-gray-700 font-semibold">
              {user?.reputacion_promedio?.toFixed(1) || "Nuevo"}
            </Text>
            <Text className="text-gray-400 ml-1">/ 5.0</Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View className="px-6 mt-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Estadísticas
          </Text>

          <View className="flex-row justify-between bg-gray-50 rounded-2xl p-4">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-900">
                {viajesComoConductor}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Viajes como conductor
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-900">
                {viajesComoPasajero}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Viajes como pasajero
              </Text>
            </View>
          </View>
        </View>

        {/* Configuración */}
        <View className="px-6 mt-6 mb-10">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Configuración
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => setModalNombreVisible(true)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">✏️</Text>
              <Text className="text-base text-gray-700">Cambiar nombre</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => setModalPasswordVisible(true)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔒</Text>
              <Text className="text-base text-gray-700">
                Cambiar contraseña
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => setModalCarreraVisible(true)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">📚</Text>
              <Text className="text-base text-gray-700">Cambiar carrera</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => navigation.navigate("Notificaciones")}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔔</Text>
              <Text className="text-base text-gray-700">Notificaciones</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔑</Text>
              <Text className="text-base text-gray-700">Modo conductor</Text>
            </View>
            <Switch
              value={esConductorActivo}
              onValueChange={handleModoConductor}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
              thumbColor={"#ffffff"}
            />
          </View>

          {esConductorActivo && (
            <TouchableOpacity
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
              onPress={() => setModalVisibleVehiculo(true)}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🚗</Text>
                <Text className="text-base text-gray-700">
                  Datos del vehículo
                </Text>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => setModalContactoVisible(true)}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🆘</Text>
              <Text className="text-base text-gray-700">
                Contacto de emergencia
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 mt-4"
            onPress={cerrarSesion}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3"></Text>
              <Text className="text-base text-red-600 font-semibold">
                Cerrar sesión
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal cambiar nombre */}
      <Modal visible={modalNombreVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-center bg-black/50 px-6">
            <View className="bg-white p-5 rounded-2xl">
              <Text className="text-lg font-semibold mb-4 text-center">
                Cambiar nombre
              </Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre"
                className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              />
              <TextInput
                value={apellidoPaterno}
                onChangeText={setApellidoPaterno}
                placeholder="Apellido paterno"
                className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              />
              <TextInput
                value={apellidoMaterno}
                onChangeText={setApellidoMaterno}
                placeholder="Apellido materno (opcional)"
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
              />

              {/* Botón para la credencial */}
              <TouchableOpacity 
                onPress={() => setModalOpcionesCredencialVisible(true)} 
                className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 mb-4 items-center"
              >
                {nuevaFotoCredencial ? (
                  <Text className="text-green-600 font-semibold">✓ Credencial lista</Text>
                ) : (
                  <Text className="text-gray-600">📷 Subir nueva credencial escolar *</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setModalNombreVisible(false)}
                  className="flex-1 bg-gray-400 py-3 rounded-xl mr-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cambiarNombre}
                  className="flex-1 bg-blue-900 py-3 rounded-xl ml-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal visible={modalPasswordVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-center bg-black/50 px-6">
            <View className="bg-white p-5 rounded-2xl">
              <Text className="text-lg font-semibold mb-4 text-center">
                Cambiar contraseña
              </Text>
              <TextInput
                value={passwordActual}
                onChangeText={setPasswordActual}
                placeholder="Contraseña actual"
                secureTextEntry
                className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              />
              <TextInput
                value={nuevaPassword}
                onChangeText={setNuevaPassword}
                placeholder="Nueva contraseña"
                secureTextEntry
                className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
              />
              <TextInput
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                placeholder="Confirmar nueva contraseña"
                secureTextEntry
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
              />
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => {
                    setModalPasswordVisible(false);
                    setPasswordActual("");
                    setNuevaPassword("");
                    setConfirmarPassword("");
                  }}
                  className="flex-1 bg-gray-400 py-3 rounded-xl mr-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cambiarPassword}
                  className="flex-1 bg-blue-900 py-3 rounded-xl ml-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal cambiar carrera con Picker */}
      <Modal visible={modalCarreraVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-4 text-center">
              Cambiar carrera
            </Text>
            <View className="border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
              <Picker
                selectedValue={carrera}
                onValueChange={(itemValue) => setCarrera(itemValue)}
              >
                <Picker.Item label="Selecciona tu carrera" value="" />
                {carreras.map((carr) => (
                  <Picker.Item key={carr} label={carr} value={carr} />
                ))}
              </Picker>
            </View>
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={() => setModalCarreraVisible(false)}
                className="flex-1 bg-gray-400 py-3 rounded-xl mr-2"
              >
                <Text className="text-white font-semibold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cambiarCarrera}
                className="flex-1 bg-blue-900 py-3 rounded-xl ml-2"
              >
                <Text className="text-white font-semibold text-center">
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal opciones foto de credencial */}
      <Modal
        visible={modalOpcionesCredencialVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpcionesCredencialVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setModalOpcionesCredencialVisible(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-center mb-4">
              Foto de credencial
            </Text>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={tomarFotoCredencial}
            >
              <Text className="text-2xl mr-3">📷</Text>
              <Text className="text-base text-gray-700">Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={elegirDeGaleriaCredencial}
            >
              <Text className="text-2xl mr-3">🖼️</Text>
              <Text className="text-base text-gray-700">Elegir de galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 mt-2"
              onPress={() => setModalOpcionesCredencialVisible(false)}
            >
              <Text className="text-2xl mr-3"></Text>
              <Text className="text-base text-red-500">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal foto perfil */}
      <Modal
        visible={modalFotoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFotoVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setModalFotoVisible(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-center mb-4">
              Foto de perfil
            </Text>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={tomarFoto}
              disabled={uploadingFoto}
            >
              <Text className="text-2xl mr-3">📷</Text>
              <Text className="text-base text-gray-700">Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={elegirDeGaleria}
              disabled={uploadingFoto}
            >
              <Text className="text-2xl mr-3">🖼️</Text>
              <Text className="text-base text-gray-700">Elegir de galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 mt-2"
              onPress={() => setModalFotoVisible(false)}
            >
              <Text className="text-2xl mr-3"></Text>
              <Text className="text-base text-red-500">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal datos del vehículo */}
      <Modal visible={modalVisibleVehiculo} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-4">
              Datos del Vehículo
            </Text>
            {vehiculo ? (
              <View>
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Modelo</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {vehiculo.modelo}
                  </Text>
                </View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Placas</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {vehiculo.placas}
                  </Text>
                </View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Color</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {vehiculo.color}
                  </Text>
                </View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-4">
                  <Text className="text-xs text-gray-500 mb-1">
                    Capacidad de pasajeros
                  </Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {vehiculo.capacidad_pasajeros} pasajeros
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="text-gray-500 text-center mb-4">
                Cargando datos...
              </Text>
            )}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => {
                  setModalVisibleVehiculo(false);
                  navigation.navigate("Circulacion", { modoEdicion: true });
                }}
                className="flex-1 bg-gray-200 py-3 rounded-xl items-center mr-2"
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Editar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisibleVehiculo(false)}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center ml-2"
              >
                <Text className="text-white font-semibold text-base">
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal contacto de emergencia */}
      <Modal visible={modalContactoVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-center bg-black/50 px-6">
            <View className="bg-white p-5 rounded-2xl">
              <Text className="text-lg font-semibold mb-4 text-center">
                Contacto de emergencia
              </Text>

              <TextInput
                value={contactoEmergencia}
                onChangeText={setContactoEmergencia}
                placeholder="Número de contacto"
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
              />

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setModalContactoVisible(false)}
                  className="flex-1 bg-gray-400 py-3 rounded-xl mr-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cambiarContactoEmergencia}
                  className="flex-1 bg-blue-900 py-3 rounded-xl ml-2"
                >
                  <Text className="text-white font-semibold text-center">
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

export default ConfigPerfilScreen;
