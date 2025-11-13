import React from 'react'
import { FileSpreadsheet, Download } from 'lucide-react'

const ExcelDataViewer = ({ excelData }) => {
  if (!excelData || !excelData.data || excelData.data.length === 0) {
    return null
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(excelData.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${excelData.fileName.replace(/\.[^/.]+$/, '')}_data.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Mostrar TODAS las columnas
  const allColumns = excelData.headers || []
  
  // Calcular el ancho mínimo de la tabla basado en el número de columnas
  const minTableWidth = Math.max(1200, allColumns.length * 150)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Datos Importados del Excel
            </h2>
            <p className="text-gray-600">
              {excelData.totalRows} fila(s) • {allColumns.length} columna(s)
            </p>
          </div>
        </div>
        
        <button
          onClick={exportToJSON}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exportar JSON</span>
        </button>
      </div>

      {/* Tabla con todas las columnas, scroll horizontal y vertical */}
      <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-4 sm:px-6 lg:px-8 mb-2">
          <p className="text-sm text-gray-600">
            Desplázate horizontalmente para ver todas las {allColumns.length} columnas • 
            Desplázate verticalmente para ver todas las {excelData.totalRows} filas
          </p>
        </div>
        <style>{`
          .excel-table-wrapper {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }
          .excel-table-wrapper::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          .excel-table-wrapper::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 6px;
          }
          .excel-table-wrapper::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 6px;
          }
          .excel-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
          .excel-table-wrapper::-webkit-scrollbar-corner {
            background: #f7fafc;
          }
        `}</style>
        <div 
          className="excel-table-wrapper overflow-auto bg-white border-t border-b border-gray-200 shadow-sm"
          style={{ 
            maxHeight: '600px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
        >
          <table 
            className="w-full divide-y divide-gray-200" 
            style={{ minWidth: `${minTableWidth}px` }}
          >
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-20 border-r border-gray-200"
                  style={{ width: '60px', minWidth: '60px' }}
                >
                  #
                </th>
                {allColumns.map((header, index) => (
                  <th 
                    key={index} 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ minWidth: '150px', width: '150px' }}
                  >
                    {header || `Columna ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {excelData.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td 
                    className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center bg-white sticky left-0 z-10 border-r border-gray-200"
                    style={{ minWidth: '60px' }}
                  >
                    {row.rowNumber || rowIndex + 1}
                  </td>
                  {allColumns.map((header, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-4 py-4 text-sm text-gray-700"
                      style={{ minWidth: '150px', maxWidth: '300px' }}
                    >
                      <div 
                        className="break-words" 
                        title={String(row[header] || '')}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {String(row[header] || '')}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 mt-4">
          <p className="text-sm text-gray-500 text-center">
            Mostrando todas las {excelData.totalRows} filas del archivo
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExcelDataViewer

