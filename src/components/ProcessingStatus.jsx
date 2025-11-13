import React from 'react'
import { Loader2, QrCode, FileText, CheckCircle } from 'lucide-react'

const ProcessingStatus = () => {
  return (
    <div className="card">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Procesando archivos...
          </h3>
          <p className="text-gray-600 mb-4">
            Extrayendo códigos QR y analizando facturas
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <QrCode className="w-3 h-3 text-primary-600" />
              </div>
              <span className="text-sm text-gray-700">
                Detectando códigos QR en las imágenes
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <FileText className="w-3 h-3 text-primary-600" />
              </div>
              <span className="text-sm text-gray-700">
                Procesando documentos PDF
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-primary-600" />
              </div>
              <span className="text-sm text-gray-700">
                Extrayendo información de facturas
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessingStatus

