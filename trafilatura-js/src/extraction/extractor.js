/**
 * 核心内容提取器
 * 对应 Python: trafilatura/main_extractor.py
 * 
 * 功能：
 * - 主要内容提取
 * - 评论提取
 * - 段落处理
 * - 标题处理
 * - 格式化处理
 */

import { trim, textCharsTest } from '../utils/text-utils.js';
import { deleteElement, createElement, createSubElement } from '../utils/dom-utils.js';
import {
  handleTextNode,
  processNode,
  convertTags,
} from '../processing/html-processing.js';
import { duplicateTest } from '../processing/deduplication.js';

// 标签集合
const P_FORMATTING = new Set(['hi', 'ref']);
const TABLE_ELEMS = new Set(['td', 'th']);
const TABLE_ALL = new Set(['td', 'th', 'hi']);
const FORMATTING = new Set(['hi', 'ref', 'span']);
const CODES_QUOTES = new Set(['code', 'quote']);
const NOT_AT_THE_END = new Set(['head', 'ref']);

/**
 * 格式化调试日志
 * 对应 Python: _log_event()
 * 
 * @param {string} msg - 消息
 * @param {string} tag - 标签名
 * @param {string} text - 文本内容
 */
function logEvent(msg, tag, text) {
  console.debug(`${msg}: ${tag} ${trim(text || '') || 'None'}`);
}

/**
 * 处理标题元素
 * 对应 Python: handle_titles()
 * 
 * @param {Element} element - 标题元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的标题
 */
export function handleTitles(element, options) {
  let title;
  
  // 无子元素
  if (element.children.length === 0) {
    title = processNode(element, options);
  }
  // 有子元素
  else {
    title = element.cloneNode(true);
    
    // 处理所有子元素
    Array.from(element.querySelectorAll('*')).forEach(child => {
      const processedChild = handleTextNode(child, options, false);
      
      if (processedChild) {
        title.appendChild(processedChild);
      }
      
      child.setAttribute('data-processed', 'done');
    });
  }
  
  // 检查是否有有效文本
  if (title && textCharsTest(title.textContent)) {
    return title;
  }
  
  return null;
}

/**
 * 处理格式化元素（b, i等转换为hi）
 * 对应 Python: handle_formatting()
 * 
 * @param {Element} element - 格式化元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的元素
 */
export function handleFormatting(element, options) {
  const formatting = processNode(element, options);
  
  if (!formatting) {
    return null;
  }
  
  // 修复孤立元素
  let parent = element.parentElement;
  if (!parent) {
    parent = element.previousElementSibling;
  }
  
  // 如果没有合适的父元素或父元素不在受保护列表中，包装在 <p> 中
  const FORMATTING_PROTECTED = new Set(['p', 'head', 'list', 'quote', 'code']);
  
  if (!parent || !FORMATTING_PROTECTED.has(parent.tagName.toLowerCase())) {
    const processedElement = document.createElement('p');
    processedElement.insertBefore(formatting, processedElement.firstChild);
    return processedElement;
  }
  
  return formatting;
}

/**
 * 添加子元素
 * 对应 Python: add_sub_element()
 * 
 * @param {Element} newChildElem - 新的子元素
 * @param {Element} subelem - 原始子元素
 * @param {Element} processedSubchild - 处理后的子元素
 */
function addSubElement(newChildElem, subelem, processedSubchild) {
  const subChildElem = document.createElement(processedSubchild.tagName);
  subChildElem.textContent = processedSubchild.textContent;
  
  // 复制 tail 属性
  const tail = processedSubchild.getAttribute('tail');
  if (tail) {
    subChildElem.setAttribute('tail', tail);
  }
  
  // 复制属性
  Array.from(subelem.attributes).forEach(attr => {
    subChildElem.setAttribute(attr.name, attr.value);
  });
  
  newChildElem.appendChild(subChildElem);
}

/**
 * 处理嵌套元素
 * 对应 Python: process_nested_elements()
 * 
 * @param {Element} child - 子元素
 * @param {Element} newChildElem - 新的子元素
 * @param {Extractor} options - 提取选项
 */
