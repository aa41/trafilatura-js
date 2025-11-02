/**
 * 核心提取器模块
 * 
 * 实现Trafilatura的主要内容提取逻辑
 * 这是整个项目最复杂的模块
 * 
 * @module extraction/extractor
 */

import { deleteElement, stripTags, stripElements, copyTree } from '../utils/dom.js';
import { trim, textCharsTest, textFilter } from '../utils/text.js';
import { isDevelopment } from '../utils/env.js';
import { TAG_CATALOG } from '../settings/constants.js';
import { 
  BODY_XPATH,
  OVERALL_DISCARD_XPATH,
  TEASER_DISCARD_XPATH,
  PRECISION_DISCARD_XPATH,
  DISCARD_IMAGE_ELEMENTS
} from '../settings/xpaths.js';
import { 
  pruneUnwantedNodes,
  linkDensityTestTables,
  deleteByLinkDensity
} from '../processing/index.js';

// 导入步骤2、步骤3和步骤4实现的handler
import {
  processNode,
  handleParagraphs,
  handleTitles,
  handleFormatting,
  handleOtherElements,
  handleLists,
  handleQuotes,
  handleCodeBlocks,
  handleTable,
  handleImage,
  flushTail
} from './handlers/index.js';
import { Extractor } from '../settings/extractor.js';

// ============================================================================
// 常量定义 - 对应Python: main_extractor.py:31-36
// ============================================================================

/**
 * 段落格式化标签
 * 对应Python: P_FORMATTING
 */
const P_FORMATTING = new Set(['hi', 'ref']);

/**
 * 表格元素
 * 对应Python: TABLE_ELEMS, TABLE_ALL
 */
const TABLE_ELEMS = new Set(['td', 'th']);
const TABLE_ALL = new Set(['td', 'th', 'hi']);

/**
 * 格式化标签
 * 对应Python: FORMATTING
 */
const FORMATTING = new Set(['hi', 'ref', 'span']);

/**
 * 代码和引用标签
 * 对应Python: CODES_QUOTES
 */
const CODES_QUOTES = new Set(['code', 'quote']);

/**
 * 不应该出现在末尾的标签
 * 对应Python: NOT_AT_THE_END
 */
const NOT_AT_THE_END = new Set(['head', 'ref']);

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 日志事件（调试用）
 * 对应Python: _log_event() - main_extractor.py:39-41
 * 
 * @param {string} msg - 消息
 * @param {string} tag - 标签名
 * @param {string} text - 文本内容
 */
function logEvent(msg, tag, text) {
  // 在浏览器环境中，可以使用console.debug
  if (isDevelopment()) {
    console.debug(`${msg}: ${tag} ${trim(text || '') || 'None'}`);
  }
}

// ============================================================================
// 元素处理分发器
// ============================================================================

/**
 * 处理文本元素并决定如何处理其内容
 * 对应Python: handle_textelem() - main_extractor.py:498-525
 * 
 * 这是核心分发器，根据元素类型路由到不同的处理器
 * 
 * @param {Element} element - 要处理的元素
 * @param {Set<string>} potentialTags - 潜在的有效标签集合
 * @param {Extractor} options - 提取器选项
 * @returns {Element|null} 处理后的元素，如果不应保留则返回null
 */
