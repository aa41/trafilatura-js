/**
 * DOM辅助函数
 * 
 * 提供元素位置和上下文检查的辅助函数
 * 对应Python模块: trafilatura/utils.py (辅助函数部分)
 * 
 * @module utils/dom-helpers
 */

/**
 * 检查元素是否在列表项(item)中
 * 对应Python: is_element_in_item() - utils.py:492-499
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否在item中
 */
export function isElementInItem(element) {
  if (!element || !element.closest) return false;
  return element.closest('item') !== null;
}

/**
 * 检查元素是否是列表项中的第一个元素
 * 对应Python: is_first_element_in_item() - utils.py:502-519
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否是item中的第一个元素
 */
export function isFirstElementInItem(element) {
  if (!element) return false;
  
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  
  // 如果元素本身就是item且有文本
  if (tagName === 'item') {
    const firstChild = element.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE && firstChild.textContent.trim()) {
      return true;
    }
  }
  
  // 查找item祖先
  let current = element;
  let itemAncestor = null;
  
  while (current) {
    const currentTag = current.tagName ? current.tagName.toLowerCase() : '';
    if (currentTag === 'item') {
      itemAncestor = current;
      break;
    }
    current = current.parentElement;
  }
  
  if (!itemAncestor) {
    return false;
  }
  
  // 如果item没有文本，则是第一个元素
  const firstChild = itemAncestor.firstChild;
  if (!firstChild || firstChild.nodeType !== Node.TEXT_NODE || !firstChild.textContent.trim()) {
    return true;
  }
  
  return false;
}

/**
 * 检查元素是否是列表项中的最后一个元素
 * 对应Python: is_last_element_in_item() - utils.py:522-536
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否是item中的最后一个元素
 */
export function isLastElementInItem(element) {
  if (!element) return false;
  
  // 首先检查是否在item中
  if (!isElementInItem(element)) {
    return false;
  }
  
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  
  // 如果元素本身就是item
  if (tagName === 'item') {
    // 纯文本item（没有子元素）
    return element.children.length === 0;
  }
  
  // 元素在item中
  const nextElement = element.nextElementSibling;
  if (!nextElement) {
    return true;
  }
  
  const nextTag = nextElement.tagName ? nextElement.tagName.toLowerCase() : '';
  return nextTag === 'item';
}

/**
 * 检查元素是否在表格单元格中
 * 对应Python: is_in_table_cell() - utils.py:539-542
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否在cell中
 */
export function isInTableCell(element) {
  if (!element || !element.closest) return false;
  return element.closest('cell') !== null;
}

/**
 * 检查元素是否是单元格中的最后一个元素
 * 对应Python: is_last_element_in_cell() - utils.py:545-551
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否是cell中的最后一个元素
 */
export function isLastElementInCell(element) {
  if (!element) return false;
  
  const parent = element.parentElement;
  if (!parent) return false;
  
  const parentTag = parent.tagName ? parent.tagName.toLowerCase() : '';
  if (parentTag !== 'cell') {
    return false;
  }
  
  // 检查是否是最后一个元素子节点
  const elements = Array.from(parent.children);
  return elements.length > 0 && elements[elements.length - 1] === element;
}

/**
 * 导出所有函数
 */
export default {
  isElementInItem,
  isFirstElementInItem,
  isLastElementInItem,
  isInTableCell,
  isLastElementInCell
};

