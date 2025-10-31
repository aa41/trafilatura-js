/**
 * 全局常量和配置定义
 * 
 * 对应Python模块: trafilatura/settings.py 和 trafilatura/htmlprocessing.py
 * 定义所有标签映射、清理规则和元素集合
 * 
 * @module settings/constants
 */

// ===== 标签转换映射 =====
// 对应Python: htmlprocessing.py:29-41

/**
 * 格式化标签到内部表示的映射
 * 对应Python: REND_TAG_MAPPING
 * 
 * @type {Object<string, string>}
 */
export const REND_TAG_MAPPING = {
  'em': '#i',      // 斜体
  'i': '#i',
  'b': '#b',       // 粗体
  'strong': '#b',
  'u': '#u',       // 下划线
  'kbd': '#t',     // 代码/等宽字体
  'samp': '#t',
  'tt': '#t',
  'var': '#t',
  'sub': '#sub',   // 下标
  'sup': '#sup'    // 上标
};

/**
 * 内部表示到HTML标签的反向映射
 * 对应Python: HTML_TAG_MAPPING = {v: k for k, v in REND_TAG_MAPPING.items()}
 * 
 * @type {Object<string, string>}
 */
export const HTML_TAG_MAPPING = Object.fromEntries(
  Object.entries(REND_TAG_MAPPING).map(([k, v]) => [v, k])
);

/**
 * 在图片清理时需要保留的元素
 * 对应Python: PRESERVE_IMG_CLEANING
 * 
 * @type {Set<string>}
 */
export const PRESERVE_IMG_CLEANING = new Set(['figure', 'picture', 'source']);

/**
 * 代码块指示器
 * 对应Python: CODE_INDICATORS
 * 
 * @type {Array<string>}
 */
export const CODE_INDICATORS = ['{', '("', "('", '\n    '];

// ===== 元素清理规则 =====
// 对应Python: settings.py:320-430

/**
 * 可以删除的空元素集合
 * 对应Python: CUT_EMPTY_ELEMS
 * 
 * @type {Set<string>}
 */
export const CUT_EMPTY_ELEMS = new Set([
  'article',
  'b',
  'blockquote',
  'dd',
  'div',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'main',
  'p',
  'pre',
  'q',
  'section',
  'span',
  'strong'
]);

/**
 * 需要完全删除的元素（包括内容）
 * 对应Python: MANUALLY_CLEANED
 * 顺序很重要，使用数组保持确定性
 * 
 * @type {Array<string>}
 */
export const MANUALLY_CLEANED = [
  // 重要的
  'aside',
  'embed',
  'footer',
  'form',
  'head',
  'iframe',
  'menu',
  'object',
  'script',
  // 其他内容
  'applet',
  'audio',
  'canvas',
  'figure',
  'map',
  'picture',
  'svg',
  'video',
  // 次要的
  'area',
  'blink',
  'button',
  'datalist',
  'dialog',
  'frame',
  'frameset',
  'fieldset',
  'link',
  'input',
  'ins',
  'label',
  'legend',
  'marquee',
  'math',
  'menuitem',
  'nav',
  'noindex',
  'noscript',
  'optgroup',
  'option',
  'output',
  'param',
  'progress',
  'rp',
  'rt',
  'rtc',
  'select',
  'source',
  'style',
  'track',
  'textarea',
  'time',
  'use'
];

/**
 * 只删除标签但保留内容的元素
 * 对应Python: MANUALLY_STRIPPED
 * 
 * @type {Array<string>}
 */
export const MANUALLY_STRIPPED = [
  'abbr',
  'acronym',
  'address',
  'bdi',
  'bdo',
  'big',
  'cite',
  'data',
  'dfn',
  'font',
  'hgroup',
  'img',
  'ins',
  'mark',
  'meta',
  'ruby',
  'small',
  'tbody',
  'template',
  'tfoot',
  'thead'
];

// ===== 元素标签集合 =====
// 对应Python: settings.py:436-438

/**
 * 基础文本标签目录
 * 对应Python: TAG_CATALOG
 * 
 * @type {Set<string>}
 */
export const TAG_CATALOG = new Set([
  'blockquote',
  'code',
  'del',
  'head',
  'hi',
  'lb',
  'list',
  'p',
  'pre',
  'quote'
]);

// ===== 其他元素集合 =====

/**
 * 格式化标签集合
 * 
 * @type {Set<string>}
 */
export const FORMATTING = new Set(['hi', 'ref', 'span']);

