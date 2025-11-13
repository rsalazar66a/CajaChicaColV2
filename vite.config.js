import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 1800000, // 30 minutos para procesamientos largos
        ws: true, // Habilitar WebSocket si es necesario
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err.message)
            console.error('Request URL:', req.url)
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json'
              })
              res.end(JSON.stringify({
                error: 'Error de conexión con el servidor',
                message: 'El servidor Flask no está disponible. Asegúrate de que esté corriendo en el puerto 5000.',
                details: err.message
              }))
            }
          })
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url)
            // Aumentar límite de tamaño del body
            if (req.body && typeof req.body === 'object') {
              const bodyData = JSON.stringify(req.body)
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
              proxyReq.write(bodyData)
            }
          })
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url)
          })
        }
      }
    }
  }
})

