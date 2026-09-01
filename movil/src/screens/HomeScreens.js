import React, { useRef, useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet, ActivityIndicator, ScrollView, Keyboard, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { UserContext } from '../context/UserContext';
import { API_BASE_URL } from '../config/constants';

export function HomeScreen({ navigation }) {
  const { user, setUser } = useContext(UserContext); 
  const [resumen, setResumen] = useState(null);
  const [semana, setSemana] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarDatosDashboard();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarDatosDashboard = async () => {
    /*
      Hacemos las peticiones del resumen diario y semanal al mismo tiempo.
      Esto reduce la espera en la pantalla principal al no bloquear una peticion con la otra.
    */
    try {
      const localDate = new Date().toLocaleDateString('en-CA'); 
      
      const [resHoy, resSemana] = await Promise.all([
        fetch(`${API_BASE_URL}/resumen_hoy?fecha_local=${localDate}`, { headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' } }),
        fetch(`${API_BASE_URL}/resumen_semanal?fecha_local=${localDate}`, { headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' } })
      ]);

      if (resHoy.status === 401 || resSemana.status === 401) {
        setUser(null);
        return;
      }

      const dataHoy = await resHoy.json();
      const dataSemana = await resSemana.json();

      if (resHoy.ok) setResumen(dataHoy);
      if (resSemana.ok) setSemana(dataSemana.semana);

    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const porcentajeHoy = resumen ? Math.min((resumen.calorias_consumidas / resumen.meta_calorias) * 100, 100) : 0;
  
  const meta = resumen?.meta_calorias || 2000;
  
  /*
    Dividimos la meta calorica entre un decimal para que la linea objetivo quede al 75 por ciento de la altura.
    De esta forma queda espacio visual arriba por si el usuario se pasa de la meta.
  */
  const chartMax = meta > 0 ? meta / 0.75 : 2000; 

  return (
    <SafeAreaView className="flex-1 bg-neutral-900 pt-10">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mb-2">¡Hola, {user?.nombre?.split(" ")[0] || "Usuario"}!</Text>
        <Text className="text-neutral-400 mb-6">Tu resumen de hoy</Text>

        <View className="bg-neutral-800 p-6 rounded-3xl mb-8 border border-neutral-700 shadow-lg">
          {loading ? (
            <ActivityIndicator size="large" color="#10b981" className="my-6" />
          ) : (
            <View>
              <View className="flex-row justify-between items-end mb-2">
                <View>
                  <Text className="text-white text-4xl font-bold">{parseFloat(Number(resumen?.calorias_consumidas || 0).toFixed(2))}</Text>
                  <Text className="text-neutral-400 font-bold">kcal consumidas</Text>
                </View>
                <Text className="text-emerald-500 font-bold mb-1 text-lg">/ {parseFloat(Number(resumen?.meta_calorias || 2000).toFixed(2))}</Text>
              </View>

              <View className="h-4 bg-neutral-900 rounded-full w-full overflow-hidden mt-4 mb-6 border border-neutral-700">
                <Animated.View 
                  style={[
                    { height: '100%', borderRadius: 9999, width: `${porcentajeHoy}%` },
                    resumen?.calorias_consumidas > resumen?.meta_calorias ? { backgroundColor: '#ef4444' } : { backgroundColor: '#10b981' }
                  ]} 
                />
              </View>

              <View className="flex-row justify-between pt-4 border-t border-neutral-700/50">
                <View className="items-center">
                  <Text className="text-blue-400 font-bold mb-1">{parseFloat(Number(resumen?.proteinas_consumidas || 0).toFixed(2))}g</Text>
                  <Text className="text-neutral-500 text-xs">Proteína</Text>
                </View>
                <View className="items-center">
                  <Text className="text-yellow-400 font-bold mb-1">{parseFloat(Number(resumen?.carbohidratos_consumidas || 0).toFixed(2))}g</Text>
                  <Text className="text-neutral-500 text-xs">Carbos</Text>
                </View>
                <View className="items-center">
                  <Text className="text-red-400 font-bold mb-1">{parseFloat(Number(resumen?.grasas_consumidas || 0).toFixed(2))}g</Text>
                  <Text className="text-neutral-500 text-xs">Grasas</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <Text className="text-white text-xl font-bold mb-4">Tus últimos 7 días</Text>
        <View className="bg-neutral-800 p-6 rounded-3xl mb-8 border border-neutral-700 shadow-lg">
          {loading ? (
            <ActivityIndicator size="large" color="#10b981" className="my-6" />
          ) : (
            <View>
              <View className="flex-row justify-end mb-2">
                <Text className="text-neutral-400 text-[10px] font-bold">
                  Meta: {parseFloat(Number(meta).toFixed(2))} kcal
                </Text>
              </View>
              
              <View className="relative h-32 flex-row justify-between items-end">
                <View className="absolute w-full border-t border-dashed border-neutral-500 z-0" style={{ bottom: '75%' }} />

                {semana.map((dia, idx) => {
                  const isOver = dia.calorias > meta;
                  const fillPercent = meta > 0 && dia.calorias > 0 ? Math.min((dia.calorias / chartMax) * 100, 100) : 0;
                  
                  return (
                    <View key={`bar-${idx}`} className="w-8 h-full bg-neutral-900 rounded-lg justify-end overflow-hidden border border-neutral-700/50 z-10 mx-0.5">
                      <View 
                        style={[
                          { width: '100%', borderRadius: 8, height: `${fillPercent}%`, minHeight: dia.calorias > 0 ? 4 : 0 },
                          isOver ? { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 } : { backgroundColor: '#10b981' }
                        ]} 
                      />
                    </View>
                  );
                })}
              </View>

              <View className="flex-row justify-between items-center mt-3">
                {semana.map((dia, idx) => (
                  <Text key={`label-${idx}`} className={`text-[10px] font-bold w-8 text-center mx-0.5 ${idx === 6 ? 'text-emerald-500' : 'text-neutral-400'}`}>
                    {dia.dia_nombre}
                  </Text>
                ))}
              </View>

            </View>
          )}
        </View>

        <TouchableOpacity className="bg-emerald-600 p-5 rounded-2xl flex-row items-center justify-center shadow-lg mb-10" onPress={() => navigation.navigate('Camera')}>
          <Ionicons name="camera" size={28} color="#ffffff" />
          <Text className="text-white text-xl font-bold ml-3">Escanear comida</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

export function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  
  // Estado para evitar el doble toque rapido y que no se sature la ram del movil.
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#10b981" style={{ marginBottom: 24 }} />
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para escanear tus alimentos.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isTakingPhoto) {
      setIsTakingPhoto(true); 
      
      try {
        /*
          Quitamos la codificacion en base64 para evitar errores de memoria.
          Ademas usamos la maxima calidad y activamos los metadatos exif para conservar bien los detalles.
          El sensor a veces guarda la foto girada, asi que primero aplicamos la rotacion original.
          Luego calculamos el centro exacto para hacer el recorte cuadrado con numeros enteros y no salirnos de los bordes.
          Finalmente escalamos la imagen para que la ia reciba la textura con buena resolucion.
        */
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, exif: true });
        
        const orientacionCorregida = await manipulateAsync(photo.uri, [], { format: SaveFormat.JPEG });
        
        const width = orientacionCorregida.width;
        const height = orientacionCorregida.height;
        const minDim = Math.min(width, height);
        
        const cropSize = Math.floor(minDim * 0.8);
        let originX = Math.floor((width - cropSize) / 2);
        let originY = Math.floor((height - cropSize) / 2);
        
        originX = Math.max(0, Math.min(originX, width - cropSize));
        originY = Math.max(0, Math.min(originY, height - cropSize));
        
        const manipResult = await manipulateAsync(
          orientacionCorregida.uri,
          [{ crop: { originX, originY, width: cropSize, height: cropSize } }, { resize: { width: 800, height: 800 } }],
          { compress: 0.9, format: SaveFormat.JPEG } 
        );
        navigation.replace('Results', { photoUri: manipResult.uri });
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        Alert.alert("Error", "No se pudo capturar la foto. Inténtalo de nuevo.");
        setIsTakingPhoto(false); 
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" enableTorch={flash} ref={cameraRef} />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setFlash(!flash)}>
            <Ionicons name={flash ? "flash" : "flash-off"} size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.middleContainer}>
          <View style={styles.boundingBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={takePicture} disabled={isTakingPhoto} style={styles.captureButtonOuter}>
            {isTakingPhoto ? (
              <ActivityIndicator color="#10b981" size="large" /> 
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20 },
  iconButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 50 },
  middleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  boundingBox: { width: '80%', aspectRatio: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 24, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#10b981' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 24 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 24 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 24 },
  bottomBar: { alignItems: 'center', paddingBottom: 40 },
  captureButtonOuter: { width: 80, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 40, borderWidth: 4, borderColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 56, height: 56, backgroundColor: '#ffffff', borderRadius: 28 },
  permissionContainer: { flex: 1, backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionText: { color: 'white', textAlign: 'center', fontSize: 18, marginBottom: 32 },
  permissionButton: { backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 50 },
  permissionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export function ResultsScreen({ route, navigation }) {
  const { photoUri } = route.params || {};
  const { user, setUser } = useContext(UserContext); 
  const [loading, setLoading] = useState(true);
  const [iaResult, setIaResult] = useState(null);

  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editGrams, setEditGrams] = useState("");
  const [clasesDisponibles, setClasesDisponibles] = useState([]);

  useEffect(() => {
    if (photoUri) {
      analizarImagen();
      obtenerClasesOficiales();
    }
  }, [photoUri]);

  const analizarImagen = async () => {
    try {
      /*
        Usamos formdata para empaquetar la ruta de la foto local como un archivo binario.
        Es el formato necesario para que la api reciba y analice la imagen correctamente.
      */
      const formData = new FormData();
      formData.append('imagen', { uri: photoUri, name: 'plato.jpg', type: 'image/jpeg' });
      
      const response = await fetch(`${API_BASE_URL}/analizar_plato`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
      if (response.status === 401) {
        setUser(null);
        return;
      }
      const data = await response.json();
      
      if (data.agrupados) {
        data.agrupados.forEach(item => {
          if (item.gramos_totales > 5000) {
            // Limitamos la cantidad maxima a cinco kilos por seguridad y recalculamos todo en base a esa proporcion.
            const ratio = 5000 / item.gramos_totales;
            item.gramos_totales = 5000;
            item.calorias_totales = parseFloat(Number(item.calorias_totales * ratio).toFixed(2));
            item.macronutrientes.proteinas_g = parseFloat(Number(item.macronutrientes.proteinas_g * ratio).toFixed(2));
            item.macronutrientes.carbohidratos_g = parseFloat(Number(item.macronutrientes.carbohidratos_g * ratio).toFixed(2));
            item.macronutrientes.grasas_g = parseFloat(Number(item.macronutrientes.grasas_g * ratio).toFixed(2));
          }
        });
      }

      setIaResult(data); 
    } catch (error) {
      setIaResult({ error: "Error de red: FastAPI no responde." });
    } finally {
      setLoading(false); 
    }
  };

  const obtenerClasesOficiales = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clases_disponibles`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      const data = await res.json();
      if (data.status === 'éxito') setClasesDisponibles(data.clases);
    } catch (e) {
      console.error("Error obteniendo clases:", e);
    }
  };

  const handleGuardarPlato = async () => {
    try {
      let calcTotalKcal = 0; let calcTotalGramos = 0; let calcTotalProteinas = 0; let calcTotalCarbohidratos = 0; let calcTotalGrasas = 0;
      if (iaResult && iaResult.agrupados) {
        iaResult.agrupados.forEach(item => {
          calcTotalKcal += item.calorias_totales;
          calcTotalProteinas += item.macronutrientes.proteinas_g;
          calcTotalCarbohidratos += item.macronutrientes.carbohidratos_g;
          calcTotalGrasas += item.macronutrientes.grasas_g;
        });
      }

      // Forzamos la zona horaria local en la fecha para evitar desfases de horas al guardar en la base de datos.
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fechaLocalStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      await fetch(`${API_BASE_URL}/guardar_plato`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          imagen_id: iaResult.imagen_id,
          calorias_totales: parseFloat(Number(calcTotalKcal).toFixed(2)),
          proteinas_g: parseFloat(Number(calcTotalProteinas).toFixed(2)),
          carbohidratos_g: parseFloat(Number(calcTotalCarbohidratos).toFixed(2)),
          grasas_g: parseFloat(Number(calcTotalGrasas).toFixed(2)),
          ingredientes_json: JSON.stringify(iaResult.agrupados),
          fecha_local: fechaLocalStr
        })
      });
      navigation.popToTop(); 
    } catch (e) {
      console.error("Error al guardar plato:", e);
    }
  };

  const guardarCorreccion = async (index, finalName) => {
    /*
      Cuando el usuario modifica el peso estimado por la ia, sacamos la proporcion entre el peso viejo y el nuevo.
      Aplicamos esa misma proporcion a las calorias y los macronutrientes.
      Asi actualizamos los datos en la pantalla sin tener que volver a llamar a la api.
    */
    const item = iaResult.agrupados[index];
    const oldName = item.ingrediente;
    const oldGrams = item.gramos_totales;

    let newGrams = parseFloat(editGrams) || oldGrams;
    if (newGrams > 5000) newGrams = 5000;

    const newName = finalName || searchQuery || oldName;
    const ratio = newGrams / oldGrams;
    
    const updated = { ...iaResult };
    const updatedItem = updated.agrupados[index];
    
    updatedItem.ingrediente = newName;
    updatedItem.gramos_totales = parseFloat(Number(newGrams).toFixed(2));
    updatedItem.calorias_totales = parseFloat(Number(updatedItem.calorias_totales * ratio).toFixed(2));
    updatedItem.macronutrientes.proteinas_g = parseFloat(Number(updatedItem.macronutrientes.proteinas_g * ratio).toFixed(2));
    updatedItem.macronutrientes.carbohidratos_g = parseFloat(Number(updatedItem.macronutrientes.carbohidratos_g * ratio).toFixed(2));
    updatedItem.macronutrientes.grasas_g = parseFloat(Number(updatedItem.macronutrientes.grasas_g * ratio).toFixed(2));

    const cajasAsociadas = iaResult.detalles.filter(d => d.ingrediente === oldName).map(d => d.coordenadas_caja);

    setIaResult(updated);
    setEditingIndex(null);
    setSearchQuery("");

    try {
      const res = await fetch(`${API_BASE_URL}/corregir_prediccion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          imagen_id: updated.imagen_id || "sin-id", etiqueta_ia: oldName, etiqueta_usuario: newName,
          gramos_ia: oldGrams, gramos_usuario: newGrams, coordenadas_cajas: cajasAsociadas
        })
      });
      if (res.status === 401) { setUser(null); }
    } catch (e) {
      console.error("Error al enviar corrección:", e);
    }
  };

  const filteredClasses = searchQuery.trim() === "" 
    ? [] 
    : clasesDisponibles.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()) && c.toLowerCase() !== searchQuery.toLowerCase()).slice(0, 5);

  let calcTotalKcal = 0; let calcTotalGramos = 0; let calcTotalProteinas = 0; let calcTotalCarbohidratos = 0; let calcTotalGrasas = 0;
  if (iaResult && iaResult.agrupados) {
    iaResult.agrupados.forEach(item => {
      calcTotalKcal += item.calorias_totales; calcTotalGramos += item.gramos_totales;
      calcTotalProteinas += item.macronutrientes.proteinas_g; calcTotalCarbohidratos += item.macronutrientes.carbohidratos_g; calcTotalGrasas += item.macronutrientes.grasas_g;
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900 pt-10">
      <View className="flex-row justify-between items-center px-6 mb-6">
        <Text className="text-white text-3xl font-bold">Resultados</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {photoUri && <Image source={{ uri: photoUri }} style={{ width: '100%', height: 250, borderRadius: 16, marginBottom: 20 }} resizeMode="cover" />}
        <View className="w-full bg-neutral-800 p-6 rounded-2xl border border-neutral-700 min-h-[120px] justify-center mb-6">
          {loading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-emerald-500 mt-4 font-semibold text-lg text-center">Analizando con IA...</Text>
            </View>
          ) : iaResult?.error ? (
            <Text className="text-red-400 text-center font-bold text-lg">{iaResult.error}</Text>
          ) : iaResult?.agrupados?.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="scan-circle-outline" size={64} color="#9ca3af" />
              <Text className="text-white text-2xl font-bold mt-4 mb-2 text-center">¡No veo comida!</Text>
            </View>
          ) : (
            <View>
              <View className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-xl font-bold">Total del plato</Text>
                  <View className="bg-emerald-500/20 px-4 py-2 rounded-lg">
                    <Text className="text-emerald-400 font-bold text-lg">{parseFloat(Number(calcTotalKcal).toFixed(2))} kcal</Text>
                  </View>
                </View>
                <View className="flex-row justify-between pt-3 border-t border-neutral-700/50">
                  <Text className="text-blue-400 text-xs font-bold">Proteína: {parseFloat(Number(calcTotalProteinas).toFixed(2))}g</Text>
                  <Text className="text-yellow-400 text-xs font-bold">Carbohidratos: {parseFloat(Number(calcTotalCarbohidratos).toFixed(2))}g</Text>
                  <Text className="text-red-400 text-xs font-bold">Grasas: {parseFloat(Number(calcTotalGrasas).toFixed(2))}g</Text>
                </View>
              </View>

              <Text className="text-neutral-400 font-bold mb-4 uppercase tracking-wider">Alimentos detectados</Text>
              
              {iaResult?.agrupados?.map((item, index) => {
                const percentage = calcTotalGramos > 0 ? ((item.gramos_totales / calcTotalGramos) * 100).toFixed(1) : 0;
                return (
                  <View key={index} className="bg-neutral-900 p-4 rounded-xl mb-3 border border-neutral-700 z-10">
                    {editingIndex === index ? (
                      <View className="mb-2">
                        <Text className="text-emerald-500 text-xs font-bold uppercase mb-2">Busca el alimento correcto:</Text>
                        <TextInput value={searchQuery} onChangeText={setSearchQuery} className="bg-neutral-800 border border-emerald-500 text-white px-3 py-2 rounded-lg w-full mb-1" placeholder="Escribe (ej: po)..." placeholderTextColor="#9ca3af" />
                        {filteredClasses.length > 0 && (
                          <View className="bg-neutral-800 border border-neutral-700 rounded-lg mb-3 overflow-hidden">
                            {filteredClasses.map((cls, cIdx) => (
                              <TouchableOpacity key={cIdx} className="p-2.5 border-b border-neutral-700/50 active:bg-emerald-600/20" onPress={() => { setSearchQuery(cls); Keyboard.dismiss(); }}>
                                <Text className="text-white capitalize font-medium">{cls}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                        <Text className="text-neutral-400 text-xs font-bold uppercase mb-1 mt-2">Peso en gramos:</Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <TextInput value={editGrams} onChangeText={setEditGrams} keyboardType="numeric" maxLength={4} className="bg-neutral-800 border border-emerald-500 text-white px-3 py-2 rounded-lg w-20 text-center" />
                            <Text className="text-neutral-400 ml-2 font-bold">g</Text>
                          </View>
                          <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => setEditingIndex(null)} className="mr-4"><Text className="text-neutral-400 font-bold">Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => guardarCorreccion(index, searchQuery)} className="bg-emerald-600 px-4 py-2 rounded-lg"><Text className="text-white font-bold">Guardar</Text></TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-row items-center flex-1 pr-2">
                            <Text className="text-white font-bold text-lg capitalize mr-2" numberOfLines={1}>{item.ingrediente}</Text>
                            <Text className="text-neutral-500 text-xs font-bold mr-2">({percentage}%)</Text>
                            <TouchableOpacity onPress={() => { setEditingIndex(index); setSearchQuery(item.ingrediente); setEditGrams(String(item.gramos_totales)); }} className="bg-neutral-800 p-1.5 rounded-full border border-neutral-700">
                              <Ionicons name="pencil" size={14} color="#10b981" />
                            </TouchableOpacity>
                          </View>
                          <Text className="text-emerald-400 font-bold text-lg">{parseFloat(Number(item.calorias_totales).toFixed(2))} kcal</Text>
                        </View>
                        <Text className="text-neutral-400 mb-2">{parseFloat(Number(item.gramos_totales).toFixed(2))} gramos</Text>
                        <View className="flex-row justify-between mt-2 pt-2 border-t border-neutral-800">
                          <Text className="text-blue-400 text-xs">Proteína: {parseFloat(Number(item.macronutrientes.proteinas_g).toFixed(2))}g</Text>
                          <Text className="text-yellow-400 text-xs">Carbohidratos: {parseFloat(Number(item.macronutrientes.carbohidratos_g).toFixed(2))}g</Text>
                          <Text className="text-red-400 text-xs">Grasas: {parseFloat(Number(item.macronutrientes.grasas_g).toFixed(2))}g</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
              
              <View className="mt-6 flex-row items-start bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50 mb-2">
                <Ionicons name="information-circle-outline" size={20} color="#9ca3af" style={{ marginTop: 2, marginRight: 8 }} />
                <Text className="text-neutral-400 text-xs flex-1 leading-4">
                  Estimación realizada mediante inteligencia artificial. El alimento, la cantidad y los valores nutricionales detectados pueden contener errores. Verifica la información antes de utilizarla.
                </Text>
              </View>

            </View>
          )}
        </View>
      </ScrollView>

      {!loading && !iaResult?.error && (
        <View className="px-6 pb-6 pt-2 bg-neutral-900 flex-row space-x-3">
          <TouchableOpacity className="flex-1 bg-red-500/10 border border-red-500/50 p-4 rounded-xl items-center" onPress={() => navigation.popToTop()}>
            <Text className="text-red-500 font-bold text-base">Descartar</Text>
          </TouchableOpacity>
          <View className="w-3" />
          <TouchableOpacity className="flex-1 bg-emerald-600 p-4 rounded-xl items-center" onPress={handleGuardarPlato}>
            <Text className="text-white font-bold text-base">Guardar Plato</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}