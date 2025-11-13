@echo off
echo Iniciando Caja Chica Financiera...
echo.

echo Verificando dependencias...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python no encontrado. Por favor instala Python 3.8+
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js no encontrado. Por favor instala Node.js 16+
    pause
    exit /b 1
)

echo Dependencias verificadas correctamente.
echo.

echo Iniciando servidor backend...
start "Backend Python" cmd /k "python server.py"

echo Esperando 3 segundos para que el backend se inicie...
timeout /t 3 /nobreak >nul

echo Iniciando servidor frontend...
start "Frontend React" cmd /k "npm run dev"

echo.
echo ✅ Aplicación iniciada correctamente!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

