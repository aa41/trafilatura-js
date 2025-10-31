/**
 * HTML树清理函数
 * 
 * 对应Python模块: trafilatura/htmlprocessing.py (tree_cleaning, prune_html, prune_unwanted_nodes)
 * 修剪HTML树，移除不需要的元素
 * 
 * @module processing/cleaning
 */

import { deleteElement, stripTags, copyTree, getTextContent } from '../utils/dom.js';
import {
  MANUALLY_CLEANED,
  MANUALLY_STRIPPED,
  PRESERVE_IMG_CLEANING,
  CUT_EMPTY_ELEMS
} from '../settings/constants.js';

/**
 * 清理HTML树
 * 对应Python: tree_cleaning() - htmlprocessing.py:50-82
 * 
 * 通过丢弃不需要的元素来修剪树
 * 
 * @param {Element} tree - HTML树
 * @param {Extractor} options - 提取器配置
 * @returns {Element} 清理后的树
 */
export function treeCleaning(tree, options) {
  if (!tree) {
    return null;
  }
  
  // 1. 确定清理策略，使用数组保持确定性
  let cleaningList = [...MANUALLY_CLEANED];
  let strippingList = [...MANUALLY_STRIPPED];
  
  // 2. 处理表格
  if (!options.tables) {
    // 不保留表格，删除所有表格元素
    cleaningList.push('table', 'td', 'th', 'tr');
  } else {
    // 保留表格，但修复figure内的table
    // 防止这个问题: https://github.com/adbar/trafilatura/issues/301
    // XPath: .//figure[descendant::table] -> CSS: figure:has(table)
    const figures = Array.from(tree.querySelectorAll('figure table'));
    for (const table of figures) {
      // 将包含表格的figure转换为div
      let figure = table.closest('figure');
      if (figure) {
        // 创建新的div元素替换figure
        const div = document.createElement('div');
        while (figure.firstChild) {
          div.appendChild(figure.firstChild);
        }
        if (figure.parentNode) {
          figure.parentNode.replaceChild(div, figure);
        }
      }
    }
  }
  
  // 3. 处理图片
  if (options.images) {
    // 保留图片，移除清理列表中的图片容器元素
    cleaningList = cleaningList.filter(e => !PRESERVE_IMG_CLEANING.has(e));
    
    // 从stripping列表中移除img
    const imgIndex = strippingList.indexOf('img');
    if (imgIndex > -1) {
      strippingList.splice(imgIndex, 1);
    }
  }
  
  // 4. 剥离目标元素（保留内容）
  stripTags(tree, strippingList);
  
  // 5. 删除目标元素（包括内容）
  if (options.focus === 'recall' && tree.querySelector('p')) {
    // 召回模式：如果删除后没有段落，则恢复
    const treeCopy = copyTree(tree, true);
    
    for (const tagName of cleaningList) {
      const elements = Array.from(tree.getElementsByTagName(tagName));
      for (const element of elements) {
        deleteElement(element);
      }
    }
    
    // 检查是否还有段落
    if (!tree.querySelector('p')) {
      tree = treeCopy;
    }
  } else {
    // 平衡模式和精确模式：直接删除
    for (const tagName of cleaningList) {
      const elements = Array.from(tree.getElementsByTagName(tagName));
      for (const element of elements) {
        deleteElement(element);
      }
    }
  }
  
  // 6. 修剪空元素
  return pruneHtml(tree, options.focus);
}

/**
 * 修剪空元素
 * 对应Python: prune_html() - htmlprocessing.py:85-92
 * 
 * 删除选定的空元素以节省空间和处理时间
 * 
 * @param {Element} tree - HTML树
 * @param {string} [focus='balanced'] - 焦点模式 (balanced, precision, recall)
 * @returns {Element} 修剪后的树
 */
export function pruneHtml(tree, focus = 'balanced') {
  if (!tree) {
    return null;
  }
  
  const keepTail = focus !== 'precision';
  
  // 查找所有空元素（不包含子节点）
  // XPath: .//processing-instruction()|.//*[not(node())]
  const allElements = Array.from(tree.getElementsByTagName('*'));
  const emptyElements = allElements.filter(elem => {
    // 没有子节点且没有文本内容
    return !elem.hasChildNodes() || 
           (elem.childNodes.length === 0 && !elem.textContent.trim());
  });
  
  // 删除属于CUT_EMPTY_ELEMS的空元素
  for (const element of emptyElements) {
    const tagName = element.tagName.toLowerCase();
    if (CUT_EMPTY_ELEMS.has(tagName)) {
      deleteElement(element, keepTail);
    }
  }
  
  // 注意：浏览器DOM通常不保留处理指令（<?xml, <?php等）
  // 所以不需要专门处理
  
  return tree;
}

