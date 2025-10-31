/**
 * 链接密度测试算法
 * 
 * 对应Python模块: trafilatura/htmlprocessing.py (link_density_test, collect_link_info, link_density_test_tables)
 * 用于识别和移除链接密集的内容（可能是导航、侧边栏等样板内容）
 * 
 * @module processing/link-density
 */

import { trim } from '../utils/text.js';
import { getTextContent } from '../utils/dom.js';
import { isDevelopment } from '../utils/env.js';

/**
 * 收集链接信息的启发式方法
 * 对应Python: collect_link_info() - htmlprocessing.py:117-125
 * 
 * @param {Array<Element>} linksXpath - 链接元素数组
 * @returns {{totalLen: number, elemNum: number, shortElems: number, textList: Array<string>}} 链接统计信息
 */
export function collectLinkInfo(linksXpath) {
  if (!linksXpath || linksXpath.length === 0) {
    return {
      totalLen: 0,
      elemNum: 0,
      shortElems: 0,
      textList: []
    };
  }
  
  // 1. 提取和修剪文本
  const textList = [];
  for (const elem of linksXpath) {
    const text = trim(getTextContent(elem));
    if (text) {
      textList.push(text);
    }
  }
  
  // 2. 计算长度
  const lengths = textList.map(t => t.length);
  const totalLen = lengths.reduce((sum, len) => sum + len, 0);
  
  // 3. 计算短元素数量（长度<10的元素）
  // 较长的字符串会影响召回率以支持精确度
  const shortElems = lengths.filter(len => len < 10).length;
  
  return {
    totalLen,
    elemNum: textList.length,
    shortElems,
    textList
  };
}

/**
 * 链接密度测试
 * 对应Python: link_density_test() - htmlprocessing.py:128-165
 * 
 * 移除链接密集的部分（可能是样板内容）
 * 
 * @param {Element} element - 要测试的元素
 * @param {string} text - 元素的文本内容
 * @param {boolean} [favorPrecision=false] - 是否偏向精确模式
 * @returns {{isBoilerplate: boolean, linkTexts: Array<string>}} 测试结果
 */
export function linkDensityTest(element, text, favorPrecision = false) {
  if (!element || !text) {
    return { isBoilerplate: false, linkTexts: [] };
  }
  
  // 1. 查找所有ref元素（转换后的链接）
  const linksXpath = Array.from(element.querySelectorAll('ref'));
  
  if (linksXpath.length === 0) {
    return { isBoilerplate: false, linkTexts: [] };
  }
  
  let linkTexts = [];
  
  // 2. 快捷方式：只有一个链接的情况
  if (linksXpath.length === 1) {
    const lenThreshold = favorPrecision ? 10 : 100;
    const linkText = trim(getTextContent(linksXpath[0]));
    
    // 如果链接文本很长且占整个元素的90%以上，则认为是样板
    if (linkText.length > lenThreshold && linkText.length > text.length * 0.9) {
      return { isBoilerplate: true, linkTexts: [] };
    }
  }
  
  // 3. 根据元素类型和位置确定长度限制
  let limitLen;
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'p') {
    // 段落元素
    const nextSibling = element.nextElementSibling;
    limitLen = nextSibling === null ? 60 : 30;
  } else {
    // 其他元素
    const nextSibling = element.nextElementSibling;
    if (nextSibling === null) {
      limitLen = 300;
    } else {
      limitLen = 100;
    }
    // 可选的增强规则（Python中被注释了）:
    // if (/[.?!:]/.test(getTextContent(element))) {
    //   limitLen = 150;
    //   threshold = 0.66;
    // }
  }
  
  // 4. 如果元素长度小于限制，执行详细检查
  const elemLen = text.length;
  
  if (elemLen < limitLen) {
    const { totalLen, elemNum, shortElems, textList } = collectLinkInfo(linksXpath);
    
    linkTexts = textList;
    
    // 如果没有有效的链接文本，认为是样板
    if (elemNum === 0) {
      return { isBoilerplate: true, linkTexts };
    }
    
    // 调试信息（在开发时可以启用）
    if (isDevelopment()) {
      console.debug(
        `Link density: link text/total: ${totalLen}/${elemLen} - ` +
        `short elems/total: ${shortElems}/${elemNum}`
      );
    }
    
    // 判断是否为样板内容：
    // 1. 链接文本占总文本的80%以上
    // 2. 或者：有多个链接且80%以上是短链接
    if (totalLen > elemLen * 0.8 || 
        (elemNum > 1 && shortElems / elemNum > 0.8)) {
      return { isBoilerplate: true, linkTexts };
    }
  }
  
  return { isBoilerplate: false, linkTexts };
}

/**
 * 表格的链接密度测试
 * 对应Python: link_density_test_tables() - htmlprocessing.py:168-180
 * 
 * 移除链接密集的表格（可能是样板内容）
 * 
 * @param {Element} element - 要测试的表格元素
 * @returns {boolean} 如果是样板内容则返回true
 */
export function linkDensityTestTables(element) {
  if (!element) {
    return false;
  }
  
  // 1. 获取表格文本内容
  const textContent = getTextContent(element);
  if (!textContent || textContent.trim().length === 0) {
    return true; // 空表格，认为是样板
  }
  
  const elemLen = textContent.length;
  
  // 2. 查找所有链接（ref元素）
  const links = Array.from(element.querySelectorAll('ref'));
  
  if (links.length === 0) {
    return false; // 没有链接，不是样板
  }
  
  // 3. 收集链接信息
  const { totalLen, elemNum } = collectLinkInfo(links);
  
  // 如果没有有效的链接文本，认为是样板
  if (elemNum === 0) {
    return true;
  }
  
  // 调试信息
  if (isDevelopment()) {
    console.debug(
      `Table link density: link text/total: ${totalLen}/${elemLen}`
    );
  }
  
  // 4. 判断：链接文本占表格总文本的50%以上，则认为是样板
  return totalLen > elemLen * 0.5;
}

