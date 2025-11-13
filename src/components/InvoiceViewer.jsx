import React from 'react'
import { FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const InvoiceViewer = ({ qrResults, excelData, showSubmenu = 'found' }) => {
  // Extraer CUFE del código QR (igual que en QRResults y App.jsx)
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

  // Normalizar CUFE para comparación (eliminar espacios, convertir a mayúsculas)
  const normalizeCufe = (cufe) => {
    if (!cufe) return ''
    return String(cufe).trim().toUpperCase().replace(/\s+/g, '')
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

  // Funciones para extraer cada campo específico del QR
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

  // Buscar facturas que coincidan
  const findMatchingInvoices = () => {
    if (!qrResults || qrResults.length === 0 || !excelData || !excelData.data) {
      return []
    }

    // Filtrar solo resultados exitosos con QR
    const successfulQRResults = qrResults.filter(result => result.success && result.qrData)
    
    const matchedInvoices = []
    const matchedCufes = new Set() // Para rastrear CUFE que sí encontraron coincidencia

    successfulQRResults.forEach(qrResult => {
      const qrCufe = extractCufeFromQR(qrResult.qrData)
      const normalizedQrCufe = normalizeCufe(qrCufe)

      if (!normalizedQrCufe) return

      // Buscar en el Excel por CUFE/CUDE (puede tener diferentes nombres de columna)
      excelData.data.forEach(excelRow => {
        // Buscar en diferentes posibles nombres de columna
        const possibleCufeColumns = [
          'CUFE/UUID',
          'CUFE/CUDE',
          'CUFE',
          'CUDE',
          'UUID',
          'CUFE - UUID',
          'Código Único'
        ]

        let excelCufe = null
        for (const colName of possibleCufeColumns) {
          if (excelRow[colName]) {
            excelCufe = excelRow[colName]
            break
          }
        }

        if (!excelCufe) return

        const normalizedExcelCufe = normalizeCufe(excelCufe)

        // Comparar CUFE
        if (normalizedQrCufe === normalizedExcelCufe) {
          // Extraer valores del código QR
          const numeroFacturaQR = extractInvoiceNumber(qrResult.qrData)
          const fechaFacturaQR = extractInvoiceDate(qrResult.qrData)
          const nitProveedorQR = extractProviderNIT(qrResult.qrData)
          const valorSinImpuestosQR = extractValueWithoutTaxes(qrResult.qrData)
          const valorIVAQR = extractIVAValue(qrResult.qrData)
          const valorOtrosImpuestosQR = extractOtherTaxesValue(qrResult.qrData)
          const valorTotalQR = extractTotalValue(qrResult.qrData)

          // Extraer los campos necesarios
          const invoice = {
            cufe: normalizedQrCufe,
            prefijo: excelRow['Prefijo'] || excelRow['PREFIJO'] || '',
            folio: excelRow['Folio'] || excelRow['FOLIO'] || '',
            nitEmisor: excelRow['NIT Emisor'] || excelRow['NIT EMISOR'] || excelRow['NIT Emisor'] || '',
            nombreEmisor: excelRow['Nombre Emisor'] || excelRow['NOMBRE EMISOR'] || excelRow['Nombre Emisor'] || '',
            iva: excelRow['IVA'] || excelRow['iva'] || 0,
            inc: excelRow['INC'] || excelRow['inc'] || excelRow['INC'] || 0,
            icui: excelRow['ICUI'] || excelRow['icui'] || excelRow['ICUI'] || 0,
            total: excelRow['Total'] || excelRow['TOTAL'] || excelRow['total'] || 0,
            prefijoFolio: `${excelRow['Prefijo'] || excelRow['PREFIJO'] || ''}${excelRow['Folio'] || excelRow['FOLIO'] || ''}`,
            qrFileName: qrResult.fileName,
            numeroFacturaQR: numeroFacturaQR,
            fechaFacturaQR: fechaFacturaQR,
            nitProveedorQR: nitProveedorQR,
            valorSinImpuestosQR: valorSinImpuestosQR,
            valorIVAQR: valorIVAQR,
            valorOtrosImpuestosQR: valorOtrosImpuestosQR,
            valorTotalQR: valorTotalQR
          }

          // Evitar duplicados
          const exists = matchedInvoices.some(inv => inv.cufe === invoice.cufe && inv.prefijoFolio === invoice.prefijoFolio)
          if (!exists) {
            matchedInvoices.push(invoice)
            matchedCufes.add(normalizedQrCufe)
          }
        }
      })
    })

    return { matchedInvoices, matchedCufes }
  }

  // Función para obtener todos los CUFE del Excel
  const getExcelCufes = () => {
    if (!excelData || !excelData.data) return new Set()
    
    const cufeSet = new Set()
    const possibleCufeColumns = [
      'CUFE/UUID',
      'CUFE/CUDE',
      'CUFE',
      'CUDE',
      'UUID',
      'CUFE - UUID',
      'Código Único'
    ]

    excelData.data.forEach(excelRow => {
      // Buscar en todas las columnas posibles, no solo la primera
      possibleCufeColumns.forEach(colName => {
        const cellValue = excelRow[colName]
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          const normalizedCufe = normalizeCufe(String(cellValue))
          if (normalizedCufe) {
            cufeSet.add(normalizedCufe)
          }
        }
      })
    })

    return cufeSet
  }

  // Obtener registros no encontrados
  const getNotFoundRecords = () => {
    if (!qrResults || qrResults.length === 0 || !excelData || !excelData.data) {
      return []
    }

    const excelCufes = getExcelCufes()
    const successfulQRResults = qrResults.filter(result => result.success && result.qrData)
    
    const notFoundRecords = []

    successfulQRResults.forEach(qrResult => {
      const qrCufe = extractCufeFromQR(qrResult.qrData)
      
      // Si no hay CUFE extraído, saltar este registro
      if (!qrCufe || !qrCufe.trim()) {
        return
      }
      
      const normalizedQrCufe = normalizeCufe(qrCufe)

      // Si el CUFE normalizado no está vacío y no está en el Excel, agregarlo a no encontrados
      if (normalizedQrCufe && !excelCufes.has(normalizedQrCufe)) {
        notFoundRecords.push({
          fileName: qrResult.fileName,
          qrData: qrResult.qrData,
          cufe: qrCufe,
          message: 'No existe registro en tabla en Datos Importados del Excel'
        })
      }
    })

    return notFoundRecords
  }

  const { matchedInvoices } = findMatchingInvoices()
  const notFoundRecords = getNotFoundRecords()

  // Si no hay datos para comparar
  if (!qrResults || qrResults.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-medium text-yellow-900">No hay códigos QR extraídos</h3>
            <p className="text-sm text-yellow-700">
              Por favor, primero extrae los códigos QR en la pestaña "Extraer Códigos QR"
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!excelData || !excelData.data) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-medium text-yellow-900">No hay datos de Excel importados</h3>
            <p className="text-sm text-yellow-700">
              Por favor, primero importa un archivo Excel en la pestaña "Importar Excel"
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Formatear números
  const formatNumber = (value) => {
    if (!value || value === '') return '0'
    const num = parseFloat(value)
    if (isNaN(num)) return String(value)
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  // Exportar a Excel
  const exportToExcel = () => {
    if (!matchedInvoices || matchedInvoices.length === 0) {
      alert('No hay facturas para exportar')
      return
    }

    try {
      // Preparar los datos para Excel
      const excelData = matchedInvoices.map((invoice, index) => {
        const subtotal = parseFloat(invoice.total || 0) - parseFloat(invoice.iva || 0)
        const porcentajeIVA = subtotal > 0 ? ((parseFloat(invoice.iva || 0) * 100) / subtotal) : 0
        return {
          '#': index + 1,
          'Nombre del Archivo': invoice.qrFileName || '',
          'CUFE': invoice.cufe,
          'Prefijo': invoice.prefijo,
          'Folio': invoice.folio,
          'PrefijoFolio': invoice.prefijoFolio,
          'NIT Emisor': invoice.nitEmisor,
          'Nombre Emisor': invoice.nombreEmisor,
          'IVA': invoice.iva,
          'Subtotal': subtotal.toFixed(2),
          'Porcentaje IVA': porcentajeIVA.toFixed(2) + '%',
          'INC': invoice.inc,
          'ICUI': invoice.icui,
          'Total': invoice.total,
          'NumeroFacturaQR': invoice.numeroFacturaQR || '',
          'FechaFacturaQR': invoice.fechaFacturaQR || '',
          'NITProveedorQR': invoice.nitProveedorQR || '',
          'ValorSinImpuestosQR': invoice.valorSinImpuestosQR || '',
          'ValorIVAQR': invoice.valorIVAQR || '',
          'ValorOtrosImpuestosQR': invoice.valorOtrosImpuestosQR || '',
          'ValorTotalQR': invoice.valorTotalQR || ''
        }
      })

      // Calcular totales
      const totalIVA = matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.iva || 0), 0)
      const totalSubtotal = matchedInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.iva || 0)), 0)
      const porcentajePromedio = totalSubtotal > 0 ? ((totalIVA * 100) / totalSubtotal) : 0
      const totalINC = matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.inc || 0), 0)
      const totalICUI = matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.icui || 0), 0)
      const totalTotal = matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)

      // Agregar fila de totales
      excelData.push({
        '#': '',
        'Nombre del Archivo': '',
        'CUFE': '',
        'Prefijo': '',
        'Folio': '',
        'PrefijoFolio': '',
        'NIT Emisor': '',
        'Nombre Emisor': 'TOTALES',
        'IVA': totalIVA,
        'Subtotal': totalSubtotal.toFixed(2),
        'Porcentaje IVA': porcentajePromedio.toFixed(2) + '%',
        'INC': totalINC,
        'ICUI': totalICUI,
        'Total': totalTotal,
        'NumeroFacturaQR': '',
        'FechaFacturaQR': '',
        'NITProveedorQR': '',
        'ValorSinImpuestosQR': '',
        'ValorIVAQR': '',
        'ValorOtrosImpuestosQR': '',
        'ValorTotalQR': ''
      })

      // Crear workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Establecer ancho de columnas
      const colWidths = [
        { wch: 5 },   // #
        { wch: 30 },  // Nombre del Archivo
        { wch: 40 },  // CUFE
        { wch: 12 },  // Prefijo
        { wch: 12 },  // Folio
        { wch: 20 },  // PrefijoFolio
        { wch: 15 },  // NIT Emisor
        { wch: 40 },  // Nombre Emisor
        { wch: 15 },  // IVA
        { wch: 15 },  // Subtotal
        { wch: 15 },  // Porcentaje IVA
        { wch: 15 },  // INC
        { wch: 15 },  // ICUI
        { wch: 15 },  // Total
        { wch: 18 },  // NumeroFacturaQR
        { wch: 18 },  // FechaFacturaQR
        { wch: 18 },  // NITProveedorQR
        { wch: 22 },  // ValorSinImpuestosQR
        { wch: 18 },  // ValorIVAQR
        { wch: 25 },  // ValorOtrosImpuestosQR
        { wch: 18 }   // ValorTotalQR
      ]
      ws['!cols'] = colWidths

      // Agregar hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Facturas Encontradas')

      // Generar nombre de archivo con fecha
      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]
      const fileName = `Facturas_Encontradas_${dateStr}.xlsx`

      // Exportar archivo
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar el archivo Excel. Por favor intenta de nuevo.')
    }
  }

  // Exportar registros no encontrados a Excel
  const exportNotFoundToExcel = () => {
    if (!notFoundRecords || notFoundRecords.length === 0) {
      alert('No hay registros para exportar')
      return
    }

    try {
      const excelData = notFoundRecords.map((record, index) => ({
        '#': index + 1,
        'Nombre del Archivo': record.fileName,
        'Código QR Detectado': record.qrData,
        'CUFE': record.cufe,
        'MENSAJE': record.message
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 5 },   // #
        { wch: 30 },  // Nombre del Archivo
        { wch: 50 },  // Código QR Detectado
        { wch: 40 },  // CUFE
        { wch: 50 }   // MENSAJE
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Registros no encuentra CUFE')

      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]
      const fileName = `Registros_no_encuentra_CUFE_${dateStr}.xlsx`

      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar el archivo Excel. Por favor intenta de nuevo.')
    }
  }

  // Mostrar solo el submenú solicitado
  if (showSubmenu === 'notfound') {
    // Submenu 2: Registros no encuentra CUFE
    return (
      <div className="card border-orange-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Registros no encuentra CUFE
              </h2>
              <p className="text-gray-600">
                {notFoundRecords.length} registro(s) sin coincidencia en Excel
              </p>
            </div>
          </div>
          {notFoundRecords.length > 0 && (
            <button
              onClick={exportNotFoundToExcel}
              className="btn-secondary flex items-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
            >
              <Download className="w-4 h-4" />
              <span>Exportar a Excel</span>
            </button>
          )}
        </div>

        {notFoundRecords.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay registros sin coincidencia
            </h3>
            <p className="text-gray-500">
              Todos los CUFE de los códigos QR fueron encontrados en el Excel
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                      Nombre del Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '400px' }}>
                      Código QR Detectado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '300px' }}>
                      CUFE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                      MENSAJE
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notFoundRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-orange-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="break-words" title={record.fileName} style={{ maxWidth: '200px' }}>
                          {record.fileName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all" style={{ maxWidth: '380px', wordBreak: 'break-word', display: 'block' }}>
                          {record.qrData}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <code className="text-xs bg-orange-50 px-2 py-1 rounded border border-orange-200 break-all" style={{ maxWidth: '280px', wordBreak: 'break-word', display: 'block' }}>
                          {record.cufe || 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-sm text-orange-700">
                        {record.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Submenu 1: Facturas Encontradas (por defecto)
  if (matchedInvoices.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-medium text-yellow-900">No se encontraron coincidencias</h3>
            <p className="text-sm text-yellow-700">
              No se encontraron facturas que coincidan. Verifica que los CUFE en los códigos QR coincidan con los CUFE/CUDE del Excel.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Facturas Encontradas
            </h2>
            <p className="text-gray-600">
              {matchedInvoices.length} factura(s) coincidente(s)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Coincidencias encontradas</span>
          </div>
          {matchedInvoices.length > 0 && (
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center space-x-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              <Download className="w-4 h-4" />
              <span>Exportar a Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="overflow-x-auto">
        <style>{`
          .invoice-table-wrapper {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }
          .invoice-table-wrapper::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          .invoice-table-wrapper::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 6px;
          }
          .invoice-table-wrapper::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 6px;
          }
          .invoice-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}</style>
        <div 
          className="invoice-table-wrapper overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm"
          style={{ 
            maxHeight: '600px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc'
          }}
        >
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '2400px' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200" style={{ minWidth: '200px', left: '60px' }}>
                  Nombre del Archivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200" style={{ minWidth: '200px', left: '260px' }}>
                  CUFE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Prefijo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Folio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Prefijo-Folio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  NIT Emisor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '250px' }}>
                  Nombre Emisor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  IVA
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Subtotal
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Porcentaje IVA
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  INC
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  ICUI
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  NumeroFacturaQR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  FechaFacturaQR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  NITProveedorQR
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  ValorSinImpuestosQR
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  ValorIVAQR
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  ValorOtrosImpuestosQR
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  ValorTotalQR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchedInvoices.map((invoice, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 bg-white sticky left-0 z-10 border-r border-gray-200 break-words" style={{ maxWidth: '200px', left: '60px' }}>
                    {invoice.qrFileName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 bg-white sticky left-0 z-10 border-r border-gray-200 break-all" style={{ maxWidth: '200px', left: '260px' }}>
                    {invoice.cufe}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.prefijo}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.folio}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {invoice.prefijoFolio || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.nitEmisor}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="max-w-xs truncate" title={invoice.nombreEmisor}>
                      {invoice.nombreEmisor}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    ${formatNumber(invoice.iva)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    ${formatNumber((parseFloat(invoice.total || 0) - parseFloat(invoice.iva || 0)).toFixed(2))}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    {(() => {
                      const subtotal = parseFloat(invoice.total || 0) - parseFloat(invoice.iva || 0)
                      const porcentajeIVA = subtotal > 0 ? ((parseFloat(invoice.iva || 0) * 100) / subtotal).toFixed(2) : '0.00'
                      return `${porcentajeIVA}%`
                    })()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    ${formatNumber(invoice.inc)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    ${formatNumber(invoice.icui)}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(invoice.total)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.numeroFacturaQR || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.fechaFacturaQR || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {invoice.nitProveedorQR || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    {invoice.valorSinImpuestosQR ? formatNumber(invoice.valorSinImpuestosQR) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    {invoice.valorIVAQR ? formatNumber(invoice.valorIVAQR) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    {invoice.valorOtrosImpuestosQR ? formatNumber(invoice.valorOtrosImpuestosQR) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                    {invoice.valorTotalQR ? formatNumber(invoice.valorTotalQR) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            {matchedInvoices.length > 0 && (
              <tfoot className="bg-gray-50 sticky bottom-0">
                <tr>
                  <td colSpan={9} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    Totales:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.iva || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(matchedInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.iva || 0)), 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {(() => {
                      const totalIVA = matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.iva || 0), 0)
                      const totalSubtotal = matchedInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.iva || 0)), 0)
                      const porcentajePromedio = totalSubtotal > 0 ? ((totalIVA * 100) / totalSubtotal).toFixed(2) : '0.00'
                      return `${porcentajePromedio}%`
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.inc || 0), 0))}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.icui || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    ${formatNumber(matchedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0))}
                  </td>
                  <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-900 text-center">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

export default InvoiceViewer

