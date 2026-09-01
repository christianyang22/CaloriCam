"""
Módulo 3: Calculadora Nutricional (TFM Oficial - 103 Clases)
Convierte las estimaciones de masa (gramos) en valores calóricos y macronutrientes.
"""

class CalculadoraNutricional:
    def __init__(self):
        # Base de datos nutricional (Valores por cada 100 gramos)
        # Aquí puedes ir añadiendo los valores exactos de Nutrition5k para las 103 clases
        self.base_datos = {
            # Dulces y Postres
            "candy": {"kcal": 394, "prot": 0.0, "carb": 98.0, "gras": 0.0},
            "egg tart": {"kcal": 280, "prot": 5.0, "carb": 31.0, "gras": 15.0},
            "chocolate": {"kcal": 535, "prot": 7.0, "carb": 52.0, "gras": 30.0},
            "biscuit": {"kcal": 435, "prot": 7.0, "carb": 68.0, "gras": 14.0},
            "popcorn": {"kcal": 375, "prot": 11.0, "carb": 60.0, "gras": 4.5},
            "pudding": {"kcal": 135, "prot": 4.0, "carb": 21.0, "gras": 3.5},
            "ice cream": {"kcal": 207, "prot": 3.5, "carb": 24.0, "gras": 11.0},
            "cake": {"kcal": 410, "prot": 6.0, "carb": 55.0, "gras": 18.0},
            
            # Lácteos y Grasas
            "cheese butter": {"kcal": 748, "prot": 0.6, "carb": 1.0, "gras": 83.0},
            "milk": {"kcal": 65, "prot": 3.1, "carb": 4.7, "gras": 3.8},
            
            # Bebidas
            "wine": {"kcal": 71, "prot": 0.2, "carb": 0.2, "gras": 0.0},
            "milkshake": {"kcal": 105, "prot": 3.5, "carb": 16.0, "gras": 2.5},
            "coffee": {"kcal": 2, "prot": 0.2, "carb": 0.1, "gras": 0.0},
            "juice": {"kcal": 45, "prot": 0.4, "carb": 10.5, "gras": 0.1},
            "tea": {"kcal": 1, "prot": 0.0, "carb": 0.2, "gras": 0.0},
            
            # Frutos Secos y Semillas
            "almond": {"kcal": 604, "prot": 20.0, "carb": 5.7, "gras": 54.0},
            "red beans": {"kcal": 313, "prot": 21.4, "carb": 54.0, "gras": 1.1},
            "cashew": {"kcal": 577, "prot": 17.5, "carb": 30.0, "gras": 43.0},
            "soy": {"kcal": 422, "prot": 35.0, "carb": 15.0, "gras": 18.0},
            "walnut": {"kcal": 673, "prot": 14.3, "carb": 3.3, "gras": 63.5},
            "peanut": {"kcal": 599, "prot": 27.0, "carb": 7.9, "gras": 49.0},
            
            # Frutas
            "dried cranberries": {"kcal": 308, "prot": 0.1, "carb": 82.0, "gras": 1.4},
            "apple": {"kcal": 50, "prot": 0.3, "carb": 11.4, "gras": 0.2},
            "date": {"kcal": 279, "prot": 2.0, "carb": 71.0, "gras": 0.5},
            "apricot": {"kcal": 41, "prot": 0.8, "carb": 8.7, "gras": 0.1},
            "avocado": {"kcal": 136, "prot": 1.5, "carb": 5.9, "gras": 12.0},
            "banana": {"kcal": 91, "prot": 1.2, "carb": 20.0, "gras": 0.3},
            "strawberry": {"kcal": 40, "prot": 0.7, "carb": 7.0, "gras": 0.5},
            "cherry": {"kcal": 65, "prot": 0.9, "carb": 13.5, "gras": 0.4},
            "blueberry": {"kcal": 42, "prot": 0.6, "carb": 6.1, "gras": 0.6},
            "raspberry": {"kcal": 40, "prot": 1.3, "carb": 4.5, "gras": 0.3},
            "mango": {"kcal": 61, "prot": 0.6, "carb": 12.8, "gras": 0.5},
            "olives": {"kcal": 120, "prot": 1.0, "carb": 1.0, "gras": 12.5},
            "peach": {"kcal": 43, "prot": 0.6, "carb": 9.0, "gras": 0.1},
            "lemon": {"kcal": 27, "prot": 0.7, "carb": 3.1, "gras": 0.3},
            "pear": {"kcal": 46, "prot": 0.4, "carb": 10.6, "gras": 0.1},
            "fig": {"kcal": 65, "prot": 1.2, "carb": 12.9, "gras": 0.3},
            "pineapple": {"kcal": 50, "prot": 0.5, "carb": 11.5, "gras": 0.2},
            "grape": {"kcal": 67, "prot": 0.6, "carb": 15.5, "gras": 0.4},
            "kiwi": {"kcal": 52, "prot": 1.0, "carb": 10.6, "gras": 0.4},
            "melon": {"kcal": 28, "prot": 0.6, "carb": 5.7, "gras": 0.1},
            "orange": {"kcal": 42, "prot": 0.8, "carb": 8.6, "gras": 0.2},
            "watermelon": {"kcal": 20, "prot": 0.4, "carb": 4.5, "gras": 0.1},
            
            # Carnes, Aves y Embutidos
            "steak": {"kcal": 182, "prot": 21.0, "carb": 0.0, "gras": 10.5},
            "pork": {"kcal": 155, "prot": 22.0, "carb": 0.0, "gras": 7.5},
            "chicken duck": {"kcal": 165, "prot": 20.0, "carb": 0.0, "gras": 9.0},
            "sausage": {"kcal": 285, "prot": 12.5, "carb": 2.5, "gras": 25.0},
            "fried meat": {"kcal": 312, "prot": 15.0, "carb": 10.0, "gras": 23.0},
            "lamb": {"kcal": 225, "prot": 19.0, "carb": 0.0, "gras": 16.0},
            
            # Pescados y Mariscos
            "crab": {"kcal": 84, "prot": 18.0, "carb": 1.0, "gras": 1.2},
            "fish": {"kcal": 100, "prot": 18.0, "carb": 0.0, "gras": 3.0},
            "shellfish": {"kcal": 78, "prot": 15.0, "carb": 2.5, "gras": 1.0},
            "shrimp": {"kcal": 93, "prot": 20.0, "carb": 1.5, "gras": 0.8},
            
            # Huevos y Tofu
            "egg": {"kcal": 150, "prot": 12.5, "carb": 0.0, "gras": 11.1},
            "tofu": {"kcal": 76, "prot": 8.0, "carb": 1.9, "gras": 4.8},
            
            # Platos Preparados, Masas y Cereales
            "french fries": {"kcal": 290, "prot": 3.5, "carb": 38.0, "gras": 13.0},
            "sauce": {"kcal": 50, "prot": 1.0, "carb": 11.0, "gras": 0.5},
            "soup": {"kcal": 35, "prot": 2.0, "carb": 4.0, "gras": 1.0},
            "bread": {"kcal": 261, "prot": 8.5, "carb": 51.5, "gras": 1.6},
            "corn": {"kcal": 86, "prot": 3.3, "carb": 16.0, "gras": 1.2},
            "hamburg": {"kcal": 260, "prot": 13.0, "carb": 22.0, "gras": 12.0},
            "pizza": {"kcal": 250, "prot": 10.0, "carb": 30.0, "gras": 9.5},
            "hanamaki baozi": {"kcal": 227, "prot": 6.0, "carb": 45.0, "gras": 1.5},
            "wonton dumplings": {"kcal": 209, "prot": 9.0, "carb": 23.0, "gras": 8.0},
            "pasta": {"kcal": 135, "prot": 5.0, "carb": 26.0, "gras": 1.0},
            "noodles": {"kcal": 138, "prot": 4.5, "carb": 25.0, "gras": 2.1},
            "rice": {"kcal": 130, "prot": 2.7, "carb": 28.0, "gras": 0.3},
            "pie": {"kcal": 237, "prot": 3.0, "carb": 35.0, "gras": 10.0},
            
            # Vegetales y Hortalizas
            "eggplant": {"kcal": 21, "prot": 1.2, "carb": 2.6, "gras": 0.2},
            "potato": {"kcal": 73, "prot": 2.0, "carb": 15.0, "gras": 0.1},
            "garlic": {"kcal": 118, "prot": 5.3, "carb": 23.0, "gras": 0.3},
            "cauliflower": {"kcal": 27, "prot": 2.2, "carb": 3.1, "gras": 0.2},
            "tomato": {"kcal": 19, "prot": 0.9, "carb": 3.5, "gras": 0.2},
            "kelp": {"kcal": 43, "prot": 1.7, "carb": 9.6, "gras": 0.6},
            "seaweed": {"kcal": 45, "prot": 2.0, "carb": 8.0, "gras": 0.5},
            "spring onion": {"kcal": 29, "prot": 1.6, "carb": 4.3, "gras": 0.2},
            "rape": {"kcal": 20, "prot": 2.0, "carb": 3.0, "gras": 0.2},
            "ginger": {"kcal": 61, "prot": 1.5, "carb": 11.0, "gras": 0.7},
            "okra": {"kcal": 30, "prot": 1.9, "carb": 4.3, "gras": 0.1},
            "lettuce": {"kcal": 16, "prot": 1.3, "carb": 1.4, "gras": 0.2},
            "pumpkin": {"kcal": 27, "prot": 1.1, "carb": 4.6, "gras": 0.1},
            "cucumber": {"kcal": 12, "prot": 0.7, "carb": 1.9, "gras": 0.1},
            "white radish": {"kcal": 16, "prot": 0.7, "carb": 2.5, "gras": 0.1},
            "carrot": {"kcal": 33, "prot": 0.9, "carb": 5.8, "gras": 0.2},
            "asparagus": {"kcal": 18, "prot": 2.0, "carb": 1.7, "gras": 0.1},
            "bamboo shoots": {"kcal": 27, "prot": 2.6, "carb": 5.2, "gras": 0.3},
            "broccoli": {"kcal": 33, "prot": 3.1, "carb": 2.9, "gras": 0.3},
            "celery stick": {"kcal": 11, "prot": 0.9, "carb": 1.3, "gras": 0.2},
            "cilantro mint": {"kcal": 20, "prot": 2.1, "carb": 1.8, "gras": 0.5},
            "snow peas": {"kcal": 42, "prot": 2.8, "carb": 7.5, "gras": 0.2},
            "cabbage": {"kcal": 24, "prot": 1.3, "carb": 3.3, "gras": 0.2},
            "bean sprouts": {"kcal": 30, "prot": 3.0, "carb": 5.9, "gras": 0.2},
            "onion": {"kcal": 38, "prot": 1.2, "carb": 7.3, "gras": 0.2},
            "pepper": {"kcal": 18, "prot": 0.9, "carb": 2.5, "gras": 0.2},
            "green beans": {"kcal": 30, "prot": 1.9, "carb": 4.2, "gras": 0.2},
            "French beans": {"kcal": 30, "prot": 1.9, "carb": 4.2, "gras": 0.2},
            
            # Setas y Hongos
            "king oyster mushroom": {"kcal": 48, "prot": 3.3, "carb": 6.5, "gras": 0.5},
            "shiitake": {"kcal": 34, "prot": 2.2, "carb": 6.8, "gras": 0.5},
            "enoki mushroom": {"kcal": 37, "prot": 2.7, "carb": 7.8, "gras": 0.3},
            "oyster mushroom": {"kcal": 33, "prot": 3.3, "carb": 6.1, "gras": 0.4},
            "white button mushroom": {"kcal": 22, "prot": 3.1, "carb": 3.3, "gras": 0.3},
            
            # Ensaladas
            "salad": {"kcal": 20, "prot": 1.2, "carb": 3.5, "gras": 0.2}
        }
        
        # MECANISMO DE RESPALDO (Fallback)
        # Si YOLO detecta una clase de FoodSeg103 que no hemos rellenado arriba, 
        # aplicamos un promedio estándar para evitar devolver errores a la app móvil.
        self.valores_por_defecto = {"kcal": 150, "prot": 5.0, "carb": 15.0, "gras": 5.0}

    def calcular_nutrientes(self, nombre_alimento, gramos_estimados):
        """
        Interpola matemáticamente los valores en base a los gramos predichos por la IA.
        """
        # Limpieza de seguridad del string
        nombre_limpio = str(nombre_alimento).strip().lower()

        # Búsqueda en la base de datos
        if nombre_limpio in self.base_datos:
            datos = self.base_datos[nombre_limpio]
            es_defecto = False
        else:
            datos = self.valores_por_defecto
            es_defecto = True

        # Regla de tres simple (los valores base son por 100g)
        multiplicador = gramos_estimados / 100.0

        # Empaquetado del JSON de respuesta
        resultado = {
            "alimento": nombre_limpio,
            "gramos_predichos": round(gramos_estimados, 2),
            "calorias": round(datos["kcal"] * multiplicador, 2),
            "macronutrientes": {
                "proteinas_g": round(datos["prot"] * multiplicador, 2),
                "carbohidratos_g": round(datos["carb"] * multiplicador, 2),
                "grasas_g": round(datos["gras"] * multiplicador, 2)
            }
        }
        
        if es_defecto:
            resultado["aviso"] = "Aproximación genérica (Falta rellenar datos en Calculadora)"
            
        return resultado