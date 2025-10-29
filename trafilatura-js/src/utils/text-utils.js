/**
 * 文本处理工具函数
 * 对应 Python: utils.py 中的文本处理部分
 */

import { LINES_TRIMMING, RE_FILTER } from '../settings/constants.js';

/**
 * 修整字符串，移除多余空格
 * 对应 Python: trim()
 */
export function trim(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  try {
    return str.split(/\s+/).join(' ').trim();
  } catch (e) {
    return '';
  }
}

/**
 * 规范化 Unicode 字符串
 * 对应 Python: normalize_unicode()
 * 
 * @param {string} str - 输入字符串
 * @param {string} form - 规范化形式: NFC, NFD, NFKC, NFKD
 */
export function normalizeUnicode(str, form = 'NFC') {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.normalize(form);
}

/**
 * 移除控制字符
 * 对应 Python: remove_control_characters()
 */
export function removeControlCharacters(str) {
  if (!str) return '';
  
  return Array.from(str)
    .map(char => (char >= ' ' || char === '\n' || char === '\t' || char === '\r' ? char : ''))
    .join('');
}

/**
 * 检查字符是否可打印或为空格
 */
function returnPrintablesAndSpaces(char) {
  // 检查是否可打印或为空格
  const code = char.charCodeAt(0);
  // 控制字符范围: 0x00-0x1F 和 0x7F-0x9F
  if ((code >= 0x00 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f)) {
    // 但保留常见的空白字符
    if (char === '\n' || char === '\t' || char === '\r') {
      return char;
    }
    return '';
  }
  return char;
}

/**
 * 行级文本处理
 * 对应 Python: line_processing()
 * 
 * @param {string} line - 输入行
 * @param {boolean} preserveSpace - 是否保留空格
 * @param {boolean} trailingSpace - 是否保留首尾空格
 */
export function lineProcessing(line, preserveSpace = false, trailingSpace = false) {
  if (!line) return null;

  // 替换 HTML 实体
  let newLine = line
    .replace(/&#13;/g, '\r')
    .replace(/&#10;/g, '\n')
    .replace(/&nbsp;/g, '\u00A0');

  // 移除控制字符
  newLine = removeControlCharacters(newLine);

  if (!preserveSpace) {
    // 移除与标点或标记无关的换行符
    newLine = trim(newLine.replace(LINES_TRIMMING, ' '));

    // 检查是否全是空白字符
    if (!newLine || /^\s*$/.test(newLine)) {
      return null;
    }

    if (trailingSpace) {
      const spaceBefore = line[0] && /\s/.test(line[0]) ? ' ' : '';
      const spaceAfter = line[line.length - 1] && /\s/.test(line[line.length - 1]) ? ' ' : '';
      newLine = spaceBefore + newLine + spaceAfter;
    }
  }

  return newLine;
}

/**
 * 清理文本内容
 * 对应 Python: sanitize()
 */
export function sanitize(text, preserveSpace = false, trailingSpace = false) {
  if (!text) return null;

  // 如果需要保留尾随空格，作为单行处理
  if (trailingSpace) {
    return lineProcessing(text, preserveSpace, true);
  }

  // 逐行处理
  try {
    const lines = text
      .split('\n')
      .map(line => lineProcessing(line, preserveSpace))
      .filter(line => line !== null);
    
    return lines.join('\n').replace(/\u2424/g, '');
  } catch (e) {
    return null;
  }
}

/**
 * 检查文本是否包含实际字符（非空白）
 * 对应 Python: text_chars_test()
 */
export function textCharsTest(str) {
  return Boolean(str && !/^\s*$/.test(str));
}

/**
 * 过滤不需要的文本
 * 对应 Python: textfilter()
 */
export function textFilter(element) {
  const testText = element.textContent;
  if (!testText || /^\s*$/.test(testText)) {
    return true;
  }

  // 检查是否匹配过滤模式
  const lines = testText.split('\n');
  return lines.some(line => RE_FILTER.test(line));
}

/**
 * 检查是否为图片文件
 * 对应 Python: is_image_file()
 */
export function isImageFile(imageSrc) {
  if (!imageSrc || typeof imageSrc !== 'string' || imageSrc.length > 8192) {
    return false;
  }
  
  const imagePattern = /[^\s]+\.(avif|bmp|gif|hei[cf]|jpe?g|png|webp)(\b|$)/i;
  return imagePattern.test(imageSrc);
}

/**
 * 检查元素是否为图片元素
 * 对应 Python: is_image_element()
 */
export function isImageElement(element) {
  if (!element) return false;

  // 检查标准属性
  for (const attr of ['data-src', 'src']) {
    const src = element.getAttribute(attr);
    if (src && isImageFile(src)) {
      return true;
    }
  }

  // 检查所有 data-src 开头的属性
  const attrs = element.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (attr.name.startsWith('data-src') && isImageFile(attr.value)) {
      return true;
    }
  }

  return false;
}

/**
 * 标准化标签字符串
 * 对应 Python metadata.py: normalize_tags()
 */
export function normalizeTags(tags) {
  if (!tags) return '';
  
  const trimmed = trim(unescapeHtml(tags));
  if (!trimmed) return '';
  
  // 移除引号
  const cleaned = trimmed.replace(/['"]/g, '');
  
  // 分割并过滤空项
  return cleaned
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
    .join(', ');
}

/**
 * HTML 反转义
 */
export function unescapeHtml(str) {
  if (!str) return '';
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * 转义 HTML
 */
export function escapeHtml(str) {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 合并文本内容
 */
export function mergeText(...texts) {
  return texts
    .filter(t => t && textCharsTest(t))
    .join(' ')
    .trim();
}

/**
 * 从元素获取纯文本
 */
export function getElementText(element) {
  if (!element) return '';
  return trim(element.textContent || '');
}

/**
 * 检查字符串长度是否在可接受范围内
 */
export function isAcceptableLength(text, minLength = 2, maxLength = 200) {
  if (!text) return false;
  const len = text.length;
  return len >= minLength && len <= maxLength;
}

/**
 * 语言过滤
 * 对应 Python: language_filter()
 * 
 * @param {Element} tree - HTML树
 * @param {Document} document - 文档对象
 * @param {string} targetLanguage - 目标语言（ISO 639-1格式，如'en', 'zh'等）
 * @returns {boolean} 是否通过语言过滤
 */
export function languageFilter(tree, document, targetLanguage) {
  if (!targetLanguage) return true;
  
  // 简化版实现：检查HTML lang属性
  const htmlLang = tree.getAttribute('lang');
  if (htmlLang) {
    const lang = htmlLang.toLowerCase().substring(0, 2);
    if (lang === targetLanguage.toLowerCase()) {
      return true;
    }
  }
  
  // 检查meta标签
  const metaLang = tree.querySelector('meta[http-equiv="content-language"]');
  if (metaLang) {
    const content = metaLang.getAttribute('content');
    if (content && content.toLowerCase().startsWith(targetLanguage.toLowerCase())) {
      return true;
    }
  }
  
  // 如果没有明确的语言信息，默认通过
  if (!htmlLang && !metaLang) {
    return true;
  }
  
  return false;
}

// 默认导出
export default {
  normalizeUnicode,
  trim,
  textCharsTest,
  lineProcessing,
  sanitize,
  normalizeTags,
  isImageFile,
  isImageElement,
  languageFilter,
};