function processNestedElements(child, newChildElem, options) {
  newChildElem.textContent = child.textContent;
  
  // 遍历所有后代元素
  const descendants = Array.from(child.querySelectorAll('*'));
  
  descendants.forEach(subelem => {
    if (subelem.tagName.toLowerCase() === 'list') {
      const processedSubchild = handleLists(subelem, options);
      if (processedSubchild) {
        newChildElem.appendChild(processedSubchild);
      }
    } else {
      const processedSubchild = handleTextNode(subelem, options, false);
      if (processedSubchild) {
        addSubElement(newChildElem, subelem, processedSubchild);
      }
    }
    
    subelem.setAttribute('data-processed', 'done');
  });
}

/**
 * 更新元素的 rend 属性
 * 对应 Python: update_elem_rendition()
 * 
 * @param {Element} elem - 原始元素
 * @param {Element} newElem - 新元素
 */
function updateElemRendition(elem, newElem) {
  const rendAttr = elem.getAttribute('rend');
  if (rendAttr) {
    newElem.setAttribute('rend', rendAttr);
  }
}

/**
 * 检查元素是否包含文本
 * 对应 Python: is_text_element()
 * 
 * @param {Element} elem - 元素
 * @returns {boolean} 是否包含文本
 */
function isTextElement(elem) {
  return elem && textCharsTest(elem.textContent);
}

/**
 * 定义新元素
 * 对应 Python: define_newelem()
 * 
 * @param {Element} processedElem - 处理后的元素
 * @param {Element} origElem - 原始元素
 */
function defineNewelem(processedElem, origElem) {
  if (!processedElem) return;
  
  const childelem = document.createElement(processedElem.tagName);
  childelem.textContent = processedElem.textContent;
  
  const tail = processedElem.getAttribute('tail');
  if (tail) {
    childelem.setAttribute('tail', tail);
  }
  
  // 如果是图形元素，复制属性
  if (processedElem.tagName.toLowerCase() === 'graphic') {
    Array.from(processedElem.attributes).forEach(attr => {
      childelem.setAttribute(attr.name, attr.value);
    });
  }
  
  origElem.appendChild(childelem);
}

/**
 * 处理列表元素
 * 对应 Python: handle_lists()
 * 
 * @param {Element} element - 列表元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的列表
 */
export function handleLists(element, options) {
  const processedElement = document.createElement(element.tagName);
  
  // 如果元素有文本内容
  if (element.textContent && element.textContent.trim()) {
    const newChildElem = document.createElement('item');
    newChildElem.textContent = element.textContent;
    processedElement.appendChild(newChildElem);
  }
  
  // 处理所有 item 后代
  const items = element.querySelectorAll('item');
  
  items.forEach(child => {
    const newChildElem = document.createElement('item');
    
    // 无子元素
    if (child.children.length === 0) {
      const processedChild = processNode(child, options);
      
      if (processedChild) {
        newChildElem.textContent = processedChild.textContent || '';
        
        const tail = processedChild.getAttribute('tail');
        if (tail && tail.trim()) {
          newChildElem.textContent += ' ' + tail;
        }
        
        processedElement.appendChild(newChildElem);
      }
    }
    // 有子元素
    else {
      processNestedElements(child, newChildElem, options);
      
      const tail = child.getAttribute('tail');
      if (tail && tail.trim()) {
        const children = Array.from(newChildElem.children)
          .filter(el => el.getAttribute('data-processed') !== 'done');
        
        if (children.length > 0) {
          const lastSubchild = children[children.length - 1];
          const lastTail = lastSubchild.getAttribute('tail');
          
          if (!lastTail || !lastTail.trim()) {
            lastSubchild.setAttribute('tail', tail);
          } else {
            lastSubchild.setAttribute('tail', lastTail + ' ' + tail);
          }
        }
      }
    }
    
    if (newChildElem.textContent || newChildElem.children.length > 0) {
      updateElemRendition(child, newChildElem);
      processedElement.appendChild(newChildElem);
    }
    
    child.setAttribute('data-processed', 'done');
  });
  
  element.setAttribute('data-processed', 'done');
  
  // 测试是否有子元素和文本
  if (isTextElement(processedElement)) {
    updateElemRendition(element, processedElement);
    return processedElement;
  }
  
  return null;
}

