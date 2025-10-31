/**
 * 内容提取模块统一导出
 * 
 * @module extraction
 */

// 导出主提取器
export {
  extractContent,
  handleTextElem,
  pruneUnwantedSections,
  recoverWildText
} from './extractor.js';

// 导出基线提取器
export {
  baseline,
  html2txt,
  basicCleaning
} from './baseline.js';

// 导出评论提取器
export {
  extractComments,
  TAG_CATALOG,
  COMMENTS_SELECTORS,
  COMMENTS_DISCARD_SELECTORS
} from './comments.js';

// 默认导出
export { default as extractor } from './extractor.js';
export { default as baseline } from './baseline.js';
export { default as comments } from './comments.js';

