import React, { useState, useEffect } from 'react'
import { QrCode, FileText, CheckCircle, Copy, Download, Trash2, XCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

const QRResults = ({ results, onClear, showOnlyTable = false, showFailedOnly = false }) => {
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Resetear selecciones si los resultados se vacían
  useEffect(() => {
    if (results.length === 0) {
      setSelectedRows(new Set())
    }
  }, [results])
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = showFailedOnly ? 'archivos_sin_qr.json' : 'resultados_qr_facturas.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    if (results.length === 0) {
      alert('No hay resultados para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = results.map((result, index) => {
      const cufe = extractCufeFromQR(result.qrData)
      const invoiceNumber = extractInvoiceNumber(result.qrData)
      const invoiceDate = extractInvoiceDate(result.qrData)
      const providerNIT = extractProviderNIT(result.qrData)
      const valueWithoutTaxes = extractValueWithoutTaxes(result.qrData)
      const ivaValue = extractIVAValue(result.qrData)
      const otherTaxesValue = extractOtherTaxesValue(result.qrData)
      const totalValue = extractTotalValue(result.qrData)

      // Formatear valores monetarios
      const formatCurrency = (value) => {
        if (!value) return 0
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return 0
        return new Intl.NumberFormat('es-CO', { 
          style: 'currency', 
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue)
      }

      // Limitar NumeroFacturaQR a 20 caracteres
      const limitedInvoiceNumber = invoiceNumber ? (invoiceNumber.length > 20 ? invoiceNumber.substring(0, 20) : invoiceNumber) : ''

      return {
        '#': index + 1,
        'Nombre del Archivo': result.fileName,
        'Código QR Detectado': result.qrData,
        'CUFE': cufe || 'N/A',
        'Número de Factura': invoiceNumber || '',
        'Fecha de Factura': invoiceDate || '',
        'NIT Proveedor': providerNIT || '',
        'Valor Sin Impuestos': valueWithoutTaxes ? formatCurrency(valueWithoutTaxes) : formatCurrency(0),
        'Valor IVA': ivaValue ? formatCurrency(ivaValue) : formatCurrency(0),
        'Valor Otros Impuestos': otherTaxesValue ? formatCurrency(otherTaxesValue) : formatCurrency(0),
        'Valor Total': totalValue ? formatCurrency(totalValue) : formatCurrency(0),
        'NumeroFacturaQR': limitedInvoiceNumber,
        'FechaFacturaQR': invoiceDate || '',
        'NITProveedorQR': providerNIT || '',
        'ValorSinImpuestosQR': valueWithoutTaxes ? formatCurrency(valueWithoutTaxes) : formatCurrency(0),
        'ValorIVAQR': ivaValue ? formatCurrency(ivaValue) : formatCurrency(0),
        'ValorOtrosImpuestosQR': otherTaxesValue ? formatCurrency(otherTaxesValue) : formatCurrency(0),
        'ValorTotalQR': totalValue ? formatCurrency(totalValue) : formatCurrency(0)
      }
    })

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 5 },   // #
      { wch: 30 },  // Nombre del Archivo
      { wch: 50 },  // Código QR Detectado
      { wch: 40 },  // CUFE
      { wch: 20 },  // Número de Factura
      { wch: 18 },  // Fecha de Factura
      { wch: 18 },  // NIT Proveedor
      { wch: 22 },  // Valor Sin Impuestos
      { wch: 18 },  // Valor IVA
      { wch: 25 },  // Valor Otros Impuestos
      { wch: 18 },  // Valor Total
      { wch: 20 },  // NumeroFacturaQR
      { wch: 18 },  // FechaFacturaQR
      { wch: 18 },  // NITProveedorQR
      { wch: 22 },  // ValorSinImpuestosQR
      { wch: 18 },  // ValorIVAQR
      { wch: 25 },  // ValorOtrosImpuestosQR
      { wch: 18 }   // ValorTotalQR
    ]
    ws['!cols'] = colWidths

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados QR')

    // Generar el archivo Excel y descargarlo
    const fileName = `resultados_qr_facturas_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const exportFailedToExcel = () => {
    const failedResults = results.filter(result => !result.success || !result.qrData)
    
    if (failedResults.length === 0) {
      alert('No hay archivos sin QR para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = failedResults.map((result, index) => {
      return {
        '#': index + 1,
        'Nombre del Archivo': result.fileName,
        'Tipo de Archivo': result.fileType || 'N/A',
        'Error / Mensaje': result.error || 'No se encontraron códigos QR en el archivo',
        'Tamaño (MB)': result.fileSize ? (result.fileSize / 1024 / 1024).toFixed(2) : 'N/A'
      }
    })

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 5 },   // #
      { wch: 40 },  // Nombre del Archivo
      { wch: 20 },  // Tipo de Archivo
      { wch: 50 },  // Error / Mensaje
      { wch: 15 }   // Tamaño (MB)
    ]
    ws['!cols'] = colWidths

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Archivos sin QR')

    // Generar el archivo Excel y descargarlo
    const fileName = `archivos_sin_qr_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === results.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(results.map((_, index) => index)))
    }
  }

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return
    
    const newResults = results.filter((_, index) => !selectedRows.has(index))
    // Actualizar el estado en el componente padre
    if (onClear && typeof onClear === 'function') {
      // Si onClear es una función que acepta parámetros, pasamos los nuevos resultados
      // De lo contrario, necesitamos una nueva prop para actualizar resultados
      onClear(newResults)
    }
    setSelectedRows(new Set())
  }

  const getFileTypeIcon = (fileType) => {
    if (fileType.includes('image')) {
      return <QrCode className="w-5 h-5 text-green-500" />
    }
    return <FileText className="w-5 h-5 text-blue-500" />
  }

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-red-600 text-xs">!</span>
      </div>
    )
  }

  // Extraer CUFE del código QR (string después del texto 'documentkey=')
  const extractCufeFromQR = (qrData) => {
    if (!qrData) return ''
    const documentKeyIndex = qrData.indexOf('documentkey=')
    if (documentKeyIndex === -1) {
      // Si no encuentra 'documentkey=', intentar con el método anterior como fallback
      const equalIndex = qrData.indexOf('=')
      if (equalIndex === -1) {
        // Si no encuentra '=', retornar el valor completo del código QR detectado
        return qrData.trim()
      }
      if (equalIndex === qrData.length - 1) {
        return ''
      }
      return qrData.substring(equalIndex + 1).trim()
    }
    const startIndex = documentKeyIndex + 'documentkey='.length
    // Buscar el siguiente separador o el final
    const separators = ['|', '&', ';', '\n', '\r', ' ']
    let endIndex = qrData.length
    for (const sep of separators) {
      const sepIndex = qrData.indexOf(sep, startIndex)
      if (sepIndex !== -1 && sepIndex < endIndex) {
        endIndex = sepIndex
      }
    }
    return qrData.substring(startIndex, endIndex).trim()
  }

  // Función helper para extraer valores del código QR
  const extractValueFromQR = (qrData, patterns) => {
    if (!qrData) return ''
    for (const pattern of patterns) {
      const index = qrData.indexOf(pattern)
      if (index !== -1) {
        const startIndex = index + pattern.length
        // Buscar el siguiente separador o el final
        const separators = ['|', '&', ';', '\n', '\r']
        let endIndex = qrData.length
        for (const sep of separators) {
          const sepIndex = qrData.indexOf(sep, startIndex)
          if (sepIndex !== -1 && sepIndex < endIndex) {
            endIndex = sepIndex
          }
        }
        return qrData.substring(startIndex, endIndex).trim()
      }
    }
    return ''
  }

  // Funciones para extraer cada campo específico
  const extractInvoiceNumber = (qrData) => {
    return extractValueFromQR(qrData, ['NumDS:', 'NumFac:', 'NumFac='])
  }

  const extractInvoiceDate = (qrData) => {
    return extractValueFromQR(qrData, ['FecDS:', 'FecFac:', 'FecFac='])
  }

  const extractProviderNIT = (qrData) => {
    return extractValueFromQR(qrData, ['NumSNO:', 'NitFac:', 'NitFac='])
  }

  const extractValueWithoutTaxes = (qrData) => {
    return extractValueFromQR(qrData, ['ValDS:', 'ValFac:', 'ValFac='])
  }

  const extractIVAValue = (qrData) => {
    return extractValueFromQR(qrData, ['ValIva:', 'ValIva='])
  }

  const extractOtherTaxesValue = (qrData) => {
    return extractValueFromQR(qrData, ['ValOtroIm:', 'ValOtroIm='])
  }

  const extractTotalValue = (qrData) => {
    return extractValueFromQR(qrData, ['ValTolDS:', 'ValTolFac:', 'ValTolFac='])
  }

  // Filtrar solo resultados exitosos para la tabla
  const successfulResults = results.filter(result => result.success && result.qrData)
  const failedResults = results.filter(result => !result.success || !result.qrData)

  // Verificar si se debe mostrar solo los archivos fallidos (renombrar para evitar conflicto)
  const autoDetectFailedOnly = results.length > 0 && results.every(result => !result.success || !result.qrData)
  
  // Usar el parámetro showFailedOnly si viene de props, sino usar la detección automática
  const displayFailedOnly = showFailedOnly || autoDetectFailedOnly

  // Modo: Solo tabla de resultados exitosos
  if (showOnlyTable) {
    if (results.length === 0) {
      return (
        <div className="card">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay resultados exitosos
            </h3>
            <p className="text-gray-500">
              Procesa algunos archivos para ver los códigos QR extraídos aquí
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Tabla de Resultados
              </h2>
              <p className="text-gray-600">
                {results.length} código(s) QR extraído(s) exitosamente
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedRows.size > 0 && (
              <button
                onClick={deleteSelectedRows}
                className="btn-secondary flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Seleccionados ({selectedRows.size})</span>
              </button>
            )}
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar a Excel</span>
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedRows.size === results.length && results.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Seleccionar Todo ({selectedRows.size}/{results.length})
            </span>
          </label>
        </div>

        <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="bg-white border-t border-b border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '2800px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                      Nombre del Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '350px', minWidth: '350px' }}>
                      Código QR Detectado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '310px', minWidth: '310px' }}>
                      CUFE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Número de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Fecha de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px', minWidth: '130px' }}>
                      NIT Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                      Valor Sin Impuestos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px', minWidth: '100px' }}>
                      Valor IVA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                      Valor Otros Impuestos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      NumeroFacturaQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      FechaFacturaQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      NITProveedorQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                      ValorSinImpuestosQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px', minWidth: '130px' }}>
                      ValorIVAQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                      ValorOtrosImpuestosQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      ValorTotalQR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => {
                    const cufe = extractCufeFromQR(result.qrData)
                    const invoiceNumber = extractInvoiceNumber(result.qrData)
                    const invoiceDate = extractInvoiceDate(result.qrData)
                    const providerNIT = extractProviderNIT(result.qrData)
                    const valueWithoutTaxes = extractValueWithoutTaxes(result.qrData)
                    const ivaValue = extractIVAValue(result.qrData)
                    const otherTaxesValue = extractOtherTaxesValue(result.qrData)
                    const totalValue = extractTotalValue(result.qrData)
                    
                    // Formatear valores monetarios para mostrar
                    const formatCurrencyDisplay = (value) => {
                      if (!value) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(0)
                      const numValue = parseFloat(value)
                      if (isNaN(numValue)) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(0)
                      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numValue)
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="break-words" title={result.fileName} style={{ maxWidth: '180px' }}>
                            {result.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-start space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all" style={{ maxWidth: '330px', wordBreak: 'break-word', display: 'block' }}>
                              {result.qrData}
                            </code>
                            <button
                              onClick={() => copyToClipboard(result.qrData)}
                              className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-1"
                              title="Copiar código QR"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-start space-x-2">
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 break-all" style={{ maxWidth: '270px', wordBreak: 'break-word', display: 'block' }}>
                              {cufe || 'N/A'}
                            </code>
                            {cufe && (
                              <button
                                onClick={() => copyToClipboard(cufe)}
                                className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-1"
                                title="Copiar CUFE"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceNumber || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceDate || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {providerNIT || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(valueWithoutTaxes)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(ivaValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(otherTaxesValue)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrencyDisplay(totalValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceNumber ? (invoiceNumber.length > 20 ? invoiceNumber.substring(0, 20) : invoiceNumber) : ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceDate || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {providerNIT || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(valueWithoutTaxes)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(ivaValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(otherTaxesValue)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrencyDisplay(totalValue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modo: Solo archivos fallidos
  if (displayFailedOnly) {
    if (results.length === 0) {
      return (
        <div className="card">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Todos los archivos procesados exitosamente
            </h3>
            <p className="text-gray-500">
              No hay archivos sin códigos QR
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Archivos sin Código QR
              </h2>
              <p className="text-gray-600">
                {results.length} archivo(s) sin código QR detectado
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedRows.size > 0 && (
              <button
                onClick={deleteSelectedRows}
                className="btn-secondary flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Seleccionados ({selectedRows.size})</span>
              </button>
            )}
            <button
              onClick={exportFailedToExcel}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedRows.size === results.length && results.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Seleccionar Todo ({selectedRows.size}/{results.length})
            </span>
          </label>
        </div>

        <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="bg-white border-t border-b border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '600px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px' }}>
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error / Mensaje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="break-words" title={result.fileName} style={{ maxWidth: '250px' }}>
                          {result.fileName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {result.fileType || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-red-700">
                        {result.error || 'No se encontraron códigos QR en el archivo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modo original: mostrar todo (mantener código existente)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            displayFailedOnly ? 'bg-red-100' : 'bg-success-100'
          }`}>
            {displayFailedOnly ? (
              <span className="text-red-600 text-xl">⚠</span>
            ) : (
              <CheckCircle className="w-5 h-5 text-success-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {displayFailedOnly ? 'Archivos sin Código QR' : 'Resultados de Extracción'}
            </h2>
            <p className="text-gray-600">
              {results.length} archivo(s) {displayFailedOnly ? 'sin código QR detectado' : 'procesado(s)'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedRows.size > 0 && (
            <button
              onClick={deleteSelectedRows}
              className="btn-secondary flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Borrar Seleccionados ({selectedRows.size})</span>
            </button>
          )}
          <button
            onClick={downloadResults}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={onClear}
            className="btn-secondary flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* Tabla de Archivos sin QR */}
      {displayFailedOnly && failedResults.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Archivos sin Código QR
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportFailedToExcel}
                className="btn-secondary flex items-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <FileText className="w-4 h-4" />
                <span>Exportar a Excel</span>
              </button>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRows.size === failedResults.length && failedResults.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Seleccionar Todo ({selectedRows.size}/{failedResults.length})
                </span>
              </label>
            </div>
          </div>
          <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="bg-white border-t border-b border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-medium text-red-700 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider" style={{ width: '250px', minWidth: '250px' }}>
                        Nombre del Archivo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                        Tipo de Archivo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Error / Mensaje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {failedResults.map((result, index) => (
                      <tr key={index} className="hover:bg-red-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="break-words" title={result.fileName} style={{ maxWidth: '250px' }}>
                            {result.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {result.fileType || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-sm text-red-700">
                          {result.error || 'No se encontraron códigos QR en el archivo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tabla de Resumen - Aparece después de extraer códigos QR */}
      {!displayFailedOnly && successfulResults.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Tabla de Resultados
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportToExcel}
                className="btn-secondary flex items-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <FileText className="w-4 h-4" />
                <span>Exportar a Excel</span>
              </button>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRows.size === results.length && results.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Seleccionar Todo ({selectedRows.size}/{results.length})
                </span>
              </label>
            </div>
          </div>
        <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="bg-white border-t border-b border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '2800px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                      Nombre del Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '350px', minWidth: '350px' }}>
                      Código QR Detectado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '310px', minWidth: '310px' }}>
                      CUFE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Número de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Fecha de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px', minWidth: '130px' }}>
                      NIT Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                      Valor Sin Impuestos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px', minWidth: '100px' }}>
                      Valor IVA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px', minWidth: '140px' }}>
                      Valor Otros Impuestos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      NumeroFacturaQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      FechaFacturaQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      NITProveedorQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                      ValorSinImpuestosQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px', minWidth: '130px' }}>
                      ValorIVAQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                      ValorOtrosImpuestosQR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                      ValorTotalQR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {successfulResults.map((result, index) => {
                    const cufe = extractCufeFromQR(result.qrData)
                    const invoiceNumber = extractInvoiceNumber(result.qrData)
                    const invoiceDate = extractInvoiceDate(result.qrData)
                    const providerNIT = extractProviderNIT(result.qrData)
                    const valueWithoutTaxes = extractValueWithoutTaxes(result.qrData)
                    const ivaValue = extractIVAValue(result.qrData)
                    const otherTaxesValue = extractOtherTaxesValue(result.qrData)
                    const totalValue = extractTotalValue(result.qrData)
                    
                    // Formatear valores monetarios para mostrar
                    const formatCurrencyDisplay = (value) => {
                      if (!value) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(0)
                      const numValue = parseFloat(value)
                      if (isNaN(numValue)) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(0)
                      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numValue)
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="break-words" title={result.fileName} style={{ maxWidth: '180px' }}>
                            {result.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-start space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all" style={{ maxWidth: '330px', wordBreak: 'break-word', display: 'block' }}>
                              {result.qrData}
                            </code>
                            <button
                              onClick={() => copyToClipboard(result.qrData)}
                              className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-1"
                              title="Copiar código QR"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-start space-x-2">
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 break-all" style={{ maxWidth: '270px', wordBreak: 'break-word', display: 'block' }}>
                              {cufe || 'N/A'}
                            </code>
                            {cufe && (
                              <button
                                onClick={() => copyToClipboard(cufe)}
                                className="text-blue-600 hover:text-blue-800 flex-shrink-0 mt-1"
                                title="Copiar CUFE"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceNumber || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceDate || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {providerNIT || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(valueWithoutTaxes)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(ivaValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(otherTaxesValue)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrencyDisplay(totalValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceNumber ? (invoiceNumber.length > 20 ? invoiceNumber.substring(0, 20) : invoiceNumber) : ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {invoiceDate || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {providerNIT || ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(valueWithoutTaxes)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(ivaValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatCurrencyDisplay(otherTaxesValue)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrencyDisplay(totalValue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Detalles expandidos de cada archivo */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Archivos</h3>
          <div className="mb-4 flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRows.size === results.length && results.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Seleccionar Todo ({selectedRows.size}/{results.length})
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${
              selectedRows.has(index) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedRows.has(index)}
                  onChange={() => toggleRowSelection(index)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                {getFileTypeIcon(result.fileType)}
                <div>
                  <h3 className="font-medium text-gray-900">{result.fileName}</h3>
                  <p className="text-sm text-gray-500">
                    {result.fileType} • {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {getStatusIcon(result.success)}
            </div>

            {result.success ? (
              <div className="space-y-3">
                {result.qrData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 mb-2">
                      Código QR Detectado
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Clave de Acceso/CUFE:</span>
                        <button
                          onClick={() => copyToClipboard(result.qrData)}
                          className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-xs">Copiar</span>
                        </button>
                      </div>
                      <div className="bg-white border border-green-200 rounded p-2">
                        <code className="text-sm text-gray-800 break-all">
                          {result.qrData}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
                
                {result.cufeMatches && result.cufeMatches.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-medium text-purple-900 mb-2">
                      Patrones CUFE Detectados
                    </h4>
                    <div className="space-y-2">
                      {result.cufeMatches.map((match, index) => (
                        <div key={index} className="bg-white border border-purple-200 rounded p-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-purple-700">{match.type}</span>
                              <p className="text-xs text-purple-600">Longitud: {match.length} caracteres</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(match.value)}
                              className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="text-xs">Copiar</span>
                            </button>
                          </div>
                          <code className="text-xs text-gray-800 break-all block mt-1">
                            {match.value}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.additionalInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Información de Procesamiento
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Método exitoso:</span>
                        <p className="text-blue-600">{result.additionalInfo.successfulMethod || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Longitud QR:</span>
                        <p className="text-blue-600">{result.additionalInfo.qrLength} caracteres</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Contiene URLs:</span>
                        <p className="text-blue-600">{result.additionalInfo.containsUrls ? 'Sí' : 'No'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Datos de factura:</span>
                        <p className="text-blue-600">{result.additionalInfo.possibleInvoiceData ? 'Sí' : 'No'}</p>
                      </div>
                    </div>
                    {result.additionalInfo.methodsUsed && result.additionalInfo.methodsUsed.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-blue-700">Métodos probados:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.additionalInfo.methodsUsed.map((method, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-900 mb-1">
                    No se pudo procesar el archivo
                  </h4>
                  <p className="text-sm text-red-700 mb-2">
                    {result.error || 'No se encontraron códigos QR en el archivo'}
                  </p>
                  
                  {result.suggestions && (
                    <div className="mt-3">
                      <h5 className="font-medium text-red-800 mb-2">Sugerencias:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {result.debugInfo && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Información de Debug
                    </h4>
                    <pre className="text-sm text-yellow-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {JSON.stringify(result.debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QRResults