/**
 * 检查是否为代码块元素
 * 对应 Python: is_code_block_element()
 * 
 * @param {Element} element - 元素
 * @returns {boolean} 是否为代码块
 */
function isCodeBlockElement(element) {
  // 检查 lang 属性或 code 标签
  if (element.getAttribute('lang') || element.tagName.toLowerCase() === 'code') {
    return true;
  }
  
  // GitHub 样式
  const parent = element.parentElement;
  if (parent && (parent.getAttribute('class') || '').includes('highlight')) {
    return true;
  }
  
  // highlightjs
  const code = element.querySelector('code');
  if (code && element.children.length === 1) {
    return true;
  }
  
  return false;
}

/**
 * 将元素转换为代码块
 * 对应 Python: handle_code_blocks()
 * 
 * @param {Element} element - 元素
 * @returns {Element} 代码块元素
 */
function handleCodeBlocks(element) {
  const processedElement = element.cloneNode(true);
  
  Array.from(element.querySelectorAll('*')).forEach(child => {
    child.setAttribute('data-processed', 'done');
  });
  
  // 创建新的 code 元素
  const codeElem = document.createElement('code');
  codeElem.textContent = processedElement.textContent;
  
  return codeElem;
}

/**
 * 处理引用元素
 * 对应 Python: handle_quotes()
 * 
 * @param {Element} element - 引用元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的引用
 */
export function handleQuotes(element, options) {
  // 检查是否为代码块
  if (isCodeBlockElement(element)) {
    return handleCodeBlocks(element);
  }
  
  const processedElement = document.createElement(element.tagName);
  
  Array.from(element.querySelectorAll('*')).forEach(child => {
    const processedChild = processNode(child, options);
    
    if (processedChild) {
      defineNewelem(processedChild, processedElement);
    }
    
    child.setAttribute('data-processed', 'done');
  });
  
  if (isTextElement(processedElement)) {
    // 避免双重/嵌套标签
    // TODO: 实现 stripTags
    return processedElement;
  }
  
  return null;
}

/**
 * 处理其他元素
 * 对应 Python: handle_other_elements()
 * 
 * @param {Element} element - 元素
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的元素
 */
export function handleOtherElements(element, potentialTags, options) {
  // 处理 w3schools 代码
  const className = element.getAttribute('class') || '';
  if (element.tagName.toLowerCase() === 'div' && className.includes('w3-code')) {
    return handleCodeBlocks(element);
  }
  
  // 删除不需要的元素
  const tagName = element.tagName.toLowerCase();
  if (!potentialTags.has(tagName)) {
    if (element.getAttribute('data-processed') !== 'done') {
      logEvent('discarding element', tagName, element.textContent);
    }
    return null;
  }
  
  if (tagName === 'div') {
    const processedElement = handleTextNode(element, options, false, true);
    
    if (processedElement && textCharsTest(processedElement.textContent)) {
      // 清除属性
      Array.from(processedElement.attributes).forEach(attr => {
        processedElement.removeAttribute(attr.name);
      });
      
      // 小的 div 修正
      if (processedElement.tagName.toLowerCase() === 'div') {
        const newElem = document.createElement('p');
        newElem.textContent = processedElement.textContent;
        return newElem;
      }
      
      return processedElement;
    }
  }
  
  return null;
}

/**
 * 处理段落及其子元素
 * 对应 Python: handle_paragraphs()
 * 
 * @param {Element} element - 段落元素
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的段落
 */
