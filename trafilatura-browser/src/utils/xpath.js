/**
 * XPath工具函数
 * 
 * 浏览器环境的XPath支持
 * 使用document.evaluate() API
 * 
 * @module utils/xpath
 */

/**
 * 执行XPath表达式
 * 对应Python的lxml XPath功能
 * 
 * @param {string} expression - XPath表达式
 * @param {Node} contextNode - 上下文节点
 * @param {number} resultType - 结果类型（可选）
 * @returns {Array<Node>} 匹配的节点数组
 * 
 * @example
 * const nodes = evaluateXPath('.//p[@class="content"]', document.body);
 */
export function evaluateXPath(expression, contextNode, resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
  if (!expression || !contextNode) {
    return [];
  }

  try {
    const result = document.evaluate(
      expression,
      contextNode,
      null, // namespace resolver
      resultType,
      null
    );

    const nodes = [];
    
    // 根据结果类型处理
    if (resultType === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE ||
        resultType === XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE) {
      for (let i = 0; i < result.snapshotLength; i++) {
        nodes.push(result.snapshotItem(i));
      }
    } else if (resultType === XPathResult.FIRST_ORDERED_NODE_TYPE ||
               resultType === XPathResult.ANY_UNORDERED_NODE_TYPE) {
      if (result.singleNodeValue) {
        nodes.push(result.singleNodeValue);
      }
    } else if (resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE ||
               resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
      let node;
      while (node = result.iterateNext()) {
        nodes.push(node);
      }
    }

    return nodes;
  } catch (error) {
    console.warn('XPath evaluation failed:', expression, error);
    return [];
  }
}

/**
 * 编译XPath表达式（创建可重用的XPath求值器）
 * Python中可以预编译XPath以提高性能
 * 
 * @param {string} expression - XPath表达式
 * @returns {Function} 求值函数
 */
export function compileXPath(expression) {
  return function(contextNode) {
    return evaluateXPath(expression, contextNode);
  };
}

/**
 * 将XPath结果转换为数组
 * 便于处理和操作
 * 
 * @param {XPathResult} result - XPath结果
 * @returns {Array<Node>} 节点数组
 */
export function xpathToArray(result) {
  if (!result) return [];

  const nodes = [];
  
  try {
    if (result.resultType === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE ||
        result.resultType === XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE) {
      for (let i = 0; i < result.snapshotLength; i++) {
        nodes.push(result.snapshotItem(i));
      }
    } else if (result.singleNodeValue) {
      nodes.push(result.singleNodeValue);
    }
  } catch (error) {
    console.warn('Failed to convert XPath result to array:', error);
  }

  return nodes;
}

/**
 * 简化的XPath到CSS选择器转换
 * 用于不支持XPath的情况
 * 
 * @param {string} xpath - XPath表达式
 * @returns {string|null} CSS选择器
 */
