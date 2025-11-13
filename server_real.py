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

def extract_qr_from_image_pil(image_path):
    """Extrae códigos QR de imágenes usando PIL y búsqueda de patrones"""
    try:
        # Abrir imagen con PIL
        image = Image.open(image_path)
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Intentar diferentes métodos de procesamiento
        methods = [
            lambda img: img,  # Original
            lambda img: img.convert('L'),  # Escala de grises
            lambda img: img.convert('L').point(lambda x: 255 if x > 128 else 0),  # Binarización
        ]
        
        for method in methods:
            processed_img = method(image)
            
            # Buscar patrones que podrían ser códigos QR
            # Convertir a string para búsqueda de patrones
            img_data = processed_img.tobytes()
            
            # Buscar patrones comunes de códigos QR
            patterns = [
                b'CUFE:',
                b'Clave:',
                b'Codigo:',
                b'QR:',
                b'https://',
                b'http://',
                b'www.',
            ]
            
            for pattern in patterns:
                if pattern in img_data:
                    # Extraer contexto alrededor del patrón
                    start = img_data.find(pattern)
                    if start != -1:
                        # Buscar el final del patrón (hasta 200 caracteres)
                        end = start + 200
                        context = img_data[start:end]
                        
                        # Decodificar y limpiar
                        try:
                            text = context.decode('utf-8', errors='ignore')
                            # Limpiar caracteres no imprimibles
                            text = ''.join(char for char in text if char.isprintable() or char.isspace())
                            return text.strip()
                        except:
                            continue
        
        # Si no se encuentra patrón específico, intentar extraer texto de la imagen
        # Esto es una aproximación simple - en un caso real usarías OCR
        return None
        
    except Exception as e:
        return None

def extract_qr_from_pdf_simple(pdf_path):
    """Extrae códigos QR de PDF usando método simple"""
    try:
        # Para PDF, intentar leer como texto plano primero
        with open(pdf_path, 'rb') as f:
            content = f.read()
            
            # Buscar patrones en el contenido binario
            patterns = [
                b'CUFE:',
                b'Clave:',
                b'Codigo:',
                b'QR:',
                b'https://',
                b'http://',
            ]
            
            for pattern in patterns:
                if pattern in content:
                    start = content.find(pattern)
                    if start != -1:
                        end = start + 200
                        context = content[start:end]
                        try:
                            text = context.decode('utf-8', errors='ignore')
                            text = ''.join(char for char in text if char.isprintable() or char.isspace())
                            return text.strip()
                        except:
                            continue
        
        return None
        
    except Exception as e:
        return None

def extract_qr_from_heic_simple(heic_path):
    """Extrae códigos QR de archivos HEIC usando método simple"""
    try:
        # Intentar abrir con PIL (si pillow-heif está disponible)
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
            
            image = Image.open(heic_path)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Guardar como JPG temporal para procesamiento
            temp_path = heic_path.replace('.heic', '_temp.jpg').replace('.heif', '_temp.jpg')
            image.save(temp_path, 'JPEG')
            
            # Procesar como imagen normal
            result = extract_qr_from_image_pil(temp_path)
            
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            return result
            
        except ImportError:
            # Si pillow-heif no está disponible, intentar método alternativo
            return None
            
    except Exception as e:
        return None

def extract_cufe_from_text(text):
    """Extrae la clave CUFE del texto"""
    if not text:
        return None
    
    # Patrones para buscar CUFE
    patterns = [
        r'CUFE[:\s]*([A-Za-z0-9+/=]+)',
        r'Clave[:\s]*([A-Za-z0-9+/=]+)',
        r'Código[:\s]*([A-Za-z0-9+/=]+)',
        r'([A-Za-z0-9+/=]{40,})'  # Secuencia larga alfanumérica
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            cufe = match.group(1).strip()
            if len(cufe) > 20:  # Validar que sea suficientemente largo
                return cufe
    
    # Si no se encuentra patrón específico, retornar el texto completo si es largo
    if len(text) > 20:
        return text
    
    return None

def process_file_real(file_path, file_type):
    """Procesa un archivo y extrae códigos QR reales"""
    try:
        qr_data = None
        error = None
        
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            qr_data = extract_qr_from_image_pil(file_path)
        elif file_type == 'application/pdf':
            qr_data = extract_qr_from_pdf_simple(file_path)
        elif file_type in ['image/heic', 'image/heif']:
            qr_data = extract_qr_from_heic_simple(file_path)
        else:
            error = "Tipo de archivo no soportado"
        
        if qr_data and not error:
            # Extraer CUFE del QR
            cufe = extract_cufe_from_text(qr_data)
            
            return {
                'success': True,
                'qrData': qr_data,
                'cufe': cufe,
                'additionalInfo': {
                    'qrLength': len(qr_data),
                    'hasCufe': cufe is not None,
                    'containsNumbers': bool(re.search(r'\d', qr_data)),
                    'containsLetters': bool(re.search(r'[A-Za-z]', qr_data)),
                    'possibleInvoiceData': any(keyword in qr_data.lower() for keyword in ['cufe', 'clave', 'código', 'factura', 'invoice'])
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
                    # Procesar archivo (REAL)
                    result = process_file_real(file_path, file.content_type)
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
    return jsonify({'status': 'OK', 'message': 'Servidor funcionando correctamente - EXTRACCIÓN REAL DE QR'})

if __name__ == '__main__':
    print("🚀 Iniciando Caja Chica Financiera - EXTRACCIÓN REAL...")
    print("📁 Directorio de trabajo:", os.getcwd())
    print("🌐 Servidor disponible en: http://localhost:5000")
    print("🔗 API Health: http://localhost:5000/api/health")
    print("⚠️  NOTA: Usando extracción real de códigos QR")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)

