# Dockerfile para Caja Chica Financiera
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libzbar0 \
    libopencv-dev \
    python3-opencv \
    tesseract-ocr \
    tesseract-ocr-spa \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de requisitos
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn python-dotenv

# Copiar archivos del proyecto
COPY . .

# Construir frontend (requiere Node.js)
# Instalar Node.js temporalmente para el build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install && \
    npm run build && \
    apt-get remove -y nodejs && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Crear directorios necesarios
RUN mkdir -p uploads temp

# Variables de entorno por defecto
ENV FLASK_ENV=production
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Exponer puerto
EXPOSE 5000

# Comando para ejecutar la aplicación
CMD gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app

