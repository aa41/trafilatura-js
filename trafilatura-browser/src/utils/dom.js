/**
 * DOM处理工具函数
 * 
 * 对应Python模块: trafilatura/utils.py 和 trafilatura/htmlprocessing.py
 * 实现HTML加载、元素操作等功能
 * 
 * @module utils/dom
 */

/**
 * 加载HTML字符串并解析为DOM树
 * 对应Python函数: load_html(htmlobject) - utils.py:221-263
 * 
 * Python实现逻辑:
 * 1. 检查是否已经是HtmlElement
 * 2. 解码文件（如果是bytes）
 * 3. 进行sanity检查
 * 4. 修复错误的HTML
 * 5. 使用lxml解析
 * 6. 验证解析结果
 * 
 * 浏览器版本简化:
 * - 不需要编码检测（浏览器自动处理）
 * - 使用DOMParser代替lxml
 * - 直接处理字符串
 * 
 * @param {string|Document|Element} htmlObject - HTML字符串或DOM对象
 * @returns {Document|Element|null} 解析后的DOM树，失败返回null
 * 
 * @example
 * const tree = loadHtml('<html><body><p>Test</p></body></html>');
 * const p = tree.querySelector('p');
 */
export function loadHtml(htmlObject) {
  // 1. 如果已经是Document或Element，直接返回
  if (htmlObject instanceof Document) {
    return htmlObject;
  }
  if (htmlObject instanceof Element) {
    return htmlObject;
  }

  // 2. 类型检查
  if (typeof htmlObject !== 'string') {
    console.error('incompatible input type:', typeof htmlObject);
    return null;
  }

  // 3. 基础检查
  const beginning = htmlObject.substring(0, 50).toLowerCase();
  const isDubious = !beginning.includes('html');

  // 4. 修复常见HTML错误
  htmlObject = repairFaultyHtml(htmlObject, beginning);

  // 5. 解析HTML
  let doc = null;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(htmlObject, 'text/html');

    // 检查解析错误
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('HTML parsing error:', parserError.textContent);
      return null;
    }
  } catch (error) {
    console.error('DOMParser failed:', error);
    return null;
  }

  // 6. 验证结果
  if (!doc || !doc.documentElement) {
    console.error('parsed tree is empty or invalid');
    return null;
  }

  // 7. 对于HTML片段（不包含<html>标签），浏览器会自动添加结构
  // 这是正常的，不应该拒绝
  // 只有在完全空或解析错误时才返回null

  return doc;
}

/**
 * 检查HTML是否可疑（是否包含html标签）
 * 对应Python函数: is_dubious_html(beginning) - utils.py:190-192
 * 
 * @param {string} beginning - HTML开头部分
 * @returns {boolean} 是否可疑
 */
function isDubiousHtml(beginning) {
  return !beginning.includes('html');
}

/**
 * 修复错误的HTML
 * 对应Python函数: repair_faulty_html(htmlstring, beginning) - utils.py:195-208
 * 
 * Python实现:
 * 1. 移除错误的DOCTYPE
 * 2. 修复自闭合的<html/>标签
 * 
 * @param {string} htmlString - HTML字符串
 * @param {string} beginning - HTML开头部分
 * @returns {string} 修复后的HTML
 */
function repairFaultyHtml(htmlString, beginning) {
  // 1. 修复DOCTYPE问题
  // Python: DOCTYPE_TAG = re.compile("^< ?! ?DOCTYPE[^>]*/[^<]*>", re.I)
  if (beginning.includes('doctype')) {
    const doctypeRegex = /^< ?! ?DOCTYPE[^>]*\/[^<]*>/i;
    const firstLineEnd = htmlString.indexOf('\n');
    if (firstLineEnd !== -1) {
      const firstLine = htmlString.substring(0, firstLineEnd);
      const rest = htmlString.substring(firstLineEnd);
      htmlString = firstLine.replace(doctypeRegex, '') + rest;
    } else {
      htmlString = htmlString.replace(doctypeRegex, '');
    }
  }

  // 2. 修复自闭合的<html/>标签
  // Python: FAULTY_HTML = re.compile(r"(<html.*?)\s*/>", re.I)
  const lines = htmlString.split('\n');
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    if (lines[i].includes('<html') && lines[i].endsWith('/>')) {
      htmlString = htmlString.replace(/(<html[^>]*?)\s*\/>/i, '$1>');
      break;
    }
  }

  return htmlString;
}

