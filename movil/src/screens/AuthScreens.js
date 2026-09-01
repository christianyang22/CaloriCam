import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { CustomAlert } from '../components/CustomAlert';
import { API_BASE_URL, regexSoloLetras } from '../config/constants';

export function LoginScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", onConfirm: null });

  const isFormValid = email.includes("@") && password.length > 0;

  const handleLogin = async () => {
    setLoading(true);
    Keyboard.dismiss(); 
    
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ email: email.trim(), password: password })
      });
      
      let data;
      try { 
        data = await res.json(); 
      } catch (e) { 
        setLoading(false);
        return setAlert({ visible: true, title: "Error del servidor", message: "El servidor no responde. Inténtalo más tarde." });
      }
      
      if (res.ok) {
        /*
          Actualización del estado global tras autenticación exitosa.
          Al inyectar el token jwt y los datos del perfil en el contexto,
          el enrutador principal detecta el cambio de estado
          y redirige automáticamente al usuario al flujo principal de la aplicación.
        */
        setUser({ 
            id: data.usuario_id, nombre: data.nombre, email: data.email, token: data.token, 
            avatar_id: data.avatar_id, onboarding_completado: data.onboarding_completado, meta_calorias: data.meta_calorias,
            peso_kg: data.peso_kg, altura_cm: data.altura_cm, edad: data.edad, genero: data.genero, objetivo: data.objetivo
        });
      } else {
        const errorMessage = Array.isArray(data.detail) ? "Formato de datos incorrecto." : (data.detail || "Credenciales incorrectas.");
        setAlert({ visible: true, title: "Acceso denegado", message: errorMessage });
      }
    } catch (e) {
      setAlert({ visible: true, title: "Sin conexión", message: "No se pudo conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-neutral-900 justify-center px-8">
        <CustomAlert {...alert} onClose={() => setAlert({ ...alert, visible: false })} />
        <View className="items-center mb-12">
          <Ionicons name="leaf" size={48} color="#10b981" className="mb-4" />
          <Text className="text-emerald-500 text-4xl font-bold text-center">CaloriCam</Text>
          <Text className="text-neutral-400 text-center mt-2">Estimación inteligente de alimentos</Text>
        </View>
        <View className="space-y-4 mb-8">
          <TextInput placeholder="Correo electrónico" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} onSubmitEditing={Keyboard.dismiss} className="bg-neutral-800 text-white p-4 rounded-xl border border-neutral-700 mb-4" />
          <View className="bg-neutral-800 rounded-xl border border-neutral-700 flex-row items-center px-4">
            <TextInput placeholder="Contraseña" secureTextEntry={!showPassword} placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} onSubmitEditing={Keyboard.dismiss} className="text-white py-4 flex-1" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity className={`p-4 rounded-xl items-center shadow-lg mb-6 flex-row justify-center ${isFormValid ? 'bg-emerald-600' : 'bg-neutral-800 border border-neutral-700'}`} onPress={handleLogin} disabled={loading || !isFormValid}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text className={`font-bold text-lg ${isFormValid ? 'text-white' : 'text-neutral-500'}`}>Iniciar Sesión</Text>}
        </TouchableOpacity>
        <View className="flex-row justify-center mt-4">
          <Text className="text-neutral-400">¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-emerald-500 font-bold">Regístrate</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export function RegisterScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [modalTerminos, setModalTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", onConfirm: null });

  /*
    Validación de complejidad de contraseña en el lado del cliente.
    se utilizan expresiones regulares para garantizar un mínimo de 8 caracteres,
    uso de mayúsculas, minúsculas, números y caracteres especiales.
    esto previene el envío de peticiones inseguras o inválidas al backend.
  */
  const isLengthValid = password.length >= 8;
  const hasUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password); 
  const isPasswordStrong = isLengthValid && hasUpperLower && hasNumber && hasSpecialChar;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  
  const isNombreValid = nombre.trim() !== "" && regexSoloLetras.test(nombre);
  const isApellidosValid = apellidos.trim() !== "" && regexSoloLetras.test(apellidos);
  const isFormValid = isNombreValid && isApellidosValid && email.includes("@") && isPasswordStrong && passwordsMatch && terminos;

  const handleRegister = async () => {
    setLoading(true);
    Keyboard.dismiss();
    const nombreCompleto = `${nombre.trim()} ${apellidos.trim()}`;
    
    try {
      const res = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ nombre: nombreCompleto, email: email.trim(), password: password, terminos_aceptados: terminos })
      });
      
      let data;
      try { 
        data = await res.json(); 
      } catch (e) { 
        setLoading(false); 
        return setAlert({ visible: true, title: "Error de Servidor", message: "El servidor no respondió correctamente." });
      }
      
      if (res.ok) {
        setAlert({ 
          visible: true, 
          title: "¡Éxito!", 
          message: "Tu cuenta ha sido creada correctamente.",
          onConfirm: () => setUser({ id: data.usuario_id, nombre: nombreCompleto, email: email.trim(), token: data.token, avatar_id: null, onboarding_completado: false }) 
        });
      } else {
        const errorMessage = Array.isArray(data.detail) ? "Comprueba que el correo sea válido." : (data.detail || "El correo ya existe.");
        setAlert({ visible: true, title: "No se pudo registrar", message: errorMessage });
      }
    } catch (e) {
      setAlert({ visible: true, title: "Sin red", message: "No se pudo conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <CustomAlert {...alert} onClose={() => setAlert({ ...alert, visible: false })} confirmText={alert.title === "¡Éxito!" ? "Entrar" : "Entendido"} />

      <Modal visible={modalTerminos} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-neutral-900">
          <View className="px-6 pt-4 pb-4 border-b border-neutral-800 flex-row justify-between items-center">
            <Text className="text-white text-2xl font-bold">Privacidad y Legal</Text>
            <TouchableOpacity onPress={() => setModalTerminos(false)} className="bg-neutral-800 p-2 rounded-full">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <ScrollView className="px-6 pt-6">
            <Text className="text-white font-bold text-lg mb-2">1. Uso de IA y Privacidad</Text>
            <Text className="text-neutral-400 mb-6 leading-6">CaloriCam utiliza inteligencia artificial para estimar las calorías de tus platos. Las fotografías enviadas a nuestros servidores podrán ser almacenadas de forma anonimizada.</Text>
            <Text className="text-white font-bold text-lg mb-2">2. Limitación de Responsabilidad</Text>
            <Text className="text-neutral-400 mb-6 leading-6">Las estimaciones y objetivos mostrados por la aplicación son únicamente orientativos y tienen fines informativos y de bienestar. No constituyen diagnóstico, tratamiento ni asesoramiento médico o nutricional profesional.</Text>
            <Text className="text-white font-bold text-lg mb-2">3. Derecho al olvido (RGPD)</Text>
            <Text className="text-neutral-400 mb-10 leading-6">De acuerdo con la legislación vigente, puedes eliminar tu cuenta y todo tu historial de alimentos en cualquier momento desde los Ajustes.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View className="px-8 pt-12 pb-4 flex-row items-center">
        <TouchableOpacity className="p-2 bg-neutral-800 rounded-full mr-4" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-3xl font-bold">Crear cuenta</Text>
          <Text className="text-neutral-400 text-sm">Únete y conoce tus platos</Text>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40 }}>
        <View className="space-y-4 mb-6 mt-4">
          <View className="flex-row justify-between mb-4">
            <TextInput placeholder="Nombre" placeholderTextColor="#9ca3af" value={nombre} onChangeText={setNombre} onSubmitEditing={Keyboard.dismiss} className="bg-neutral-800 text-white p-4 rounded-xl border border-neutral-700 flex-1 mr-2" />
            <TextInput placeholder="Apellidos" placeholderTextColor="#9ca3af" value={apellidos} onChangeText={setApellidos} onSubmitEditing={Keyboard.dismiss} className="bg-neutral-800 text-white p-4 rounded-xl border border-neutral-700 flex-1 ml-2" />
          </View>
          {nombre.length > 0 && !isNombreValid && <Text className="text-red-500 text-xs ml-2 -mt-3">El nombre solo puede contener letras.</Text>}
          {apellidos.length > 0 && !isApellidosValid && <Text className="text-red-500 text-xs ml-2 -mt-3">Los apellidos solo pueden contener letras.</Text>}

          <TextInput placeholder="Correo electrónico" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} onSubmitEditing={Keyboard.dismiss} className="bg-neutral-800 text-white p-4 rounded-xl border border-neutral-700 mb-4" />
          
          <View className="bg-neutral-800 rounded-xl border border-neutral-700 flex-row items-center px-4 mb-2">
            <TextInput placeholder="Contraseña" secureTextEntry={!showPassword} placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} onSubmitEditing={Keyboard.dismiss} className="text-white py-4 flex-1" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="mb-4 pl-2">
            <View className="flex-row items-center"><Ionicons name={isLengthValid ? "checkmark-circle" : "close-circle"} size={16} color={isLengthValid ? "#10b981" : "#ef4444"} /><Text className={`text-xs ml-2 ${isLengthValid ? 'text-emerald-500' : 'text-neutral-500'}`}>Mínimo 8 caracteres</Text></View>
            <View className="flex-row items-center mt-1"><Ionicons name={hasUpperLower ? "checkmark-circle" : "close-circle"} size={16} color={hasUpperLower ? "#10b981" : "#ef4444"} /><Text className={`text-xs ml-2 ${hasUpperLower ? 'text-emerald-500' : 'text-neutral-500'}`}>Mayúscula y minúscula</Text></View>
            <View className="flex-row items-center mt-1"><Ionicons name={hasNumber ? "checkmark-circle" : "close-circle"} size={16} color={hasNumber ? "#10b981" : "#ef4444"} /><Text className={`text-xs ml-2 ${hasNumber ? 'text-emerald-500' : 'text-neutral-500'}`}>Al menos un número</Text></View>
            <View className="flex-row items-center mt-1"><Ionicons name={hasSpecialChar ? "checkmark-circle" : "close-circle"} size={16} color={hasSpecialChar ? "#10b981" : "#ef4444"} /><Text className={`text-xs ml-2 ${hasSpecialChar ? 'text-emerald-500' : 'text-neutral-500'}`}>Carácter especial (ej: _, !, @)</Text></View>
          </View>

          <View className={`bg-neutral-800 rounded-xl border ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500' : 'border-neutral-700'} flex-row items-center px-4 mb-1`}>
            <TextInput placeholder="Confirmar contraseña" secureTextEntry={!showConfirmPassword} placeholderTextColor="#9ca3af" value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={Keyboard.dismiss} className="text-white py-4 flex-1" />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2"><Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" /></TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text className="text-red-500 text-xs ml-2 mb-2 font-bold mt-1">Las contraseñas no coinciden.</Text>
          )}
          
          <View className="flex-row items-center mt-4 mb-2 pr-4">
            <TouchableOpacity onPress={() => setTerminos(!terminos)}>
              <Ionicons name={terminos ? "checkbox" : "square-outline"} size={24} color={terminos ? "#10b981" : "#9ca3af"} />
            </TouchableOpacity>
            <Text className="text-neutral-400 ml-3 flex-1 text-xs leading-5">
              He leído y acepto los <Text onPress={() => setModalTerminos(true)} className="text-emerald-500 font-bold underline">Términos, Ley de IA y Privacidad</Text>.
            </Text>
          </View>
        </View>

        <TouchableOpacity className={`p-4 rounded-xl items-center shadow-lg flex-row justify-center mt-4 ${isFormValid ? 'bg-emerald-600' : 'bg-neutral-800 border border-neutral-700'}`} onPress={handleRegister} disabled={loading || !isFormValid}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text className={`font-bold text-lg ${isFormValid ? 'text-white' : 'text-neutral-500'}`}>Registrarse</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export function OnboardingScreen() {
  const { user, setUser } = useContext(UserContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [genero, setGenero] = useState(user?.genero || "");
  const [edad, setEdad] = useState(user?.edad ? String(user.edad) : "");
  const [peso, setPeso] = useState(user?.peso_kg ? String(user.peso_kg) : "");
  const [altura, setAltura] = useState(user?.altura_cm ? String(user.altura_cm) : "");
  const [objetivo, setObjetivo] = useState(user?.objetivo || "");

  const handleSiguiente = () => {
    if (step === 1) {
      if (!genero) return Alert.alert("Aviso", "Por favor, selecciona tu género biológico para el cálculo.");
      const e = parseInt(edad);
      if (!e || e < 10 || e > 120) return Alert.alert("Aviso", "Introduce una edad válida (entre 10 y 120 años).");
    }
    if (step === 2) {
      const p = parseFloat(peso);
      if (!p || p < 20 || p > 300) return Alert.alert("Aviso", "Introduce un peso válido (entre 20 y 300 kg).");
      const a = parseInt(altura);
      if (!a || a < 50 || a > 250) return Alert.alert("Aviso", "Introduce una altura válida (entre 50 y 250 cm).");
    }
    if (step === 3 && !objetivo) return Alert.alert("Faltan datos", "Por favor, selecciona tu objetivo.");
    
    setStep(step + 1);
  };

  const calcularYGuardarPerfil = async () => {
    setLoading(true);
    let tmb = 0;
    const p = parseFloat(peso);
    const a = parseInt(altura);
    const e = parseInt(edad);

    /*
      Cálculo de la tasa metabólica basal mediante la ecuación de harris benedict.
      Es el modelo matemático estándar para estimar el gasto energético en reposo
      utilizando parámetros biométricos básicos (peso, altura, edad y género biológico).
    */
    if (genero === "Hombre") {
      tmb = 88.362 + (13.397 * p) + (4.799 * a) - (5.677 * e);
    } else {
      tmb = 447.593 + (9.247 * p) + (3.098 * a) - (4.330 * e);
    }

    /*
      Ajuste de la meta calórica.
      Se aplica un factor de actividad física genérico (correspondiente
      a un estilo de vida sedentario o de actividad ligera). Posteriormente,
      se suma o resta un margen de 500 kcal según el objetivo de peso del usuario
      para asegurar un superávit o déficit calórico progresivo y seguro.
    */
    let metaCalorias = tmb * 1.2;
    if (objetivo === "perder") metaCalorias -= 500;
    if (objetivo === "ganar") metaCalorias += 500;
    metaCalorias = Math.round(metaCalorias);

    try {
      const res = await fetch(`${API_BASE_URL}/actualizar_perfil`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`, 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ nombre: user.nombre, peso_kg: p, altura_cm: a, edad: e, genero: genero, objetivo: objetivo, meta_calorias: metaCalorias })
      });

      if (res.status === 401) {
        setUser(null);
        return;
      }

      if (res.ok) {
        setUser({ ...user, onboarding_completado: true, meta_calorias: metaCalorias, peso_kg: p, altura_cm: a, edad: e, genero: genero, objetivo: objetivo });
      } else {
        Alert.alert("Error", "No se pudo guardar el perfil.");
      }
    } catch (err) {
      Alert.alert("Sin red", "Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 px-8 pt-10">
          <View className="flex-row mb-8">
            {[1, 2, 3, 4].map(i => (
              <View key={i} className={`flex-1 h-1.5 mx-1 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 1 && (
              <View className="mt-4">
                <Text className="text-white text-3xl font-bold mb-2">Empecemos</Text>
                <Text className="text-neutral-400 mb-8">Para personalizar tus cálculos, necesitamos conocerte un poco mejor.</Text>
                
                <Text className="text-neutral-400 font-bold mb-2">GÉNERO (Biológico para cálculo TMB)</Text>
                <View className="flex-row space-x-4 mb-6">
                  <TouchableOpacity className={`flex-1 p-4 rounded-xl border ${genero === 'Hombre' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`} onPress={() => setGenero('Hombre')}>
                    <Text className={`text-center font-bold ${genero === 'Hombre' ? 'text-emerald-500' : 'text-white'}`}>Hombre</Text>
                  </TouchableOpacity>
                  <View className="w-4" />
                  <TouchableOpacity className={`flex-1 p-4 rounded-xl border ${genero === 'Mujer' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`} onPress={() => setGenero('Mujer')}>
                    <Text className={`text-center font-bold ${genero === 'Mujer' ? 'text-emerald-500' : 'text-white'}`}>Mujer</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-neutral-400 font-bold mb-2 mt-4">EDAD (Años)</Text>
                <TextInput 
                  placeholder="Ej: 25" placeholderTextColor="#9ca3af" keyboardType="numeric" maxLength={3} value={edad} onChangeText={setEdad}
                  className="bg-neutral-800 text-white text-lg p-4 rounded-xl border border-neutral-700" 
                />
              </View>
            )}

            {step === 2 && (
              <View className="mt-4">
                <Text className="text-white text-3xl font-bold mb-2">Tu Biometría</Text>
                <Text className="text-neutral-400 mb-8">Estos datos son clave para la IA.</Text>
                
                <Text className="text-neutral-400 font-bold mb-2">PESO (Kg)</Text>
                <TextInput 
                  placeholder="Ej: 70.5" placeholderTextColor="#9ca3af" keyboardType="numeric" maxLength={5} value={peso} onChangeText={setPeso}
                  className="bg-neutral-800 text-white text-lg p-4 rounded-xl border border-neutral-700 mb-6" 
                />

                <Text className="text-neutral-400 font-bold mb-2">ALTURA (Cm)</Text>
                <TextInput 
                  placeholder="Ej: 175" placeholderTextColor="#9ca3af" keyboardType="numeric" maxLength={3} value={altura} onChangeText={setAltura}
                  className="bg-neutral-800 text-white text-lg p-4 rounded-xl border border-neutral-700" 
                />
              </View>
            )}

            {step === 3 && (
              <View className="mt-4">
                <Text className="text-white text-3xl font-bold mb-2">Tu Objetivo</Text>
                <Text className="text-neutral-400 mb-8">¿Qué quieres conseguir con CaloriCam?</Text>
                
                <TouchableOpacity className={`p-4 rounded-xl border mb-4 ${objetivo === 'perder' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`} onPress={() => setObjetivo('perder')}>
                  <Text className={`font-bold text-lg ${objetivo === 'perder' ? 'text-emerald-500' : 'text-white'}`}>Perder peso</Text>
                  <Text className="text-neutral-400 text-sm mt-1">Déficit calórico moderado.</Text>
                </TouchableOpacity>

                <TouchableOpacity className={`p-4 rounded-xl border mb-4 ${objetivo === 'mantener' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`} onPress={() => setObjetivo('mantener')}>
                  <Text className={`font-bold text-lg ${objetivo === 'mantener' ? 'text-emerald-500' : 'text-white'}`}>Mantener peso</Text>
                  <Text className="text-neutral-400 text-sm mt-1">Equilibrio calórico.</Text>
                </TouchableOpacity>

                <TouchableOpacity className={`p-4 rounded-xl border ${objetivo === 'ganar' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`} onPress={() => setObjetivo('ganar')}>
                  <Text className={`font-bold text-lg ${objetivo === 'ganar' ? 'text-emerald-500' : 'text-white'}`}>Ganar masa muscular</Text>
                  <Text className="text-neutral-400 text-sm mt-1">Superávit calórico controlado.</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 4 && (
              <View className="mt-4">
                <Ionicons name="shield-checkmark" size={64} color="#10b981" className="mb-4" />
                <Text className="text-white text-3xl font-bold mb-4">Aviso Importante</Text>
                
                <View className="bg-neutral-800 p-5 rounded-2xl border border-neutral-700">
                  <Text className="text-neutral-300 text-base leading-6 text-justify">
                    Las estimaciones y objetivos mostrados por la aplicación son únicamente orientativos y tienen fines informativos y de bienestar. No constituyen diagnóstico, tratamiento ni asesoramiento médico o nutricional profesional. Para recomendaciones adaptadas a tu estado de salud, consulta con un profesional sanitario cualificado.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View className="py-6">
            {step < 4 ? (
              <TouchableOpacity className="bg-emerald-600 p-4 rounded-xl items-center shadow-lg" onPress={handleSiguiente}>
                <Text className="text-white font-bold text-lg">Siguiente</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="bg-emerald-600 p-4 rounded-xl items-center shadow-lg flex-row justify-center" onPress={calcularYGuardarPerfil} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-lg">Entendido y Acepto</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}