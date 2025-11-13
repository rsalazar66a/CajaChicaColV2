"""
Configuración de la aplicación Caja Chica Financiera
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

class Config:
    """Configuración base de la aplicación"""
    
    # Configuración de archivos
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 1024 * 1024 * 1024))  # 1GB por defecto
    ALLOWED_EXTENSIONS = {
        'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 
        'pdf', 'heic', 'heif'
    }
    
    # Configuración de procesamiento
    QR_DETECTION_CONFIDENCE = float(os.getenv('QR_DETECTION_CONFIDENCE', '0.6'))
    MAX_QR_ATTEMPTS = int(os.getenv('MAX_QR_ATTEMPTS', '3'))
    
    # Patrones de extracción CUFE
    CUFE_PATTERNS = [
        r'CUFE[:\s]*([A-Za-z0-9+/=]+)',
        r'Clave[:\s]*([A-Za-z0-9+/=]+)',
        r'Código[:\s]*([A-Za-z0-9+/=]+)',
        r'([A-Za-z0-9+/=]{40,})'  # Secuencia larga alfanumérica
    ]
    
    # Configuración de servidor
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', os.getenv('FLASK_RUN_PORT', '5000')))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Configuración de CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    @staticmethod
    def init_app(app):
        """Inicializa la configuración en la aplicación Flask"""
        app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
        app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
        
        # Crear directorios necesarios
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs('temp', exist_ok=True)

class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    TESTING = False
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB en producción

class TestingConfig(Config):
    """Configuración para testing"""
    DEBUG = True
    TESTING = True
    UPLOAD_FOLDER = 'test_uploads'

# Configuración por defecto
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