/**
 * 删除元素
 * 对应Python中的delete_element逻辑
 * 
 * @param {Element} element - 要删除的元素
 * @param {Object} options - 选项
 * @param {boolean} options.keepTail - 是否保留尾部文本（tail）
 */
export function deleteElement(element, options = {}) {
  if (!element || !element.parentNode) return;

  const { keepTail = true } = options;

  // 如果需要保留tail（元素后面的文本节点）
  if (keepTail && element.nextSibling && element.nextSibling.nodeType === Node.TEXT_NODE) {
    // tail在浏览器DOM中就是下一个文本节点，不需要特殊处理
    // 移除元素时会自动保留
  }

  element.parentNode.removeChild(element);
}

/**
 * 剥离标签但保留内容
 * 对应Python: lxml.etree.strip_tags(tree, *tags)
 * 
 * Python行为:
 * - 移除指定的标签
 * - 但保留标签内的文本和子元素
 * - 文本会合并到父元素
 * 
 * @param {Element} tree - DOM树
 * @param {...string} tags - 要剥离的标签名
 * 
 * @example
 * stripTags(tree, 'span', 'div')
 * stripTags(tree, 'a')
 */
export function stripTags(tree, ...tags) {
  if (!tree) return;

  // 如果tags是数组（单个参数），展开它
  if (tags.length === 1 && Array.isArray(tags[0])) {
    tags = tags[0];
  }

  // 转换为小写以便不区分大小写匹配
  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  // 收集所有要剥离的元素
  const elements = [];
  const walker = document.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        return tagSet.has(node.tagName.toLowerCase()) 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    elements.push(node);
  }

  // 剥离每个元素
  elements.forEach(element => {
    const parent = element.parentNode;
    if (!parent) return;

    // 将子节点移动到父节点
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }

    // 移除空元素
    parent.removeChild(element);
  });
}

/**
 * 剥离元素（移除特定标签名的所有元素）
 * 类似stripTags但会移除内容
 * 
 * @param {Element} tree - DOM树
 * @param {string} tag - 要移除的标签名
 */
export function stripElements(tree, tag) {
  if (!tree) return;

  const elements = Array.from(tree.querySelectorAll(tag));
  elements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}

/**
 * 修剪不需要的节点（根据XPath）
 * 对应Python中使用XPath删除节点的逻辑
 * 
 * @param {Element} tree - DOM树
 * @param {Array<string>} xpaths - XPath表达式数组
 * @param {Object} options - 选项
 * @param {boolean} options.withBackup - 是否在删除前备份
 * @returns {Element} 修剪后的树
 */
export function pruneUnwantedNodes(tree, xpaths, options = {}) {
  if (!tree || !xpaths || xpaths.length === 0) return tree;

  // 备份（如果需要）
  let backup = null;
  if (options.withBackup) {
    backup = tree.cloneNode(true);
  }

  // 对每个XPath表达式执行删除
  for (const xpath of xpaths) {
    try {
      // 使用evaluateXPath (将在xpath.js中实现)
      // 临时使用querySelector作为简化实现
      const selector = xpathToSelector(xpath);
      if (selector) {
        const elements = Array.from(tree.querySelectorAll(selector));
        elements.forEach(element => deleteElement(element, { keepTail: false }));
      }
    } catch (error) {
      console.warn('Failed to prune nodes with xpath:', xpath, error);
    }
  }

  return tree;
}

/**
 * 简化的XPath到CSS选择器转换
 * 这是临时实现，完整的XPath支持在xpath.js中
 * 
 * @param {string} xpath - XPath表达式
 * @returns {string|null} CSS选择器
 */
