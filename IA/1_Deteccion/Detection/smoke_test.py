"""
Script de Validación Técnica

Probar la integridad de las etiquetas de FoodSeg103 antes del entrenamiento largo.
Comprueba que el modelo YOLO puede leer los bounding boxes de las 103 clases y que 
la red neuronal ajusta correctamente su capa de salida de 80 a 103 categorías sin
problemas de memoria (OOM) en la GPU.
"""

from ultralytics import YOLO

def probar_entrenamiento_masivo():
    print("Iniciando Smoke Test de Detección (103 Clases)...")
    
    # Cargamos el modelo base de detección.
    modelo = YOLO("yolo11m.pt")

    # Lanzamos el entrenamiento limitado a 1 sola época
    modelo.train(
        data="src/1_Deteccion/Detection/foodseg103_det.yaml",
        epochs=1,
        imgsz=640,
        batch=16,
        device=0, # Usamos la RTX 4090
        project="runs/deteccion_comida",
        name="smoke_test_103_clases",
        verbose=True
    )

if __name__ == "__main__":
    probar_entrenamiento_masivo()