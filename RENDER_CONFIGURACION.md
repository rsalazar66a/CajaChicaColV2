# 🔧 Configurar Render para NO usar Docker

## ❌ Error Actual

```
Error: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory
```

Esto significa que Render está configurado para usar **Docker** en lugar de la configuración nativa.

## ✅ Solución: Cambiar a Configuración Nativa

### Paso 1: Ve a tu servicio en Render

1. Inicia sesión en [render.com](https://render.com)
2. Ve a tu servicio "caja-chica-financiera"

### Paso 2: Cambiar la configuración de Build

1. Haz clic en **"Settings"** (Configuración) en el menú lateral
2. Desplázate hasta la sección **"Build & Deploy"**
3. Busca la opción **"Docker"** o **"Dockerfile Path"**
4. **DESACTIVA** o **ELIMINA** cualquier referencia a Docker
5. Asegúrate de que esté seleccionado:
   - **"Native"** o
   - **"Python"** o
   - **"Use render.yaml"**

### Paso 3: Verificar Build Command

En la sección **"Build Command"**, debería estar:

```bash
npm install && npm run build && pip install --user -r requirements.txt
```

**NO debería tener:**
- Referencias a `docker`
- Referencias a `Dockerfile`
- Comandos de `docker build`

### Paso 4: Verificar Start Command

En la sección **"Start Command"**, debería estar:

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

### Paso 5: Guardar y Redesplegar

1. Haz clic en **"Save Changes"**
2. Ve a **"Manual Deploy"**
3. Selecciona **"Clear build cache & deploy"**
4. Haz clic en **"Deploy latest commit"**

## 🔍 Verificación Alternativa: Usar render.yaml

Si Render tiene la opción de usar `render.yaml`:

1. En **Settings** → **Build & Deploy**
2. Busca **"Configuration File"** o **"Use render.yaml"**
3. Asegúrate de que esté habilitado
4. Render debería detectar automáticamente `render.yaml`

## 📝 Configuración Correcta en Render Dashboard

### Environment (Entorno):
- **Environment:** `Python 3`
- **Python Version:** `3.11.0` (o la que prefieras)
- **Node Version:** `18` (para construir el frontend)

### Build Command:
```bash
npm install && npm run build && pip install --user -r requirements.txt
```

### Start Command:
```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

### Variables de Entorno:
- `FLASK_ENV` = `production`
- `PORT` = (Render lo asigna automáticamente, NO lo configures manualmente)

### Docker:
- **NO debe estar habilitado**
- **NO debe haber "Dockerfile Path" configurado**

## 🚨 Si No Puedes Encontrar la Opción

1. **Elimina el servicio actual** (si es necesario)
2. **Crea un nuevo servicio** desde cero:
   - New + → Web Service
   - Conecta tu repositorio
   - **NO selecciones Docker**
   - Render debería detectar automáticamente `render.yaml`

## ✅ Después de Cambiar la Configuración

Deberías ver en los logs:
- ✅ `npm install` ejecutándose
- ✅ `npm run build` construyendo
- ✅ `pip install` instalando dependencias
- ❌ **NO** deberías ver errores de Dockerfile

---

¡Una vez cambiada la configuración, el despliegue debería funcionar correctamente! 🎉

