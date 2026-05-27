import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { register, verificarCorreo } from "../../services/auth/authService";
import { useBackHandler } from "../../hooks/useBackHandler";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const RegisterScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "login");

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [numControl, setNumControl] = useState("");
  const [carrera, setCarrera] = useState("");
  const [fotoCredencial, setFotoCredencial] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState(1);

  const carreras = [
    { label: "Ing. Biomédica", value: "Ingeniería Biomédica" },
    { label: "Ing. Bioquímica", value: "Ingeniería Bioquímica" },
    { label: "Ing. Ciberseguridad", value: "Ingeniería en Ciberseguridad" },
    { label: "Ing. Eléctrica", value: "Ingeniería Eléctrica" },
    { label: "Ing. Electrónica", value: "Ingeniería Electrónica" },
    { label: "Ing. Gestión Empresarial", value: "Ingeniería en Gestión Empresarial" },
    { label: "Ing. Industrial", value: "Ingeniería Industrial" },
    { label: "Ing. Materiales", value: "Ingeniería en Materiales" },
    { label: "Ing. Mecánica", value: "Ingeniería Mecánica" },
    { label: "Ing. Mecatrónica", value: "Ingeniería Mecatrónica" },
    { label: "Ing. Semiconductores", value: "Ingeniería en Semiconductores" },
    { label: "Ing. Sistemas Computacionales", value: "Ingeniería en Sistemas Computacionales" },
    { label: "Ing. Tecnologías de la Inf. y Com.", value: "Ingeniería en Tecnologías de la Información y Comunicaciones" },
    { label: "Administración", value: "Licenciatura en Administración" },
    { label: "Contador Público", value: "Contador Público" },
    { label: "Mtría. Ciencias: Eléctrica", value: "Maestría en Ciencias en Ingeniería Eléctrica" },
    { label: "Mtría. Ciencias: Electrónica", value: "Maestría en Ciencias en Ingeniería Electrónica" },
    { label: "Mtría. Ciencias: Metalurgia", value: "Maestría en Ciencias en Metalurgia" },
    { label: "Mtría. Economía Social", value: "Maestría en Economía Social y Solidaria" },
    { label: "Mtría. Ingeniería Administrativa", value: "Maestría en Ingeniería Administrativa" },
    { label: "Mtría. Sistemas Computacionales", value: "Maestría en Sistemas Computacionales" },
    { label: "Doc. Ciencias de la Ingeniería", value: "Doctorado en Ciencias de la Ingeniería" },
    { label: "Doc. Ciencias: Eléctrica", value: "Doctorado en Ciencias en Ingeniería Eléctrica" }
  ];

  const validarCorreo = (correo: string) => {
    const regex = /^l[2][0-9]{7}@morelia\.tecnm\.mx$/;
    return regex.test(correo);
  };

  const tomarFoto = async (tipo: "credencial" | "perfil") => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso", "Necesitamos acceso a la cámara");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (tipo === "credencial") setFotoCredencial(uri);
        else setFotoPerfil(uri);
      }
    } catch (error) {
      console.error("Error al tomar foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const elegirDeGaleria = async (tipo: "credencial" | "perfil") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso", "Necesitamos acceso a la galería");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (tipo === "credencial") setFotoCredencial(uri);
        else setFotoPerfil(uri);
      }
    } catch (error) {
      console.error("Error al elegir de galería:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const seleccionarFoto = (tipo: "credencial" | "perfil") => {
    Alert.alert("Seleccionar foto", "¿Cómo quieres subir la imagen?", [
      { text: "Cancelar", style: "cancel" },
      { text: "📷 Tomar foto", onPress: () => tomarFoto(tipo) },
      { text: "🖼️ Elegir de galería", onPress: () => elegirDeGaleria(tipo) },
    ]);
  };

  const siguiente = async () => {
    Keyboard.dismiss();

    if (paso === 1) {
      if (nombre && apellidoPaterno) {
        setPaso(2);
      } else {
        Alert.alert("Error", "Faltan nombres");
      }
    } else if (paso === 2) {
      if (email && password) {
        let correoFinal = email.trim().toLowerCase();
        if (!correoFinal.includes('@')) {
          correoFinal += '@morelia.tecnm.mx';
          setEmail(correoFinal);
        }

        if (!validarCorreo(correoFinal)) {
          Alert.alert("Error", "El correo debe tener formato: lXXXXXXXX@morelia.tecnm.mx");
          return;
        }
        if (password.length < 6) {
          Alert.alert("Error", "La contraseña debe tener mínimo 6 caracteres");
          return;
        }

        try {
          const data = await verificarCorreo(correoFinal);
          if (data.existe) {
            Alert.alert("Error", "Este correo ya está registrado");
            return;
          }
        } catch (error) {
          console.log("Error:", error);
          Alert.alert("Error", "No se pudo verificar el correo");
          return;
        }

        const numeros = correoFinal.match(/\d+/);
        if (numeros) setNumControl(numeros[0]);
        setPaso(3);
      } else {
        Alert.alert("Error", "Faltan campos");
      }
    } else if (paso === 3) {
      if (numControl && fotoCredencial && carrera) {
        setPaso(4);
      } else {
        Alert.alert("Error", "Falta número de control, carrera o foto de credencial");
      }
    } else if (paso === 4) {
      if (fotoPerfil) {
        enviarRegistro();
      } else {
        Alert.alert("Error", "Sube una foto de perfil");
      }
    }
  };

  const enviarRegistro = async () => {
    if (cargando) return;
    setCargando(true);

    try {
      await register({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        correo_inst: email,
        password,
        num_control: numControl,
        carrera,
        foto_credencial_uri: fotoCredencial ?? undefined,
        foto_perfil_uri: fotoPerfil ?? undefined,
      });

      Alert.alert("Listo!", "Te registraste correctamente", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error?.message || "No se pudo conectar al servidor");
    }
  };

  const volver = () => {
    if (paso > 1) setPaso(paso - 1);
    setCargando(false);
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white px-6 pt-12"
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-4">
        {fotoPerfil ? (
          <Image source={{ uri: fotoPerfil }} className="w-24 h-24 rounded-full border-2 border-blue-900" />
        ) : (
          <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center border-2 border-blue-900">
            <Text className="text-4xl">👤</Text>
          </View>
        )}
      </View>

      <Text className="text-4xl font-bold text-blue-900 text-center">UNIRAITE</Text>
      <Text className="text-center text-gray-500 mt-1">Paso {paso} de 4</Text>

      {paso === 1 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Nombre *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-4" placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
          <Text className="mb-1 mt-4 text-gray-700">Apellido Paterno *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-4" placeholder="Apellido paterno" value={apellidoPaterno} onChangeText={setApellidoPaterno} />
          <Text className="mb-1 mt-4 text-gray-700">Apellido Materno</Text>
          <TextInput className="border border-gray-300 rounded-xl p-4" placeholder="Apellido materno (opcional)" value={apellidoMaterno} onChangeText={setApellidoMaterno} />
          <TouchableOpacity className="mt-6 p-4 bg-gray-200 rounded-xl" onPress={() => navigation.navigate("Login")}>
            <Text className="text-blue-900 text-center font-semibold">¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {paso === 2 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Correo institucional *</Text>

          <View className="flex-row items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
            <TextInput
              className="flex-1 p-4 text-gray-900"
              placeholder="l2XXXXXXXX"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!email.includes('@') && (
              <Text className="pr-4 text-gray-400 font-medium" pointerEvents="none">
                @morelia.tecnm.mx
              </Text>
            )}
          </View>

          <Text className="text-xs text-gray-500 mt-1">Formato: l + 8 números (empieza con 2)</Text>

          <Text className="mb-1 mt-4 text-gray-700">Contraseña *</Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50">
            <TextInput className="flex-1 p-4" placeholder="Contraseña" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity className="px-4" onPress={() => setShowPassword(!showPassword)}>
              <Text className="text-blue-900 font-semibold">{showPassword ? "Ocultar" : "Mostrar"}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-2">
            <Text className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-red-600'}`}>
              {password.length >= 6 ? '✓' : '✗'} Mínimo 6 caracteres
            </Text>
            <Text className="text-xs text-gray-500 ml-2">({password.length}/6)</Text>
          </View>
        </View>
      )}

      {paso === 3 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Número de control</Text>
          <TextInput className="border border-gray-300 rounded-xl p-4 bg-gray-100" placeholder="Se llena solo con el correo" value={numControl} editable={false} />

          <Text className="mb-1 mt-4 text-gray-700">Carrera *</Text>
          <View className="border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
            <Picker selectedValue={carrera} onValueChange={(itemValue) => setCarrera(itemValue)}>
              <Picker.Item label="Selecciona tu carrera" value="" />
              {carreras.map((carr) => (
                <Picker.Item key={carr.value} label={carr.label} value={carr.value} />
              ))}
            </Picker>
          </View>

          <Text className="mb-1 mt-4 text-gray-700">Foto de credencial *</Text>
          <TouchableOpacity className="bg-gray-200 p-4 rounded-xl mt-1 items-center" onPress={() => seleccionarFoto("credencial")}>
            {fotoCredencial ? (
              <View className="items-center">
                <Image source={{ uri: fotoCredencial }} className="w-32 h-32 rounded-lg" />
                <Text className="text-green-600 mt-2">✓ Foto seleccionada</Text>
              </View>
            ) : (
              <Text className="text-gray-600">📷 Subir foto de credencial</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {paso === 4 && (
        <View className="mt-6">
          <Text className="text-gray-600 text-center mb-4">Ya casi! solo falta tu foto de perfil</Text>
          <TouchableOpacity className="bg-gray-200 p-4 rounded-xl items-center" onPress={() => seleccionarFoto("perfil")}>
            {fotoPerfil ? (
              <View className="items-center">
                <Image source={{ uri: fotoPerfil }} className="w-32 h-32 rounded-full" />
                <Text className="text-green-600 mt-2">✓ Foto seleccionada</Text>
              </View>
            ) : (
              <Text className="text-gray-600">📷 Subir foto de perfil</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-row justify-between mt-8 mb-12">
        {paso > 1 && (
          <TouchableOpacity className="bg-gray-400 p-4 rounded-xl flex-1 mr-2" onPress={volver}>
            <Text className="text-white text-center font-bold">Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`${paso > 1 ? "flex-1 ml-2" : "flex-1"} ${cargando ? "bg-blue-400" : "bg-blue-900"} p-4 rounded-xl`}
          onPress={siguiente}
          disabled={cargando}
        >
          <Text className="text-white text-center font-bold">
            {paso === 4
              ? (cargando ? "Registrando..." : "Registrarme")
              : "Siguiente"
            }
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default RegisterScreen;
