# Dockerfile para Caja Chica Financiera
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    curl \
    xz-utils \
    poppler-utils \
    libzbar0 \
    libopencv-dev \
    python3-opencv \
    tesseract-ocr \
    tesseract-ocr-spa \
    libjpeg-dev \
    zlib1g-dev \
    libtiff-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar Node.js (descargar directamente desde nodejs.org)
RUN curl -fsSL https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.xz -o node.tar.xz && \
    tar -xJf node.tar.xz -C /usr/local --strip-components=1 && \
    rm node.tar.xz && \
    ln -s /usr/local/bin/node /usr/bin/node && \
    ln -s /usr/local/bin/npm /usr/bin/npm

# Establecer directorio de trabajo
WORKDIR /app

# Copiar todo el código primero
COPY . .

# Instalar dependencias de Python
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Instalar dependencias de Node.js
RUN npm install

# Construir frontend
RUN npm run build

# Crear directorios necesarios
RUN mkdir -p uploads temp

# Variables de entorno por defecto
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Exponer puerto (Render asignará el puerto dinámicamente)
# Render usa la variable de entorno PORT automáticamente
EXPOSE 10000

# Comando para ejecutar la aplicación
# Render inyecta la variable PORT automáticamente
# Usar shell form para que $PORT se expanda correctamente
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:${PORT:-10000} --timeout 1800 server:app"]
