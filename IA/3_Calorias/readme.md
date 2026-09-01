# Módulo 3: Mapeo Nutricional

Este directorio contiene la lógica para calcular la información nutricional (calorías y macronutrientes) a partir de las predicciones de los modelos de IA (clase detectada y masa estimada).

## Estructura del directorio

```text
3_Calorias/
├── calculadora.py
└── calculadora_v1.py
```

## Descripción de los scripts

### calculadora.py (MVP)
Versión inicial para validar la lógica matemática.
* Incluye un diccionario con 5 alimentos básicos y sus macronutrientes por 100g (basado en USDA/BEDCA).
* Calcula los valores finales aplicando una regla de tres con los gramos predichos por el modelo de regresión.
* Incluye un bloque de pruebas para verificar el formato de salida.

### calculadora_v1.py (TFM Oficial)
Versión ampliada para soportar más clases del dataset FoodSeg103 y formatear la salida para la API.
* Añade soporte para nuevos alimentos al diccionario.
* Implementa un mecanismo de respaldo (fallback): si se detecta una clase no registrada en la base de datos, aplica unos valores por defecto y añade una advertencia al JSON para evitar que la aplicación falle.
* Estructura la respuesta separando calorías de macronutrientes.

## Ejecución

Este módulo no requiere entrenamiento. Se utiliza como puente entre los modelos y la aplicación final.

Para ejecutar las pruebas unitarias locales:

```bash
python calculadora.py
```