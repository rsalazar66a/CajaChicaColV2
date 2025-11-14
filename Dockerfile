# Este Dockerfile está aquí solo para evitar errores
# Render DEBE usar render.yaml en su lugar
# 
# IMPORTANTE: En el dashboard de Render, desactiva Docker y usa la configuración nativa
# Ve a Settings → Build & Deploy → Desactiva "Docker" o "Use Docker"

FROM python:3.11-slim

# Este Dockerfile NO debe usarse
# Render debe usar render.yaml con configuración nativa
RUN echo "ERROR: Este Dockerfile no debe usarse. Render debe usar render.yaml" && exit 1

