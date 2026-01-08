import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
import { BusinessProvider } from './src/context/BusinessContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/db';

export default function App() {
  useEffect(() => {
    // Inicializar base de datos SQLite al montar la app
    initDatabase();

    // Verificar actualizaciones OTA
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      // Verificar si Updates está habilitado
      if (!Updates.isEnabled) {
        console.log('Expo Updates no está habilitado');
        return;
      }

      // En desarrollo, solo verificar si no estamos usando Expo Go
      if (__DEV__ && !Updates.isEmbeddedLaunch) {
        console.log('Modo desarrollo con Expo Go - OTA no disponible');
        return;
      }

      console.log('Verificando actualizaciones OTA...');
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('Actualización disponible, descargando...');
        Alert.alert(
          'Actualización disponible',
          'Descargando la nueva versión de la aplicación...',
          [{ text: 'OK' }]
        );

        await Updates.fetchUpdateAsync();

        Alert.alert(
          'Actualización lista',
          'La aplicación se reiniciará para aplicar los cambios.',
          [{
            text: 'Reiniciar ahora',
            onPress: async () => {
              await Updates.reloadAsync();
            }
          }]
        );
      } else {
        console.log('No hay actualizaciones disponibles');
      }
    } catch (error) {
      console.log('Error al verificar actualizaciones:', error);
    }
  };

  return (
    <AuthProvider>
      <BusinessProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </BusinessProvider>
    </AuthProvider>
  );
}
