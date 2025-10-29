/**
 * 格式化器统一导出
 */

import { BaseFormatter } from './base.js';
import { MarkdownFormatter } from './markdown.js';
import { XmlTeiFormatter } from './xml-tei.js';
import { JsonFormatter } from './json.js';
import { HtmlFormatter } from './html.js';
import { CsvFormatter } from './csv.js';
import { TxtFormatter } from './txt.js';

export { 
  BaseFormatter,
  MarkdownFormatter,
  XmlTeiFormatter,
  JsonFormatter,
  HtmlFormatter,
  CsvFormatter,
  TxtFormatter,
};

/**
 * 格式化器映射表
 */
export const FORMATTERS = {
  'txt': 'TxtFormatter',
  'markdown': 'MarkdownFormatter',
  'md': 'MarkdownFormatter',
  'xml': 'XmlTeiFormatter',
  'xmltei': 'XmlTeiFormatter',
  'tei': 'XmlTeiFormatter',
  'json': 'JsonFormatter',
  'html': 'HtmlFormatter',
  'csv': 'CsvFormatter',
};

/**
 * 获取格式化器类
 * @param {string} format - 格式名称
 * @returns {Function} 格式化器类
 */
export function getFormatter(format) {
  const formatterName = FORMATTERS[format.toLowerCase()] || 'TxtFormatter';
  
  switch (formatterName) {
    case 'MarkdownFormatter':
      return MarkdownFormatter;
    case 'XmlTeiFormatter':
      return XmlTeiFormatter;
    case 'JsonFormatter':
      return JsonFormatter;
    case 'HtmlFormatter':
      return HtmlFormatter;
    case 'CsvFormatter':
      return CsvFormatter;
    default:
      return TxtFormatter;
  }
}

export default {
  BaseFormatter,
  MarkdownFormatter,
  XmlTeiFormatter,
  JsonFormatter,
  HtmlFormatter,
  CsvFormatter,
  TxtFormatter,
  FORMATTERS,
  getFormatter,
};

