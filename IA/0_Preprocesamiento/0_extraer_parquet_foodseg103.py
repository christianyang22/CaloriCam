from pathlib import Path
from datasets import load_dataset
from tqdm import tqdm
from src.config import FOODSEG_BASE

def extraer_split(archivos_parquet: list, nombre_split: str) -> None:
    """
    Deserializa archivos Parquet de Hugging Face para extraer de forma física
    las imágenes RGB originales y las máscaras de segmentación PNG.
    """
    base_dir = FOODSEG_BASE / "raw" / "Images"
    img_dir = base_dir / "img_dir" / nombre_split
    ann_dir = base_dir / "ann_dir" / nombre_split
    
    img_dir.mkdir(parents=True, exist_ok=True)
    ann_dir.mkdir(parents=True, exist_ok=True)
    
    if not archivos_parquet:
        return

    ds = load_dataset("parquet", data_files=archivos_parquet, split="train")
    
    col_img = 'image' if 'image' in ds.column_names else ds.column_names[0]
    col_mask = 'label' if 'label' in ds.column_names else ds.column_names[1]
    
    for i, item in enumerate(tqdm(ds, desc=f"Extrayendo {nombre_split}")):
        file_name = f"{i:06d}"
        
        imagen = item[col_img]
        mascara = item[col_mask]
        
        imagen.save(img_dir / f"{file_name}.jpg")
        mascara.save(ann_dir / f"{file_name}.png")

def main() -> None:
    """
    Punto de entrada principal para la extracción de datasets comprimidos en Parquet.
    """
    parquet_dir = FOODSEG_BASE / "raw" / "repo_hf" / "data"
    
    train_files = [str(p) for p in parquet_dir.glob("train-*.parquet")]
    val_files = [str(p) for p in parquet_dir.glob("validation-*.parquet")]
    
    extraer_split(train_files, "train")
    extraer_split(val_files, "test")

if __name__ == "__main__":
    main()