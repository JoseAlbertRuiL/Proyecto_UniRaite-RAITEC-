import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { PanResponder, Animated } from "react-native";


const EmergencyButton = () => {
  const [visible, setVisible] = useState(false);

  

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const openWhatsApp = (number: string) => {
    Linking.openURL(`whatsapp://send?phone=${number}`);
  };

 const registrarIncidente = async (tipo) => {
  try {
    const res = await fetch("http://192.168.1.15:3000/rpc/incidentes/registrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo: tipo, // 🔥 SIN input
      }),
    });

    const data = await res.json();
    console.log("RESPUESTA:", data);

  } catch (error) {
    console.log("Error registrando incidente:", error);
  }
};

  return (
  <>
    <TouchableOpacity style={styles.floatingButton} onPress={() => setVisible(true)}>
      <Text style={styles.text}>SOS</Text>
    </TouchableOpacity>

    <Modal transparent={true} visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <Text style={styles.title}>Opciones de emergencia</Text>

<TouchableOpacity
  onPress={() => {
    registrarIncidente("accidente");
    callNumber("911");
  }}
>
  <Text style={styles.option}>Llamar 911</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    registrarIncidente("acoso");
    callNumber("4430000000");
  }}
>
  <Text style={styles.option}> Contacto de emergencia</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    registrarIncidente("otro");
    openWhatsApp("524430000000");
  }}
>
  <Text style={styles.option}> WhatsApp</Text>
</TouchableOpacity>

          

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
  close: {
    color: "red",
    marginTop: 15,
    textAlign: "center",
  },

  floatingButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "red",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8, // Android sombra
    shadowColor: "#000", // iOS sombra
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});