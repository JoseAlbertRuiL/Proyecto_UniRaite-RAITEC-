import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { PanResponder, Animated } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPerfil } from "../services/auth/authService";
import { BASE_URL } from "../services/api/apiClient";


const EmergencyButton = () => {
  const [visible, setVisible] = useState(false);

  const { data: perfil, isLoading: loading } = useQuery({
    queryKey: ["perfil-emergencia"],
    queryFn: getPerfil,
  });

  const contactoEmergencia = perfil?.user?.contacto_emergencia ?? null;

  const incidenteMutation = useMutation({
    mutationFn: async (tipo: string) => {
      const res = await fetch(`${BASE_URL}/rpc/incidentes/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      return res.json();
    },
  });

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const openWhatsApp = (number: string) => {
    Linking.openURL(`whatsapp://send?phone=${number}`);
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
    incidenteMutation.mutate("accidente");
    callNumber("911");
  }}
>
  <Text style={styles.option}>Llamar 911</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    incidenteMutation.mutate("acoso");
    callNumber("4430000000");
  }}
>
  <Text style={styles.option}> Contacto de emergencia</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    incidenteMutation.mutate("otro");
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
    elevation: 8, // Android sombra
    shadowColor: "#000", // iOS sombra
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});