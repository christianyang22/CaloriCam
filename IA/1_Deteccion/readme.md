# Módulo 1: Detección y Segmentación

Este directorio incluye los scripts y configuraciones para entrenar y evaluar los modelos YOLOv11 con el dataset FoodSeg103. El objetivo en esta fase del TFM es comparar dos enfoques distintos: detección mediante cajas delimitadoras (bounding boxes) y segmentación de instancias (máscaras poligonales).

## Estructura del directorio

```text
1_Deteccion/
├── Detection/
│   ├── foodseg103_det.yaml
│   ├── model_nutrition_dataset.py
│   ├── model.py
│   ├── nutrition_dataset.yaml
│   ├── readme_detection.md
│   └── smoke_test.py
└── Segmentation/
    ├── 0_generar_yaml.py
    ├── foodseg103.yaml
    ├── model.py
    ├── model_v1.py
    └── smoke_test_seg.py
```

## Submódulo: Detección

Enfoque basado en cajas delimitadoras clásicas.

* **smoke_test.py:** Prueba rápida de 1 época para confirmar que las etiquetas se leen correctamente y que el modelo adapta su capa de salida de 80 a 103 clases sin desbordar la memoria de la GPU.
* **model.py:** Script principal de entrenamiento (yolo11m.pt) configurado para 100 épocas, paciencia de 20 (early stopping) y tamaño de lote de 16.

## Submódulo: Segmentación

Enfoque basado en máscaras poligonales, necesario para realizar una estimación de volumen más precisa posteriormente.

* **smoke_test_seg.py:** Prueba de 1 época con el modelo de segmentación (yolo11m-seg.pt) para validar la lectura de los polígonos.
* **model_v1.py:** Script principal de entrenamiento. Utiliza los mismos parámetros que el modelo de detección (100 épocas, paciencia 20, batch 16) para poder realizar una comparación justa.
* **model.py:** Ejecuta el entrenamiento e incluye una función para extraer y mostrar por consola las métricas específicas de las máscaras (Precisión, Recall, mAP50) a nivel global y por clase.

## Ejecución

Revisa que los archivos .yaml contengan las rutas absolutas correctas a los datos generados en el módulo de preprocesamiento.

Ejecuta los scripts desde la raíz del proyecto:

```bash
# Detección
python src/1_Deteccion/Detection/smoke_test.py
python src/1_Deteccion/Detection/model.py

# Segmentación
python src/1_Deteccion/Segmentation/smoke_test_seg.py
python src/1_Deteccion/Segmentation/model_v1.py
```