# Módulo 2: Regresión de Masa

Este directorio contiene la implementación en PyTorch Lightning de un modelo de regresión. Su función es predecir la masa total (en gramos) de un plato a partir de su imagen RGB superior, utilizando el dataset Nutrition5k.

## Estructura del directorio

```text
2_Regresion/
├── data_module.py
├── model.py
├── runs/
│   ├── checkpoints/
│   └── lightning_logs/
└── train.py
```

## Descripción de los scripts

### data_module.py
Gestiona la carga y preparación de los datos.
* La clase `Nutrition5kDataset` asocia cada imagen con su masa utilizando el archivo de metadatos.
* `NutritionDataModule` realiza la partición (80% entrenamiento, 20% validación) y aplica las transformaciones necesarias (redimensionado, data augmentation y normalización).
* Incluye una prueba básica (ejecutable directamente) para extraer un lote y verificar dimensiones.

### model.py
Define la arquitectura de la red y el proceso de entrenamiento.
* Implementa `FoodMassRegressor` utilizando EfficientNet-B0 preentrenado.
* Reemplaza la capa de clasificación por una capa de regresión con salida lineal continua.
* Utiliza L1 Loss (Mean Absolute Error) por ser más robusta ante valores atípicos en los pesos.
* Configura el optimizador AdamW y un programador de tasa de aprendizaje (ReduceLROnPlateau).

### train.py
Orquesta el entrenamiento con el Trainer de PyTorch Lightning.
* Conecta el DataModule con el modelo.
* Configura los callbacks: ModelCheckpoint (guarda los pesos con menor error de validación) y EarlyStopping (detiene el entrenamiento si no hay mejora en 10 épocas).

## Ejecución

Antes de ejecutar, las imágenes deben estar aplanadas en un solo directorio (módulo 0_Preprocesamiento).

Para iniciar el entrenamiento:

```bash
python train.py
```

Para visualizar las métricas en TensorBoard:

```bash
tensorboard --logdir=runs/lightning_logs
```