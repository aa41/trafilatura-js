/**
 * 标题处理
 * 
 * 实现标题提取和处理逻辑
 * 对应Python: main_extractor.py - handle_titles()
 * 
 * @module extraction/handlers/titles
 */

import { processNode, handleTextNode } from './node-processing.js';
import { textCharsTest } from '../../utils/text.js';
import { copyTree } from '../../utils/dom.js';

/**
 * 处理head元素（标题）
 * 对应Python: handle_titles() - main_extractor.py:44-67
 * 
 * @param {Element} element - 要处理的标题元素
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的标题元素，如果不应保留则返回null
 */
export function handleTitles(element, options) {
  if (!element) {
    return null;
  }
  
  let title = null;
  
  // Python: if len(element) == 0:
  if (element.children.length === 0) {
    // Python: title = process_node(element, options)
    title = processNode(element, options);
  }
  // 有子元素
  else {
    // Python: title = deepcopy(element)
    title = copyTree(element, true);
    
    // Python: for child in list(element):
    const children = Array.from(element.children);
    
    for (const child of children) {
      // Python: processed_child = handle_textnode(child, options, comments_fix=False)
      const processedChild = handleTextNode(child, options, false, false);
      
      if (processedChild) {
        // Python: title.append(processed_child)
        title.appendChild(processedChild);
      }
      
      // Python: child.tag = 'done'
      // 注意: 浏览器DOM中tagName是只读的，使用data属性标记
      child.setAttribute('data-done', 'true');
    }
  }
  
  // Python: if title is not None and text_chars_test(''.join(title.itertext())) is True:
  if (title && textCharsTest(title.textContent || '')) {
    return title;
  }
  
  return null;
}

export default {
  handleTitles
};

