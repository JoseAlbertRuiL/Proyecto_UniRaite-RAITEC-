import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import DriverCard from "../../components/driverCard";

const StartScreen = ({ navigation }: any) => {
  const handleStart = () => {
    console.log("Start:");
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          <View className="w-full h-64 bg-green-200 rounded-lg mb-6" />

          <View className="items-center justify-center flex-1 mb-12">
            <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
              UNIRAITE
            </Text>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-500">Conductores</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <DriverCard />
          </View>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-sm text-gray-500">o</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Footer navigation={navigation} />
    </View>
  );
};

export default StartScreen;