export function handleTextElem(element, potentialTags, options) {
  if (!element) {
    return null;
  }
  
  // ⚠️ 关键检查：如果元素已经被标记为"done"，跳过处理
  // Python: if element.tag == "done": return None
  // 这防止已经在父元素中处理过的子元素被重复处理
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'done' || element.getAttribute('data-done') === 'true') {
    return null;
  }
  
  let newElement = null;
  
  // 根据标签类型分发到不同的处理器
  // Python: if element.tag == 'list':
  if (element.tagName.toLowerCase() === 'list') {
    newElement = handleLists(element, options);
  }
  // Python: elif element.tag in CODES_QUOTES:
  else if (CODES_QUOTES.has(element.tagName.toLowerCase())) {
    newElement = handleQuotes(element, options);
  }
  // Python: elif element.tag == 'head':
  else if (element.tagName.toLowerCase() === 'head') {
    newElement = handleTitles(element, options);
  }
  // Python: elif element.tag == 'p':
  else if (element.tagName.toLowerCase() === 'p') {
    newElement = handleParagraphs(element, potentialTags, options);
  }
  // Python: elif element.tag == 'lb':
  else if (element.tagName.toLowerCase() === 'lb') {
    // 检查tail文本
    const tail = element.nextSibling && element.nextSibling.nodeType === Node.TEXT_NODE 
      ? element.nextSibling.textContent 
      : '';
    
    if (textCharsTest(tail)) {
      const thisElement = processNode(element, options);
      if (thisElement) {
        newElement = document.createElement('p');
        newElement.textContent = tail;
      }
    }
  }
  // Python: elif element.tag in FORMATTING:
  else if (FORMATTING.has(element.tagName.toLowerCase())) {
    newElement = handleFormatting(element, options);
  }
  // Python: elif element.tag == 'table' and 'table' in potential_tags:
  else if (element.tagName.toLowerCase() === 'table' && potentialTags.has('table')) {
    newElement = handleTable(element, potentialTags, options);
  }
  // Python: elif element.tag == 'graphic' and 'graphic' in potential_tags:
  else if (element.tagName.toLowerCase() === 'graphic' && potentialTags.has('graphic')) {
    newElement = handleImage(element, options);
  }
  // Python: else: other elements (div, etc.)
  else {
    newElement = handleOtherElements(element, potentialTags, options);
  }
  
  return newElement;
}

// ============================================================================
// 核心提取逻辑
// ============================================================================

/**
 * 内部提取函数
 * 对应Python: _extract() - main_extractor.py:586-636
 * 
 * 使用一组XPath表达式查找页面的主要内容
 * 
 * @param {Document|Element} tree - HTML树
 * @param {Extractor} options - 提取器选项
 * @returns {{body: Element, text: string, potentialTags: Set<string>}} 提取结果
 */
