import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserIcon from "../../icons/userIcon";
import NotificationIcon from "../../icons/notificationIcon";
import { useNotificaciones } from "../../hooks/queries/useNotificaciones";

interface HeaderProps {
  navigation: any;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ navigation, title }) => {
  const insets = useSafeAreaInsets();
  const { data } = useNotificaciones();

  const notificaciones = data?.notificaciones ?? [];
  const notificacionesNoLeidas = notificaciones.filter(
    (n: any) => !n.leido,
  ).length;

  return (
    <View
      className="flex-row justify-between items-center px-4 bg-blue-900"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
    >
      <TouchableOpacity
        className="w-8 h-8 rounded-full items-center justify-center"
        onPress={() => navigation.navigate("Start")}
      >
        <Image
          source={require("../../images/Logtype.png")}
          className="w-7 h-7"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text className="text-white text-sm font-bold">{title}</Text>

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-8 h-8 bg-white rounded-full items-center justify-center relative"
          onPress={() => navigation.navigate("Notificaciones")}
        >
          <NotificationIcon />
          {notificacionesNoLeidas > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[14px] h-[14px] items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-8 h-8 bg-white rounded-full items-center justify-center"
          onPress={() => navigation.navigate("ConfigP")}
        >
          <UserIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
