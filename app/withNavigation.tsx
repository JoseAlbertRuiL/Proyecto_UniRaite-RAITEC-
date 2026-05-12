import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export function withNavigation(WrappedComponent: any) {
  return function Wrapper(props: any) {
    const router = useRouter();
    const params = useLocalSearchParams();

    const routeMapping: Record<string, any> = {
      "Register": "/(principal)/Register",
      "Login": "/",
      "Home": "/(principal)/Home",
      "Forget": "/(principal)/Forget",
      "Code": "/(principal)/Code",
      "ConfigP": "/(principal)/ConfigP",
      "ChangePassword": "/(principal)/ChangePassword",
      "Map": "/(principal)/Map",
      "Chat": "/(principal)/Chat",
      "Licencia": "/(principal)/Licencia",
      "Circulacion": "/(principal)/Circulacion",
      "PublicarViaje": "/(trip)/PublicarViaje",
      "ChatHistory": "/(principal)/ChatHistory",
      "PerfilPublico": "/(principal)/PerfilPublico",
      "Conducir": "/(principal)/Conducir",
      "Notificaciones": "/(principal)/Notificaciones",
      "FinishTrip": "/(trip)/FinishTrip",
      "RateTrip": "/(trip)/RateTrip",
      "History": "/(principal)/History",
      "Start": "/(principal)/Home"
    };

    const navigation = {
      navigate: (name: string, navigateParams?: any) => {
        const path = routeMapping[name] || name;
        if (navigateParams) {
          router.push({ pathname: path, params: navigateParams });
        } else {
          router.push(path);
        }
      },
      goBack: () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(principal)/Home');
        }
      }
    };

    const route = {
      params: params
    };

    return <WrappedComponent {...props} navigation={navigation} route={route} />;
  };
}
