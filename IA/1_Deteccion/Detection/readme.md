# Detección de alimentos con YOLO11

Este módulo contiene el entrenamiento y evaluación de un modelo **YOLO11m** para detección de alimentos mediante *bounding boxes*.

El objetivo de esta parte del proyecto es disponer de un modelo de detección que permita localizar distintos alimentos dentro de una imagen y obtener métricas que posteriormente puedan compararse con el enfoque basado en segmentación.

Actualmente se utiliza un subconjunto reducido de cinco clases para comprobar el funcionamiento del pipeline antes de realizar experimentos de mayor tamaño.

## Clases utilizadas

El dataset utilizado en esta prueba contiene las siguientes clases:

| ID | Clase   |
| -: | ------- |
|  0 | huevo   |
|  1 | brocoli |
|  2 | arroz   |
|  3 | pollo   |
|  4 | pescado |

La configuración de las clases y las rutas del dataset se encuentra en:

```text
nutrition_dataset.yaml
```

## Estructura

```text
Detection/
├── model.py
├── nutrition_dataset.yaml
└── readme_detection.md
```

### `model.py`

Contiene el entrenamiento y la evaluación del modelo de detección.

El script:

1. carga los pesos preentrenados de `YOLO11m`;
2. carga la configuración del dataset;
3. ejecuta el entrenamiento;
4. realiza la validación del modelo;
5. muestra por consola las principales métricas globales y por clase.

### `nutrition_dataset.yaml`

Define la ubicación del dataset, los subconjuntos de entrenamiento y validación y las clases utilizadas por YOLO.

La estructura esperada actualmente es:

```text
Nutrition_Mini5/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

Cada imagen debe tener su correspondiente archivo `.txt` dentro de `labels`, utilizando el formato de detección compatible con Ultralytics YOLO.

## Modelo

Se utiliza:

```text
YOLO11m
```

con pesos preentrenados:

```text
yolo11m.pt
```

El uso de pesos preentrenados permite aplicar **Transfer Learning**, partiendo de características visuales aprendidas previamente en lugar de entrenar el modelo desde cero.

En este módulo se utiliza la versión de detección de YOLO, sin cabeza de segmentación, ya que el objetivo es evaluar únicamente las cajas delimitadoras.

## Configuración actual

Los principales parámetros utilizados en `model.py` son:

```text
Modelo: YOLO11m
Épocas: 1
Patience: 25
Resolución: 640 × 640
Batch size: 16
Dispositivo: GPU 0
Workers: 8
Optimizador: auto
```

Los resultados se almacenan en:

```text
runs/deteccion_comida/yolo11m_det_mini5/
```

### Smoke test

Actualmente el entrenamiento está configurado con:

```python
'epochs': 1
```

Esta configuración se utiliza únicamente como **smoke test**.

El objetivo de esta prueba no es obtener buenas métricas, sino comprobar que:

* YOLO puede cargar el dataset;
* las imágenes y etiquetas tienen un formato válido;
* los índices de las clases son correctos;
* el entrenamiento puede comenzar sin errores;
* se generan los archivos de resultados;
* la validación puede ejecutarse correctamente.

Una vez comprobado el pipeline será necesario realizar un entrenamiento con una configuración adecuada para poder evaluar realmente el rendimiento del modelo.

## Ejecución

Desde la raíz del proyecto:

```bash
python -m src.1_Deteccion.Detection.model
```

El script comenzará mostrando:

```text
Iniciando entrenamiento del modelo de detección...
```

Después del entrenamiento se ejecutará automáticamente la validación.

## Métricas

Tras finalizar la validación, el script muestra las principales métricas de detección.

### Métricas globales

Se muestran:

* **Precision**
* **Recall**
* **mAP50**

### Métricas por clase

También se muestran estas métricas individualmente para cada clase evaluada.

Ejemplo del formato de salida:

```text
============================================================
REPORTE DE RENDIMIENTO (DETECCIÓN DE CAJAS)
============================================================

Resultados Globales:
  - Precisión (Precision): ...
  - Exhaustividad (Recall): ...
  - mAP50 Global: ...

Rendimiento detallado por clase:

  [Huevo]
    Precisión: ... | Recall: ... | mAP50: ...

------------------------------------------------------------
```

Los valores dependen del entrenamiento realizado y no deben considerarse resultados definitivos mientras se utilice la configuración de smoke test.

## Archivos generados

Ultralytics guarda automáticamente distintos resultados del entrenamiento dentro del directorio configurado en `project` y `name`.

Entre ellos pueden encontrarse:

```text
weights/
├── best.pt
└── last.pt
```

Además de gráficas, métricas y otros archivos generados durante el entrenamiento y la validación.

`best.pt` corresponde al mejor checkpoint guardado durante el entrenamiento según el criterio utilizado por Ultralytics.

## Papel dentro del proyecto

Este módulo forma parte de la etapa de reconocimiento visual del pipeline general:

```text
Imagen
   ↓
Detección / Segmentación
   ↓
Regiones de alimentos
   ↓
Estimación de masa
   ↓
Información nutricional
   ↓
Estimación de calorías y macronutrientes
```

La detección mediante cajas se mantiene como un experimento de referencia para estudiar posteriormente las diferencias frente a la segmentación de instancias.

Para la estimación nutricional, disponer únicamente de una caja delimitadora puede incluir fondo u otros elementos de la imagen, mientras que una máscara de segmentación permite delimitar con mayor precisión la región correspondiente al alimento.

Esta diferencia deberá evaluarse experimentalmente antes de determinar qué enfoque se utilizará finalmente en el MVP.

## Estado actual

Actualmente este módulo se encuentra en fase de validación inicial del pipeline.

```text
[Completado] Configuración básica de YOLO11m
[Completado] Configuración del subconjunto de cinco clases
[Completado] Entrenamiento y validación desde model.py
[Completado] Reporte de métricas globales y por clase
[En prueba] Smoke test del pipeline
[Pendiente] Validación visual de las anotaciones
[Pendiente] Entrenamiento definitivo
[Pendiente] Comparación con segmentación
```

No se consideran todavía obtenidos resultados finales del modelo de detección.
