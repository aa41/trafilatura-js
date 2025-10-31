/**
 * 引用和代码块处理
 * 
 * 实现引用和代码块的提取和处理逻辑
 * 对应Python: main_extractor.py - handle_quotes(), handle_code_blocks()
 * 
 * @module extraction/handlers/quotes
 */

import { processNode } from './node-processing.js';
import { isTextElement, defineNewElem } from './utils.js';
import { copyTree, stripTags } from '../../utils/dom.js';

/**
 * 根据常见的结构标记检查是否是代码元素
 * 对应Python: is_code_block_element() - main_extractor.py:205-218
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 如果是代码块返回true
 */
export function isCodeBlockElement(element) {
  if (!element) {
    return false;
  }
  
  const tagName = element.tagName.toLowerCase();
  
  // Python: if element.get("lang") or element.tag == "code":
  if (element.hasAttribute('lang') || tagName === 'code') {
    return true;
  }
  
  // GitHub
  // Python: parent = element.getparent()
  const parent = element.parentElement;
  
  // Python: if parent is not None and "highlight" in parent.get("class", ""):
  if (parent && parent.className && parent.className.includes('highlight')) {
    return true;
  }
  
  // highlightjs
  // Python: code = element.find("code")
  const code = element.querySelector('code');
  
  // Python: if code is not None and len(element) == 1:
  if (code && element.children.length === 1) {
    return true;
  }
  
  return false;
}

/**
 * 将元素转换为正确标记的代码块
 * 对应Python: handle_code_blocks() - main_extractor.py:221-227
 * 
 * @param {Element} element - 要处理的元素
 * @returns {Element} 处理后的代码块元素
 */
export function handleCodeBlocks(element) {
  if (!element) {
    return null;
  }
  
  // Python: processed_element = deepcopy(element)
  const processedElement = copyTree(element, true);
  
  // Python: for child in element.iter("*"):
  const children = processedElement.querySelectorAll('*');
  for (const child of children) {
    // Python: child.tag = "done"
    child.setAttribute('data-done', 'true');
  }
  
  // Python: processed_element.tag = "code"
  // 浏览器中tagName只读，需要创建新元素
  const codeElement = document.createElement('code');
  
  // 复制所有内容
  while (processedElement.firstChild) {
    codeElement.appendChild(processedElement.firstChild);
  }
  
  // 复制属性
  for (const attr of processedElement.attributes) {
    codeElement.setAttribute(attr.name, attr.value);
  }
  
  return codeElement;
}

/**
 * 处理引用元素
 * 对应Python: handle_quotes() - main_extractor.py:230-245
 * 
 * @param {Element} element - 要处理的引用元素
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的引用元素，如果不应保留则返回null
 */
export function handleQuotes(element, options) {
  if (!element) {
    return null;
  }
  
  // Python: if is_code_block_element(element):
  if (isCodeBlockElement(element)) {
    // Python: return handle_code_blocks(element)
    return handleCodeBlocks(element);
  }
  
  // Python: processed_element = Element(element.tag)
  const processedElement = document.createElement(element.tagName.toLowerCase());
  
  // Python: for child in element.iter("*"):
  // 注意：Python的iter("*")包括元素本身和所有后代
  const children = [];
  
  // 如果元素没有子元素，需要处理元素本身
  if (element.children.length === 0) {
    children.push(element);
  } else {
    // 获取所有后代元素
    children.push(...Array.from(element.querySelectorAll('*')));
    // 也包括直接子元素（确保顺序）
    for (const child of element.children) {
      if (!children.includes(child)) {
        children.unshift(child);
      }
    }
  }
  
  for (const child of children) {
    // Python: processed_child = process_node(child, options)
    const processedChild = processNode(child, options);
    
    if (processedChild) {
      // Python: define_newelem(processed_child, processed_element)
      defineNewElem(processedChild, processedElement);
    }
    
    // Python: child.tag = "done"
    child.setAttribute('data-done', 'true');
  }
  
  // Python: if is_text_element(processed_element):
  if (isTextElement(processedElement)) {
    // 避免双重/嵌套标签
    // Python: strip_tags(processed_element, "quote")
    stripTags(processedElement, ['quote']);
    
    return processedElement;
  }
  
  return null;
}

export default {
  isCodeBlockElement,
  handleCodeBlocks,
  handleQuotes
};

