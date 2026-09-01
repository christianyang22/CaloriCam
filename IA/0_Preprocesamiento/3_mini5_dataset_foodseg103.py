import os
from pathlib import Path
from tqdm import tqdm
from src.config import FOODSEG_LABELS, FOODSEG_IMAGES, DATA_DIR

def crear_etiquetas_mini():
    # ID Original FoodSeg103 -> Nuevo ID YOLO (0-4)
    # Revisa tu id2label.json para asegurar que estos IDs originales son los correctos
    MAPEO_CLASES = {
        58: 0,  # egg -> huevo
        60: 1,  # broccoli -> brocoli
        63: 2,  # rice -> arroz
        87: 3,  # chicken_duck -> pollo
        90: 4   # fish -> pescado
    }
    
    dest_base = DATA_DIR / "Nutrition_Mini5"
    
    for split in ["train", "val"]:
        src_labels = FOODSEG_LABELS / split
        src_images = FOODSEG_IMAGES / split
        
        dest_labels = dest_base / "labels" / split
        dest_images = dest_base / "images" / split
        
        dest_labels.mkdir(parents=True, exist_ok=True)
        dest_images.mkdir(parents=True, exist_ok=True)
        
        archivos_txt = list(src_labels.glob("*.txt"))
        
        for txt_path in tqdm(archivos_txt, desc=f"Procesando {split} (Symlinks)"):
            nuevas_lineas = []
            
            with open(txt_path, "r") as f:
                for linea in f:
                    partes = linea.strip().split()
                    if not partes: continue
                    clase_orig = int(partes[0])
                    
                    if clase_orig in MAPEO_CLASES:
                        nueva_linea = f"{MAPEO_CLASES[clase_orig]} " + " ".join(partes[1:])
                        nuevas_lineas.append(nueva_linea)
            
            if nuevas_lineas:
                # 1. Guardar el nuevo txt con los IDs del 0 al 4
                with open(dest_labels / txt_path.name, "w") as f:
                    f.write("\n".join(nuevas_lineas))
                
                # 2. TRUCO DE INGENIERÍA: Crear un acceso directo a la imagen en vez de copiarla
                img_origen = src_images / f"{txt_path.stem}.jpg"
                img_destino = dest_images / f"{txt_path.stem}.jpg"
                
                if img_origen.exists() and not img_destino.exists():
                    os.symlink(img_origen, img_destino)

if __name__ == "__main__":
    print("Iniciando extracción eficiente con Enlaces Simbólicos...")
    crear_etiquetas_mini()
    print("[ÉXITO] Mini-dataset creado en data/Nutrition_Mini5 sin duplicar imágenes.")