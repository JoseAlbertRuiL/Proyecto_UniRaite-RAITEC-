import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { useBackHandler } from "../../hooks/useBackHandler";

const { width } = Dimensions.get("window");

const FinishTripScreen = ({ navigation }: any) => {
  
  useBackHandler(navigation, "main");

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f0f9ff" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header decorativo */}
        <View className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
          {/* Icono de éxito animado */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-white bg-opacity-20 rounded-full items-center justify-center mb-4">
              <View className="w-20 h-20 bg-green-400 rounded-full items-center justify-center">
                <Text className="text-4xl">✓</Text>
              </View>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight">
              ¡Viaje
            </Text>
            <Text className="text-white text-4xl font-bold tracking-tight">
              Finalizado!
            </Text>
          </View>

          {/* Descripción */}
          <View className="bg-white bg-opacity-10 rounded-2xl px-4 py-3 border border-white border-opacity-20">
            <Text className="text-white text-center text-sm font-medium">
              Gracias por usar UniRaite. Tu viaje ha sido completado
              exitosamente.
            </Text>
          </View>
        </View>

        <View className="px-6 py-8">
          {/* Card: Resumen del viaje */}
          <View className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            {/* Encabezado de card */}
            <View className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
              <Text className="text-blue-900 font-bold text-base">
                RESUMEN DEL VIAJE
              </Text>
            </View>

            
          </View>

          {/* Card: Desglose de ingresos */}
          <View className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            {/* Encabezado */}
            <View className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
              <Text className="text-green-900 font-bold text-base">
                💰 DESGLOSE FINANCIERO
              </Text>
            </View>

            {/* Tabla de pasajeros */}
            <View className="p-6">
              <View className="mb-4">
                <View className="flex-row bg-gray-50 rounded-lg px-4 py-3 mb-2 border border-gray-200">
                  <Text className="flex-1 text-gray-700 font-semibold text-xs">
                    PASAJERO
                  </Text>
                  <Text className="w-20 text-gray-700 font-semibold text-xs text-right">
                    TARIFA
                  </Text>
                </View>

                {/* Filas de pasajeros */}
                {[1, 2, 3].map((i) => (
                  <View key={i} className="flex-row px-4 py-3 border-b border-gray-100">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium text-sm">
                        Pasajero {i}
                      </Text>
                    </View>
                    <Text className="w-20 text-gray-900 font-semibold text-sm text-right">
                      $250
                    </Text>
                  </View>
                ))}
              </View>

              {/* Divisor */}
              <View className="h-px bg-gray-200 my-4" />

              {/* Total */}
              <View className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl px-4 py-4 border border-green-200 flex-row justify-between items-center">
                <Text className="text-green-900 font-bold text-base">
                  TOTAL COBRADO
                </Text>
                <Text className="text-green-600 font-bold text-2xl">$750</Text>
              </View>
            </View>
          </View>

          {/* Card: Calificación */}
          <View className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden border border-gray-100">
            {/* Encabezado */}
            <View className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-gray-200">
              <Text className="text-yellow-900 font-bold text-base">
                ⭐ CALIFICACIÓN
              </Text>
            </View>

            {/* Contenido */}
            <View className="p-6">
              <Text className="text-gray-600 text-sm mb-4 text-center">
                Los pasajeros calificarán tu servicio en los próximos momentos
              </Text>
              <View className="flex-row justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <View
                    key={star}
                    className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                  >
                    <Text className="text-lg text-gray-400">★</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Botones de acción */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              
              className="bg-blue-500 rounded-2xl px-6 py-4 shadow-lg mb-3"
            >
              <Text className="text-white font-bold text-center text-lg">
                Finalizar Viaje
              </Text>
            </TouchableOpacity>

          </View>

          {/* Info footer */}
          <View className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-200 mb-8">
            <Text className="text-blue-900 text-xs text-center font-medium">
              ✓ Tu viaje ha sido registrado en el historial y los pasajeros han
              sido notificados
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default FinishTripScreen;
