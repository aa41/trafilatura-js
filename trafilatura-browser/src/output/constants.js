/**
 * 输出格式化模块 - 常量定义
 * 
 * 定义输出格式化过程中使用的所有常量
 * 对应Python模块: trafilatura/xml.py (常量部分)
 * 
 * @module output/constants
 */

/**
 * TEI有效标签集合
 * 对应Python: TEI_VALID_TAGS - xml.py:29-30
 */
export const TEI_VALID_TAGS = new Set([
  'ab', 'body', 'cell', 'code', 'del', 'div', 'graphic', 'head', 'hi',
  'item', 'lb', 'list', 'p', 'quote', 'ref', 'row', 'table'
]);

/**
 * TEI有效属性集合
 * 对应Python: TEI_VALID_ATTRS - xml.py:31
 */
export const TEI_VALID_ATTRS = new Set([
  'rend', 'rendition', 'role', 'target', 'type'
]);

/**
 * TEI移除tail的元素
 * 对应Python: TEI_REMOVE_TAIL - xml.py:33
 */
export const TEI_REMOVE_TAIL = new Set(['ab', 'p']);

/**
 * TEI div兄弟元素
 * 对应Python: TEI_DIV_SIBLINGS - xml.py:34
 */
export const TEI_DIV_SIBLINGS = new Set(['p', 'list', 'table', 'quote', 'ab']);

/**
 * 换行元素集合
 * 对应Python: NEWLINE_ELEMS - xml.py:38
 * 
 * 这些元素在输出时会添加换行
 */
export const NEWLINE_ELEMS = new Set([
  'graphic', 'head', 'lb', 'list', 'p', 'quote', 'row', 'table'
]);

/**
 * 特殊格式元素
 * 对应Python: SPECIAL_FORMATTING - xml.py:39
 * 
 * 这些元素需要特殊的格式化处理
 */
export const SPECIAL_FORMATTING = new Set([
  'code', 'del', 'head', 'hi', 'ref', 'item', 'cell'
]);

/**
 * 带属性元素
 * 对应Python: WITH_ATTRIBUTES - xml.py:40
 * 
 * 这些元素允许保留属性
 */
export const WITH_ATTRIBUTES = new Set([
  'cell', 'row', 'del', 'graphic', 'head', 'hi', 'item', 'list', 'ref'
]);

/**
 * 嵌套白名单
 * 对应Python: NESTING_WHITELIST - xml.py:41
 * 
 * 这些元素允许嵌套
 */
export const NESTING_WHITELIST = new Set([
  'cell', 'figure', 'item', 'note', 'quote'
]);

/**
 * 元数据属性列表
 * 对应Python: META_ATTRIBUTES - xml.py:43-47
 */
export const META_ATTRIBUTES = [
  'sitename', 'title', 'author', 'date', 'url', 'hostname',
  'description', 'categories', 'tags', 'license', 'id',
  'fingerprint', 'language', 'image', 'pagetype'
];

/**
 * Markdown格式化映射
 * 对应Python: HI_FORMATTING - xml.py:49
 * 
 * hi元素的rend属性到Markdown标记的映射
 * @example
 * '#b' → '**' (粗体)
 * '#i' → '*'  (斜体)
 */
export const HI_FORMATTING = {
  '#b': '**',    // 粗体 (bold)
  '#i': '*',     // 斜体 (italic)
  '#u': '__',    // 下划线 (underline)
  '#t': '`'      // 代码 (teletype/monospace)
};

/**
 * 表格最大宽度
 * 对应Python: MAX_TABLE_WIDTH - xml.py:51
 */
export const MAX_TABLE_WIDTH = 1000;

/**
 * 默认导出所有常量
 */
export default {
  TEI_VALID_TAGS,
  TEI_VALID_ATTRS,
  TEI_REMOVE_TAIL,
  TEI_DIV_SIBLINGS,
  NEWLINE_ELEMS,
  SPECIAL_FORMATTING,
  WITH_ATTRIBUTES,
  NESTING_WHITELIST,
  META_ATTRIBUTES,
  HI_FORMATTING,
  MAX_TABLE_WIDTH
};

