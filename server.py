from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import tempfile
import cv2
import numpy as np
from pyzbar import pyzbar
from pdf2image import convert_from_path
from PIL import Image
from pillow_heif import register_heif_opener
import json
import re
import time
from werkzeug.utils import secure_filename
from utils import QRProcessor, CUFEExtractor, InvoiceAnalyzer, validate_file_type, format_file_size
from config import config
from ocr_processor import ocr_processor

app = Flask(__name__)

# Determinar configuración según entorno
flask_env = os.environ.get('FLASK_ENV', 'development')
config_name = flask_env if flask_env in config else 'default'
app.config.from_object(config[config_name])

# Inicializar configuración
config[config_name].init_app(app)

# Configurar CORS
cors_origins = config[config_name].CORS_ORIGINS if hasattr(config[config_name], 'CORS_ORIGINS') else ['*']
CORS(app, origins=cors_origins)

# Inicializar procesadores
qr_processor = QRProcessor()
cufe_extractor = CUFEExtractor()
invoice_analyzer = InvoiceAnalyzer()

# Estadísticas globales de procesamiento
STATS = {
    'total_processed': 0,
    'successful_detections': 0,
    'failed_detections': 0,
    'by_file_type': {},
    'processing_times': []
}

def allowed_file(filename):
    return validate_file_type(filename, '')

def extract_qr_from_image(image_path):
    """Extrae códigos QR de imágenes usando múltiples algoritmos mejorados"""
    try:
        # Leer imagen con OpenCV
        image = cv2.imread(image_path, cv2.IMREAD_COLOR)
        if image is None:
            # Intentar leer como escala de grises si falla
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if image is None:
                return None, "No se pudo cargar la imagen"
        
        # Usar el procesador mejorado que prueba múltiples métodos
        qr_codes = qr_processor.detect_qr_codes(image)
        
        if qr_codes:
            # Retornar el primer código QR encontrado
            return qr_codes[0], None
        else:
            return None, "No se encontraron códigos QR"
            
    except Exception as e:
        return None, f"Error al procesar imagen: {str(e)}"

def extract_qr_from_pdf(pdf_path):
    """Extrae códigos QR de PDF usando pdf2image y procesador mejorado"""
    try:
        # Convertir PDF a imágenes con mayor resolución (300 DPI para mejor calidad)
        images = convert_from_path(pdf_path, dpi=300, fmt='PNG')
        
        for i, image in enumerate(images):
            # Convertir PIL Image a formato OpenCV
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Usar el procesador mejorado que prueba múltiples métodos
            qr_codes = qr_processor.detect_qr_codes(opencv_image)
            
            if qr_codes:
                # Retornar el primer código QR encontrado
                return qr_codes[0], None
        
        return None, "No se encontraron códigos QR en el PDF"
        
    except Exception as e:
        return None, f"Error al procesar PDF: {str(e)}"

def extract_qr_from_heic(heic_path):
    """Extrae códigos QR de archivos HEIC usando pillow-heif y procesador mejorado"""
    try:
        # Registrar plugins de HEIF
        try:
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
        
        # Usar el procesador mejorado que prueba múltiples métodos
        qr_codes = qr_processor.detect_qr_codes(opencv_image)
        
        if qr_codes:
            # Retornar el primer código QR encontrado
            return qr_codes[0], None
        else:
            return None, "No se encontraron códigos QR en el archivo HEIC"
            
    except Exception as e:
        return None, f"Error al procesar archivo HEIC: {str(e)}"

def extract_cufe_from_qr(qr_data):
    """Extrae la clave de acceso/CUFE del código QR"""
    try:
        return cufe_extractor.extract_cufe(qr_data)
    except Exception as e:
        return qr_data  # Retornar el QR original si hay error

def update_stats(success, file_type, processing_time=None, error=None):
    """Actualizar estadísticas globales de procesamiento"""
    STATS['total_processed'] += 1
    
    if success:
        STATS['successful_detections'] += 1
    else:
        STATS['failed_detections'] += 1
    
    # Estadísticas por tipo de archivo
    if file_type not in STATS['by_file_type']:
        STATS['by_file_type'][file_type] = {'success': 0, 'failed': 0, 'total': 0}
    
    STATS['by_file_type'][file_type]['total'] += 1
    if success:
        STATS['by_file_type'][file_type]['success'] += 1
    else:
        STATS['by_file_type'][file_type]['failed'] += 1
    
    # Tiempos de procesamiento
    if processing_time:
        STATS['processing_times'].append(processing_time)
        # Mantener solo los últimos 100 tiempos
        if len(STATS['processing_times']) > 100:
            STATS['processing_times'] = STATS['processing_times'][-100:]

