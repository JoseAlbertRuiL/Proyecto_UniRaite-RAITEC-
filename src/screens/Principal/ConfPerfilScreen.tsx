import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Modal,
  Switch,
  Image
} from 'react-native';
import Header from '../../components/common/HeaderBack';
import { useEffect } from 'react';
/*Para Token*/
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';



const ConfigPerfilScreen = ({ navigation }: any) => {

  const [user, setUser] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleContrasenia, setModalVisibleContrasenia] = useState(false);
  const [modoConductor, setModoConductor] = useState(false);
  
  
  // Para cambiar el contacto de emergencia
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [modalVisibleContactoEmergencia, setModalVisibleContactoEmergencia] = useState(false);


  useEffect(() => {
    obtenerPerfil();
  }, []);

  useEffect(() => {
    if (user) {
      setModoConductor(user.es_conductor ?? false);
    }
  }, [user]);

  //Función para obtener datos del perfil
  const obtenerPerfil = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("TOKEN:", token);

    if (!token) {
      navigation.navigate("Login");
      return;
    }

    console.log("URL:", `${API_URL}/perfil`);

    const res = await fetch(`${API_URL}/perfil`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("STATUS:", res.status);

    const data = await res.json();
    console.log("DATA:", data);

    if (data.success) {
      setUser(data.user);
    } else {
      console.log("Error backend:", data);
    }

  } catch (error) {
    console.log("ERROR REAL:", error);
  }
};

//Función de cerrar sesión
const cerrarSesion = async () => {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user"); // opcional

    navigation.navigate("Login"); // mejor que navigate
  } catch (error) {
    console.log("Error al cerrar sesión:", error);
  }
};

// Función para guardar cambios de perfil
const guardarCambios = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if(!nombre.length || !apellidoPaterno.length || !apellidoMaterno.length) {
      alert("Todos los campos son requeridos");
      return;
    }
    const res = await fetch(`${API_URL}/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setUser(data.user); // actualiza UI
      setModalVisible(false);
    } else {
      alert("Error al actualizar");
    }

  } catch (error) {
    console.log(error);
  }
};

// Cambiar contraseña
const cambiarPassword = async () => {
  const token = await AsyncStorage.getItem("token");
  if(!nuevaPassword.length) {
    alert("La nueva contraseña es requerida");
    return;
  }
  const res = await fetch(`${API_URL}/perfil/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      passwordActual,
      nuevaPassword,
    }),
    
  });

  const data = await res.json();

  if (data.success) {
    alert("Contraseña actualizada");
    setModalVisibleContrasenia(false);
  } else {
    alert(data.error);
  }
};

const actualizarContacto = async () => {
  const token = await AsyncStorage.getItem("token");
  if(!contactoEmergencia.length) {
    alert("El contacto de emergencia es requerido");
    return;
  }
  const res = await fetch(`${API_URL}/perfil/contacto`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contactoEmergencia,
    }),
  });

  const data = await res.json();

  if (data.success) {
    setUser(data.user);
    setModalVisibleContactoEmergencia(false);
  } else {
    alert("Error al actualizar contacto");
  }
};

