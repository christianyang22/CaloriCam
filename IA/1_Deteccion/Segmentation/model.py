'''
módulo de entrenamiento oficial de segmentación utilizando yolo11x-seg
sobre el dataset foodseg103 con una configuración de máxima exigencia.
'''

from ultralytics import YOLO
from pathlib import Path

def entrenar_modelo_segmentacion():
    print("Iniciando entrenamiento EXTREMO de Segmentacion (X-Large)...")
    
    # obtenemos la ruta del archivo de configuración yaml del dataset.
    ruta_yaml = Path(__file__).parent / "foodseg103.yaml"
    
    # cargamos los pesos preentrenados del modelo de segmentación.
    modelo = YOLO("yolo11x-seg.pt")

    resultados = modelo.train(
        data=str(ruta_yaml),
        epochs=500,
        patience=40,
        imgsz=640,
        batch=4,               
        optimizer='auto',
        device=0,
        project="runs/segmentacion_comida_extremo_auto",
        name="yolo11x_seg_extremo",
        verbose=True,
        multi_scale=True,
        cos_lr=True,
        weight_decay=0.001,
        dropout=0.25,
        warmup_epochs=5.0,     
        close_mosaic=30,       
        degrees=15.0,
        translate=0.2,
        scale=0.6,
        shear=5.0,
        perspective=0.0005,
        fliplr=0.5,
        hsv_s=0.7,
        hsv_v=0.4,
        mixup=0.15,
        copy_paste=0.3         
    )
    
    print("Entrenamiento finalizado. Metricas guardadas en 'runs/segmentacion_comida/yolo11x_seg_extremo'")

if __name__ == "__main__":
    entrenar_modelo_segmentacion()