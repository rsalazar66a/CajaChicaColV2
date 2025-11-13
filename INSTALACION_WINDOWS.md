# Instalación en Windows - Caja Chica Financiera

## 📋 Requisitos Previos

### 1. Python 3.8+
- Descargar desde: https://www.python.org/downloads/
- **IMPORTANTE**: Marcar "Add Python to PATH" durante la instalación
- Verificar instalación: `python --version`

### 2. Node.js 16+
- Descargar desde: https://nodejs.org/
- Incluye npm automáticamente
- Verificar instalación: `node --version` y `npm --version`

### 3. Poppler (para procesamiento de PDF)
- Descargar desde: https://github.com/oschwartz10612/poppler-windows/releases/
- Extraer en `C:\poppler`
- Añadir `C:\poppler\bin` al PATH del sistema

## 🚀 Instalación Automática

### Opción 1: Script de Instalación
```cmd
python setup.py
```

### Opción 2: Instalación Manual

#### 1. Instalar dependencias de Python
```cmd
pip install -r requirements.txt
```

#### 2. Instalar dependencias de Node.js
```cmd
npm install
```

## 🔧 Configuración del PATH (si es necesario)

### Añadir Poppler al PATH:
1. Abrir "Variables de entorno" en Windows
2. Editar la variable "Path"
3. Añadir: `C:\poppler\bin`
4. Reiniciar la terminal

### Verificar PATH:
```cmd
echo %PATH%
```

## 🚀 Ejecución

### Opción 1: Script de Inicio (Recomendado)
```cmd
start.bat
```

### Opción 2: Manual
```cmd
# Terminal 1 - Backend
python server.py

# Terminal 2 - Frontend
npm run dev
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 🐛 Solución de Problemas

### Error: "No se puede encontrar el módulo 'cv2'"
```cmd
pip install opencv-python
```

### Error: "No se puede encontrar el módulo 'pyzbar'"
```cmd
pip install pyzbar
```

### Error: "No se puede encontrar el módulo 'pdf2image'"
```cmd
pip install pdf2image
```

### Error: "No se puede encontrar el módulo 'libheif'"
```cmd
pip install libheif
```

### Error: "Poppler no encontrado"
1. Verificar que Poppler esté instalado
2. Verificar que esté en el PATH
3. Reiniciar la terminal

### Error: "No se puede encontrar el módulo 'flask'"
```cmd
pip install flask flask-cors
```

### Error de permisos en Windows
- Ejecutar PowerShell como Administrador
- Ejecutar: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 📁 Estructura de Archivos Después de la Instalación

```
cajaChicaColV2/
├── node_modules/          # Dependencias de Node.js
├── uploads/              # Archivos temporales
├── temp/                 # Archivos de procesamiento
├── src/                  # Código fuente React
├── server.py             # Servidor Python
├── requirements.txt      # Dependencias Python
├── package.json         # Dependencias Node.js
└── start.bat            # Script de inicio
```

## 🔍 Verificación de la Instalación

### 1. Verificar Python y dependencias:
```cmd
python -c "import cv2, pyzbar, flask; print('✅ Dependencias Python OK')"
```

### 2. Verificar Node.js y dependencias:
```cmd
npm list --depth=0
```

### 3. Verificar Poppler:
```cmd
pdftoppm -h
```

### 4. Probar la aplicación:
1. Ejecutar `start.bat`
2. Abrir http://localhost:3000
3. Subir una imagen con código QR
4. Verificar que se extraiga correctamente

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs**: Revisar la consola donde se ejecuta el servidor
2. **Verificar dependencias**: Ejecutar `python setup.py` nuevamente
3. **Reiniciar**: Cerrar todas las terminales y volver a ejecutar
4. **Verificar puertos**: Asegurarse de que los puertos 3000 y 5000 estén libres

## 🎯 Próximos Pasos

Una vez instalado correctamente:

1. **Probar con imágenes**: Subir archivos JPG/PNG con códigos QR
2. **Probar con PDF**: Subir documentos PDF con códigos QR
3. **Probar con HEIC**: Subir fotos de iPhone con códigos QR
4. **Verificar extracción**: Confirmar que se extraigan las claves CUFE

¡La aplicación está lista para usar! 🎉

