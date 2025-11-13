# Ejemplo de Uso - Caja Chica Financiera

## 🎯 Casos de Uso Comunes

### 1. Procesamiento de Facturas Escaneadas
- **Formato**: JPG, PNG
- **Fuente**: Escáner, cámara de teléfono
- **Proceso**: Subir → Procesar → Extraer CUFE

### 2. Documentos PDF con Códigos QR
- **Formato**: PDF
- **Fuente**: Facturas electrónicas, documentos oficiales
- **Proceso**: Subir → Convertir a imagen → Detectar QR → Extraer CUFE

### 3. Fotos de iPhone (HEIC)
- **Formato**: HEIC, HEIF
- **Fuente**: Cámara de iPhone
- **Proceso**: Subir → Convertir a JPG → Detectar QR → Extraer CUFE

## 📋 Flujo de Trabajo Típico

### Paso 1: Preparar Archivos
```
📁 Archivos a procesar:
├── factura_001.jpg
├── documento_002.pdf
├── foto_iphone_003.heic
└── escaneo_004.png
```

### Paso 2: Subir Archivos
1. Abrir http://localhost:3000
2. Arrastrar archivos al área de carga
3. Verificar que aparezcan en la lista
4. Hacer clic en "Extraer Códigos QR"

### Paso 3: Procesar
- El sistema procesará cada archivo automáticamente
- Aplicará el algoritmo correspondiente según el tipo
- Mostrará el progreso en tiempo real

### Paso 4: Revisar Resultados
```json
{
  "fileName": "factura_001.jpg",
  "success": true,
  "qrData": "CUFE: ABC123XYZ789...",
  "cufe": "ABC123XYZ789...",
  "additionalInfo": {
    "hasCufe": true,
    "qrLength": 150,
    "possibleInvoiceData": true
  }
}
```

### Paso 5: Exportar Resultados
- Hacer clic en "Exportar" para descargar JSON
- Copiar claves CUFE individuales
- Guardar para procesamiento posterior

## 🔍 Tipos de Códigos QR Soportados

### Facturas Electrónicas Colombianas
- **Formato**: CUFE (Código Único de Facturación Electrónica)
- **Patrón**: `CUFE: [clave]`
- **Ejemplo**: `CUFE: ABC123XYZ789DEF456GHI012JKL345MNO678PQR901STU234VWX567YZA890BCD123EFG456HIJ789KLM012NOP345QRS678TUV901WXY234ZAB567CDE890FGH123IJK456LMN789OPQ012RST345UVW678XYZ901`

### Documentos Fiscales
- **Formato**: Clave de acceso
- **Patrón**: `Clave: [clave]`
- **Ejemplo**: `Clave: 1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ`

### Códigos QR Genéricos
- **Formato**: Cualquier texto
- **Detección**: Secuencias alfanuméricas largas
- **Ejemplo**: `https://ejemplo.com/factura?id=123456789`

## 🛠️ Configuración Avanzada

### Ajustar Sensibilidad de Detección
```python
# En config.py
QR_DETECTION_CONFIDENCE = 0.6  # Aumentar para mayor precisión
MAX_QR_ATTEMPTS = 3           # Número de intentos por archivo
```

### Añadir Nuevos Patrones CUFE
```python
# En utils.py
CUFE_PATTERNS = [
    r'CUFE[:\s]*([A-Za-z0-9+/=]+)',
    r'Clave[:\s]*([A-Za-z0-9+/=]+)',
    r'Tu_Patron_Personalizado[:\s]*([A-Za-z0-9+/=]+)'
]
```

## 📊 Interpretación de Resultados

### Resultado Exitoso
```json
{
  "success": true,
  "qrData": "Datos completos del QR",
  "cufe": "Clave extraída",
  "additionalInfo": {
    "hasCufe": true,
    "qrLength": 150,
    "containsNumbers": true,
    "containsLetters": true,
    "possibleInvoiceData": true
  }
}
```

### Resultado con Error
```json
{
  "success": false,
  "error": "No se encontraron códigos QR",
  "fileName": "archivo.jpg",
  "fileType": "image/jpeg"
}
```

## 🔧 Solución de Problemas Comunes

### "No se encontraron códigos QR"
- **Causa**: Imagen de baja calidad, QR dañado
- **Solución**: Mejorar resolución, verificar que el QR esté visible

### "Error al procesar archivo"
- **Causa**: Archivo corrupto, formato no soportado
- **Solución**: Verificar integridad del archivo, convertir a formato soportado

### "CUFE no detectado"
- **Causa**: QR no contiene patrón CUFE reconocido
- **Solución**: Verificar formato del QR, añadir patrón personalizado

## 📈 Mejores Prácticas

### Para Imágenes
- **Resolución**: Mínimo 800x600 píxeles
- **Formato**: JPG o PNG
- **Calidad**: QR debe ser claramente visible
- **Orientación**: QR debe estar derecho

### Para PDF
- **Páginas**: Procesa todas las páginas automáticamente
- **Calidad**: PDF debe tener buena resolución
- **Tamaño**: Máximo 50MB por archivo

### Para HEIC
- **Origen**: Fotos de iPhone/iPad
- **Calidad**: Usar modo de alta resolución
- **Conversión**: Automática a JPG para procesamiento

## 🎯 Casos de Uso Específicos

### Contabilidad
- Procesar facturas de proveedores
- Extraer claves CUFE para registro
- Validar documentos fiscales

### Auditoría
- Verificar autenticidad de facturas
- Extraer metadatos de documentos
- Generar reportes de procesamiento

### Gestión Documental
- Digitalizar documentos físicos
- Extraer información estructurada
- Automatizar flujos de trabajo

¡La aplicación está lista para procesar tus documentos financieros! 🚀

