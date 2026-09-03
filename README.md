# CaloriCam

> Sistema automatizado de estimación nutricional de alimentos basado en Inteligencia Artificial y Visión Computacional.

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-%23EE4C2C.svg?style=flat&logo=PyTorch&logoColor=white)](https://pytorch.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)

## Descripción del Proyecto

**CaloriCam** es una plataforma integral diseñada para la detección de ingredientes y la estimación precisa de masa y valores nutricionales a partir de imágenes de comidas. Utilizando modelos de segmentación y detección avanzados (como YOLOv11 y arquitecturas basadas en EfficientNet), el sistema procesa la entrada visual para ofrecer resultados nutricionales estructurados tanto en entornos web como en dispositivos móviles.

## Estructura y Arquitectura

El ecosistema del proyecto está dividido en los siguientes módulos principales:

- `Backend/`: Microservicios construidos con FastAPI que manejan la lógica de negocio, integración de modelos IA y base de datos.
- `IA/`: Pipelines de Machine Learning y Computer Vision (detección, segmentación y regresión) entrenados con datasets especializados (Nutrition5k, FoodSeg103).
- `movil/`: Aplicación móvil multiplataforma desarrollada en React Native / Expo.
- `web/`: Cliente frontend web moderno desarrollado con React y Vite.

---

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de iniciar el entorno de desarrollo:

- **Python** (v3.9 o superior)
- **Node.js** (v16 o superior) y npm/yarn
- **Docker** (Opcional, para contenerización de servicios)
- **ngrok** (Requerido para el desarrollo local de las apps cliente)

---

## Instalación y Despliegue Local

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/tu-organizacion/CaloriCam.git](https://github.com/tu-organizacion/CaloriCam.git)
cd CaloriCam

```

### 2. Instalación de Dependencias Core (Backend e IA)

Es recomendable utilizar un entorno virtual (`venv` o `conda`) para aislar las dependencias de Python.

```bash
# Crear y activar entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias requeridas
pip install -r requirements.txt

```

### 3. Configuración de túneles locales con ngrok

Para que la aplicación móvil (`movil/`) y la plataforma web (`web/`) puedan comunicarse correctamente con el servidor backend que corre en tu máquina de desarrollo, es necesario exponer el puerto local a internet de forma segura utilizando **ngrok**.

1. **Crear una cuenta:** Regístrate gratuitamente en [ngrok.com](https://ngrok.com/).
2. **Instalación:** Descarga ngrok e instálalo en tu sistema.
3. **Autenticación:** En tu terminal, asocia ngrok a tu cuenta utilizando tu token (disponible en el dashboard de ngrok):
```bash
ngrok config add-authtoken <TU_AUTH_TOKEN_AQUI>

```


4. **Exponer el puerto:** Inicia un túnel HTTP hacia el puerto donde corre tu backend (generalmente el `8000` para FastAPI):
```bash
ngrok http 8000

```


5. **Copia la URL pública** que te genera la terminal (ej: `https://abcd-12-34-56-78.ngrok-free.app`). Usarás esta URL en el siguiente paso.

### 4. Configuración de Variables de Entorno

Debes crear los archivos `.env` basándote en las plantillas `.example` proporcionadas en los distintos módulos del proyecto.

**En el Backend:**

```bash
cp Backend/.env.example Backend/.env
# Edita Backend/.env e ingresa tu SECRET_KEY y credenciales de base de datos.

```

**En la Aplicación Móvil:**

```bash
cp movil/.env.example movil/.env
# Edita movil/.env y reemplaza EXPO_PUBLIC_API_URL por la URL generada por ngrok.

```

---

## Ejecución de los Servicios

Una vez configurado, puedes levantar los entornos de manera independiente:

**1. Levantar el Backend:**

```bash
cd Backend
uvicorn main:app --reload

```

**2. Iniciar el Cliente Web:**

```bash
cd web/client
npm install
npm run dev

```

**3. Iniciar la App Móvil:**

```bash
cd movil
npm install
npx expo start

```

---

## Modelos de Inteligencia Artificial

Los scripts de entrenamiento y preprocesamiento de imágenes se encuentran dentro del directorio `IA/`. Para correr reentrenamientos o validaciones (ej. tests de humo), puedes navegar a sus subdirectorios respectivos:

* **Preprocesamiento:** Extracción de parquets y sincronización de imágenes (`IA/0_Preprocesamiento/`).
* **Detección y Segmentación:** Pipelines para identificar la posición y los píxeles de cada alimento (`IA/1_Deteccion/`).
* **Regresión:** Estimación del volumen/peso y calorías a partir de las detecciones (`IA/2_Regresion/`).

---

## Licencia

Este proyecto ha sido desarrollado como Trabajo Fin de Máster (TFM). La autoría de este trabajo es fruto exclusivamente del esfuerzo intelectual individual, garantizando que todas las fuentes y materiales de terceros están correctamente referenciados en el texto y bibliografía.

Al autorizar su inclusión en el Repositorio de Trabajos Fin de Estudios TITULA de la Universidad Europea de Madrid, este proyecto se rige bajo una licencia **Creative Commons Reconocimiento - No Comercial - Sin Obra Derivada**. De acuerdo a esta licencia:

* Los usuarios tienen la obligación de citar y reconocer los créditos del trabajo.

* El proyecto no se podrá utilizar para fines comerciales.

* No se podrá alterar, transformar o generar una obra derivada a partir del mismo.

El autor preserva de forma íntegra los derechos de explotación y uso sobre el proyecto, pudiendo publicarlo posteriormente en otras editoriales, revistas o soportes. Asimismo, se concede permiso a la Universidad Europea de Madrid para exhibir y difundir este trabajo en sus canales institucionales y soportes con fines de promoción profesional de sus exalumnos, siempre que se cite su autoría.
