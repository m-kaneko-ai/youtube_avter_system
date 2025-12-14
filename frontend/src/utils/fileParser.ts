/**
 * ファイルパーサー
 * PDF/TXTファイルからテキストを抽出
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js worker設定（Vite対応）
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * PDFファイルからテキストを抽出
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDFの解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * TXTファイルからテキストを抽出
 */
export const extractTextFromTXT = async (file: File): Promise<string> => {
  return await file.text();
};

/**
 * ファイルタイプに応じてテキストを抽出
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.name.toLowerCase();

  if (fileType.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileType.endsWith('.txt') || fileType.endsWith('.md')) {
    return extractTextFromTXT(file);
  } else {
    throw new Error(`未対応のファイル形式: ${file.name}`);
  }
};

/**
 * ファイルサイズをフォーマット
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