export function xpathToSelector(xpath) {
  if (!xpath) return null;

  let selector = xpath;

  // 移除 .// 或 // 前缀
  selector = selector.replace(/^\.?\/\//, '');

  // 转换基本的XPath表达式
  // [@attribute="value"] → [attribute="value"]
  selector = selector
    .replace(/\[@class="([^"]+)"\]/g, '[class="$1"]')
    .replace(/\[@id="([^"]+)"\]/g, '[id="$1"]')
    .replace(/\[@([^=]+)="([^"]+)"\]/g, '[$1="$2"]');

  // contains()函数
  selector = selector
    .replace(/\[contains\(@class,\s*["']([^"']+)["']\)\]/g, '[class*="$1"]')
    .replace(/\[contains\(@id,\s*["']([^"']+)["']\)\]/g, '[id*="$1"]')
    .replace(/\[contains\(@([^,]+),\s*["']([^"']+)["']\)\]/g, '[$1*="$2"]');

  // starts-with()函数
  selector = selector
    .replace(/\[starts-with\(@class,\s*["']([^"']+)["']\)\]/g, '[class^="$1"]')
    .replace(/\[starts-with\(@id,\s*["']([^"']+)["']\)\]/g, '[id^="$1"]')
    .replace(/\[starts-with\(@([^,]+),\s*["']([^"']+)["']\)\]/g, '[$1^="$2"]');

  // ends-with()函数 (CSS3)
  selector = selector
    .replace(/\[ends-with\(@class,\s*["']([^"']+)["']\)\]/g, '[class$="$1"]')
    .replace(/\[ends-with\(@([^,]+),\s*["']([^"']+)["']\)\]/g, '[$1$="$2"]');

  // 或操作符 (|)
  selector = selector.replace(/\s*\|\s*/g, ', ');

  // 清理多余的空格
  selector = selector.trim();

  return selector || null;
}

/**
 * 批量执行XPath表达式
 * 
 * @param {Array<string>} expressions - XPath表达式数组
 * @param {Node} contextNode - 上下文节点
 * @returns {Array<Node>} 所有匹配的节点（去重）
 */
export function evaluateMultipleXPaths(expressions, contextNode) {
  if (!expressions || !contextNode) {
    return [];
  }

  const allNodes = [];
  const seenNodes = new Set();

  for (const expression of expressions) {
    const nodes = evaluateXPath(expression, contextNode);
    for (const node of nodes) {
      if (!seenNodes.has(node)) {
        seenNodes.add(node);
        allNodes.push(node);
      }
    }
  }

  return allNodes;
}

/**
 * 执行XPath并返回第一个匹配节点
 * 
 * @param {string} expression - XPath表达式
 * @param {Node} contextNode - 上下文节点
 * @returns {Node|null} 第一个匹配的节点
 */
export function evaluateXPathFirst(expression, contextNode) {
  const nodes = evaluateXPath(expression, contextNode, XPathResult.FIRST_ORDERED_NODE_TYPE);
  return nodes.length > 0 ? nodes[0] : null;
}

/**
 * 执行XPath并返回文本内容
 * 
 * @param {string} expression - XPath表达式
 * @param {Node} contextNode - 上下文节点
 * @returns {string} 文本内容
 */
export function evaluateXPathText(expression, contextNode) {
  const nodes = evaluateXPath(expression, contextNode);
  return nodes.map(node => node.textContent || '').join(' ').trim();
}

/**
 * 检查XPath表达式是否匹配任何节点
 * 
 * @param {string} expression - XPath表达式
 * @param {Node} contextNode - 上下文节点
 * @returns {boolean} 是否有匹配
 */
export function hasXPathMatch(expression, contextNode) {
  const nodes = evaluateXPath(expression, contextNode, XPathResult.FIRST_ORDERED_NODE_TYPE);
  return nodes.length > 0;
}

/**
 * 获取XPath匹配的节点数量
 * 
 * @param {string} expression - XPath表达式
 * @param {Node} contextNode - 上下文节点
 * @returns {number} 匹配数量
 */
export function countXPathMatches(expression, contextNode) {
  const nodes = evaluateXPath(expression, contextNode);
  return nodes.length;
}

// 常用XPath表达式的别名
export const commonXPaths = {
  // 内容区域
  article: './/article',
  main: './/main',
  content: './/*[contains(@class, "content") or contains(@id, "content")]',
  
  // 段落
  paragraphs: './/p',
  
  // 标题
  headings: './/h1 | .//h2 | .//h3 | .//h4 | .//h5 | .//h6',
  
  // 链接
  links: './/a[@href]',
  
  // 图片
  images: './/img[@src]',
  
  // 表格
  tables: './/table',
  
  // 列表
  lists: './/ul | .//ol',
  
  // 导航
  nav: './/nav | .//*[contains(@class, "nav") or contains(@id, "nav")]',
  
  // 页脚
  footer: './/footer | .//*[contains(@class, "footer") or contains(@id, "footer")]',
  
  // 侧边栏
  sidebar: './/aside | .//*[contains(@class, "sidebar") or contains(@id, "sidebar")]'
};