def process_file(file_path, file_type):
    """Procesa un archivo y extrae códigos QR"""
    start_time = time.time()
    try:
        qr_data = None
        error = None
        
        # Si file_type está vacío, intentar detectar por extensión
        if not file_type or file_type == '':
            filename_lower = file_path.lower()
            if filename_lower.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif')):
                file_type = 'image/jpeg'  # Valor por defecto para imágenes
            elif filename_lower.endswith('.pdf'):
                file_type = 'application/pdf'
            elif filename_lower.endswith(('.heic', '.heif')):
                file_type = 'image/heic'
        
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            qr_data, error = extract_qr_from_image(file_path)
        elif file_type == 'application/pdf':
            qr_data, error = extract_qr_from_pdf(file_path)
        elif file_type in ['image/heic', 'image/heif']:
            qr_data, error = extract_qr_from_heic(file_path)
        else:
            error = f"Tipo de archivo no soportado: {file_type or 'desconocido'}"
        
        processing_time = time.time() - start_time
        
        if qr_data and not error:
            # Extraer CUFE del QR
            cufe = extract_cufe_from_qr(qr_data)
            
            # Analizar información adicional
            analysis = invoice_analyzer.analyze_qr_data(qr_data)
            
            # Actualizar estadísticas
            update_stats(True, file_type, processing_time)
            
            return {
                'success': True,
                'qrData': qr_data,
                'cufe': cufe,
                'additionalInfo': analysis
            }
        else:
            # Actualizar estadísticas
            update_stats(False, file_type, processing_time, error)
            
            return {
                'success': False,
                'error': error or "No se pudo extraer información del archivo"
            }
            
    except Exception as e:
        import traceback
        processing_time = time.time() - start_time
        update_stats(False, file_type or 'unknown', processing_time, str(e))
        
        return {
            'success': False,
            'error': f"Error inesperado: {str(e)}",
            'debugInfo': traceback.format_exc()
        }

