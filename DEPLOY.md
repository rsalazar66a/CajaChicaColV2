# 🚀 Guía de Despliegue - Caja Chica Financiera

Esta guía te ayudará a desplegar la aplicación en diferentes entornos.

## 📋 Índice

1. [Despliegue Local en Producción](#despliegue-local-en-producción)
2. [Despliegue en Servidor VPS/Cloud](#despliegue-en-servidor-vpscloud)
3. [Despliegue en Plataformas Cloud](#despliegue-en-plataformas-cloud)
   - [Render](#render)
   - [Railway](#railway)
   - [Heroku](#heroku)
4. [Despliegue con Docker](#despliegue-con-docker)
5. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)

---

## 🖥️ Despliegue Local en Producción

### Windows

1. **Construir el frontend:**
```bash
npm run build
```

2. **Instalar Waitress (servidor WSGI para producción):**
```bash
pip install waitress
```

3. **Ejecutar en producción:**
```bash
# Opción 1: Usar el script de despliegue
deploy.bat

# Opción 2: Manual
waitress-serve --host=0.0.0.0 --port=5000 server:app
```

4. **Acceder a la aplicación:**
```
http://localhost:5000
```

### Linux/Mac

1. **Construir el frontend:**
```bash
npm run build
```

2. **Instalar Gunicorn (servidor WSGI para producción):**
```bash
pip install gunicorn
```

3. **Ejecutar en producción:**
```bash
# Opción 1: Usar el script de despliegue
chmod +x deploy.sh
./deploy.sh

# Opción 2: Manual
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 1800 server:app
```

4. **Acceder a la aplicación:**
```
http://localhost:5000
```

---

## 🌐 Despliegue en Servidor VPS/Cloud

### Requisitos del Servidor

- **Sistema Operativo:** Ubuntu 20.04+ / Debian 11+ / Windows Server
- **Python:** 3.8+
- **Node.js:** 16+
- **Memoria RAM:** Mínimo 2GB (recomendado 4GB+)
- **Espacio en disco:** Mínimo 5GB

### Dependencias del Sistema

#### Linux (Ubuntu/Debian)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y pip
sudo apt install python3 python3-pip python3-venv -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Poppler (para procesamiento de PDF)
sudo apt install poppler-utils -y

# Instalar dependencias de OpenCV
sudo apt install libopencv-dev python3-opencv -y

# Instalar zbar (para códigos QR)
sudo apt install libzbar0 -y

# Instalar Tesseract OCR (opcional, para OCR)
sudo apt install tesseract-ocr tesseract-ocr-spa -y
```

#### Windows Server

1. Instalar Python desde [python.org](https://www.python.org/downloads/)
2. Instalar Node.js desde [nodejs.org](https://nodejs.org/)
3. Instalar Poppler desde [GitHub Releases](https://github.com/oschwartz10612/poppler-windows/releases/)
   - Extraer y añadir al PATH del sistema

### Pasos de Despliegue

1. **Clonar o subir el proyecto al servidor:**
```bash
# Si usas Git
git clone <tu-repositorio>
cd CajaChicaColV2

# O subir los archivos vía SFTP/SCP
```

2. **Configurar entorno virtual:**
```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

3. **Instalar dependencias:**
```bash
# Python
pip install -r requirements.txt
pip install waitress  # Windows
# o
pip install gunicorn  # Linux/Mac

# Node.js
npm install
```

4. **Construir frontend:**
```bash
npm run build
```

5. **Configurar variables de entorno:**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
nano .env  # o usar tu editor preferido
```

6. **Configurar como servicio del sistema (Linux):**

Crear archivo `/etc/systemd/system/cajachica.service`:

```ini
[Unit]
Description=Caja Chica Financiera
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/ruta/a/CajaChicaColV2
Environment="PATH=/ruta/a/CajaChicaColV2/venv/bin"
ExecStart=/ruta/a/CajaChicaColV2/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 1800 server:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cajachica
sudo systemctl start cajachica
sudo systemctl status cajachica
```

7. **Configurar Nginx como reverse proxy (opcional pero recomendado):**

Instalar Nginx:
```bash
sudo apt install nginx -y
```

Configurar `/etc/nginx/sites-available/cajachica`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    client_max_body_size 1G;
    proxy_read_timeout 1800s;
    proxy_connect_timeout 1800s;
    proxy_send_timeout 1800s;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar configuración:
```bash
sudo ln -s /etc/nginx/sites-available/cajachica /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Configurar SSL con Let's Encrypt (recomendado):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

---

## ☁️ Despliegue en Plataformas Cloud

### ⚠️ Nota Importante sobre Vercel

**Vercel NO es recomendado para esta aplicación** porque:
- ❌ Límite de tiempo: 10 segundos (plan gratuito) / 60 segundos (planes pagados)
- ❌ El procesamiento de imágenes con OpenCV puede tomar más tiempo
- ❌ No soporta bien aplicaciones Flask tradicionales
- ❌ Requiere convertir a funciones serverless (complejidad adicional)

**Alternativas recomendadas:** Render, Railway, o Heroku (ver abajo)

### Vercel (No recomendado - Solo para frontend estático)

Si aún así quieres intentar con Vercel:

1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
# O usar npx sin instalación global:
npx vercel
```

2. **Login:**
```bash
npx vercel login
```

3. **Desplegar:**
```bash
npx vercel deploy
```

4. **Configurar variables de entorno en el dashboard de Vercel:**
   - `FLASK_ENV=production`

**Limitaciones:**
- ⏱️ Timeout de 10s (gratis) o 60s (pago)
- 📦 Tamaño máximo de función: 50MB
- 🔄 Cold starts pueden ser lentos

### Render (Recomendado ✅)

1. **Crear cuenta en [Render](https://render.com/)**

2. **Conectar repositorio Git**

3. **Crear nuevo Web Service:**
   - **Build Command:** `npm install && npm run build && pip install -r requirements.txt`
   - **Start Command:** `gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app`
   - **Environment:** Python 3
   - **Port:** 5000 (o el que Render asigne)

4. **Variables de entorno:**
   - `FLASK_ENV=production`
   - `PORT=5000` (Render lo asigna automáticamente)

5. **Nota:** Render requiere que el servidor escuche en el puerto asignado por la variable `$PORT`

### Railway

1. **Crear cuenta en [Railway](https://railway.app/)**

2. **Conectar repositorio Git**

3. **Railway detectará automáticamente el proyecto**

4. **Variables de entorno:**
   - `FLASK_ENV=production`
   - `PORT=5000` (Railway lo asigna automáticamente)

5. **Railway usará el `Procfile` automáticamente**

### Heroku

1. **Instalar Heroku CLI:**
```bash
# Windows
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli

# Linux/Mac
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login en Heroku:**
```bash
heroku login
```

3. **Crear aplicación:**
```bash
heroku create tu-app-name
```

4. **Configurar buildpacks:**
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

5. **Variables de entorno:**
```bash
heroku config:set FLASK_ENV=production
```

6. **Desplegar:**
```bash
git push heroku main
```

7. **Abrir aplicación:**
```bash
heroku open
```

**Nota:** Heroku tiene límites de tiempo de request (30 segundos). Para procesamientos largos, considera usar un servicio de cola como Celery.

---

## 🐳 Despliegue con Docker

### Crear Dockerfile

El archivo `Dockerfile` ya está incluido en el proyecto.

### Construir y ejecutar

```bash
# Construir imagen
docker build -t cajachica:latest .

# Ejecutar contenedor
docker run -d -p 5000:5000 --name cajachica cajachica:latest

# Ver logs
docker logs -f cajachica
```

### Docker Compose

Crear `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - PORT=5000
    volumes:
      - ./uploads:/app/uploads
      - ./temp:/app/temp
    restart: unless-stopped
```

Ejecutar:
```bash
docker-compose up -d
```

---

## ⚙️ Configuración de Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Entorno
FLASK_ENV=production
DEBUG=False

# Servidor
HOST=0.0.0.0
PORT=5000

# CORS (si es necesario)
CORS_ORIGINS=http://localhost:5000,https://tu-dominio.com

# Límites
MAX_CONTENT_LENGTH=1073741824  # 1GB en bytes
MAX_FILES=500

# Procesamiento
QR_DETECTION_CONFIDENCE=0.6
MAX_QR_ATTEMPTS=3
```

**Importante:** No subir el archivo `.env` al repositorio. Añádelo a `.gitignore`.

---

## 🔒 Seguridad en Producción

1. **Desactivar modo debug:**
   - Asegúrate de que `DEBUG=False` en producción

2. **Usar HTTPS:**
   - Configurar SSL/TLS con Let's Encrypt o tu proveedor

3. **Configurar firewall:**
   - Solo abrir puertos necesarios (80, 443, 22)

4. **Limitar tamaño de archivos:**
   - Ajustar `MAX_CONTENT_LENGTH` según necesidades

5. **Backups regulares:**
   - Configurar backups automáticos de datos importantes

---

## 📊 Monitoreo y Logs

### Ver logs del servicio (Linux)

```bash
# Ver logs en tiempo real
sudo journalctl -u cajachica -f

# Ver últimos 100 líneas
sudo journalctl -u cajachica -n 100
```

### Ver logs de Docker

```bash
docker logs -f cajachica
```

---

## 🐛 Solución de Problemas

### Error: "Module not found"
- Verifica que todas las dependencias estén instaladas
- Activa el entorno virtual antes de ejecutar

### Error: "Port already in use"
- Cambia el puerto en la configuración
- O detén el proceso que usa el puerto:
  ```bash
  # Linux
  sudo lsof -i :5000
  sudo kill -9 <PID>
  
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Error: "Poppler not found"
- Instala Poppler y añádelo al PATH
- En Linux: `sudo apt install poppler-utils`
- En Windows: Descargar desde GitHub y añadir al PATH

### Error: "Frontend not built"
- Ejecuta `npm run build` antes de iniciar el servidor

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:
1. Revisa los logs del servidor
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que el frontend esté construido
4. Verifica las variables de entorno

---

## ✅ Checklist de Despliegue

- [ ] Dependencias del sistema instaladas (Poppler, zbar, etc.)
- [ ] Python 3.8+ instalado
- [ ] Node.js 16+ instalado
- [ ] Entorno virtual creado y activado
- [ ] Dependencias de Python instaladas (`pip install -r requirements.txt`)
- [ ] Dependencias de Node.js instaladas (`npm install`)
- [ ] Frontend construido (`npm run build`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Servidor WSGI instalado (Waitress/Gunicorn)
- [ ] Servicio del sistema configurado (opcional)
- [ ] Nginx configurado como reverse proxy (opcional)
- [ ] SSL/TLS configurado (recomendado)
- [ ] Firewall configurado
- [ ] Backups configurados
- [ ] Monitoreo configurado

---

¡Tu aplicación está lista para producción! 🎉

