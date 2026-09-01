/** @type {import('tailwindcss').Config} */
module.exports = {
  // Define las rutas donde Tailwind buscará clases utilitarias. 
  // Solo se compilarán y empaquetarán los estilos de las clases que se encuentren en estos archivos.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  
  // Carga la configuración base de NativeWind, la cual es responsable de 
  // traducir las clases de Tailwind en objetos StyleSheet nativos de React Native.
  presets: [require("nativewind/preset")],
  
  theme: {
    extend: {},
  },
  plugins: [],
}