/**
 * HTML 处理模块
 * 对应 Python: trafilatura/htmlprocessing.py
 * 
 * 功能：
 * - HTML 树清理和修剪
 * - 链接密度测试
 * - 节点转换和格式化
 * - 标签简化
 */

import {
  CUT_EMPTY_ELEMS,
  MANUALLY_CLEANED,
  MANUALLY_STRIPPED,
  PRESERVE_IMG_CLEANING,
  CODE_INDICATORS,
  REND_TAG_MAPPING,
  HTML_TAG_MAPPING,
  P_FORMATTING,
  FORMATTING,
  TABLE_ELEMS,
} from '../settings/constants.js';

import { trim, textFilter, isImageElement } from '../utils/text-utils.js';
import { deleteElement } from '../utils/dom-utils.js';
import { fixRelativeUrls, getBaseUrl } from '../utils/url-utils.js';
import { duplicateTest } from './deduplication.js';

/**
 * 清理 HTML 树，移除不需要的元素
 * 对应 Python: tree_cleaning()
 * 
 * @param {Element} tree - HTML 树
 * @param {Extractor} options - 提取选项
 * @returns {Element} 清理后的树
 */
export function treeCleaning(tree, options) {
  if (!tree) return null;

  // 确定清理策略 - 使用数组保持确定性
  const cleaningList = [...MANUALLY_CLEANED];
  const strippingList = [...MANUALLY_STRIPPED];

  // 如果不需要表格，添加到清理列表
  if (!options.tables) {
    cleaningList.push('table', 'td', 'th', 'tr');
  } else {
    // 防止问题：https://github.com/adbar/trafilatura/issues/301
    // 将包含表格的 figure 元素转换为 div
    const figuresWithTable = tree.querySelectorAll('figure');
    figuresWithTable.forEach(figure => {
      if (figure.querySelector('table')) {
        const div = document.createElement('div');
        // 复制属性
        Array.from(figure.attributes).forEach(attr => {
          div.setAttribute(attr.name, attr.value);
        });
        // 移动子元素
        while (figure.firstChild) {
          div.appendChild(figure.firstChild);
        }
        figure.parentNode.replaceChild(div, figure);
      }
    });
  }

  // 如果需要图片，调整清理列表
  if (options.images) {
    // 许多网站将 <img> 放在 <figure> 或 <picture> 或 <source> 标签内
    const preserved = new Set(PRESERVE_IMG_CLEANING);
    const newCleaningList = cleaningList.filter(tag => !preserved.has(tag));
    cleaningList.length = 0;
    cleaningList.push(...newCleaningList);
    
    const imgIndex = strippingList.indexOf('img');
    if (imgIndex > -1) {
      strippingList.splice(imgIndex, 1);
    }
  }

  // 剥离目标元素（移除标签但保留内容）
  strippingList.forEach(tagName => {
    const elements = tree.querySelectorAll(tagName);
    elements.forEach(elem => {
      stripTag(elem);
    });
  });

  // 防止移除段落（recall 模式）
  if (options.focus === 'recall' && tree.querySelector('p')) {
    // 创建副本
    const treeCopy = tree.cloneNode(true);
    
    // 删除目标元素
    cleaningList.forEach(tagName => {
      const elements = tree.querySelectorAll(tagName);
      elements.forEach(elem => deleteElement(elem));
    });
    
    // 如果删除后没有段落了，恢复副本
    if (!tree.querySelector('p')) {
      tree = treeCopy;
    }
  } else {
    // 删除目标元素
    cleaningList.forEach(tagName => {
      const elements = tree.querySelectorAll(tagName);
      elements.forEach(elem => deleteElement(elem));
    });
  }

  return pruneHtml(tree, options.focus);
}

/**
 * 剥离标签但保留内容
 * 对应 lxml 的 strip_tags()
 * 
 * @param {Element} elem - 要剥离的元素
 */
