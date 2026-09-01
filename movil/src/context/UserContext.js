import { createContext } from 'react';

/*
  Contexto global para gestionar el estado del usuario autenticado.
  Permite acceder a los datos del perfil y al token jwt desde cualquier 
  componente de la aplicación sin necesidad de inyectarlos manualmente a 
  través de la jerarquía de componentes.
*/
export const UserContext = createContext();