function _extract(tree, options) {
  // 初始化潜在标签集合
  // Python: potential_tags = set(TAG_CATALOG)
  const potentialTags = new Set(TAG_CATALOG);
  
  // 根据选项添加标签
  // Python: if options.tables is True: potential_tags.update(['table', 'td', 'th', 'tr'])
  if (options.tables) {
    potentialTags.add('table');
    potentialTags.add('td');
    potentialTags.add('th');
    potentialTags.add('tr');
  }
  
  // Python: if options.images is True: potential_tags.add('graphic')
  if (options.images) {
    potentialTags.add('graphic');
  }
  
  // Python: if options.links is True: potential_tags.add('ref')
  if (options.links) {
    potentialTags.add('ref');
  }
  
  // 创建结果body元素
  // Python: result_body = Element('body')
  const resultBody = document.createElement('body');
  
  // 遍历BODY_XPATH表达式
  // Python: for expr in BODY_XPATH:
  for (const expr of BODY_XPATH) {
    // 选择符合表达式的子树
    // Python: subtree = next((s for s in expr(tree) if s is not None), None)
    const subtrees = expr(tree);
    let subtree = null;
    for (const s of subtrees) {
      if (s) {
        subtree = s;
        break;
      }
    }
    
    if (!subtree) {
      continue;
    }
    
    // 修剪子树
    // Python: subtree = prune_unwanted_sections(subtree, potential_tags, options)
    subtree = pruneUnwantedSections(subtree, potentialTags, options);
    
    // 如果树为空，跳过
    // Python: if len(subtree) == 0: continue
    if (subtree.children.length === 0) {
      continue;
    }
    
    // 检查段落文本
    // Python: ptest = subtree.xpath('//p//text()')
    const pElems = subtree.querySelectorAll('p');
    let ptest = '';
    for (const p of pElems) {
      ptest += p.textContent || '';
    }
    
    // 根据focus模式调整因子
    // Python: if options.focus == "precision": factor = 1 else: factor = 3
    const factor = options.focus === 'precision' ? 1 : 3;
    
    // 如果段落文本不足，添加div标签
    // Python: if not ptest or len(''.join(ptest)) < options.min_extracted_size * factor:
    if (!ptest || ptest.length < options.minExtractedSize * factor) {
      potentialTags.add('div');
    }
    
    // 清理标签
    // Python: if 'ref' not in potential_tags: strip_tags(subtree, 'ref')
    if (!potentialTags.has('ref')) {
      stripTags(subtree, ['ref']);
    }
    
    // Python: if 'span' not in potential_tags: strip_tags(subtree, 'span')
    if (!potentialTags.has('span')) {
      stripTags(subtree, ['span']);
    }
    
    logEvent('potential_tags', '', Array.from(potentialTags).sort().join(', '));
    
    // 获取所有子元素
    // Python: subelems = subtree.xpath('.//*')
    const subelems = Array.from(subtree.querySelectorAll('*'));
    
    // 特殊情况：只有lb元素
    // Python: if {e.tag for e in subelems} == {'lb'}: subelems = [subtree]
    const uniqueTags = new Set(subelems.map(e => e.tagName.toLowerCase()));
    if (uniqueTags.size === 1 && uniqueTags.has('lb')) {
      subelems.length = 0;
      subelems.push(subtree);
    }
    
    // 提取内容
    // Python: result_body.extend([el for el in (handle_textelem(...) for e in subelems) if el is not None])
    for (const elem of subelems) {
      const processedElem = handleTextElem(elem, potentialTags, options);
      if (processedElem) {
        resultBody.appendChild(processedElem);
        // 刷新tail: 将临时存储的_tail转换为真正的文本节点
        flushTail(processedElem);
      }
    }
    
    // 移除末尾的标题
    // Python: while len(result_body) > 0 and (result_body[-1].tag in NOT_AT_THE_END):
    while (resultBody.children.length > 0) {
      const lastChild = resultBody.lastElementChild;
      const lastTag = lastChild.tagName.toLowerCase();
      
      if (NOT_AT_THE_END.has(lastTag)) {
        deleteElement(lastChild, false);
      } else {
        break;
      }
    }
    
    // 如果结果有内容，退出循环
    // Python: if len(result_body) > 1: break
    if (resultBody.children.length > 1) {
      logEvent('selected_xpath', '', expr.toString());
      break;
    }
  }
  
  // 收集所有文本
  // Python: temp_text = ' '.join(result_body.itertext()).strip()
  const tempText = (resultBody.textContent || '').trim();
  
  return {
    body: resultBody,
    text: tempText,
    potentialTags: potentialTags
  };
}

/**
 * 提取内容的主入口函数
 * 对应Python: extract_content() - main_extractor.py:639-659
 * 
 * 使用一组XPath表达式查找页面的主要内容，
 * 然后提取相关元素，去除不需要的子部分并转换它们
 * 
 * @param {Document|Element} cleanedTree - 清理后的HTML树
 * @param {Extractor} options - 提取器选项
 * @returns {{body: Element, text: string, length: number}} 提取结果
 */
