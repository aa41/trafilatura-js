/**
 * 工具函数模块统一导出
 * 
 * @module utils
 */

// 导出DOM工具
export {
  loadHtml,

} from './dom.js';

// 导出文本工具
export {
  normalize,
  textFilter,
  textCharsTest,
  trim,
  sanitize
} from './text.js';

// 导出URL工具
export {
  extractDomain,
  getBaseUrl,
  normalizeUrl,
  isValidUrl,
  parseUrl,
  getFilename,
  getPath,
  isSameDomain,
  buildUrl,
  cleanUrl
} from './url.js';

// 导出语言检测工具
export {
  checkHtmlLang,
  languageFilter
} from './language.js';

// 导出去重工具
export {
  duplicateTest,
  contentFingerprint
} from './deduplication.js';

// 导出日期提取工具
export {
  findDate,
  parseISODate,
  formatDate
} from './date-extraction.js';

// 默认导出
export { default as dom } from './dom.js';
export { default as text } from './text.js';
export { default as url } from './url.js';
export { default as language } from './language.js';
export { default as deduplication } from './deduplication.js';
export { default as dateExtraction } from './date-extraction.js';
