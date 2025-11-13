@echo off
echo ========================================
echo   Despliegue - Caja Chica Financiera
echo ========================================
echo.

REM Verificar si existe el entorno virtual
if not exist "venv\" (
    echo [ERROR] Entorno virtual no encontrado.
    echo Creando entorno virtual...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
)

REM Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] No se pudo activar el entorno virtual.
    pause
    exit /b 1
)

REM Verificar e instalar dependencias de Python
echo.
echo Verificando dependencias de Python...
pip show waitress >nul 2>&1
if errorlevel 1 (
    echo Instalando Waitress...
    pip install waitress
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar Waitress.
        pause
        exit /b 1
    )
)

echo Verificando otras dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ADVERTENCIA] Algunas dependencias no se pudieron instalar.
)

REM Verificar e instalar dependencias de Node.js
echo.
echo Verificando dependencias de Node.js...
if not exist "node_modules\" (
    echo Instalando dependencias de Node.js...
    call npm install
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias de Node.js.
        pause
        exit /b 1
    )
)

REM Construir frontend
echo.
echo Construyendo frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] No se pudo construir el frontend.
    pause
    exit /b 1
)

REM Verificar que dist existe
if not exist "dist\" (
    echo [ERROR] La carpeta dist no existe. El build falló.
    pause
    exit /b 1
)

REM Crear directorios necesarios
echo.
echo Creando directorios necesarios...
if not exist "uploads\" mkdir uploads
if not exist "temp\" mkdir temp

REM Configurar variables de entorno
echo.
echo Configurando entorno de producción...
set FLASK_ENV=production
set PORT=5000

REM Iniciar servidor
echo.
echo ========================================
echo   Iniciando servidor en modo PRODUCCION
echo ========================================
echo.
echo Servidor disponible en: http://localhost:5000
echo Presiona Ctrl+C para detener el servidor
echo.

waitress-serve --host=0.0.0.0 --port=5000 server:app

pause

