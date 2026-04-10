import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../services/api";

const RegisterScreen = ({ navigation }: any) => {
  // Paso 1 - Datos personales
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");

  // Paso 2 - Correo y contraseña
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Paso 3 - Datos escuela
  const [numControl, setNumControl] = useState("");
  const [carrera, setCarrera] = useState("");
  const [fotoCredencial, setFotoCredencial] = useState<string | null>(null);

  // Paso 4 - Foto perfil
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const [paso, setPaso] = useState(1);

  // Validar correo institucional (l + 8 números empezando con 2 + @morelia.tecnm.mx)
  const validarCorreo = (correo: string) => {
    const regex = /^l[2][0-9]{7}@morelia\.tecnm\.mx$/;
    return regex.test(correo);
  };

  //Validar si el correo electrónico institucional ya está registrado en la BD
  const verificarCorreoExistente = async (correo: string) => {
    try {
      const response = await fetch(
        `${API_URL}/verificar-correo?correo=${correo}`,
      );
      const data = await response.json();
      return data.existe;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // Tomar foto con cámara o galería
  const seleccionarFoto = async (tipo: "credencial" | "perfil") => {
    Alert.alert("Seleccionar foto", "¿Cómo quieres subir la imagen?", [
      { text: "📷 Tomar foto", onPress: () => tomarFoto(tipo) },
      { text: "🖼️ Elegir de galería", onPress: () => elegirDeGaleria(tipo) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const tomarFoto = async (tipo: "credencial" | "perfil") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (tipo === "credencial") {
        setFotoCredencial(result.assets[0].uri);
      } else {
        setFotoPerfil(result.assets[0].uri);
      }
    }
  };

  const elegirDeGaleria = async (tipo: "credencial" | "perfil") => {
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

    if (!result.canceled) {
      if (tipo === "credencial") {
        setFotoCredencial(result.assets[0].uri);
      } else {
        setFotoPerfil(result.assets[0].uri);
      }
    }
  };

  const siguiente = async () => {
    if (paso === 1) {
      if (nombre && apellidoPaterno) {
        setPaso(2);
      } else {
        Alert.alert("Error", "Faltan nombres");
      }
    } else if (paso === 2) {
      if (email && password) {
        if (!validarCorreo(email)) {
          Alert.alert(
            "Error",
            "El correo debe tener formato: lXXXXXXXX@morelia.tecnm.mx",
          );
          return;
        }

        // Verificar si el correo ya existe
        try {
          const url = `${API_URL}/verificar-correo?correo=${encodeURIComponent(email)}`;
          console.log("Consultando:", url);

          const response = await fetch(url);
          const text = await response.text();
          console.log("Respuesta cruda:", text);

          const data = JSON.parse(text);

          if (data.existe) {
            Alert.alert("Error", "Este correo ya está registrado");
            return;
          }
        } catch (error) {
          console.log("Error:", error);
          Alert.alert("Error", "No se pudo verificar el correo");
          return;
        }

        const numeros = email.match(/\d+/);
        if (numeros) {
          setNumControl(numeros[0]);
        }
        setPaso(3);
      } else {
        Alert.alert("Error", "Faltan campos");
      }
    } else if (paso === 3) {
      if (numControl && fotoCredencial) {
        setPaso(4);
      } else {
        Alert.alert("Error", "Falta número de control o foto de credencial");
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
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido_paterno", apellidoPaterno);
      formData.append("apellido_materno", apellidoMaterno);
      formData.append("correo_inst", email);
      formData.append("password", password);
      formData.append("num_control", numControl);
      formData.append("carrera", carrera);

      formData.append("foto_credencial", {
        uri: fotoCredencial,
        name: "credencial.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("foto_perfil", {
        uri: fotoPerfil,
        name: "perfil.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Listo!", "Te registraste correctamente", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        Alert.alert("Error", data.error || "algo salio mal");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo conectar al servidor");
    }
  };

  const volver = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      {/* Vista previa de la foto de perfil en círculo */}
      <View className="items-center mb-4">
        {fotoPerfil ? (
          <Image
            source={{ uri: fotoPerfil }}
            className="w-24 h-24 rounded-full border-2 border-blue-900"
          />
        ) : (
          <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center border-2 border-blue-900">
            <Text className="text-4xl">👤</Text>
          </View>
        )}
      </View>

      <Text className="text-4xl font-bold text-blue-900 text-center">
        UNIRAITE
      </Text>
      <Text className="text-center text-gray-500 mt-1">Paso {paso} de 4</Text>

      {paso === 1 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Nombre *</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="Tu nombre"
            value={nombre}
            onChangeText={setNombre}
          />
          <Text className="mb-1 mt-4 text-gray-700">Apellido Paterno *</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="Apellido paterno"
            value={apellidoPaterno}
            onChangeText={setApellidoPaterno}
          />
          <Text className="mb-1 mt-4 text-gray-700">Apellido Materno</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="Apellido materno (opcional)"
            value={apellidoMaterno}
            onChangeText={setApellidoMaterno}
          />
        </View>
      )}

      {paso === 2 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Correo institucional *</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="l2XXXXXXXX@morelia.tecnm.mx"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text className="text-xs text-gray-500 mt-1">
            Formato: l + 8 números (empieza con 2) + @morelia.tecnm.mx
          </Text>

          <Text className="mb-1 mt-4 text-gray-700">Contraseña *</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
      )}

      {paso === 3 && (
        <View className="mt-6">
          <Text className="mb-1 text-gray-700">Número de control</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4 bg-gray-100"
            placeholder="Se llena solo con el correo"
            value={numControl}
            editable={false}
          />
          <Text className="mb-1 mt-4 text-gray-700">Carrera</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4"
            placeholder="Tu carrera (opcional)"
            value={carrera}
            onChangeText={setCarrera}
          />

          <Text className="mb-1 mt-4 text-gray-700">Foto de credencial *</Text>
          <TouchableOpacity
            className="bg-gray-200 p-4 rounded-xl mt-1 items-center"
            onPress={() => seleccionarFoto("credencial")}
          >
            {fotoCredencial ? (
              <View className="items-center">
                <Image
                  source={{ uri: fotoCredencial }}
                  className="w-32 h-32 rounded-lg"
                />
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
          <Text className="text-gray-600 text-center mb-4">
            Ya casi! solo falta tu foto de perfil
          </Text>
          <TouchableOpacity
            className="bg-gray-200 p-4 rounded-xl items-center"
            onPress={() => seleccionarFoto("perfil")}
          >
            {fotoPerfil ? (
              <View className="items-center">
                <Image
                  source={{ uri: fotoPerfil }}
                  className="w-32 h-32 rounded-full"
                />
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
          <TouchableOpacity
            className="bg-gray-400 p-4 rounded-xl flex-1 mr-2"
            onPress={volver}
          >
            <Text className="text-white text-center font-bold">Atrás</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className={`${paso > 1 ? "flex-1 ml-2" : "flex-1"} bg-blue-900 p-4 rounded-xl`}
          onPress={siguiente}
        >
          <Text className="text-white text-center font-bold">
            {paso === 4 ? "Registrarme" : "Siguiente"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;
