 Preprocesamiento de Datos

Este directorio contiene los scripts necesarios para la extracción, transformación y estructuración de los datasets FoodSeg103 y Nutrition5k. El objetivo es preparar los datos crudos para el entrenamiento de los modelos de detección (YOLO) y regresión (PyTorch).

## Estructura del directorio

```text
0_Preprocesamiento/
├── 0_extraer_parquet_foodseg103.py
├── 1_convertir_mascaras_foodseg103.py
├── 2_sincronizar_imagenes_foodseg103.py
├── 3_mini5_dataset_foodseg103.py
├── 4_dataset_nutrition5k.py
└── debug_poligonos.jpg
```

## Descripción de los scripts

Los scripts deben ejecutarse en orden secuencial (del 0 al 4).

### 0_extraer_parquet_foodseg103.py
Descarga y extrae los archivos en formato Parquet del dataset FoodSeg103 desde Hugging Face. Guarda las imágenes RGB (.jpg) y las máscaras de segmentación (.png) separadas en conjuntos de entrenamiento y validación.

### 1_convertir_mascaras_foodseg103.py
Convierte las máscaras PNG a archivos de texto (.txt) con coordenadas poligonales normalizadas para YOLO.
* Omite el fondo (clase 0).
* Ajusta los índices de clase para empezar en 0.
* Filtra polígonos menores a 50 píxeles.
* Permite activar un modo de depuración (DEBUG_MODE) para generar una imagen con los contornos superpuestos y verificar las coordenadas.

### 2_sincronizar_imagenes_foodseg103.py
Copia las imágenes RGB a la estructura de directorios que requiere YOLO (carpetas separadas para images/train e images/val).

### 3_mini5_dataset_foodseg103.py
Crea una versión reducida del dataset centrada en 5 clases (huevo, brócoli, arroz, pollo/pato y pescado) para realizar pruebas rápidas. Utiliza enlaces simbólicos (symlinks) para las imágenes en lugar de copiarlas y ahorrar espacio en disco.

### 4_dataset_nutrition5k.py
Recorre los directorios originales de Nutrition5k y extrae la imagen RGB de cada plato. Renombra y mueve todas las imágenes a un único directorio plano para facilitar la carga en PyTorch mediante DataLoaders.

## Ejecución

Asegúrate de tener instaladas las dependencias (datasets, opencv-python, tqdm).

```bash
python 0_extraer_parquet_foodseg103.py
python 1_convertir_mascaras_foodseg103.py
python 2_sincronizar_imagenes_foodseg103.py
python 3_mini5_dataset_foodseg103.py
python 4_dataset_nutrition5k.py
```