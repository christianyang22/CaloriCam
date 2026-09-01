import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from pathlib import Path
import pytorch_lightning as pl

# Calculamos la ruta absoluta a tu carpeta 'data' basandonos en la ubicacion de este script
# __file__ = TFMProyecto/IA/2_Regresion/data_module.py
# .parent.parent.parent = TFMProyecto
RUTA_RAIZ = Path(__file__).resolve().parent.parent.parent
DATA_DIR = RUTA_RAIZ / "data"

class Nutrition5kDataset(Dataset):
    """
    Dataset de PyTorch para cargar las imágenes completas de Nutrition5k
    y su masa total en gramos para la tarea de regresión.
    """
    def __init__(self, df_metadatos, img_dir, transform=None):
        self.df_metadatos = df_metadatos
        self.img_dir = Path(img_dir)
        self.transform = transform

    def __len__(self):
        return len(self.df_metadatos)

    def __getitem__(self, idx):
        fila = self.df_metadatos.iloc[idx]
        dish_id = fila["dish_id"]
        masa_total = fila["total_mass"]

        img_path_png = self.img_dir / f"{dish_id}.png"
        img_path_jpg = self.img_dir / f"{dish_id}.jpg"
        img_path = img_path_png if img_path_png.exists() else img_path_jpg
        
        try:
            imagen = Image.open(img_path).convert("RGB")
        except FileNotFoundError:
            imagen = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            imagen = self.transform(imagen)

        etiqueta = torch.tensor([masa_total], dtype=torch.float32)
        return imagen, etiqueta

class NutritionDataModule(pl.LightningDataModule):
    """
    Módulo de datos para PyTorch Lightning.
    """
    def __init__(self, batch_size=32, num_workers=4):
        super().__init__()
        self.batch_size = batch_size
        self.num_workers = num_workers
        
        self.base_dir = DATA_DIR / "Nutrition5k_oficial"
        self.img_dir = self.base_dir / "images"
        self.csv_path = self.base_dir / "metadata" / "dish_metadata_cafe1.csv"
        
    def setup(self, stage=None):
        columnas = ["dish_id", "total_mass", "calories", "fat", "carb", "protein"]
        df = pd.read_csv(
            self.csv_path, 
            usecols=[0, 1, 2, 3, 4, 5], 
            names=columnas, 
            engine="python"
        )
        
        imagenes_existentes = set([f.stem for f in self.img_dir.glob("*.*") if f.suffix in [".png", ".jpg"]])
        df = df[df["dish_id"].isin(imagenes_existentes)].copy()
        
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        corte = int(len(df) * 0.8)
        
        df_train = df.iloc[:corte]
        df_val = df.iloc[corte:]
        
        # Optimizacion: Data Augmentation agresivo para platos vistos desde arriba
        self.transform_train = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomRotation(180),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        self.transform_val = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        self.train_dataset = Nutrition5kDataset(df_train, self.img_dir, self.transform_train)
        self.val_dataset = Nutrition5kDataset(df_val, self.img_dir, self.transform_val)

    def train_dataloader(self):
        return DataLoader(
            self.train_dataset, 
            batch_size=self.batch_size, 
            shuffle=True, 
            num_workers=self.num_workers
        )

    def val_dataloader(self):
        return DataLoader(
            self.val_dataset, 
            batch_size=self.batch_size, 
            shuffle=False, 
            num_workers=self.num_workers
        )

if __name__ == "__main__":
    def probar_datos():
        print("Iniciando DataModule...")
        dm = NutritionDataModule(batch_size=4)
        dm.setup()
        loader = dm.train_dataloader()
        lote_imagenes, lote_masas = next(iter(loader))
        print(f"Forma del tensor de imágenes: {lote_imagenes.shape}")
        print(f"Forma del tensor de etiquetas: {lote_masas.shape}")
    probar_datos()