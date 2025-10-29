/**
 * 基线提取器
 * 对应 Python: trafilatura/baseline.py
 * 
 * 功能：
 * - 简单的文本提取（回退方案）
 * - 不考虑复杂结构
 * - 当主提取器失败时使用
 */

import { trim, textCharsTest } from '../utils/text-utils.js';
import { deleteElement } from '../utils/dom-utils.js';

/**
 * 修剪元素
 * 对应 Python: prune_elem()
 * 
 * @param {Element} elem - 元素
 * @returns {boolean} 是否保留
 */
function pruneElem(elem) {
  if (!elem) return false;
  
  const tagName = elem.tagName.toLowerCase();
  
  // 删除不需要的标签
  const unwantedTags = new Set([
    'script', 'style', 'noscript', 'iframe', 'embed', 'object'
  ]);
  
  if (unwantedTags.has(tagName)) {
    return false;
  }
  
  // 检查类名和ID - 只删除明显的广告和脚本
  const className = elem.getAttribute('class') || '';
  const id = elem.getAttribute('id') || '';
  const combined = (className + ' ' + id).toLowerCase();
  
  // 只删除明确的垃圾内容，保留article, main, content等
  const unwantedPatterns = [
    'advertisement', 'ad-container', 'banner-ad',
    'cookie-notice', 'popup-ad', 'modal-ad'
  ];
  
  for (const pattern of unwantedPatterns) {
    if (combined.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 清理树
 * 对应 Python: sanitize_tree()
 * 
 * @param {Element} tree - HTML树
 * @returns {Element} 清理后的树
 */
function sanitizeTree(tree) {
  const cleaned = tree.cloneNode(true);
  
  // 删除不需要的元素
  const allElements = Array.from(cleaned.querySelectorAll('*'));
  const toRemove = [];
  
  allElements.forEach(elem => {
    if (!pruneElem(elem)) {
      toRemove.push(elem);
    }
  });
  
  toRemove.forEach(elem => {
    if (elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  });
  
  return cleaned;
}

/**
 * 从段落中提取文本
 * 对应 Python: baseline_extract_paragraphs()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array<string>} 段落列表
 */
function baselineExtractParagraphs(tree) {
  const paragraphs = [];
  
  // 查找所有段落元素
  const pElems = tree.querySelectorAll('p');
  
  pElems.forEach(p => {
    const text = trim(p.textContent);
    
    // 过滤太短的文本
    if (text && text.length >= 50 && textCharsTest(text)) {
      paragraphs.push(text);
    }
  });
  
  return paragraphs;
}

/**
 * 从列表中提取文本
 * 对应 Python: baseline_extract_lists()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array<string>} 列表项文本
 */
function baselineExtractLists(tree) {
  const items = [];
  
  // 查找所有列表项
  const liElems = tree.querySelectorAll('li');
  
  liElems.forEach(li => {
    const text = trim(li.textContent);
    
    // 过滤太短的文本
    if (text && text.length >= 30 && textCharsTest(text)) {
      items.push(text);
    }
  });
  
  return items;
}

/**
 * 从blockquote中提取文本
 * 对应 Python: baseline_extract_blockquotes()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array<string>} 引用文本
 */
function baselineExtractBlockquotes(tree) {
  const quotes = [];
  
  const blockquotes = tree.querySelectorAll('blockquote, q');
  
  blockquotes.forEach(bq => {
    const text = trim(bq.textContent);
    
    if (text && text.length >= 40 && textCharsTest(text)) {
      quotes.push(text);
    }
  });
  
  return quotes;
}

/**
 * 从代码块中提取文本
 * 对应 Python: baseline_extract_code()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array<string>} 代码块文本
 */
function baselineExtractCode(tree) {
  const codeBlocks = [];
  
  const codes = tree.querySelectorAll('pre, code');
  
  codes.forEach(code => {
    const text = trim(code.textContent);
    
    if (text && text.length >= 20) {
      codeBlocks.push(text);
    }
  });
  
  return codeBlocks;
}

/**
 * 从div中提取文本
 * 对应 Python: baseline_extract_divs()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array<string>} div文本
 */
function baselineExtractDivs(tree) {
  const divTexts = [];
  
  const divs = tree.querySelectorAll('div');
  
  divs.forEach(div => {
    // 只处理没有块级子元素的div
    const hasBlockChildren = Array.from(div.children).some(child => {
      const tag = child.tagName.toLowerCase();
      return ['p', 'div', 'article', 'section', 'ul', 'ol', 'table'].includes(tag);
    });
    
    if (!hasBlockChildren) {
      const text = trim(div.textContent);
      
      if (text && text.length >= 50 && textCharsTest(text)) {
        divTexts.push(text);
      }
    }
  });
  
  return divTexts;
}

/**
 * 检测链接密度
 * 对应 Python: check_link_density()
 * 
 * @param {string} text - 文本内容
 * @param {Element} elem - 元素
 * @returns {boolean} 是否链接密度过高
 */
function checkLinkDensity(text, elem) {
  if (!text || !elem) return false;
  
  const links = elem.querySelectorAll('a');
  if (links.length === 0) return false;
  
  let linkTextLength = 0;
  links.forEach(link => {
    linkTextLength += link.textContent.length;
  });
  
  // 如果链接文本超过总文本的50%，认为链接密度过高
  return linkTextLength > text.length * 0.5;
}

/**
 * 基线提取 - 主函数
 * 对应 Python: baseline()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array} [body, text, length]
 */
export function baseline(tree) {
  const body = document.createElement('body');
  let allText = [];
  let totalLength = 0;
  
  // 清理树
  const cleanedTree = sanitizeTree(tree);
  
  // 提取不同类型的内容
  const paragraphs = baselineExtractParagraphs(cleanedTree);
  const lists = baselineExtractLists(cleanedTree);
  const quotes = baselineExtractBlockquotes(cleanedTree);
  const codes = baselineExtractCode(cleanedTree);
  const divs = baselineExtractDivs(cleanedTree);
  
  // 优先级：段落 > 列表 > 引用 > 代码 > div
  
  // 添加段落
  paragraphs.forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    body.appendChild(p);
    allText.push(text);
    totalLength += text.length;
  });
  
  // 添加列表
  if (lists.length > 0) {
    const list = document.createElement('list');
    lists.forEach(text => {
      const item = document.createElement('item');
      item.textContent = text;
      list.appendChild(item);
      allText.push(text);
      totalLength += text.length;
    });
    body.appendChild(list);
  }
  
  // 添加引用
  quotes.forEach(text => {
    const quote = document.createElement('quote');
    quote.textContent = text;
    body.appendChild(quote);
    allText.push(text);
    totalLength += text.length;
  });
  
  // 添加代码块
  codes.forEach(text => {
    const code = document.createElement('code');
    code.textContent = text;
    body.appendChild(code);
    allText.push(text);
    totalLength += text.length;
  });
  
  // 如果其他方式提取的内容不够，添加div
  if (totalLength < 200 && divs.length > 0) {
    divs.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      body.appendChild(p);
      allText.push(text);
      totalLength += text.length;
    });
  }
  
  const combinedText = allText.join('\n\n').trim();
  
  return [body, combinedText, totalLength];
}

