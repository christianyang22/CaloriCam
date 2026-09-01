import shutil
from pathlib import Path
from tqdm import tqdm
from src.config import DATA_DIR

def aplanar_directorio_imagenes():
    """
    Recorre la estructura original de Google Cloud, busca dinámicamente
    la imagen RGB (independientemente de si es .png o .jpg) y la extrae a un
    directorio plano para facilitar su ingesta en PyTorch.
    """
    base_dir = DATA_DIR / "Nutrition5k_oficial"
    overhead_dir = base_dir / "realsense_overhead"
    img_dir = base_dir / "images"
    
    # Aseguramos que el directorio destino existe
    img_dir.mkdir(parents=True, exist_ok=True)
    
    if not overhead_dir.exists():
        print(f"[ERROR] No se encuentra el directorio: {overhead_dir}")
        return

    # Listamos todas las subcarpetas de platos
    platos = [d for d in overhead_dir.iterdir() if d.is_dir()]
    print(f"Detectados {len(platos)} directorios de platos descargados.")
    
    imagenes_procesadas = 0
    
    print("Extrayendo y renombrando imágenes RGB...")
    for plato_dir in tqdm(platos):
        dish_id = plato_dir.name
        
        # Búsqueda dinámica para evitar fallos por extensiones (.png, .jpg)
        posibles_imagenes = list(plato_dir.glob("rgb.*"))
        
        if posibles_imagenes:
            img_origen = posibles_imagenes[0]
            extension = img_origen.suffix
            img_destino = img_dir / f"{dish_id}{extension}"
            
            # Copiamos la imagen preservando su formato original
            shutil.copy2(img_origen, img_destino)
            imagenes_procesadas += 1

    print("\n" + "="*60)
    print("ESTRUCTURACIÓN COMPLETADA")
    print("="*60)
    print(f"  - Imágenes RGB extraídas y renombradas: {imagenes_procesadas}")
    print(f"  - Destino: {img_dir}")
    print("="*60)
    print("Puedes borrar la carpeta 'realsense_overhead' si deseas liberar espacio.")

if __name__ == "__main__":
    aplanar_directorio_imagenes()