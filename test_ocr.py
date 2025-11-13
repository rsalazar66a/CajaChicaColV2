"""
Módulo para procesamiento OCR de imágenes y PDFs
"""
import os
import cv2
import numpy as np
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import tempfile
import time

class OCRProcessor:
    """Procesador OCR para extraer texto de imágenes y PDFs"""
    
    def __init__(self):
        # Configurar ruta de Tesseract automáticamente en Windows
        if os.name == 'nt':  # Windows
            # Rutas comunes de Tesseract en Windows
            possible_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME', '')),
            ]
            
            # Intentar encontrar Tesseract
            tesseract_found = False
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    tesseract_found = True
                    print(f'Tesseract encontrado en: {path}')
                    break
            
            # Si no se encuentra, intentar usar el PATH
            if not tesseract_found:
                try:
                    # Verificar si está en el PATH
                    import subprocess
                    result = subprocess.run(['tesseract', '--version'], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        print('Tesseract encontrado en PATH')
                        tesseract_found = True
                except:
                    pass
            
            if not tesseract_found:
                print('ADVERTENCIA: Tesseract OCR no encontrado. Por favor instálalo desde:')
                print('https://github.com/UB-Mannheim/tesseract/wiki')
                print('O configura manualmente la ruta en ocr_processor.py')

## Instrucciones paso a paso para instalar Tesseract OCR

### Paso 1: Descargar Tesseract OCR

1. Abre tu navegador y ve a:
   ```
   https://github.com/UB-Mannheim/tesseract/wiki
   ```
2. Descarga la última versión para Windows (ej: `tesseract-ocr-w64-setup-5.4.0.20240606.exe`)

### Paso 2: Instalar Tesseract OCR

1. Ejecuta el instalador descargado
2. Durante la instalación:
   - ✅ Marca "Add to PATH" (importante)
   - Selecciona los idiomas:
     - ✅ Spanish (español)
     - ✅ English (inglés)
     - Otros si los necesitas
3. Completa la instalación

### Paso 3: Verificar la instalación

Abre PowerShell y ejecuta:

```powershell
tesseract --version
```

Deberías ver algo como:
```
tesseract 5.4.0
 leptonica-1.84.1
  libgif 5.2.2 : libjpeg 8d (libjpeg-turbo 3.0.1) : libpng 1.6.43 : libtiff 4.6.0 : zlib 1.3.1 : libwebp 1.4.0 : libopenjp2 2.5.2
```

### Paso 4: Instalar dependencias de Python

Con el entorno virtual activado:

```powershell
# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Instalar pytesseract
pip install pytesseract==0.3.10
```

### Paso 5: Probar la instalación

Crea un script de prueba `test_ocr.py`:

```python:test_ocr.py
import pytesseract
from PIL import Image
import cv2
import numpy as np

# Intentar detectar Tesseract
try:
    # Crear una imagen de prueba simple
    img = np.ones((100, 300, 3), dtype=np.uint8) * 255
    cv2.putText(img, 'TEST OCR', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    # Probar OCR
    text = pytesseract.image_to_string(img, lang='eng')
    print('✅ Tesseract OCR funciona correctamente!')
    print(f'Texto detectado: {text}')
except Exception as e:
    print(f'❌ Error: {e}')
    print('\nPor favor verifica:')
    print('1. Tesseract está instalado')
    print('2. Tesseract está en el PATH o configura la ruta manualmente')
```

Ejecuta:

```powershell
python test_ocr.py
```

## Si Tesseract no está en el PATH

Si no agregaste Tesseract al PATH durante la instalación, actualiza `ocr_processor.py` con la ruta exacta:

```python:ocr_processor.py
def __init__(self):
    # Configurar ruta de Tesseract manualmente (descomentar y ajustar si es necesario)
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## Resumen

1. ✅ Descargar Tesseract desde GitHub
2. ✅ Instalar marcando "Add to PATH"
3. ✅ Seleccionar idiomas (Spanish, English)
4. ✅ Verificar con `tesseract --version`
5. ✅ Instalar `pytesseract` con pip
6. ✅ Probar con el script de prueba

Después de estos pasos, el procesamiento OCR debería funcionar. ¿Necesitas ayuda con algún paso específico?