/**
 * 计算元素的链接密度比率
 * 
 * @param {Element} element - 要计算的元素
 * @returns {number} 链接密度比率 (0-1)
 */
export function calculateLinkDensity(element) {
  if (!element) {
    return 0;
  }
  
  const textContent = getTextContent(element);
  if (!textContent || textContent.trim().length === 0) {
    return 0;
  }
  
  const elemLen = textContent.length;
  const links = Array.from(element.querySelectorAll('ref, a'));
  
  if (links.length === 0) {
    return 0;
  }
  
  const { totalLen } = collectLinkInfo(links);
  
  return totalLen / elemLen;
}

/**
 * 检查元素是否为导航元素
 * 
 * 基于链接密度和其他启发式规则
 * 
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 如果是导航元素则返回true
 */
export function isNavigationElement(element) {
  if (!element) {
    return false;
  }
  
  // 1. 检查标签名
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  const navTags = ['nav', 'header', 'footer', 'aside'];
  if (navTags.includes(tagName)) {
    return true;
  }
  
  // 2. 检查类名和ID
  const className = element.className || '';
  const id = element.id || '';
  const combined = (className + ' ' + id).toLowerCase();
  
  const navIndicators = [
    'nav', 'navigation', 'menu', 'sidebar', 'widget',
    'footer', 'header', 'breadcrumb', 'toolbar'
  ];
  
  for (const indicator of navIndicators) {
    if (combined.includes(indicator)) {
      return true;
    }
  }
  
  // 2. 检查链接密度
  const linkDensity = calculateLinkDensity(element);
  
  // 链接密度超过60%，可能是导航
  if (linkDensity > 0.6) {
    return true;
  }
  
  // 3. 检查链接数量
  const links = element.querySelectorAll('a, ref');
  const textLength = getTextContent(element).length;
  
  // 如果平均每个链接的文本很短，可能是导航
  if (links.length > 5 && textLength / links.length < 15) {
    return true;
  }
  
  return false;
}

/**
 * 批量检查元素列表
 * 
 * @param {Array<Element>} elements - 元素数组
 * @param {boolean} [favorPrecision=false] - 是否偏向精确模式
 * @returns {Array<{element: Element, isBoilerplate: boolean, linkTexts: Array<string>}>} 检查结果
 */
export function batchLinkDensityTest(elements, favorPrecision = false) {
  if (!elements || elements.length === 0) {
    return [];
  }
  
  return elements.map(element => {
    const text = getTextContent(element);
    const result = linkDensityTest(element, text, favorPrecision);
    
    return {
      element,
      isBoilerplate: result.isBoilerplate,
      linkTexts: result.linkTexts
    };
  });
}

/**
 * 根据链接密度确定元素并删除被识别为样板的元素
 * 对应Python: delete_by_link_density() - htmlprocessing.py:187-215
 * 
 * @param {Element} subtree - 子树元素
 * @param {string} tagname - 要检查的标签名
 * @param {boolean} backtracking - 是否启用回溯
 * @param {boolean} favorPrecision - 是否偏向精确模式
 * @returns {Element} 处理后的子树
 */
export function deleteByLinkDensity(subtree, tagname, backtracking = false, favorPrecision = false) {
  if (!subtree || !tagname) {
    return subtree;
  }
  
  const deletions = [];
  
  // 对应Python: len_threshold = 200 if favor_precision else 100
  const lenThreshold = favorPrecision ? 200 : 100;
  // 对应Python: depth_threshold = 1 if favor_precision else 3
  const depthThreshold = favorPrecision ? 1 : 3;
  
  // 对应Python: for elem in subtree.iter(tagname):
  const elements = Array.from(subtree.querySelectorAll(tagname));
  
  for (const elem of elements) {
    // 对应Python: elemtext = trim(elem.text_content())
    const elemtext = trim(getTextContent(elem));
    
    // 对应Python: result, templist = link_density_test(elem, elemtext, favor_precision)
    const {isBoilerplate, linkTexts} = linkDensityTest(elem, elemtext, favorPrecision);
    
    // 对应Python: if result or (backtracking and templist and 0 < len(elemtext) < len_threshold and len(elem) >= depth_threshold):
    if (isBoilerplate || (
      backtracking &&
      linkTexts &&
      linkTexts.length > 0 &&
      elemtext.length > 0 &&
      elemtext.length < lenThreshold &&
      elem.children.length >= depthThreshold
    )) {
      deletions.push(elem);
    }
  }
  
  // 对应Python: for elem in dict.fromkeys(deletions):
  // dict.fromkeys()用于去重，我们使用Set
  const uniqueDeletions = [...new Set(deletions)];
  
  for (const elem of uniqueDeletions) {
    // 对应Python: delete_element(elem)
    // 默认keep_tail=True
    if (elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  }
  
  return subtree;
}

// 导出
export default {
  collectLinkInfo,
  linkDensityTest,
  linkDensityTestTables,
  calculateLinkDensity,
  isNavigationElement,
  batchLinkDensityTest,
  deleteByLinkDensity
};

