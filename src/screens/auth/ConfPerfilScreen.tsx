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
  const [modalVisible, setModalVisible] = useState(false);
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

    </View>


      {/* Card perfil */}
      <View className="bg-gray-100 mx-4 mt-4 p-4 rounded-2xl">
        <Text className="text-lg font-bold text-gray-900">{nombre}</Text>
        <Text className="text-gray-500">{correo}</Text>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-blue-600 mt-3 py-3 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">Editar Nombre</Text>
        </TouchableOpacity>
      </View>

      {/* Opciones */}
      <View className="mt-6 bg-white">
        
        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => navigation.navigate('DatosPersonales')}
        >
          <Text className="text-base">Datos personales</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200"
          onPress={() => navigation.navigate('CambiarPassword')}
        >
          <Text className="text-base">Cambiar contraseña</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>

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

    </View>
  );
};

export default ConfigPerfilScreen;