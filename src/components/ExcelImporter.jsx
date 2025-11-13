import React, { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

const ExcelImporter = ({ onImport }) => {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [importedData, setImportedData] = useState(null)
  const [error, setError] = useState(null)

  const handleFileSelect = async (file) => {
    if (!file) return

    // Validar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls', '.xlsm']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Por favor selecciona un archivo Excel (.xlsx, .xls, .xlsm)')
      return
    }

    setError(null)
    setImportedData(null)

    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Leer la primera hoja
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            raw: false 
          })

          if (jsonData.length === 0) {
            setError('El archivo Excel está vacío')
            return
          }

          // La primera fila son los encabezados
          const headers = jsonData[0]
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''))

          // Mapear las columnas según la estructura esperada
          const mappedData = rows.map((row, index) => {
            const rowData = {}
            headers.forEach((header, colIndex) => {
              if (header) {
                rowData[header] = row[colIndex] || ''
              }
            })
            return {
              rowNumber: index + 2, // +2 porque el índice empieza en 0 y la fila 1 es el header
              ...rowData
            }
          })

          const result = {
            fileName: file.name,
            totalRows: mappedData.length,
            headers: headers.filter(h => h),
            data: mappedData,
            rawData: jsonData
          }

          setImportedData(result)
          
          // Llamar al callback si se proporciona
          if (onImport) {
            onImport(result)
          }
        } catch (parseError) {
          console.error('Error al parsear Excel:', parseError)
          setError('Error al leer el archivo Excel. Por favor verifica que el archivo no esté corrupto.')
        }
      }

      reader.onerror = () => {
        setError('Error al leer el archivo')
      }

      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error('Error al procesar archivo:', err)
      setError('Error inesperado al procesar el archivo')
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
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    setImportedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Importar Archivo Excel
            </h3>
            <p className="text-gray-600 mb-4">
              Arrastra un archivo Excel aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos soportados: .xlsx, .xls, .xlsm
            </p>
            
            <button
              onClick={handleClick}
              className="btn-primary"
            >
              Seleccionar Archivo Excel
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resultado de importación */}
      {importedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Archivo importado exitosamente
                </p>
                <p className="text-sm text-green-700">
                  <strong>Archivo:</strong> {importedData.fileName}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Filas importadas:</strong> {importedData.totalRows}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Columnas:</strong> {importedData.headers.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 ml-2"
              title="Limpiar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelImporter

