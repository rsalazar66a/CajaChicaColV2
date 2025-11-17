# 🔧 Actualizar Build Command en Render Dashboard

## ❌ Error Actual

```
ERROR: Can not perform a '--user' install. User site-packages are not visible in this virtualenv.
```

Esto significa que Render está usando un build command con `--user` que ya no es necesario.

## ✅ Solución: Actualizar Build Command en el Dashboard

### Paso 1: Ve a tu Servicio en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en tu servicio **"caja-chica-financiera"**

### Paso 2: Ve a Settings

1. En el menú lateral, haz clic en **"Settings"**
2. Desplázate hasta la sección **"Build & Deploy"**

### Paso 3: Actualiza el Build Command

1. Busca el campo **"Build Command"**
2. **Borra** el contenido actual
3. **Pega** este comando exacto:

```bash
npm install && npm run build && pip install -r requirements.txt
```

**IMPORTANTE:** 
- ❌ NO uses `--user` 
- ✅ Debe ser exactamente como está arriba

### Paso 4: Verifica el Start Command

Asegúrate de que el **"Start Command"** sea:

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

### Paso 5: Guarda y Redesplega

1. Haz clic en **"Save Changes"** (arriba o abajo de la página)
2. Ve a **"Manual Deploy"**
3. Selecciona **"Clear build cache & deploy"**
4. Haz clic en **"Deploy latest commit"**

## 🔍 Verificación

Después del despliegue, en los **Logs** deberías ver:

```
✅ npm install
✅ Building frontend...
✅ pip install -r requirements.txt (SIN --user)
✅ Starting gunicorn...
```

**NO deberías ver:**
- ❌ `--user` en ningún comando
- ❌ `ERROR: Can not perform a '--user' install`

## 📝 Build Command Correcto (Copia y Pega)

```bash
npm install && npm run build && pip install -r requirements.txt
```

## 📝 Start Command Correcto (Copia y Pega)

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

---

**El cambio DEBE hacerse en el dashboard de Render.** 🎯

