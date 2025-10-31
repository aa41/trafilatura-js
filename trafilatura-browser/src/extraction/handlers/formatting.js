/**
 * 格式化元素处理
 * 
 * 实现格式化标签（如<hi>, <ref>等）的提取和处理逻辑
 * 对应Python: main_extractor.py - handle_formatting()
 * 
 * @module extraction/handlers/formatting
 */

import { processNode } from './node-processing.js';
import { FORMATTING_PROTECTED } from '../../settings/constants.js';

/**
 * 处理在段落外发现的格式化元素（b, i等转换为hi）
 * 对应Python: handle_formatting() - main_extractor.py:70-117
 * 
 * @param {Element} element - 要处理的格式化元素
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的元素，如果不应保留则返回null
 */
export function handleFormatting(element, options) {
  if (!element) {
    return null;
  }
  
  // Python: formatting = process_node(element, options)
  const formatting = processNode(element, options);
  
  // Python: if formatting is None: return None
  if (!formatting) {
    return null;
  }
  
  // 修复孤立元素
  // Python: parent = element.getparent()
  let parent = element.parentElement;
  
  // Python: if parent is None: parent = element.getprevious()
  if (!parent) {
    parent = element.previousElementSibling;
  }
  
  let processedElement;
  
  // Python: if parent is None or parent.tag not in FORMATTING_PROTECTED:
  if (!parent || !FORMATTING_PROTECTED.has(parent.tagName.toLowerCase())) {
    // Python: processed_element = Element('p')
    processedElement = document.createElement('p');
    // Python: processed_element.insert(0, formatting)
    processedElement.appendChild(formatting);
  } else {
    // Python: processed_element = formatting
    processedElement = formatting;
  }
  
  return processedElement;
}

export default {
  handleFormatting
};