export function handleParagraphs(element, potentialTags, options) {
  // 清除属性
  Array.from(element.attributes).forEach(attr => {
    element.removeAttribute(attr.name);
  });
  
  // 无子元素
  if (element.children.length === 0) {
    return processNode(element, options);
  }
  
  // 有子元素
  const processedElement = document.createElement(element.tagName);
  
  Array.from(element.querySelectorAll('*')).forEach(child => {
    const childTag = child.tagName.toLowerCase();
    
    if (!potentialTags.has(childTag) && child.getAttribute('data-processed') !== 'done') {
      logEvent('unexpected in p', childTag, child.textContent);
      return;
    }
    
    const processedChild = handleTextNode(child, options, false, true);
    
    if (processedChild) {
      // 处理额外的 p 标签
      if (processedChild.tagName.toLowerCase() === 'p') {
        logEvent('extra in p', 'p', processedChild.textContent);
        
        if (processedElement.textContent) {
          processedElement.textContent += ' ' + (processedChild.textContent || '');
        } else {
          processedElement.textContent = processedChild.textContent;
        }
        
        child.setAttribute('data-processed', 'done');
        return;
      }
      
      // 处理格式化
      const newsub = document.createElement(child.tagName);
      
      if (P_FORMATTING.has(processedChild.tagName.toLowerCase())) {
        // 检查深度并清理
        if (processedChild.children.length > 0) {
          Array.from(processedChild.children).forEach(item => {
            if (textCharsTest(item.textContent)) {
              item.textContent = ' ' + item.textContent;
            }
            // TODO: 实现 stripTags
          });
        }
        
        // 修正属性
        if (childTag === 'hi') {
          const rend = child.getAttribute('rend');
          if (rend) {
            newsub.setAttribute('rend', rend);
          }
        } else if (childTag === 'ref') {
          const target = child.getAttribute('target');
          if (target) {
            newsub.setAttribute('target', target);
          }
        }
      }
      
      // 准备文本
      newsub.textContent = processedChild.textContent;
      const tail = processedChild.getAttribute('tail');
      if (tail) {
        newsub.setAttribute('tail', tail);
      }
      
      // 处理图形元素
      if (processedChild.tagName.toLowerCase() === 'graphic') {
        const imageElem = handleImage(processedChild, options);
        if (imageElem) {
          newsub.replaceWith(imageElem);
        }
      }
      
      processedElement.appendChild(newsub);
    }
    
    child.setAttribute('data-processed', 'done');
  });
  
  // 完成处理
  if (processedElement.children.length > 0) {
    const lastElem = processedElement.lastElementChild;
    
    // 清理末尾的 lb 元素
    if (lastElem && lastElem.tagName.toLowerCase() === 'lb' && !lastElem.getAttribute('tail')) {
      deleteElement(lastElem);
    }
    
    return processedElement;
  }
  
  if (processedElement.textContent) {
    return processedElement;
  }
  
  logEvent('discarding element:', 'p', processedElement.outerHTML);
  return null;
}

/**
 * 处理图像元素
 * 对应 Python: handle_image()
 * 
 * @param {Element} element - 图像元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的图像
 */
function handleImage(element, options) {
  if (!options.images) {
    return null;
  }
  
  // 检查 src 属性
  const src = element.getAttribute('src');
  if (!src) {
    return null;
  }
  
  const imageElem = document.createElement('graphic');
  imageElem.setAttribute('src', src);
  
  // 复制其他属性
  const alt = element.getAttribute('alt');
  if (alt) {
    imageElem.setAttribute('alt', alt);
  }
  
  const title = element.getAttribute('title');
  if (title) {
    imageElem.setAttribute('title', title);
  }
  
  return imageElem;
}

/**
 * 定义单元格类型
 * 对应 Python: define_cell_type()
 * 
 * @param {boolean} isHeader - 是否为表头
 * @returns {Element} 单元格元素
 */
function defineCellType(isHeader) {
  const cellElement = document.createElement('cell');
  if (isHeader) {
    cellElement.setAttribute('role', 'head');
  }
  return cellElement;
}

/**
 * 处理表格元素
 * 对应 Python: handle_table()
 * 
 * @param {Element} tableElem - 表格元素
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的表格
 */
