import io
import sys
import uuid
import csv
import json
import jwt 
import os
from datetime import datetime, date, time, timedelta
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import List
from contextlib import asynccontextmanager
import uvicorn
from PIL import Image
import torch
from torchvision import transforms
from ultralytics import YOLO

from sqlalchemy.orm import Session
from database import get_db, UsuarioDB, ComidaDB, obtener_password_hash, verificar_password, crear_token_acceso, SECRET_KEY, ALGORITHM 

ruta_raiz = Path(__file__).parent.parent
sys.path.append(str(ruta_raiz / "IA" / "2_Regresion"))
sys.path.append(str(ruta_raiz / "IA" / "3_Calorias"))

from model import FoodMassRegressor
from calculadora import CalculadoraNutricional

DIR_PESOS = Path(__file__).parent / "pesos"
RUTA_YOLO = DIR_PESOS / "yolo11m_best.pt"
rutas_ckpt = list(DIR_PESOS.glob("*.ckpt"))
RUTA_REGRESION = rutas_ckpt[0] if rutas_ckpt else None

DIR_DATOS = Path(__file__).parent / "datos_reentrenamiento"
DIR_IMG = DIR_DATOS / "imagenes"
DIR_AVATARES = DIR_DATOS / "avatares" 
DIR_IMG.mkdir(parents=True, exist_ok=True)
DIR_AVATARES.mkdir(parents=True, exist_ok=True)
ARCHIVO_CORRECCIONES = DIR_DATOS / "correcciones_dataset.csv"

# Inicialización del archivo de registro para el bucle de retroalimentación
if not ARCHIVO_CORRECCIONES.exists():
    with open(ARCHIVO_CORRECCIONES, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["imagen_id", "etiqueta_ia", "etiqueta_usuario", "gramos_ia", "gramos_usuario", "coordenadas_cajas"])

class CorreccionUsuario(BaseModel):
    imagen_id: str
    etiqueta_ia: str
    etiqueta_usuario: str
    gramos_ia: float
    gramos_usuario: float
    coordenadas_cajas: List[list] = []

class UsuarioCrear(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    terminos_aceptados: bool = True

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    password_antigua: str
    password_nueva: str

class CambiarEmail(BaseModel):
    email_nuevo: EmailStr
    password_actual: str

class PerfilUsuario(BaseModel):
    nombre: str = None 
    peso_kg: float
    altura_cm: int
    edad: int
    genero: str
    objetivo: str
    meta_calorias: int

class PlatoGuardar(BaseModel):
    imagen_id: str
    calorias_totales: float
    proteinas_g: float
    carbohidratos_g: float
    grasas_g: float
    ingredientes_json: str
    fecha_local: str = None 

class MetaManual(BaseModel):
    meta_calorias: int

modelos = {}

transformacion_regresion = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.
    Carga los modelos de Deep Learning (YOLO y EfficientNet) en memoria RAM/VRAM 
    una única vez al arrancar el servidor. Esto evita la sobrecarga de leer los 
    pesos desde disco en cada petición de inferencia.
    """
    print("Cargando modelo YOLOv11 (103 Clases)...")
    modelos["yolo"] = YOLO(RUTA_YOLO)
    
    print(f"Cargando EfficientNet-B0 desde {RUTA_REGRESION.name}...")
    regresor = FoodMassRegressor.load_from_checkpoint(RUTA_REGRESION)
    regresor.eval() 
    if torch.cuda.is_available():
        regresor = regresor.to('cuda')
    modelos["regresion"] = regresor
        
    print("Inicializando Calculadora Nutricional...")
    modelos["calculadora"] = CalculadoraNutricional()

    print("Todos los modelos cargados en memoria y listos.")
    yield
    modelos.clear()

app = FastAPI(title="Food API TFM", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependencia de FastAPI para proteger endpoints privados.
    Decodifica el token JWT de la cabecera Authorization y recupera el usuario 
    asociado desde la base de datos.
    """
    credenciales_excepcion = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: 
            raise credenciales_excepcion
    except jwt.PyJWTError:
        raise credenciales_excepcion
        
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == email).first()
    if usuario is None:
        raise credenciales_excepcion
    return usuario


# Endpoints de usuarios y perfil