@app.route('/api/process-qr', methods=['POST'])
def process_qr():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No se encontraron archivos'}), 400
        
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'error': 'No se seleccionaron archivos'}), 400
        
        # Validar cantidad máxima de archivos
        MAX_FILES = 500
        if len(files) > MAX_FILES:
            return jsonify({
                'error': f'Se pueden procesar hasta {MAX_FILES} archivos a la vez. Has enviado {len(files)} archivos.'
            }), 400
        
        results = []
        total_files = len(files)
        processed_count = 0
        
        # Procesar archivos con manejo robusto de errores
        for index, file in enumerate(files, 1):
            file_path = None
            filename = None
            try:
                if file and allowed_file(file.filename):
                    # Guardar archivo temporalmente
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    
                    print(f'[{index}/{total_files}] Procesando archivo: {filename}')
                    
                    try:
                        file.save(file_path)
                    except Exception as save_error:
                        print(f'Error al guardar archivo {filename}: {str(save_error)}')
                        results.append({
                            'fileName': filename,
                            'success': False,
                            'error': f'Error al guardar archivo: {str(save_error)}',
                            'fileType': file.content_type or 'application/octet-stream',
                            'fileSize': 0,
                            'fileSizeFormatted': '0 B'
                        })
                        processed_count += 1
                        continue
                    
                    try:
                        # Procesar archivo
                        # Usar content_type o detectar por extensión
                        content_type = file.content_type or ''
                        result = process_file(file_path, content_type)
                        result['fileName'] = filename
                        result['fileType'] = content_type or 'application/octet-stream'
                        
                        # Obtener tamaño del archivo de forma segura
                        try:
                            result['fileSize'] = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                            result['fileSizeFormatted'] = format_file_size(result['fileSize'])
                        except Exception as size_error:
                            print(f'Error al obtener tamaño de archivo {filename}: {str(size_error)}')
                            result['fileSize'] = 0
                            result['fileSizeFormatted'] = '0 B'
                        
                        results.append(result)
                        processed_count += 1
                        print(f'[{index}/{total_files}] Archivo {filename} procesado exitosamente')
                        
                        # Liberar memoria periódicamente (cada 10 archivos)
                        if processed_count % 10 == 0:
                            import gc
                            gc.collect()
                            print(f'Memoria liberada después de procesar {processed_count} archivos')
                        
                    except Exception as process_error:
                        import traceback
                        error_trace = traceback.format_exc()
                        print(f'Error al procesar archivo {filename}: {str(process_error)}')
                        print(f'Traceback: {error_trace}')
                        results.append({
                            'fileName': filename,
                            'success': False,
                            'error': f'Error al procesar archivo: {str(process_error)}',
                            'fileType': file.content_type or 'application/octet-stream',
                            'fileSize': os.path.getsize(file_path) if file_path and os.path.exists(file_path) else 0,
                            'fileSizeFormatted': format_file_size(os.path.getsize(file_path)) if file_path and os.path.exists(file_path) else '0 B',
                            'debugInfo': error_trace
                        })
                        processed_count += 1
                else:
                    filename = file.filename if file else 'desconocido'
                    results.append({
                        'fileName': filename,
                        'success': False,
                        'error': 'Tipo de archivo no permitido',
                        'fileType': file.content_type if file else 'unknown',
                        'fileSize': 0,
                        'fileSizeFormatted': '0 B'
                    })
                    processed_count += 1
                    
            except Exception as file_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f'Error inesperado procesando archivo {filename or "desconocido"}: {str(file_error)}')
                print(f'Traceback: {error_trace}')
                results.append({
                    'fileName': filename or (file.filename if file else 'desconocido'),
                    'success': False,
                    'error': f'Error inesperado: {str(file_error)}',
                    'fileType': file.content_type if file else 'unknown',
                    'fileSize': 0,
                    'fileSizeFormatted': '0 B',
                    'debugInfo': error_trace
                })
                processed_count += 1
            finally:
                # Limpiar archivo temporal de forma segura
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as cleanup_error:
                        print(f'Error al limpiar archivo temporal {file_path}: {str(cleanup_error)}')
        
        print(f'Procesamiento completado: {len(results)}/{total_files} archivos procesados')
        
        # Retornar resultados con información de completitud
        return jsonify({
            'results': results,
            'totalFiles': total_files,
            'processedFiles': len(results),
            'completed': len(results) == total_files
        })
        
    except KeyboardInterrupt:
        # Si se interrumpe manualmente, retornar resultados parciales
        print('Procesamiento interrumpido por el usuario')
        if 'results' in locals() and results:
            return jsonify({
                'results': results,
                'totalFiles': total_files if 'total_files' in locals() else len(results),
                'processedFiles': len(results),
                'completed': False,
                'warning': 'Procesamiento interrumpido. Se retornan resultados parciales.'
            }), 206  # 206 Partial Content
        else:
            return jsonify({'error': 'Procesamiento interrumpido antes de procesar archivos'}), 500
            
    except MemoryError as mem_error:
        # Si hay error de memoria, retornar resultados parciales
        import traceback
        error_trace = traceback.format_exc()
        print(f'Error de memoria en process_qr: {str(mem_error)}')
        print(f'Traceback: {error_trace}')
        if 'results' in locals() and results:
            return jsonify({
                'results': results,
                'totalFiles': total_files if 'total_files' in locals() else len(results),
                'processedFiles': len(results),
                'completed': False,
                'warning': f'Error de memoria después de procesar {len(results)} archivos. Se retornan resultados parciales.',
                'error': f'Error de memoria: {str(mem_error)}'
            }), 206  # 206 Partial Content
        else:
            return jsonify({
                'error': f'Error de memoria del servidor: {str(mem_error)}',
                'traceback': error_trace
            }), 500
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'Error crítico en process_qr: {str(e)}')
        print(f'Traceback: {error_trace}')
        
        # Si hay resultados parciales, retornarlos
        if 'results' in locals() and results:
            return jsonify({
                'results': results,
                'totalFiles': total_files if 'total_files' in locals() else len(results),
                'processedFiles': len(results),
                'completed': False,
                'warning': f'Error crítico después de procesar {len(results)} archivos. Se retornan resultados parciales.',
                'error': f'Error del servidor: {str(e)}',
                'traceback': error_trace
            }), 206  # 206 Partial Content
        else:
            return jsonify({
                'error': f'Error del servidor: {str(e)}',
                'traceback': error_trace
            }), 500

