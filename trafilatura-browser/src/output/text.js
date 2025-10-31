/**
 * 文本输出模块
 * 
 * 实现XML到文本的转换，支持纯文本和Markdown格式输出
 * 对应Python模块: trafilatura/xml.py (文本输出部分)
 * 
 * @module output/text
 */

import { 
  HI_FORMATTING, 
  NEWLINE_ELEMS, 
  SPECIAL_FORMATTING,
  MAX_TABLE_WIDTH 
} from './constants.js';
import { sanitize } from '../utils/text.js';
import {
  isElementInItem,
  isFirstElementInItem,
  isLastElementInItem,
  isInTableCell,
  isLastElementInCell
} from '../utils/dom-helpers.js';

/**
 * 替换元素文本（支持Markdown格式）
 * 对应Python: replace_element_text() - xml.py:254-305
 * 
 * 根据元素类型和格式选项，返回格式化的文本。
 * 必须单独处理tail文本。
 * 
 * @param {Element} element - 要处理的元素
 * @param {boolean} includeFormatting - 是否包含格式化（Markdown）
 * @returns {string} 格式化后的文本
 * 
 * @example
 * // 粗体
 * <hi rend="#b">粗体文本</hi> → "**粗体文本**"
 * 
 * // 标题
 * <head rend="h1">标题</head> → "# 标题"
 * 
 * // 链接
 * <ref target="url">文本</ref> → "[文本](url)"
 */
export function replaceElementText(element, includeFormatting) {
  if (!element) return '';
  
  // 获取元素的直接文本内容（不包括子元素的文本）
  // 这相当于Python的element.text
  let elemText = '';
  const firstChild = element.firstChild;
  if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
    elemText = firstChild.textContent || '';
  }
  
  // 如果没有直接文本，但是有子元素，我们需要所有文本
  if (!elemText) {
    elemText = element.textContent || '';
  }
  
  // 保存原始文本
  const originalText = elemText;
  
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  
  // 处理格式化：转换为Markdown
  if (includeFormatting && elemText) {
    // article, list, table: 清理空白
    if (tagName === 'article' || tagName === 'list' || tagName === 'table') {
      elemText = elemText.trim();
    }
    // head: 标题（# ## ###）
    else if (tagName === 'head') {
      try {
        const rend = element.getAttribute('rend') || '';
        const number = parseInt(rend[1]) || 2; // h1 → 1, h2 → 2, etc.
        elemText = '#'.repeat(number) + ' ' + elemText;
      } catch (e) {
        elemText = '## ' + elemText; // 默认h2
      }
    }
    // del: 删除线 (~~text~~)
    else if (tagName === 'del') {
      elemText = '~~' + elemText + '~~';
    }
    // hi: 格式化（粗体、斜体等）
    else if (tagName === 'hi') {
      const rend = element.getAttribute('rend');
      if (rend && HI_FORMATTING[rend]) {
        const marker = HI_FORMATTING[rend];
        elemText = marker + elemText + marker;
      }
    }
    // code: 代码块或内联代码
    else if (tagName === 'code') {
      // 检查是否包含换行或lb元素
      const hasNewline = elemText.includes('\n');
      const hasLb = element.querySelector('lb');
      
      if (hasNewline || hasLb) {
        // 代码块：```\ncode\n```
        // 处理lb元素
        if (hasLb) {
          const lbs = element.querySelectorAll('lb');
          for (const lb of lbs) {
            const tail = lb.nextSibling?.textContent || '';
            if (tail) {
              elemText = elemText + '\n' + tail;
            }
          }
        }
        elemText = '```\n' + elemText + '\n```\n';
      } else {
        // 内联代码：`code`
        elemText = '`' + elemText + '`';
      }
    }
  }
  
  // 处理链接
  if (tagName === 'ref') {
    if (elemText) {
      const linkText = '[' + elemText + ']';
      const target = element.getAttribute('target');
      if (target) {
        elemText = linkText + '(' + target + ')';
      } else {
        // 缺少target，只保留链接文本
        elemText = linkText;
      }
    }
    // 空链接，保持为空
  }
  
  // 处理表格单元格
  if (tagName === 'cell') {
    elemText = elemText.trim();
    
    // 如果不是单元格中的最后一个元素，添加空格
    if (elemText && !isLastElementInCell(element)) {
      elemText = elemText + ' ';
    }
  }
  
  // 处理列表项
  if (isFirstElementInItem(element) && !isInTableCell(element)) {
    elemText = '- ' + elemText;
  }
  
  return elemText;
}

/**
 * 递归处理元素及其子元素，转换为扁平的字符串列表
 * 对应Python: process_element() - xml.py:308-377
 * 
 * @param {Element} element - 要处理的元素
 * @param {Array<string>} returnList - 结果列表（递归累积）
 * @param {boolean} includeFormatting - 是否包含格式化
 * 
 * @example
 * const result = [];
 * processElement(element, result, true);
 * const text = result.join('');
 */
