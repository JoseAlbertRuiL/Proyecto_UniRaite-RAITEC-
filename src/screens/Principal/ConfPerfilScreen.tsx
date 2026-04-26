// src/screens/Principal/ConfPerfilScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Modal,
  Switch,
  Image,
} from 'react-native';
import Header from '../../components/common/HeaderBack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPerfil, logout } from '../../services/auth/authService';
import { orpc } from '../../services/api/apiClient';

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
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [modalVisibleVehiculo, setModalVisibleVehiculo] = useState(false);

  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [modalVisibleContactoEmergencia, setModalVisibleContactoEmergencia] = useState(false);

  useEffect(() => {
    obtenerPerfil();
  }, []);

  useEffect(() => {
    const cargarEstadoSwitch = async () => {
      const guardado = await AsyncStorage.getItem('modo_conductor_activo');
      if (guardado === 'true' && user?.es_conductor) {
        setModoConductor(true);
      } else {
        setModoConductor(false);
      }
    };
    if (user) cargarEstadoSwitch();
  }, [user]);

  useEffect(() => {
    if (modoConductor && !vehiculo) {
      obtenerVehiculo();
    }
  }, [modoConductor]);

  const obtenerPerfil = async () => {
    try {
      const data = await getPerfil();
      setUser(data.user);
    } catch (error) {
      console.log('ERROR al obtener perfil:', error);
      navigation.navigate('Login');
    }
  };

  const obtenerVehiculo = async () => {
    try {
      const data = await orpc.conductor.getVehiculo();
      if (data.success) setVehiculo(data.vehiculo);
    } catch (error) {
      console.log('Error al obtener vehículo:', error);
    }
  };

  const cerrarSesion = async () => {
    await logout();
    navigation.navigate('Login');
  };

  const guardarCambios = async () => {
    if (!nombre.length || !apellidoPaterno.length || !apellidoMaterno.length) {
      alert('Todos los campos son requeridos');
      return;
    }
    try {
      const data = await orpc.usuarios.actualizarPerfil({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
      });
      if (data.success) {
        setUser(data.user);
        setModalVisible(false);
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const cambiarPassword = async () => {
    if (!nuevaPassword.length) {
      alert('La nueva contraseña es requerida');
      return;
    }
    try {
      const data = await orpc.usuarios.cambiarPassword({ passwordActual, nuevaPassword });
      if (data.success) {
        alert('Contraseña actualizada');
        setModalVisibleContrasenia(false);
      } else {
        alert(data.error);
      }
    } catch (error: any) {
      alert(error?.message || 'Error al cambiar contraseña');
    }
  };

  const actualizarContacto = async () => {
    if (!contactoEmergencia.length) {
      alert('El contacto de emergencia es requerido');
      return;
    }
    try {
      const data = await orpc.usuarios.actualizarContacto({ contactoEmergencia });
      if (data.success) {
        setUser(data.user);
        setModalVisibleContactoEmergencia(false);
      } else {
        alert('Error al actualizar contacto');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleModoConductor = async (value: boolean) => {
    if (value) {
      if (user?.es_conductor) {
        setModoConductor(true);
        await AsyncStorage.setItem('modo_conductor_activo', 'true');
      } else {
        navigation.navigate('Licencia');
      }
    } else {
      setModoConductor(false);
      await AsyncStorage.setItem('modo_conductor_activo', 'false');
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
        </TouchableOpacity>
        <Text className="text-lg font-bold mt-3">
          {user ? `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}` : 'Cargando...'}
        </Text>
        <Text className="text-gray-500">{user?.correo_inst || 'Cargando...'}</Text>
        <Text className="text-gray-500">No control: {user?.num_control || '...'}</Text>
        <Text className="text-gray-500">Carrera: {user?.carrera || '...'}</Text>
      </View>

      {/* Botones de credencial y licencia */}
      <View className="flex-row justify-between px-6 mb-6">
        <TouchableOpacity
          className="flex-1 bg-gray-100 rounded-2xl py-6 items-center mr-2"
          onPress={() => console.log('Credencial')}
        >
          <Text className="text-base font-semibold">Credencial</Text>
          <Text className="text-gray-500 text-xs mt-1">Escolar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-gray-100 rounded-2xl py-6 items-center ml-2"
          onPress={() => console.log('Licencia')}
        >
          <Text className="text-base font-semibold">Licencia</Text>
          <Text className="text-gray-500 text-xs mt-1">Conducir</Text>
        </TouchableOpacity>
      </View>

      {/* Datos de configuración */}
      <View className="mt-6 bg-white">
        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-base">Datos personales</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisibleContrasenia(true)}
        >
          <Text className="text-base">Cambiar contraseña</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center px-4 py-4">
          <Text className="text-base">Modo conductor</Text>
          <Switch value={modoConductor} onValueChange={handleModoConductor} />
        </View>

        {modoConductor && (
          <TouchableOpacity
            className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
            onPress={() => setModalVisibleVehiculo(true)}
          >
            <Text className="text-base">Datos del vehículo</Text>
            <Text>{'>'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => setModalVisibleContactoEmergencia(true)}
        >
          <Text className="text-base">Contacto de emergencia</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* ======= MODALS ======= */}
      {/* Modal editar nombre */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Nombre</Text>
            <Image source={{ uri: 'https://i.pravatar.cc/150' }} className="w-28 h-28 rounded-full self-center" />
            <Text className="text-lg font-bold mt-3 text-center">Foto de perfil</Text>
            <TextInput value={nombre} onChangeText={setNombre} className="border border-gray-300 rounded-xl px-4 py-3" placeholder="Nuevo nombre" />
            <TextInput value={apellidoPaterno} onChangeText={setApellidoPaterno} className="border border-gray-300 rounded-xl px-4 py-3" placeholder="Nuevo Apellido Paterno" />
            <TextInput value={apellidoMaterno} onChangeText={setApellidoMaterno} className="border border-gray-300 rounded-xl px-4 py-3" placeholder="Nuevo Apellido Materno" />
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity onPress={guardarCambios} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
                <Text className="text-white font-semibold text-lg">Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
                <Text className="text-white font-semibold text-lg">Cancelar</Text>
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
            <TextInput value={passwordActual} onChangeText={setPasswordActual} placeholder="Contraseña actual" secureTextEntry />
            <TextInput value={nuevaPassword} onChangeText={setNuevaPassword} placeholder="Nueva contraseña" secureTextEntry />
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity onPress={cambiarPassword} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
                <Text className="text-white font-semibold text-lg">Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisibleContrasenia(false)} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
                <Text className="text-white font-semibold text-lg">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal datos del vehículo */}
      <Modal visible={modalVisibleVehiculo} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-4">Datos del Vehículo</Text>
            {vehiculo ? (
              <View>
                <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Modelo</Text><Text className="text-base font-semibold text-gray-900">{vehiculo.modelo}</Text></View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Placas</Text><Text className="text-base font-semibold text-gray-900">{vehiculo.placas}</Text></View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Color</Text><Text className="text-base font-semibold text-gray-900">{vehiculo.color}</Text></View>
                <View className="h-px bg-gray-100 mb-3" />
                <View className="mb-4"><Text className="text-xs text-gray-500 mb-1">Capacidad de pasajeros</Text><Text className="text-base font-semibold text-gray-900">{vehiculo.capacidad_pasajeros} pasajeros</Text></View>
              </View>
            ) : (
              <Text className="text-gray-500 text-center mb-4">Cargando datos...</Text>
            )}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity onPress={() => { setModalVisibleVehiculo(false); navigation.navigate('Circulacion', { modoEdicion: true }); }} className="flex-1 bg-gray-200 py-3 rounded-xl items-center mr-2">
                <Text className="text-gray-700 font-semibold text-base">Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisibleVehiculo(false)} className="flex-1 bg-blue-600 py-3 rounded-xl items-center ml-2">
                <Text className="text-white font-semibold text-base">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal contacto de emergencia */}
      <Modal visible={modalVisibleContactoEmergencia} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Contacto de Emergencia</Text>
            <Text className="text-base">Contacto de emergencia:</Text>
            <Text className="text-gray-500 mb-4">{user?.contacto_emergencia || 'No definido'}</Text>
            <TextInput value={contactoEmergencia} onChangeText={setContactoEmergencia} className="border border-gray-300 rounded-xl px-4 py-3" placeholder="Nuevo contacto de emergencia" />
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity onPress={actualizarContacto} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
                <Text className="text-white font-semibold text-lg">Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisibleContactoEmergencia(false)} className="bg-blue-600 mt-4 py-3 px-10 rounded-xl items-center">
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

      <TouchableOpacity onPress={cerrarSesion}>
        <Text className="text-base bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">
          Cerrar Sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfigPerfilScreen;