function stripTag(elem) {
  if (!elem || !elem.parentNode) return;
  
  const parent = elem.parentNode;
  const fragment = document.createDocumentFragment();
  
  // 移动所有子节点到 fragment
  while (elem.firstChild) {
    fragment.appendChild(elem.firstChild);
  }
  
  // 用 fragment 内容替换元素
  parent.replaceChild(fragment, elem);
}

/**
 * 删除选定的空元素以节省空间和处理时间
 * 对应 Python: prune_html()
 * 
 * @param {Element} tree - HTML 树
 * @param {string} focus - 焦点模式 (precision/recall/balanced)
 * @returns {Element} 修剪后的树
 */
export function pruneHtml(tree, focus = 'balanced') {
  if (!tree) return null;

  const keepTails = focus !== 'precision';

  // 删除空元素
  const allElements = tree.querySelectorAll('*');
  const emptyElements = [];

  allElements.forEach(elem => {
    // 检查是否为空（无子节点且无文本内容）
    if (!elem.hasChildNodes() && !elem.textContent.trim()) {
      if (CUT_EMPTY_ELEMS.has(elem.tagName.toLowerCase())) {
        emptyElements.push(elem);
      }
    }
  });

  // 删除空元素
  emptyElements.forEach(elem => {
    deleteElement(elem, keepTails);
  });

  return tree;
}

/**
 * 通过移除不需要的部分来修剪 HTML 树
 * 对应 Python: prune_unwanted_nodes()
 * 
 * @param {Element} tree - HTML 树
 * @param {Array<string>} xpathList - XPath 表达式列表
 * @param {boolean} withBackup - 是否使用备份机制
 * @returns {Element} 修剪后的树
 */
export function pruneUnwantedNodes(tree, xpathList, withBackup = false) {
  if (!tree) return null;

  let oldLen, backup;
  
  if (withBackup) {
    oldLen = tree.textContent.length;
    backup = tree.cloneNode(true);
  }

  // 对于每个 XPath 表达式，查找并删除匹配的元素
  xpathList.forEach(xpathExpr => {
    // 由于我们在浏览器环境，使用 querySelector 替代 XPath
    // 这需要将 XPath 转换为 CSS 选择器，或者使用 document.evaluate
    const elements = evaluateXPath(tree, xpathExpr);
    elements.forEach(elem => {
      deleteElement(elem);
    });
  });

  if (withBackup) {
    const newLen = tree.textContent.length;
    // 如果删除后内容太少，恢复备份
    // TODO: 根据 recall 和 precision 设置调整
    return newLen > oldLen / 7 ? tree : backup;
  }

  return tree;
}

/**
 * 评估 XPath 表达式（浏览器环境）
 * 
 * @param {Element} context - 上下文元素
 * @param {string} xpathExpr - XPath 表达式
 * @returns {Array<Element>} 匹配的元素数组
 */
function evaluateXPath(context, xpathExpr) {
  const doc = context.ownerDocument || document;
  const results = [];
  
  try {
    const xpathResult = doc.evaluate(
      xpathExpr,
      context,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
      results.push(xpathResult.snapshotItem(i));
    }
  } catch (e) {
    // XPath 评估失败，返回空数组
    console.warn(`XPath evaluation failed: ${xpathExpr}`, e);
  }
  
  return results;
}

/**
 * 收集链接文本的启发式信息
 * 对应 Python: collect_link_info()
 * 
 * @param {Array<Element>} linksXpath - 链接元素数组
 * @returns {Object} 包含 totalLen, elemNum, shortElems, textList
 */
export function collectLinkInfo(linksXpath) {
  const textList = linksXpath
    .map(elem => trim(elem.textContent))
    .filter(text => text);

  const lengths = textList.map(text => text.length);
  const shortElems = lengths.filter(len => len < 10).length;

  return {
    totalLen: lengths.reduce((sum, len) => sum + len, 0),
    elemNum: textList.length,
    shortElems,
    textList,
  };
}

