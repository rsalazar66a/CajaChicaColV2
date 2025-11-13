from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
import re
from werkzeug.utils import secure_filename
import base64
from PIL import Image
import io
import cv2
import numpy as np
from pyzbar import pyzbar

app = Flask(__name__)
CORS(app)

# Configuración de archivos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'pdf', 'heic', 'heif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Crear directorio de uploads si no existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_qr_from_image_opencv(image_path):
    """Extrae códigos QR de imágenes usando OpenCV y Pyzbar"""
    try:
        # Leer imagen con OpenCV
        image = cv2.imread(image_path)
        if image is None:
            return None, "No se pudo cargar la imagen"
        
        # Convertir a escala de grises
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detectar códigos QR usando Pyzbar
        qr_codes = pyzbar.decode(gray)
        
        if qr_codes:
            # Retornar el primer código QR encontrado
            qr_data = qr_codes[0].data.decode('utf-8')
            return qr_data, None
        else:
            return None, "No se encontraron códigos QR"
            
    except Exception as e:
        return None, f"Error al procesar imagen: {str(e)}"

def extract_qr_from_pdf_pages(pdf_path):
    """Extrae códigos QR de PDF convirtiendo a imágenes"""
    try:
        # Intentar importar pdf2image
        try:
            from pdf2image import convert_from_path
        except ImportError:
            return None, "pdf2image no está instalado"
        
        # Convertir PDF a imágenes
        images = convert_from_path(pdf_path)
        
        for i, pil_image in enumerate(images):
            # Convertir PIL Image a formato OpenCV
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Detectar códigos QR
            qr_codes = pyzbar.decode(gray)
            
            if qr_codes:
                qr_data = qr_codes[0].data.decode('utf-8')
                return qr_data, None
        
        return None, "No se encontraron códigos QR en el PDF"
        
    except Exception as e:
        return None, f"Error al procesar PDF: {str(e)}"

def extract_qr_from_heic_real(heic_path):
    """Extrae códigos QR de archivos HEIC usando pillow-heif"""
    try:
        # Registrar plugins de HEIF
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
        except ImportError:
            return None, "pillow-heif no está instalado"
        
        # Abrir archivo HEIC
        image = Image.open(heic_path)
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convertir a formato OpenCV
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Detectar códigos QR
        qr_codes = pyzbar.decode(gray)
        
        if qr_codes:
            qr_data = qr_codes[0].data.decode('utf-8')
            return qr_data, None
        else:
            return None, "No se encontraron códigos QR en el archivo HEIC"
            
    except Exception as e:
        return None, f"Error al procesar archivo HEIC: {str(e)}"

def extract_cufe_from_qr(qr_data):
    """Extrae la clave de acceso/CUFE del código QR"""
    if not qr_data:
        return None
    
    # Patrones para buscar CUFE
    patterns = [
        r'CUFE[:\s]*([A-Za-z0-9+/=]+)',
        r'Clave[:\s]*([A-Za-z0-9+/=]+)',
        r'Código[:\s]*([A-Za-z0-9+/=]+)',
        r'Código\s+de\s+Acceso[:\s]*([A-Za-z0-9+/=]+)',
        r'Código\s+Único\s+de\s+Facturación\s+Electrónica[:\s]*([A-Za-z0-9+/=]+)',
        r'([A-Za-z0-9+/=]{40,})'  # Secuencia larga alfanumérica
    ]
    
    for pattern in patterns:
        match = re.search(pattern, qr_data, re.IGNORECASE | re.MULTILINE)
        if match:
            cufe = match.group(1).strip()
            if len(cufe) > 20:  # Validar que sea suficientemente largo
                return cufe
    
    # Si no se encuentra patrón específico, retornar el texto completo si es largo
    if len(qr_data) > 20:
        return qr_data
    
    return None

def process_file_real_qr(file_path, file_type):
    """Procesa un archivo y extrae códigos QR reales"""
    try:
        qr_data = None
        error = None
        
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            qr_data, error = extract_qr_from_image_opencv(file_path)
        elif file_type == 'application/pdf':
            qr_data, error = extract_qr_from_pdf_pages(file_path)
        elif file_type in ['image/heic', 'image/heif']:
            qr_data, error = extract_qr_from_heic_real(file_path)
        else:
            error = "Tipo de archivo no soportado"
        
        if qr_data and not error:
            # Extraer CUFE del QR
            cufe = extract_cufe_from_qr(qr_data)
            
            return {
                'success': True,
                'qrData': qr_data,
                'cufe': cufe,
                'additionalInfo': {
                    'qrLength': len(qr_data),
                    'hasCufe': cufe is not None,
                    'containsNumbers': bool(re.search(r'\d', qr_data)),
                    'containsLetters': bool(re.search(r'[A-Za-z]', qr_data)),
                    'possibleInvoiceData': any(keyword in qr_data.lower() for keyword in ['cufe', 'clave', 'código', 'factura', 'invoice', 'https://', 'http://'])
                }
            }
        else:
            return {
                'success': False,
                'error': error or "No se encontraron códigos QR en el archivo"
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f"Error al procesar archivo: {str(e)}"
        }

@app.route('/api/process-qr', methods=['POST'])
def process_qr():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No se encontraron archivos'}), 400
        
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'error': 'No se seleccionaron archivos'}), 400
        
        results = []
        
        for file in files:
            if file and allowed_file(file.filename):
                # Guardar archivo temporalmente
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                try:
                    # Procesar archivo (REAL con OpenCV y Pyzbar)
                    result = process_file_real_qr(file_path, file.content_type)
                    result['fileName'] = filename
                    result['fileType'] = file.content_type
                    result['fileSize'] = os.path.getsize(file_path)
                    result['fileSizeFormatted'] = f"{(result['fileSize'] / 1024 / 1024):.2f} MB"
                    results.append(result)
                    
                finally:
                    # Limpiar archivo temporal
                    if os.path.exists(file_path):
                        os.remove(file_path)
            else:
                results.append({
                    'fileName': file.filename,
                    'success': False,
                    'error': 'Tipo de archivo no permitido'
                })
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK', 
        'message': 'Servidor funcionando correctamente - EXTRACCIÓN REAL DE QR CON OPENCV Y PYZBAR',
        'libraries': {
            'opencv': 'Disponible',
            'pyzbar': 'Disponible',
            'pillow_heif': 'Disponible'
        }
    })

if __name__ == '__main__':
    print("🚀 Iniciando Caja Chica Financiera - EXTRACCIÓN REAL DE QR...")
    print("📁 Directorio de trabajo:", os.getcwd())
    print("🌐 Servidor disponible en: http://localhost:5000")
    print("🔗 API Health: http://localhost:5000/api/health")
    print("⚠️  NOTA: Usando OpenCV + Pyzbar para decodificación real de QR")
    print("📚 Bibliotecas: OpenCV, Pyzbar, Pillow-HEIF")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