const handleModoConductor = async (value: boolean) => {
  if (value) {
    if (user?.es_conductor) {
      setModoConductor(true);
    } else {
      navigation.navigate("Licencia");
    }
  } else {
    setModoConductor(false);
  }
};


  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      
      <Header navigation={navigation} />

      {/* Foto de perfil */}
    <View className="items-center mt-6 mb-6">

      <TouchableOpacity onPress={() => console.log('Cambiar foto')}>
        
        <Image
          source={{ uri: 'https://i.pravatar.cc/150' }}
          className="w-28 h-28 rounded-full"
        />

        {/* Botón flotante */}
        <View className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center">
          <Text className="text-white text-xs">✎</Text>
        </View>

      </TouchableOpacity>

      <Text className="text-lg font-bold mt-3">{user ? `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`: "Cargando..."}</Text>
      <Text className="text-gray-500">{user?.correo_inst || "Cargando..."}</Text>
      <Text className="text-gray-500">No control: {user?.num_control || "..."}</Text>
      <Text className="text-gray-500">Carrera: {user?.carrera || "..."}</Text>

    </View>

    {/* Botones de credencial y licencia */}
      <View className="flex-row justify-between px-6 mb-6">

      {/* Botón credencial */}
        <TouchableOpacity
          className="flex-1 bg-gray-100 rounded-2xl py-6 items-center mr-2"
          onPress={() => console.log('Credencial')}
        >
          <Text className="text-base font-semibold">Credencial</Text>
          <Text className="text-gray-500 text-xs mt-1">Escolar</Text>
        </TouchableOpacity>

        {/* Botón licencia */}
        <TouchableOpacity
          className="flex-1 bg-gray-100 rounded-2xl py-6 items-center ml-2"
          onPress={() => console.log('Licencia')}
        >
          <Text className="text-base font-semibold">Licencia</Text>
          <Text className="text-gray-500 text-xs mt-1">Conducir</Text>
        </TouchableOpacity>

      </View>

      
      {/* Datos de configuración*/}
      <View className="mt-6 bg-white">
        {/* Datos personales */}
        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-base">Datos personales</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>
        
        {/* Contraseña */}
        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisibleContrasenia(true)}
        >
          <Text className="text-base">Cambiar contraseña</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

        {/* Modo conductor */}
        <View className="flex-row justify-between items-center px-4 py-4">
          <Text className="text-base">Modo conductor</Text>
          <Switch
            value={modoConductor}
            onValueChange={handleModoConductor}
          />
        </View>

        {/* Contacto de emergencia */}
        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisibleContactoEmergencia(true)}
        >
          <Text className="text-base">Contacto de emergencia</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

      </View>


      {/* ======================================= MOODALS ======================================= */}
      {/* Modal editar nombre */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Nombre</Text>

              <Image
                source={{ uri: 'https://i.pravatar.cc/150' }}
                className="w-28 h-28 rounded-full
                self-center"
              />
              <Text className="text-lg font-bold mt-3 text-center">Foto de perfil</Text>

            <TextInput
              value={nombre}
              onChangeText={setNombre}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Nuevo nombre"
            />
            
            <TextInput
              value={apellidoPaterno}
              onChangeText={setApellidoPaterno}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Nuevo Apellido Paterno"
            />

            <TextInput
              value={apellidoMaterno}
              onChangeText={setApellidoMaterno}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Nuevo Apellido Materno"
            />
            <View className="flex-row justify-between mt-4">

              <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => guardarCambios()}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Guardar</Text>
            </TouchableOpacity>
            </View>

          </View>

        </View>
      </Modal>

      {/* Modal editar contraseña */}
      <Modal visible={modalVisibleContrasenia} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Contraseña</Text>

            <TextInput
              value={passwordActual}
              onChangeText={setPasswordActual}
              placeholder="Contraseña actual"
            />

            <TextInput
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              placeholder="Nueva contraseña"
            />

            <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              onPress={() => cambiarPassword()}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Guardar</Text>
            </TouchableOpacity>
            
              <TouchableOpacity
              onPress={() => setModalVisibleContrasenia(false)}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Cancelar</Text>
            </TouchableOpacity>

            </View>

          </View>

        </View>
      </Modal>

      {/* Modal editar contacto de emergencia */}
      <Modal visible={modalVisibleContactoEmergencia} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Contacto de Emergencia</Text>
            <Text className="text-base">Contacto de emergencia:</Text>
            <Text className="text-gray-500 mb-4">
              {user?.contacto_emergencia || "No definido"}
            </Text>
            <TextInput
              value={contactoEmergencia}
              onChangeText={setContactoEmergencia}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Nuevo contacto de emergencia"
            /> 
            <View className="flex-row justify-between mt-4">
            <TouchableOpacity
              onPress={() => actualizarContacto()}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisibleContactoEmergencia(false)}
              className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">Cancelar</Text>
            </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>



      <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="mx-4 text-sm text-gray-500">o</Text>
                    <View className="flex-1 h-px bg-gray-200" />
      </View>
      <Text className='flex-row items center text-2xl font-semibold text-gray-800 mb-2'>
        Datos Vehículo:
      </Text>

      <TouchableOpacity
        onPress={cerrarSesion}
      >
        <Text className="text-base bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">Cerrar Sesión</Text>
      </TouchableOpacity>


    </View>
  );
};

export default ConfigPerfilScreen;