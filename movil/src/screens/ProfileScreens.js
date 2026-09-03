import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import { UserContext } from '../context/UserContext';
import { CustomAlert } from '../components/CustomAlert';
import { API_BASE_URL } from '../config/constants';
import { calculateCalorieGoal } from '../utils/nutrition';
import { isStrongPassword, isValidEmail, isValidName, validatePassword } from '../utils/validation';

export function ProfileMainScreen({ navigation }) {
  const { user, setUser } = useContext(UserContext); 

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.5,
    });
    
    if (!result.canceled) {
      /*
        Se emplea formdata para empaquetar la uri del archivo local y enviarlo como 'multipart/form-data'.
        Este es el estándar necesario para transmitir archivos binarios desde el frontend móvil hacia la api.
      */
      const formData = new FormData();
      formData.append('imagen', { uri: result.assets[0].uri, name: 'avatar.jpg', type: 'image/jpeg' });
      
      try {
        const res = await fetch(`${API_BASE_URL}/subir_avatar`, {
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' }, 
          body: formData
        });
        
        if (res.status === 401) { 
          setUser(null); 
          return; 
        }
        
        const data = await res.json();
        if (res.ok) {
           const updatedUser = { ...user, avatar_id: data.avatar_id };
           setUser(updatedUser);
        }
      } catch (e) { 
        Alert.alert("Error", "No se pudo subir la foto."); 
      }
    }
  };

  const handleLogout = () => {
    setUser(null); 
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 pt-10 pb-4 border-b border-neutral-800">
        <Text className="text-white text-3xl font-bold">Mi Perfil</Text>
      </View>
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="bg-neutral-800 p-6 rounded-3xl items-center border border-neutral-700 mb-8 shadow-lg">
          <TouchableOpacity onPress={pickImage} className="w-28 h-28 bg-emerald-500/10 rounded-full items-center justify-center border-4 border-emerald-500 mb-4 shadow-xl overflow-hidden">
            {user?.avatar_id ? (
              <Image source={{ uri: `${API_BASE_URL}/avatares/${user.avatar_id}.jpg` }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={48} color="#10b981" />
            )}
            <View className="absolute bottom-0 w-full bg-black/50 py-1 items-center">
              <Text className="text-white text-[10px] font-bold">Editar</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">{user?.nombre || "Usuario"}</Text>
          <Text className="text-emerald-400 mt-1">{user?.email || "correo@ejemplo.com"}</Text>
        </View>
        <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Configuración</Text>
        <View className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden mb-8">
          <TouchableOpacity className="p-4 flex-row items-center border-b border-neutral-700/50" onPress={() => navigation.navigate('PerfilAjustes')}>
            <View className="bg-emerald-500/20 p-2 rounded-lg mr-4">
              <Ionicons name="person-outline" size={22} color="#10b981" />
            </View>
            <Text className="text-white text-lg flex-1">Ajustes de perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center border-b border-neutral-700/50" onPress={() => navigation.navigate('PrivacidadSeguridad')}>
            <View className="bg-blue-500/20 p-2 rounded-lg mr-4">
              <Ionicons name="shield-checkmark-outline" size={22} color="#60a5fa" />
            </View>
            <Text className="text-white text-lg flex-1">Privacidad y Seguridad</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center" onPress={() => navigation.navigate('Terminos')}>
            <View className="bg-purple-500/20 p-2 rounded-lg mr-4">
              <Ionicons name="document-text-outline" size={22} color="#c084fc" />
            </View>
            <Text className="text-white text-lg flex-1">Términos y Condiciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

        </View>
        <TouchableOpacity className="bg-neutral-800 border border-neutral-700 p-4 rounded-2xl flex-row justify-center items-center mb-10" onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="text-red-500 font-bold text-lg ml-2">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export function PerfilAjustesScreen({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  
  const getInitialNames = () => {
    if (!user?.nombre) return { n: "", a: "" };
    const parts = user.nombre.trim().split(" ");
    if (parts.length === 1) return { n: parts[0], a: "" };
    return { n: parts[0], a: parts.slice(1).join(" ") };
  };
  
  const { n, a } = getInitialNames();
  const [nombre, setNombre] = useState(n);
  const [apellidos, setApellidos] = useState(a);
  
  const [peso, setPeso] = useState(user?.peso_kg ? String(user.peso_kg) : "");
  const [altura, setAltura] = useState(user?.altura_cm ? String(user.altura_cm) : "");
  const [edad, setEdad] = useState(user?.edad ? String(user.edad) : "");
  const [genero, setGenero] = useState(user?.genero || "Hombre");
  
  const isPersonalizado = !['perder', 'mantener', 'ganar'].includes(user?.objetivo);
  const [objetivo, setObjetivo] = useState(isPersonalizado ? 'personalizado' : (user?.objetivo || "mantener"));
  const [metaManual, setMetaManual] = useState(user?.meta_calorias ? String(user.meta_calorias) : "");
  
  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });

  const handleGuardarCambios = async () => {
    const p = parseFloat(peso);
    const a_cm = parseInt(altura);
    const e = parseInt(edad);
    let metaCalorias = 0;

    const nombreCompleto = `${nombre.trim()} ${apellidos.trim()}`;

    if (!isValidName(nombre)) {
      return setAlert({visible: true, title: "Aviso", message: "El nombre no puede estar vacío y solo puede contener letras."});
    }
    if (!isValidName(apellidos, false)) {
      return setAlert({visible: true, title: "Aviso", message: "Los apellidos solo pueden contener letras."});
    }

    if (!p || p < 20 || p > 300) return setAlert({visible: true, title: "Aviso", message: "Introduce un peso válido (20-300 kg)."});
    if (!a_cm || a_cm < 50 || a_cm > 250) return setAlert({visible: true, title: "Aviso", message: "Introduce una altura válida (50-250 cm)."});
    if (!e || e < 10 || e > 120) return setAlert({visible: true, title: "Aviso", message: "Introduce una edad válida (10-120 años)."});

    /*
      Cálculo de la tasa metabólica basal.
      Se recalcula el objetivo calórico siempre que el usuario no haya
      especificado una meta manual. Se utiliza la fórmula estándar de harris benedict.
    */
    if (objetivo === 'personalizado') {
      metaCalorias = parseInt(metaManual);
      if (!metaCalorias || metaCalorias < 500) {
        return setAlert({ visible: true, title: "Aviso", message: "Introduce un valor válido de calorías para tu meta." });
      }
    } else {
      metaCalorias = calculateCalorieGoal({ gender: genero, weight: p, height: a_cm, age: e, objective: objetivo });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/actualizar_perfil`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ nombre: nombreCompleto, peso_kg: p, altura_cm: a_cm, edad: e, genero: genero, objetivo: objetivo, meta_calorias: metaCalorias })
      });
      if (res.status === 401) { setUser(null); return; }
      if (res.ok) {
        setUser({ ...user, nombre: nombreCompleto, peso_kg: p, altura_cm: a_cm, edad: e, genero: genero, objetivo: objetivo, meta_calorias: metaCalorias });
        setAlert({ visible: true, title: "¡Éxito!", message: "Ajustes de perfil guardados.", variant: "success" });
      }
    } catch (err) {
      setAlert({ visible: true, title: "Sin red", message: "Error de conexión." });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <CustomAlert {...alert} onClose={() => setAlert({ ...alert, visible: false })} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="px-6 pt-4 pb-4 border-b border-neutral-800 flex-row items-center">
          <TouchableOpacity className="mr-4 p-2 bg-neutral-800 rounded-full" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#10b981" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Ajustes de Perfil</Text>
        </View>

        {/* 
          Se aplica un margen inferior para evitar que el teclado virtual 
          superponga el formulario y bloquee el scroll. 
        */}
        <ScrollView 
          className="flex-1 px-6 pt-6" 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          
          <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Datos Personales</Text>
          <View className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 mb-6">
            <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1">NOMBRE</Text>
            <TextInput 
              placeholder="Nombre" placeholderTextColor="#9ca3af" value={nombre} onChangeText={setNombre} 
              className="text-white bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-4" 
            />
            <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1">APELLIDOS</Text>
            <TextInput 
              placeholder="Apellidos" placeholderTextColor="#9ca3af" value={apellidos} onChangeText={setApellidos} 
              className="text-white bg-neutral-900 p-4 rounded-xl border border-neutral-700" 
            />
          </View>

          <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Biometría y Objetivo</Text>
          <View className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 mb-8">
              
              <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1">PESO (KG)</Text>
                    <TextInput placeholder="Ej: 75" keyboardType="numeric" maxLength={5} placeholderTextColor="#9ca3af" value={peso} onChangeText={setPeso} className="text-white bg-neutral-900 p-3 rounded-xl border border-neutral-700 text-center" />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1">ALTURA (CM)</Text>
                    <TextInput placeholder="Ej: 175" keyboardType="numeric" maxLength={3} placeholderTextColor="#9ca3af" value={altura} onChangeText={setAltura} className="text-white bg-neutral-900 p-3 rounded-xl border border-neutral-700 text-center" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1">EDAD</Text>
                    <TextInput placeholder="Ej: 25" keyboardType="numeric" maxLength={3} placeholderTextColor="#9ca3af" value={edad} onChangeText={setEdad} className="text-white bg-neutral-900 p-3 rounded-xl border border-neutral-700 text-center" />
                  </View>
              </View>
              
              <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1 mt-2">GÉNERO</Text>
              <View className="flex-row mb-4">
                  <TouchableOpacity className={`flex-1 py-3 rounded-xl border mr-2 ${genero === 'Hombre' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setGenero('Hombre')}>
                      <Text className={`text-center font-bold ${genero === 'Hombre' ? 'text-emerald-500' : 'text-neutral-400'}`}>Hombre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className={`flex-1 py-3 rounded-xl border ${genero === 'Mujer' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setGenero('Mujer')}>
                      <Text className={`text-center font-bold ${genero === 'Mujer' ? 'text-emerald-500' : 'text-neutral-400'}`}>Mujer</Text>
                  </TouchableOpacity>
              </View>

              <Text className="text-neutral-400 text-[10px] font-bold mb-1 ml-1 mt-2">OBJETIVO</Text>
              <View className="flex-row mb-4 flex-wrap">
                  <TouchableOpacity className={`w-[48%] py-3 rounded-xl border mb-2 mr-[4%] ${objetivo === 'perder' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setObjetivo('perder')}>
                      <Text className={`text-center text-[12px] font-bold ${objetivo === 'perder' ? 'text-emerald-500' : 'text-neutral-400'}`}>Perder peso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className={`w-[48%] py-3 rounded-xl border mb-2 ${objetivo === 'mantener' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setObjetivo('mantener')}>
                      <Text className={`text-center text-[12px] font-bold ${objetivo === 'mantener' ? 'text-emerald-500' : 'text-neutral-400'}`}>Mantener</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className={`w-[48%] py-3 rounded-xl border mr-[4%] ${objetivo === 'ganar' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setObjetivo('ganar')}>
                      <Text className={`text-center text-[12px] font-bold ${objetivo === 'ganar' ? 'text-emerald-500' : 'text-neutral-400'}`}>Ganar masa</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity className={`w-[48%] py-3 rounded-xl border flex-row justify-center items-center ${objetivo === 'personalizado' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-neutral-900 border-neutral-700'}`} onPress={() => setObjetivo('personalizado')}>
                      <Ionicons name="create-outline" size={14} color={objetivo === 'personalizado' ? '#10b981' : '#9ca3af'} />
                      <Text className={`text-center text-[12px] font-bold ml-1 ${objetivo === 'personalizado' ? 'text-emerald-500' : 'text-neutral-400'}`}>Personalizado</Text>
                  </TouchableOpacity>
              </View>

              {objetivo === 'personalizado' && (
                <View className="mb-4">
                  <Text className="text-neutral-400 text-xs mb-2 ml-1">Escribe tu meta de calorías diarias:</Text>
                  <TextInput 
                    placeholder="Ej: 2500" keyboardType="numeric" maxLength={5} placeholderTextColor="#9ca3af" value={metaManual} onChangeText={setMetaManual} 
                    className="text-white bg-neutral-900 p-4 rounded-xl border border-neutral-700" 
                  />
                </View>
              )}

              <TouchableOpacity className="bg-emerald-600 py-4 rounded-xl items-center mt-2" onPress={handleGuardarCambios}>
                  <Text className="text-white font-bold text-lg">Guardar Cambios</Text>
              </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function PrivacidadSeguridadScreen({ navigation }) {
  const { user, setUser } = useContext(UserContext);
  
  const [emailNuevo, setEmailNuevo] = useState("");
  const [passwordParaEmail, setPasswordParaEmail] = useState("");
  const [showPasswordEmail, setShowPasswordEmail] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", onConfirm: null, showCancel: false, isDestructive: false, confirmText: "Entendido" });

  /*
    Validación en el lado del cliente.
    Se aplican expresiones regulares para garantizar una complejidad mínima de la 
    nueva contraseña. Esto optimiza el flujo de red al evitar peticiones no válidas.
  */
  const { isLengthValid, hasUpperLower, hasNumber, hasSpecialChar } = validatePassword(newPassword);
  const isPasswordStrong = isStrongPassword(newPassword);
  const passwordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
  
  const isFormValidPass = oldPassword.length > 0 && isPasswordStrong && passwordsMatch;
  const isFormValidEmail = isValidEmail(emailNuevo) && passwordParaEmail.length > 0;

  const handleChangeEmail = async () => {
    if (!isFormValidEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cambiar_email`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ email_nuevo: emailNuevo.trim(), password_actual: passwordParaEmail })
      });
      if (res.status === 401) { setUser(null); return; }
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, email: data.email, token: data.token });
        setAlert({ visible: true, title: "¡Éxito!", message: "Correo actualizado correctamente.", variant: "success" });
        setEmailNuevo(""); setPasswordParaEmail("");
      } else {
        setAlert({ visible: true, title: "Error", message: data.detail });
      }
    } catch (e) {
      setAlert({ visible: true, title: "Sin red", message: "Error de conexión." });
    }
  };

  const handleChangePassword = async () => {
    if (!isFormValidPass) return; 
    try {
      const res = await fetch(`${API_BASE_URL}/cambiar_password`, {
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ password_antigua: oldPassword, password_nueva: newPassword })
      });
      if (res.status === 401) { setUser(null); return; }
      const data = await res.json();
      if (res.ok) {
        setAlert({ visible: true, title: "¡Éxito!", message: "Contraseña actualizada.", variant: "success" });
        setOldPassword(""); setNewPassword(""); setConfirmNewPassword("");
      } else {
        setAlert({ visible: true, title: "Error", message: data.detail });
      }
    } catch (e) { 
      setAlert({ visible: true, title: "Sin red", message: "Error de conexión." }); 
    }
  };

  const confirmDeleteAccount = () => {
    setAlert({
      visible: true, 
      title: "¿Eliminar cuenta?", 
      showCancel: true, 
      isDestructive: true,
      confirmText: "Eliminar",
      message: "Esta acción es irreversible. Perderás tu perfil, tus escaneos y todo tu historial.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/borrar_cuenta`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${user.token}`, 'ngrok-skip-browser-warning': 'true' } 
          });
          if (res.status === 401) { setUser(null); return; }
          setUser(null);
        } catch (e) {
          console.error("Error al borrar cuenta:", e);
        }
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <CustomAlert {...alert} onClose={() => setAlert({ ...alert, visible: false })} />
      <View className="px-6 pt-4 pb-4 border-b border-neutral-800 flex-row items-center">
        <TouchableOpacity className="mr-4 p-2 bg-neutral-800 rounded-full" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Privacidad y Seguridad</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 150 }}>
        
        <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Cambiar Correo Electrónico</Text>
        <View className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 mb-8">
          <TextInput 
            placeholder="Nuevo correo electrónico" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" value={emailNuevo} onChangeText={setEmailNuevo} 
            className="text-white bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-4" 
          />
          <View className="bg-neutral-900 rounded-xl border border-neutral-700 flex-row items-center px-4 mb-4">
            <TextInput 
              placeholder="Contraseña actual" secureTextEntry={!showPasswordEmail} placeholderTextColor="#9ca3af" value={passwordParaEmail} onChangeText={setPasswordParaEmail} 
              className="text-white py-4 flex-1" 
            />
            <TouchableOpacity onPress={() => setShowPasswordEmail(!showPasswordEmail)} className="p-2">
              <Ionicons name={showPasswordEmail ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            className={`py-3 rounded-xl items-center ${isFormValidEmail ? 'bg-emerald-600' : 'bg-neutral-700'}`} 
            onPress={handleChangeEmail} disabled={!isFormValidEmail}
          >
            <Text className={`font-bold ${isFormValidEmail ? 'text-white' : 'text-neutral-400'}`}>Actualizar Correo</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Cambiar Contraseña</Text>
        <View className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 mb-8">
          <View className="bg-neutral-900 rounded-xl border border-neutral-700 flex-row items-center px-4 mb-4">
            <TextInput 
              placeholder="Contraseña actual" secureTextEntry={!showOldPassword} placeholderTextColor="#9ca3af" value={oldPassword} onChangeText={setOldPassword} 
              className="text-white py-4 flex-1" 
            />
            <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} className="p-2">
              <Ionicons name={showOldPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="bg-neutral-900 rounded-xl border border-neutral-700 flex-row items-center px-4 mb-2">
            <TextInput 
              placeholder="Nueva contraseña" secureTextEntry={!showNewPassword} placeholderTextColor="#9ca3af" value={newPassword} onChangeText={setNewPassword} 
              className="text-white py-4 flex-1" 
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="p-2">
              <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="mb-4 pl-2 mt-2">
            <View className="flex-row items-center">
              <Ionicons name={isLengthValid ? "checkmark-circle" : "close-circle"} size={16} color={isLengthValid ? "#10b981" : "#ef4444"} />
              <Text className={`text-xs ml-2 ${isLengthValid ? 'text-emerald-500' : 'text-neutral-500'}`}>Mínimo 8 caracteres</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons name={hasUpperLower ? "checkmark-circle" : "close-circle"} size={16} color={hasUpperLower ? "#10b981" : "#ef4444"} />
              <Text className={`text-xs ml-2 ${hasUpperLower ? 'text-emerald-500' : 'text-neutral-500'}`}>Mayúscula y minúscula</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons name={hasNumber ? "checkmark-circle" : "close-circle"} size={16} color={hasNumber ? "#10b981" : "#ef4444"} />
              <Text className={`text-xs ml-2 ${hasNumber ? 'text-emerald-500' : 'text-neutral-500'}`}>Al menos un número</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons name={hasSpecialChar ? "checkmark-circle" : "close-circle"} size={16} color={hasSpecialChar ? "#10b981" : "#ef4444"} />
              <Text className={`text-xs ml-2 ${hasSpecialChar ? 'text-emerald-500' : 'text-neutral-500'}`}>Carácter especial (ej: _, !, @)</Text>
            </View>
          </View>

          <View className={`bg-neutral-900 rounded-xl border ${confirmNewPassword.length > 0 && !passwordsMatch ? 'border-red-500' : 'border-neutral-700'} flex-row items-center px-4 mb-1`}>
            <TextInput 
              placeholder="Confirmar nueva contraseña" secureTextEntry={!showConfirmPassword} placeholderTextColor="#9ca3af" value={confirmNewPassword} onChangeText={setConfirmNewPassword} 
              className="text-white py-4 flex-1" 
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          
          {confirmNewPassword.length > 0 && !passwordsMatch && (
            <Text className="text-red-500 text-xs ml-2 mb-2 font-bold mt-1">Las contraseñas no coinciden.</Text>
          )}

          <TouchableOpacity 
            className={`mt-4 py-3 rounded-xl items-center ${isFormValidPass ? 'bg-emerald-600' : 'bg-neutral-700'}`} 
            onPress={handleChangePassword}
            disabled={!isFormValidPass}
          >
            <Text className={`font-bold ${isFormValidPass ? 'text-white' : 'text-neutral-400'}`}>Actualizar Contraseña</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-neutral-400 font-bold mb-3 uppercase tracking-wider text-xs ml-2">Zona de Peligro</Text>
        <TouchableOpacity className="bg-red-500/10 border border-red-500 p-4 rounded-2xl flex-row items-center mt-2 mb-10" onPress={confirmDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
          <View className="ml-3">
            <Text className="text-red-500 font-bold text-lg">Borrar cuenta</Text>
            <Text className="text-neutral-400 text-xs">Eliminar datos permanentemente</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export function TerminosScreen({ navigation }) {
  /*
    Vista estática con fines regulatorios.
    Proporciona transparencia al usuario respecto al procesamiento de sus datos
    y el uso que se le da a la inteligencia artificial dentro de la app.
  */
  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 pt-4 pb-4 border-b border-neutral-800 flex-row items-center">
        <TouchableOpacity className="mr-4 p-2 bg-neutral-800 rounded-full" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Legal y Privacidad</Text>
      </View>
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 mb-10">
          <Ionicons name="shield-checkmark" size={48} color="#10b981" className="mb-4" />
          
          <Text className="text-white font-bold text-lg mb-2">1. Uso de Inteligencia Artificial</Text>
          <Text className="text-neutral-400 mb-6 leading-6">
            CaloriCam utiliza modelos de inteligencia artificial para detectar ingredientes y estimar sus cantidades. Estas estimaciones pueden contener errores debido a la iluminación, el ángulo de la cámara o la complejidad del plato. Revisa siempre la información antes de guardarla en tu historial.
          </Text>

          <Text className="text-white font-bold text-lg mb-2">2. Fines Informativos y de Bienestar</Text>
          <Text className="text-neutral-400 mb-6 leading-6">
            Las estimaciones calóricas y los objetivos generados por la aplicación son meramente orientativos. No constituyen diagnóstico, tratamiento ni asesoramiento médico o nutricional. Para recomendaciones adaptadas a tu salud, consulta siempre a un profesional cualificado.
          </Text>

          <Text className="text-white font-bold text-lg mb-2">3. Privacidad y Gestión de Datos</Text>
          <Text className="text-neutral-400 mb-6 leading-6">
            Cumpliendo con el reglamento de protección de datos, toda la información física y nutricional se almacena de forma segura. Las imágenes enviadas a nuestros servidores para el análisis podrán ser almacenadas de forma estrictamente anónima para mejorar la precisión de los modelos, sin asociarse jamás a tu identidad.
          </Text>

          <Text className="text-white font-bold text-lg mb-2">4. Derecho al Olvido</Text>
          <Text className="text-neutral-400 mb-4 leading-6">
            Eres dueño de tus datos. En el apartado de &quot;Privacidad y Seguridad&quot; puedes eliminar tu cuenta permanentemente en cualquier momento, lo que purgará tus credenciales y tu historial de nuestros sistemas.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}