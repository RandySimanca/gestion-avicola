import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
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
      if (__DEV__) return;

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
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
      }
    } catch (error) {
      console.log('Error al verificar actualizaciones:', error);
    }
  };

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
