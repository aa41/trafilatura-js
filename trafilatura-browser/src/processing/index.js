/**
 * 处理模块统一导出
 * 
 * @module processing
 */

// 导出清理函数
export {
  treeCleaning,
  pruneHtml,
  pruneUnwantedNodes,
  applyBasicCleaning,
  isEmpty,
  bulkDeleteElements,
  bulkStripTags,
  removeHiddenElements
} from './cleaning.js';

// 导出链接密度函数
export {
  collectLinkInfo,
  linkDensityTest,
  linkDensityTestTables,
  calculateLinkDensity,
  isNavigationElement,
  batchLinkDensityTest,
  deleteByLinkDensity
} from './link-density.js';

// 导出标签转换函数
export {
  convertTags,
  REND_TAG_MAPPING,
  HTML_TAG_MAPPING
} from './convert-tags.js';

// 默认导出
export { default as cleaning } from './cleaning.js';
export { default as linkDensity } from './link-density.js';