export function handleTable(tableElem, potentialTags, options) {
  const newtable = document.createElement('table');
  
  // 剥离结构元素
  // TODO: 实现 stripTags for thead, tbody, tfoot
  
  // 计算每行的最大列数（包括 colspan）
  let maxCols = 0;
  const diffColspans = new Set();
  
  const rows = tableElem.querySelectorAll('tr');
  rows.forEach(tr => {
    let totalColspans = 0;
    
    const cells = tr.querySelectorAll('td, th');
    cells.forEach(td => {
      const colspan = parseInt(td.getAttribute('colspan') || '1');
      diffColspans.add(colspan);
      totalColspans += colspan;
    });
    
    maxCols = Math.max(maxCols, totalColspans);
  });
  
  // 探索子元素
  let seenHeaderRow = false;
  let seenHeader = false;
  const spanAttr = maxCols > 1 ? String(maxCols) : '';
  let newrow = document.createElement('row');
  
  if (spanAttr) {
    newrow.setAttribute('span', spanAttr);
  }
  
  const descendants = Array.from(tableElem.querySelectorAll('*'));
  
  descendants.forEach(subelement => {
    const subTag = subelement.tagName.toLowerCase();
    
    if (subTag === 'tr') {
      // 处理现有行
      if (newrow.children.length > 0) {
        newtable.appendChild(newrow);
        newrow = document.createElement('row');
        if (spanAttr) {
          newrow.setAttribute('span', spanAttr);
        }
        seenHeaderRow = seenHeaderRow || seenHeader;
      }
    } else if (TABLE_ELEMS.has(subTag)) {
      const isHeader = subTag === 'th' && !seenHeaderRow;
      seenHeader = seenHeader || isHeader;
      const newChildElem = defineCellType(isHeader);
      
      // 处理
      if (subelement.children.length === 0) {
        const processedCell = processNode(subelement, options);
        if (processedCell) {
          newChildElem.textContent = processedCell.textContent;
          const tail = processedCell.getAttribute('tail');
          if (tail) {
            newChildElem.setAttribute('tail', tail);
          }
        }
      } else {
        // 处理嵌套元素
        newChildElem.textContent = subelement.textContent;
        const tail = subelement.getAttribute('tail');
        if (tail) {
          newChildElem.setAttribute('tail', tail);
        }
        
        subelement.setAttribute('data-processed', 'done');
        
        Array.from(subelement.querySelectorAll('*')).forEach(child => {
          const childTag = child.tagName.toLowerCase();
          let processedSubchild;
          
          if (TABLE_ALL.has(childTag)) {
            if (TABLE_ELEMS.has(childTag)) {
              child.setAttribute('data-tag', 'cell');
            }
            processedSubchild = handleTextNode(child, options, true, true);
          } else if (childTag === 'list' && options.focus === 'recall') {
            processedSubchild = handleLists(child, options);
            if (processedSubchild) {
              newChildElem.appendChild(processedSubchild);
              processedSubchild = null;
            }
          } else {
            const extendedTags = new Set([...potentialTags, 'div']);
            processedSubchild = handleTextElem(child, extendedTags, options);
          }
          
          // 添加子元素
          if (processedSubchild) {
            defineNewelem(processedSubchild, newChildElem);
          }
          
          child.setAttribute('data-processed', 'done');
        });
      }
      
      // 添加到树
      if (newChildElem.textContent || newChildElem.children.length > 0) {
        newrow.appendChild(newChildElem);
      }
    } else if (subTag === 'table') {
      // 注意嵌套表格
      return;
    }
    
    // 清理
    subelement.setAttribute('data-processed', 'done');
  });
  
  // 当表格中所有单元格共享相同的 colspan 时，清理行属性
  if (diffColspans.size === 1) {
    newrow.removeAttribute('span');
  }
  
  // 处理结束
  if (newrow.children.length > 0) {
    newtable.appendChild(newrow);
  }
  
  // 测试表格有效性
  if (newtable.children.length > 0) {
    // 检查链接密度（内联实现避免循环依赖）
    const links = Array.from(newtable.querySelectorAll('a, ref'));
    let hasHighLinkDensity = false;
    
    if (links.length > 0) {
      const totalText = trim(newtable.textContent).length;
      if (totalText >= 200) {
        const linkTexts = links.map(el => trim(el.textContent)).filter(t => t);
        const linkLengths = linkTexts.map(t => t.length);
        const totalLen = linkLengths.reduce((sum, len) => sum + len, 0);
        const elemNum = linkTexts.length;
        
        if (elemNum > 0) {
          console.debug(`table link text: ${totalLen} / total: ${totalText}`);
          hasHighLinkDensity = totalText < 1000 
            ? totalLen > 0.8 * totalText 
            : totalLen > 0.5 * totalText;
        }
      }
    }
    
    if (hasHighLinkDensity) {
      logEvent('discarding table:', 'table', 'high link density');
      return null;
    }
    return newtable;
  }
  
  return null;
}

