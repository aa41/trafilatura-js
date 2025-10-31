/**
 * 表格处理模块
 * 
 * 对应Python模块: trafilatura/main_extractor.py
 * 函数: define_cell_type(), handle_table()
 * 
 * 实现表格元素的处理和转换
 * 
 * @module extraction/handlers/tables
 */

import { 
  processNode, 
  handleTextNode,
  setElementText,
  setElementTail,
  flushTail
} from './node-processing.js';
import { handleLists } from './lists.js';
import { defineNewElem } from './utils.js';
import { TABLE_ELEMS, TABLE_ALL } from '../../settings/constants.js';
import { stripTags } from '../../utils/dom.js';

/**
 * 确定单元格元素类型并创建新元素
 * 
 * 对应Python: define_cell_type() - main_extractor.py:357-363
 * 
 * @param {boolean} isHeader - 是否为表头单元格
 * @returns {Element} 新的cell元素
 */
export function defineCellType(isHeader) {
  // 定义标签
  const cellElement = document.createElement('cell');
  if (isHeader) {
    cellElement.setAttribute('role', 'head');
  }
  return cellElement;
}

/**
 * 处理单个表格元素
 * 
 * 对应Python: handle_table() - main_extractor.py:366-453
 * 
 * 处理流程：
 * 1. 剥离结构元素（thead, tbody, tfoot）
 * 2. 计算最大列数（包括colspan）
 * 3. 遍历所有子元素并处理
 * 4. 为每个单元格调用相应的处理函数
 * 5. 返回处理后的表格元素
 * 
 * @param {Element} tableElem - 表格元素
 * @param {Set<string>} potentialTags - 允许的标签集合
 * @param {Object} options - 提取器配置
 * @returns {Element|null} 处理后的表格元素，如果无效则返回null
 */
export function handleTable(tableElem, potentialTags, options) {
  // 检查null输入
  if (tableElem === null || tableElem === undefined) {
    return null;
  }

  const newtable = document.createElement('table');

  // 剥离这些结构元素
  // 对应Python: strip_tags(table_elem, "thead", "tbody", "tfoot")
  stripTags(tableElem, 'thead');
  stripTags(tableElem, 'tbody');
  stripTags(tableElem, 'tfoot');

  // 计算每行的最大列数，包括colspan
  // 对应Python: main_extractor.py:373-383
  let maxCols = 0;
  const diffColspans = new Set();
  
  for (const tr of tableElem.querySelectorAll('tr')) {
    let totalColspans = 0;
    for (const td of tr.querySelectorAll('td, th')) {
      const colspanAttr = td.getAttribute('colspan');
      const colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;
      diffColspans.add(colspan);
      totalColspans += colspan;
    }
    maxCols = Math.max(maxCols, totalColspans);
  }

  // 探索子元素
  // 对应Python: main_extractor.py:386-442
  let seenHeaderRow = false;
  let seenHeader = false;
  const spanAttr = maxCols > 1 ? String(maxCols) : '';
  let newrow = document.createElement('row');
  if (spanAttr) {
    newrow.setAttribute('span', spanAttr);
  }

  // 获取所有后代元素（使用querySelectorAll获取所有嵌套元素）
  const descendants = Array.from(tableElem.querySelectorAll('*'));
  
  for (const subelement of descendants) {
    if (subelement.tagName.toLowerCase() === 'tr') {
      // 处理现有行
      // 对应Python: main_extractor.py:394-401
      if (newrow.childNodes.length > 0) {
        newtable.appendChild(newrow);
        newrow = document.createElement('row');
        if (spanAttr) {
          newrow.setAttribute('span', spanAttr);
        }
        seenHeaderRow = seenHeaderRow || seenHeader;
      }
    } 
    else if (TABLE_ELEMS.has(subelement.tagName.toLowerCase())) {
      // 对应Python: main_extractor.py:402-437
      const isHeader = subelement.tagName.toLowerCase() === 'th' && !seenHeaderRow;
      seenHeader = seenHeader || isHeader;
      const newChildElem = defineCellType(isHeader);

      // 处理单元格
      if (subelement.children.length === 0) {
        // 无子元素：直接处理节点
        // 对应Python: main_extractor.py:407-410
        const processedCell = processNode(subelement, options);
        if (processedCell !== null) {
          setElementText(newChildElem, processedCell.textContent);
          setElementTail(newChildElem, processedCell.getAttribute('tail') || '');
        }
      } else {
        // 有子元素：遍历处理
        // 对应Python: main_extractor.py:412-434
        setElementText(newChildElem, subelement.textContent.split('\n')[0] || ''); // 只取第一行作为text
        setElementTail(newChildElem, subelement.getAttribute('tail') || '');
        subelement.setAttribute('data-done', 'true');

        for (const child of subelement.querySelectorAll('*')) {
          let processedSubchild = null;
          const childTag = child.tagName.toLowerCase();

          if (TABLE_ALL.has(childTag)) {
            // 表格相关元素
            // 对应Python: main_extractor.py:416-421
            if (TABLE_ELEMS.has(childTag)) {
              child.setAttribute('data-tag', 'cell');
            }
            processedSubchild = handleTextNode(child, options, {
              preserveSpaces: true,
              commentsFix: true
            });
          } 
          // 表格中的列表（仅在recall模式下）
          // 对应Python: main_extractor.py:423-427
          else if (childTag === 'list' && options.focus === 'recall') {
            processedSubchild = handleLists(child, options);
            if (processedSubchild !== null) {
              newChildElem.appendChild(processedSubchild);
              // 刷新tail: 将临时存储的_tail转换为真正的文本节点
              flushTail(processedSubchild);
              processedSubchild = null; // 不再处理
            }
          } 
          else {
            // 其他元素
            // 对应Python: main_extractor.py:429-430
            // 注意：handleTextElem在这里被简化处理
            const expandedTags = new Set([...potentialTags, 'div']);
            // 简化版handleTextElem逻辑
            if (childTag === 'p' || childTag === 'div') {
              processedSubchild = handleTextNode(child, options, {
                commentsFix: false,
                preserveSpaces: true
              });
            } else {
              processedSubchild = processNode(child, options);
            }
          }

          // 添加子元素到处理后的元素
          // 对应Python: main_extractor.py:432-433
          if (processedSubchild !== null) {
            defineNewElem(processedSubchild, newChildElem);
          }
          child.setAttribute('data-done', 'true');
        }
      }

      // 添加到树
      // 对应Python: main_extractor.py:436-437
      if (newChildElem.textContent || newChildElem.children.length > 0) {
        newrow.appendChild(newChildElem);
      }
    }
    // 注意嵌套表格
    // 对应Python: main_extractor.py:439-440
    else if (subelement.tagName.toLowerCase() === 'table') {
      break;
    }
    
    // 清理
    // 对应Python: main_extractor.py:442
    subelement.setAttribute('data-done', 'true');
  }

  // 仅当表格中所有单元格共享相同的colspan时才清理row属性
  // 对应Python: main_extractor.py:445-446
  if (diffColspans.size === 1) {
    newrow.removeAttribute('span');
  }

  // 处理结束
  // 对应Python: main_extractor.py:449-453
  if (newrow.childNodes.length > 0) {
    newtable.appendChild(newrow);
  }
  if (newtable.childNodes.length > 0) {
    return newtable;
  }
  return null;
}

