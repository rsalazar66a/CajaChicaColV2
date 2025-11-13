#!/bin/bash

echo "🚀 Iniciando Caja Chica Financiera..."
echo

# Verificar dependencias
echo "Verificando dependencias..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 no encontrado. Por favor instala Python 3.8+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no encontrado. Por favor instala Node.js 16+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no encontrado. Por favor instala npm"
    exit 1
fi

echo "✅ Dependencias verificadas correctamente."
echo

# Crear directorios necesarios
mkdir -p uploads temp

# Iniciar backend en background
echo "Iniciando servidor backend..."
python3 server.py &
BACKEND_PID=$!

# Esperar un momento para que el backend se inicie
sleep 3

# Iniciar frontend
echo "Iniciando servidor frontend..."
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Aplicación iniciada correctamente!"
echo
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Presiona Ctrl+C para detener ambos servidores..."

# Función para limpiar procesos al salir
cleanup() {
    echo
    echo "Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servidores detenidos."
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Esperar a que termine cualquiera de los procesos
wait