/**
 * 移除链接密集的部分（可能是样板文本）
 * 对应 Python: link_density_test()
 * 
 * @param {Element} element - 要测试的元素
 * @param {string} text - 元素的文本内容
 * @param {boolean} favorPrecision - 是否偏向精确度
 * @returns {Array} [shouldRemove, linkTextList]
 */
export function linkDensityTest(element, text, favorPrecision = false) {
  const linksXpath = Array.from(element.querySelectorAll('a, ref'));
  
  if (linksXpath.length === 0) {
    return [false, []];
  }

  let textList = [];

  // 快捷方式：只有一个链接
  if (linksXpath.length === 1) {
    const lenThreshold = favorPrecision ? 10 : 100;
    const linkText = trim(linksXpath[0].textContent);
    if (linkText.length > lenThreshold && linkText.length > text.length * 0.9) {
      return [true, []];
    }
  }

  // 确定长度阈值
  let limitLen;
  if (element.tagName.toLowerCase() === 'p') {
    limitLen = element.nextElementSibling ? 30 : 60;
  } else {
    if (!element.nextElementSibling) {
      limitLen = 300;
    } else {
      limitLen = 100;
    }
  }

  const elemLen = text.length;
  if (elemLen < limitLen) {
    const { totalLen: linkLen, elemNum, shortElems, textList: list } = collectLinkInfo(linksXpath);
    textList = list;

    if (elemNum === 0) {
      return [true, textList];
    }

    // 调试日志
    console.debug(
      `list link text/total: ${linkLen}/${elemLen} - short elems/total: ${shortElems}/${elemNum}`
    );

    // 链接密度测试
    if (linkLen > elemLen * 0.8 || (elemNum > 1 && shortElems / elemNum > 0.8)) {
      return [true, textList];
    }
  }

  return [false, textList];
}

/**
 * 移除链接密集的表格（可能是样板文本）
 * 对应 Python: link_density_test_tables()
 * 
 * @param {Element} element - 表格元素
 * @returns {boolean} 是否应该移除
 */
export function linkDensityTestTables(element) {
  const linksXpath = Array.from(element.querySelectorAll('a, ref'));

  if (linksXpath.length === 0) {
    return false;
  }

  const elemLen = trim(element.textContent).length;
  if (elemLen < 200) {
    return false;
  }

  const { totalLen: linkLen, elemNum } = collectLinkInfo(linksXpath);
  
  if (elemNum === 0) {
    return true;
  }

  console.debug(`table link text: ${linkLen} / total: ${elemLen}`);
  
  return elemLen < 1000 
    ? linkLen > 0.8 * elemLen 
    : linkLen > 0.5 * elemLen;
}

/**
 * 根据链接密度删除元素
 * 对应 Python: delete_by_link_density()
 * 
 * @param {Element} subtree - 子树
 * @param {string} tagName - 标签名
 * @param {boolean} backtracking - 是否回溯
 * @param {boolean} favorPrecision - 是否偏向精确度
 * @returns {Element} 处理后的子树
 */
export function deleteByLinkDensity(
  subtree,
  tagName,
  backtracking = false,
  favorPrecision = false
) {
  const deletions = [];
  const lenThreshold = favorPrecision ? 200 : 100;
  const depthThreshold = favorPrecision ? 1 : 3;

  const elements = subtree.querySelectorAll(tagName);
  elements.forEach(elem => {
    const elemText = trim(elem.textContent);
    const [result, tempList] = linkDensityTest(elem, elemText, favorPrecision);

    if (
      result ||
      (backtracking &&
        tempList.length > 0 &&
        elemText.length > 0 &&
        elemText.length < lenThreshold &&
        elem.children.length >= depthThreshold)
    ) {
      deletions.push(elem);
    }
  });

  // 使用 Set 去重后删除
  const uniqueDeletions = Array.from(new Set(deletions));
  uniqueDeletions.forEach(elem => deleteElement(elem));

  return subtree;
}

// ============= 转换映射（需要在函数定义之后）=============

// 注意：这些映射在所有转换函数定义之后定义
// 将在文件末尾导出

// ============= 节点处理函数 =============

