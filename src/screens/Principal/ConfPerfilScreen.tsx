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

const ConfigPerfilScreen = ({ navigation }: any) => {

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');

  /*Estado del modal para editar datos personales y contraseña*/
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleContrasenia, setModalVisibleContrasenia] = useState(false);
  /*Switch modo conductor*/
  const [modoConductor, setModoConductor] = useState(false);



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

      <Text className="text-lg font-bold mt-3">José Vázquez</Text>
      <Text className="text-gray-500">correo@email.com</Text>
      <Text className="text-gray-500">No control: </Text>


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
            onValueChange={setModoConductor}
          />
        </View>

      </View>

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
              value={correo}
              onChangeText={setCorreo}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Nuevo correo"
            />



            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-blue-600 mt-4 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Guardar</Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>

      {/* Modal editar contraseña */}
      <Modal visible={modalVisibleContrasenia} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-lg font-semibold mb-3">Editar Contraseña</Text>

            <TextInput
              value={nombre}
              onChangeText={setNombre}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="contraseña"
            />

            <TouchableOpacity
              onPress={() => setModalVisibleContrasenia(false)}
              className="bg-blue-600 mt-4 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Guardar</Text>
            </TouchableOpacity>

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
        onPress={() => navigation.navigate('Login')}
      >
        <Text className="text-base bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">Cerrar Sesión</Text>
      </TouchableOpacity>


    </View>
  );
};

export default ConfigPerfilScreen;