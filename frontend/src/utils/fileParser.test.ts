import { describe, it, expect, vi } from 'vitest';

// PDF.jsのインポートを回避するため、個別の関数のみをモックしてインポート
vi.mock('./fileParser', async () => {
  const actual = await vi.importActual<typeof import('./fileParser')>('./fileParser');
  return {
    ...actual,
    // PDF.jsに依存する関数はモックでスキップ
    extractTextFromPDF: vi.fn(),
  };
});

import {
  extractTextFromTXT,
  extractTextFromFile,
  formatFileSize,
} from './fileParser';

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 2)).toBe('2.0 MB');
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  it('should handle zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should round to one decimal place', () => {
    expect(formatFileSize(1234)).toBe('1.2 KB');
    expect(formatFileSize(1024 * 1024 * 1.234)).toBe('1.2 MB');
  });
});

describe('extractTextFromTXT', () => {
  it('should extract text from text file', async () => {
    const content = 'Hello, World!';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    const result = await extractTextFromTXT(file);

    expect(result).toBe(content);
  });

  it('should handle empty text file', async () => {
    const file = new File([''], 'empty.txt', { type: 'text/plain' });

    const result = await extractTextFromTXT(file);

    expect(result).toBe('');
  });

  it('should handle multi-line text', async () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const file = new File([content], 'multiline.txt', { type: 'text/plain' });

    const result = await extractTextFromTXT(file);

    expect(result).toBe(content);
  });

  it('should handle unicode characters', async () => {
    const content = 'こんにちは世界 🌍';
    const file = new File([content], 'unicode.txt', { type: 'text/plain' });

    const result = await extractTextFromTXT(file);

    expect(result).toBe(content);
  });
});

describe('extractTextFromFile', () => {
  it('should handle .txt files', async () => {
    const content = 'Text content';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    const result = await extractTextFromFile(file);

    expect(result).toBe(content);
  });

  it('should handle .md files', async () => {
    const content = '# Markdown Title\n\nContent here.';
    const file = new File([content], 'test.md', { type: 'text/markdown' });

    const result = await extractTextFromFile(file);

    expect(result).toBe(content);
  });

  it('should reject unsupported file types', async () => {
    const file = new File(['content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(extractTextFromFile(file)).rejects.toThrow('未対応のファイル形式');
  });

  it('should handle case-insensitive file extensions', async () => {
    const content = 'Content';
    const file = new File([content], 'test.TXT', { type: 'text/plain' });

    const result = await extractTextFromFile(file);

    expect(result).toBe(content);
  });
});

// PDF.jsのテストは Promise.withResolvers に依存しているため、
// E2Eテストでのみ実施
// describe('extractTextFromPDF', () => { ... });
