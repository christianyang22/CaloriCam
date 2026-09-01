import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/*
  Componente reutilizable que sustituye la alerta nativa del sistema operativo.
  Proporciona una interfaz gráfica coherente con el diseño global de la aplicación
  y gestiona dinámicamente diferentes niveles de severidad (informativo, éxito, destructivo)
  a través del paso de propiedades y el análisis de su contenido.
*/
export const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onClose, 
  onConfirm, 
  confirmText = "Entendido", 
  showCancel = false, 
  isDestructive = false 
}) => {
  if (!visible) return null;

  /*
    Análisis del título de la alerta.
    Se evalúa la presencia de palabras clave específicas para inferir automáticamente 
    si se trata de un mensaje de éxito. Esto reduce la fricción en el desarrollo, 
    evitando la necesidad de pasar una propiedad adicional en cada invocación.
  */
  const isSuccess = title.toLowerCase().includes("éxito") || 
                    title.toLowerCase().includes("bienvenido") || 
                    title.toLowerCase().includes("actualizada");

  /*
    Asignación dinámica de clases de estilo y paleta de colores.
    El flujo prioriza el estado destructivo (ej. borrar un plato o cuenta) para alertar 
    visualmente al usuario (en color rojo) antes de ejecutar acciones irreversibles.
  */
  const mainColor = isDestructive ? "bg-red-600" : "bg-emerald-600";
  const iconColor = isDestructive ? "#ef4444" : "#10b981";
  const bgIcon = isDestructive ? "bg-red-500/20" : "bg-emerald-500/20";

  let iconName = "information-circle";
  if (isDestructive) {
    iconName = "warning";
  } else if (isSuccess) {
    iconName = "checkmark-circle";
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/70 px-8">
        <View className="bg-neutral-800 p-6 rounded-3xl w-full border border-neutral-700 shadow-2xl items-center">
          
          <View className={`${bgIcon} p-3 rounded-full mb-4`}>
            <Ionicons name={iconName} size={36} color={iconColor} />
          </View>
          
          <Text className="text-white text-2xl font-bold text-center mb-2">
            {title}
          </Text>
          <Text className="text-neutral-400 text-center mb-6 text-base leading-5">
            {message}
          </Text>
          
          <View className="flex-row w-full justify-between mt-2">
            {showCancel && (
              <TouchableOpacity 
                className="flex-1 bg-neutral-700 py-3 rounded-xl items-center mr-2" 
                onPress={onClose}
              >
                <Text className="text-white font-bold text-lg">Cancelar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              className={`flex-1 ${mainColor} py-3 rounded-xl items-center`} 
              onPress={() => { 
                onClose(); 
                if (onConfirm) onConfirm(); 
              }}
            >
              <Text className="text-white font-bold text-lg">{confirmText}</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
};