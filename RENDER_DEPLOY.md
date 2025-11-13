# 🚀 Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu aplicación Caja Chica Financiera en Render paso a paso.

## 📋 Requisitos Previos

1. ✅ Cuenta en [Render.com](https://render.com) (gratis)
2. ✅ Repositorio Git (GitHub, GitLab, o Bitbucket)
3. ✅ Tu código subido al repositorio

## 🎯 Pasos para Desplegar

### Paso 1: Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git:

```bash
# Si aún no tienes un repositorio Git
git init
git add .
git commit -m "Preparar para despliegue en Render"
git branch -M main

# Conectar con GitHub/GitLab/Bitbucket
git remote add origin <URL_DE_TU_REPOSITORIO>
git push -u origin main
```

### Paso 2: Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Regístrate con GitHub, GitLab, o tu email
4. Verifica tu email si es necesario

### Paso 3: Crear Nuevo Web Service

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si es la primera vez, autoriza a Render a acceder a tu repositorio
   - Selecciona el repositorio que contiene tu proyecto
   - Selecciona la rama (generalmente `main` o `master`)

### Paso 4: Configurar el Servicio

Render detectará automáticamente la configuración desde `render.yaml`, pero puedes configurarlo manualmente:

#### Configuración Básica:

- **Name:** `caja-chica-financiera` (o el nombre que prefieras)
- **Region:** Elige la región más cercana (Oregon, Frankfurt, etc.)
- **Branch:** `main` (o la rama que uses)
- **Root Directory:** Dejar vacío (o `.` si tu proyecto está en un subdirectorio)

#### Build & Deploy:

- **Environment:** `Python 3`
- **Build Command:**
  ```bash
  npm install && npm run build && pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
  ```

#### Variables de Entorno:

Haz clic en **"Environment"** y añade:

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `PYTHON_VERSION` | `3.11.0` |
| `NODE_VERSION` | `18` |

**Nota:** `PORT` se asigna automáticamente por Render, no necesitas configurarlo.

### Paso 5: Configurar Dependencias del Sistema

Render necesita instalar algunas dependencias del sistema para procesar PDFs e imágenes. 

En la sección **"Advanced"** → **"Build Command"**, puedes usar:

```bash
apt-get update && apt-get install -y poppler-utils libzbar0 libopencv-dev python3-opencv tesseract-ocr tesseract-ocr-spa && npm install && npm run build && pip install -r requirements.txt
```

**O mejor aún**, crea un archivo `apt-packages.txt` en la raíz del proyecto:

```
poppler-utils
libzbar0
libopencv-dev
python3-opencv
tesseract-ocr
tesseract-ocr-spa
```

Y Render los instalará automáticamente si detecta este archivo.

### Paso 6: Desplegar

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Esto puede tomar 5-10 minutos la primera vez
4. Puedes ver el progreso en los logs en tiempo real

### Paso 7: Verificar el Despliegue

Una vez completado el despliegue:

1. Render te dará una URL como: `https://caja-chica-financiera.onrender.com`
2. Haz clic en la URL para abrir tu aplicación
3. Prueba el endpoint de health: `https://tu-app.onrender.com/api/health`
4. Deberías ver: `{"status": "OK", "message": "Servidor funcionando correctamente"}`

## 🔧 Solución de Problemas

### Error: "Build failed"

**Problema:** El build falla durante la instalación de dependencias.

**Solución:**
- Verifica que `requirements.txt` tenga todas las dependencias
- Revisa los logs de build para ver el error específico
- Asegúrate de que `package.json` esté presente

### Error: "Module not found"

**Problema:** Faltan dependencias de Python o Node.

**Solución:**
- Verifica que `requirements.txt` incluya `python-dotenv`
- Verifica que `package.json` tenga todas las dependencias
- Revisa los logs para ver qué módulo falta

### Error: "Port already in use"

**Problema:** El servidor no está usando la variable `$PORT`.

**Solución:**
- Asegúrate de que el `startCommand` use `$PORT` (no un puerto fijo)
- Verifica que `config.py` lea `PORT` desde variables de entorno

### Error: "Frontend not built"

**Problema:** La carpeta `dist/` no existe.

**Solución:**
- Verifica que `npm run build` se ejecute en el build command
- Revisa los logs para ver si el build del frontend falló
- Asegúrate de que `package.json` tenga el script `build`

### Error: "Poppler not found" o "zbar not found"

**Problema:** Dependencias del sistema no instaladas.

**Solución:**
- Crea `apt-packages.txt` con las dependencias necesarias
- O incluye la instalación en el build command

## 📝 Archivos Importantes para Render

Asegúrate de que estos archivos estén en tu repositorio:

- ✅ `render.yaml` - Configuración de Render
- ✅ `Procfile` - Comando de inicio (alternativa a render.yaml)
- ✅ `requirements.txt` - Dependencias de Python
- ✅ `package.json` - Dependencias de Node.js
- ✅ `server.py` - Servidor Flask
- ✅ `config.py` - Configuración de la app
- ✅ `.gitignore` - Para no subir archivos innecesarios

## 🔄 Actualizaciones Automáticas

Render puede configurarse para desplegar automáticamente cuando hagas push a tu repositorio:

1. Ve a tu servicio en Render
2. Ve a **"Settings"** → **"Auto-Deploy"**
3. Asegúrate de que esté habilitado
4. Cada vez que hagas `git push`, Render desplegará automáticamente

## 💰 Planes y Límites

### Plan Gratuito:
- ✅ 750 horas/mes (suficiente para 24/7)
- ✅ 512MB RAM
- ✅ Sleep después de 15 minutos de inactividad
- ✅ SSL/HTTPS incluido

### Planes de Pago:
- Sin sleep
- Más RAM y CPU
- Soporte prioritario

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Render. Si encuentras algún problema, revisa los logs en el dashboard de Render o consulta la sección de solución de problemas arriba.

## 📞 Próximos Pasos

1. **Configurar dominio personalizado** (opcional):
   - Ve a **Settings** → **Custom Domains**
   - Añade tu dominio
   - Configura los DNS según las instrucciones

2. **Monitoreo:**
   - Render proporciona logs en tiempo real
   - Puedes configurar alertas en **Settings** → **Alerts**

3. **Backups:**
   - Render mantiene backups automáticos
   - Puedes restaurar versiones anteriores desde el dashboard

---

¿Necesitas ayuda? Revisa los logs en Render o consulta la [documentación oficial de Render](https://render.com/docs).