export function extractContent(cleanedTree, options) {
  if (!cleanedTree || !options) {
    const emptyBody = document.createElement('body');
    return { body: emptyBody, text: '', length: 0 };
  }
  
  // 创建备份
  // Python: backup_tree = deepcopy(cleaned_tree)
  const backupTree = copyTree(cleanedTree, true);
  
  // 调用核心提取函数
  // Python: result_body, temp_text, potential_tags = _extract(cleaned_tree, options)
  let result = _extract(cleanedTree, options);
  let resultBody = result.body;
  let tempText = result.text;
  const potentialTags = result.potentialTags;
  
  // 如果结果为空或文本太短，尝试恢复遗漏的文本
  // Python: if len(result_body) == 0 or len(temp_text) < options.min_extracted_size:
  if (resultBody.children.length === 0 || tempText.length < options.minExtractedSize) {
    resultBody = recoverWildText(backupTree, resultBody, options, potentialTags);
    // Python: temp_text = ' '.join(result_body.itertext()).strip()
    tempText = (resultBody.textContent || '').trim();
  }
  
  // 清理输出
  // Python: strip_elements(result_body, 'done')
  stripElements(resultBody, ['done']);
  
  // Python: strip_tags(result_body, 'div')
  stripTags(resultBody, ['div']);
  
  // 返回结果
  // Python: return result_body, temp_text, len(temp_text)
  return {
    body: resultBody,
    text: tempText,
    length: tempText.length
  };
}

// ============================================================================
// 修剪和恢复函数
// ============================================================================

/**
 * 基于规则删除目标文档部分
 * 对应Python: prune_unwanted_sections() - main_extractor.py:552-583
 * 
 * 实现步骤：
 * 1. 修剪不需要的节点（通用）
 * 2. 决定是否保留图片
 * 3. 平衡精确度/召回率
 * 4. 按链接密度移除元素（多次迭代）
 * 5. 处理表格的链接密度
 * 6. precision模式下的额外过滤
 * 
 * @param {Element} tree - HTML树
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @param {Extractor} options - 提取器选项
 * @returns {Element} 修剪后的树
 */
export function pruneUnwantedSections(tree, potentialTags, options) {
  if (!tree) {
    return tree;
  }
  
  // 确定是否偏向精确度
  // Python: favor_precision = options.focus == "precision"
  const favorPrecision = options.focus === 'precision';
  
  // 步骤1: 修剪其余部分
  // Python: tree = prune_unwanted_nodes(tree, OVERALL_DISCARD_XPATH, with_backup=True)
  tree = pruneUnwantedNodes(tree, OVERALL_DISCARD_XPATH, true);
  
  // 步骤2: 决定是否保留图片
  // Python: if 'graphic' not in potential_tags:
  if (!potentialTags.has('graphic')) {
    // Python: tree = prune_unwanted_nodes(tree, DISCARD_IMAGE_ELEMENTS)
    tree = pruneUnwantedNodes(tree, DISCARD_IMAGE_ELEMENTS, false);
  }
  
  // 步骤3: 平衡精确度/召回率
  // Python: if options.focus != "recall":
  if (options.focus !== 'recall') {
    // Python: tree = prune_unwanted_nodes(tree, TEASER_DISCARD_XPATH)
    tree = pruneUnwantedNodes(tree, TEASER_DISCARD_XPATH, false);
    
    if (favorPrecision) {
      // Python: tree = prune_unwanted_nodes(tree, PRECISION_DISCARD_XPATH)
      tree = pruneUnwantedNodes(tree, PRECISION_DISCARD_XPATH, false);
    }
  }
  
  // 步骤4: 按链接密度移除元素，多次迭代
  // Python: for _ in range(2):
  for (let i = 0; i < 2; i++) {
    // Python: tree = delete_by_link_density(tree, 'div', backtracking=True, favor_precision=favor_precision)
    tree = deleteByLinkDensity(tree, 'div', true, favorPrecision);
    
    // Python: tree = delete_by_link_density(tree, 'list', backtracking=False, favor_precision=favor_precision)
    tree = deleteByLinkDensity(tree, 'list', false, favorPrecision);
    
    // Python: tree = delete_by_link_density(tree, 'p', backtracking=False, favor_precision=favor_precision)
    tree = deleteByLinkDensity(tree, 'p', false, favorPrecision);
  }
  
  // 步骤5: 表格处理
  // Python: if 'table' in potential_tags or favor_precision:
  if (potentialTags.has('table') || favorPrecision) {
    // Python: for elem in tree.iter('table'):
    const tables = Array.from(tree.querySelectorAll('table'));
    for (const elem of tables) {
      // Python: if link_density_test_tables(elem) is True:
      if (linkDensityTestTables(elem) === true) {
        // Python: delete_element(elem, keep_tail=False)
        deleteElement(elem, false);
      }
    }
  }
  
  // 步骤6: precision模式下的额外过滤
  // Python: if favor_precision:
  if (favorPrecision) {
    // Python: while len(tree) > 0 and (tree[-1].tag == 'head'):
    while (tree.children.length > 0 && 
           tree.children[tree.children.length - 1].tagName.toLowerCase() === 'head') {
      // Python: delete_element(tree[-1], keep_tail=False)
      deleteElement(tree.children[tree.children.length - 1], false);
    }
    
    // Python: tree = delete_by_link_density(tree, 'head', backtracking=False, favor_precision=True)
    tree = deleteByLinkDensity(tree, 'head', false, true);
    
    // Python: tree = delete_by_link_density(tree, 'quote', backtracking=False, favor_precision=True)
    tree = deleteByLinkDensity(tree, 'quote', false, true);
  }
  
  return tree;
}

