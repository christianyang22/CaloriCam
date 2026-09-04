/*
  url base del backend expuesta mediante un túnel de red en ngrok para pruebas en entorno de desarrollo.
  Permite la comunicación segura entre el cliente móvil y el servidor local.
  En un despliegue a producción, esta constante debe ser reemplazada por el dominio definitivo de la api.
*/
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
/*
  Expresión regular empleada para la sanitización y validación en el lado del cliente.
  Restringe la entrada de datos en campos de nombres y apellidos exclusivamente a letras, 
  espacios y guiones, previniendo así la inyección de caracteres especiales no soportados o maliciosos.
*/
export const regexSoloLetras = /^[a-zA-ZÀ-ÿ\s'-]+$/;