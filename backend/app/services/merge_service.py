import logging
import os
from pathlib import Path
from PyPDF2 import PdfMerger

logger = logging.getLogger(__name__)

def merge_pdfs(pdf_paths: list[str], output_path: str) -> str:
    """
    Merges multiple PDF files into a single PDF.
    pdf_paths: List of absolute file paths to the PDFs.
    output_path: Absolute file path to save the merged PDF.
    Returns the output path if successful.
    """
    merger = PdfMerger()
    try:
        for path in pdf_paths:
            if os.path.exists(path):
                merger.append(path)
            else:
                logger.warning("PDF file not found for merging: %s", path)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        merger.write(output_path)
        logger.info("Successfully merged PDFs into %s", output_path)
        return output_path
    except Exception as e:
        logger.exception("Failed to merge PDFs")
        raise e
    finally:
        merger.close()
