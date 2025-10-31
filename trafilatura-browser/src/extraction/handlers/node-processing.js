/**
 * 节点处理辅助函数
 * 
 * 实现process_node和handle_textnode等核心节点处理逻辑
 * 对应Python: htmlprocessing.py
 * 
 * @module extraction/handlers/node-processing
 */

import { trim, isImageElement } from '../../utils/text.js';
import { textFilter, textCharsTest } from '../../utils/text.js';
import { copyTree } from '../../utils/dom.js';
import { duplicateTest } from '../../utils/deduplication.js';

/**
 * 转换、格式化和探测潜在文本元素（轻量格式）
 * 对应Python: process_node() - htmlprocessing.py:264-281
 * 
 * 注意：Python直接修改传入的元素，这里为了浏览器兼容性创建副本
 * 
 * @param {Element} elem - 要处理的元素
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的元素，如果不应保留则返回null
 */
export function processNode(elem, options) {
  if (!elem) {
    return null;
  }
  
  // Python: if elem.tag == "done" or (len(elem) == 0 and not elem.text and not elem.tail):
  const tagName = elem.tagName ? elem.tagName.toLowerCase() : '';
  const text = getElementText(elem);
  const tail = getElementTail(elem);
  
  if (tagName === 'done' || (elem.children.length === 0 && !text && !tail)) {
    return null;
  }
  
  // 创建副本（Python直接修改原元素）
  const elemCopy = copyTree(elem, true);
  
  // 修剪text和tail
  // Python: elem.text, elem.tail = trim(elem.text) or None, trim(elem.tail) or None
  const trimmedText = trim(getElementText(elemCopy)) || null;
  const trimmedTail = trim(getElementTail(elemCopy)) || null;
  
  setElementText(elemCopy, trimmedText);
  setElementTail(elemCopy, trimmedTail);
  
  // 调整内容字符串
  // Python: if elem.tag != "lb" and not elem.text and elem.tail:
  const copyTagName = elemCopy.tagName ? elemCopy.tagName.toLowerCase() : '';
  if (copyTagName !== 'lb' && !trimmedText && trimmedTail) {
    // Python: elem.text, elem.tail = elem.tail, None
    setElementText(elemCopy, trimmedTail);
    setElementTail(elemCopy, null);
  }
  
  // 内容检查
  // Python: if elem.text or elem.tail:
  const finalText = getElementText(elemCopy);
  const finalTail = getElementTail(elemCopy);
  
  if (finalText || finalTail) {
    // Python: if textfilter(elem) or (options.dedup and duplicate_test(elem, options)):
    // 注意：Python的textfilter接收元素，检查element.text或element.tail
    if (textFilterElement(elemCopy)) {
      return null;
    }
    
    // Python: options.dedup and duplicate_test(elem, options)
    if (options && options.dedup && duplicateTest(elemCopy, options)) {
      return null;
    }
  }
  
  return elemCopy;
}

/**
 * 转换、格式化和探测潜在文本元素
 * 对应Python: handle_textnode() - htmlprocessing.py:218-261
 * 
 * @param {Element} elem - 要处理的元素
 * @param {Extractor} options - 提取器选项
 * @param {boolean} commentsFix - 是否进行注释修复
 * @param {boolean} preserveSpaces - 是否保留空格
 * @returns {Element|null} 处理后的元素，如果不应保留则返回null
 */
export function handleTextNode(elem, options, commentsFix = true, preserveSpaces = false) {
  if (!elem) {
    return null;
  }
  
  // Python: if elem.tag == "graphic" and is_image_element(elem):
  if (elem.tagName.toLowerCase() === 'graphic' && isImageElement(elem)) {
    return elem;
  }
  
  // Python: if elem.tag == "done" or (len(elem) == 0 and not elem.text and not elem.tail):
  if (elem.tagName.toLowerCase() === 'done' || 
      (elem.children.length === 0 && !getElementText(elem) && !getElementTail(elem))) {
    return null;
  }
  
  // 创建副本
  const elemCopy = copyTree(elem, true);
  
  // lb bypass
  // Python: if not comments_fix and elem.tag == "lb":
  if (!commentsFix && elemCopy.tagName.toLowerCase() === 'lb') {
    if (!preserveSpaces) {
      // Python: elem.tail = trim(elem.tail) or None
      const tail = trim(getElementTail(elemCopy)) || null;
      setElementTail(elemCopy, tail);
    }
    return elemCopy;
  }
  
  // Python: if not elem.text and len(elem) == 0:
  let text = getElementText(elemCopy);
  const tail = getElementTail(elemCopy);
  
  if (!text && elemCopy.children.length === 0) {
    // 尝试使用tail
    // Python: elem.text, elem.tail = elem.tail, ""
    setElementText(elemCopy, tail);
    setElementTail(elemCopy, '');
    
    // 对br/lb特殊处理
    // Python: if comments_fix and elem.tag == "lb": elem.tag = "p"
    if (commentsFix && elemCopy.tagName.toLowerCase() === 'lb') {
      changeElementTag(elemCopy, 'p');
    }
    
    text = getElementText(elemCopy);
  }
  
  // 修剪
  // Python: if not preserve_spaces:
  if (!preserveSpaces) {
    // Python: elem.text = trim(elem.text) or None
    const trimmedText = trim(text) || null;
    setElementText(elemCopy, trimmedText);
    
    // Python: if elem.tail: elem.tail = trim(elem.tail) or None
    const currentTail = getElementTail(elemCopy);
    if (currentTail) {
      const trimmedTail = trim(currentTail) || null;
      setElementTail(elemCopy, trimmedTail);
    }
  }
  
  // 过滤内容
  // Python: if (not elem.text and textfilter(elem) or (options.dedup and duplicate_test(elem, options))):
  const finalText = getElementText(elemCopy);
  
  // 注意：Python的逻辑是 (not elem.text and textfilter(elem)) or (options.dedup and duplicate_test(elem, options))
  // 即：如果没有text且textfilter返回true，或者dedup检查失败，则返回None
  if (!finalText && textFilterElement(elemCopy)) {
    return null;
  }
  
  // Python: options.dedup and duplicate_test(elem, options)
  if (options && options.dedup && duplicateTest(elemCopy, options)) {
    return null;
  }
  
  return elemCopy;
}

