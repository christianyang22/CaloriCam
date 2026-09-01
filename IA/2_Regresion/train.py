import pytorch_lightning as pl
from pytorch_lightning.callbacks import ModelCheckpoint, EarlyStopping, LearningRateMonitor
from pathlib import Path

from data_module import NutritionDataModule
from model import FoodMassRegressor

def entrenar_modelo():
    """
    Punto de entrada para el entrenamiento del modelo de regresión de masa.
    """
    print("Inicializando configuración de entrenamiento...")
    
    data_module = NutritionDataModule(batch_size=32, num_workers=4)
    modelo = FoodMassRegressor(lr=5e-4)
    
    # Ruta calculada dinámicamente: IA/2_Regresion/runs
    ruta_logs = Path(__file__).resolve().parent / "runs"
    ruta_logs.mkdir(parents=True, exist_ok=True)
    
    checkpoint_callback = ModelCheckpoint(
        dirpath=ruta_logs / "checkpoints",
        filename="efficientnet_mass_{epoch:02d}_{val_loss:.2f}",
        save_top_k=1,
        monitor="val_loss",
        mode="min"
    )
    
    early_stop_callback = EarlyStopping(
        monitor="val_loss",
        patience=15,
        mode="min",
        verbose=True
    )
    
    # Nuevo callback para monitorizar la caída del learning rate
    lr_monitor = LearningRateMonitor(logging_interval='epoch')
    
    trainer = pl.Trainer(
        max_epochs=150,
        callbacks=[checkpoint_callback, early_stop_callback, lr_monitor],
        default_root_dir=ruta_logs,
        accelerator="auto",
        devices="auto",
        log_every_n_steps=10
    )
    
    print("\n" + "="*50)
    print("INICIANDO BUCLE DE ENTRENAMIENTO")
    print("="*50)
    
    trainer.fit(
        model=modelo,
        datamodule=data_module
    )
    
    print("\nEntrenamiento finalizado. Mejores pesos guardados en:", checkpoint_callback.best_model_path)

if __name__ == "__main__":
    pl.seed_everything(42)
    entrenar_modelo()