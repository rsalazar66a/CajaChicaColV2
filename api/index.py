"""
Vercel Serverless Function wrapper for Flask app
Nota: Vercel tiene limitaciones de tiempo (10s gratis, 60s pagado)
Para procesamiento pesado de imágenes, considera Render o Railway
"""
from server import app

# Exportar la app Flask para Vercel
# Vercel espera un objeto 'handler'
def handler(request):
    return app(request.environ, lambda status, headers: None)

