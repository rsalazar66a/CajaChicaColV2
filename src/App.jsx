import React, { useState } from 'react'
import Header from './components/Header'
import FileUploader from './components/FileUploader'
import QRResults from './components/QRResults'
import ProcessingStatus from './components/ProcessingStatus'
import StatsPanel from './components/StatsPanel'
import ExcelImporter from './components/ExcelImporter'
import ExcelDataViewer from './components/ExcelDataViewer'
import InvoiceViewer from './components/InvoiceViewer'
import { AlertCircle, Download, FileSpreadsheet, CheckCircle, Plus, Trash2, Edit2 } from 'lucide-react'
import * as XLSX from 'xlsx'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)
  const [excelData, setExcelData] = useState(null)
  const [activeTab, setActiveTab] = useState('qr') // 'qr', 'excel', 'invoices', 'ocr'
  const [activeQRSubmenu, setActiveQRSubmenu] = useState('extract') // 'extract', 'results', 'failed', 'stats'
  const [activeInvoiceSubmenu, setActiveInvoiceSubmenu] = useState('found') // 'found', 'notfound', 'duplicates'
  const [activeOCRSubmenu, setActiveOCRSubmenu] = useState('processing') // 'processing', 'final', 'patterns'
  const [ocrResults, setOcrResults] = useState({}) // Nuevo estado para guardar resultados OCR
  const [nitPatterns, setNitPatterns] = useState([]) // Estado para almacenar patrones de búsqueda de NIT
  const [editingPatternId, setEditingPatternId] = useState(null) // ID del patrón en edición
  const [newPattern, setNewPattern] = useState({ patronNIT: '' }) // Estado para nuevo patrón
  const [showAddForm, setShowAddForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar
  const [invoicePatterns, setInvoicePatterns] = useState([]) // Estado para almacenar patrones de búsqueda de Factura
  const [editingInvoicePatternId, setEditingInvoicePatternId] = useState(null) // ID del patrón de factura en edición
  const [newInvoicePattern, setNewInvoicePattern] = useState({ patronFac: '', prefijoFac: '' }) // Estado para nuevo patrón de factura
  const [showAddInvoiceForm, setShowAddInvoiceForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar factura
  const [subTotalPatterns, setSubTotalPatterns] = useState([]) // Estado para almacenar patrones de búsqueda de Sub Total
  const [editingSubTotalPatternId, setEditingSubTotalPatternId] = useState(null) // ID del patrón de Sub Total en edición
  const [newSubTotalPattern, setNewSubTotalPattern] = useState({ patronSubTotal: '' }) // Estado para nuevo patrón de Sub Total
  const [showAddSubTotalForm, setShowAddSubTotalForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar Sub Total
  const [ivaPatterns, setIvaPatterns] = useState([]) // Estado para almacenar patrones de búsqueda de IVA
  const [editingIvaPatternId, setEditingIvaPatternId] = useState(null) // ID del patrón de IVA en edición
  const [newIvaPattern, setNewIvaPattern] = useState({ patronIVA: '' }) // Estado para nuevo patrón de IVA
  const [showAddIvaForm, setShowAddIvaForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar IVA
  const [totalPatterns, setTotalPatterns] = useState([]) // Estado para almacenar patrones de búsqueda de Total
  const [editingTotalPatternId, setEditingTotalPatternId] = useState(null) // ID del patrón de Total en edición
  const [newTotalPattern, setNewTotalPattern] = useState({ patronTotal: '' }) // Estado para nuevo patrón de Total
  const [showAddTotalForm, setShowAddTotalForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar Total
  const [cufePatterns, setCufePatterns] = useState([]) // Estado para almacenar patrones de búsqueda de CUFE
  const [editingCufePatternId, setEditingCufePatternId] = useState(null) // ID del patrón de CUFE en edición
  const [newCufePattern, setNewCufePattern] = useState({ patronCUFE: '' }) // Estado para nuevo patrón de CUFE
  const [showAddCufeForm, setShowAddCufeForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar CUFE
  const [transactionTypePatterns, setTransactionTypePatterns] = useState([]) // Estado para almacenar patrones de búsqueda de Tipo de Transacción
  const [editingTransactionTypePatternId, setEditingTransactionTypePatternId] = useState(null) // ID del patrón de Tipo de Transacción en edición
  const [newTransactionTypePattern, setNewTransactionTypePattern] = useState({ patronTipo: '', tipoDescripcion: '' }) // Estado para nuevo patrón de Tipo de Transacción
  const [showAddTransactionTypeForm, setShowAddTransactionTypeForm] = useState(false) // Estado para mostrar/ocultar formulario de agregar Tipo de Transacción

  const handleFileUpload = (files) => {
    setUploadedFiles(files)
    setError(null)
  }

  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) {
      setError('Por favor selecciona al menos un archivo')
      return
    }

    const MAX_FILES = 500
    if (uploadedFiles.length > MAX_FILES) {
      setError(`Se pueden procesar hasta ${MAX_FILES} archivos a la vez. Has seleccionado ${uploadedFiles.length} archivos.`)
      return
    }

    setProcessing(true)
    setError(null)
    setResults([])

    // Crear AbortController con timeout de 30 minutos (1800000ms)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1800000) // 30 minutos

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })

      console.log('Enviando petición al servidor...', uploadedFiles.length, 'archivo(s)')
      
      const response = await fetch('/api/process-qr', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('Respuesta del servidor:', response.status, response.statusText)

      let data
      try {
        data = await response.json()
        console.log('Datos recibidos:', data)
      } catch (jsonError) {
        console.error('Error al parsear JSON:', jsonError)
        const text = await response.text()
        console.error('Respuesta del servidor (texto):', text)
        throw new Error('Error al procesar la respuesta del servidor')
      }

      // Manejar respuestas parciales (206) o errores con resultados parciales
      const isPartialResponse = response.status === 206 || (response.status >= 200 && response.status < 300 && data.results && !data.completed)
      
      if (isPartialResponse || (data.results && Array.isArray(data.results))) {
        // Hay resultados, incluso si es una respuesta parcial
        setResults(data.results)
        const processed = data.processedFiles || data.results.length
        const total = data.totalFiles || uploadedFiles.length
        
        console.log('Resultados establecidos:', processed, 'de', total, 'archivos')
        
        // Si es una respuesta parcial o no se completó, mostrar advertencia
        if (isPartialResponse || !data.completed) {
          const missing = total - processed
          const warningMsg = data.warning || `Solo se procesaron ${processed} de ${total} archivos.`
          console.warn('Advertencia:', warningMsg)
          
          // Mostrar advertencia pero no como error crítico
          if (data.error) {
            setError(`${warningMsg} Error: ${data.error}`)
          } else {
            setError(warningMsg + ' Los archivos procesados se muestran a continuación.')
          }
        }
        
        // Actualizar estadísticas después de procesar
        setStatsRefreshTrigger(prev => prev + 1)
      } else if (!response.ok) {
        // Si hay un error sin resultados
        const errorMessage = data.error || 'Error al procesar los archivos'
        const traceback = data.traceback ? `\n\nDetalles técnicos:\n${data.traceback}` : ''
        throw new Error(errorMessage + traceback)
      } else {
        console.error('Formato de respuesta inesperado:', data)
        throw new Error('Formato de respuesta inesperado del servidor')
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Error al procesar archivos:', err)
      
      if (err.name === 'AbortError') {
        setError('El procesamiento tomó demasiado tiempo (más de 30 minutos). Intenta procesar menos archivos a la vez.')
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Error de conexión con el servidor. Verifica que el servidor esté corriendo y que no haya problemas de red.')
      } else {
        setError(err.message || 'Error desconocido al procesar los archivos')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleClearResults = (newResults = null) => {
    if (newResults === null) {
      // Si no se pasan resultados, limpiar todo
      setResults([])
      setUploadedFiles([])
      setError(null)
    } else {
      // Si se pasan resultados, actualizar con los nuevos resultados (después de borrar filas seleccionadas)
      setResults(newResults)
    }
  }

  // Función para extraer CUFE del código QR
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

  // Normalizar CUFE para comparación
  const normalizeCufe = (cufe) => {
    if (!cufe) return ''
    return String(cufe).trim().toUpperCase().replace(/\s+/g, '')
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

  // Filtrar resultados exitosos y fallidos
  const baseSuccessfulResults = results.filter(result => result.success && result.qrData)
  const baseFailedResults = results.filter(result => !result.success || !result.qrData)

  // Usar los resultados originales sin modificar
  // Los registros que no están en el Excel solo aparecerán en "Registros no encuentra CUFE" en Visualizar Facturas
  const successfulResults = baseSuccessfulResults
  const failedResults = baseFailedResults

  // Función para obtener registros no encontrados en Excel (similar a InvoiceViewer)
  const getNotFoundRecords = () => {
    if (!results || results.length === 0 || !excelData || !excelData.data) {
      return []
    }

    const excelCufes = getExcelCufes()
    const successfulQRResults = results.filter(result => result.success && result.qrData)
    
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
          error: 'No existe registro en tabla en Datos Importados del Excel'
        })
      }
    })

    return notFoundRecords
  }

  // Función para obtener CUFE duplicados de la tabla "Tabla de Resultados"
  const getDuplicateCufes = () => {
    if (!results || results.length === 0) {
      return []
    }

    const successfulQRResults = results.filter(result => result.success && result.qrData)
    const cufeMap = new Map() // Map<normalizedCufe, Array<{fileName, cufe}>>

    // Agrupar por CUFE
    successfulQRResults.forEach(qrResult => {
      const qrCufe = extractCufeFromQR(qrResult.qrData)
      const normalizedQrCufe = normalizeCufe(qrCufe)

      if (normalizedQrCufe) {
        if (!cufeMap.has(normalizedQrCufe)) {
          cufeMap.set(normalizedQrCufe, [])
        }
        cufeMap.get(normalizedQrCufe).push({
          fileName: qrResult.fileName,
          cufe: qrCufe
        })
      }
    })

    // Filtrar solo los que aparecen más de una vez y crear el array de resultados
    const duplicateRecords = []
    cufeMap.forEach((files, normalizedCufe) => {
      if (files.length > 1) {
        // Agregar un registro por cada archivo con este CUFE
        files.forEach(file => {
          duplicateRecords.push({
            fileName: file.fileName,
            cufe: file.cufe,
            count: files.length
          })
        })
      }
    })

    return duplicateRecords
  }

  const notFoundRecords = getNotFoundRecords()
  const duplicateCufes = getDuplicateCufes()

  // Función para combinar registros de ambas fuentes
  const getOCRProcessingRecords = () => {
    // Archivos sin Código QR
    const failedRecords = failedResults.map(result => ({
      fileName: result.fileName,
      qrData: result.qrData || '',
      error: result.error || 'No se encontraron códigos QR en el archivo'
    }))

    // Registros no encontrados en Excel (solo si hay Excel importado)
    const notFoundRecords = excelData && excelData.data ? getNotFoundRecords() : []

    // Combinar ambos
    return [...failedRecords, ...notFoundRecords]
  }

  const ocrProcessingRecords = getOCRProcessingRecords()

  // Función para buscar datos del Excel por CUFEOCR
  const findExcelDataByCufeOcr = (cufeOcr) => {
    if (!cufeOcr || !cufeOcr.trim() || !excelData || !excelData.data) {
      return null
    }

    const normalizedCufeOcr = normalizeCufe(cufeOcr)
    if (!normalizedCufeOcr) return null

    // Buscar en el Excel por CUFE/CUDE (puede tener diferentes nombres de columna)
    for (const excelRow of excelData.data) {
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

      if (!excelCufe) continue

      const normalizedExcelCufe = normalizeCufe(excelCufe)

      // Comparar CUFE
      if (normalizedCufeOcr === normalizedExcelCufe) {
        return {
          prefijo: excelRow['Prefijo'] || excelRow['PREFIJO'] || '',
          folio: excelRow['Folio'] || excelRow['FOLIO'] || '',
          prefijoFolio: `${excelRow['Prefijo'] || excelRow['PREFIJO'] || ''}${excelRow['Folio'] || excelRow['FOLIO'] || ''}`,
          nitEmisor: excelRow['NIT Emisor'] || excelRow['NIT EMISOR'] || excelRow['NIT Emisor'] || '',
          nombreEmisor: excelRow['Nombre Emisor'] || excelRow['NOMBRE EMISOR'] || excelRow['Nombre Emisor'] || '',
          iva: excelRow['IVA'] || excelRow['iva'] || 0,
          inc: excelRow['INC'] || excelRow['inc'] || excelRow['INC'] || 0,
          icui: excelRow['ICUI'] || excelRow['icui'] || excelRow['ICUI'] || 0,
          total: excelRow['Total'] || excelRow['TOTAL'] || excelRow['total'] || 0
        }
      }
    }

    return null
  }

  // Función para exportar registros de OCR a Excel (para Procesamiento OCR)
  const exportProcessingOCRToExcel = () => {
    if (ocrProcessingRecords.length === 0) {
      alert('No hay registros para exportar')
      return
    }

    try {
      const excelData = ocrProcessingRecords.map((record, index) => {
        // Obtener el resultado OCR para este archivo
        const ocrResult = ocrResults[record.fileName]
        const ocrText = ocrResult && ocrResult.success ? (ocrResult.text || '') : ''
        const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
        const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
        const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'

        const formatNumber = (num) => {
          if (!num) return '0.00'
          const numValue = parseFloat(num)
          if (isNaN(numValue)) return '0.00'
          return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(numValue)
        }

        // Si Prefijo-FolioOCR está vacío o es "-", buscar por patrones
        let nitEmisorOCRTxt = ''
        let numFacturaOCRTxt = ''
        let subTotalOCRTxt = ''
        let ivaOCRTxt = ''
        let totalOCRTxt = ''
        let tipoTransaccionOCRTxt = ''
        
        if (!prefijoFolioOCR || prefijoFolioOCR === '-' || prefijoFolioOCR.trim() === '') {
          nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
          numFacturaOCRTxt = extractInvoiceNumberFromPatterns(record.qrData || '', ocrText || '')
          subTotalOCRTxt = extractSubTotalFromPatterns(record.qrData || '', ocrText || '')
          ivaOCRTxt = extractIVAFromPatterns(record.qrData || '', ocrText || '')
          totalOCRTxt = extractTotalFromPatterns(record.qrData || '', ocrText || '')
          tipoTransaccionOCRTxt = extractTransactionTypeFromPatterns(record.qrData || '', ocrText || '')
        }

        return {
          '#': index + 1,
          'Nombre del Archivo': record.fileName,
          'Código QR Detectado': record.qrData,
          'Error / Mensaje': record.error,
          'CUFEOCR': cufeOcr,
          'TEXTOCR': ocrText,
          'PrefijoOCR': excelRowData ? excelRowData.prefijo : '',
          'FolioOCR': excelRowData ? excelRowData.folio : '',
          'Prefijo-FolioOCR': prefijoFolioOCR,
          'NIT_EmisorOCR': excelRowData ? excelRowData.nitEmisor : '',
          'Nombre_EmisorOCR': excelRowData ? excelRowData.nombreEmisor : '',
          'IVAOCR': excelRowData ? formatNumber(excelRowData.iva) : '',
          'INCOCR': excelRowData ? formatNumber(excelRowData.inc) : '',
          'ICUIOCR': excelRowData ? formatNumber(excelRowData.icui) : '',
          'TotalOCR': excelRowData ? formatNumber(excelRowData.total) : '',
          'NIT_EmisorOCR_Txt': nitEmisorOCRTxt,
          'Num_Factura_OCR_Txt': numFacturaOCRTxt,
          'SubTotal_OCR_Txt': subTotalOCRTxt,
          'IVA_OCR_Txt': ivaOCRTxt,
          'Total_OCR_Txt': totalOCRTxt,
          'Tipo_TransacciónOCR': tipoTransaccionOCRTxt
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 5 },   // #
        { wch: 30 },  // Nombre del Archivo
        { wch: 50 },  // Código QR Detectado
        { wch: 50 },  // Error / Mensaje
        { wch: 40 },  // CUFEOCR
        { wch: 100 }, // TEXTOCR
        { wch: 15 },  // PrefijoOCR
        { wch: 15 },  // FolioOCR
        { wch: 20 },  // Prefijo-FolioOCR
        { wch: 20 },  // NIT_EmisorOCR
        { wch: 40 },  // Nombre_EmisorOCR
        { wch: 15 },  // IVAOCR
        { wch: 15 },  // INCOCR
        { wch: 15 },  // ICUIOCR
        { wch: 15 },  // TotalOCR
        { wch: 20 },  // NIT_EmisorOCR_Txt
        { wch: 20 },  // Num_Factura_OCR_Txt
        { wch: 15 },  // SubTotal_OCR_Txt
        { wch: 15 },  // IVA_OCR_Txt
        { wch: 15 },  // Total_OCR_Txt
        { wch: 20 }   // Tipo_TransacciónOCR
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Procesamiento OCR')

      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]
      const fileName = `Procesamiento_OCR_${dateStr}.xlsx`

      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar el archivo Excel. Por favor intenta de nuevo.')
    }
  }

  // Función para exportar registros de OCR a Excel (para Resultado Final con OCR)
  const exportOCRToExcel = () => {
    if (ocrProcessingRecords.length === 0) {
      alert('No hay registros para exportar')
      return
    }

    try {
      // Filtrar registros que tienen NIT_EmisorOCR o NIT_EmisorOCR_Txt
      const filteredRecords = ocrProcessingRecords.filter(record => {
        const ocrText = getOcrText(record.fileName)
        const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
        const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
        const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'
        
        const shouldSearchByPatterns = !prefijoFolioOCR || 
                                     prefijoFolioOCR === '-' || 
                                     prefijoFolioOCR.trim() === '' ||
                                     prefijoFolioOCR === 'undefined' ||
                                     prefijoFolioOCR === 'null'
        
        let nitEmisorOCRTxt = ''
        if (shouldSearchByPatterns) {
          nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
        }
        
        const nitEmisorOCR = excelRowData ? excelRowData.nitEmisor : ''
        const hasNIT = (nitEmisorOCR && nitEmisorOCR.trim() !== '') || 
                      (nitEmisorOCRTxt && nitEmisorOCRTxt.trim() !== '')
        return hasNIT
      })

      if (filteredRecords.length === 0) {
        alert('No hay registros con NIT para exportar')
        return
      }

      const excelData = filteredRecords.map((record, index) => {
        // Obtener el resultado OCR para este archivo
        const ocrResult = ocrResults[record.fileName]
        const ocrText = ocrResult && ocrResult.success ? (ocrResult.text || '') : ''
        const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
        const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
        const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'
        
        const formatNumber = (num) => {
          if (!num) return '0.00'
          const numValue = parseFloat(num)
          if (isNaN(numValue)) return '0.00'
          return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(numValue)
        }

        // Si Prefijo-FolioOCR está vacío o es "-", buscar por patrones
        let nitEmisorOCRTxt = ''
        let numFacturaOCRTxt = ''
        let subTotalOCRTxt = ''
        let ivaOCRTxt = ''
        let totalOCRTxt = ''
        
        const shouldSearchByPatterns = !prefijoFolioOCR || 
                                     prefijoFolioOCR === '-' || 
                                     prefijoFolioOCR.trim() === '' ||
                                     prefijoFolioOCR === 'undefined' ||
                                     prefijoFolioOCR === 'null'
        
        if (shouldSearchByPatterns) {
          nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
          numFacturaOCRTxt = extractInvoiceNumberFromPatterns(record.qrData || '', ocrText || '')
          subTotalOCRTxt = extractSubTotalFromPatterns(record.qrData || '', ocrText || '')
          ivaOCRTxt = extractIVAFromPatterns(record.qrData || '', ocrText || '')
          totalOCRTxt = extractTotalFromPatterns(record.qrData || '', ocrText || '')
        }

        return {
          '#': index + 1,
          'Nombre del Archivo': record.fileName,
          'Código QR Detectado': record.qrData,
          'Error / Mensaje': record.error,
          'CUFE_OCR': cufeOcr,
          'TEXTO OCR': ocrText,
          'Prefijo-FolioOCR': prefijoFolioOCR && prefijoFolioOCR !== '-' ? prefijoFolioOCR : '',
          'NIT_EmisorOCR': excelRowData ? excelRowData.nitEmisor : '',
          'Nombre_EmisorOCR': excelRowData ? excelRowData.nombreEmisor : '',
          'IVAOCR': excelRowData ? formatNumber(excelRowData.iva) : '',
          'INCOCR': excelRowData ? formatNumber(excelRowData.inc) : '',
          'ICUIOCR': excelRowData ? formatNumber(excelRowData.icui) : '',
          'TotalOCR': excelRowData ? formatNumber(excelRowData.total) : '',
          'NIT_EmisorOCR_Txt': nitEmisorOCRTxt,
          'Num_Factura_OCR_Txt': numFacturaOCRTxt,
          'SubTotal_OCR_Txt': subTotalOCRTxt,
          'IVA_OCR_Txt': ivaOCRTxt,
          'Total_OCR_Txt': totalOCRTxt
        }
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 5 },   // #
        { wch: 30 },  // Nombre del Archivo
        { wch: 50 },  // Código QR Detectado
        { wch: 50 },  // Error / Mensaje
        { wch: 40 },  // CUFE_OCR
        { wch: 100 }, // TEXTO OCR
        { wch: 20 },  // Prefijo-FolioOCR
        { wch: 18 },  // NIT_EmisorOCR
        { wch: 40 },  // Nombre_EmisorOCR
        { wch: 15 },  // IVAOCR
        { wch: 15 },  // INCOCR
        { wch: 15 },  // ICUIOCR
        { wch: 15 },  // TotalOCR
        { wch: 18 },  // NIT_EmisorOCR_Txt
        { wch: 20 },  // Num_Factura_OCR_Txt
        { wch: 18 },  // SubTotal_OCR_Txt
        { wch: 15 },  // IVA_OCR_Txt
        { wch: 15 }   // Total_OCR_Txt
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Resultado Final con OCR')

      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]
      const fileName = `Resultado_Final_con_OCR_${dateStr}.xlsx`

      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar el archivo Excel. Por favor intenta de nuevo.')
    }
  }

  // Función para exportar patrones a Excel
  const exportPatternsToExcel = () => {
    try {
      const wb = XLSX.utils.book_new()

      // Hoja 1: Patrones NIT
      if (nitPatterns.length > 0) {
        const nitData = nitPatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronNIT': pattern.patronNIT || ''
        }))
        const wsNIT = XLSX.utils.json_to_sheet(nitData)
        wsNIT['!cols'] = [{ wch: 5 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsNIT, 'Patrones NIT')
      }

      // Hoja 2: Patrones Factura
      if (invoicePatterns.length > 0) {
        const invoiceData = invoicePatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronFac': pattern.patronFac || '',
          'PrefijoFac': pattern.prefijoFac || ''
        }))
        const wsInvoice = XLSX.utils.json_to_sheet(invoiceData)
        wsInvoice['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, wsInvoice, 'Patrones Factura')
      }

      // Hoja 3: Patrones Sub Total
      if (subTotalPatterns.length > 0) {
        const subTotalData = subTotalPatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronSubTotal': pattern.patronSubTotal || ''
        }))
        const wsSubTotal = XLSX.utils.json_to_sheet(subTotalData)
        wsSubTotal['!cols'] = [{ wch: 5 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsSubTotal, 'Patrones Sub Total')
      }

      // Hoja 4: Patrones IVA
      if (ivaPatterns.length > 0) {
        const ivaData = ivaPatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronIVA': pattern.patronIVA || ''
        }))
        const wsIVA = XLSX.utils.json_to_sheet(ivaData)
        wsIVA['!cols'] = [{ wch: 5 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsIVA, 'Patrones IVA')
      }

      // Hoja 5: Patrones Total
      if (totalPatterns.length > 0) {
        const totalData = totalPatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronTotal': pattern.patronTotal || ''
        }))
        const wsTotal = XLSX.utils.json_to_sheet(totalData)
        wsTotal['!cols'] = [{ wch: 5 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsTotal, 'Patrones Total')
      }

      // Hoja 6: Patrones CUFE
      if (cufePatterns.length > 0) {
        const cufeData = cufePatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronCUFE': pattern.patronCUFE || ''
        }))
        const wsCUFE = XLSX.utils.json_to_sheet(cufeData)
        wsCUFE['!cols'] = [{ wch: 5 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsCUFE, 'Patrones CUFE')
      }

      // Hoja 7: Patrones Tipo de Transacción
      if (transactionTypePatterns.length > 0) {
        const transactionTypeData = transactionTypePatterns.map((pattern, index) => ({
          '#': index + 1,
          'PatronTipo': pattern.patronTipo || '',
          'TipoDescripcion': pattern.tipoDescripcion || ''
        }))
        const wsTransactionType = XLSX.utils.json_to_sheet(transactionTypeData)
        wsTransactionType['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsTransactionType, 'Patrones Tipo Transaccion')
      }

      // Si no hay patrones, crear una hoja vacía con mensaje
      if (wb.SheetNames.length === 0) {
        const emptyData = [{ 'Mensaje': 'No hay patrones configurados para exportar' }]
        const wsEmpty = XLSX.utils.json_to_sheet(emptyData)
        XLSX.utils.book_append_sheet(wb, wsEmpty, 'Sin Patrones')
      }

      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]
      const fileName = `Configuracion_Patrones_${dateStr}.xlsx`

      XLSX.writeFile(wb, fileName)
      alert('Patrones exportados exitosamente')
    } catch (error) {
      console.error('Error al exportar patrones:', error)
      alert('Error al exportar los patrones. Por favor intenta de nuevo.')
    }
  }

  // Función para importar patrones desde Excel
  const handleImportPatternsFromExcel = (file) => {
    if (!file) return

    const validExtensions = ['.xlsx', '.xls', '.xlsm']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor selecciona un archivo Excel (.xlsx, .xls, .xlsm)')
      return
    }

    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Procesar cada hoja
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '',
              raw: false 
            })

            if (jsonData.length <= 1) return // Solo headers o vacío

            const headers = jsonData[0]
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''))

            // Procesar según el nombre de la hoja
            if (sheetName.includes('NIT')) {
              const patterns = rows.map((row, index) => {
                const patronNITIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patronnit'))
                return {
                  id: Date.now() + index,
                  patronNIT: patronNITIndex >= 0 ? String(row[patronNITIndex] || '').trim() : ''
                }
              }).filter(p => p.patronNIT)
              if (patterns.length > 0) {
                setNitPatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('Factura')) {
              const patterns = rows.map((row, index) => {
                const patronFacIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patronfac'))
                const prefijoFacIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('prefijofac'))
                return {
                  id: Date.now() + index,
                  patronFac: patronFacIndex >= 0 ? String(row[patronFacIndex] || '').trim() : '',
                  prefijoFac: prefijoFacIndex >= 0 ? String(row[prefijoFacIndex] || '').trim() : ''
                }
              }).filter(p => p.patronFac)
              if (patterns.length > 0) {
                setInvoicePatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('Sub Total')) {
              const patterns = rows.map((row, index) => {
                const patronSubTotalIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patronsubtotal'))
                return {
                  id: Date.now() + index,
                  patronSubTotal: patronSubTotalIndex >= 0 ? String(row[patronSubTotalIndex] || '').trim() : ''
                }
              }).filter(p => p.patronSubTotal)
              if (patterns.length > 0) {
                setSubTotalPatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('IVA')) {
              const patterns = rows.map((row, index) => {
                const patronIVAIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patroniva'))
                return {
                  id: Date.now() + index,
                  patronIVA: patronIVAIndex >= 0 ? String(row[patronIVAIndex] || '').trim() : ''
                }
              }).filter(p => p.patronIVA)
              if (patterns.length > 0) {
                setIvaPatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('Total')) {
              const patterns = rows.map((row, index) => {
                const patronTotalIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patrontotal'))
                return {
                  id: Date.now() + index,
                  patronTotal: patronTotalIndex >= 0 ? String(row[patronTotalIndex] || '').trim() : ''
                }
              }).filter(p => p.patronTotal)
              if (patterns.length > 0) {
                setTotalPatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('CUFE')) {
              const patterns = rows.map((row, index) => {
                const patronCUFEIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patroncufe'))
                return {
                  id: Date.now() + index,
                  patronCUFE: patronCUFEIndex >= 0 ? String(row[patronCUFEIndex] || '').trim() : ''
                }
              }).filter(p => p.patronCUFE)
              if (patterns.length > 0) {
                setCufePatterns(prev => [...prev, ...patterns])
              }
            } else if (sheetName.includes('Tipo') || sheetName.includes('Transaccion') || sheetName.includes('Transacción')) {
              const patterns = rows.map((row, index) => {
                const patronTipoIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('patrontipo'))
                const tipoDescripcionIndex = headers.findIndex(h => h && h.toString().toLowerCase().includes('tipodescripcion'))
                return {
                  id: Date.now() + index,
                  patronTipo: patronTipoIndex >= 0 ? String(row[patronTipoIndex] || '').trim() : '',
                  tipoDescripcion: tipoDescripcionIndex >= 0 ? String(row[tipoDescripcionIndex] || '').trim() : ''
                }
              }).filter(p => p.patronTipo)
              if (patterns.length > 0) {
                setTransactionTypePatterns(prev => [...prev, ...patterns])
              }
            }
          })

          alert('Patrones importados exitosamente')
        } catch (parseError) {
          console.error('Error al parsear Excel:', parseError)
          alert('Error al leer el archivo Excel. Por favor verifica que el archivo tenga el formato correcto.')
        }
      }

      reader.onerror = () => {
        alert('Error al leer el archivo')
      }

      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error('Error al procesar archivo:', err)
      alert('Error inesperado al procesar el archivo')
    }
  }

  // Función para procesar archivos con OCR
  const handleProcessOCR = async (fileNames) => {
    if (!fileNames || fileNames.length === 0) {
      setError('Por favor selecciona al menos un archivo para procesar con OCR')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Obtener los archivos originales de los resultados
      const filesToProcess = []
      fileNames.forEach(fileName => {
        // Buscar el archivo en uploadedFiles o en results
        const originalFile = uploadedFiles.find(f => f.name === fileName)
        if (originalFile) {
          filesToProcess.push(originalFile)
        }
      })

      if (filesToProcess.length === 0) {
        throw new Error('No se encontraron los archivos originales para procesar')
      }

      const formData = new FormData()
      filesToProcess.forEach(file => {
        formData.append('files', file)
      })
      formData.append('lang', 'spa') // Español por defecto

      console.log('Enviando petición OCR al servidor...', filesToProcess.length, 'archivo(s)')
      
      const response = await fetch('/api/process-ocr', {
        method: 'POST',
        body: formData
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        const text = await response.text()
        throw new Error('Error al procesar la respuesta del servidor')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar los archivos con OCR')
      }

      if (data.results && Array.isArray(data.results)) {
        // Guardar resultados OCR en el estado, indexados por nombre de archivo
        const newOcrResults = {}
        data.results.forEach(result => {
          if (result.fileName) {
            newOcrResults[result.fileName] = result
          }
        })
        setOcrResults(prev => ({ ...prev, ...newOcrResults }))
        
        const successful = data.results.filter(r => r.success).length
        const failed = data.results.filter(r => !r.success).length
        
        alert(`Procesamiento OCR completado:\n- Exitosos: ${successful}\n- Fallidos: ${failed}`)
        
        console.log('Resultados OCR:', data.results)
      }
    } catch (err) {
      console.error('Error al procesar OCR:', err)
      setError(err.message || 'Error desconocido al procesar OCR')
    } finally {
      setProcessing(false)
    }
  }

  // Función para obtener el texto OCR de un archivo
  const getOcrText = (fileName) => {
    const ocrResult = ocrResults[fileName]
    if (ocrResult && ocrResult.success && ocrResult.text) {
      return ocrResult.text
    }
    return null
  }

  // Función para extraer CUFE del texto OCR
  const extractCufeFromOcrText = (ocrText) => {
    if (!ocrText) return ''
    
    // Buscar "CUFE:" en el texto (case insensitive)
    const cufePattern = /CUFE\s*:?\s*/i
    const match = ocrText.match(cufePattern)
    
    if (!match) return ''
    
    // Obtener la posición después de "CUFE:"
    const startIndex = match.index + match[0].length
    
    // Extraer el texto restante desde esa posición
    const remainingText = ocrText.substring(startIndex)
    
    // Buscar el CUFE hasta encontrar un espacio en blanco
    // El CUFE puede contener caracteres alfanuméricos y algunos especiales, pero termina en el primer espacio
    const cufeMatch = remainingText.match(/^[\s]*([A-Za-z0-9+\/=_\-]+)/)
    
    if (cufeMatch) {
      // Retornar el CUFE sin espacios (ya que la regex no incluye espacios)
      return cufeMatch[1].trim()
    }
    
    // Si no se encuentra en la misma línea, buscar en la siguiente línea
    const lines = remainingText.split(/\n|\r/)
    if (lines.length > 1) {
      // Buscar en la siguiente línea
      const nextLine = lines[1].trim()
      if (nextLine.length > 0) {
        // Extraer el CUFE de la siguiente línea hasta el primer espacio
        const nextLineMatch = nextLine.match(/^([A-Za-z0-9+\/=_\-]+)/)
        if (nextLineMatch) {
          return nextLineMatch[1].trim()
        }
      }
    }
    
    return ''
  }

  // Función para normalizar valores numéricos: remover ".00" cuando es separador decimal
  const normalizeNumericValue = (value) => {
    if (!value || typeof value !== 'string') return value
    
    // Verificar si el valor tiene formato "XXXXX.00" (siempre 2 ceros después del punto)
    // Esto puede ser después de la normalización, donde el punto ya es separador decimal
    const decimalPattern = /^([0-9]+)\.00$/
    const match = value.match(decimalPattern)
    
    if (match) {
      // Si tiene formato "XXXXX.00", retornar solo "XXXXX" (sin decimales)
      // El punto representa el separador decimal y siempre hay 2 ceros después
      return match[1]
    }
    
    // También verificar si tiene formato "XXXXX.0" o solo punto con ceros
    const decimalPattern2 = /^([0-9]+)\.0+$/
    const match2 = value.match(decimalPattern2)
    if (match2) {
      // Si termina en .0, .00, .000, etc., retornar solo la parte entera
      return match2[1]
    }
    
    return value
  }

  // Función genérica para buscar valores usando patrones con estrategia de dos niveles
  const extractValueFromPatterns = (patterns, qrData, ocrText, valueType = 'text') => {
    if (!patterns || patterns.length === 0) {
      console.log(`[extractValueFromPatterns] No hay patrones para ${valueType}`)
      return ''
    }
    
    // Buscar primero en "Código QR Detectado" (qrData), luego en "TEXTOCR" (ocrText)
    const searchTexts = []
    if (qrData && qrData.trim()) {
      searchTexts.push(qrData)
    }
    if (ocrText && ocrText.trim()) {
      searchTexts.push(ocrText)
    }
    
    if (searchTexts.length === 0) {
      console.log(`[extractValueFromPatterns] No hay textos para buscar (${valueType})`)
      return ''
    }
    
    console.log(`[extractValueFromPatterns] Buscando ${valueType} con ${patterns.length} patrones`)
    
    // Recorrer cada patrón configurado
    for (const pattern of patterns) {
      const patternKey = valueType === 'invoice' ? 'patronFac' : 
                        valueType === 'nit' ? 'patronNIT' :
                        valueType === 'subtotal' ? 'patronSubTotal' :
                        valueType === 'iva' ? 'patronIVA' :
                        valueType === 'total' ? 'patronTotal' : ''
      
      if (!patternKey || !pattern[patternKey] || !pattern[patternKey].trim()) {
        console.log(`[extractValueFromPatterns] Patrón sin ${patternKey} para ${valueType}`)
        continue
      }
      
      const patternText = pattern[patternKey].trim()
      console.log(`[extractValueFromPatterns] Probando patrón: "${patternText}" para ${valueType}`)
      
      // Buscar en cada texto (QR primero, luego OCR)
      for (const text of searchTexts) {
        const lines = text.split(/\n|\r\n|\r/)
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Búsqueda case-insensitive más flexible
          const patternIndex = line.toLowerCase().indexOf(patternText.toLowerCase())
          
          if (patternIndex !== -1) {
            console.log(`[extractValueFromPatterns] Patrón encontrado en línea ${i}: "${line.substring(0, 100)}"`)
            // Prioridad 1 - Misma línea: Buscar el valor inmediatamente después del patrón
            const remainingInLine = line.substring(patternIndex + patternText.length)
            
            // Para números (SubTotal, IVA, Total), buscar valores numéricos con decimales
            if (valueType === 'subtotal' || valueType === 'iva' || valueType === 'total') {
              // Buscar números con formato: $123.456,78 o 123456.78 o 123,456.78 o 123456,78
              // Mejorar regex para capturar mejor los números
              const numberMatch = remainingInLine.match(/^\s*:?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?|[0-9]+)/)
              if (numberMatch && numberMatch[1]) {
                console.log(`[extractValueFromPatterns] Número encontrado en misma línea: "${numberMatch[1]}"`)
                // Normalizar número: detectar si usa punto o coma como separador de miles
                let number = numberMatch[1].trim()
                // Si tiene punto y coma, el punto es separador de miles y la coma decimal
                if (number.includes('.') && number.includes(',')) {
                  number = number.replace(/\./g, '').replace(',', '.')
                }
                // Si solo tiene coma y tiene más de 3 dígitos antes, probablemente es separador de miles
                else if (number.includes(',') && !number.includes('.')) {
                  const parts = number.split(',')
                  if (parts[0].length > 3) {
                    // Probablemente formato europeo: 1234,56
                    number = number.replace(',', '.')
                  } else if (parts.length === 2 && parts[1].length === 2) {
                    // Formato: 123,45 (decimales)
                    number = number.replace(',', '.')
                  }
                }
                // Si solo tiene punto, verificar si es separador de miles o decimal
                else if (number.includes('.') && !number.includes(',')) {
                  const parts = number.split('.')
                  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                    // Probablemente separador de miles: 123.456 o 1.234.567
                    number = number.replace(/\./g, '')
                  }
                  // Si no, ya está bien como decimal
                }
                // Normalizar: si termina en ".00", remover los decimales
                const normalizedNumber = normalizeNumericValue(number)
                return normalizedNumber
              }
            } else {
              // Para texto (Factura, NIT), buscar alfanuméricos - más flexible
              // Permitir espacios, dos puntos, guiones, etc.
              const textMatch = remainingInLine.match(/^\s*:?\s*([A-Za-z0-9\-\s]+?)(?:\s|$|[^\w\-])/)
              if (textMatch && textMatch[1]) {
                let value = textMatch[1].trim().replace(/\s+/g, '') // Eliminar espacios internos
                if (value) {
                  console.log(`[extractValueFromPatterns] Valor encontrado en misma línea: "${value}"`)
                  // Si hay prefijo configurado para factura, agregarlo
                  if (valueType === 'invoice' && pattern.prefijoFac && pattern.prefijoFac.trim()) {
                    value = `${pattern.prefijoFac.trim()}${value}`
                  }
                  return value
                }
              }
            }
            
            // Prioridad 2 - Línea siguiente: Buscar al inicio de la línea siguiente
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim()
              if (nextLine.length > 0) {
                if (valueType === 'subtotal' || valueType === 'iva' || valueType === 'total') {
                  const nextLineNumberMatch = nextLine.match(/^\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?|[0-9]+)/)
                  if (nextLineNumberMatch && nextLineNumberMatch[1]) {
                    console.log(`[extractValueFromPatterns] Número encontrado en línea siguiente: "${nextLineNumberMatch[1]}"`)
                    // Normalizar número: detectar si usa punto o coma como separador de miles
                    let number = nextLineNumberMatch[1].trim()
                    // Si tiene punto y coma, el punto es separador de miles y la coma decimal
                    if (number.includes('.') && number.includes(',')) {
                      number = number.replace(/\./g, '').replace(',', '.')
                    }
                    // Si solo tiene coma y tiene más de 3 dígitos antes, probablemente es separador de miles
                    else if (number.includes(',') && !number.includes('.')) {
                      const parts = number.split(',')
                      if (parts[0].length > 3) {
                        // Probablemente formato europeo: 1234,56
                        number = number.replace(',', '.')
                      } else if (parts.length === 2 && parts[1].length === 2) {
                        // Formato: 123,45 (decimales)
                        number = number.replace(',', '.')
                      }
                    }
                    // Si solo tiene punto, verificar si es separador de miles o decimal
                    else if (number.includes('.') && !number.includes(',')) {
                      const parts = number.split('.')
                      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                        // Probablemente separador de miles: 123.456 o 1.234.567
                        number = number.replace(/\./g, '')
                      }
                      // Si no, ya está bien como decimal
                    }
                    // Normalizar: si termina en ".00", remover los decimales
                    const normalizedNumber = normalizeNumericValue(number)
                    return normalizedNumber
                  }
                } else {
                  // Para texto, buscar alfanuméricos - más flexible
                  const nextLineTextMatch = nextLine.match(/^([A-Za-z0-9\-\s]+?)(?:\s|$|[^\w\-])/)
                  if (nextLineTextMatch && nextLineTextMatch[1]) {
                    let value = nextLineTextMatch[1].trim().replace(/\s+/g, '') // Eliminar espacios internos
                    if (value) {
                      console.log(`[extractValueFromPatterns] Valor encontrado en línea siguiente: "${value}"`)
                      if (valueType === 'invoice' && pattern.prefijoFac && pattern.prefijoFac.trim()) {
                        value = `${pattern.prefijoFac.trim()}${value}`
                      }
                      return value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`[extractValueFromPatterns] No se encontró valor para ${valueType} después de probar todos los patrones`)
    return ''
  }

  // Función para extraer número de factura del texto usando patrones configurados
  const extractInvoiceNumberFromPatterns = (qrData, ocrText) => {
    return extractValueFromPatterns(invoicePatterns, qrData, ocrText, 'invoice')
  }

  // Función para extraer NIT del texto usando patrones configurados
  const extractNITFromPatterns = (qrData, ocrText) => {
    return extractValueFromPatterns(nitPatterns, qrData, ocrText, 'nit')
  }

  // Función para extraer SubTotal del texto usando patrones configurados
  const extractSubTotalFromPatterns = (qrData, ocrText) => {
    return extractValueFromPatterns(subTotalPatterns, qrData, ocrText, 'subtotal')
  }

  // Función para extraer IVA del texto usando patrones configurados
  const extractIVAFromPatterns = (qrData, ocrText) => {
    return extractValueFromPatterns(ivaPatterns, qrData, ocrText, 'iva')
  }

  // Función para extraer Total del texto usando patrones configurados
  const extractTotalFromPatterns = (qrData, ocrText) => {
    return extractValueFromPatterns(totalPatterns, qrData, ocrText, 'total')
  }

  // Función para extraer Tipo de Transacción del texto usando patrones configurados
  // Retorna la TipoDescripcion cuando encuentra el patrón
  const extractTransactionTypeFromPatterns = (qrData, ocrText) => {
    if (!transactionTypePatterns || transactionTypePatterns.length === 0) {
      console.log(`[extractTransactionTypeFromPatterns] No hay patrones para tipo de transacción`)
      return ''
    }
    
    // Buscar primero en "Código QR Detectado" (qrData), luego en "TEXTOCR" (ocrText)
    const searchTexts = []
    if (qrData && qrData.trim()) {
      searchTexts.push(qrData)
    }
    if (ocrText && ocrText.trim()) {
      searchTexts.push(ocrText)
    }
    
    if (searchTexts.length === 0) {
      console.log(`[extractTransactionTypeFromPatterns] No hay textos para buscar`)
      return ''
    }
    
    console.log(`[extractTransactionTypeFromPatterns] Buscando tipo de transacción con ${transactionTypePatterns.length} patrones`)
    
    // Recorrer cada patrón configurado
    for (const pattern of transactionTypePatterns) {
      if (!pattern.patronTipo || !pattern.patronTipo.trim()) continue
      
      const patternText = pattern.patronTipo.trim()
      console.log(`[extractTransactionTypeFromPatterns] Probando patrón: "${patternText}"`)
      
      // Buscar en cada texto (QR primero, luego OCR)
      for (const text of searchTexts) {
        const lines = text.split(/\n|\r\n|\r/)
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const patternIndex = line.toLowerCase().indexOf(patternText.toLowerCase())
          
          if (patternIndex !== -1) {
            console.log(`[extractTransactionTypeFromPatterns] Patrón encontrado en línea ${i}: "${line.substring(0, 100)}"`)
            // Si encontramos el patrón, retornar la descripción
            if (pattern.tipoDescripcion && pattern.tipoDescripcion.trim()) {
              console.log(`[extractTransactionTypeFromPatterns] Retornando descripción: "${pattern.tipoDescripcion}"`)
              return pattern.tipoDescripcion.trim()
            }
            // Si no hay descripción, retornar el valor encontrado después del patrón
            const remainingInLine = line.substring(patternIndex + patternText.length)
            const textMatch = remainingInLine.match(/^\s*:?\s*([A-Za-z0-9\-\s]+?)(?:\s|$|[^\w\-])/)
            if (textMatch && textMatch[1]) {
              const value = textMatch[1].trim().replace(/\s+/g, ' ')
              if (value) {
                console.log(`[extractTransactionTypeFromPatterns] Retornando valor encontrado: "${value}"`)
                return value
              }
            }
          }
        }
      }
    }
    
    console.log(`[extractTransactionTypeFromPatterns] No se encontró tipo de transacción`)
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-md p-2 flex space-x-2">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Extraer Códigos QR
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'excel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Importar Excel
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visualizar Facturas
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'ocr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Procesamiento OCR
              {ocrProcessingRecords.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {ocrProcessingRecords.length}
                </span>
              )}
            </button>
          </div>

          {/* QR Extraction Tab */}
          {activeTab === 'qr' && (
            <>
              {/* Submenu Navigation */}
              <div className="bg-white rounded-lg shadow-md p-2 flex space-x-2">
                <button
                  onClick={() => setActiveQRSubmenu('extract')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeQRSubmenu === 'extract'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Selección y Extracción
                </button>
                <button
                  onClick={() => setActiveQRSubmenu('results')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeQRSubmenu === 'results'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tabla de Resultados
                  {successfulResults.length > 0 && (
                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {successfulResults.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveQRSubmenu('failed')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeQRSubmenu === 'failed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Archivos sin QR
                  {failedResults.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {failedResults.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveQRSubmenu('stats')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeQRSubmenu === 'stats'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Estadísticas
                </button>
              </div>

              {/* Submenu 1: Selección y Extracción */}
              {activeQRSubmenu === 'extract' && (
                <>
                  <div className="card">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Seleccionar Archivos de Facturas
                    </h2>
                    <FileUploader onFileUpload={handleFileUpload} />
                
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Archivos Seleccionados ({uploadedFiles.length})
                          </h3>
                          <button
                            onClick={handleProcessFiles}
                            disabled={processing}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing ? 'Procesando...' : 'Extraer Códigos QR'}
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <span className="text-primary-600 font-medium text-sm">
                                    {file.name.split('.').pop().toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{file.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Processing Status */}
                  {processing && <ProcessingStatus />}

                  {/* Error Display */}
                  {error && (
                    <div className="card border-red-200 bg-red-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-sm">!</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-red-900">Error</h3>
                          <p className="text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submenu 2: Tabla de Resultados */}
              {activeQRSubmenu === 'results' && (
                <QRResults 
                  results={successfulResults} 
                  onClear={handleClearResults}
                  showOnlyTable={true}
                />
              )}

              {/* Submenu 3: Archivos sin QR */}
              {activeQRSubmenu === 'failed' && (
                <QRResults 
                  results={failedResults} 
                  onClear={handleClearResults}
                  showFailedOnly={true}
                />
              )}

              {/* Submenu 4: Estadísticas de Procesamiento */}
              {activeQRSubmenu === 'stats' && (
                <StatsPanel refreshTrigger={statsRefreshTrigger} />
              )}
            </>
          )}

          {/* Excel Import Tab */}
          {activeTab === 'excel' && (
            <>
              <div className="card">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Importar Archivo Excel
                </h2>
                <ExcelImporter onImport={setExcelData} />
              </div>

              {/* Excel Data Viewer */}
              {excelData && <ExcelDataViewer excelData={excelData} />}
            </>
          )}

          {/* Invoice Viewer Tab */}
          {activeTab === 'invoices' && (
            <>
              {/* Submenu Navigation */}
              <div className="bg-white rounded-lg shadow-md p-2 flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveInvoiceSubmenu('found')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeInvoiceSubmenu === 'found'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Facturas Encontradas
                </button>
                <button
                  onClick={() => setActiveInvoiceSubmenu('notfound')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeInvoiceSubmenu === 'notfound'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Registros no encuentra CUFE
                  {notFoundRecords.length > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {notFoundRecords.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveInvoiceSubmenu('duplicates')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeInvoiceSubmenu === 'duplicates'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  CUFE Duplicados
                  {duplicateCufes.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {new Set(duplicateCufes.map(d => normalizeCufe(d.cufe))).size}
                    </span>
                  )}
                </button>
              </div>

              {/* Submenu 1: Facturas Encontradas */}
              {activeInvoiceSubmenu === 'found' && (
                <InvoiceViewer 
                  qrResults={results} 
                  excelData={excelData}
                  showSubmenu="found"
                />
              )}

              {/* Submenu 2: Registros no encuentra CUFE */}
              {activeInvoiceSubmenu === 'notfound' && (
                <InvoiceViewer 
                  qrResults={results} 
                  excelData={excelData}
                  showSubmenu="notfound"
                />
              )}

              {/* Submenu 3: CUFE Duplicados */}
              {activeInvoiceSubmenu === 'duplicates' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          CUFE Duplicados
                        </h2>
                        <p className="text-gray-600">
                          {duplicateCufes.length > 0 
                            ? `${new Set(duplicateCufes.map(d => normalizeCufe(d.cufe))).size} CUFE(s) duplicado(s) • ${duplicateCufes.length} registro(s)`
                            : 'No hay CUFE duplicados en la tabla "Tabla de Resultados"'
                          }
                        </p>
                      </div>
                    </div>
                    {duplicateCufes.length > 0 && (
                      <button
                        onClick={() => {
                          // Exportar a Excel
                          const excelData = duplicateCufes.map((record, index) => ({
                            '#': index + 1,
                            'Nombre del Archivo': record.fileName,
                            'CUFE': record.cufe,
                            'Número de veces que se repite': record.count
                          }))

                          const wb = XLSX.utils.book_new()
                          const ws = XLSX.utils.json_to_sheet(excelData)

                          const colWidths = [
                            { wch: 5 },   // #
                            { wch: 40 },  // Nombre del Archivo
                            { wch: 50 },  // CUFE
                            { wch: 25 }   // Número de veces que se repite
                          ]
                          ws['!cols'] = colWidths

                          XLSX.utils.book_append_sheet(wb, ws, 'CUFE Duplicados')

                          const date = new Date()
                          const dateStr = date.toISOString().split('T')[0]
                          const fileName = `CUFE_Duplicados_${dateStr}.xlsx`

                          XLSX.writeFile(wb, fileName)
                        }}
                        className="btn-secondary flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar a Excel</span>
                      </button>
                    )}
                  </div>

                  {duplicateCufes.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay CUFE duplicados
                      </h3>
                      <p className="text-gray-500">
                        Todos los CUFE en la tabla "Tabla de Resultados" son únicos
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px', minWidth: '60px' }}>
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '300px' }}>
                              Nombre del Archivo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '400px' }}>
                              CUFE
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                              Número de veces que se repite
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {duplicateCufes.map((record, index) => (
                            <tr key={index} className="hover:bg-red-50">
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                <div className="break-words" title={record.fileName} style={{ maxWidth: '300px' }}>
                                  {record.fileName}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                <code className="text-xs bg-red-50 px-2 py-1 rounded border border-red-200 break-all" style={{ maxWidth: '380px', wordBreak: 'break-word', display: 'block' }}>
                                  {record.cufe}
                                </code>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-red-700 text-center">
                                {record.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* OCR Processing Tab */}
          {activeTab === 'ocr' && (
            <>
              {/* Submenu Navigation */}
              <div className="bg-white rounded-lg shadow-md p-2 flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveOCRSubmenu('processing')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeOCRSubmenu === 'processing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Procesamiento OCR
                </button>
                <button
                  onClick={() => setActiveOCRSubmenu('final')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeOCRSubmenu === 'final'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resultado Final con OCR
                </button>
                <button
                  onClick={() => setActiveOCRSubmenu('patterns')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeOCRSubmenu === 'patterns'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Configuración de Patrones
                </button>
              </div>

              {/* Submenu 1: Procesamiento OCR */}
              {activeOCRSubmenu === 'processing' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Procesamiento OCR
                        </h2>
                        <p className="text-gray-600">
                          {ocrProcessingRecords.length} registro(s) que requieren procesamiento OCR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {ocrProcessingRecords.length > 0 && (
                        <button
                          onClick={() => {
                            const fileNames = ocrProcessingRecords.map(r => r.fileName)
                            handleProcessOCR(fileNames)
                          }}
                          disabled={processing}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {processing ? 'Procesando OCR...' : 'Procesar con OCR'}
                        </button>
                      )}
                      {ocrProcessingRecords.length > 0 && (
                        <button
                          onClick={exportProcessingOCRToExcel}
                          className="btn-secondary flex items-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Exportar a Excel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {ocrProcessingRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay registros para procesamiento OCR
                      </h3>
                      <p className="text-gray-500">
                        Los registros aparecerán aquí cuando haya archivos sin código QR o CUFE no encontrados en el Excel
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '4400px' }}>
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                                Error / Mensaje
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '300px' }}>
                                CUFEOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '500px' }}>
                                TEXTOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                                PrefijoOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                                FolioOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                Prefijo-FolioOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                NIT_EmisorOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '250px' }}>
                                Nombre_EmisorOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                IVAOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                INCOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                ICUIOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                TotalOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                NIT_EmisorOCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                Num_Factura_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                SubTotal_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                IVA_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                Total_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                Tipo_TransacciónOCR
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ocrProcessingRecords.map((record, index) => {
                              const ocrText = getOcrText(record.fileName)
                              const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
                              const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
                              const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'
                              
                              const formatNumber = (num) => {
                                if (!num) return '0.00'
                                const numValue = parseFloat(num)
                                if (isNaN(numValue)) return '0.00'
                                return new Intl.NumberFormat('es-CO', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                }).format(numValue)
                              }

                              // Si Prefijo-FolioOCR está vacío o es "-", buscar por patrones
                              let nitEmisorOCRTxt = ''
                              let numFacturaOCRTxt = ''
                              let subTotalOCRTxt = ''
                              let ivaOCRTxt = ''
                              let totalOCRTxt = ''
                              let tipoTransaccionOCRTxt = ''
                              
                              // Verificar si debe buscar por patrones
                              const shouldSearchByPatterns = !prefijoFolioOCR || 
                                                           prefijoFolioOCR === '-' || 
                                                           prefijoFolioOCR.trim() === '' ||
                                                           prefijoFolioOCR === 'undefined' ||
                                                           prefijoFolioOCR === 'null'
                              
                              console.log(`[Tabla] Prefijo-FolioOCR: "${prefijoFolioOCR}", shouldSearch: ${shouldSearchByPatterns}`)
                              console.log(`[Tabla] Patrones disponibles - Invoice: ${invoicePatterns.length}, NIT: ${nitPatterns.length}, SubTotal: ${subTotalPatterns.length}, IVA: ${ivaPatterns.length}, Total: ${totalPatterns.length}, TipoTransaccion: ${transactionTypePatterns.length}`)
                              
                              if (shouldSearchByPatterns) {
                                console.log(`[Tabla] Buscando valores por patrones para archivo: ${record.fileName}`)
                                nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
                                numFacturaOCRTxt = extractInvoiceNumberFromPatterns(record.qrData || '', ocrText || '')
                                subTotalOCRTxt = extractSubTotalFromPatterns(record.qrData || '', ocrText || '')
                                ivaOCRTxt = extractIVAFromPatterns(record.qrData || '', ocrText || '')
                                totalOCRTxt = extractTotalFromPatterns(record.qrData || '', ocrText || '')
                                tipoTransaccionOCRTxt = extractTransactionTypeFromPatterns(record.qrData || '', ocrText || '')
                                
                                console.log(`[Tabla] Resultados - NIT: "${nitEmisorOCRTxt}", Factura: "${numFacturaOCRTxt}", SubTotal: "${subTotalOCRTxt}", IVA: "${ivaOCRTxt}", Total: "${totalOCRTxt}", TipoTransaccion: "${tipoTransaccionOCRTxt}"`)
                              }

                              return (
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
                                    {record.qrData ? (
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all" style={{ maxWidth: '380px', wordBreak: 'break-word', display: 'block' }}>
                                        {record.qrData}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">No disponible</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-orange-700">
                                    {record.error}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {cufeOcr ? (
                                      <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 break-all" style={{ maxWidth: '280px', wordBreak: 'break-word', display: 'block' }}>
                                        {cufeOcr}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">No encontrado</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {ocrText ? (
                                      <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                                        <pre className="text-xs whitespace-pre-wrap break-words font-mono" style={{ maxWidth: '480px' }}>
                                          {ocrText}
                                        </pre>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">No procesado aún</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {excelRowData ? excelRowData.prefijo : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {excelRowData ? excelRowData.folio : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                    {excelRowData ? (excelRowData.prefijoFolio || '-') : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {excelRowData ? excelRowData.nitEmisor : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {excelRowData ? (
                                      <div className="max-w-xs truncate" title={excelRowData.nombreEmisor}>
                                        {excelRowData.nombreEmisor}
                                      </div>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? `$${formatNumber(excelRowData.iva)}` : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? `$${formatNumber(excelRowData.inc)}` : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? `$${formatNumber(excelRowData.icui)}` : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                                    {excelRowData ? `$${formatNumber(excelRowData.total)}` : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {nitEmisorOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        {nitEmisorOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {numFacturaOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        {numFacturaOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {subTotalOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        ${subTotalOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {ivaOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        ${ivaOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                                    {totalOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        ${totalOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {tipoTransaccionOCRTxt ? (
                                      <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200">
                                        {tipoTransaccionOCRTxt}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submenu 2: Resultado Final con OCR */}
              {activeOCRSubmenu === 'final' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Resultado Final con OCR
                        </h2>
                        <p className="text-gray-600">
                          {(() => {
                            // Contar registros que tienen NIT_EmisorOCR o NIT_EmisorOCR_Txt
                            const filteredCount = ocrProcessingRecords.filter(record => {
                              const ocrText = getOcrText(record.fileName)
                              const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
                              const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
                              const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'
                              
                              const shouldSearchByPatterns = !prefijoFolioOCR || 
                                                           prefijoFolioOCR === '-' || 
                                                           prefijoFolioOCR.trim() === '' ||
                                                           prefijoFolioOCR === 'undefined' ||
                                                           prefijoFolioOCR === 'null'
                              
                              let nitEmisorOCRTxt = ''
                              if (shouldSearchByPatterns) {
                                nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
                              }
                              
                              const nitEmisorOCR = excelRowData ? excelRowData.nitEmisor : ''
                              const hasNIT = (nitEmisorOCR && nitEmisorOCR.trim() !== '') || 
                                            (nitEmisorOCRTxt && nitEmisorOCRTxt.trim() !== '')
                              return hasNIT
                            }).length
                            return `${filteredCount} registro(s) con NIT encontrado`
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {ocrProcessingRecords.length > 0 && (
                        <button
                          onClick={exportOCRToExcel}
                          className="btn-secondary flex items-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Exportar a Excel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {ocrProcessingRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay registros para procesamiento OCR
                      </h3>
                      <p className="text-gray-500">
                        Los registros aparecerán aquí cuando haya archivos sin código QR o CUFE no encontrados en el Excel
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '3000px' }}>
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                                Error / Mensaje
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '300px' }}>
                                CUFE_OCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '500px' }}>
                                Texto OCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                Prefijo-FolioOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                NIT_EmisorOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '250px' }}>
                                Nombre_EmisorOCR
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                IVAOCR
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                INCOCR
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                ICUIOCR
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                TotalOCR
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                NIT_EmisorOCR_Txt
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                Num_Factura_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                                SubTotal_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                IVA_OCR_Txt
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                                Total_OCR_Txt
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ocrProcessingRecords
                              .map((record) => {
                                const ocrText = getOcrText(record.fileName)
                                const cufeOcr = ocrText ? extractCufeFromOcrText(ocrText) : ''
                                const excelRowData = cufeOcr ? findExcelDataByCufeOcr(cufeOcr) : null
                                const prefijoFolioOCR = excelRowData ? (excelRowData.prefijoFolio || '-') : '-'
                                
                                const formatNumber = (num) => {
                                  if (!num) return '0.00'
                                  const numValue = parseFloat(num)
                                  if (isNaN(numValue)) return '0.00'
                                  return new Intl.NumberFormat('es-CO', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(numValue)
                                }

                                // Si Prefijo-FolioOCR está vacío o es "-", buscar por patrones
                                let nitEmisorOCRTxt = ''
                                let numFacturaOCRTxt = ''
                                let subTotalOCRTxt = ''
                                let ivaOCRTxt = ''
                                let totalOCRTxt = ''
                                
                                const shouldSearchByPatterns = !prefijoFolioOCR || 
                                                             prefijoFolioOCR === '-' || 
                                                             prefijoFolioOCR.trim() === '' ||
                                                             prefijoFolioOCR === 'undefined' ||
                                                             prefijoFolioOCR === 'null'
                                
                                if (shouldSearchByPatterns) {
                                  nitEmisorOCRTxt = extractNITFromPatterns(record.qrData || '', ocrText || '')
                                  numFacturaOCRTxt = extractInvoiceNumberFromPatterns(record.qrData || '', ocrText || '')
                                  subTotalOCRTxt = extractSubTotalFromPatterns(record.qrData || '', ocrText || '')
                                  ivaOCRTxt = extractIVAFromPatterns(record.qrData || '', ocrText || '')
                                  totalOCRTxt = extractTotalFromPatterns(record.qrData || '', ocrText || '')
                                }

                                const nitEmisorOCR = excelRowData ? excelRowData.nitEmisor : ''
                                
                                // Filtrar: solo mostrar si NIT_EmisorOCR o NIT_EmisorOCR_Txt tienen valor
                                const hasNIT = (nitEmisorOCR && nitEmisorOCR.trim() !== '') || 
                                              (nitEmisorOCRTxt && nitEmisorOCRTxt.trim() !== '')
                                
                                return hasNIT ? { record, ocrText, cufeOcr, excelRowData, prefijoFolioOCR, formatNumber, nitEmisorOCRTxt, numFacturaOCRTxt, subTotalOCRTxt, ivaOCRTxt, totalOCRTxt, nitEmisorOCR } : null
                              })
                              .filter(item => item !== null)
                              .map((item, index) => {
                                const { record, ocrText, cufeOcr, excelRowData, prefijoFolioOCR, formatNumber, nitEmisorOCRTxt, numFacturaOCRTxt, subTotalOCRTxt, ivaOCRTxt, totalOCRTxt, nitEmisorOCR } = item
                                return (
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
                                    {record.qrData ? (
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all" style={{ maxWidth: '380px', wordBreak: 'break-word', display: 'block' }}>
                                        {record.qrData}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">No disponible</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-orange-700">
                                    {record.error}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {cufeOcr ? (
                                      <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 break-all" style={{ maxWidth: '280px', wordBreak: 'break-word', display: 'block' }}>
                                        {cufeOcr}
                                      </code>
                                    ) : (
                                      <span className="text-gray-400 italic">No encontrado</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {ocrText ? (
                                      <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                                        <pre className="text-xs whitespace-pre-wrap break-words font-mono" style={{ maxWidth: '480px' }}>
                                          {ocrText}
                                        </pre>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">No procesado aún</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {prefijoFolioOCR && prefijoFolioOCR !== '-' ? prefijoFolioOCR : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {nitEmisorOCR || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {excelRowData ? (excelRowData.nombreEmisor || '-') : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? formatNumber(excelRowData.iva) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? formatNumber(excelRowData.inc) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? formatNumber(excelRowData.icui) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {excelRowData ? formatNumber(excelRowData.total) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {nitEmisorOCRTxt || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {numFacturaOCRTxt || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {subTotalOCRTxt || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {ivaOCRTxt || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 text-right">
                                    {totalOCRTxt || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submenu 3: Configuración de Patrones */}
              {activeOCRSubmenu === 'patterns' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Configuración de Patrones
                        </h2>
                        <p className="text-gray-600">
                          Configura los patrones para extraer información del texto OCR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImportPatternsFromExcel(e.target.files[0])
                            e.target.value = '' // Reset input
                          }
                        }}
                        className="hidden"
                        id="import-patterns-input"
                      />
                      <label
                        htmlFor="import-patterns-input"
                        className="btn-secondary flex items-center space-x-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Importar desde Excel</span>
                      </label>
                      <button
                        onClick={exportPatternsToExcel}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar a Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Tabla de Patrones NIT */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para NIT
                        </h3>
                        <button
                          onClick={() => {
                            setNewPattern({ patronNIT: '' })
                            setEditingPatternId(null)
                            setShowAddForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón */}
                      {(editingPatternId !== null || showAddForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PatronNIT
                            </label>
                            <input
                              type="text"
                              value={editingPatternId !== null 
                                ? nitPatterns.find(p => p.id === editingPatternId)?.patronNIT || ''
                                : newPattern.patronNIT}
                              onChange={(e) => {
                                if (editingPatternId !== null) {
                                  setNitPatterns(patterns => 
                                    patterns.map(p => 
                                      p.id === editingPatternId 
                                        ? { ...p, patronNIT: e.target.value }
                                        : p
                                    )
                                  )
                                } else {
                                  setNewPattern({ ...newPattern, patronNIT: e.target.value })
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: NIT:, NIT, Número de Identificación"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingPatternId !== null) {
                                  setEditingPatternId(null)
                                } else {
                                  setNewPattern({ patronNIT: '' })
                                  setShowAddForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingPatternId !== null) {
                                  setEditingPatternId(null)
                                } else {
                                  if (newPattern.patronNIT && newPattern.patronNIT.trim()) {
                                    const newId = Date.now()
                                    setNitPatterns([...nitPatterns, { 
                                      id: newId, 
                                      patronNIT: newPattern.patronNIT.trim()
                                    }])
                                    setNewPattern({ patronNIT: '' })
                                    setShowAddForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingPatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronNIT
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {nitPatterns.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              nitPatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronNIT || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingPatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setNitPatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingPatternId === pattern.id) {
                                            setEditingPatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de Factura */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para Número de Factura
                        </h3>
                        <button
                          onClick={() => {
                            setNewInvoicePattern({ patronFac: '', prefijoFac: '' })
                            setEditingInvoicePatternId(null)
                            setShowAddInvoiceForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de factura */}
                      {(editingInvoicePatternId !== null || showAddInvoiceForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                PatronFac
                              </label>
                              <input
                                type="text"
                                value={editingInvoicePatternId !== null 
                                  ? invoicePatterns.find(p => p.id === editingInvoicePatternId)?.patronFac || ''
                                  : newInvoicePattern.patronFac}
                                onChange={(e) => {
                                  if (editingInvoicePatternId !== null) {
                                    setInvoicePatterns(patterns => 
                                      patterns.map(p => 
                                        p.id === editingInvoicePatternId 
                                          ? { ...p, patronFac: e.target.value }
                                          : p
                                      )
                                    )
                                  } else {
                                    setNewInvoicePattern({ ...newInvoicePattern, patronFac: e.target.value })
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Factura:, Fact, Número de Factura"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                PrefijoFac
                              </label>
                              <input
                                type="text"
                                value={editingInvoicePatternId !== null 
                                  ? invoicePatterns.find(p => p.id === editingInvoicePatternId)?.prefijoFac || ''
                                  : newInvoicePattern.prefijoFac}
                                onChange={(e) => {
                                  if (editingInvoicePatternId !== null) {
                                    setInvoicePatterns(patterns => 
                                      patterns.map(p => 
                                        p.id === editingInvoicePatternId 
                                          ? { ...p, prefijoFac: e.target.value }
                                          : p
                                      )
                                    )
                                  } else {
                                    setNewInvoicePattern({ ...newInvoicePattern, prefijoFac: e.target.value })
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: FAC, INV, FT"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingInvoicePatternId !== null) {
                                  setEditingInvoicePatternId(null)
                                } else {
                                  setNewInvoicePattern({ patronFac: '', prefijoFac: '' })
                                  setShowAddInvoiceForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingInvoicePatternId !== null) {
                                  setEditingInvoicePatternId(null)
                                } else {
                                  if (newInvoicePattern.patronFac && newInvoicePattern.patronFac.trim()) {
                                    const newId = Date.now()
                                    setInvoicePatterns([...invoicePatterns, { 
                                      id: newId, 
                                      patronFac: newInvoicePattern.patronFac.trim(),
                                      prefijoFac: newInvoicePattern.prefijoFac.trim()
                                    }])
                                    setNewInvoicePattern({ patronFac: '', prefijoFac: '' })
                                    setShowAddInvoiceForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingInvoicePatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de factura */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronFac
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PrefijoFac
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoicePatterns.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              invoicePatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronFac || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.prefijoFac || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingInvoicePatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setInvoicePatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingInvoicePatternId === pattern.id) {
                                            setEditingInvoicePatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de Sub Total */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para Sub Total
                        </h3>
                        <button
                          onClick={() => {
                            setNewSubTotalPattern({ patronSubTotal: '' })
                            setEditingSubTotalPatternId(null)
                            setShowAddSubTotalForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de Sub Total */}
                      {(editingSubTotalPatternId !== null || showAddSubTotalForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PatronSubTotal
                            </label>
                            <input
                              type="text"
                              value={editingSubTotalPatternId !== null 
                                ? subTotalPatterns.find(p => p.id === editingSubTotalPatternId)?.patronSubTotal || ''
                                : newSubTotalPattern.patronSubTotal}
                              onChange={(e) => {
                                if (editingSubTotalPatternId !== null) {
                                  setSubTotalPatterns(patterns => 
                                    patterns.map(p => 
                                      p.id === editingSubTotalPatternId 
                                        ? { ...p, patronSubTotal: e.target.value }
                                        : p
                                    )
                                  )
                                } else {
                                  setNewSubTotalPattern({ ...newSubTotalPattern, patronSubTotal: e.target.value })
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Sub Total:, SubTotal, Subtotal"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingSubTotalPatternId !== null) {
                                  setEditingSubTotalPatternId(null)
                                } else {
                                  setNewSubTotalPattern({ patronSubTotal: '' })
                                  setShowAddSubTotalForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingSubTotalPatternId !== null) {
                                  setEditingSubTotalPatternId(null)
                                } else {
                                  if (newSubTotalPattern.patronSubTotal && newSubTotalPattern.patronSubTotal.trim()) {
                                    const newId = Date.now()
                                    setSubTotalPatterns([...subTotalPatterns, { 
                                      id: newId, 
                                      patronSubTotal: newSubTotalPattern.patronSubTotal.trim()
                                    }])
                                    setNewSubTotalPattern({ patronSubTotal: '' })
                                    setShowAddSubTotalForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingSubTotalPatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de Sub Total */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronSubTotal
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {subTotalPatterns.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              subTotalPatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronSubTotal || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingSubTotalPatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSubTotalPatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingSubTotalPatternId === pattern.id) {
                                            setEditingSubTotalPatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de IVA */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para IVA
                        </h3>
                        <button
                          onClick={() => {
                            setNewIvaPattern({ patronIVA: '' })
                            setEditingIvaPatternId(null)
                            setShowAddIvaForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de IVA */}
                      {(editingIvaPatternId !== null || showAddIvaForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PatronIVA
                            </label>
                            <input
                              type="text"
                              value={editingIvaPatternId !== null 
                                ? ivaPatterns.find(p => p.id === editingIvaPatternId)?.patronIVA || ''
                                : newIvaPattern.patronIVA}
                              onChange={(e) => {
                                if (editingIvaPatternId !== null) {
                                  setIvaPatterns(patterns => 
                                    patterns.map(p => 
                                      p.id === editingIvaPatternId 
                                        ? { ...p, patronIVA: e.target.value }
                                        : p
                                    )
                                  )
                                } else {
                                  setNewIvaPattern({ ...newIvaPattern, patronIVA: e.target.value })
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: IVA:, IVA, Impuesto al Valor Agregado"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingIvaPatternId !== null) {
                                  setEditingIvaPatternId(null)
                                } else {
                                  setNewIvaPattern({ patronIVA: '' })
                                  setShowAddIvaForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingIvaPatternId !== null) {
                                  setEditingIvaPatternId(null)
                                } else {
                                  if (newIvaPattern.patronIVA && newIvaPattern.patronIVA.trim()) {
                                    const newId = Date.now()
                                    setIvaPatterns([...ivaPatterns, { 
                                      id: newId, 
                                      patronIVA: newIvaPattern.patronIVA.trim()
                                    }])
                                    setNewIvaPattern({ patronIVA: '' })
                                    setShowAddIvaForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingIvaPatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de IVA */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronIVA
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ivaPatterns.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              ivaPatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronIVA || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingIvaPatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setIvaPatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingIvaPatternId === pattern.id) {
                                            setEditingIvaPatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de Total */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para Total
                        </h3>
                        <button
                          onClick={() => {
                            setNewTotalPattern({ patronTotal: '' })
                            setEditingTotalPatternId(null)
                            setShowAddTotalForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de Total */}
                      {(editingTotalPatternId !== null || showAddTotalForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PatronTotal
                            </label>
                            <input
                              type="text"
                              value={editingTotalPatternId !== null 
                                ? totalPatterns.find(p => p.id === editingTotalPatternId)?.patronTotal || ''
                                : newTotalPattern.patronTotal}
                              onChange={(e) => {
                                if (editingTotalPatternId !== null) {
                                  setTotalPatterns(patterns => 
                                    patterns.map(p => 
                                      p.id === editingTotalPatternId 
                                        ? { ...p, patronTotal: e.target.value }
                                        : p
                                    )
                                  )
                                } else {
                                  setNewTotalPattern({ ...newTotalPattern, patronTotal: e.target.value })
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Total:, Total, Total a Pagar"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingTotalPatternId !== null) {
                                  setEditingTotalPatternId(null)
                                } else {
                                  setNewTotalPattern({ patronTotal: '' })
                                  setShowAddTotalForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingTotalPatternId !== null) {
                                  setEditingTotalPatternId(null)
                                } else {
                                  if (newTotalPattern.patronTotal && newTotalPattern.patronTotal.trim()) {
                                    const newId = Date.now()
                                    setTotalPatterns([...totalPatterns, { 
                                      id: newId, 
                                      patronTotal: newTotalPattern.patronTotal.trim()
                                    }])
                                    setNewTotalPattern({ patronTotal: '' })
                                    setShowAddTotalForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingTotalPatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de Total */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronTotal
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {totalPatterns.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              totalPatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronTotal || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingTotalPatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setTotalPatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingTotalPatternId === pattern.id) {
                                            setEditingTotalPatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de CUFE */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para CUFE
                        </h3>
                        <button
                          onClick={() => {
                            setNewCufePattern({ patronCUFE: '' })
                            setEditingCufePatternId(null)
                            setShowAddCufeForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de CUFE */}
                      {(editingCufePatternId !== null || showAddCufeForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PatronCUFE
                            </label>
                            <input
                              type="text"
                              value={editingCufePatternId !== null 
                                ? cufePatterns.find(p => p.id === editingCufePatternId)?.patronCUFE || ''
                                : newCufePattern.patronCUFE}
                              onChange={(e) => {
                                if (editingCufePatternId !== null) {
                                  setCufePatterns(patterns => 
                                    patterns.map(p => 
                                      p.id === editingCufePatternId 
                                        ? { ...p, patronCUFE: e.target.value }
                                        : p
                                    )
                                  )
                                } else {
                                  setNewCufePattern({ ...newCufePattern, patronCUFE: e.target.value })
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: CUFE:, CUFE, Código Único"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingCufePatternId !== null) {
                                  setEditingCufePatternId(null)
                                } else {
                                  setNewCufePattern({ patronCUFE: '' })
                                  setShowAddCufeForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingCufePatternId !== null) {
                                  setEditingCufePatternId(null)
                                } else {
                                  if (newCufePattern.patronCUFE && newCufePattern.patronCUFE.trim()) {
                                    const newId = Date.now()
                                    setCufePatterns([...cufePatterns, { 
                                      id: newId, 
                                      patronCUFE: newCufePattern.patronCUFE.trim()
                                    }])
                                    setNewCufePattern({ patronCUFE: '' })
                                    setShowAddCufeForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingCufePatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de CUFE */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronCUFE
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cufePatterns.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              cufePatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronCUFE || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingCufePatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCufePatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingCufePatternId === pattern.id) {
                                            setEditingCufePatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla de Patrones de Tipo de Transacción */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patrones de Búsqueda para Tipo de Transacción
                        </h3>
                        <button
                          onClick={() => {
                            setNewTransactionTypePattern({ patronTipo: '', tipoDescripcion: '' })
                            setEditingTransactionTypePatternId(null)
                            setShowAddTransactionTypeForm(true)
                          }}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Patrón</span>
                        </button>
                      </div>

                      {/* Formulario para agregar/editar patrón de tipo de transacción */}
                      {(editingTransactionTypePatternId !== null || showAddTransactionTypeForm) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                PatronTipo
                              </label>
                              <input
                                type="text"
                                value={editingTransactionTypePatternId !== null 
                                  ? transactionTypePatterns.find(p => p.id === editingTransactionTypePatternId)?.patronTipo || ''
                                  : newTransactionTypePattern.patronTipo}
                                onChange={(e) => {
                                  if (editingTransactionTypePatternId !== null) {
                                    setTransactionTypePatterns(patterns => 
                                      patterns.map(p => 
                                        p.id === editingTransactionTypePatternId 
                                          ? { ...p, patronTipo: e.target.value }
                                          : p
                                      )
                                    )
                                  } else {
                                    setNewTransactionTypePattern({ ...newTransactionTypePattern, patronTipo: e.target.value })
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Tipo:, Tipo de Transacción, Transacción"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                TipoDescripcion
                              </label>
                              <input
                                type="text"
                                value={editingTransactionTypePatternId !== null 
                                  ? transactionTypePatterns.find(p => p.id === editingTransactionTypePatternId)?.tipoDescripcion || ''
                                  : newTransactionTypePattern.tipoDescripcion}
                                onChange={(e) => {
                                  if (editingTransactionTypePatternId !== null) {
                                    setTransactionTypePatterns(patterns => 
                                      patterns.map(p => 
                                        p.id === editingTransactionTypePatternId 
                                          ? { ...p, tipoDescripcion: e.target.value }
                                          : p
                                      )
                                    )
                                  } else {
                                    setNewTransactionTypePattern({ ...newTransactionTypePattern, tipoDescripcion: e.target.value })
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Venta, Compra, Devolución"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                if (editingTransactionTypePatternId !== null) {
                                  setEditingTransactionTypePatternId(null)
                                } else {
                                  setNewTransactionTypePattern({ patronTipo: '', tipoDescripcion: '' })
                                  setShowAddTransactionTypeForm(false)
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (editingTransactionTypePatternId !== null) {
                                  setEditingTransactionTypePatternId(null)
                                } else {
                                  if (newTransactionTypePattern.patronTipo && newTransactionTypePattern.patronTipo.trim()) {
                                    const newId = Date.now()
                                    setTransactionTypePatterns([...transactionTypePatterns, { 
                                      id: newId, 
                                      patronTipo: newTransactionTypePattern.patronTipo.trim(),
                                      tipoDescripcion: newTransactionTypePattern.tipoDescripcion.trim() || ''
                                    }])
                                    setNewTransactionTypePattern({ patronTipo: '', tipoDescripcion: '' })
                                    setShowAddTransactionTypeForm(false)
                                  }
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              {editingTransactionTypePatternId !== null ? 'Guardar' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de patrones de tipo de transacción */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                PatronTipo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                TipoDescripcion
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transactionTypePatterns.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                  No hay patrones configurados. Haz clic en "Agregar Patrón" para comenzar.
                                </td>
                              </tr>
                            ) : (
                              transactionTypePatterns.map((pattern, index) => (
                                <tr key={pattern.id} className="hover:bg-purple-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.patronTipo || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {pattern.tipoDescripcion || '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setEditingTransactionTypePatternId(pattern.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setTransactionTypePatterns(patterns => patterns.filter(p => p.id !== pattern.id))
                                          if (editingTransactionTypePatternId === pattern.id) {
                                            setEditingTransactionTypePatternId(null)
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

