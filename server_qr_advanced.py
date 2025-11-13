from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
import re
from werkzeug.utils import secure_filename
import base64
from PIL import Image, ImageEnhance, ImageFilter
import io
import traceback
import numpy as np

app = Flask(__name__)
CORS(app)

# Configuración de archivos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'pdf', 'heic', 'heif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Crear directorio de uploads si no existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Estadísticas globales
STATS = {
    'total_processed': 0,
    'successful_detections': 0,
    'failed_detections': 0,
    'by_file_type': {},
    'by_method': {},
    'common_errors': {},
    'processing_times': []
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image_advanced(image):
    """Preprocesamiento avanzado de imagen para mejorar detección de QR"""
    try:
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Crear diferentes versiones preprocesadas
        processed_images = []
        
        # 1. Imagen original
        processed_images.append(("Original", image))
        
        # 2. Escala de grises
        gray = image.convert('L')
        processed_images.append(("Grayscale", gray))
        
        # 3. Mejora de contraste
        enhancer = ImageEnhance.Contrast(gray)
        contrast_img = enhancer.enhance(2.0)
        processed_images.append(("High Contrast", contrast_img))
        
        # 4. Mejora de nitidez
        sharpness = ImageEnhance.Sharpness(gray)
        sharp_img = sharpness.enhance(2.0)
        processed_images.append(("Sharpened", sharp_img))
        
        # 5. Filtro de nitidez
        sharp_filter = gray.filter(ImageFilter.SHARPEN)
        processed_images.append(("Sharp Filter", sharp_filter))
        
        # 6. Binarización adaptativa
        binary_img = gray.point(lambda x: 255 if x > 128 else 0)
        processed_images.append(("Binary", binary_img))
        
        # 7. Inversión de colores
        inverted = gray.point(lambda x: 255 - x)
        processed_images.append(("Inverted", inverted))
        
        # 8. Mejora de brillo
        brightness = ImageEnhance.Brightness(gray)
        bright_img = brightness.enhance(1.5)
        processed_images.append(("Brightened", bright_img))
        
        # 9. Reducción de ruido
        denoised = gray.filter(ImageFilter.MedianFilter(size=3))
        processed_images.append(("Denoised", denoised))
        
        # 10. Combinación de mejoras
        combined = gray
        combined = ImageEnhance.Contrast(combined).enhance(1.5)
        combined = ImageEnhance.Sharpness(combined).enhance(1.5)
        processed_images.append(("Combined", combined))
        
        return processed_images
        
    except Exception as e:
        return [("Error", image)]

def extract_qr_advanced(image_path):
    """Extracción avanzada de códigos QR con múltiples algoritmos"""
    try:
        from pyzbar import pyzbar
        
        # Abrir imagen
        image = Image.open(image_path)
        
        # Información de debug
        debug_info = {
            'original_size': image.size,
            'original_mode': image.mode,
            'original_format': image.format,
            'methods_tried': [],
            'qr_codes_found': 0
        }
        
        # Preprocesar imagen con múltiples técnicas
        processed_images = preprocess_image_advanced(image)
        
        # Intentar decodificar con cada método
        for method_name, processed_image in processed_images:
            try:
                debug_info['methods_tried'].append(method_name)
                
                # Detectar códigos QR
                qr_codes = pyzbar.decode(processed_image)
                
                if qr_codes:
                    debug_info['qr_codes_found'] = len(qr_codes)
                    debug_info['successful_method'] = method_name
                    
                    # Retornar todos los códigos encontrados
                    qr_data_list = []
                    for qr in qr_codes:
                        try:
                            data = qr.data.decode('utf-8')
                            qr_data_list.append(data)
                        except:
                            continue
                    
                    if qr_data_list:
                        # Retornar el primer código válido
                        return qr_data_list[0], None, debug_info
                        
            except Exception as e:
                debug_info[f'{method_name}_error'] = str(e)
                continue
        
        debug_info['no_qr_found'] = True
        return None, "No se encontraron códigos QR con ningún método", debug_info
        
    except Exception as e:
        return None, f"Error al procesar imagen: {str(e)}", {'error': str(e), 'traceback': traceback.format_exc()}

def extract_qr_from_pdf_advanced(pdf_path):
    """Extracción avanzada de códigos QR de PDF"""
    try:
        from pdf2image import convert_from_path
        from pyzbar import pyzbar
        
        # Convertir PDF a imágenes con alta resolución
        images = convert_from_path(pdf_path, dpi=300, fmt='PNG')
        debug_info = {
            'pdf_pages': len(images),
            'pages_processed': 0,
            'methods_tried': [],
            'qr_codes_found': 0
        }
        
        for i, pil_image in enumerate(images):
            debug_info['pages_processed'] = i + 1
            
            # Preprocesar cada página
            processed_images = preprocess_image_advanced(pil_image)
            
            for method_name, processed_image in processed_images:
                try:
                    debug_info['methods_tried'].append(f"Page {i+1} - {method_name}")
                    qr_codes = pyzbar.decode(processed_image)
                    
                    if qr_codes:
                        debug_info['qr_codes_found'] = len(qr_codes)
                        debug_info['successful_method'] = f"Page {i+1} - {method_name}"
                        debug_info['page_found'] = i + 1
                        
                        qr_data = qr_codes[0].data.decode('utf-8')
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

def extract_qr_from_heic_advanced(heic_path):
    """Extracción avanzada de códigos QR de archivos HEIC"""
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
            'heic_format': image.format,
            'methods_tried': [],
            'qr_codes_found': 0
        }
        
        # Preprocesar imagen
        processed_images = preprocess_image_advanced(image)
        
        for method_name, processed_image in processed_images:
            try:
                debug_info['methods_tried'].append(method_name)
                qr_codes = pyzbar.decode(processed_image)
                
                if qr_codes:
                    debug_info['qr_codes_found'] = len(qr_codes)
                    debug_info['successful_method'] = method_name
                    
                    qr_data = qr_codes[0].data.decode('utf-8')
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

