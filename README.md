# Caja Chica Financiera - Extracción de Códigos QR

Una aplicación web elegante y profesional para extraer códigos QR de facturas y documentos financieros.

## 🚀 Características

- **Interfaz moderna**: Diseño limpio y profesional con Tailwind CSS
- **Soporte múltiple de formatos**: JPG, PNG, BMP, TIFF, PDF, HEIC, HEIF
- **Extracción inteligente**: Algoritmos especializados para cada tipo de archivo
- **Detección de CUFE**: Extracción automática de claves de acceso
- **Procesamiento en lote**: Múltiples archivos simultáneamente

## 📋 Requisitos del Sistema

- Python 3.8+
- Node.js 16+
- npm o yarn

### Dependencias del Sistema (Windows)

Para el procesamiento de PDF y HEIC, necesitarás instalar:

1. **Poppler** (para PDF):
   - Descarga desde: https://github.com/oschwartz10612/poppler-windows/releases/
   - Extrae y añade al PATH

2. **Libheif** (para HEIC):
   - Se instala automáticamente con pip

## 🛠️ Instalación

### Opción 1: Instalación Automática
```bash
python setup.py
```

### Opción 2: Instalación Manual

1. **Instalar dependencias de Python:**
```bash
pip install -r requirements.txt
```

2. **Instalar dependencias de Node.js:**
```bash
npm install
```

## 🚀 Ejecución

### Desarrollo
1. **Iniciar backend (Terminal 1):**
```bash
python server.py
```

2. **Iniciar frontend (Terminal 2):**
```bash
npm run dev
```

3. **Abrir navegador:**
```
http://localhost:3000
```

### Producción

1. **Construir el frontend:**
```bash
npm run build
```

2. **Ejecutar el servidor (sirve frontend y backend):**
```bash
python server.py
```

3. **Acceder a la aplicación:**
```
http://localhost:5000
```

**Nota:** El servidor detecta automáticamente si existe la carpeta `dist/` y activa el modo producción:
- ✅ Modo producción: Sirve el frontend construido desde `dist/` y desactiva el modo debug
- 🔧 Modo desarrollo: Solo sirve la API, el frontend debe ejecutarse con `npm run dev`

**Para producción con servidor WSGI (recomendado):**

**Windows (Waitress):**
```bash
# Activar entorno virtual primero
.\venv\Scripts\Activate.ps1

# Luego ejecutar waitress (ya está en requirements.txt)
waitress-serve --host=0.0.0.0 --port=5000 server:app
```

**Nota:** Si no tienes el entorno virtual activado, PowerShell no reconocerá el comando `waitress-serve`. Asegúrate de activar el entorno virtual primero.

**Linux/Mac (Gunicorn):**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 1800 server:app
```

**Despliegue rápido con scripts:**

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

📖 **Para más información sobre despliegue, consulta [DEPLOY.md](DEPLOY.md)**

## 🔧 Algoritmos de Procesamiento

### Imágenes (JPG, PNG, BMP, TIFF)
- **OpenCV** para preprocesamiento
- **Pyzbar** para detección de códigos QR
- Optimización de contraste y filtros

### Documentos PDF
- **pdf2image** para conversión a imágenes
- **Pyzbar** para detección en cada página
- Procesamiento página por página

### Archivos HEIC/HEIF (iPhone)
- **Libheif** para decodificación
- Conversión a formato estándar
- **Pyzbar** para detección final

## 📊 Extracción de Información

La aplicación extrae automáticamente:
- **Códigos QR completos**
- **Claves de acceso/CUFE**
- **Información adicional de facturas**
- **Metadatos de archivos**

## 🎨 Tecnologías Utilizadas

### Frontend
- React 18
- Tailwind CSS
- Lucide React (iconos)
- Axios (HTTP client)

### Backend
- Flask (Python)
- OpenCV (procesamiento de imágenes)
- Pyzbar (detección QR)
- pdf2image (conversión PDF)
- Libheif (archivos HEIC)

## 📁 Estructura del Proyecto

```
cajaChicaColV2/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── FileUploader.jsx
│   │   ├── ProcessingStatus.jsx
│   │   └── QRResults.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server.py
├── requirements.txt
├── package.json
└── README.md
```

## 📄 Archivos Procesados

La aplicación procesa los siguientes tipos de archivos para extraer códigos QR:

### Imágenes Estándar
1. **JPG/JPEG** (`.jpg`, `.jpeg`)
   - Tipo MIME: `image/jpeg`, `image/jpg`
   - Procesamiento: OpenCV + Pyzbar

2. **PNG** (`.png`)
   - Tipo MIME: `image/png`
   - Procesamiento: OpenCV + Pyzbar

3. **BMP** (`.bmp`)
   - Tipo MIME: `image/bmp`
   - Procesamiento: OpenCV + Pyzbar

4. **TIFF/TIF** (`.tiff`, `.tif`)
   - Tipo MIME: `image/tiff`, `image/tif`
   - Procesamiento: OpenCV + Pyzbar

### Documentos
5. **PDF** (`.pdf`)
   - Tipo MIME: `application/pdf`
   - Procesamiento: pdf2image + Pyzbar (página por página)

### Imágenes HEIC/HEIF (iPhone)
6. **HEIC** (`.heic`)
   - Tipo MIME: `image/heic`
   - Procesamiento: Libheif + Pyzbar

7. **HEIF** (`.heif`)
   - Tipo MIME: `image/heif`
   - Procesamiento: Libheif + Pyzbar

### Limitaciones
- Tamaño máximo por archivo: 50MB
- Los archivos se procesan temporalmente y se eliminan automáticamente después del procesamiento

## 🔍 Uso

1. **Seleccionar archivos**: Arrastra y suelta o haz clic para seleccionar
2. **Formatos soportados**: JPG, PNG, BMP, TIFF, PDF, HEIC, HEIF
3. **Procesar**: Haz clic en "Extraer Códigos QR"
4. **Resultados**: Ve los códigos QR extraídos y las claves CUFE
5. **Exportar**: Descarga los resultados en formato JSON

## 🐛 Solución de Problemas

### Error: "No se pudo cargar la imagen"
- Verifica que el archivo no esté corrupto
- Asegúrate de que el formato sea compatible

### Error: "No se encontraron códigos QR"
- Verifica que la imagen tenga códigos QR visibles
- Intenta con una imagen de mayor resolución

### Error de dependencias
- Ejecuta `python setup.py` para reinstalar
- Verifica que Poppler esté en el PATH

## 📝 Notas de Desarrollo

- El backend corre en el puerto 5000
- El frontend corre en el puerto 3000
- Los archivos se procesan temporalmente y se eliminan automáticamente
- Máximo 50MB por archivo

## 🤝 Contribuciones

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

