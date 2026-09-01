module.exports = function(api) {
  // Cachea la configuración devuelta por esta función para mejorar 
  // el tiempo de compilación durante el desarrollo.
  api.cache(true);
  
  return {
    presets: [
      // Configuración base de Expo modificada para inyectar NativeWind.
      // Permite utilizar clases de utilidad estilo Tailwind directamente en los componentes.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Plugin necesario para procesar los worklets y animaciones fluidas a 60fps.
      // Por requisitos de la librería, este plugin siempre debe ser el último del array.
      "react-native-reanimated/plugin",
    ],
  };
};