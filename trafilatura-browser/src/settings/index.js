/**
 * 设置模块统一导出
 * 
 * @module settings
 */

// 导出常量
export {
  // 标签映射
  REND_TAG_MAPPING,
  HTML_TAG_MAPPING,
  PRESERVE_IMG_CLEANING,
  CODE_INDICATORS,
  
  // 清理规则
  CUT_EMPTY_ELEMS,
  MANUALLY_CLEANED,
  MANUALLY_STRIPPED,
  
  // 元素集合
  TAG_CATALOG,
  FORMATTING,
  P_FORMATTING,
  TABLE_ELEMS,
  TABLE_ALL,
  CODES_QUOTES,
  NOT_AT_THE_END,
  NEWLINE_ELEMS,
  SPECIAL_FORMATTING,
  FORMATTING_PROTECTED,
  SPACING_PROTECTED,
  
  // 配置值
  MIN_EXTRACTED_SIZE,
  MIN_OUTPUT_SIZE,
  MIN_OUTPUT_COMM_SIZE,
  MIN_EXTRACTED_COMM_SIZE,
  MIN_DUPLCHECK_SIZE,
  MAX_REPETITIONS,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  LRU_SIZE,
  MAX_LINKS,
  MAX_SITEMAPS_SEEN,
  MAX_TABLE_WIDTH,
  
  // 语言
  JUSTEXT_LANGUAGES
} from './constants.js';

// 导出XPath
export {
  // 内容提取
  BODY_XPATH,
  COMMENTS_XPATH,
  REMOVE_COMMENTS_XPATH,
  OVERALL_DISCARD_XPATH,
  TEASER_DISCARD_XPATH,
  PRECISION_DISCARD_XPATH,
  DISCARD_IMAGE_ELEMENTS,
  COMMENTS_DISCARD_XPATH,
  
  // 元数据提取
  AUTHOR_XPATHS,
  AUTHOR_DISCARD_XPATHS,
  CATEGORIES_XPATHS,
  TAGS_XPATHS,
  TITLE_XPATHS,
  
  // 辅助函数
  evaluateXPath,
  createXPathFunction
} from './xpaths.js';

// 导出配置类
export {
  Extractor,
  Document,
  validateConfig,
  SUPPORTED_FORMATS,
  SUPPORTED_FMT_CLI
} from './extractor.js';

// 导出旧的配置类（兼容）
export {
  createExtractor,
  createDocument
} from './config.js';

// 默认导出
export { default as constants } from './constants.js';
export { default as xpaths } from './xpaths.js';
export { default as config } from './config.js';

