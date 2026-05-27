import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { PanResponder, Animated } from "react-native";
import { usePerfil } from "../hooks/queries/usePerfil";

const EmergencyButton = () => {
  const [visible, setVisible] = useState(false);
  const { data: response, isLoading } = usePerfil();
  const contactoEmergencia = response?.user?.contacto_emergencia ?? null;

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const openWhatsApp = (number: string) => {
    Linking.openURL(`whatsapp://send?phone=${number}`);
  };

  return (
    <>
      <TouchableOpacity style={styles.floatingButton} onPress={() => setVisible(true)}>
        <Text style={styles.text}>!</Text>
      </TouchableOpacity>

      <Modal transparent={true} visible={visible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.title}>Opciones de emergencia</Text>

            <TouchableOpacity onPress={() => callNumber("911")}>
              <Text style={styles.option}>📞 Llamar 911</Text>
            </TouchableOpacity>

            {isLoading ? (
              <Text style={styles.option}>Cargando contacto...</Text>
            ) : contactoEmergencia ? (
              <>
                <TouchableOpacity onPress={() => callNumber(contactoEmergencia)}>
                  <Text style={styles.option}>📱 Llamar contacto de emergencia</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openWhatsApp(contactoEmergencia)}>
                  <Text style={styles.option}>💬 WhatsApp contacto de emergencia</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.optionDisabled}>No tienes contacto de emergencia configurado</Text>
            )}

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EmergencyButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontSize: 45,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  option: {
    fontSize: 16,
    marginVertical: 10,
  },
  optionDisabled: {
    fontSize: 16,
    marginVertical: 10,
    color: "gray",
  },
  close: {
    color: "red",
    marginTop: 15,
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 110,
    left: 20,
    backgroundColor: "red",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