/**
 * 转换、格式化和探测潜在的文本元素
 * 对应 Python: handle_textnode()
 * 
 * @param {Element} elem - 元素
 * @param {Extractor} options - 提取选项
 * @param {boolean} commentsFix - 是否修复评论
 * @param {boolean} preserveSpaces - 是否保留空格
 * @returns {Element|null} 处理后的元素或 null
 */
export function handleTextNode(
  elem,
  options,
  commentsFix = true,
  preserveSpaces = false
) {
  const tagName = elem.tagName ? elem.tagName.toLowerCase() : '';

  // 图形元素处理
  if (tagName === 'graphic' && isImageElement(elem)) {
    return elem;
  }

  // 已完成或空元素
  if (tagName === 'done' || 
      (elem.children.length === 0 && !elem.textContent && !elem.getAttribute('tail'))) {
    return null;
  }

  // lb 绕过（换行）
  if (!commentsFix && tagName === 'lb') {
    if (!preserveSpaces) {
      const tail = elem.getAttribute('tail');
      elem.setAttribute('tail', trim(tail) || '');
    }
    return elem;
  }

  // 如果没有文本且没有子元素，尝试使用 tail
  if (!elem.textContent && elem.children.length === 0) {
    const tail = elem.getAttribute('tail');
    if (tail) {
      elem.textContent = tail;
      elem.setAttribute('tail', '');
      
      // 对于 lb 元素，转换为 p
      if (commentsFix && tagName === 'lb') {
        const newElem = document.createElement('p');
        newElem.textContent = elem.textContent;
        elem.parentNode.replaceChild(newElem, elem);
        return newElem;
      }
    }
  }

  // 修整文本
  if (!preserveSpaces) {
    if (elem.firstChild && elem.firstChild.nodeType === Node.TEXT_NODE) {
      elem.firstChild.textContent = trim(elem.firstChild.textContent) || '';
    }
    const tail = elem.getAttribute('tail');
    if (tail) {
      elem.setAttribute('tail', trim(tail) || '');
    }
  }

  // 过滤内容
  if (
    (!elem.textContent && textFilter(elem)) ||
    (options.dedup && duplicateTest(elem, options))
  ) {
    return null;
  }

  return elem;
}

/**
 * 转换、格式化和探测潜在的文本元素（轻量格式）
 * 对应 Python: process_node()
 * 
 * @param {Element} elem - 元素
 * @param {Extractor} options - 提取选项
 * @returns {Element|null} 处理后的元素或 null
 */
export function processNode(elem, options) {
  const tagName = elem.tagName ? elem.tagName.toLowerCase() : '';

  // 已完成或空元素
  if (tagName === 'done' || 
      (elem.children.length === 0 && !elem.textContent && !elem.getAttribute('tail'))) {
    return null;
  }

  // 修整文本和 tail
  if (elem.firstChild && elem.firstChild.nodeType === Node.TEXT_NODE) {
    elem.firstChild.textContent = trim(elem.firstChild.textContent) || '';
  }
  const tail = elem.getAttribute('tail');
  if (tail) {
    elem.setAttribute('tail', trim(tail) || '');
  }

  // 调整内容字符串
  if (tagName !== 'lb' && !elem.textContent && tail) {
    elem.textContent = tail;
    elem.setAttribute('tail', '');
  }

  // 内容检查
  if (elem.textContent || tail) {
    if (textFilter(elem) || (options.dedup && duplicateTest(elem, options))) {
      return null;
    }
  }

  return elem;
}

/**
 * 转换列表：<ul> 和 <ol> 转为 <list>，<li> 转为 <item>
 * 对应 Python: convert_lists()
 * 
 * @param {Element} elem - 列表元素
 */
