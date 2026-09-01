# CaloriCam

**Trabajo de Fin de Máster (TFM)**
**Máster de Inteligencia Artificial**

**Autor:** Christian Jonathan Yang González

---

## Descripción del Proyecto

**CaloriCam** es un sistema integral basado en Inteligencia Artificial diseñado para estimar la cantidad de calorías y los valores nutricionales a partir de fotografías de alimentos. Este repositorio abarca todo el ciclo de vida del proyecto, desde el entrenamiento y desarrollo de los modelos de Deep Learning hasta el despliegue de las aplicaciones finales para usuarios (móvil y web) junto con su respectivo backend.

El objetivo principal de este trabajo es facilitar el seguimiento nutricional y la concienciación sobre la dieta utilizando visión por computador y regresión de datos nutricionales.

---

## Estructura del Repositorio

El proyecto se divide en 4 módulos principales:

```text
CaloriCam/
├── Backend/                 # API y gestión de base de datos
│   ├── database.py          # Conexión y operaciones con la base de datos
│   └── main.py              # Archivo principal de la API (rutas y endpoints)
│
├── IA/                      # Modelos de Inteligencia Artificial y Datos
│   ├── 0_Preprocesamiento/  # Scripts para limpieza y preparación de datasets (FoodSeg103, Nutrition5k)
│   ├── 1_Deteccion/         # Modelos de Detección y Segmentación de alimentos
│   ├── 2_Regresion/         # Modelos de regresión para el cálculo del peso/volumen y calorías
│   └── 3_Calorias/          # Módulos de lógica para el cálculo calórico final
│
├── movil/                   # Aplicación móvil (React Native / Expo)
│   ├── assets/              # Imágenes e iconos de la app
│   ├── components/          # Componentes reutilizables de la interfaz
│   ├── screens/             # Pantallas (Inicio, Historial, Perfil, Autenticación)
│   └── App.js               # Punto de entrada de la aplicación móvil
│
└── web/                     # Aplicación web
    ├── client/              # Frontend web (React, Vite, Tailwind CSS)
    └── app_web_streamlit_antiguo.py # Versión inicial de la interfaz en Streamlit
```

---

## Módulos en Detalle

### 1. IA (Inteligencia Artificial)
Es el núcleo predictivo del proyecto. Se compone de varias etapas de procesamiento:
*   **Preprocesamiento (`0_Preprocesamiento`):** Contiene los scripts necesarios para descargar, limpiar, formatear mascaras, extraer parquets y sincronizar los conjuntos de datos principales utilizados: **FoodSeg103** y **Nutrition5k**.
*   **Detección y Segmentación (`1_Deteccion`):** Utiliza modelos de visión por computador para localizar los alimentos en la bandeja o plato y segmentar sus bordes.
*   **Regresión (`2_Regresion`):** Entrena modelos para predecir variables continuas (como el volumen, masa o estimaciones calóricas directas) basándose en las características extraídas de las imágenes.
*   **Cálculo de Calorías (`3_Calorias`):** Integra los resultados de las etapas anteriores mediante scripts (`calculadora.py`) para devolver la estimación nutricional final.

### 2. Backend
Proporciona la lógica de negocio y la comunicación entre los clientes (web/móvil) y los modelos de IA.
*   Construido en Python (probablemente FastAPI/Flask).
*   Se encarga de recibir las imágenes, procesarlas usando los modelos del módulo `IA`, y guardar el historial del usuario en la base de datos (`database.py`).

### 3. Aplicación Móvil (`movil`)
Desarrollada con **React Native / Expo** y estilizada con **NativeWind / Tailwind**, permite a los usuarios:
*   Registrarse e iniciar sesión (`AuthScreens`).
*   Capturar o subir fotos de sus comidas (`HomeScreens`).
*   Visualizar los resultados de las calorías y llevar un registro continuo (`HistorialScreen`).
*   Gestionar sus datos personales (`ProfileScreens`).

### 4. Aplicación Web (`web`)
Ofrece una interfaz alternativa para interactuar con el sistema a través del navegador.
*   **Client (Frontend actual):** Aplicación moderna en React y Vite. Permite subir imágenes (`ImageUploader.jsx`) o capturarlas mediante webcam (`WebcamCapture.jsx`).
*   **Streamlit (Legacy):** Un script antiguo de Streamlit utilizado en las primeras fases del desarrollo para probar los modelos rápidamente.

---

## Tecnologías Utilizadas

*   **Inteligencia Artificial:** Python, PyTorch, YOLO/Modelos de segmentación, Pandas, OpenCV.
*   **Backend:** Python, API REST, Base de datos relacional/NoSQL.
*   **Frontend Móvil:** React Native, Expo, Tailwind CSS (NativeWind).
*   **Frontend Web:** React, Vite, Tailwind CSS, Streamlit.

---

## Instrucciones de Instalación y Uso (General)

Debido a la arquitectura modular, cada sección requiere sus propios pasos de instalación:

1.  **Backend e IA:** 
    *   Crear un entorno virtual de Python.
    *   Instalar las dependencias (ej. `pip install -r requirements.txt`).
    *   Ejecutar el servidor API (ej. `python main.py` o vía `uvicorn`).
2.  **Aplicación Móvil:**
    *   Navegar al directorio `movil`.
    *   Instalar dependencias con `npm install` o `yarn install`.
    *   Ejecutar con `npx expo start`.
3.  **Aplicación Web:**
    *   Navegar al directorio `web/client`.
    *   Instalar dependencias con `npm install`.
    *   Ejecutar con `npm run dev`.

*(Nota: Asegúrate de configurar las variables de entorno necesarias en cada módulo para las conexiones a la base de datos y la comunicación con el Backend).*
