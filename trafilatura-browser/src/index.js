/**
 * Trafilatura Browser
 * 
 * JavaScript移植版本 - 浏览器环境
 * 实现像素级精确的内容提取能力
 * 
 * @module trafilatura-browser
 * @version 1.0.0
 * @license GPL-3.0
 */

// ============================================================================
// 核心提取函数 (阶段7 - 步骤3)
// ============================================================================

export { extract, bareExtraction } from './core/extract.js';

// ============================================================================
// 配置和数据结构 (阶段7 - 步骤1)
// ============================================================================

export {
  Extractor,
  Document,
  validateConfig,
  SUPPORTED_FORMATS,
  SUPPORTED_FMT_CLI
} from './settings/extractor.js';

// 兼容旧版API
export {
  createExtractor,
  createDocument
} from './settings/config.js';

// ============================================================================
// 元数据提取 (阶段5 - 已完成)
// ============================================================================

export { extractMetadata } from './metadata/index.js';

// ============================================================================
// 输出格式化 (阶段6 - 已完成)
// ============================================================================

export {
  determineReturnString,
  buildMetadataHeader,
  normalizeUnicode
} from './core/output-control.js';

export { xmlToTxt } from './output/text.js';
export { buildJsonOutput } from './output/json.js';
export { xmlToCsv, getCsvHeader } from './output/csv.js';
export { writeTeiTree, teiToString } from './output/tei.js';

// ============================================================================
// 基础提取器 (阶段3 - 已完成)
// ============================================================================

export {
  baseline,
  html2txt,
  basicCleaning
} from './extraction/baseline.js';

// ============================================================================
// 外部提取器 (P3 - 已完成)
// ============================================================================

export {
  tryReadability,
  compareExtraction,
  sanitizeTree
} from './external/index.js';

// ============================================================================
// 核心内容提取 (阶段4 - 已完成)
// ============================================================================

export {
  extractContent
} from './extraction/extractor.js';

// ============================================================================
// 处理函数 (阶段2 - 已完成)
// ============================================================================

export {
  treeCleaning,
  pruneHtml,
  pruneUnwantedNodes,
  applyBasicCleaning,
  linkDensityTest,
  linkDensityTestTables,
  deleteByLinkDensity
} from './processing/index.js';

// ============================================================================
// 工具函数
// ============================================================================

export {
  loadHtml,
  trim,
  sanitize,
  textCharsTest,
  findDate
} from './utils/index.js';

// ============================================================================
// 设置和常量
// ============================================================================

export {
  // 标签映射
  REND_TAG_MAPPING,
  HTML_TAG_MAPPING,
  
  // 清理规则
  CUT_EMPTY_ELEMS,
  MANUALLY_CLEANED,
  MANUALLY_STRIPPED,
  
  // 元素集合
  TAG_CATALOG,
  FORMATTING,
  TABLE_ELEMS,
  
  // 配置值
  MIN_EXTRACTED_SIZE,
  MIN_OUTPUT_SIZE,
  MAX_FILE_SIZE
} from './settings/constants.js';

export {
  // XPath表达式
  BODY_XPATH,
  COMMENTS_XPATH,
  OVERALL_DISCARD_XPATH,
  
  // 辅助函数
  evaluateXPath
} from './settings/xpaths.js';

// ============================================================================
// 默认导出 - 主要API集合
// ============================================================================

import { extract, bareExtraction } from './core/extract.js';
import { Extractor, Document } from './settings/extractor.js';
import { extractMetadata } from './metadata/index.js';
import { determineReturnString } from './core/output-control.js';
import { xmlToTxt } from './output/text.js';
import { buildJsonOutput } from './output/json.js';
import { xmlToCsv } from './output/csv.js';
import { writeTeiTree } from './output/tei.js';
import { extractContent } from './extraction/extractor.js';
import { baseline, html2txt } from './extraction/baseline.js';
import { tryReadability, compareExtraction } from './external/index.js';
import { treeCleaning, linkDensityTest } from './processing/index.js';
import { loadHtml, trim, sanitize, findDate } from './utils/index.js';

/**
 * 默认导出对象
 * 包含所有主要的公共API
 * 
 * @example
 * import Trafilatura from 'trafilatura-browser';
 * 
 * const result = Trafilatura.extract(html, {
 *   format: 'markdown',
 *   with_metadata: true
 * });
 */
export default {
  // 核心提取
  extract,
  bareExtraction,
  extractContent,
  extractMetadata,
  
  // 配置类
  Extractor,
  Document,
  
  // 输出格式化
  determineReturnString,
  xmlToTxt,
  buildJsonOutput,
  xmlToCsv,
  writeTeiTree,
  
  // 基础提取
  baseline,
  html2txt,
  
  // 外部提取器
  tryReadability,
  compareExtraction,
  
  // 处理
  treeCleaning,
  linkDensityTest,
  
  // 工具
  loadHtml,
  trim,
  sanitize,
  findDate
};
