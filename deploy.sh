#!/bin/bash

echo "========================================"
echo "  Despliegue - Caja Chica Financiera"
echo "========================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si existe el entorno virtual
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[INFO]${NC} Entorno virtual no encontrado."
    echo "Creando entorno virtual..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} No se pudo crear el entorno virtual."
        exit 1
    fi
fi

# Activar entorno virtual
echo "Activando entorno virtual..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} No se pudo activar el entorno virtual."
    exit 1
fi

# Verificar e instalar dependencias de Python
echo ""
echo "Verificando dependencias de Python..."

# Verificar Gunicorn
python -c "import gunicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Instalando Gunicorn..."
    pip install gunicorn
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} No se pudo instalar Gunicorn."
        exit 1
    fi
fi

echo "Instalando/actualizando dependencias de Python..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[ADVERTENCIA]${NC} Algunas dependencias no se pudieron instalar."
fi

# Verificar e instalar dependencias de Node.js
echo ""
echo "Verificando dependencias de Node.js..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de Node.js..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} No se pudieron instalar las dependencias de Node.js."
        exit 1
    fi
fi

# Construir frontend
echo ""
echo "Construyendo frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} No se pudo construir el frontend."
    exit 1
fi

# Verificar que dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}[ERROR]${NC} La carpeta dist no existe. El build falló."
    exit 1
fi

# Crear directorios necesarios
echo ""
echo "Creando directorios necesarios..."
mkdir -p uploads
mkdir -p temp

# Configurar variables de entorno
export FLASK_ENV=production
export PORT=5000

# Obtener número de workers (CPU cores * 2 + 1)
WORKERS=$(($(nproc) * 2 + 1))
if [ $WORKERS -gt 8 ]; then
    WORKERS=8
fi

# Iniciar servidor
echo ""
echo "========================================"
echo "  Iniciando servidor en modo PRODUCCION"
echo "========================================"
echo ""
echo "Servidor disponible en: http://localhost:5000"
echo "Workers: $WORKERS"
echo "Presiona Ctrl+C para detener el servidor"
echo ""

gunicorn -w $WORKERS -b 0.0.0.0:5000 --timeout 1800 --access-logfile - --error-logfile - server:app