export function processElement(element, returnList, includeFormatting) {
  if (!element || !returnList) return;
  
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  
  // 表格单元格：如果是第一个单元格，添加 "|"
  if (tagName === 'cell') {
    const previousSibling = element.previousElementSibling;
    if (!previousSibling) {
      returnList.push('| ');
    }
  }
  
  // 处理元素的text（第一个子节点之前的文本）
  const elementText = element.firstChild?.nodeType === Node.TEXT_NODE 
    ? element.firstChild.textContent 
    : null;
  
  if (elementText) {
    returnList.push(replaceElementText(element, includeFormatting));
  }
  
  // 如果元素在表格单元格中且有tail，在这里处理tail
  // （除非是graphic元素）
  const firstTextNode = element.firstChild?.nodeType === Node.TEXT_NODE 
    ? element.firstChild 
    : null;
  const nextSibling = element.nextSibling;
  const hasTail = nextSibling?.nodeType === Node.TEXT_NODE;
  
  if (hasTail && tagName !== 'graphic' && isInTableCell(element)) {
    returnList.push(nextSibling.textContent.trim());
  }
  
  // 递归处理子元素
  for (const child of element.children) {
    processElement(child, returnList, includeFormatting);
  }
  
  // 处理没有text的元素
  if (!elementText) {
    // graphic: 图片
    if (tagName === 'graphic') {
      const title = element.getAttribute('title') || '';
      const alt = element.getAttribute('alt') || '';
      const src = element.getAttribute('src') || '';
      const text = (title + ' ' + alt).trim();
      
      returnList.push('![' + text + '](' + src + ')');
      
      // 处理graphic的tail
      if (hasTail) {
        returnList.push(' ' + nextSibling.textContent.trim());
      }
    }
    // 换行元素（没有文本的）
    else if (NEWLINE_ELEMS.has(tagName)) {
      // 表格行：添加分隔符
      if (tagName === 'row') {
        const cells = element.querySelectorAll('cell');
        const cellCount = cells.length;
        
        // 获取colspan/span信息
        const spanInfo = element.getAttribute('colspan') || element.getAttribute('span');
        let maxSpan = 1;
        if (spanInfo && !isNaN(parseInt(spanInfo))) {
          maxSpan = Math.min(parseInt(spanInfo), MAX_TABLE_WIDTH);
        }
        
        // 如果单元格数量少于maxSpan，填充额外的空单元格
        if (cellCount < maxSpan) {
          returnList.push('|'.repeat(maxSpan - cellCount) + '\n');
        }
        
        // 如果是表头行，添加分隔线
        const hasHeadCell = element.querySelector('cell[role="head"]');
        if (hasHeadCell) {
          returnList.push('\n|' + '---|'.repeat(maxSpan) + '\n');
        }
      } else {
        returnList.push('\n');
      }
    }
    // cell和item以外的无文本元素，不需要进一步处理
    else if (tagName !== 'cell' && tagName !== 'item') {
      return;
    }
  }
  
  // 处理结束标签后的文本和格式
  
  // 换行元素（不在cell中且不在item中）
  const isInCell = isInTableCell(element);
  const inItem = isElementInItem(element);
  const hasAncestorCell = element.closest && element.closest('cell');
  
  if (NEWLINE_ELEMS.has(tagName) && !hasAncestorCell && !inItem) {
    // spacing hack: 添加特殊字符用于格式化
    if (includeFormatting && tagName !== 'row') {
      returnList.push('\n\u2424\n'); // ␤ (symbol for space)
    } else {
      returnList.push('\n');
    }
  }
  // 表格单元格结束
  else if (tagName === 'cell') {
    returnList.push(' | ');
  }
  // 非特殊格式元素且不是单元格中的最后一个元素
  else if (!SPECIAL_FORMATTING.has(tagName) && !isLastElementInCell(element)) {
    returnList.push(' ');
  }
  
  // 处理tail文本（结束标签后的文本）
  // 除非在表格单元格中（已在前面处理）
  if (hasTail && !isInCell) {
    const tailText = nextSibling.textContent;
    if (inItem || tagName === 'list') {
      returnList.push(tailText.trim());
    } else {
      returnList.push(tailText);
    }
  }
  
  // 处理列表项结束
  if (isLastElementInItem(element) && !isInCell) {
    returnList.push('\n');
  }
}

/**
 * 将XML转换为纯文本格式，可选保留Markdown格式
 * 对应Python: xmltotxt() - xml.py:379-389
 * 
 * @param {Element} xmlOutput - XML输出树
 * @param {boolean} includeFormatting - 是否包含格式化（Markdown）
 * @returns {string} 文本输出
 * 
 * @example
 * const xml = loadHtml('<body><p>段落1</p><p>段落2</p></body>');
 * const text = xmlToTxt(xml, false);
 * // → "段落1\n\n段落2"
 * 
 * @example
 * const xml = loadHtml('<body><head rend="h1">标题</head><p>内容</p></body>');
 * const markdown = xmlToTxt(xml, true);
 * // → "# 标题\n\n内容"
 */
export function xmlToTxt(xmlOutput, includeFormatting) {
  if (!xmlOutput) {
    return '';
  }
  
  const returnList = [];
  
  // 遍历body的直接子元素
  const body = xmlOutput.tagName?.toLowerCase() === 'body' 
    ? xmlOutput 
    : xmlOutput.querySelector('body');
  
  if (!body) {
    // 如果没有body，处理整个树
    for (const child of xmlOutput.children) {
      processElement(child, returnList, includeFormatting);
    }
  } else {
    // 处理body的子元素
    for (const child of body.children) {
      processElement(child, returnList, includeFormatting);
    }
  }
  
  // 连接列表为字符串
  let result = returnList.join('');
  
  // 清理文本
  result = sanitize(result);
  
  return result;
}

/**
 * 导出所有函数
 */
export default {
  replaceElementText,
  processElement,
  xmlToTxt
};