@app.route('/api/process-ocr', methods=['POST'])
def process_ocr():
    """Procesar archivos con OCR"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No se encontraron archivos'}), 400
        
        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'error': 'No se seleccionaron archivos'}), 400
        
        # Validar cantidad máxima de archivos
        MAX_FILES = 500
        if len(files) > MAX_FILES:
            return jsonify({
                'error': f'Se pueden procesar hasta {MAX_FILES} archivos a la vez. Has enviado {len(files)} archivos.'
            }), 400
        
        results = []
        lang = request.form.get('lang', 'spa')  # Idioma para OCR, por defecto español
        
        for file in files:
            if file and allowed_file(file.filename):
                # Guardar archivo temporalmente
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                try:
                    # Procesar archivo con OCR
                    content_type = file.content_type or ''
                    result = ocr_processor.process_file(file_path, content_type, lang)
                    
                    result['fileName'] = filename
                    result['fileType'] = content_type or 'application/octet-stream'
                    result['fileSize'] = os.path.getsize(file_path)
                    result['fileSizeFormatted'] = format_file_size(result['fileSize'])
                    
                    results.append(result)
                    
                except Exception as e:
                    results.append({
                        'fileName': filename,
                        'success': False,
                        'error': f'Error al procesar archivo: {str(e)}',
                        'fileType': content_type or 'application/octet-stream',
                        'fileSize': os.path.getsize(file_path) if os.path.exists(file_path) else 0
                    })
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
    return jsonify({'status': 'OK', 'message': 'Servidor funcionando correctamente'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtener estadísticas de procesamiento"""
    try:
        total = STATS['total_processed']
        success_rate = (STATS['successful_detections'] / total * 100) if total > 0 else 0
        failure_rate = (STATS['failed_detections'] / total * 100) if total > 0 else 0
        
        # Estadísticas por tipo de archivo
        file_type_stats = {}
        for file_type, data in STATS['by_file_type'].items():
            total_type = data['total']
            file_type_stats[file_type] = {
                'total': total_type,
                'success': data['success'],
                'failed': data['failed'],
                'success_rate': round((data['success'] / total_type * 100) if total_type > 0 else 0, 2)
            }
        
        # Tiempo promedio de procesamiento
        avg_processing_time = sum(STATS['processing_times']) / len(STATS['processing_times']) if STATS['processing_times'] else 0
        min_processing_time = min(STATS['processing_times']) if STATS['processing_times'] else 0
        max_processing_time = max(STATS['processing_times']) if STATS['processing_times'] else 0
        
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
                'by_method': {},  # No se usa en este servidor
                'common_errors': {},  # No se rastrea en este servidor
                'performance': {
                    'avg_processing_time': round(avg_processing_time, 3),
                    'min_processing_time': round(min_processing_time, 3),
                    'max_processing_time': round(max_processing_time, 3)
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error al obtener estadísticas: {str(e)}"
        }), 500

@app.route('/api/stats', methods=['DELETE'])
def reset_stats():
    """Resetear todas las estadísticas de procesamiento"""
    try:
        STATS['total_processed'] = 0
        STATS['successful_detections'] = 0
        STATS['failed_detections'] = 0
        STATS['by_file_type'] = {}
        STATS['processing_times'] = []
        
        return jsonify({
            'success': True,
            'message': 'Estadísticas reseteadas correctamente'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error al resetear estadísticas: {str(e)}"
        }), 500

# Servir archivos estáticos del frontend en producción
# Esta ruta debe ir al final para no interferir con las rutas de API
# Flask procesa las rutas en el orden en que se definen, así que las rutas de API
# (que están arriba) tendrán prioridad sobre esta ruta genérica
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Sirve los archivos estáticos del frontend construido"""
    # No servir si es una ruta de API (aunque esto no debería pasar porque las rutas de API están definidas antes)
    if path.startswith('api/'):
        return jsonify({'error': 'Ruta API no encontrada'}), 404
    
    # Verificar si existe la carpeta dist (frontend construido)
    dist_folder = os.path.join(os.path.dirname(__file__), 'dist')
    
    if os.path.exists(dist_folder):
        # Si el path existe como archivo, servirlo
        if path != "" and os.path.exists(os.path.join(dist_folder, path)):
            return send_from_directory(dist_folder, path)
        # Si no, servir index.html (para SPA routing)
        else:
            return send_from_directory(dist_folder, 'index.html')
    else:
        # Si no existe dist, retornar mensaje informativo
        return jsonify({
            'message': 'Frontend no construido. Ejecuta "npm run build" primero.',
            'instructions': 'Para desarrollo, ejecuta "npm run dev" en otra terminal'
        }), 404

if __name__ == '__main__':
    # Detectar si estamos en producción o desarrollo
    flask_env = os.environ.get('FLASK_ENV', 'development')
    is_production = flask_env == 'production' or os.path.exists(os.path.join(os.path.dirname(__file__), 'dist'))
    
    # Obtener configuración
    current_config = config[config_name]
    host = current_config.HOST
    port = current_config.PORT
    debug_mode = current_config.DEBUG if not is_production else False
    
    # Configurar según el entorno
    if is_production:
        print("🚀 Modo PRODUCCIÓN activado")
        print("📦 Sirviendo archivos estáticos desde: dist/")
        print(f"🌐 Accede a la aplicación en: http://{host}:{port}")
    else:
        print("🔧 Modo DESARROLLO activado")
        print("💡 Para producción, ejecuta 'npm run build' primero")
        print(f"🌐 Backend API disponible en: http://{host}:{port}/api")
        print("🌐 Frontend (desarrollo) disponible en: http://localhost:3000")
    
    app.run(debug=debug_mode, host=host, port=port, threaded=True)
