/**
 * DOM 操作工具函数
 * 提供类似 lxml 的 DOM 操作接口
 */

import { textCharsTest } from './text-utils.js';

/**
 * 创建新元素
 * 对应 lxml.etree.Element()
 */
export function createElement(tagName, attributes = {}) {
  const elem = document.createElement(tagName);
  Object.keys(attributes).forEach(key => {
    elem.setAttribute(key, attributes[key]);
  });
  return elem;
}

/**
 * 创建子元素
 * 对应 lxml.etree.SubElement()
 */
export function createSubElement(parent, tagName, attributes = {}) {
  const elem = createElement(tagName, attributes);
  parent.appendChild(elem);
  return elem;
}

/**
 * 删除元素
 * 对应 Python: delete_element()
 * 
 * @param {Element} element - 要删除的元素
 * @param {boolean} keepTail - 是否保留尾部文本（在XML中tail是元素后的文本）
 */
export function deleteElement(element, keepTail = true) {
  if (!element || !element.parentNode) {
    return;
  }

  const parent = element.parentNode;

  if (keepTail && element.nextSibling && element.nextSibling.nodeType === Node.TEXT_NODE) {
    // 保留尾部文本
    const tailText = element.nextSibling.textContent;
    if (tailText && textCharsTest(tailText)) {
      // 将尾部文本移到父元素
      parent.insertBefore(document.createTextNode(tailText), element);
    }
  }

  parent.removeChild(element);
}

/**
 * 剥离标签但保留内容
 * 对应 lxml.etree.strip_tags()
 */
export function stripTags(element, ...tagNames) {
  const tagsSet = new Set(tagNames);

  // 递归处理所有匹配的标签
  function processNode(node) {
    if (!node) return;

    const children = Array.from(node.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (tagsSet.has(child.tagName.toLowerCase())) {
          // 提取子节点
          const childNodes = Array.from(child.childNodes);
          childNodes.forEach(grandChild => {
            node.insertBefore(grandChild, child);
          });
          node.removeChild(child);
        } else {
          processNode(child);
        }
      }
    });
  }

  processNode(element);
  return element;
}

/**
 * 剥离元素（删除匹配的元素及其内容）
 * 对应 lxml.etree.strip_elements()
 */
export function stripElements(element, ...tagNames) {
  const tagsSet = new Set(tagNames);

  function removeMatching(node) {
    if (!node) return;

    const children = Array.from(node.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (tagsSet.has(child.tagName.toLowerCase())) {
          node.removeChild(child);
        } else {
          removeMatching(child);
        }
      }
    });
  }

  removeMatching(element);
  return element;
}

/**
 * 复制元素属性
 * 对应 Python: copy_attributes()
 */
export function copyAttributes(destElem, srcElem) {
  if (!srcElem || !destElem) return;

  Array.from(srcElem.attributes).forEach(attr => {
    destElem.setAttribute(attr.name, attr.value);
  });
}

/**
 * 深拷贝元素
 */
export function deepCopyElement(element) {
  return element.cloneNode(true);
}

/**
 * 获取元素的所有文本内容（包括子元素）
 */
export function getIterText(element) {
  if (!element) return '';
  return element.textContent || '';
}

/**
 * 检查元素是否在表格单元格中
 * 对应 Python: is_in_table_cell()
 */