export function convertLists(elem) {
  const tagName = elem.tagName.toLowerCase();
  elem.setAttribute('rend', tagName);
  
  // 修改标签名（通过创建新元素）
  const newElem = document.createElement('list');
  Array.from(elem.attributes).forEach(attr => {
    newElem.setAttribute(attr.name, attr.value);
  });
  
  // 转换子元素
  let i = 1;
  const children = Array.from(elem.querySelectorAll('dd, dt, li'));
  children.forEach(subelem => {
    const subTag = subelem.tagName.toLowerCase();
    
    // 跟踪 dd/dt 项
    if (subTag === 'dd' || subTag === 'dt') {
      subelem.setAttribute('rend', `${subTag}-${i}`);
      // 在 <dd> 后递增计数器
      if (subTag === 'dd') {
        i++;
      }
    }
    
    // 转换元素标签
    const itemElem = document.createElement('item');
    Array.from(subelem.attributes).forEach(attr => {
      itemElem.setAttribute(attr.name, attr.value);
    });
    while (subelem.firstChild) {
      itemElem.appendChild(subelem.firstChild);
    }
    subelem.parentNode.replaceChild(itemElem, subelem);
  });
  
  // 移动所有子节点
  while (elem.firstChild) {
    newElem.appendChild(elem.firstChild);
  }
  
  elem.parentNode.replaceChild(newElem, elem);
}

/**
 * 转换引用元素，同时考虑嵌套结构
 * 对应 Python: convert_quotes()
 * 
 * @param {Element} elem - 引用元素
 */
export function convertQuotes(elem) {
  let codeFlag = false;
  const tagName = elem.tagName.toLowerCase();

  if (tagName === 'pre') {
    // 检测是否可能包含代码
    // 只有一个 span 的 pre 更可能是代码
    if (elem.children.length === 1 && elem.children[0].tagName.toLowerCase() === 'span') {
      codeFlag = true;
    }

    // 查找 hljs 元素来检测是否是代码
    const codeElems = elem.querySelectorAll('span[class*="hljs"]');
    if (codeElems.length > 0) {
      codeFlag = true;
      codeElems.forEach(subelem => {
        // 清除属性
        while (subelem.attributes.length > 0) {
          subelem.removeAttribute(subelem.attributes[0].name);
        }
      });
    }

    if (isCodeBlock(elem.textContent)) {
      codeFlag = true;
    }
  }

  // 创建新元素
  const newTag = codeFlag ? 'code' : 'quote';
  replaceElementTag(elem, newTag);
}

/**
 * 检查元素文本是否为代码块
 * 对应 Python: _is_code_block()
 * 
 * @param {string} text - 元素文本
 * @returns {boolean} 是否为代码块
 */
function isCodeBlock(text) {
  if (!text) return false;

  for (const indicator of CODE_INDICATORS) {
    if (text.includes(indicator)) {
      return true;
    }
  }

  return false;
}

/**
 * 添加 head 标签并删除属性
 * 对应 Python: convert_headings()
 * 
 * @param {Element} elem - 标题元素
 */
export function convertHeadings(elem) {
  const oldTag = elem.tagName.toLowerCase();
  
  // 清除所有属性
  while (elem.attributes.length > 0) {
    elem.removeAttribute(elem.attributes[0].name);
  }
  
  // 设置 rend 属性
  elem.setAttribute('rend', oldTag);
  
  // 替换标签
  replaceElementTag(elem, 'head');
}

/**
 * 转换 <br> 和 <hr> 为 <lb>
 * 对应 Python: convert_line_breaks()
 * 
 * @param {Element} elem - 换行元素
 */
export function convertLineBreaks(elem) {
  replaceElementTag(elem, 'lb');
}

/**
 * 转换 <del>, <s>, <strike> 为 <del rend="overstrike">
 * 对应 Python: convert_deletions()
 * 
 * @param {Element} elem - 删除线元素
 */
export function convertDeletions(elem) {
  replaceElementTag(elem, 'del');
  elem.setAttribute('rend', 'overstrike');
}

/**
 * 处理 details 和 summary
 * 对应 Python: convert_details()
 * 
 * @param {Element} elem - details 元素
 */