/**
 * 处理文本元素（通用）
 * 对应 Python: handle_textelem()
 * 
 * @param {Element} element - 元素
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的元素
 */
function handleTextElem(element, potentialTags, options) {
  const tagName = element.tagName.toLowerCase();
  
  // 处理不同类型的元素
  if (tagName === 'head') {
    return handleTitles(element, options);
  }
  
  if (FORMATTING.has(tagName)) {
    return handleFormatting(element, options);
  }
  
  if (tagName === 'p') {
    return handleParagraphs(element, potentialTags, options);
  }
  
  if (tagName === 'list') {
    return handleLists(element, options);
  }
  
  if (CODES_QUOTES.has(tagName)) {
    return handleQuotes(element, options);
  }
  
  if (tagName === 'table') {
    return handleTable(element, potentialTags, options);
  }
  
  return handleOtherElements(element, potentialTags, options);
}

// 继续实现主提取函数...

/**
 * 提取主要内容
 * 对应 Python: extract_content()
 * 
 * @param {Element} tree - HTML 树
 * @param {Extractor} options - 提取选项
 * @returns {Array} [postbody, tempText, lenText]
 */
export function extractContent(tree, options) {
  const postbody = document.createElement('body');
  let tempText = '';
  let lenText = 0;
  
  // 查找主要内容区域
  const BODY_XPATHS = [
    '//article',
    '//main',
    '//*[@id="content"]',
    '//*[@class="content"]',
    '//body',
  ];
  
  let contentArea = null;
  for (const xpath of BODY_XPATHS) {
    try {
      const result = document.evaluate(
        xpath,
        tree,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      if (result.singleNodeValue) {
        contentArea = result.singleNodeValue;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!contentArea) {
    contentArea = tree;
  }
  
  // 定义潜在标签
  const potentialTags = new Set([
    'p', 'head', 'list', 'quote', 'code', 'table',
    'div', 'span', 'hi', 'ref', 'lb'
  ]);
  
  // 遍历所有相关元素
  const elements = Array.from(contentArea.querySelectorAll('*'));
  
  elements.forEach(element => {
    if (element.getAttribute('data-processed') === 'done') {
      return;
    }
    
    const processed = handleTextElem(element, potentialTags, options);
    
    if (processed) {
      postbody.appendChild(processed);
      tempText += processed.textContent + '\n';
      lenText += processed.textContent.length;
    }
  });
  
  return [postbody, tempText.trim(), lenText];
}

/**
 * 提取评论
 * 对应 Python: extract_comments()
 * 
 * @param {Element} tree - HTML 树
 * @param {Extractor} options - 提取选项
 * @returns {Array} [commentsBody, tempText, lenText]
 */
export function extractComments(tree, options) {
  const commentsBody = document.createElement('body');
  let tempText = '';
  let lenText = 0;
  
  if (!options.comments) {
    return [commentsBody, tempText, lenText];
  }
  
  // 查找评论区域
  const COMMENTS_XPATHS = [
    '//*[@id="comments"]',
    '//*[@class="comments"]',
    '//*[@id="comment-list"]',
    '//*[contains(@class, "comment-list")]',
  ];
  
  let commentsArea = null;
  for (const xpath of COMMENTS_XPATHS) {
    try {
      const result = document.evaluate(
        xpath,
        tree,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      if (result.singleNodeValue) {
        commentsArea = result.singleNodeValue;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!commentsArea) {
    return [commentsBody, tempText, lenText];
  }
  
  // 处理评论
  const potentialTags = new Set(['p', 'head', 'list', 'quote']);
  const elements = Array.from(commentsArea.querySelectorAll('*'));
  
  elements.forEach(element => {
    if (element.getAttribute('data-processed') === 'done') {
      return;
    }
    
    const processed = handleTextElem(element, potentialTags, options);
    
    if (processed) {
      commentsBody.appendChild(processed);
      tempText += processed.textContent + '\n';
      lenText += processed.textContent.length;
    }
  });
  
  return [commentsBody, tempText.trim(), lenText];
}

// 导出
export default {
  handleTitles,
  handleFormatting,
  handleLists,
  handleQuotes,
  handleParagraphs,
  handleTable,
  handleOtherElements,
  extractContent,
  extractComments,
  logEvent,
};