/**
 * 查找所有之前未考虑的野生元素，包括确定框架之外
 * 和整个文档中的元素，以恢复可能遗漏的文本部分
 * 对应Python: recover_wild_text() - main_extractor.py:528-549
 * 
 * @param {Element} tree - HTML树
 * @param {Element} resultBody - 结果body元素
 * @param {Extractor} options - 提取器选项
 * @param {Set<string>} potentialTags - 潜在标签集合
 * @returns {Element} 更新后的结果body
 */
export function recoverWildText(tree, resultBody, options, potentialTags = new Set(TAG_CATALOG)) {
  if (!tree) {
    return resultBody;
  }
  
  logEvent('Recovering wild text elements', '', '');
  
  // 构建搜索表达式
  // Python: search_expr = './/blockquote|.//code|.//p|.//pre|.//q|.//quote|.//table|.//div[contains(@class, \'w3-code\')]'
  let searchSelector = 'blockquote, code, p, pre, q, quote, table, div.w3-code';
  
  // Python: if options.focus == "recall":
  if (options.focus === 'recall') {
    // Python: potential_tags.update(['div', 'lb'])
    potentialTags.add('div');
    potentialTags.add('lb');
    // Python: search_expr += '|.//div|.//lb|.//list'
    searchSelector += ', div, lb, list';
  }
  
  // 修剪搜索树
  // Python: search_tree = prune_unwanted_sections(tree, potential_tags, options)
  const searchTree = pruneUnwantedSections(tree, potentialTags, options);
  
  if (!searchTree) {
    return resultBody;
  }
  
  // 决定是否保留链接
  // Python: if 'ref' not in potential_tags: strip_tags(search_tree, 'a', 'ref', 'span')
  if (!potentialTags.has('ref')) {
    stripTags(searchTree, 'a');
    stripTags(searchTree, 'ref');
    stripTags(searchTree, 'span');
  } else {
    // Python: else: strip_tags(search_tree, 'span')
    stripTags(searchTree, 'span');
  }
  
  // 搜索元素
  // Python: subelems = search_tree.xpath(search_expr)
  const subelems = Array.from(searchTree.querySelectorAll(searchSelector));
  
  // 处理并添加元素
  // Python: result_body.extend(filter(lambda x: x is not None, (handle_textelem(e, potential_tags, options) for e in subelems)))
  for (const elem of subelems) {
    const processedElem = handleTextElem(elem, potentialTags, options);
    if (processedElem !== null) {
      resultBody.appendChild(processedElem);
      // 刷新tail: 将临时存储的_tail转换为真正的文本节点
      flushTail(processedElem);
    }
  }
  
  return resultBody;
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  extractContent,
  handleTextElem,
  pruneUnwantedSections,
  recoverWildText,
  Extractor
};

