# ✅ Checklist para Desplegar en Render

## 📦 Archivos Creados/Verificados

- ✅ `render.yaml` - Configuración automática de Render
- ✅ `Procfile` - Comando de inicio alternativo
- ✅ `apt-packages.txt` - Dependencias del sistema
- ✅ `RENDER_DEPLOY.md` - Guía completa paso a paso
- ✅ `config.py` - Ya configurado para usar variables de entorno
- ✅ `server.py` - Ya configurado para producción

## 🚀 Pasos Rápidos

### 1. Inicializar Git (si no lo has hecho)
```bash
git init
git add .
git commit -m "Preparar para despliegue en Render"
```

### 2. Subir a GitHub/GitLab/Bitbucket
```bash
# Crear repositorio en GitHub/GitLab/Bitbucket primero
git remote add origin <URL_DE_TU_REPOSITORIO>
git branch -M main
git push -u origin main
```

### 3. En Render.com
1. Crear cuenta en [render.com](https://render.com)
2. New + → Web Service
3. Conectar repositorio
4. Render detectará automáticamente `render.yaml`
5. Click en "Create Web Service"
6. ¡Esperar 5-10 minutos!

### 4. Verificar
- URL: `https://tu-app.onrender.com`
- Health check: `https://tu-app.onrender.com/api/health`

## ⚙️ Configuración Automática

Render usará automáticamente:
- **Build Command:** `npm install && npm run build && pip install -r requirements.txt`
- **Start Command:** `gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app`
- **Variables de entorno:** Configuradas en `render.yaml`

## 📝 Notas Importantes

1. **Primera vez:** El despliegue puede tardar 5-10 minutos
2. **Plan gratuito:** La app "duerme" después de 15 min de inactividad (se despierta automáticamente)
3. **Dependencias del sistema:** Render instalará automáticamente desde `apt-packages.txt`
4. **Frontend:** Se construye automáticamente durante el build

## 🆘 Si algo falla

1. Revisa los logs en el dashboard de Render
2. Verifica que todos los archivos estén en el repositorio
3. Consulta `RENDER_DEPLOY.md` para solución de problemas

