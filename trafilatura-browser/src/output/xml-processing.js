/**
 * XML处理模块
 * 
 * 实现XML树的清理、优化和转换功能
 * 对应Python模块: trafilatura/xml.py (处理函数部分)
 * 
 * @module output/xml-processing
 */

import { WITH_ATTRIBUTES } from './constants.js';
import { textCharsTest } from '../utils/text.js';

/**
 * 删除元素（保留tail文本）
 * 对应Python: delete_element() - xml.py:55-71
 * 
 * 从树中移除元素，包括其子元素和文本。
 * tail文本会合并到前一个元素或父元素。
 * 
 * @param {Element} element - 要删除的元素
 * @param {boolean} keepTail - 是否保留tail文本（默认true）
 * 
 * @example
 * <p>前置<span>删除</span>后置</p>
 * deleteElement(span, true)
 * → <p>前置后置</p>
 */
export function deleteElement(element, keepTail = true) {
  if (!element) return;
  
  const parent = element.parentNode;
  if (!parent) return;
  
  // 处理tail文本（元素后的文本节点）
  if (keepTail) {
    // 收集元素后的所有文本内容（包括可能的多个文本节点）
    let tailText = '';
    let next = element.nextSibling;
    const nodesToRemove = [];
    
    while (next && next.nodeType === Node.TEXT_NODE) {
      tailText += next.textContent || '';
      nodesToRemove.push(next);
      next = next.nextSibling;
    }
    
    if (tailText) {
      // 查找前一个非文本节点
      let previous = element.previousSibling;
      while (previous && previous.nodeType === Node.TEXT_NODE) {
        previous = previous.previousSibling;
      }
      
      if (previous && previous.nodeType === Node.ELEMENT_NODE) {
        // 有前一个元素，在它后面添加文本
        const textNode = document.createTextNode(tailText);
        parent.insertBefore(textNode, previous.nextSibling);
      } else {
        // 没有前一个元素，在元素之前添加文本
        const textNode = document.createTextNode(tailText);
        parent.insertBefore(textNode, element);
      }
    }
    
    // 删除收集的文本节点
    for (const node of nodesToRemove) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
  }
  
  // 删除元素本身
  parent.removeChild(element);
}

/**
 * 合并元素到父元素
 * 对应Python: merge_with_parent() - xml.py:74-92
 * 
 * 将元素的文本内容合并到父元素，可选地转换格式为Markdown
 * 
 * @param {Element} element - 要合并的元素
 * @param {boolean} includeFormatting - 是否包含格式化（Markdown）
 * 
 * @example
 * <p>文本<hi rend="#b">粗体</hi>更多</p>
 * mergeWithParent(hi, true)
 * → <p>文本**粗体**更多</p>
 */
export function mergeWithParent(element, includeFormatting = false) {
  if (!element) return;
  
  const parent = element.parentNode;
  if (!parent) return;
  
  // 获取元素的文本内容
  let fullText = element.textContent || '';
  
  // 收集tail文本
  let next = element.nextSibling;
  while (next && next.nodeType === Node.TEXT_NODE) {
    fullText += next.textContent || '';
    const toRemove = next;
    next = next.nextSibling;
    parent.removeChild(toRemove);
  }
  
  // 查找前一个非文本节点
  let previous = element.previousSibling;
  while (previous && previous.nodeType === Node.TEXT_NODE) {
    previous = previous.previousSibling;
  }
  
  if (previous && previous.nodeType === Node.ELEMENT_NODE) {
    // 有前一个元素，在它后面添加文本
    const textNode = document.createTextNode(' ' + fullText);
    parent.insertBefore(textNode, previous.nextSibling);
  } else {
    // 没有前一个元素，在当前位置添加文本
    const textNode = document.createTextNode(fullText);
    parent.insertBefore(textNode, element);
  }
  
  // 删除元素本身
  parent.removeChild(element);
}

/**
 * 移除空元素
 * 对应Python: remove_empty_elements() - xml.py:95-105
 * 
 * 移除没有文本内容的元素（不包括root元素和自然为空的元素）
 * 
 * @param {Element} tree - XML树
 * @returns {Element} 清理后的树
 * 
 * @example
 * <body><p>有内容</p><p></p><p>  </p></body>
 * → <body><p>有内容</p></body>
 */
