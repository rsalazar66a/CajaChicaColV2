"""
Utilidades para el procesamiento de códigos QR y facturas
"""

import re
import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QRProcessor:
    """Procesador de códigos QR con múltiples algoritmos mejorados"""
    
    def __init__(self):
        self.detection_methods = [
            self._detect_with_pyzbar,
            self._detect_with_opencv,
            self._detect_with_preprocessing,
            self._detect_with_rotation,
            self._detect_with_scaling,
            self._detect_with_regions
        ]
    
    def detect_qr_codes(self, image: np.ndarray) -> List[str]:
        """
        Detecta códigos QR en una imagen usando múltiples métodos mejorados
        
        Args:
            image: Imagen como array de numpy
            
        Returns:
            Lista de códigos QR detectados
        """
        qr_codes = []
        found_codes = set()  # Para evitar duplicados
        
        # Intentar con cada método
        for method in self.detection_methods:
            try:
                detected = method(image)
                if detected:
                    for code in detected:
                        if code and code not in found_codes:
                            found_codes.add(code)
                            qr_codes.append(code)
                    # Si encontramos códigos con métodos básicos, continuar con métodos avanzados
                    # para encontrar más códigos
            except Exception as e:
                logger.warning(f"Error en método de detección {method.__name__}: {e}")
                continue
        
        return qr_codes
    
    def _detect_with_pyzbar(self, image: np.ndarray) -> List[str]:
        """Detección usando Pyzbar con múltiples variantes"""
        from pyzbar import pyzbar
        
        results = []
        
        # Probar con diferentes formatos
        variants = []
        
        # 1. Escala de grises estándar
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            variants.append(('gray', gray))
        else:
            variants.append(('gray', image))
        
        # 2. RGB (para algunos casos)
        if len(image.shape) == 3:
            variants.append(('rgb', image))
        
        # 3. Invertido (para códigos QR blancos sobre fondo oscuro)
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        inverted = cv2.bitwise_not(gray)
        variants.append(('inverted', inverted))
        
        # Intentar decodificar con cada variante
        for variant_name, variant_img in variants:
            try:
                qr_codes = pyzbar.decode(variant_img)
                for qr in qr_codes:
                    try:
                        decoded = qr.data.decode('utf-8')
                        if decoded:
                            results.append(decoded)
                    except UnicodeDecodeError:
                        # Intentar con diferentes codificaciones
                        try:
                            decoded = qr.data.decode('latin-1')
                            if decoded:
                                results.append(decoded)
                        except:
                            continue
            except Exception as e:
                logger.debug(f"Error en variante {variant_name}: {e}")
                continue
        
        return results
    
    def _detect_with_opencv(self, image: np.ndarray) -> List[str]:
        """Detección usando OpenCV QRCodeDetector"""
        try:
            detector = cv2.QRCodeDetector()
            retval, decoded_info, points, straight_qrcode = detector.detectAndDecode(image)
            
            if retval and decoded_info:
                return [info for info in decoded_info if info]
        except Exception as e:
            logger.warning(f"Error en detección OpenCV: {e}")
        
        return []
    
    def _detect_with_preprocessing(self, image: np.ndarray) -> List[str]:
        """Detección con preprocesamiento avanzado de imagen"""
        from pyzbar import pyzbar
        
        results = []
        
        # Convertir a escala de grises base
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Aplicar diferentes preprocesamientos
        preprocessed_images = [
            ('original', gray),
            ('gaussian_blur_3', cv2.GaussianBlur(gray, (3, 3), 0)),
            ('gaussian_blur_5', cv2.GaussianBlur(gray, (5, 5), 0)),
            ('median_blur_3', cv2.medianBlur(gray, 3)),
            ('median_blur_5', cv2.medianBlur(gray, 5)),
            ('bilateral_9', cv2.bilateralFilter(gray, 9, 75, 75)),
            ('bilateral_15', cv2.bilateralFilter(gray, 15, 80, 80)),
            ('enhanced_contrast', self._enhance_contrast(image)),
            ('adaptive_threshold', self._adaptive_threshold(image)),
            ('morphology_open', cv2.morphologyEx(gray, cv2.MORPH_OPEN, np.ones((3,3), np.uint8))),
            ('morphology_close', cv2.morphologyEx(gray, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))),
            ('equalized', cv2.equalizeHist(gray)),
            ('inverted', cv2.bitwise_not(gray)),
        ]
        
        for method_name, processed_img in preprocessed_images:
            try:
                qr_codes = pyzbar.decode(processed_img)
                for qr in qr_codes:
                    try:
                        decoded = qr.data.decode('utf-8')
                        if decoded:
                            results.append(decoded)
                    except:
                        continue
            except Exception as e:
                logger.debug(f"Error en preprocesamiento {method_name}: {e}")
                continue
        
        return results
    
    def _detect_with_rotation(self, image: np.ndarray) -> List[str]:
        """Detección probando diferentes rotaciones"""
        from pyzbar import pyzbar
        
        results = []
        
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Probar rotaciones: 90°, 180°, 270°
        rotations = [90, 180, 270]
        h, w = gray.shape
        
        for angle in rotations:
            try:
                # Calcular matriz de rotación
                center = (w // 2, h // 2)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                
                # Rotar imagen
                rotated = cv2.warpAffine(gray, matrix, (w, h), flags=cv2.INTER_LINEAR, 
                                       borderMode=cv2.BORDER_REPLICATE)
                
                # Intentar detectar
                qr_codes = pyzbar.decode(rotated)
                for qr in qr_codes:
                    try:
                        decoded = qr.data.decode('utf-8')
                        if decoded:
                            results.append(decoded)
                    except:
                        continue
            except Exception as e:
                logger.debug(f"Error en rotación {angle}°: {e}")
                continue
        
        return results
    
    def _detect_with_scaling(self, image: np.ndarray) -> List[str]:
        """Detección probando diferentes escalas"""
        from pyzbar import pyzbar
        
        results = []
        
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        h, w = gray.shape
        
        # Probar diferentes escalas (más pequeño y más grande)
        scales = [0.5, 0.75, 1.25, 1.5, 2.0]
        
        for scale in scales:
            try:
                new_w = int(w * scale)
                new_h = int(h * scale)
                
                # Evitar escalas demasiado pequeñas o grandes
                if new_w < 50 or new_h < 50 or new_w > 5000 or new_h > 5000:
                    continue
                
                # Redimensionar
                scaled = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
                
                # Intentar detectar
                qr_codes = pyzbar.decode(scaled)
                for qr in qr_codes:
                    try:
                        decoded = qr.data.decode('utf-8')
                        if decoded:
                            results.append(decoded)
                    except:
                        continue
            except Exception as e:
                logger.debug(f"Error en escala {scale}: {e}")
                continue
        
        return results
    
    def _detect_with_regions(self, image: np.ndarray) -> List[str]:
        """Detección dividiendo la imagen en regiones (útil para imágenes grandes)"""
        from pyzbar import pyzbar
        
        results = []
        
        # Convertir a escala de grises
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        h, w = gray.shape
        
        # Solo dividir si la imagen es suficientemente grande
        if h < 1000 and w < 1000:
            return []
        
        # Dividir en 4 regiones (2x2)
        regions = [
            gray[0:h//2, 0:w//2],           # Superior izquierda
            gray[0:h//2, w//2:w],            # Superior derecha
            gray[h//2:h, 0:w//2],            # Inferior izquierda
            gray[h//2:h, w//2:w],            # Inferior derecha
        ]
        
        for i, region in enumerate(regions):
            try:
                qr_codes = pyzbar.decode(region)
                for qr in qr_codes:
                    try:
                        decoded = qr.data.decode('utf-8')
                        if decoded:
                            results.append(decoded)
                    except:
                        continue
            except Exception as e:
                logger.debug(f"Error en región {i}: {e}")
                continue
        
        return results
    
    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Mejora el contraste de la imagen"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Aplicar CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(gray)
    
    def _adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """Aplica umbralización adaptativa"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )

class CUFEExtractor:
    """Extractor de claves CUFE de códigos QR"""
    
    def __init__(self):
        self.patterns = [
            r'CUFE[:\s]*([A-Za-z0-9+/=]+)',
            r'Clave[:\s]*([A-Za-z0-9+/=]+)',
            r'Código[:\s]*([A-Za-z0-9+/=]+)',
            r'Código\s+de\s+Acceso[:\s]*([A-Za-z0-9+/=]+)',
            r'Código\s+Único\s+de\s+Facturación\s+Electrónica[:\s]*([A-Za-z0-9+/=]+)',
            r'([A-Za-z0-9+/=]{40,})'  # Secuencia larga alfanumérica
        ]
    
    def extract_cufe(self, qr_data: str) -> Optional[str]:
        """
        Extrae la clave CUFE del código QR
        
        Args:
            qr_data: Datos del código QR
            
        Returns:
            Clave CUFE extraída o None si no se encuentra
        """
        if not qr_data:
            return None
        
        # Buscar con cada patrón
        for pattern in self.patterns:
            match = re.search(pattern, qr_data, re.IGNORECASE | re.MULTILINE)
            if match:
                cufe = match.group(1).strip()
                if self._is_valid_cufe(cufe):
                    return cufe
        
        # Si no se encuentra patrón específico, retornar todo el QR
        return qr_data if len(qr_data) > 20 else None
    
    def _is_valid_cufe(self, cufe: str) -> bool:
        """
        Valida si una cadena parece ser una clave CUFE válida
        
        Args:
            cufe: Cadena a validar
            
        Returns:
            True si parece ser una clave CUFE válida
        """
        if not cufe or len(cufe) < 20:
            return False
        
        # Verificar que contenga caracteres alfanuméricos y algunos especiales
        if not re.match(r'^[A-Za-z0-9+/=]+$', cufe):
            return False
        
        # Verificar que no sea solo números o solo letras
        has_letters = bool(re.search(r'[A-Za-z]', cufe))
        has_numbers = bool(re.search(r'[0-9]', cufe))
        
        return has_letters and has_numbers

class InvoiceAnalyzer:
    """Analizador de información de facturas"""
    
    def __init__(self):
        self.cufe_extractor = CUFEExtractor()
    
    def analyze_qr_data(self, qr_data: str) -> Dict[str, Any]:
        """
        Analiza los datos del código QR y extrae información relevante
        
        Args:
            qr_data: Datos del código QR
            
        Returns:
            Diccionario con información extraída
        """
        analysis = {
            'cufe': None,
            'has_cufe': False,
            'qr_length': len(qr_data),
            'contains_numbers': bool(re.search(r'\d', qr_data)),
            'contains_letters': bool(re.search(r'[A-Za-z]', qr_data)),
            'contains_special_chars': bool(re.search(r'[+/=]', qr_data)),
            'possible_invoice_data': False
        }
        
        # Extraer CUFE
        cufe = self.cufe_extractor.extract_cufe(qr_data)
        if cufe:
            analysis['cufe'] = cufe
            analysis['has_cufe'] = True
        
        # Detectar si parece ser datos de factura
        invoice_indicators = [
            'factura', 'invoice', 'facturación', 'billing',
            'cufe', 'clave', 'código', 'access', 'acceso'
        ]
        
        qr_lower = qr_data.lower()
        analysis['possible_invoice_data'] = any(
            indicator in qr_lower for indicator in invoice_indicators
        )
        
        return analysis

def validate_file_type(filename: str, content_type: str) -> bool:
    """
    Valida si un archivo es del tipo permitido
    
    Args:
        filename: Nombre del archivo
        content_type: Tipo MIME del archivo (puede estar vacío)
        
    Returns:
        True si el archivo es válido
    """
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.pdf', '.heic', '.heif'}
    allowed_types = {
        'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 
        'image/tiff', 'image/tif', 'application/pdf', 
        'image/heic', 'image/heif'
    }
    
    # Verificar extensión (principal)
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        return False
    
    # Verificar tipo MIME solo si está presente
    # Si content_type está vacío, confiamos en la extensión
    if content_type and content_type not in allowed_types:
        return False
    
    return True

def format_file_size(size_bytes: int) -> str:
    """
    Formatea el tamaño de archivo en formato legible
    
    Args:
        size_bytes: Tamaño en bytes
        
    Returns:
        Tamaño formateado (ej: "1.5 MB")
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

