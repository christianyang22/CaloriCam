import json
import yaml
from pathlib import Path
from src.config import FOODSEG_DATASET, FOODSEG_BASE, PROJECT_ROOT

def main():
    '''
    lee el archivo de etiquetas id2label de foodseg103, ajusta los índices 
    para cumplir con el estándar de yolo (base cero) y genera el archivo 
    de configuración yaml necesario para el entrenamiento de segmentación.
    '''
    
    json_path = FOODSEG_BASE / "raw" / "repo_hf" / "id2label.json"
    yaml_path = PROJECT_ROOT / "src" / "1_Deteccion" / "Segmentation" / "foodseg103.yaml"
    
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(json_path, "r", encoding="utf-8") as f:
        id2label = json.load(f)
        
    # yolo requiere que las clases sean un diccionario con índices desde cero y en foodseg103 se resta uno al identificador original.
    names_dict = {int(k) - 1: v for k, v in id2label.items() if int(k) > 0}
    
    yaml_content = {
        "path": str(FOODSEG_DATASET),
        "train": "images/train",
        "val": "images/val",
        "names": names_dict
    }
    
    # se serializa el diccionario al formato yaml requerido por ultralytics.
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(yaml_content, f, sort_keys=True, allow_unicode=True)
        
    imprimir_resumen_generacion(yaml_path, names_dict)


def imprimir_resumen_generacion(yaml_path, names_dict):
    '''
    imprime por consola un desglose estructurado y fácil de leer
    con los detalles de la configuración generada para su auditoría visual.
    '''
    print("\n" + "="*60)
    print("RESUMEN DE GENERACION DE CONFIGURACION YAML")
    print("="*60)
    print(f"Ruta de destino del archivo: {yaml_path}")
    print(f"Total de clases configuradas: {len(names_dict)}")
    
    print("Muestra inicial del mapeo (primeras 5 clases):")
    for idx in range(min(5, len(names_dict))):
        print(f"  - Índice YOLO [{idx}]: {names_dict[idx]}")
        
    print("-" * 60)
    print("Archivo de configuración generado correctamente.\n")


if __name__ == "__main__":
    main()