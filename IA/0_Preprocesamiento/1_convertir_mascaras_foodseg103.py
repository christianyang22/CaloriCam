import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import sys
from src.config import FOODSEG_RAW_ANN, FOODSEG_RAW_IMG, FOODSEG_LABELS

# Modo de auditoría visual: si es True, procesa una única imagen, dibuja
# los contornos poligonales superpuestos y detiene la ejecución para validación.
DEBUG_MODE = True

def procesar_mascaras(split_origen: str, split_destino: str) -> None:
    """
    Convierte las máscaras semánticas en formato PNG a archivos de texto
    con coordenadas poligonales normalizadas compatibles con Ultralytics YOLO.
    """
    mask_dir = FOODSEG_RAW_ANN / split_origen
    img_dir = FOODSEG_RAW_IMG / split_origen
    labels_dir = FOODSEG_LABELS / split_destino
    
    labels_dir.mkdir(parents=True, exist_ok=True)
    mascaras = sorted(list(mask_dir.glob("*.png")))
    
    if not mascaras:
        return

    for mask_path in tqdm(mascaras, desc=f"Generando polígonos {split_destino}"):
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        h, w = mask.shape
        clases = np.unique(mask)
        clases = clases[clases != 0] # Exclusión del fondo (background ID 0)
        
        lineas_yolo = []
        poligonos_debug = [] 
        
        for clase_orig in clases:
            # Reajuste de índice para adaptar las clases de FoodSeg103 a base cero requerida por YOLO
            yolo_class_id = clase_orig - 1
            mask_binaria = np.zeros_like(mask)
            mask_binaria[mask == clase_orig] = 255
            
            contornos, _ = cv2.findContours(mask_binaria, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contorno in contornos:
                # Filtro de ruido geométrica para descartar regiones menores a 50 píxeles
                if cv2.contourArea(contorno) < 50:
                    continue
                contorno = contorno.squeeze() 
                if contorno.ndim != 2 or len(contorno) < 3:
                    continue
                    
                coords_normalizadas = []
                for punto in contorno:
                    x = punto[0] / w
                    y = punto[1] / h
                    coords_normalizadas.append(f"{x:.6f} {y:.6f}")
                    
                linea = f"{yolo_class_id} " + " ".join(coords_normalizadas)
                lineas_yolo.append(linea)
                poligonos_debug.append(contorno)
        
        if DEBUG_MODE:
            img_path = img_dir / f"{mask_path.stem}.jpg"
            if img_path.exists():
                img_color = cv2.imread(str(img_path))
                cv2.drawContours(img_color, poligonos_debug, -1, (0, 255, 0), 2)
                debug_out = Path(__file__).parent / "debug_poligonos.jpg"
                cv2.imwrite(str(debug_out), img_color)
            sys.exit(0)
        
        txt_path = labels_dir / f"{mask_path.stem}.txt"
        with open(txt_path, "w") as f:
            f.write("\n".join(lineas_yolo))

def main() -> None:
    """
    Punto de entrada para la generación masiva de etiquetas de segmentación YOLO.
    """
    procesar_mascaras("train", "train")
    procesar_mascaras("test", "val")

if __name__ == '__main__':
    main()