import torch
import torch.nn as nn
import pytorch_lightning as pl
from torchvision import models

class FoodMassRegressor(pl.LightningModule):
    """
    Arquitectura de regresión basada en EfficientNet-B0 para inferir
    la masa en gramos a partir de una imagen RGB.
    """
    def __init__(self, lr=5e-4): # Learning rate reducido para proteger el backbone
        super().__init__()
        self.save_hyperparameters()
        self.lr = lr
        
        self.backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        in_features = self.backbone.classifier[1].in_features
        
        self.backbone.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 1)
        )
        
        # HuberLoss: Combina la robustez de MAE frente a outliers con la suavidad de MSE
        self.criterio = nn.HuberLoss(delta=1.0)

    def forward(self, x):
        return self.backbone(x)

    def training_step(self, batch, batch_idx):
        imagenes, etiquetas = batch
        predicciones = self(imagenes)
        
        loss = self.criterio(predicciones, etiquetas)
        self.log("train_loss", loss, on_step=True, on_epoch=True, prog_bar=True, logger=True)
        return loss

    def validation_step(self, batch, batch_idx):
        imagenes, etiquetas = batch
        predicciones = self(imagenes)
        
        val_loss = self.criterio(predicciones, etiquetas)
        self.log("val_loss", val_loss, on_epoch=True, prog_bar=True, logger=True)
        return val_loss

    def configure_optimizers(self):
        optimizer = torch.optim.AdamW(self.parameters(), lr=self.lr)
        
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, 
            mode='min', 
            factor=0.5, 
            patience=3
        )
        
        return {
            "optimizer": optimizer,
            "lr_scheduler": {
                "scheduler": scheduler,
                "monitor": "val_loss",
                "frequency": 1
            }
        }

if __name__ == "__main__":
    def probar_arquitectura():
        print("Iniciando validación de la arquitectura EfficientNet-B0...")
        modelo = FoodMassRegressor()
        modelo.eval()
        tensor_prueba = torch.randn(4, 3, 224, 224)
        with torch.no_grad():
            salida = modelo(tensor_prueba)
        print(f"Dimensiones de salida: {salida.shape} (Esperado: [4, 1])")
    probar_arquitectura()