/**
 * 修剪不需要的节点
 * 对应Python: prune_unwanted_nodes() - htmlprocessing.py:95-114
 * 
 * 通过移除不需要的部分来修剪HTML树
 * 
 * @param {Element} tree - HTML树
 * @param {Array<Function>} nodelist - XPath函数数组
 * @param {boolean} [withBackup=false] - 是否在删除过多时恢复备份
 * @returns {Element} 修剪后的树
 */
export function pruneUnwantedNodes(tree, nodelist, withBackup = false) {
  if (!tree || !nodelist || nodelist.length === 0) {
    return tree;
  }
  
  let backup = null;
  let oldLen = 0;
  
  // 1. 如果需要备份，保存原始长度和副本
  if (withBackup) {
    const textContent = getTextContent(tree);
    oldLen = textContent ? textContent.length : 0;
    backup = copyTree(tree, true);
  }
  
  // 2. 遍历XPath表达式并删除匹配的节点
  for (const xpathFunc of nodelist) {
    if (typeof xpathFunc !== 'function') {
      continue;
    }
    
    try {
      const subtrees = xpathFunc(tree);
      for (const subtree of subtrees) {
        // tail文本默认由deleteElement()保留
        deleteElement(subtree);
      }
    } catch (error) {
      console.warn('Error applying XPath in pruneUnwantedNodes:', error);
    }
  }
  
  // 3. 如果有备份，检查是否删除了太多内容
  if (withBackup && backup) {
    const textContent = getTextContent(tree);
    const newLen = textContent ? textContent.length : 0;
    
    // 根据focus设置调整阈值
    // Python: 1/7 是默认值，recall模式更宽松，precision模式更严格
    let threshold = oldLen / 7;
    
    // 这里不传递focus参数，因为withBackup通常在baseline等场景使用
    // 保持默认的1/7阈值与Python一致
    if (newLen <= threshold) {
      return backup;
    }
  }
  
  return tree;
}

/**
 * 应用基础清理
 * 
 * 应用基本的XPath清理规则
 * 
 * @param {Element} tree - HTML树
 * @param {Array<Function>} xpathList - XPath函数数组
 * @returns {Element} 清理后的树
 */
export function applyBasicCleaning(tree, xpathList) {
  return pruneUnwantedNodes(tree, xpathList, false);
}

/**
 * 检查元素是否为空
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 如果元素为空则返回true
 */
export function isEmpty(element) {
  if (!element) {
    return true;
  }
  
  // 检查是否有子元素
  if (element.children.length > 0) {
    return false;
  }
  
  // 检查文本内容
  const text = element.textContent;
  return !text || text.trim().length === 0;
}

/**
 * 批量删除元素
 * 
 * @param {Element} tree - HTML树
 * @param {string} selector - CSS选择器
 * @param {boolean} [keepTail=true] - 是否保留尾部文本
 */
export function bulkDeleteElements(tree, selector, keepTail = true) {
  if (!tree || !selector) {
    return;
  }
  
  try {
    const elements = Array.from(tree.querySelectorAll(selector));
    for (const element of elements) {
      deleteElement(element, keepTail);
    }
  } catch (error) {
    console.warn(`Error in bulkDeleteElements with selector "${selector}":`, error);
  }
}

/**
 * 批量剥离标签
 * 
 * @param {Element} tree - HTML树
 * @param {Array<string>} tagNames - 要剥离的标签名数组
 */
export function bulkStripTags(tree, tagNames) {
  if (!tree || !tagNames || tagNames.length === 0) {
    return;
  }
  
  stripTags(tree, tagNames);
}

/**
 * 移除隐藏元素
 * 
 * @param {Element} tree - HTML树
 */
export function removeHiddenElements(tree) {
  if (!tree) {
    return;
  }
  
  // 移除display:none的元素
  const hiddenElements = Array.from(tree.querySelectorAll('[style*="display:none"], [style*="display: none"]'));
  for (const element of hiddenElements) {
    deleteElement(element);
  }
  
  // 移除aria-hidden="true"的元素
  const ariaHidden = Array.from(tree.querySelectorAll('[aria-hidden="true"]'));
  for (const element of ariaHidden) {
    deleteElement(element);
  }
  
  // 移除包含hidden类的元素
  const hiddenByClass = Array.from(tree.querySelectorAll('[class*="hidden"], [class*="hide"]'));
  for (const element of hiddenByClass) {
    const className = element.className;
    if (typeof className === 'string' && 
        (className.includes(' hidden') || className.includes('hidden ') || 
         className === 'hidden' || className.includes('-hide'))) {
      deleteElement(element);
    }
  }
}

// 导出
export default {
  treeCleaning,
  pruneHtml,
  pruneUnwantedNodes,
  applyBasicCleaning,
  isEmpty,
  bulkDeleteElements,
  bulkStripTags,
  removeHiddenElements
};