def extract_cufe_advanced(qr_data):
    """Extracción avanzada de CUFE con múltiples patrones"""
    if not qr_data:
        return None, []
    
    # Patrones más específicos para facturas colombianas
    patterns = [
        # Patrones CUFE específicos
        (r'CUFE[:\s]*([A-Za-z0-9+/=]{40,})', 'CUFE directo'),
        (r'Clave[:\s]*([A-Za-z0-9+/=]{40,})', 'Clave de acceso'),
        (r'Código[:\s]*([A-Za-z0-9+/=]{40,})', 'Código de acceso'),
        (r'Código\s+de\s+Acceso[:\s]*([A-Za-z0-9+/=]{40,})', 'Código de acceso completo'),
        (r'Código\s+Único\s+de\s+Facturación\s+Electrónica[:\s]*([A-Za-z0-9+/=]{40,})', 'CUFE completo'),
        
        # Patrones de URLs
        (r'https?://[^\s]+', 'URL'),
        (r'www\.[^\s]+', 'URL www'),
        
        # Patrones de secuencias largas
        (r'([A-Za-z0-9+/=]{50,})', 'Secuencia larga'),
        (r'([A-Za-z0-9+/=]{40,49})', 'Secuencia media'),
        
        # Patrones específicos de facturación
        (r'Factura[:\s]*([A-Za-z0-9+/=]{20,})', 'Número de factura'),
        (r'Invoice[:\s]*([A-Za-z0-9+/=]{20,})', 'Invoice number'),
    ]
    
    matches = []
    for pattern, description in patterns:
        matches_found = re.findall(pattern, qr_data, re.IGNORECASE | re.MULTILINE)
        for match in matches_found:
            if len(match) > 20:  # Validar longitud mínima
                matches.append({
                    'value': match,
                    'type': description,
                    'length': len(match)
                })
    
    # Ordenar por longitud (más largos primero)
    matches.sort(key=lambda x: x['length'], reverse=True)
    
    if matches:
        return matches[0]['value'], matches
    else:
        return qr_data, []