export function convertDetails(elem) {
  replaceElementTag(elem, 'div');
  
  const summaries = elem.querySelectorAll('summary');
  summaries.forEach(subelem => {
    replaceElementTag(subelem, 'head');
  });
}

/**
 * 替换链接标签和 href 属性，删除其余属性
 * 对应 Python: convert_link()
 * 
 * @param {Element} elem - 链接元素
 * @param {string} baseUrl - 基础 URL
 */
export function convertLink(elem, baseUrl) {
  const href = elem.getAttribute('href');
  
  replaceElementTag(elem, 'ref');
  
  // 清除所有属性
  while (elem.attributes.length > 0) {
    elem.removeAttribute(elem.attributes[0].name);
  }
  
  if (href) {
    let target = href;
    // 转换相对 URL
    if (baseUrl) {
      target = fixRelativeUrls(baseUrl, href);
    }
    elem.setAttribute('target', target);
  }
}

/**
 * 简化标记并将相关 HTML 标签转换为 XML 标准
 * 对应 Python: convert_tags()
 * 
 * @param {Element} tree - HTML 树
 * @param {Extractor} options - 提取选项
 * @param {string} url - 页面 URL
 * @returns {Element} 转换后的树
 */
export function convertTags(tree, options, url = null) {
  // 删除链接以加快处理速度
  if (!options.links) {
    // 查找需要转换的链接
    let selector = 'div a, li a, p a';
    if (options.tables) {
      selector += ', table a';
    }
    
    const links = tree.querySelectorAll(selector);
    links.forEach(elem => {
      replaceElementTag(elem, 'ref');
    });
    
    // 剥离其余链接
    const allLinks = tree.querySelectorAll('a');
    allLinks.forEach(elem => stripTag(elem));
  } else {
    // 获取基础 URL 用于转换相对 URL
    let baseUrl = null;
    if (url) {
      baseUrl = getBaseUrl(url);
    }
    
    const links = tree.querySelectorAll('a, ref');
    links.forEach(elem => {
      convertLink(elem, baseUrl);
    });
  }

  // 处理格式化标签
  if (options.formatting) {
    Object.keys(REND_TAG_MAPPING).forEach(tag => {
      const elements = tree.querySelectorAll(tag);
      elements.forEach(elem => {
        // 清除所有属性
        while (elem.attributes.length > 0) {
          elem.removeAttribute(elem.attributes[0].name);
        }
        elem.setAttribute('rend', REND_TAG_MAPPING[tag]);
        replaceElementTag(elem, 'hi');
      });
    });
  } else {
    // 剥离格式化标签
    Object.keys(REND_TAG_MAPPING).forEach(tag => {
      const elements = tree.querySelectorAll(tag);
      elements.forEach(elem => stripTag(elem));
    });
  }

  // 遍历所有相关元素并进行转换
  Object.keys(CONVERSIONS).forEach(tag => {
    const elements = tree.querySelectorAll(tag);
    elements.forEach(elem => {
      const converter = CONVERSIONS[tag];
      if (typeof converter === 'function') {
        converter(elem);
      }
    });
  });

  // 图片
  if (options.images) {
    const images = tree.querySelectorAll('img');
    images.forEach(elem => {
      replaceElementTag(elem, 'graphic');
    });
  }

  return tree;
}

/**
 * 将 XML 转换为简化的 HTML
 * 对应 Python: convert_to_html()
 * 
 * @param {Element} tree - XML 树
 * @returns {Element} HTML 树
 */
export function convertToHtml(tree) {
  // 处理所有转换
  Object.keys(HTML_CONVERSIONS).forEach(tag => {
    const elements = tree.querySelectorAll(tag);
    elements.forEach(elem => {
      const conversion = HTML_CONVERSIONS[tag];
      
      // 应用函数或直接转换
      if (typeof conversion === 'function') {
        const newTag = conversion(elem);
        replaceElementTag(elem, newTag);
      } else {
        replaceElementTag(elem, conversion);
      }
      
      // 处理属性
      if (elem.tagName.toLowerCase() === 'a') {
        const target = elem.getAttribute('target');
        elem.setAttribute('href', target || '');
        elem.removeAttribute('target');
      } else {
        // 清除所有属性
        while (elem.attributes.length > 0) {
          elem.removeAttribute(elem.attributes[0].name);
        }
      }
    });
  });

  // 创建 HTML 结构
  replaceElementTag(tree, 'body');
  
  const html = document.createElement('html');
  html.appendChild(tree);
  
  return html;
}

