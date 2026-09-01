import shutil
from pathlib import Path
from tqdm import tqdm
from src.config import FOODSEG_RAW_IMG, FOODSEG_IMAGES

def sincronizar_split(nombre_origen: str, nombre_destino: str) -> None:
    """
    Copia las imágenes RGB desde la ruta de datos crudos hacia la estructura
    definitiva de entrenamiento requerida por el framework YOLO.
    """
    src_dir = FOODSEG_RAW_IMG / nombre_origen
    dest_dir = FOODSEG_IMAGES / nombre_destino
    
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    imagenes = list(src_dir.glob("*.jpg"))
    if not imagenes:
        return

    for img_path in tqdm(imagenes, desc=f"Sincronizando {nombre_destino}"):
        dest_path = dest_dir / img_path.name
        if not dest_path.exists():
            shutil.copy(img_path, dest_path)

def main() -> None:
    """
    Punto de entrada para la sincronización de imágenes de entrenamiento y validación.
    """
    sincronizar_split("train", "train")
    sincronizar_split("test", "val")

if __name__ == "__main__":
    main()