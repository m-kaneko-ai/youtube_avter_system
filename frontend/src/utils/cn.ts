import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSSのクラス名を結合するユーティリティ
 * clsxで条件付きクラスを処理し、tailwind-mergeで重複を解決
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
