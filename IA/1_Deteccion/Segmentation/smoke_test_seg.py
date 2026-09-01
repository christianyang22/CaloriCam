'''
script de validación técnica para comprobar la integridad de las etiquetas 
y máscaras poligonales del dataset foodseg103. valida que el modelo yolo 
de segmentación es capaz de procesar las 103 clases y ajustar su arquitectura 
sin saturar la vram de la gpu.
'''

from ultralytics import YOLO

def probar_entrenamiento_segmentacion():
    print("Iniciando Smoke Test de Segmentación (103 Clases)...")
    
    modelo = YOLO("yolo11m-seg.pt")

    # lanzamos un entrenamiento rápido limitado a una sola época de prueba.
    modelo.train(
        data="src/1_Deteccion/Segmentation/foodseg103.yaml",
        epochs=1,
        imgsz=640,
        batch=16,
        device=0,
        project="runs/segmentacion_comida",
        name="smoke_test_103_clases_seg",
        verbose=True
    )

if __name__ == "__main__":
    probar_entrenamiento_segmentacion()