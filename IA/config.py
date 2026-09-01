from pathlib import Path

# Raíz del proyecto calculada automáticamente de forma dinámica (sube dos niveles desde src/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Directorios principales
DATA_DIR = PROJECT_ROOT / "data"
SRC_DIR = PROJECT_ROOT / "src"

# Subrutas para FoodSeg103
FOODSEG_BASE = DATA_DIR / "FoodSeg103"
FOODSEG_RAW_ANN = FOODSEG_BASE / "raw" / "Images" / "ann_dir"
FOODSEG_RAW_IMG = FOODSEG_BASE / "raw" / "Images" / "img_dir"
FOODSEG_DATASET = FOODSEG_BASE / "dataset"
FOODSEG_IMAGES = FOODSEG_DATASET / "images"
FOODSEG_LABELS = FOODSEG_DATASET / "labels"