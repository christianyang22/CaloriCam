# Proyecto TFM: Estimación Nutricional con IA

Este repositorio contiene el código desarrollado para el Trabajo de Fin de Máster (TFM). El objetivo del proyecto es estimar la información nutricional (calorías y macronutrientes) de un plato de comida a partir de una imagen cenital, utilizando modelos de Visión por Computador y Regresión.

## Arquitectura del proyecto

El proyecto está dividido en cuatro módulos principales:

```text
IA/
├── 0_Preprocesamiento/
├── 1_Deteccion/
├── 2_Regresion/
├── 3_Calorias/
├── 5_Feedback/
├── config.py
└── entreno.py
```

## Descripción de módulos

* **0_Preprocesamiento:** Scripts para extraer, transformar y organizar los datasets FoodSeg103 y Nutrition5k antes del entrenamiento.
* **1_Deteccion:** Entrenamiento de modelos YOLOv11 para comparar el rendimiento entre detección de cajas (bounding boxes) y segmentación de instancias (máscaras).
* **2_Regresion:** Modelo basado en EfficientNet-B0 (PyTorch Lightning) para estimar la masa en gramos del alimento a partir de su imagen.
* **3_Calorias:** Módulo lógico que cruza la clase detectada y la masa estimada con una base de datos para devolver el desglose nutricional.
* **5_Feedback:** Directorio preparado para gestionar la retroalimentación de los usuarios en fases posteriores.

## Configuración y ejecución

El archivo `config.py` define las rutas absolutas del proyecto para evitar problemas de dependencias entre directorios.

El script `entreno.py` permite ejecutar el entrenamiento completo de los modelos de visión de forma secuencial (detección seguida de segmentación) para facilitar la comparativa en la memoria del TFM.

Para lanzar el entrenamiento de los modelos YOLO:

```bash
python entreno.py
```