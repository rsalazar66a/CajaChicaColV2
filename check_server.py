"""
Script para verificar que el servidor Flask esté funcionando correctamente
"""
import requests
import sys

def check_server():
    try:
        # Verificar endpoint de health
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Servidor Flask está corriendo correctamente")
            print(f"   Respuesta: {response.json()}")
            return True
        else:
            print(f"❌ Servidor responde pero con código: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor Flask en http://localhost:5000")
        print("   Asegúrate de que el servidor esté corriendo:")
        print("   python server.py")
        return False
    except Exception as e:
        print(f"❌ Error al verificar servidor: {e}")
        return False

if __name__ == '__main__':
    if check_server():
        sys.exit(0)
    else:
        sys.exit(1)