/**
 * 将文档转换为 HTML 并返回字符串
 * 对应 Python: build_html_output()
 * 
 * @param {Document} doc - 文档对象
 * @param {boolean} withMetadata - 是否包含元数据
 * @returns {string} HTML 字符串
 */
export function buildHtmlOutput(doc, withMetadata = false) {
  const htmlTree = convertToHtml(doc.body.cloneNode(true));

  if (withMetadata) {
    const head = document.createElement('head');
    
    // 元数据属性
    const metaAttributes = ['title', 'author', 'url', 'hostname', 'description', 
                           'sitename', 'date', 'categories', 'tags', 'license'];
    
    metaAttributes.forEach(item => {
      const value = doc[item];
      if (value) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', item);
        meta.setAttribute('content', Array.isArray(value) ? value.join(', ') : value);
        head.appendChild(meta);
      }
    });
    
    htmlTree.insertBefore(head, htmlTree.firstChild);
  }

  // 转换为字符串
  return htmlTree.outerHTML;
}

/**
 * 替换元素标签名
 * 
 * @param {Element} elem - 要替换的元素
 * @param {string} newTag - 新标签名
 */
function replaceElementTag(elem, newTag) {
  if (!elem || !elem.parentNode) return;
  
  const newElem = document.createElement(newTag);
  
  // 复制属性
  Array.from(elem.attributes).forEach(attr => {
    newElem.setAttribute(attr.name, attr.value);
  });
  
  // 移动子节点
  while (elem.firstChild) {
    newElem.appendChild(elem.firstChild);
  }
  
  // 替换元素
  elem.parentNode.replaceChild(newElem, elem);
}

// ============= 转换映射 =============

/**
 * HTML 标签转换函数映射
 * 对应 Python: CONVERSIONS
 */
export const CONVERSIONS = {
  dl: convertLists,
  ol: convertLists,
  ul: convertLists,
  h1: convertHeadings,
  h2: convertHeadings,
  h3: convertHeadings,
  h4: convertHeadings,
  h5: convertHeadings,
  h6: convertHeadings,
  br: convertLineBreaks,
  hr: convertLineBreaks,
  blockquote: convertQuotes,
  pre: convertQuotes,
  q: convertQuotes,
  del: convertDeletions,
  s: convertDeletions,
  strike: convertDeletions,
  details: convertDetails,
};

/**
 * XML 到 HTML 的转换映射
 * 对应 Python: HTML_CONVERSIONS
 */
export const HTML_CONVERSIONS = {
  list: 'ul',
  item: 'li',
  code: 'pre',
  quote: 'blockquote',
  head: (elem) => {
    const rend = elem.getAttribute('rend') || 'h3';
    return rend.match(/h[1-6]/) ? rend : 'h3';
  },
  lb: 'br',
  img: 'graphic',
  ref: 'a',
  hi: (elem) => {
    const rend = elem.getAttribute('rend') || '#i';
    return HTML_TAG_MAPPING[rend] || 'span';
  },
};

// 导出所有函数
export default {
  treeCleaning,
  pruneHtml,
  pruneUnwantedNodes,
  collectLinkInfo,
  linkDensityTest,
  linkDensityTestTables,
  deleteByLinkDensity,
  handleTextNode,
  processNode,
  convertLists,
  convertQuotes,
  convertHeadings,
  convertLineBreaks,
  convertDeletions,
  convertDetails,
  convertLink,
  convertTags,
  convertToHtml,
  buildHtmlOutput,
  CONVERSIONS,
  HTML_CONVERSIONS,
};

