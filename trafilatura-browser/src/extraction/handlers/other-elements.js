/**
 * 其他元素处理
 * 
 * 处理不在主要类别中的各种元素
 * 对应Python: main_extractor.py - handle_other_elements()
 * 
 * @module extraction/handlers/other-elements
 */

import { handleTextNode } from './node-processing.js';
import { textCharsTest } from '../../utils/text.js';
import { handleCodeBlocks } from './quotes.js';
import { isDevelopment } from '../../utils/env.js';

/**
 * 在相关标签范围内处理各种或未知元素
 * 对应Python: handle_other_elements() - main_extractor.py:248-272
 * 
 * @param {Element} element - 要处理的元素
 * @param {Set<string>} potentialTags - 潜在的有效标签集合
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的元素，如果不应保留则返回null
 */
export function handleOtherElements(element, potentialTags, options) {
  if (!element) {
    return null;
  }
  
  const tagName = element.tagName.toLowerCase();
  
  // 处理w3schools代码
  // Python: if element.tag == "div" and "w3-code" in element.get("class", ""):
  if (tagName === 'div' && element.classList.contains('w3-code')) {
    // Python: return handle_code_blocks(element)
    return handleCodeBlocks(element);
  }
  
  // 删除不需要的
  // Python: if element.tag not in potential_tags:
  if (!potentialTags.has(tagName)) {
    // Python: if element.tag != "done":
    if (tagName !== 'done') {
      logEvent('discarding element', tagName, element.textContent);
    }
    return null;
  }
  
  // Python: if element.tag == "div":
  if (tagName === 'div') {
    // Python: processed_element = handle_textnode(element, options, comments_fix=False, preserve_spaces=True)
    const processedElement = handleTextNode(element, options, false, true);
    
    // Python: if processed_element is not None and text_chars_test(processed_element.text) is True:
    if (processedElement && textCharsTest(processedElement.textContent || '')) {
      // Python: processed_element.attrib.clear()
      for (const attr of Array.from(processedElement.attributes)) {
        processedElement.removeAttribute(attr.name);
      }
      
      // 小型div修正
      // Python: if processed_element.tag == "div": processed_element.tag = "p"
      if (processedElement.tagName.toLowerCase() === 'div') {
        const newP = document.createElement('p');
        // 移动所有子节点
        while (processedElement.firstChild) {
          newP.appendChild(processedElement.firstChild);
        }
        // 复制属性（虽然上面清空了）
        for (const attr of processedElement.attributes) {
          newP.setAttribute(attr.name, attr.value);
        }
        return newP;
      }
      
      return processedElement;
    }
  }
  
  return null;
}

/**
 * 日志事件（调试用）
 */
function logEvent(msg, tag, text) {
  if (isDevelopment()) {
    console.debug(`${msg}: ${tag} ${(text || '').substring(0, 50)}`);
  }
}

export default {
  handleOtherElements
};

