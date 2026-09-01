import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { UserContext } from '../context/UserContext';

import { LoginScreen, RegisterScreen, OnboardingScreen } from '../screens/AuthScreens';
import { HomeScreen, CameraScreen, ResultsScreen } from '../screens/HomeScreens';
import { HistorialScreen } from '../screens/HistorialScreen';
import { ProfileMainScreen, PerfilAjustesScreen, PrivacidadSeguridadScreen, TerminosScreen } from '../screens/ProfileScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator(); 

/*
  Agrupa las pantallas del flujo principal de la aplicación.
  La anidación de este stack dentro del tabnavigator es una decisión de diseño 
  que permite que ciertas vistas, como la interfaz de la cámara, se rendericen 
  a pantalla completa, ocultando temporalmente la barra inferior de navegación.
*/
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={HomeScreen} />
      <HomeStack.Screen name="Camera" component={CameraScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
    </HomeStack.Navigator>
  );
}

/*
  Encapsula el flujo de navegación secundario correspondiente al perfil del usuario.
  Mantener estas pantallas en su propio stack facilita la gestión del historial 
  de navegación interno de esta sección sin interferir con las demás pestañas.
*/
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileMainScreen} />
      <ProfileStack.Screen name="PerfilAjustes" component={PerfilAjustesScreen} />
      <ProfileStack.Screen name="PrivacidadSeguridad" component={PrivacidadSeguridadScreen} />
      <ProfileStack.Screen name="Terminos" component={TerminosScreen} />
    </ProfileStack.Navigator>
  );
}

/*
  Configuración del menú de navegación inferior.
  Actúa como el contenedor visual principal de la aplicación una vez que 
  el usuario ha superado los controles de acceso y configuración inicial.
*/
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#171717', borderTopWidth: 0, paddingBottom: 5, paddingTop: 5 },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeStackNavigator} 
        options={{ tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Inicio', { screen: 'Dashboard' });
          },
        })}
      />
      <Tab.Screen 
        name="Historial" 
        component={HistorialScreen} 
        options={{ tabBarIcon: ({color}) => <Ionicons name="list" size={24} color={color} /> }} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileStackNavigator} 
        options={{ unmountOnBlur: true, tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} /> }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Perfil', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useContext(UserContext);

  /*
    Enrutador principal que implementa un patrón de navegación condicional.
    Controla de forma segura el acceso a las distintas áreas de la aplicación evaluando 
    el estado global del contexto:
    
    1. Sin autenticar user == null: muestra únicamente el flujo de acceso.
    2. Autenticado pero sin configurar !user.onboarding_completado: fuerza el flujo de onboarding para obtener datos biométricos.
    3. Autenticado y configurado: concede acceso total a la interfaz principal.
  */
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#171717' } }}>
      {user == null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !user.onboarding_completado ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="MainApp" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
}