export function removeEmptyElements(tree) {
  if (!tree) return tree;
  
  // 收集要删除的元素（避免在遍历时修改）
  const toDelete = [];
  
  // 遍历所有元素
  const walker = document.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let currentNode = walker.nextNode();
  while (currentNode) {
    const element = currentNode;
    
    // 检查是否为空元素
    // - 没有子元素
    // - 文本内容为空或只有空白
    // - tail也为空或只有空白
    if (element.children.length === 0) {
      const hasText = textCharsTest(element.textContent);
      
      // 获取tail文本
      const nextSibling = element.nextSibling;
      const hasTail = nextSibling && 
                      nextSibling.nodeType === Node.TEXT_NODE && 
                      textCharsTest(nextSibling.textContent);
      
      if (!hasText && !hasTail) {
        // 跳过root元素和特定的自然为空的元素
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        const isNaturallyEmpty = tagName === 'graphic' || tagName === 'lb';
        const isRoot = element === tree;
        
        if (!isRoot && !isNaturallyEmpty) {
          toDelete.push(element);
        }
      }
    }
    
    currentNode = walker.nextNode();
  }
  
  // 删除收集的空元素
  for (const element of toDelete) {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  return tree;
}

/**
 * 去除重复标签
 * 对应Python: strip_double_tags() - xml.py:107-114
 * 
 * 合并连续的相同标签（特别是格式化标签如hi、del、ref）
 * 
 * @param {Element} tree - XML树
 * @returns {Element} 清理后的树
 * 
 * @example
 * <p><hi rend="#b">粗体1</hi><hi rend="#b">粗体2</hi></p>
 * → <p><hi rend="#b">粗体1粗体2</hi></p>
 */
export function stripDoubleTags(tree) {
  if (!tree) return tree;
  
  const toDelete = [];
  
  // 遍历所有元素
  const walker = document.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let currentNode = walker.nextNode();
  while (currentNode) {
    const element = currentNode;
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    
    // 只处理hi、del、ref等格式化标签
    if (tagName === 'hi' || tagName === 'del' || tagName === 'ref') {
      const nextSibling = element.nextSibling;
      
      // 跳过中间的文本节点（如果只是空白）
      let next = nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE) {
        const text = next.textContent || '';
        if (text.trim() === '') {
          next = next.nextSibling;
        } else {
          next = null;
        }
      }
      
      // 检查下一个元素是否相同
      if (next && next.nodeType === Node.ELEMENT_NODE) {
        const nextTagName = next.tagName ? next.tagName.toLowerCase() : '';
        
        if (nextTagName === tagName) {
          // 检查属性是否相同
          const rend = element.getAttribute('rend');
          const nextRend = next.getAttribute('rend');
          
          if (rend === nextRend) {
            // 合并：将下一个元素的内容追加到当前元素
            while (next.firstChild) {
              element.appendChild(next.firstChild);
            }
            
            // 标记删除下一个元素
            toDelete.push(next);
            
            // 如果有tail，也追加
            const nextNextSibling = next.nextSibling;
            if (nextNextSibling && nextNextSibling.nodeType === Node.TEXT_NODE) {
              const tailText = nextNextSibling.textContent;
              if (tailText) {
                element.appendChild(document.createTextNode(tailText));
              }
            }
          }
        }
      }
    }
    
    currentNode = walker.nextNode();
  }
  
  // 删除标记的元素
  for (const element of toDelete) {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  return tree;
}

/**
 * 清理属性
 * 对应Python: clean_attributes() - xml.py:138-144
 * 
 * 移除不在WITH_ATTRIBUTES白名单中的元素的所有属性
 * 
 * @param {Element} tree - XML树
 * @returns {Element} 清理后的树
 * 
 * @example
 * <p class="test">文本</p>  → <p>文本</p>
 * <hi rend="#b">粗体</hi>   → <hi rend="#b">粗体</hi> (保留)
 */
export function cleanAttributes(tree) {
  if (!tree) return tree;
  
  // 遍历所有元素
  const walker = document.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let currentNode = walker.nextNode();
  while (currentNode) {
    const element = currentNode;
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    
    // 如果不在白名单中，移除所有属性
    if (!WITH_ATTRIBUTES.has(tagName)) {
      // 获取所有属性名
      const attributeNames = Array.from(element.attributes).map(attr => attr.name);
      
      // 移除所有属性
      for (const attrName of attributeNames) {
        element.removeAttribute(attrName);
      }
    }
    
    currentNode = walker.nextNode();
  }
  
  return tree;
}

/**
 * 导出所有函数
 */
export default {
  deleteElement,
  mergeWithParent,
  removeEmptyElements,
  stripDoubleTags,
  cleanAttributes
};

