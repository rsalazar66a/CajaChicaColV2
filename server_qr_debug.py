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
import traceback

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

def extract_qr_from_image_pyzbar_debug(image_path):
    """Extrae códigos QR de imágenes usando Pyzbar con información de debug"""
    try:
        from pyzbar import pyzbar
        
        # Abrir imagen con PIL
        image = Image.open(image_path)
        
        # Información de debug sobre la imagen
        debug_info = {
            'image_size': image.size,
            'image_mode': image.mode,
            'image_format': image.format
        }
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
            debug_info['converted_to_rgb'] = True
        
        # Intentar diferentes métodos de procesamiento
        methods = [
            ("Original", image),
            ("Grayscale", image.convert('L')),
            ("High Contrast", image.convert('L').point(lambda x: 255 if x > 128 else 0)),
        ]
        
        for method_name, processed_image in methods:
            try:
                # Detectar códigos QR usando Pyzbar
                qr_codes = pyzbar.decode(processed_image)
                
                if qr_codes:
                    qr_data = qr_codes[0].data.decode('utf-8')
                    debug_info['method_used'] = method_name
                    debug_info['qr_codes_found'] = len(qr_codes)
                    return qr_data, None, debug_info
                    
            except Exception as e:
                debug_info[f'{method_name}_error'] = str(e)
                continue
        
        debug_info['no_qr_found'] = True
        return None, "No se encontraron códigos QR en la imagen", debug_info
        
    except Exception as e:
        return None, f"Error al procesar imagen: {str(e)}", {'error': str(e), 'traceback': traceback.format_exc()}

def extract_qr_from_pdf_debug(pdf_path):
    """Extrae códigos QR de PDF con información de debug"""
    try:
        from pdf2image import convert_from_path
        from pyzbar import pyzbar
        
        # Convertir PDF a imágenes
        images = convert_from_path(pdf_path)
        debug_info = {
            'pdf_pages': len(images),
            'pages_processed': 0
        }
        
        for i, pil_image in enumerate(images):
            debug_info['pages_processed'] = i + 1
            
            # Intentar diferentes métodos
            methods = [
                ("Original", pil_image),
                ("Grayscale", pil_image.convert('L')),
            ]
            
            for method_name, processed_image in methods:
                try:
                    qr_codes = pyzbar.decode(processed_image)
                    
                    if qr_codes:
                        qr_data = qr_codes[0].data.decode('utf-8')
                        debug_info['method_used'] = method_name
                        debug_info['page_found'] = i + 1
                        debug_info['qr_codes_found'] = len(qr_codes)
                        return qr_data, None, debug_info
                        
                except Exception as e:
                    debug_info[f'page_{i+1}_{method_name}_error'] = str(e)
                    continue
        
        debug_info['no_qr_found'] = True
        return None, "No se encontraron códigos QR en el PDF", debug_info
        
    except ImportError:
        return None, "pdf2image no está instalado", {'error': 'pdf2image not available'}
    except Exception as e:
        return None, f"Error al procesar PDF: {str(e)}", {'error': str(e), 'traceback': traceback.format_exc()}

def extract_qr_from_heic_debug(heic_path):
    """Extrae códigos QR de archivos HEIC con información de debug"""
    try:
        from pillow_heif import register_heif_opener
        from pyzbar import pyzbar
        
        # Registrar plugins de HEIF
        register_heif_opener()
        
        # Abrir archivo HEIC
        image = Image.open(heic_path)
        debug_info = {
            'heic_size': image.size,
            'heic_mode': image.mode,
            'heic_format': image.format
        }
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
            debug_info['converted_to_rgb'] = True
        
        # Intentar diferentes métodos
        methods = [
            ("Original", image),
            ("Grayscale", image.convert('L')),
        ]
        
        for method_name, processed_image in methods:
            try:
                qr_codes = pyzbar.decode(processed_image)
                
                if qr_codes:
                    qr_data = qr_codes[0].data.decode('utf-8')
                    debug_info['method_used'] = method_name
                    debug_info['qr_codes_found'] = len(qr_codes)
                    return qr_data, None, debug_info
                    
            except Exception as e:
                debug_info[f'{method_name}_error'] = str(e)
                continue
        
        debug_info['no_qr_found'] = True
        return None, "No se encontraron códigos QR en el archivo HEIC", debug_info
        
    except ImportError:
        return None, "pillow-heif no está instalado", {'error': 'pillow-heif not available'}
    except Exception as e:
        return None, f"Error al procesar archivo HEIC: {str(e)}", {'error': str(e), 'traceback': traceback.format_exc()}

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

def process_file_real_qr_debug(file_path, file_type):
    """Procesa un archivo y extrae códigos QR reales con información de debug"""
    try:
        qr_data = None
        error = None
        debug_info = {}
        
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            qr_data, error, debug_info = extract_qr_from_image_pyzbar_debug(file_path)
        elif file_type == 'application/pdf':
            qr_data, error, debug_info = extract_qr_from_pdf_debug(file_path)
        elif file_type in ['image/heic', 'image/heif']:
            qr_data, error, debug_info = extract_qr_from_heic_debug(file_path)
        else:
            error = "Tipo de archivo no soportado"
            debug_info = {'error': 'Unsupported file type'}
        
        if qr_data and not error:
            # Extraer CUFE del QR
            cufe = extract_cufe_from_qr(qr_data)
            
            return {
                'success': True,
                'qrData': qr_data,
                'cufe': cufe,
                'debugInfo': debug_info,
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
                'error': error or "No se encontraron códigos QR en el archivo",
                'debugInfo': debug_info,
                'suggestions': [
                    "Verificar que la imagen contenga un código QR visible",
                    "Asegurar que el código QR no esté dañado o borroso",
                    "Intentar con una imagen de mayor resolución",
                    "Verificar que el archivo no esté corrupto"
                ]
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f"Error al procesar archivo: {str(e)}",
            'debugInfo': {'error': str(e), 'traceback': traceback.format_exc()},
            'suggestions': [
                "Verificar que el archivo no esté corrupto",
                "Intentar con un formato diferente",
                "Verificar que el archivo no sea demasiado grande"
            ]
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
                    # Procesar archivo (REAL con debug)
                    result = process_file_real_qr_debug(file_path, file.content_type)
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
        return jsonify({
            'error': f'Error del servidor: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK', 
        'message': 'Servidor funcionando correctamente - EXTRACCIÓN REAL DE QR CON DEBUG',
        'libraries': {
            'pyzbar': 'Disponible',
            'pillow_heif': 'Disponible',
            'pdf2image': 'Disponible'
        }
    })

if __name__ == '__main__':
    print("🚀 Iniciando Caja Chica Financiera - EXTRACCIÓN REAL DE QR CON DEBUG...")
    print("📁 Directorio de trabajo:", os.getcwd())
    print("🌐 Servidor disponible en: http://localhost:5000")
    print("🔗 API Health: http://localhost:5000/api/health")
    print("⚠️  NOTA: Usando Pyzbar con información detallada de debug")
    print("📚 Bibliotecas: Pyzbar, Pillow-HEIF, pdf2image")
    print("🔍 Debug: Información detallada sobre por qué no se encuentran códigos QR")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)
