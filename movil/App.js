import "./global.css";
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { StatusBar } from 'expo-status-bar'; 

import { UserContext } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false); 

  useEffect(() => {
    /*
      Recupera la sesión almacenada en el dispositivo durante el arranque de la aplicación.
      la persistencia mediante AsyncStorage permite mantener el estado de autenticación 
      entre sesiones, evitando que el usuario deba introducir sus credenciales repetidamente.
    */
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userSession');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Error cargando sesión:", e);
      } finally {
        setIsReady(true);
      }
    };
    
    loadSession();
  }, []);

  /*
    Sincroniza el estado global de la aplicación con el almacenamiento persistente.
    al invocar esta función con un objeto nulo, se purga la sesión actual de la memoria,
    cerrando de forma segura la sesión del usuario en el cliente.
  */
  const handleSetUser = async (userData) => {
    setUser(userData);
    if (userData) {
      await AsyncStorage.setItem('userSession', JSON.stringify(userData));
    } else {
      await AsyncStorage.removeItem('userSession');
    }
  };

  /*
    Bloquea el renderizado del árbol de navegación hasta que se resuelva la lectura 
    asíncrona del almacenamiento local. Esto previene problemas de parpadeo visual 
    y enrutamientos prematuros hacia la pantalla de autenticación.
  */
  if (!isReady) return <View className="flex-1 bg-neutral-900" />;

  return (
    /*
      Inyección de dependencias a través del Context api de react.
      Proporciona acceso global al estado del usuario y a la función de modificación 
      desde cualquier componente descendiente, eliminando la necesidad de pasar 
      propiedades manualmente a través de la jerarquía de componentes.
    */
    <UserContext.Provider value={{ user, setUser: handleSetUser }}>
      <StatusBar style="light" backgroundColor="#171717" />
      <NavigationContainer theme={DarkTheme}>
        <AppNavigator />
      </NavigationContainer>
    </UserContext.Provider>
  );
}