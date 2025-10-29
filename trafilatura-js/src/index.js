/**
 * Trafilatura.js - JavaScript port of Trafilatura
 * Main entry point
 * 
 * @module trafilatura-js
 * @version 0.1.0
 * @license Apache-2.0
 */

// 配置和设置
export { Document, Extractor, useConfig, setDateParams } from './settings/config.js';
export * from './settings/constants.js';

// 工具函数
export * from './utils/text-utils.js';
export * from './utils/dom-utils.js';
export * from './utils/url-utils.js';

// HTML 处理（阶段2）
export * from './processing/html-processing.js';
export * from './processing/deduplication.js';

// 元数据提取（阶段3）
export {
  extractMetadata,
  extractOpengraph,
  examineMeta,
  extractTitle,
  extractAuthor,
  extractUrl,
  extractSitename,
  normalizeAuthors,
  checkAuthors,
} from './extraction/metadata.js';

// 核心提取函数（阶段4）
export {
  extract,
  extractWithMetadata,
  bareExtraction,
  trafilaturaSequence,
  determineReturnString,
} from './core.js';

// 基线提取器（阶段4）
export {
  baseline,
  basicBaseline,
  smartBaseline,
} from './extraction/baseline.js';

// 核心提取器（阶段4）
export {
  extractContent,
  extractComments,
  handleParagraphs,
  handleTable,
} from './extraction/extractor.js';

// 格式化器（阶段5）
export {
  MarkdownFormatter,
  XmlTeiFormatter,
  JsonFormatter,
  HtmlFormatter,
  CsvFormatter,
  TxtFormatter,
  getFormatter,
} from './formats/index.js';

// 导入用于default导出
import { extract, extractWithMetadata, bareExtraction } from './core.js';
import { baseline } from './extraction/baseline.js';

// 默认导出
export default {
  extract,
  extractWithMetadata,
  bareExtraction,
  baseline,
};

