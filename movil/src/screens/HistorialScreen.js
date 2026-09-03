import React, { useRef, useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, ScrollView, Modal, Animated, PanResponder, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { API_BASE_URL } from '../config/constants';
import { calculateNutritionTotals, parseIngredients } from '../utils/nutrition';

/*
  Componente que permite deslizar un elemento del historial hacia la izquierda para eliminarlo.
  Utiliza panresponder para capturar los gestos táctiles y animated para proporcionar 
  feedback visual continuo durante el desplazamiento.
*/
const SwipeableHistorialItem = ({ plato, onSelect, onInstantDelete, onSwipeStart, onSwipeEnd }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  
  const resetItem = () => {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        /*
          Se bloquea el evento de scroll vertical del contenedor padre 
          únicamente si el movimiento horizontal es significativamente mayor que el vertical.
          Esto evita accionar el borrado por accidente mientras se navega por la lista.
        */
        const isHorizontal = Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontal) onSwipeStart();
        return isHorizontal;
      },
      onPanResponderMove: (e, gestureState) => {
        let newX = gestureState.dx;
        if (newX > 0) newX = 0; 
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (e, gestureState) => {
        onSwipeEnd();
        
        /*
          Si el arrastre supera el umbral de los -100 píxeles hacia la izquierda, 
          se anima la salida completa del elemento de la pantalla y se procede con la eliminación.
          En caso contrario, el elemento rebota suavemente a su posición original.
        */
        if (gestureState.dx < -100) {
          Animated.timing(pan, { toValue: { x: -500, y: 0 }, duration: 200, useNativeDriver: true }).start(() => {
            onInstantDelete(plato.id);
          });
        } else {
          resetItem();
        }
      },
      onPanResponderTerminate: () => {
        onSwipeEnd();
        resetItem();
      }
    })
  ).current;

  const fechaSegura = typeof plato.fecha === 'string' ? plato.fecha.replace(' ', 'T') : plato.fecha; 
  const dateObj = new Date(fechaSegura);
  const fechaFormateada = isNaN(dateObj) ? plato.fecha : dateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  const imageUrl = `${API_BASE_URL}/imagenes/${plato.imagen_id}.jpg`;

  return (
    <View className="mb-4 relative justify-center rounded-2xl bg-red-500 overflow-hidden shadow-lg">
      <View className="absolute right-0 top-0 bottom-0 w-full justify-center items-end pr-8">
         <Ionicons name="trash" size={32} color="white" />
      </View>
      
      <Animated.View style={{ transform: [{ translateX: pan.x }] }} {...panResponder.panHandlers}>
        <TouchableOpacity 
          activeOpacity={1}
          className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700"
          onPress={() => onSelect(plato)}
        >
          <View className="flex-row items-center mb-3">
            <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl mr-4 bg-neutral-700" resizeMode="cover" />
            <View className="flex-1">
              <Text className="text-neutral-400 font-bold text-xs uppercase mb-1">{fechaFormateada}</Text>
              <Text className="text-emerald-400 font-bold text-xl">{parseFloat(Number(plato.calorias_totales).toFixed(2))} kcal</Text>
            </View>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-neutral-700/50 px-2">
            <Text className="text-blue-400 text-xs font-bold">P: {parseFloat(Number(plato.proteinas_g).toFixed(2))}g</Text>
            <Text className="text-yellow-400 text-xs font-bold">C: {parseFloat(Number(plato.carbohidratos_g).toFixed(2))}g</Text>
            <Text className="text-red-400 text-xs font-bold">G: {parseFloat(Number(plato.grasas_g).toFixed(2))}g</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export function HistorialScreen({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);
  
  const [scrollEnabled, setScrollEnabled] = useState(true);

  /*
    Gestor de gestos para el modal de detalles del plato.
    Permite al usuario arrastrar el panel hacia abajo para cerrarlo, calculando 
    tanto la distancia de arrastre como la velocidad del gesto
    para determinar si existe una intención real de cierre.
  */
  const panY = useRef(new Animated.Value(0)).current;
  const panResponderModal = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy); 
      },
      onPanResponderRelease: (e, gs) => {
        if (gs.dy > 120 || gs.vy > 1.5) { 
          cerrarModal();
        } else { 
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  const cerrarModal = () => {
    setPlatoSeleccionado(null);
    setTimeout(() => panY.setValue(0), 300);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarHistorial();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/historial`, { 
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'ngrok-skip-browser-warning': 'true' 
        } 
      });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.status === 'éxito') {
        setHistorial(data.historial);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPlatoConfirmado = async (idPlato) => {
    try {
      await fetch(`${API_BASE_URL}/comida/${idPlato}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' }
      });
      cerrarModal();
      cargarHistorial(); 
    } catch (e) {}
  };

  /*
    Muestra una alerta nativa de sistema para confirmar la eliminación.
    Recibe el objeto plato completo por parámetro para aislar el contexto de la función 
    y asegurar que la eliminación procese el identificador correcto de forma segura.
  */
  const confirmarBorradoModal = (plato) => {
    Alert.alert(
      "Eliminar plato",
      `¿Seguro que quieres borrar este escaneo de ${parseFloat(Number(plato.calorias_totales).toFixed(2))} kcal de tu historial?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => eliminarPlatoConfirmado(plato.id) }
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900 px-6 pt-10">
      <Text className="text-white text-3xl font-bold mb-2">Historial</Text>
      <Text className="text-neutral-400 mb-6">Tus escaneos recientes</Text>
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : historial.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-20">
          <Ionicons name="fast-food-outline" size={64} color="#374151" />
          <Text className="text-neutral-500 mt-4 text-center">Aún no hay platos escaneados.</Text>
          <Text className="text-neutral-600 text-xs mt-2 text-center">¡Ve a Inicio y escanea tu primera comida!</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(plato, index) => String(plato.id || index)}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item: plato }) => (
             <SwipeableHistorialItem 
                plato={plato} 
                onSelect={(p) => setPlatoSeleccionado(p)} 
                onInstantDelete={eliminarPlatoConfirmado} 
                onSwipeStart={() => setScrollEnabled(false)}
                onSwipeEnd={() => setScrollEnabled(true)}
             />
          )}
        />
      )}

      {/* Vista modal superpuesta con los detalles completos del escaneo */}
      <Modal visible={!!platoSeleccionado} animationType="slide" transparent onRequestClose={cerrarModal}>
        <View className="flex-1 bg-black/80 justify-end">
          <Animated.View 
            style={{ transform: [{ translateY: panY }] }} 
            className="bg-neutral-900 h-[85%] rounded-t-3xl border-t border-neutral-700 overflow-hidden"
          >
            <View {...panResponderModal.panHandlers} className="bg-neutral-800 border-b border-neutral-700">
              <View className="items-center pt-3 pb-1">
                <View className="w-12 h-1.5 bg-neutral-600 rounded-full" />
              </View>
              <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
                <Text className="text-white text-2xl font-bold">Detalles del plato</Text>
                <TouchableOpacity onPress={cerrarModal} className="p-1 bg-neutral-700 rounded-full">
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            {platoSeleccionado && (
              <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <Image 
                  source={{ uri: `${API_BASE_URL}/imagenes/${platoSeleccionado.imagen_id}.jpg` }} 
                  className="w-full h-48 rounded-xl mb-6 bg-neutral-800" 
                  resizeMode="cover" 
                />
                
                <View className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 mb-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-xl font-bold">Total del plato</Text>
                    <View className="bg-emerald-500/20 px-4 py-2 rounded-lg">
                      <Text className="text-emerald-400 font-bold text-lg">{parseFloat(Number(platoSeleccionado.calorias_totales).toFixed(2))} kcal</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between pt-3 border-t border-neutral-700/50">
                    <Text className="text-blue-400 text-xs font-bold">Proteína: {parseFloat(Number(platoSeleccionado.proteinas_g).toFixed(2))}g</Text>
                    <Text className="text-yellow-400 text-xs font-bold">Carbohidratos: {parseFloat(Number(platoSeleccionado.carbohidratos_g).toFixed(2))}g</Text>
                    <Text className="text-red-400 text-xs font-bold">Grasas: {parseFloat(Number(platoSeleccionado.grasas_g).toFixed(2))}g</Text>
                  </View>
                </View>

                <Text className="text-neutral-400 font-bold mb-4 uppercase tracking-wider">Alimentos detectados</Text>
                
                {(() => {
                  const ingredientes = parseIngredients(platoSeleccionado.ingredientes_json);
                  const gramosTotales = calculateNutritionTotals(ingredientes).grams;
                  return ingredientes.map((ing, idx) => {
                  const percentage = gramosTotales > 0 ? ((ing.gramos_totales / gramosTotales) * 100).toFixed(1) : 0;

                  return (
                    <View key={idx} className="bg-neutral-800 p-4 rounded-xl mb-3 border border-neutral-700">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center flex-1 pr-2">
                          <Text className="text-white font-bold text-lg capitalize mr-2" numberOfLines={1}>{ing.ingrediente}</Text>
                          <Text className="text-neutral-500 text-xs font-bold">({percentage}%)</Text>
                        </View>
                        <Text className="text-emerald-400 font-bold text-lg">{parseFloat(Number(ing.calorias_totales).toFixed(2))} kcal</Text>
                      </View>
                      <Text className="text-neutral-400 mb-2">{parseFloat(Number(ing.gramos_totales).toFixed(2))} gramos</Text>
                      <View className="flex-row justify-between mt-2 pt-2 border-t border-neutral-700">
                        <Text className="text-blue-400 text-xs">Proteína: {parseFloat(Number(ing.macronutrientes.proteinas_g).toFixed(2))}g</Text>
                        <Text className="text-yellow-400 text-xs">Carbohidratos: {parseFloat(Number(ing.macronutrientes.carbohidratos_g).toFixed(2))}g</Text>
                        <Text className="text-red-400 text-xs">Grasas: {parseFloat(Number(ing.macronutrientes.grasas_g).toFixed(2))}g</Text>
                      </View>
                    </View>
                  );
                  });
                })()}
                
                <TouchableOpacity className="mt-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex-row justify-center items-center" onPress={() => confirmarBorradoModal(platoSeleccionado)}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text className="text-red-500 font-bold ml-2">Eliminar plato del historial</Text>
                </TouchableOpacity>

                <View className="h-12" />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}