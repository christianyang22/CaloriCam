import io
import requests
import streamlit as st
from PIL import Image, ImageDraw

# Configuracion basica de la pagina
st.set_page_config(page_title="CaloriCam - MVP", layout="wide")

st.title("Calculadora Nutricional")
st.write("Sube una foto del plato para estimar sus calorias y macronutrientes.")

url_api = "http://127.0.0.1:8000/analizar_plato"

# Paleta de colores visualmente distinguibles
PALETA_COLORES = [
    "#FF3333", "#33CC33", "#3333FF", "#FFCC00", "#FF33CC", 
    "#33FFFF", "#FF9933", "#9933FF", "#00FF99", "#A52A2A"
]

archivo_subido = st.file_uploader("Selecciona una imagen", type=["jpg", "jpeg", "png"])

if archivo_subido is not None:
    with st.spinner("Analizando imagen..."):
        imagen_pil = Image.open(archivo_subido).convert("RGB")
        
        bytes_datos = archivo_subido.getvalue()
        archivos = {"imagen": ("plato.jpg", bytes_datos, "image/jpeg")}
        
        try:
            respuesta = requests.post(url_api, files=archivos)
            
            if respuesta.status_code == 200:
                datos = respuesta.json()
                detalles = datos.get("detalles", [])
                resumen = datos.get("resumen", {})
                
                # Mapeo de colores por ingrediente
                nombres_unicos = list(set(item["ingrediente"].lower() for item in detalles))
                mapa_colores = {
                    nombre: PALETA_COLORES[i % len(PALETA_COLORES)] 
                    for i, nombre in enumerate(nombres_unicos)
                }
                
                # Dibujo de cajas delimitadoras
                dibujo = ImageDraw.Draw(imagen_pil)
                for item in detalles:
                    caja = item["coordenadas_caja"]
                    nombre = item["ingrediente"].lower()
                    color_caja = mapa_colores[nombre]
                    
                    dibujo.rectangle(caja, outline=color_caja, width=4)
                    dibujo.text((caja[0], max(0, caja[1] - 15)), nombre.upper(), fill=color_caja)
                
                st.success("Analisis completado")
                
                col1, col2 = st.columns([1, 1])
                
                with col1:
                    st.subheader("Detecciones")
                    st.image(imagen_pil, width="stretch")
                
                with col2:
                    st.subheader("Resumen Nutricional")
                    
                    m1, m2 = st.columns(2)
                    m1.metric("Calorias Totales", f"{resumen.get('calorias_totales_plato', 0)} kcal")
                    m2.metric("Ingredientes Detectados", resumen.get("ingredientes_totales", 0))
                    
                    st.divider()
                    st.subheader("Desglose por ingrediente")
                    
                    for item in detalles:
                        nutri = item["estimacion_nutricional"]
                        nombre_ingrediente = item["ingrediente"].lower()
                        color_asignado = mapa_colores[nombre_ingrediente]
                        
                        # Vinculacion visual mediante inyeccion HTML simple
                        st.markdown(
                            f"<h4 style='margin-bottom:0;'><span style='color:{color_asignado};'>&#9608;</span> {nombre_ingrediente.capitalize()} <span style='font-size:0.8em; font-weight:normal;'>({nutri.get('gramos_predichos', 0)}g)</span></h4>", 
                            unsafe_allow_html=True
                        )
                        
                        st.write(f"Calorias: {nutri.get('calorias', 0)} kcal | "
                                 f"Proteinas: {nutri['macronutrientes']['proteinas_g']}g | "
                                 f"Carbohidratos: {nutri['macronutrientes']['carbohidratos_g']}g | "
                                 f"Grasas: {nutri['macronutrientes']['grasas_g']}g")
                        
                        if "aviso" in nutri:
                            st.caption(f"Aviso: {nutri['aviso']}")
                        st.write("")
                        
                # Requisito del Prompt Maestro: Aviso medico orientativo
                st.divider()
                st.caption("Informacion orientativa. Los valores nutricionales mostrados son estimaciones realizadas mediante Inteligencia Artificial a partir de una fotografia y pueden contener errores. Esta aplicacion tiene fines informativos y no sustituye el consejo de un profesional sanitario.")
                        
            else:
                st.error(f"Error del servidor: {respuesta.status_code}")
                
        except requests.exceptions.ConnectionError:
            st.error("No se pudo conectar con el servidor. Verifica que main.py esta ejecutandose.")