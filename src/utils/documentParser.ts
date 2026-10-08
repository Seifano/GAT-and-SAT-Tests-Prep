import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
try {
  if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch {
  // worker fallback
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true
    } as any);
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      fullText += pageItems.join(' ') + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.warn('PDF.js parsing failed, attempting binary text extraction fallback:', error);
    return fallbackExtractTextFromBinary(arrayBuffer);
  }
}

/**
 * Extracts plain text from Word (.docx / .doc) documents using Mammoth
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value && result.value.trim().length > 0) {
      return result.value;
    }
  } catch (error) {
    console.warn('Mammoth extraction failed, trying binary text fallback:', error);
  }
  return fallbackExtractTextFromBinary(arrayBuffer);
}

/**
 * Fallback extractor for extracting printable strings from binary buffers
 */
export function fallbackExtractTextFromBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let text = '';
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII or newline / carriage return
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      currentWord += String.fromCharCode(byte);
    } else {
      if (currentWord.length >= 3) {
        text += currentWord + ' ';
      }
      currentWord = '';
    }
  }
  if (currentWord.length >= 3) {
    text += currentWord;
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Unified file to text extractor supporting .txt, .docx, .doc, and .pdf
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return await extractTextFromDocx(file);
  } else {
    // Standard text files (.txt, .csv, .json, etc.)
    return await file.text();
  }
}
