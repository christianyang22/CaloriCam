import os
from datetime import datetime, timedelta
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

load_dotenv()

# Configuración de la base de datos sqlite
ruta_raiz = Path(__file__).parent.parent
DIR_BBDD = ruta_raiz / "bbdd_aplicacion"
DIR_BBDD.mkdir(parents=True, exist_ok=True)

RUTA_DB = DIR_BBDD / "caloricam.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{RUTA_DB}"

'''
check_same_thread=False es necesario en SQLite cuando se integra con FastAPI 
para permitir que distintas peticiones web asíncronas compartan la misma 
conexión a la base de datos sin generar errores de concurrencia.
'''
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Seguridad y gestión de tokens JWT
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("No se encontró la SECRET_KEY en el archivo .env. Servidor detenido por seguridad.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

def obtener_password_hash(password: str) -> str:
    '''
    Genera un hash bcrypt a partir de la contraseña en texto plano.
    Se utiliza bcrypt porque incorpora un salt aleatorio internamente, 
    lo que protege las contraseñas de los usuarios contra ataques de 
    diccionario y tablas rainbow.
    '''
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def crear_token_acceso(data: dict):
    '''
    Genera un JSON Web Token (JWT) con un tiempo de expiración definido.
    Esta arquitectura permite autenticar al usuario de forma stateless, 
    es decir, sin necesidad de consultar ni guardar sesiones en la base 
    de datos del servidor en cada petición, optimizando la latencia de la API.
    '''
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Modelos de la base de datos sqlalchemy
class UsuarioDB(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    terminos_aceptados = Column(Boolean, default=True) 
    avatar_id = Column(String, nullable=True) 
    
    peso_kg = Column(Float, nullable=True)
    altura_cm = Column(Integer, nullable=True)
    edad = Column(Integer, nullable=True)
    genero = Column(String, nullable=True)
    objetivo = Column(String, nullable=True) 
    meta_calorias = Column(Integer, nullable=True)
    onboarding_completado = Column(Boolean, default=False)

    '''
    Relación bidireccional con las comidas. El parámetro cascade="all, delete-orphan" 
    asegura la integridad referencial: si un usuario decide eliminar su cuenta, 
    se borran automáticamente todas las comidas asociadas a su identificador.
    '''
    comidas = relationship("ComidaDB", back_populates="propietario", cascade="all, delete-orphan")

class ComidaDB(Base):
    __tablename__ = "comidas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"))
    imagen_id = Column(String, unique=True, index=True) 
    fecha = Column(DateTime, default=datetime.now) 
    
    calorias_totales = Column(Float)
    proteinas_g = Column(Float)
    carbohidratos_g = Column(Float)
    grasas_g = Column(Float)
    
    '''
    Se guarda la lista de ingredientes detectados serializada como string JSON. 
    Dado que los ingredientes solo se leen conjuntamente con el plato para mostrarlos 
    en el frontend y no requieren búsquedas cruzadas complejas, esta solución 
    simplifica el esquema y evita la necesidad de crear tablas relacionales adicionales.
    '''
    ingredientes_json = Column(String, default="[]") 

    propietario = relationship("UsuarioDB", back_populates="comidas")

# Creación física de las tablas en sqlite
Base.metadata.create_all(bind=engine)

def get_db():
    '''
    Generador que gestiona el ciclo de vida de la conexión a la base de datos.
    Se inyecta como dependencia (Depends) en los endpoints de FastAPI para garantizar
    que la sesión de base de datos se abre al iniciar la petición y se cierra 
    de forma completamente segura al terminar, incluso si ocurre un error.
    '''
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()