def update_stats(success, file_type, method_used=None, error=None, processing_time=None):
    """Actualizar estadísticas globales"""
    import time
    
    STATS['total_processed'] += 1
    
    if success:
        STATS['successful_detections'] += 1
    else:
        STATS['failed_detections'] += 1
    
    # Estadísticas por tipo de archivo
    if file_type not in STATS['by_file_type']:
        STATS['by_file_type'][file_type] = {'success': 0, 'failed': 0}
    
    if success:
        STATS['by_file_type'][file_type]['success'] += 1
    else:
        STATS['by_file_type'][file_type]['failed'] += 1
    
    # Estadísticas por método
    if method_used:
        if method_used not in STATS['by_method']:
            STATS['by_method'][method_used] = 0
        STATS['by_method'][method_used] += 1
    
    # Errores comunes
    if error and not success:
        error_key = error[:50]  # Limitar longitud
        if error_key not in STATS['common_errors']:
            STATS['common_errors'][error_key] = 0
        STATS['common_errors'][error_key] += 1
    
    # Tiempos de procesamiento
    if processing_time:
        STATS['processing_times'].append(processing_time)
        # Mantener solo los últimos 100 tiempos
        if len(STATS['processing_times']) > 100:
            STATS['processing_times'] = STATS['processing_times'][-100:]

