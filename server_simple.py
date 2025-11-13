from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import base64
from werkzeug.utils import secure_filename

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

def simulate_qr_extraction(file_path, file_type):
    """Simula la extracción de códigos QR para demostración"""
    try:
        # Simular diferentes tipos de archivos
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            # Simular código QR de factura
            qr_data = "CUFE: ABC123XYZ789DEF456GHI012JKL345MNO678PQR901STU234VWX567YZA890BCD123EFG456HIJ789KLM012NOP345QRS678TUV901WXY234ZAB567CDE890FGH123IJK456LMN789OPQ012RST345UVW678XYZ901"
            cufe = "ABC123XYZ789DEF456GHI012JKL345MNO678PQR901STU234VWX567YZA890BCD123EFG456HIJ789KLM012NOP345QRS678TUV901WXY234ZAB567CDE890FGH123IJK456LMN789OPQ012RST345UVW678XYZ901"
            
        elif file_type == 'application/pdf':
            # Simular código QR de PDF
            qr_data = "Clave: 1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            cufe = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            
        elif file_type in ['image/heic', 'image/heif']:
            # Simular código QR de HEIC
            qr_data = "Código: HEIC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            cufe = "HEIC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        else:
            return None, "Tipo de archivo no soportado"
        
        return {
            'success': True,
            'qrData': qr_data,
            'cufe': cufe,
            'additionalInfo': {
                'qrLength': len(qr_data),
                'hasCufe': True,
                'containsNumbers': True,
                'containsLetters': True,
                'possibleInvoiceData': True
            }
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
                    # Procesar archivo (simulado)
                    result = simulate_qr_extraction(file_path, file.content_type)
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
    return jsonify({'status': 'OK', 'message': 'Servidor funcionando correctamente'})

if __name__ == '__main__':
    print("🚀 Iniciando Caja Chica Financiera...")
    print("📁 Directorio de trabajo:", os.getcwd())
    print("🌐 Servidor disponible en: http://localhost:5000")
    print("🔗 API Health: http://localhost:5000/api/health")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)

