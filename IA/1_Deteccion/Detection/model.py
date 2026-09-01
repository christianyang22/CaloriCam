"""
Modulo 1: Entrenamiento Oficial de Deteccion (YOLO11x - Extra Large)
Dataset: FoodSeg103 (103 clases) - Configuracion de Maxima Exigencia
"""

from ultralytics import YOLO
from pathlib import Path

def entrenar_modelo_deteccion():
    print("Iniciando entrenamiento EXTREMO de Deteccion (X-Large)...")
    
    ruta_yaml = Path(__file__).parent / "foodseg103_det.yaml"
    modelo = YOLO("yolo11x.pt")

    resultados = modelo.train(
        data=str(ruta_yaml),
        epochs=500,
        patience=40,
        imgsz=640,
        batch=4,               
        optimizer='auto',
        device=0,
        project="runs/deteccion_comida_extremo_auto",
        name="yolo11x_det_extremo",
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
    
    print("Entrenamiento finalizado. Metricas guardadas en 'runs/deteccion_comida/yolo11x_det_extremo'")

if __name__ == "__main__":
    entrenar_modelo_deteccion()