/**
 * 段落内允许的格式化标签
 * 
 * @type {Set<string>}
 */
export const P_FORMATTING = new Set(['hi', 'ref']);

/**
 * 表格元素
 * 
 * @type {Set<string>}
 */
export const TABLE_ELEMS = new Set(['td', 'th']);

/**
 * 所有表格相关元素
 * 
 * @type {Set<string>}
 */
export const TABLE_ALL = new Set(['td', 'th', 'hi']);

/**
 * 代码和引用元素
 * 
 * @type {Set<string>}
 */
export const CODES_QUOTES = new Set(['code', 'quote']);

/**
 * 不能出现在末尾的元素
 * 
 * @type {Set<string>}
 */
export const NOT_AT_THE_END = new Set(['head', 'ref']);

/**
 * 需要换行的元素
 * 
 * @type {Set<string>}
 */
export const NEWLINE_ELEMS = new Set([
  'graphic',
  'head',
  'lb',
  'list',
  'p',
  'quote',
  'row',
  'table'
]);

/**
 * 需要特殊格式化的元素
 * 
 * @type {Set<string>}
 */
export const SPECIAL_FORMATTING = new Set([
  'code',
  'del',
  'head',
  'hi',
  'ref',
  'item',
  'cell'
]);

/**
 * 需要保护格式的元素
 * 
 * @type {Set<string>}
 */
export const FORMATTING_PROTECTED = new Set([
  'cell',
  'head',
  'hi',
  'item',
  'p',
  'quote',
  'ref',
  'td'
]);

/**
 * 需要保护空格的元素
 * 
 * @type {Set<string>}
 */
export const SPACING_PROTECTED = new Set(['code', 'pre']);

// ===== 配置值 =====
// 对应Python: settings.py中的默认值

/**
 * 最小提取文本长度
 * 对应Python: MIN_EXTRACTED_SIZE (默认值从settings.cfg读取)
 * 
 * @type {number}
 */
export const MIN_EXTRACTED_SIZE = 200;

/**
 * 最小输出长度
 * 
 * @type {number}
 */
export const MIN_OUTPUT_SIZE = 10;

/**
 * 最小评论输出长度
 * 
 * @type {number}
 */
export const MIN_OUTPUT_COMM_SIZE = 10;

/**
 * 最小评论提取长度
 * 
 * @type {number}
 */
export const MIN_EXTRACTED_COMM_SIZE = 10;

/**
 * 去重检查最小长度
 * 
 * @type {number}
 */
export const MIN_DUPLCHECK_SIZE = 100;

/**
 * 最大重复次数
 * 
 * @type {number}
 */
export const MAX_REPETITIONS = 2;

/**
 * 最大文件大小 (20MB)
 * 
 * @type {number}
 */
export const MAX_FILE_SIZE = 20000000;

/**
 * 最小文件大小
 * 
 * @type {number}
 */
export const MIN_FILE_SIZE = 10;

/**
 * LRU缓存大小
 * 对应Python: LRU_SIZE = 4096
 * 
 * @type {number}
 */
export const LRU_SIZE = 4096;

/**
 * 最大链接数
 * 对应Python: MAX_LINKS = 10**6
 * 
 * @type {number}
 */
export const MAX_LINKS = 1000000;

/**
 * 最大sitemap数量
 * 对应Python: MAX_SITEMAPS_SEEN = 10**4
 * 
 * @type {number}
 */
export const MAX_SITEMAPS_SEEN = 10000;

/**
 * 最大表格宽度（用于输出格式化）
 * 
 * @type {number}
 */
export const MAX_TABLE_WIDTH = 1000;

// ===== JusText语言映射 =====
// 对应Python: settings.py:442-475

/**
 * JusText支持的语言映射
 * 对应Python: JUSTEXT_LANGUAGES
 * 
 * @type {Object<string, string>}
 */
export const JUSTEXT_LANGUAGES = {
  'ar': 'Arabic',
  'bg': 'Bulgarian',
  'cz': 'Czech',
  'da': 'Danish',
  'de': 'German',
  'en': 'English',
  'el': 'Greek',
  'es': 'Spanish',
  'fa': 'Persian',
  'fi': 'Finnish',
  'fr': 'French',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'ko': 'Korean',
  'id': 'Indonesian',
  'it': 'Italian',
  'no': 'Norwegian_Nynorsk',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese'
};

// ===== 导出所有常量 =====

export default {
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
};

