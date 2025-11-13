import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, XCircle, FileText, Clock, TrendingUp, Trash2 } from 'lucide-react';

const StatsPanel = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (!window.confirm('¿Estás seguro de que deseas borrar todas las estadísticas? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch('/api/stats', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Resetear estadísticas localmente
          setStats(null);
          // Recargar después de un breve delay
          setTimeout(() => {
            fetchStats();
          }, 500);
        }
      } else {
        alert('Error al borrar las estadísticas');
      }
    } catch (error) {
      console.error('Error clearing stats:', error);
      alert('Error al borrar las estadísticas');
    }
  };

  useEffect(() => {
    fetchStats();
    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar cuando cambie el trigger (después de procesar archivos)
  useEffect(() => {
    if (refreshTrigger) {
      fetchStats();
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.overview.total_processed === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Estadísticas de Procesamiento
        </h3>
        <p className="text-gray-500">Procesa algunos archivos para ver las estadísticas aquí</p>
      </div>
    );
  }

  const { overview, by_file_type, by_method, common_errors, performance } = stats;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Estadísticas de Procesamiento
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Actualizar
          </button>
          <button
            onClick={handleClearStats}
            className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Estadísticas</span>
          </button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Códigos QR Detectados</p>
              <p className="text-2xl font-bold text-green-900">{overview.successful_detections}</p>
              <p className="text-xs text-green-600">{overview.success_rate}% de éxito</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Errores de Procesamiento</p>
              <p className="text-2xl font-bold text-red-900">{overview.failed_detections}</p>
              <p className="text-xs text-red-600">{overview.failure_rate}% de fallos</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total Procesados</p>
              <p className="text-2xl font-bold text-blue-900">{overview.total_processed}</p>
              <p className="text-xs text-blue-600">archivos analizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas por Tipo de Archivo */}
      {by_file_type && Object.keys(by_file_type).length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-600" />
            Por Tipo de Archivo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(by_file_type).map(([fileType, data]) => (
              <div key={fileType} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {fileType.split('/')[1]?.toUpperCase() || fileType.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{data.total} archivos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">✓ {data.success}</span>
                  <span className="text-red-600">✗ {data.failed}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${data.success_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{data.success_rate.toFixed(1)}% éxito</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métodos Más Exitosos - Solo mostrar si hay datos */}
      {by_method && Object.keys(by_method).length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
            Métodos Más Exitosos
          </h4>
          <div className="space-y-2">
            {Object.entries(by_method).map(([method, count]) => (
              <div key={method} className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-700">{method}</span>
                <span className="text-sm text-blue-600 font-semibold">{count} éxitos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errores Más Comunes - Solo mostrar si hay datos */}
      {common_errors && Object.keys(common_errors).length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <XCircle className="w-4 h-4 mr-2 text-gray-600" />
            Errores Más Comunes
          </h4>
          <div className="space-y-2">
            {Object.entries(common_errors).map(([error, count]) => (
              <div key={error} className="flex justify-between items-center bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-sm text-red-700">{error}</span>
                <span className="text-sm text-red-600 font-semibold">{count} veces</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendimiento */}
      {performance && performance.avg_processing_time > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-600" />
            Rendimiento
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">Tiempo Promedio</p>
              <p className="text-lg font-bold text-gray-900">{performance.avg_processing_time.toFixed(3)}s</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">Tiempo Mínimo</p>
              <p className="text-lg font-bold text-gray-900">{performance.min_processing_time.toFixed(3)}s</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">Tiempo Máximo</p>
              <p className="text-lg font-bold text-gray-900">{performance.max_processing_time.toFixed(3)}s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