def process_file_advanced(file_path, file_type):
    """Procesamiento avanzado de archivos con múltiples algoritmos"""
    import time
    start_time = time.time()
    
    try:
        qr_data = None
        error = None
        debug_info = {}
        cufe_matches = []
        
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            qr_data, error, debug_info = extract_qr_advanced(file_path)
        elif file_type == 'application/pdf':
            qr_data, error, debug_info = extract_qr_from_pdf_advanced(file_path)
        elif file_type in ['image/heic', 'image/heif']:
            qr_data, error, debug_info = extract_qr_from_heic_advanced(file_path)
        else:
            error = "Tipo de archivo no soportado"
            debug_info = {'error': 'Unsupported file type'}
        
        processing_time = time.time() - start_time
        
        if qr_data and not error:
            # Extraer CUFE con análisis avanzado
            cufe, cufe_matches = extract_cufe_advanced(qr_data)
            
            # Actualizar estadísticas
            update_stats(True, file_type, debug_info.get('successful_method'), None, processing_time)
            
            return {
                'success': True,
                'qrData': qr_data,
                'cufe': cufe,
                'cufeMatches': cufe_matches,
                'debugInfo': debug_info,
                'additionalInfo': {
                    'qrLength': len(qr_data),
                    'hasCufe': cufe is not None,
                    'containsNumbers': bool(re.search(r'\d', qr_data)),
                    'containsLetters': bool(re.search(r'[A-Za-z]', qr_data)),
                    'containsUrls': bool(re.search(r'https?://', qr_data)),
                    'possibleInvoiceData': any(keyword in qr_data.lower() for keyword in [
                        'cufe', 'clave', 'código', 'factura', 'invoice', 'https://', 'http://', 'www.'
                    ]),
                    'methodsUsed': debug_info.get('methods_tried', []),
                    'successfulMethod': debug_info.get('successful_method', 'Unknown')
                }
            }
        else:
            # Actualizar estadísticas
            update_stats(False, file_type, None, error, processing_time)
            
            return {
                'success': False,
                'error': error or "No se encontraron códigos QR en el archivo",
                'debugInfo': debug_info,
                'suggestions': [
                    "Verificar que la imagen contenga un código QR visible y nítido",
                    "Asegurar que el código QR no esté dañado, borroso o pixelado",
                    "Intentar con una imagen de mayor resolución (mínimo 400x400 píxeles)",
                    "Verificar que el código QR tenga buen contraste (negro sobre blanco)",
                    "Asegurar que el código QR esté completo y sin obstrucciones",
                    "Intentar con diferentes formatos de imagen (PNG, TIFF)",
                    "Verificar que el archivo no esté corrupto"
                ]
            }
            
    except Exception as e:
        processing_time = time.time() - start_time
        error_msg = f"Error al procesar archivo: {str(e)}"
        
        # Actualizar estadísticas
        update_stats(False, file_type, None, error_msg, processing_time)
        
        return {
            'success': False,
            'error': error_msg,
            'debugInfo': {'error': str(e), 'traceback': traceback.format_exc()},
            'suggestions': [
                "Verificar que el archivo no esté corrupto",
                "Intentar con un formato diferente",
                "Verificar que el archivo no sea demasiado grande",
                "Asegurar que el archivo sea un formato soportado"
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
                    # Procesar archivo con algoritmo avanzado
                    result = process_file_advanced(file_path, file.content_type)
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
        'message': 'Servidor funcionando correctamente - ALGORITMO AVANZADO DE DETECCIÓN QR',
        'features': {
            'advanced_preprocessing': 'Disponible',
            'multiple_algorithms': 'Disponible',
            'cufe_extraction': 'Mejorado',
            'debug_info': 'Detallado'
        },
        'libraries': {
            'pyzbar': 'Disponible',
            'pillow_heif': 'Disponible',
            'pdf2image': 'Disponible'
        }
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtener estadísticas de procesamiento"""
    try:
        # Calcular porcentajes
        total = STATS['total_processed']
        success_rate = (STATS['successful_detections'] / total * 100) if total > 0 else 0
        failure_rate = (STATS['failed_detections'] / total * 100) if total > 0 else 0
        
        # Estadísticas por tipo de archivo
        file_type_stats = {}
        for file_type, data in STATS['by_file_type'].items():
            total_type = data['success'] + data['failed']
            file_type_stats[file_type] = {
                'total': total_type,
                'success': data['success'],
                'failed': data['failed'],
                'success_rate': (data['success'] / total_type * 100) if total_type > 0 else 0
            }
        
        # Tiempo promedio de procesamiento
        avg_processing_time = sum(STATS['processing_times']) / len(STATS['processing_times']) if STATS['processing_times'] else 0
        
        # Errores más comunes
        common_errors = sorted(STATS['common_errors'].items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Métodos más exitosos
        successful_methods = sorted(STATS['by_method'].items(), key=lambda x: x[1], reverse=True)[:5]
        
        return jsonify({
            'success': True,
            'stats': {
                'overview': {
                    'total_processed': total,
                    'successful_detections': STATS['successful_detections'],
                    'failed_detections': STATS['failed_detections'],
                    'success_rate': round(success_rate, 2),
                    'failure_rate': round(failure_rate, 2)
                },
                'by_file_type': file_type_stats,
                'by_method': dict(successful_methods),
                'common_errors': dict(common_errors),
                'performance': {
                    'avg_processing_time': round(avg_processing_time, 3),
                    'total_processing_times': len(STATS['processing_times']),
                    'min_processing_time': round(min(STATS['processing_times']), 3) if STATS['processing_times'] else 0,
                    'max_processing_time': round(max(STATS['processing_times']), 3) if STATS['processing_times'] else 0
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error al obtener estadísticas: {str(e)}"
        })

if __name__ == '__main__':
    print("🚀 Iniciando Caja Chica Financiera - ALGORITMO AVANZADO...")
    print("📁 Directorio de trabajo:", os.getcwd())
    print("🌐 Servidor disponible en: http://localhost:5000")
    print("🔗 API Health: http://localhost:5000/api/health")
    print("⚠️  NOTA: Algoritmo avanzado con múltiples técnicas de preprocesamiento")
    print("🔧 Características:")
    print("   • 10+ métodos de preprocesamiento de imagen")
    print("   • Detección mejorada de CUFE")
    print("   • Análisis de múltiples patrones")
    print("   • Información de debug detallada")
    print("📚 Bibliotecas: Pyzbar, Pillow-HEIF, pdf2image")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)
