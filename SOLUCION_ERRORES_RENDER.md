# 🔧 Solución de Errores Comunes en Render

## ⚠️ Warning: Running pip as the 'root' user

**Mensaje:**
```
WARNING: Running pip as the 'root' user can result in broken permissions...
```

### ¿Es un problema?

**No, es solo un warning.** Render ejecuta los comandos en un contenedor Docker donde es normal ejecutar pip como root. El despliegue debería continuar normalmente.

### Solución (Opcional)

Si quieres eliminar el warning, puedes usar el flag `--user` en el build command:

**En render.yaml:**
```yaml
buildCommand: npm install && npm run build && pip install --user -r requirements.txt
```

**O en el dashboard de Render:**
```
npm install && npm run build && pip install --user -r requirements.txt
```

### Verificar que el despliegue continúe

Aunque veas este warning, el despliegue debería continuar. Revisa los logs para ver:
- ✅ "Installing collected packages..."
- ✅ "Successfully installed..."
- ✅ "Building frontend..."
- ✅ "Build completed"

---

## ❌ Error: "Build failed"

### Posibles causas:

1. **Dependencias faltantes**
   - Verifica que `requirements.txt` tenga todas las dependencias
   - Verifica que `package.json` esté presente

2. **Error en npm install**
   - Verifica que `package.json` sea válido
   - Revisa los logs para ver el error específico

3. **Error en npm run build**
   - Verifica que el frontend se pueda construir localmente
   - Ejecuta `npm run build` localmente para verificar

4. **Dependencias del sistema faltantes**
   - Render instalará automáticamente desde `apt-packages.txt`
   - Si no funciona, añade al build command:
     ```bash
     apt-get update && apt-get install -y poppler-utils libzbar0 libopencv-dev python3-opencv tesseract-ocr tesseract-ocr-spa && npm install && npm run build && pip install --user -r requirements.txt
     ```

---

## ❌ Error: "Module not found"

### Solución:

1. Verifica que todas las dependencias estén en `requirements.txt`
2. Asegúrate de que `python-dotenv` esté incluido
3. Revisa los logs para ver qué módulo falta específicamente

---

## ❌ Error: "Port already in use" o "Cannot bind to port"

### Solución:

Asegúrate de que el `startCommand` use `$PORT` (no un puerto fijo):

```bash
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 1800 server:app
```

**NO uses:**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 ...  # ❌ Puerto fijo
```

---

## ❌ Error: "Frontend not built" o "dist/ not found"

### Solución:

1. Verifica que `npm run build` se ejecute en el build command
2. Revisa los logs para ver si el build del frontend falló
3. Prueba construir localmente: `npm run build`
4. Verifica que `package.json` tenga el script `build`

---

## ❌ Error: "Poppler not found" o "zbar not found"

### Solución:

Render debería instalar automáticamente desde `apt-packages.txt`, pero si no funciona:

1. Verifica que `apt-packages.txt` esté en la raíz del proyecto
2. O añade al build command:
   ```bash
   apt-get update && apt-get install -y poppler-utils libzbar0 && npm install && npm run build && pip install --user -r requirements.txt
   ```

---

## ⏱️ El despliegue tarda mucho

### Es normal:

- **Primera vez:** 5-10 minutos
- **Re-despliegues:** 3-5 minutos
- Render necesita:
  - Instalar dependencias del sistema
  - Instalar dependencias de Node.js
  - Construir el frontend
  - Instalar dependencias de Python
  - Iniciar el servidor

### Para acelerar:

- Usa el plan de pago (más recursos)
- Optimiza el tamaño de `node_modules` (usa `.npmignore`)
- Usa cache de dependencias

---

## 🔍 Cómo revisar los logs

1. Ve a tu servicio en Render
2. Haz clic en **"Logs"** en el menú lateral
3. Revisa los logs de **Build** y **Runtime**
4. Los errores aparecerán en rojo

---

## 📞 Si el problema persiste

1. **Revisa los logs completos** en Render
2. **Verifica localmente:**
   - `npm run build` funciona?
   - `pip install -r requirements.txt` funciona?
   - `python server.py` funciona?
3. **Consulta la documentación:** [render.com/docs](https://render.com/docs)
4. **Contacta soporte:** Render tiene buen soporte en su dashboard

---

## ✅ Checklist de Verificación

Antes de desplegar, verifica:

- [ ] `requirements.txt` tiene todas las dependencias
- [ ] `package.json` está presente y válido
- [ ] `npm run build` funciona localmente
- [ ] `render.yaml` está configurado correctamente
- [ ] `apt-packages.txt` está presente (si es necesario)
- [ ] El `startCommand` usa `$PORT` (no puerto fijo)
- [ ] Variables de entorno configuradas

---

¡Buena suerte con tu despliegue! 🚀

