import React, { useRef, useState } from 'react'
import { Upload, X, FileImage, FileText, Smartphone } from 'lucide-react'

const FileUploader = ({ onFileUpload }) => {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const MAX_FILES = 500

  const acceptedTypes = {
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG', 
    'image/png': 'PNG',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'image/tif': 'TIF',
    'application/pdf': 'PDF',
    'image/heic': 'HEIC',
    'image/heif': 'HEIF'
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    
    // Validar cantidad máxima de archivos
    if (fileArray.length > MAX_FILES) {
      alert(`Se pueden procesar hasta ${MAX_FILES} archivos a la vez. Has seleccionado ${fileArray.length} archivos. Por favor, selecciona menos archivos.`)
      return
    }
    
    const validFiles = fileArray.filter(file => 
      Object.keys(acceptedTypes).includes(file.type)
    )
    
    if (validFiles.length !== fileArray.length) {
      alert('Algunos archivos no son del tipo soportado')
    }
    
    if (validFiles.length > 0) {
      onFileUpload(validFiles)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getFileIcon = (type) => {
    if (type.includes('image')) {
      if (type.includes('heic') || type.includes('heif')) {
        return <Smartphone className="w-5 h-5 text-blue-500" />
      }
      return <FileImage className="w-5 h-5 text-green-500" />
    }
    return <FileText className="w-5 h-5 text-red-500" />
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.pdf,.heic,.heif"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </h3>
            <p className="text-gray-600 mb-2">
              Formatos soportados: JPG, PNG, BMP, TIFF, PDF, HEIC, HEIF
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Máximo {MAX_FILES} archivos por lote
            </p>
            
            <button
              onClick={handleClick}
              className="btn-primary"
            >
              Seleccionar Archivos
            </button>
          </div>
        </div>
      </div>
      
      {/* Supported formats info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(acceptedTypes).map(([type, label]) => (
          <div key={type} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {getFileIcon(type)}
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileUploader

