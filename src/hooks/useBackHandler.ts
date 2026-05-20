import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';

export const useBackHandler = (navigation: any, type: 'main' | 'login' | 'normal') => {
  useEffect(() => {
    let backPressCount = 0;
    let timeout: NodeJS.Timeout;

    const onBackPress = () => {
      if (type === 'main' || type === 'login') {
        if (backPressCount === 0) {
          backPressCount++;
          Alert.alert('Presiona de nuevo para salir', '¿Deseas cerrar la aplicación?', [
            { text: 'Quedarme', style: 'cancel', onPress: () => { backPressCount = 0; } },
            { text: 'Salir', onPress: () => BackHandler.exitApp() }
          ]);
          timeout = setTimeout(() => { backPressCount = 0; }, 2000);
        } else {
          clearTimeout(timeout);
          BackHandler.exitApp();
        }
        return true;
      } else {
        // Let the native Stack Navigator handle back navigation
        return false;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    
    return () => {
      subscription.remove();
      if (timeout) clearTimeout(timeout);
    };
  }, [navigation, type]);
};