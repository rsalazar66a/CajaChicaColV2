#!/usr/bin/env python3
"""
Script de configuración para la aplicación Caja Chica Financiera
Instala dependencias y configura el entorno
"""

import subprocess
import sys
import os

def install_python_dependencies():
    """Instala las dependencias de Python"""
    print("Instalando dependencias de Python...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencias de Python instaladas correctamente")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias de Python: {e}")
        return False
    return True

def install_node_dependencies():
    """Instala las dependencias de Node.js"""
    print("Instalando dependencias de Node.js...")
    try:
        subprocess.check_call(["npm", "install"])
        print("✅ Dependencias de Node.js instaladas correctamente")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias de Node.js: {e}")
        return False
    return True

def create_directories():
    """Crea los directorios necesarios"""
    print("Creando directorios necesarios...")
    directories = ['uploads', 'temp']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Directorio {directory} creado")

def check_system_requirements():
    """Verifica los requisitos del sistema"""
    print("Verificando requisitos del sistema...")
    
    # Verificar Python
    try:
        python_version = subprocess.check_output([sys.executable, "--version"]).decode().strip()
        print(f"✅ Python: {python_version}")
    except:
        print("❌ Python no encontrado")
        return False
    
    # Verificar Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"]).decode().strip()
        print(f"✅ Node.js: {node_version}")
    except:
        print("❌ Node.js no encontrado")
        return False
    
    # Verificar npm
    try:
        npm_version = subprocess.check_output(["npm", "--version"]).decode().strip()
        print(f"✅ npm: {npm_version}")
    except:
        print("❌ npm no encontrado")
        return False
    
    return True

def main():
    print("🚀 Configurando Caja Chica Financiera...")
    print("=" * 50)
    
    # Verificar requisitos
    if not check_system_requirements():
        print("❌ Faltan requisitos del sistema. Por favor instala Python, Node.js y npm")
        return
    
    # Crear directorios
    create_directories()
    
    # Instalar dependencias
    if install_python_dependencies() and install_node_dependencies():
        print("\n🎉 ¡Configuración completada exitosamente!")
        print("\nPara ejecutar la aplicación:")
        print("1. Terminal 1: python server.py (Backend Python)")
        print("2. Terminal 2: npm run dev (Frontend React)")
        print("\nLa aplicación estará disponible en http://localhost:3000")
    else:
        print("❌ Error durante la configuración")

if __name__ == "__main__":
    main()

