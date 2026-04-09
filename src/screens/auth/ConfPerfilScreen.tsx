import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import Header from '../../components/common/HeaderBack';

const ConfigPerfilScreen  = ({ navigation }: any) => {

    const handleRecover = () => {

    }

    return(
      <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />



        {/* Divider */}
        <View className="flex-row items-center mb-6">
        </View>
      
        



    </View>

    );

}

export default ConfigPerfilScreen;