export function isInTableCell(elem) {
  if (!elem || !elem.parentNode) {
    return false;
  }

  let current = elem;
  while (current) {
    if (current.tagName && current.tagName.toLowerCase() === 'cell') {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/**
 * 检查元素是否在列表项中
 * 对应 Python: is_element_in_item()
 */
export function isElementInItem(element) {
  if (!element) return false;

  let current = element;
  while (current) {
    if (current.tagName && current.tagName.toLowerCase() === 'item') {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/**
 * 检查元素是否是列表项中的第一个元素
 * 对应 Python: is_first_element_in_item()
 */
export function isFirstElementInItem(element) {
  if (!element) return false;

  if (element.tagName && element.tagName.toLowerCase() === 'item' && element.textContent) {
    return true;
  }

  let current = element;
  let itemAncestor = null;

  while (current) {
    if (current.tagName && current.tagName.toLowerCase() === 'item') {
      itemAncestor = current;
      break;
    }
    current = current.parentNode;
  }

  if (!itemAncestor) {
    return false;
  }

  return !itemAncestor.textContent || itemAncestor.textContent.trim() === '';
}

/**
 * 检查元素是否是列表项中的最后一个元素
 * 对应 Python: is_last_element_in_item()
 */
export function isLastElementInItem(element) {
  if (!isElementInItem(element)) {
    return false;
  }

  if (element.tagName && element.tagName.toLowerCase() === 'item') {
    return element.children.length === 0;
  }

  const nextElement = element.nextElementSibling;
  if (!nextElement) {
    return true;
  }

  return nextElement.tagName && nextElement.tagName.toLowerCase() === 'item';
}

/**
 * XPath 辅助函数 - 使用 XPath 选择节点
 */
export function xpathSelect(contextNode, xpathExpression) {
  try {
    const result = document.evaluate(
      xpathExpression,
      contextNode,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }
    return nodes;
  } catch (e) {
    console.warn('XPath evaluation failed:', xpathExpression, e);
    return [];
  }
}

/**
 * 查找元素 - 类似 lxml 的 find()
 */
export function findElement(element, selector) {
  if (!element) return null;
  
  // 尝试作为 CSS 选择器
  try {
    return element.querySelector(selector);
  } catch (e) {
    // 可能是 XPath
    const results = xpathSelect(element, selector);
    return results.length > 0 ? results[0] : null;
  }
}

/**
 * 查找所有元素 - 类似 lxml 的 findall()
 */
export function findAllElements(element, selector) {
  if (!element) return [];
  
  // 尝试作为 CSS 选择器
  try {
    return Array.from(element.querySelectorAll(selector));
  } catch (e) {
    // 可能是 XPath
    return xpathSelect(element, selector);
  }
}

/**
 * 迭代特定标签的元素
 */
export function iterElements(element, ...tagNames) {
  if (!element) return [];
  
  if (tagNames.length === 0) {
    // 返回所有子元素
    return Array.from(element.getElementsByTagName('*'));
  }
  
  const result = [];
  tagNames.forEach(tagName => {
    result.push(...element.getElementsByTagName(tagName));
  });
  return result;
}

/**
 * 迭代后代元素（包括文本节点）
 */
export function iterDescendants(element, tagName = null) {
  if (!element) return [];
  
  if (tagName) {
    return Array.from(element.getElementsByTagName(tagName));
  }
  
  // 返回所有后代元素
  return Array.from(element.querySelectorAll('*'));
}

/**
 * 获取父元素
 */
export function getParent(element) {
  return element ? element.parentElement : null;
}

/**
 * 获取前一个兄弟元素
 */
export function getPrevious(element) {
  return element ? element.previousElementSibling : null;
}

/**
 * 获取后一个兄弟元素
 */
export function getNext(element) {
  return element ? element.nextElementSibling : null;
}

/**
 * 获取所有子元素
 */
export function getChildren(element) {
  return element ? Array.from(element.children) : [];
}

/**
 * 清除元素的所有属性
 */
export function clearAttrib(element) {
  if (!element) return;
  
  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }
}

/**
 * 转换元素为字符串（类似 lxml.tostring）
 */
export function elementToString(element, pretty = false) {
  if (!element) return '';
  
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(element);
  
  if (pretty) {
    // 简单的格式化
    return str.replace(/></g, '>\n<');
  }
  
  return str;
}

/**
 * 从字符串解析 HTML
 */
export function parseHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return doc.body || doc.documentElement;
}

/**
 * 检查元素是否有子元素
 */
export function hasChildren(element) {
  return element && element.children.length > 0;
}

/**
 * 检查元素是否有文本内容
 */
export function hasText(element) {
  return element && textCharsTest(element.textContent || '');
}

/**
 * 获取元素长度（子元素数量）
 */
export function getElementLength(element) {
  return element ? element.children.length : 0;
}

