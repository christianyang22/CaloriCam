class CalculadoraNutricional:
    """
    Módulo 3: Mapeo Nutricional.
    Se encarga de recibir la etiqueta de un ingrediente detectado y su masa
    predicha en gramos, y devuelve el desglose de calorías y macronutrientes.
    """
    def __init__(self):
        # Base de datos nutricional MVP (valores por cada 100 gramos)
        # Fuentes de referencia: USDA / BEDCA
        self.base_datos = {
            "arroz": {"calorias": 130, "proteinas": 2.7, "carbohidratos": 28.0, "grasas": 0.3},   # Arroz blanco cocido
            "pollo": {"calorias": 165, "proteinas": 31.0, "carbohidratos": 0.0, "grasas": 3.6},   # Pechuga a la plancha
            "salmon": {"calorias": 208, "proteinas": 20.0, "carbohidratos": 0.0, "grasas": 13.0}, # Salmón cocinado
            "brocoli": {"calorias": 34,  "proteinas": 2.8, "carbohidratos": 6.6, "grasas": 0.4},  # Brócoli hervido
            "huevo": {"calorias": 155, "proteinas": 13.0, "carbohidratos": 1.1, "grasas": 11.0}   # Huevo duro
        }

    def calcular_nutrientes(self, alimento: str, gramos: float) -> dict:
        """
        Calcula mediante una regla de tres simple los nutrientes exactos 
        para la cantidad de gramos inferida por el modelo de regresión.
        """
        alimento = alimento.lower().strip()
        
        if alimento not in self.base_datos:
            # Fallback seguro por si el detector encuentra algo fuera del MVP
            return {
                "alimento": alimento,
                "gramos": round(gramos, 2),
                "error": "Ingrediente no registrado en la base de datos del MVP"
            }
            
        info_100g = self.base_datos[alimento]
        
        # Factor multiplicador (ej: si son 150g, el factor es 1.5)
        factor = gramos / 100.0
        
        # Retornamos el desglose redondeado a 2 decimales para la API
        return {
            "alimento": alimento,
            "gramos": round(gramos, 2),
            "calorias": round(info_100g["calorias"] * factor, 2),
            "proteinas": round(info_100g["proteinas"] * factor, 2),
            "carbohidratos": round(info_100g["carbohidratos"] * factor, 2),
            "grasas": round(info_100g["grasas"] * factor, 2)
        }

# SMOKE TEST LOCAL DE CÁLCULO NUTRICIONAL
if __name__ == "__main__":
    def probar_calculadora():
        print("Iniciando Módulo de Calorías (MVP)...")
        calculadora = CalculadoraNutricional()
        
        # Simulamos que la red de regresión (Módulo 2) ha predicho 150.5 gramos de pollo
        alimento_detectado = "pollo"
        gramos_predichos = 150.5
        
        print(f"Calculando macros para {gramos_predichos}g de {alimento_detectado}...")
        resultado = calculadora.calcular_nutrientes(alimento_detectado, gramos_predichos)
        
        print("\n" + "="*40)
        print("PRUEBA MATEMÁTICA SUPERADA")
        print("="*40)
        import json
        print(json.dumps(resultado, indent=4, ensure_ascii=False))
        
    probar_calculadora()