function xpathToSelector(xpath) {
  // 简单的转换规则
  // 完整实现会在xpath.js中
  if (!xpath) return null;

  // 移除 .// 前缀
  let selector = xpath.replace(/^\.?\/\//, '');

  // 处理常见模式
  selector = selector
    .replace(/\[@class="([^"]+)"\]/g, '.$1')
    .replace(/\[@id="([^"]+)"\]/g, '#$1')
    .replace(/\[contains\(@class,\s*"([^"]+)"\)\]/g, '[class*="$1"]')
    .replace(/\[contains\(@id,\s*"([^"]+)"\)\]/g, '[id*="$1"]');

  return selector || null;
}

/**
 * 复制DOM树
 * 
 * @param {Element|Document} tree - 要复制的树
 * @param {boolean} deep - 是否深拷贝
 * @returns {Element|Document} 复制的树
 */
export function copyTree(tree, deep = true) {
  if (!tree) return null;
  return tree.cloneNode(deep);
}

/**
 * 检查对象是否是Element
 * 
 * @param {*} obj - 要检查的对象
 * @returns {boolean} 是否是Element
 */
export function isElement(obj) {
  return obj instanceof Element || obj instanceof Document;
}

/**
 * 获取元素的文本内容（递归）
 * 类似Python的element.text_content()
 * 
 * @param {Element} element - DOM元素
 * @returns {string} 文本内容
 */
export function getTextContent(element) {
  if (!element) return '';
  return element.textContent || '';
}

/**
 * 设置元素的文本内容
 * 
 * @param {Element} element - DOM元素
 * @param {string} text - 文本内容
 */
export function setTextContent(element, text) {
  if (!element) return;
  element.textContent = text || '';
}

/**
 * 获取元素的尾部文本（tail）
 * 在lxml中，tail是元素后面的文本节点
 * 在浏览器DOM中，这是下一个文本节点
 * 
 * @param {Element} element - DOM元素
 * @returns {string} 尾部文本
 */
export function getTail(element) {
  if (!element) return '';
  const next = element.nextSibling;
  if (next && next.nodeType === Node.TEXT_NODE) {
    return next.textContent || '';
  }
  return '';
}

/**
 * 设置元素的尾部文本（tail）
 * 
 * @param {Element} element - DOM元素
 * @param {string} text - 尾部文本
 */
export function setTail(element, text) {
  if (!element) return;

  // 查找或创建下一个文本节点
  let next = element.nextSibling;
  if (next && next.nodeType === Node.TEXT_NODE) {
    next.textContent = text || '';
  } else if (text) {
    const textNode = document.createTextNode(text);
    if (element.parentNode) {
      element.parentNode.insertBefore(textNode, next);
    }
  }
}

/**
 * 创建新元素
 * 
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string} text - 文本内容
 * @returns {Element} 新元素
 */
export function createElement(tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  
  // 设置属性
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  }

  // 设置文本
  if (text) {
    element.textContent = text;
  }

  return element;
}

/**
 * 清除元素的所有属性
 * 
 * @param {Element} element - DOM元素
 */
export function clearAttributes(element) {
  if (!element || !element.attributes) return;

  // 收集所有属性名
  const attrNames = Array.from(element.attributes).map(attr => attr.name);
  
  // 删除所有属性
  attrNames.forEach(name => element.removeAttribute(name));
}

/**
 * 将一个元素的属性复制到另一个元素
 * 对应Python: copy_attributes(source, target)
 * 
 * @param {Element} source - 源元素
 * @param {Element} target - 目标元素
 */
export function copyAttributes(source, target) {
  if (!source || !target || !source.attributes) return;
  
  // 复制所有属性
  Array.from(source.attributes).forEach(attr => {
    target.setAttribute(attr.name, attr.value);
  });
}

/**
 * 迭代元素的所有子元素（递归）
 * 类似Python的element.iter()
 * 
 * @param {Element} element - 根元素
 * @param {string|Array<string>} tags - 要过滤的标签名（可选）
 * @returns {Generator<Element>} 元素生成器
 */
export function* iterElements(element, tags = null) {
  if (!element) return;

  const tagSet = tags ? new Set(Array.isArray(tags) ? tags : [tags]) : null;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (!tagSet || tagSet.has(node.tagName.toLowerCase())) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    yield node;
  }
}

/**
 * 查找元素的子元素（迭代）
 * 类似Python的element.iterdescendants()
 * 
 * @param {Element} element - 父元素
 * @param {string|Array<string>} tags - 要查找的标签名
 * @returns {Array<Element>} 子元素数组
 */
export function findDescendants(element, tags) {
  if (!element) return [];
  return Array.from(iterElements(element, tags));
}

// 导出用于测试
export const _internal = {
  isDubiousHtml,
  repairFaultyHtml,
  xpathToSelector
};