@app.post("/registro", status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario: UsuarioCrear, db: Session = Depends(get_db)):
    db_user = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    hashed_password = obtener_password_hash(usuario.password)
    nuevo_usuario = UsuarioDB(
        nombre=usuario.nombre, email=usuario.email, 
        password_hash=hashed_password, terminos_aceptados=usuario.terminos_aceptados
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    token = crear_token_acceso(data={"sub": nuevo_usuario.email})
    return {"status": "éxito", "usuario_id": nuevo_usuario.id, "token": token}

@app.post("/login")
def login_usuario(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    db_user = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if not db_user or not verificar_password(usuario.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    token = crear_token_acceso(data={"sub": db_user.email})
    return {
        "status": "éxito", "usuario_id": db_user.id, "nombre": db_user.nombre,
        "email": db_user.email, "token": token, "avatar_id": db_user.avatar_id,
        "onboarding_completado": db_user.onboarding_completado,
        "meta_calorias": db_user.meta_calorias,
        "peso_kg": db_user.peso_kg,
        "altura_cm": db_user.altura_cm,
        "edad": db_user.edad,
        "genero": db_user.genero,
        "objetivo": db_user.objetivo
    }

@app.post("/subir_avatar")
async def subir_avatar(imagen: UploadFile = File(...), usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    contenido = await imagen.read()
    img_pil = Image.open(io.BytesIO(contenido)).convert("RGB")
    nuevo_avatar_id = str(uuid.uuid4())
    img_pil.save(DIR_AVATARES / f"{nuevo_avatar_id}.jpg")
    
    if usuario_actual.avatar_id:
        vieja_ruta = DIR_AVATARES / f"{usuario_actual.avatar_id}.jpg"
        if vieja_ruta.exists(): 
            vieja_ruta.unlink()
            
    usuario_actual.avatar_id = nuevo_avatar_id
    db.commit()
    return {"status": "éxito", "avatar_id": nuevo_avatar_id}

@app.put("/cambiar_password")
def cambiar_password(datos: PasswordChange, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    if not verificar_password(datos.password_antigua, usuario_actual.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña antigua es incorrecta.")
    usuario_actual.password_hash = obtener_password_hash(datos.password_nueva)
    db.commit()
    return {"status": "éxito"}

@app.put("/cambiar_email")
def cambiar_email(datos: CambiarEmail, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    if not verificar_password(datos.password_actual, usuario_actual.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña es incorrecta.")
    
    if datos.email_nuevo.lower() == usuario_actual.email.lower():
        raise HTTPException(status_code=400, detail="El nuevo correo es igual al actual.")
        
    existe = db.query(UsuarioDB).filter(UsuarioDB.email == datos.email_nuevo.lower()).first()
    if existe:
        raise HTTPException(status_code=400, detail="Este correo ya está en uso por otra cuenta.")
        
    usuario_actual.email = datos.email_nuevo.lower()
    db.commit()
    nuevo_token = crear_token_acceso(data={"sub": usuario_actual.email})
    return {"status": "éxito", "token": nuevo_token, "email": usuario_actual.email}

@app.delete("/borrar_cuenta")
def borrar_cuenta(usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    db.delete(usuario_actual) 
    db.commit()
    return {"status": "éxito"}

@app.put("/actualizar_perfil")
def actualizar_perfil(datos: PerfilUsuario, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    if datos.nombre:
        usuario_actual.nombre = datos.nombre
    usuario_actual.peso_kg = datos.peso_kg
    usuario_actual.altura_cm = datos.altura_cm
    usuario_actual.edad = datos.edad
    usuario_actual.genero = datos.genero
    usuario_actual.objetivo = datos.objetivo
    usuario_actual.meta_calorias = datos.meta_calorias
    usuario_actual.onboarding_completado = True
    db.commit()
    return {"status": "éxito"}

@app.put("/actualizar_meta_manual")
def actualizar_meta_manual(datos: MetaManual, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    usuario_actual.meta_calorias = datos.meta_calorias
    db.commit()
    return {"status": "éxito"}


# Endpoints de comidas e historial

@app.get("/resumen_hoy")
def obtener_resumen_hoy(fecha_local: str = None, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    if fecha_local:
        fecha_ref = datetime.strptime(fecha_local, "%Y-%m-%d").date()
    else:
        fecha_ref = date.today()
        
    hoy_inicio = datetime.combine(fecha_ref, time.min)
    hoy_fin = datetime.combine(fecha_ref, time.max)
    
    comidas_hoy = db.query(ComidaDB).filter(
        ComidaDB.usuario_id == usuario_actual.id,
        ComidaDB.fecha >= hoy_inicio,
        ComidaDB.fecha <= hoy_fin
    ).all()
    
    calorias_hoy = sum(c.calorias_totales for c in comidas_hoy)
    proteinas_hoy = sum(c.proteinas_g for c in comidas_hoy)
    carbohidratos_hoy = sum(c.carbohidratos_g for c in comidas_hoy)
    grasas_hoy = sum(c.grasas_g for c in comidas_hoy)
    
    return {
        "status": "éxito", 
        "calorias_consumidas": round(calorias_hoy, 2),
        "proteinas_consumidas": round(proteinas_hoy, 2),
        "carbohidratos_consumidas": round(carbohidratos_hoy, 2),
        "grasas_consumidas": round(grasas_hoy, 2),
        "meta_calorias": usuario_actual.meta_calorias or 2000,
        "objetivo": usuario_actual.objetivo or "mantener",
        "platos_hoy": len(comidas_hoy)
    }

@app.get("/resumen_semanal")
def obtener_resumen_semanal(fecha_local: str = None, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    if fecha_local:
        hoy = datetime.strptime(fecha_local, "%Y-%m-%d").date()
    else:
        hoy = date.today()
        
    nombres_dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    historial_semana = []
    
    # Rango de consulta: Desde hace 6 días (00:00) hasta hoy (23:59)
    fecha_inicio = datetime.combine(hoy - timedelta(days=6), time.min)
    fecha_fin = datetime.combine(hoy, time.max)
    
    # Se consulta en bloque para optimizar el acceso a la base de datos
    comidas_rango = db.query(ComidaDB).filter(
        ComidaDB.usuario_id == usuario_actual.id,
        ComidaDB.fecha >= fecha_inicio,
        ComidaDB.fecha <= fecha_fin
    ).all()
    
    for i in range(6, -1, -1):
        dia_iteracion = hoy - timedelta(days=i)
        
        calorias_dia = sum(c.calorias_totales for c in comidas_rango if c.fecha.date() == dia_iteracion)
        
        historial_semana.append({
            "dia_nombre": nombres_dias[dia_iteracion.weekday()],
            "fecha": str(dia_iteracion),
            "calorias": round(calorias_dia, 2)
        })

    return {
        "status": "éxito",
        "meta_calorias": usuario_actual.meta_calorias or 2000,
        "semana": historial_semana
    }

@app.get("/historial")
def obtener_historial(usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    comidas = db.query(ComidaDB).filter(ComidaDB.usuario_id == usuario_actual.id).order_by(ComidaDB.fecha.desc()).all()
    return {"status": "éxito", "historial": comidas}

@app.post("/guardar_plato")
def guardar_plato(plato: PlatoGuardar, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    fecha_obj = datetime.now()
    if plato.fecha_local:
        try:
            fecha_obj = datetime.strptime(plato.fecha_local, "%Y-%m-%dT%H:%M:%S")
        except:
            pass

    nueva_comida = ComidaDB(
        usuario_id=usuario_actual.id,
        imagen_id=plato.imagen_id,
        fecha=fecha_obj,
        calorias_totales=plato.calorias_totales,
        proteinas_g=plato.proteinas_g,
        carbohidratos_g=plato.carbohidratos_g,
        grasas_g=plato.grasas_g,
        ingredientes_json=plato.ingredientes_json
    )
    db.add(nueva_comida)
    db.commit()
    return {"status": "éxito"}

@app.delete("/comida/{comida_id}")
def borrar_comida(comida_id: int, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    comida = db.query(ComidaDB).filter(ComidaDB.id == comida_id, ComidaDB.usuario_id == usuario_actual.id).first()
    if comida:
        db.delete(comida)
        db.commit()
        return {"status": "éxito"}
    raise HTTPException(status_code=404, detail="Comida no encontrada")


# IA y Data flywheel

@app.get("/clases_disponibles")
async def obtener_clases():
    if "yolo" in modelos:
        clases = sorted(list(modelos["yolo"].names.values()))
        if "other" not in clases: 
            clases.append("other")
        return {"status": "éxito", "clases": clases}
    return {"status": "error", "clases": ["other"]}

@app.post("/analizar_plato")
async def analizar_plato(
    imagen: UploadFile = File(...), 
    usuario_actual: UsuarioDB = Depends(obtener_usuario_actual), 
    db: Session = Depends(get_db)
):
    """
    Pipeline principal de inferencia (Corregido). 
    1. EfficientNet predice la masa total con la imagen completa.
    2. YOLOv11 localiza los ingredientes.
    3. Se reparte la masa total proporcionalmente al área de cada bounding box.
    """
    contenido = await imagen.read()
    img_pil = Image.open(io.BytesIO(contenido)).convert("RGB")
    
    imagen_id = str(uuid.uuid4())
    img_pil.save(DIR_IMG / f"{imagen_id}.jpg")
    
    # -----------------------------------------------------------------
    # 1. PREDICCIÓN DE MASA TOTAL (IMAGEN COMPLETA)
    # -----------------------------------------------------------------
    tensor_plato = transformacion_regresion(img_pil).unsqueeze(0).to(modelos["regresion"].device)
    with torch.no_grad():
        masa_total_predicha = modelos["regresion"](tensor_plato).item()
    
    # Evitamos pesos irreales por debajo de 10g para un plato
    masa_total_predicha = max(10.0, masa_total_predicha)
    
    # -----------------------------------------------------------------
    # 2. DETECCIÓN YOLO Y CÁLCULO DE ÁREAS
    # -----------------------------------------------------------------
    resultados_yolo = modelos["yolo"](img_pil, verbose=False, conf=0.35, iou=0.5, agnostic_nms=True)
    
    cajas_detectadas = []
    area_total_cajas = 0.0
    
    for resultado in resultados_yolo:
        cajas = resultado.boxes
        for caja in cajas:
            x1, y1, x2, y2 = caja.xyxy[0].tolist()
            id_clase = int(caja.cls[0].item())
            nombre_clase = resultado.names[id_clase]
            
            # Cálculo del área de esta caja (ancho * alto)
            area_caja = (x2 - x1) * (y2 - y1)
            area_total_cajas += area_caja
            
            # Buscar alternativas por si el usuario quiere corregir
            alternativas = [nombre_clase]
            for otra_caja in cajas:
                otra_id = int(otra_caja.cls[0].item())
                otra_nombre = resultado.names[otra_id]
                if otra_nombre not in alternativas:
                    alternativas.append(otra_nombre)
            
            alternativas = alternativas[:4]
            if "other" not in alternativas:
                alternativas.append("other")
                
            cajas_detectadas.append({
                "nombre": nombre_clase,
                "coords": [x1, y1, x2, y2],
                "area": area_caja,
                "alternativas": alternativas
            })

    # -----------------------------------------------------------------
    # 3. REPARTO PROPORCIONAL Y CÁLCULO NUTRICIONAL
    # -----------------------------------------------------------------
    ingredientes_detectados = []
    agrupacion = {}
    
    calorias_totales = 0.0
    gramos_totales = 0.0
    proteinas_totales = 0.0
    carbohidratos_totales = 0.0
    grasas_totales = 0.0
    
    for det in cajas_detectadas:
        # Qué porcentaje del plato ocupa este ingrediente
        proporcion = det["area"] / area_total_cajas if area_total_cajas > 0 else 0
        
        # Asignamos los gramos proporcionales
        gramos_ingrediente = masa_total_predicha * proporcion
        gramos_ingrediente = max(1.0, gramos_ingrediente) # Mínimo 1 gramo
        
        # Calculamos macros basados en sus gramos reales
        datos_nutricionales = modelos["calculadora"].calcular_nutrientes(det["nombre"], gramos_ingrediente)
        
        cal = datos_nutricionales.get("calorias", 0)
        p_g = datos_nutricionales.get("macronutrientes", {}).get("proteinas_g", 0)
        c_g = datos_nutricionales.get("macronutrientes", {}).get("carbohidratos_g", 0)
        g_g = datos_nutricionales.get("macronutrientes", {}).get("grasas_g", 0)
        
        calorias_totales += cal
        gramos_totales += gramos_ingrediente
        proteinas_totales += p_g
        carbohidratos_totales += c_g
        grasas_totales += g_g
        
        ingredientes_detectados.append({
            "ingrediente": det["nombre"],
            "coordenadas_caja": [round(c) for c in det["coords"]],
            "estimacion_nutricional": datos_nutricionales,
            "gramos_crudos": gramos_ingrediente
        })
        
        # Agrupación para el frontend (ej. sumar todos los arroces detectados)
        if det["nombre"] not in agrupacion:
            agrupacion[det["nombre"]] = {
                "ingrediente": det["nombre"],
                "gramos_totales": 0.0,
                "calorias_totales": 0.0,
                "macronutrientes": {"proteinas_g": 0.0, "carbohidratos_g": 0.0, "grasas_g": 0.0},
                "aviso": datos_nutricionales.get("aviso", None)
            }
            
        agrupacion[det["nombre"]]["gramos_totales"] += gramos_ingrediente
        agrupacion[det["nombre"]]["calorias_totales"] += cal
        agrupacion[det["nombre"]]["macronutrientes"]["proteinas_g"] += p_g
        agrupacion[det["nombre"]]["macronutrientes"]["carbohidratos_g"] += c_g
        agrupacion[det["nombre"]]["macronutrientes"]["grasas_g"] += g_g

    lista_agrupada = []
    for clase, datos in agrupacion.items():
        datos["gramos_totales"] = round(datos["gramos_totales"], 2)
        datos["calorias_totales"] = round(datos["calorias_totales"], 2)
        datos["macronutrientes"]["proteinas_g"] = round(datos["macronutrientes"]["proteinas_g"], 2)
        datos["macronutrientes"]["carbohidratos_g"] = round(datos["macronutrientes"]["carbohidratos_g"], 2)
        datos["macronutrientes"]["grasas_g"] = round(datos["macronutrientes"]["grasas_g"], 2)
        lista_agrupada.append(datos)

    # Registro en CSV para Data Flywheel
    try:
        with open(ARCHIVO_CORRECCIONES, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for det in ingredientes_detectados:
                writer.writerow([
                    imagen_id, det["ingrediente"], det["ingrediente"],
                    round(det["gramos_crudos"], 2), round(det["gramos_crudos"], 2),
                    str([det["coordenadas_caja"]])
                ])
    except Exception as e:
        print(f"Error guardando pseudo-etiquetas base: {e}")
            
    return {
        "status": "éxito",
        "imagen_id": imagen_id,
        "resumen": {
            "ingredientes_totales": len(ingredientes_detectados),
            "clases_unicas": len(lista_agrupada),
            "calorias_totales_plato": round(calorias_totales, 2),
            "gramos_totales_plato": round(gramos_totales, 2),
            "macronutrientes_totales": {
                "proteinas_g": round(proteinas_totales, 2),
                "carbohidratos_g": round(carbohidratos_totales, 2),
                "grasas_g": round(grasas_totales, 2)
            }
        },
        "detalles": ingredientes_detectados,
        "agrupados": lista_agrupada
    }

@app.post("/corregir_prediccion")
async def recibir_correccion(correccion: CorreccionUsuario, usuario_actual: UsuarioDB = Depends(obtener_usuario_actual)):
    try:
        with open(ARCHIVO_CORRECCIONES, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                correccion.imagen_id,
                correccion.etiqueta_ia,
                correccion.etiqueta_usuario,
                correccion.gramos_ia,
                correccion.gramos_usuario,
                str(correccion.coordenadas_cajas)
            ])
        print(f"Corrección guardada por {usuario_actual.nombre}: {correccion.etiqueta_ia} -> {correccion.etiqueta_usuario}")
        return {"status": "éxito"}
    except Exception as e:
        return {"status": "error", "mensaje": str(e)}

app.mount("/imagenes", StaticFiles(directory=str(DIR_IMG.resolve())), name="imagenes")
app.mount("/avatares", StaticFiles(directory=str(DIR_AVATARES.resolve())), name="avatares") 

ruta_frontend = ruta_raiz / "web" / "client" / "dist"
if ruta_frontend.exists():
    app.mount("/", StaticFiles(directory=str(ruta_frontend.resolve()), html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)