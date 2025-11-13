"""
Módulo para procesamiento OCR de imágenes y PDFs
"""
import os
import cv2
import numpy as np
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import tempfile
import time

class OCRProcessor:
    """Procesador OCR para extraer texto de imágenes y PDFs"""
    
    def __init__(self):
        # Configurar ruta de Tesseract manualmente (descomentar y ajustar si es necesario)
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    def extract_text_from_image(self, image_path, lang='spa'):
        """
        Extrae texto de una imagen usando OCR
        
        Args:
            image_path: Ruta al archivo de imagen
            lang: Idioma para OCR (spa=español, eng=inglés)
        
        Returns:
            dict con el texto extraído y metadatos
        """
        try:
            # Leer imagen
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': 'No se pudo cargar la imagen'
                }
            
            # Convertir a escala de grises
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Extraer texto usando OCR básico
            text = pytesseract.image_to_string(gray, lang=lang)
            
            return {
                'success': True,
                'text': text.strip(),
                'word_count': len([w for w in text.split() if w.strip()]),
                'char_count': len(text.strip())
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al procesar imagen: {str(e)}'
            }
    
    def extract_text_from_pdf(self, pdf_path, lang='spa'):
        """
        Extrae texto de un PDF usando OCR
        
        Args:
            pdf_path: Ruta al archivo PDF
            lang: Idioma para OCR
        
        Returns:
            dict con el texto extraído de todas las páginas
        """
        try:
            # Convertir PDF a imágenes
            images = convert_from_path(pdf_path, dpi=300)
            
            if not images:
                return {
                    'success': False,
                    'error': 'No se pudieron convertir las páginas del PDF'
                }
            
            all_text = []
            
            # Procesar cada página
            for page_num, pil_image in enumerate(images):
                # Convertir PIL Image a escala de grises
                gray = pil_image.convert('L')
                
                # Extraer texto usando OCR básico
                page_text = pytesseract.image_to_string(gray, lang=lang)
                
                all_text.append({
                    'page': page_num + 1,
                    'text': page_text.strip()
                })
            
            # Combinar texto de todas las páginas
            combined_text = '\n\n'.join([item['text'] for item in all_text])
            
            return {
                'success': True,
                'text': combined_text,
                'pages': all_text,
                'total_pages': len(images),
                'word_count': len(combined_text.split()),
                'char_count': len(combined_text)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al procesar PDF: {str(e)}'
            }
    
    def process_file(self, file_path, file_type, lang='spa'):
        """
        Procesa un archivo (imagen o PDF) y extrae texto usando OCR
        
        Args:
            file_path: Ruta al archivo
            file_type: Tipo MIME del archivo
            lang: Idioma para OCR
        
        Returns:
            dict con resultados del OCR
        """
        start_time = time.time()
        
        # Determinar tipo de archivo
        if file_type in ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/tif']:
            result = self.extract_text_from_image(file_path, lang)
        elif file_type == 'application/pdf':
            result = self.extract_text_from_pdf(file_path, lang)
        else:
            result = {
                'success': False,
                'error': f'Tipo de archivo no soportado para OCR: {file_type}'
            }
        
        result['processing_time'] = round(time.time() - start_time, 3)
        result['file_type'] = file_type
        
        return result

# Instancia global del procesador
ocr_processor = OCRProcessor()
