from ultralytics import YOLO
from src.config import PROJECT_ROOT

def main():
    """
    Configura y ejecuta el entrenamiento del modelo YOLO para detección de objetos.
    Evalúa el rendimiento de las cajas delimitadoras sobre un subconjunto de 5 clases
    para compararlo posteriormente con el enfoque de segmentación de instancias.
    """
    
    # Se instancia el modelo base sin la cabeza de segmentación ('-seg')
    # ya que el objetivo de este módulo es evaluar únicamente la detección por bounding boxes.
    model = YOLO('yolo11m.pt') 

    yaml_path = PROJECT_ROOT / "src" / "1_Deteccion" / "Detection" / "nutrition_dataset.yaml"

    # Se fija una única época a modo de smoke test para asegurar que el pipeline 
    # de datos y la resolución de índices funcionan antes del entrenamiento completo.
    train_args = {
        'data': str(yaml_path),
        'epochs': 1,                     
        'patience': 25,                    
        'imgsz': 640,                      
        'batch': 16,                       
        'device': '0',                     
        'workers': 8,                      
        'optimizer': 'auto',               
        'project': 'runs/deteccion_comida',
        'name': 'yolo11m_det_mini5',
        'save': True,                      
        'plots': True                      
    }

    print("Iniciando entrenamiento del modelo de detección...")
    model.train(**train_args)
    
    print("\nEntrenamiento finalizado. Iniciando evaluación del modelo...")
    metrics = model.val()

    imprimir_reporte_metricas(model.names, metrics)


def imprimir_reporte_metricas(nombres_clases, metrics):
    """
    Extrae y formatea por consola las métricas de precisión y exhaustividad (recall)
    del objeto de validación de Ultralytics, separando los resultados globales 
    de los resultados específicos por clase.
    """
    print("\n" + "="*60)
    print("REPORTE DE RENDIMIENTO (DETECCIÓN DE CAJAS)")
    print("="*60)
    
    precision_global = metrics.box.mp * 100
    recall_global = metrics.box.mr * 100
    map50_global = metrics.box.map50 * 100

    print("Resultados Globales:")
    print(f"  - Precisión (Precision): {precision_global:.1f}%")
    print(f"  - Exhaustividad (Recall): {recall_global:.1f}%")
    print(f"  - mAP50 Global: {map50_global:.1f}%\n")

    print("Rendimiento detallado por clase:")
    clases_evaluadas = metrics.box.ap_class_index
    
    # El framework YOLO devuelve vectores de métricas indexados en el mismo orden 
    # que ap_class_index. Se itera simultáneamente para asociar el nombre con su resultado.
    for i, class_idx in enumerate(clases_evaluadas):
        nombre = nombres_clases[class_idx].capitalize()
        precision = metrics.box.p[i] * 100
        recall = metrics.box.r[i] * 100
        map50 = metrics.box.ap50[i] * 100
        
        print(f"  [{nombre}]")
        print(f"    Precisión: {precision:.1f}% | Recall: {recall:.1f}% | mAP50: {map50:.1f}%")
        print("-" * 60)


if __name__ == '__main__':
    main()