// ============================================================================
// 辅助函数 - 文本过滤
// ============================================================================

/**
 * 过滤不需要的文本（元素版本）
 * 对应Python: textfilter() - utils.py:445-449
 * 
 * Python逻辑：
 * testtext = element.tail if element.text is None else element.text
 * return not testtext or testtext.isspace() or any(map(RE_FILTER.match, testtext.splitlines()))
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 如果应该过滤掉则返回true
 */
function textFilterElement(element) {
  if (!element) {
    return true;
  }
  
  // Python: testtext = element.tail if element.text is None else element.text
  const text = getElementText(element);
  const tail = getElementTail(element);
  const testtext = text === null || text === '' ? tail : text;
  
  // Python: return not testtext or testtext.isspace() or any(map(RE_FILTER.match, testtext.splitlines()))
  // 使用utils/text.js中的textFilter检查testtext字符串
  return textFilter(testtext);
}

// ============================================================================
// 辅助函数 - 处理Element的text和tail
// ============================================================================

/**
 * 获取元素的text内容（不包括子元素）
 * 对应Python的elem.text
 */
export function getElementText(elem) {
  if (!elem) return '';
  
  // 获取第一个文本节点（如果存在）
  for (const node of elem.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    // 遇到第一个元素节点就停止
    if (node.nodeType === Node.ELEMENT_NODE) {
      break;
    }
  }
  
  return '';
}

/**
 * 设置元素的text内容
 * 对应Python的elem.text = value
 */
export function setElementText(elem, text) {
  if (!elem) return;
  
  // 查找或创建第一个文本节点
  let textNode = null;
  for (const node of elem.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNode = node;
      break;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      break;
    }
  }
  
  if (text === null || text === '') {
    // 如果text为null或空，删除文本节点
    if (textNode) {
      textNode.remove();
    }
  } else {
    // 设置或创建文本节点
    if (textNode) {
      textNode.textContent = text;
    } else {
      // 在第一个位置插入新文本节点
      textNode = document.createTextNode(text);
      elem.insertBefore(textNode, elem.firstChild);
    }
  }
}

/**
 * 获取元素的tail内容（元素后的文本节点）
 * 对应Python的elem.tail
 */
export function getElementTail(elem) {
  if (!elem) return '';
  
  // 首先检查是否有临时存储的_tail属性
  if (elem._tail !== undefined) {
    return elem._tail;
  }
  
  if (!elem.nextSibling) return '';
  
  const next = elem.nextSibling;
  if (next.nodeType === Node.TEXT_NODE) {
    return next.textContent || '';
  }
  
  return '';
}

/**
 * 设置元素的tail内容
 * 对应Python的elem.tail = value
 * 
 * 注意：Python的lxml中，tail是元素的属性，可以在元素没有父节点时设置。
 * 在浏览器DOM中，tail是作为兄弟文本节点存在的，需要父节点。
 * 因此，如果元素没有父节点，我们使用自定义属性临时存储。
 */
export function setElementTail(elem, text) {
  if (!elem) return;
  
  // 如果元素没有父节点，使用自定义属性临时存储
  if (!elem.parentNode) {
    if (text === null || text === '') {
      delete elem._tail;
    } else {
      elem._tail = text;
    }
    return;
  }
  
  const next = elem.nextSibling;
  
  if (text === null || text === '') {
    // 如果text为null或空，删除tail文本节点
    if (next && next.nodeType === Node.TEXT_NODE) {
      next.remove();
    }
    delete elem._tail;
  } else {
    // 设置或创建tail文本节点
    if (next && next.nodeType === Node.TEXT_NODE) {
      next.textContent = text;
    } else {
      // 在元素后插入新文本节点
      const textNode = document.createTextNode(text);
      elem.parentNode.insertBefore(textNode, next);
    }
    delete elem._tail;
  }
}

/**
 * 将临时存储的_tail属性转换为真正的文本节点
 * 应该在元素被添加到DOM后调用
 */
export function flushTail(elem) {
  if (!elem || !elem._tail || !elem.parentNode) return;
  
  const tailText = elem._tail;
  delete elem._tail;
  
  // 现在元素有父节点了，可以正常设置tail
  const next = elem.nextSibling;
  if (next && next.nodeType === Node.TEXT_NODE) {
    next.textContent = tailText;
  } else {
    const textNode = document.createTextNode(tailText);
    elem.parentNode.insertBefore(textNode, next);
  }
}

/**
 * 更改元素标签名
 */
function changeElementTag(elem, newTag) {
  if (!elem || !elem.parentNode) return elem;
  
  const newElem = document.createElement(newTag);
  
  // 复制内容
  while (elem.firstChild) {
    newElem.appendChild(elem.firstChild);
  }
  
  // 复制属性
  for (const attr of elem.attributes) {
    newElem.setAttribute(attr.name, attr.value);
  }
  
  // 复制_tail属性
  if (elem._tail) {
    newElem._tail = elem._tail;
  }
  
  // 替换
  elem.parentNode.replaceChild(newElem, elem);
  
  return newElem;
}

export default {
  processNode,
  handleTextNode,
  getElementText,
  setElementText,
  getElementTail,
  setElementTail
};