/**
 * 基线文本提取（最简单的方法）
 * 对应 Python: basic_baseline()
 * 
 * @param {Element} tree - HTML树
 * @returns {string} 提取的文本
 */
export function basicBaseline(tree) {
  if (!tree) return '';
  
  // 删除脚本和样式
  const scripts = tree.querySelectorAll('script, style, noscript');
  scripts.forEach(s => s.remove());
  
  // 获取body内容
  let body = tree.querySelector('body');
  if (!body) {
    body = tree;
  }
  
  // 提取文本
  const text = body.textContent || '';
  
  // 清理空白
  const lines = text.split('\n')
    .map(line => trim(line))
    .filter(line => line.length > 0);
  
  return lines.join('\n');
}

/**
 * 从特定区域提取文本
 * 对应 Python: extract_from_area()
 * 
 * @param {Element} tree - HTML树
 * @param {string} selector - CSS选择器
 * @returns {string} 提取的文本
 */
export function extractFromArea(tree, selector) {
  const area = tree.querySelector(selector);
  if (!area) return '';
  
  // 清理树
  const cleaned = sanitizeTree(area);
  
  // 提取所有文本
  const paragraphs = baselineExtractParagraphs(cleaned);
  const lists = baselineExtractLists(cleaned);
  
  const allTexts = [...paragraphs, ...lists];
  return allTexts.join('\n\n');
}

/**
 * 尝试从常见内容区域提取
 * 对应 Python: try_content_areas()
 * 
 * @param {Element} tree - HTML树
 * @returns {Array} [body, text, length]
 */
export function tryContentAreas(tree) {
  // 常见内容区域选择器
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '#content',
    '.content',
    '#main',
    '.main',
    '#article',
    '.article',
    '.post-content',
    '.entry-content',
  ];
  
  for (const selector of selectors) {
    const area = tree.querySelector(selector);
    if (area) {
      console.debug(`Found content area: ${selector}`);
      return baseline(area);
    }
  }
  
  // 如果找不到特定区域，使用整个树
  return baseline(tree);
}

/**
 * 智能基线提取
 * 结合多种策略
 * 
 * @param {Element} tree - HTML树
 * @returns {Array} [body, text, length]
 */
export function smartBaseline(tree) {
  // 1. 尝试从内容区域提取
  const [body1, text1, len1] = tryContentAreas(tree);
  
  // 如果提取到足够的内容，返回
  if (len1 >= 200) {
    return [body1, text1, len1];
  }
  
  // 2. 如果不够，尝试整个页面
  const [body2, text2, len2] = baseline(tree);
  
  // 返回内容更多的结果
  if (len2 > len1) {
    return [body2, text2, len2];
  }
  
  return [body1, text1, len1];
}

// 导出
export default {
  baseline,
  basicBaseline,
  extractFromArea,
  tryContentAreas,
  smartBaseline,
};

