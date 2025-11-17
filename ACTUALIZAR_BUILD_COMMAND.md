# 🔧 Actualizar Build Command en Render Dashboard

## 📋 Errores Comunes y Soluciones

### ❌ Error 1: "Can not perform a '--user' install"

```
ERROR: Can not perform a '--user' install. User site-packages are not visible in this virtualenv.
```

**Causa:** Render está usando un build command con `--user` que ya no es necesario.

**Solución:** Eliminar `--user` del build command.

---

### ❌ Error 2: "Read-only file system" con apt-get

```
E: List directory /var/lib/apt/lists/partial is missing. - Acquire (30: Read-only file system)
```

**Causa:** Intentar ejecutar `apt-get` manualmente en el build command. Render maneja las dependencias del sistema automáticamente.

**Solución:** 
- NO incluir `apt-get` en el build command
- Usar el archivo `apt.txt` en la raíz del proyecto (Render lo detecta automáticamente)

---

### ❌ Error 3: "Unable to find zbar shared library"

```
ImportError: Unable to find zbar shared library
```

**Causa:** Las dependencias del sistema no se están instalando antes de que Python intente importar pyzbar.

**Solución:** Asegurarse de que `apt.txt` incluya `libzbar0` y que Render lo esté usando.

---

### ❌ Error 4: "Pillow build failed" con Python 3.13

```
error: subprocess-exited-with-error
× Getting requirements to build wheel did not run successfully.
KeyError: '__version__'
```

**Causa:** Pillow 10.0.1 no es compatible con Python 3.13.

**Solución:** 
- Actualizar Pillow a versión >=10.4.0 en `requirements.txt`
- O forzar Python 3.11 usando `.python-version`

---

## ✅ Solución Completa: Configuración Correcta

### Paso 1: Verificar Archivos del Proyecto

Asegúrate de que estos archivos estén en la raíz del proyecto:

#### `apt.txt` (Dependencias del Sistema)
```
poppler-utils
libzbar0
libopencv-dev
python3-opencv
tesseract-ocr
tesseract-ocr-spa
libjpeg-dev
zlib1g-dev
libtiff-dev
libfreetype6-dev
liblcms2-dev
libwebp-dev
libharfbuzz-dev
libfribidi-dev
libxcb1-dev
```

#### `.python-version` (Forzar Versión de Python)
```
3.11.0
```

#### `render.yaml` (Configuración Automática)
```yaml
services:
  - type: web
    name: caja-chica-financiera
    env: python
    region: oregon
    plan: free
    dockerfilePath: null
    buildCommand: npm install && npm run build && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
    startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: NODE_VERSION
        value: 18
    healthCheckPath: /api/health
```

---

### Paso 2: Actualizar Build Command en el Dashboard (Si usas configuración manual)

Si prefieres configurar manualmente en lugar de usar `render.yaml`:

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en tu servicio **"caja-chica-financiera"**
3. En el menú lateral, haz clic en **"Settings"**
4. Desplázate hasta la sección **"Build & Deploy"**

#### Build Command Correcto:

```bash
npm install && npm run build && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

**IMPORTANTE:** 
- ❌ NO uses `--user`
- ❌ NO incluyas `apt-get` (Render lo maneja automáticamente desde `apt.txt`)
- ✅ Actualiza pip, setuptools y wheel antes de instalar dependencias
- ✅ El orden es: npm → build → pip upgrade → pip install

#### Start Command Correcto:

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

#### Variables de Entorno:

- `FLASK_ENV` = `production`
- `PYTHON_VERSION` = `3.11.0` (opcional, también se puede usar `.python-version`)
- `NODE_VERSION` = `18` (opcional)

**Nota:** `PORT` se asigna automáticamente por Render, NO lo configures manualmente.

---

### Paso 3: Desactivar Docker (Si está habilitado)

1. En **Settings** → **Build & Deploy**
2. Busca la opción **"Docker"** o **"Dockerfile Path"**
3. **DESACTIVA** o **ELIMINA** cualquier referencia a Docker
4. Asegúrate de que esté seleccionado:
   - **"Native"** o
   - **"Python"** o
   - **"Use render.yaml"**

---

### Paso 4: Guardar y Redesplegar

1. Haz clic en **"Save Changes"** (arriba o abajo de la página)
2. Ve a **"Manual Deploy"**
3. Selecciona **"Clear build cache & deploy"** (importante para limpiar caché)
4. Haz clic en **"Deploy latest commit"**

---

## 🔍 Verificación

Después del despliegue, en los **Logs** deberías ver:

```
✅ Installing system dependencies from apt.txt...
✅ npm install
✅ Building frontend...
✅ pip install --upgrade pip setuptools wheel
✅ pip install -r requirements.txt
✅ Starting gunicorn...
```

**NO deberías ver:**
- ❌ `--user` en ningún comando
- ❌ `apt-get` en el build command
- ❌ `ERROR: Can not perform a '--user' install`
- ❌ `Read-only file system`
- ❌ `Unable to find zbar shared library`
- ❌ `Pillow build failed`

---

## 📝 Comandos de Referencia Rápida

### Build Command (Copia y Pega)

```bash
npm install && npm run build && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

### Start Command (Copia y Pega)

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

---

## 🎯 Opción Recomendada: Usar render.yaml

**La mejor opción es usar `render.yaml`** en lugar de configurar manualmente:

1. Render detecta automáticamente `render.yaml`
2. La configuración está versionada en tu repositorio
3. Es más fácil mantener y actualizar
4. Evita errores de configuración manual

Si tienes `render.yaml` configurado correctamente, Render lo usará automáticamente y no necesitas configurar nada en el dashboard.

---

## 🐛 Solución de Problemas Adicionales

### Si Render no detecta apt.txt

- Verifica que el archivo se llame exactamente `apt.txt` (no `apt-packages.txt`)
- Verifica que esté en la raíz del proyecto
- Haz commit y push del archivo

### Si Python 3.13 sigue siendo usado

- Crea el archivo `.python-version` con `3.11.0`
- O configura `PYTHON_VERSION=3.11.0` en las variables de entorno
- Haz "Clear build cache & deploy"

### Si Pillow sigue fallando

- Verifica que `requirements.txt` tenga `Pillow>=10.4.0`
- Verifica que `apt.txt` incluya todas las dependencias de desarrollo necesarias
- Actualiza pip, setuptools y wheel antes de instalar (ya incluido en el build command)

---

## 📞 Si el Problema Persiste

1. **Revisa los logs completos** en Render (Build y Runtime)
2. **Verifica que todos los archivos estén en el repositorio:**
   - `apt.txt`
   - `.python-version`
   - `render.yaml`
   - `requirements.txt`
3. **Haz "Clear build cache & deploy"** para limpiar caché
4. **Consulta la documentación de Render:** https://render.com/docs/troubleshooting-deploys

---

**El cambio puede hacerse en `render.yaml` (recomendado) o en el dashboard de Render.** 🎯
