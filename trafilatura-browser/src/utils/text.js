/**
 * 文本处理工具函数
 * 
 * 对应Python模块: trafilatura/utils.py
 * 实现文本修剪、清理、控制字符移除等功能
 * 
 * @module utils/text
 */

// ===== 正则表达式定义 =====
// 对应Python: LINES_TRIMMING = re.compile(r'(?<![p{P}>])\n', flags=re.UNICODE|re.MULTILINE)
// 匹配不在标点符号或>之后的换行符
const LINES_TRIMMING = /(?<![.!?:;,>"'])\n/gu;

// HTML标签剥离正则
const HTML_STRIP_TAGS = /(<!--.*?-->|<[^>]*>)/g;

// 社交媒体过滤器
const RE_FILTER = /\W*(Drucken|E-?Mail|Facebook|Flipboard|Google|Instagram|Linkedin|Mail|PDF|Pinterest|Pocket|Print|QQ|Reddit|Twitter|WeChat|WeiBo|Whatsapp|Xing|Mehr zum Thema:?|More on this.{0,8})$/i;

// ===== LRU缓存实现 =====
/**
 * 简单的LRU缓存实现
 * Python使用 @lru_cache(maxsize=1024)
 */
class LRUCache {
  constructor(maxSize = 1024) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // 移动到最近使用
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项（Map的第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

// 创建缓存实例
const trimCache = new LRUCache(1024);
const lineProcessingCache = new LRUCache(1024);
const printablesCache = new LRUCache(16384); // 2^14

// ===== 核心函数 =====

/**
 * 修剪字符串，移除不必要的空格
 * 对应Python函数: trim(string) - utils.py:340-346
 * 
 * Python实现:
 * @lru_cache(maxsize=1024)
 * def trim(string: str) -> str:
 *     try:
 *         return " ".join(string.split()).strip()
 *     except (AttributeError, TypeError):
 *         return ""
 * 
 * @param {string} string - 输入字符串
 * @returns {string} 修剪后的字符串
 * 
 * @example
 * trim('  hello   world  ')  // 'hello world'
 * trim('line1\n  \nline2')   // 'line1 line2'
 * trim(null)                 // ''
 */
export function trim(string) {
  // 检查缓存
  if (trimCache.has(string)) {
    return trimCache.get(string);
  }

  try {
    // 移除与标点或标记无关的换行符 + 正确修剪
    // Python: " ".join(string.split()).strip()
    // Python的split()会按所有空白字符分割（包括\u00A0）
    const result = string.split(/\s+/).join(' ').trim();
    trimCache.set(string, result);
    return result;
  } catch (error) {
    // AttributeError, TypeError -> 返回空字符串
    return '';
  }
}

/**
 * 返回可打印字符或空格字符，否则返回空字符串
 * 对应Python函数: return_printables_and_spaces(char) - utils.py:267-269
 * 
 * Python实现:
 * @lru_cache(maxsize=2**14)
 * def return_printables_and_spaces(char: str) -> str:
 *     return char if char.isprintable() or char.isspace() else ''
 * 
 * @param {string} char - 单个字符
 * @returns {string} 字符或空字符串
 */
function returnPrintablesAndSpaces(char) {
  // 检查缓存
  if (printablesCache.has(char)) {
    return printablesCache.get(char);
  }

  // JavaScript中判断可打印字符
  // 控制字符范围: \u0000-\u001F, \u007F-\u009F
  // 除了空白字符（\s）
  const charCode = char.charCodeAt(0);
  const isPrintable = !(
    (charCode >= 0x0000 && charCode <= 0x001F && !/\s/.test(char)) ||
    (charCode >= 0x007F && charCode <= 0x009F)
  );
  const isSpace = /\s/.test(char);
  
  const result = (isPrintable || isSpace) ? char : '';
  printablesCache.set(char, result);
  return result;
}

/**
 * 移除控制字符，防止不可打印和XML无效字符错误
 * 对应Python函数: remove_control_characters(string) - utils.py:272-274
 * 
 * Python实现:
 * def remove_control_characters(string: str) -> str:
 *     return ''.join(map(return_printables_and_spaces, string))
 * 
 * @param {string} string - 输入字符串
 * @returns {string} 移除控制字符后的字符串
 * 
 * @example
 * removeControlCharacters('hello\u0000world')  // 'helloworld'
 */
export function removeControlCharacters(string) {
  if (!string) return '';
  
  // Python: ''.join(map(return_printables_and_spaces, string))
  return Array.from(string)
    .map(returnPrintablesAndSpaces)
    .join('');
}

/**
 * 行处理：移除HTML空格实体，丢弃不兼容的Unicode和无效的XML字符
 * 对应Python函数: line_processing(line, preserve_space, trailing_space) - utils.py:283-300
 * 
 * Python实现:
 * @lru_cache(maxsize=1024)
 * def line_processing(line: str, preserve_space: bool = False, trailing_space: bool = False) -> Optional[str]:
 *     new_line = remove_control_characters(
 *         line.replace('&#13;', '\r').replace('&#10;', '\n').replace('&nbsp;', '\u00A0')
 *     )
 *     if not preserve_space:
 *         new_line = trim(LINES_TRIMMING.sub(r" ", new_line))
 *         if all(map(str.isspace, new_line)):
 *             new_line = None
 *         elif trailing_space:
 *             space_before = " " if line[0].isspace() else ""
 *             space_after = " " if line[-1].isspace() else ""
 *             new_line = "".join([space_before, new_line, space_after])
 *     return new_line
 * 
 * @param {string} line - 输入行
 * @param {boolean} preserveSpace - 是否保留空格
 * @param {boolean} trailingSpace - 是否保留首尾空格
 * @returns {string|null} 处理后的行，如果为空行则返回null
 */
export function lineProcessing(line, preserveSpace = false, trailingSpace = false) {
  if (!line) return null;

  // 创建缓存键
  const cacheKey = `${line}|${preserveSpace}|${trailingSpace}`;
  if (lineProcessingCache.has(cacheKey)) {
    return lineProcessingCache.get(cacheKey);
  }

  // 替换HTML空格实体
  // Python: line.replace('&#13;', '\r').replace('&#10;', '\n').replace('&nbsp;', '\u00A0')
  let newLine = line
    .replace(/&#13;/g, '\r')
    .replace(/&#10;/g, '\n')
    .replace(/&nbsp;/g, '\u00A0');

  // 移除控制字符
  newLine = removeControlCharacters(newLine);

  if (!preserveSpace) {
    // 移除与标点或标记无关的换行符
    // Python: LINES_TRIMMING.sub(r" ", new_line)
    newLine = newLine.replace(LINES_TRIMMING, ' ');
    
    // 修剪
    newLine = trim(newLine);

    // 检查是否全是空格
    // Python: if all(map(str.isspace, new_line)): new_line = None
    // 注意: Python的all()对空序列返回True，所以空字符串也应该返回None
    if (newLine.length === 0 || Array.from(newLine).every(char => /\s/.test(char))) {
      newLine = null;
    } else if (trailingSpace && newLine) {
      // 保留首尾空格
      const spaceBefore = line[0] && /\s/.test(line[0]) ? ' ' : '';
      const spaceAfter = line[line.length - 1] && /\s/.test(line[line.length - 1]) ? ' ' : '';
      newLine = spaceBefore + newLine + spaceAfter;
    }
  }

  lineProcessingCache.set(cacheKey, newLine);
  return newLine;
}

/**
 * 清理文本，丢弃不兼容和无效的字符
 * 对应Python函数: sanitize(text, preserve_space, trailing_space) - utils.py:303-312
 * 
 * Python实现:
 * def sanitize(text: str, preserve_space: bool = False, trailing_space: bool = False) -> Optional[str]:
 *     if trailing_space:
 *         return line_processing(text, preserve_space, True)
 *     try:
 *         return '\n'.join(filter(None, (line_processing(l, preserve_space) for l in text.splitlines()))).replace('\u2424', '')
 *     except AttributeError:
 *         return None
 * 
 * @param {string} text - 输入文本
 * @param {boolean} preserveSpace - 是否保留空格
 * @param {boolean} trailingSpace - 是否保留首尾空格
 * @returns {string|null} 清理后的文本
 * 
 * @example
 * sanitize('line1\n\nline2\n  \nline3')  // 'line1\nline2\nline3'
 */
export function sanitize(text, preserveSpace = false, trailingSpace = false) {
  if (!text) return null;

  try {
    // 如果需要保留尾部空格，将整个文本作为单行处理
    if (trailingSpace) {
      return lineProcessing(text, preserveSpace, true);
    }

    // 逐行处理
    // Python: '\n'.join(filter(None, (line_processing(l, preserve_space) for l in text.splitlines())))
    const lines = text.split('\n');
    const processedLines = lines
      .map(line => lineProcessing(line, preserveSpace))
      .filter(line => line !== null);
    
    // 替换符号 \u2424 (SYMBOL FOR NEWLINE)
    return processedLines.join('\n').replace(/\u2424/g, '');
  } catch (error) {
    // AttributeError -> 返回null
    return null;
  }
}

/**
 * 文本字符测试 - 检查文本是否包含实际字符（非仅空白）
 * 对应Python中的逻辑，虽然Python中没有单独的函数
 * 
 * @param {string} text - 输入文本
 * @returns {boolean} 是否包含非空白字符
 * 
 * @example
 * textCharsTest('hello')    // true
 * textCharsTest('   ')      // false
 * textCharsTest('')         // false
 */
export function textCharsTest(text) {
  if (!text) return false;
  return /\S/.test(text);
}

/**
 * 检查两个元素的文本是否完全相同
 * 用于去重和比较
 * 
 * @param {string} text1 - 第一个文本
 * @param {string} text2 - 第二个文本
 * @returns {boolean} 是否完全相同
 */
export function isFullText(text1, text2) {
  if (!text1 || !text2) return false;
  return trim(text1) === trim(text2);
}

/**
 * 过滤不需要的文本（社交媒体按钮等）
 * 对应Python函数: textfilter(element) - utils.py:445-449
 * 
 * @param {string} text - 输入文本
 * @returns {boolean} 是否应该过滤掉
 */
export function textFilter(text) {
  if (!text || !text.trim()) return true;
  
  // 检查每一行是否匹配过滤器
  const lines = text.split('\n');
  return lines.some(line => RE_FILTER.test(line));
}

/**
 * 标准化Unicode字符串
 * 对应Python函数: normalize_unicode(string, unicodeform) - utils.py:277-279
 * 
 * @param {string} string - 输入字符串
 * @param {string} form - Unicode标准化形式 ('NFC', 'NFD', 'NFKC', 'NFKD')
 * @returns {string} 标准化后的字符串
 */
export function normalizeUnicode(string, form = 'NFC') {
  if (!string) return '';
  return string.normalize(form);
}

/**
 * 剥离HTML标签
 * 
 * @param {string} html - HTML字符串
 * @returns {string} 纯文本
 */
export function stripTags(html) {
  if (!html) return '';
  return html.replace(HTML_STRIP_TAGS, '');
}

/**
 * 检查字符串是否对应有效的图片扩展名
 * 对应Python函数: is_image_file(imagesrc) - utils.py:363-368
 * 
 * 使用长度阈值并对内容应用正则表达式
 * 
 * @param {string|null} imagesrc - 图片源字符串
 * @returns {boolean} 如果是有效的图片文件则返回true
 */
export function isImageFile(imagesrc) {
  // 对应Python: if imagesrc is None or len(imagesrc) > 8192: return False
  if (!imagesrc || typeof imagesrc !== 'string' || imagesrc.length > 8192) {
    return false;
  }
  
  // 对应Python: IMAGE_EXTENSION = re.compile(r'[^\s]+\.(avif|bmp|gif|hei[cf]|jpe?g|png|webp)(\b|$)')
  const IMAGE_EXTENSION = /[^\s]+\.(avif|bmp|gif|hei[cf]|jpe?g|png|webp)(\b|$)/i;
  
  return IMAGE_EXTENSION.test(imagesrc);
}

/**
 * 检查元素是否是有效的图片元素
 * 对应Python函数: is_image_element(element) - utils.py:349-360
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 如果是有效的图片元素则返回true
 */
export function isImageElement(element) {
  if (!element) {
    return false;
  }
  
  // 对应Python: for attr in ("data-src", "src"):
  for (const attr of ['data-src', 'src']) {
    const src = element.getAttribute(attr) || '';
    if (isImageFile(src)) {
      return true;
    }
  }
  
  // 对应Python: for attr, value in element.attrib.items():
  for (const attr of element.getAttributeNames()) {
    if (attr.startsWith('data-src')) {
      const value = element.getAttribute(attr) || '';
      if (isImageFile(value)) {
        return true;
      }
    }
  }
  
  return false;
}

// 导出缓存实例（用于测试和调试）
export const _caches = {
  trim: trimCache,
  lineProcessing: lineProcessingCache,
  printables: printablesCache
};

// 清除所有缓存（用于测试）
export function clearCaches() {
  trimCache.clear();
  lineProcessingCache.clear();
  printablesCache.clear();
}

