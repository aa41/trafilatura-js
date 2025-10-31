/**
 * HTML标签转换模块
 * 
 * 将HTML标签转换为Trafilatura内部XML标准
 * 对应Python模块: trafilatura/htmlprocessing.py:convert_tags()
 * 
 * @module processing/convert-tags
 */

import { getBaseUrl, normalizeUrl } from '../utils/url.js';

/**
 * 重命名DOM元素（创建新元素并替换）
 * DOM API中无法直接修改tagName属性
 * 
 * @param {Element} elem - 要重命名的元素
 * @param {string} newTagName - 新标签名
 * @returns {Element} 新元素
 */
function renameElement(elem, newTagName) {
  const doc = elem.ownerDocument || document;
  const newElem = doc.createElement(newTagName);
  
  // 复制所有属性
  for (let i = 0; i < elem.attributes.length; i++) {
    const attr = elem.attributes[i];
    newElem.setAttribute(attr.name, attr.value);
  }
  
  // 移动所有子节点
  while (elem.firstChild) {
    newElem.appendChild(elem.firstChild);
  }
  
  // 替换元素
  if (elem.parentNode) {
    elem.parentNode.replaceChild(newElem, elem);
  }
  
  return newElem;
}

/**
 * 格式化标签映射
 * 对应Python: REND_TAG_MAPPING
 */
export const REND_TAG_MAPPING = {
  'em': '#i',
  'i': '#i',
  'b': '#b',
  'strong': '#b',
  'u': '#u',
  'kbd': '#t',
  'samp': '#t',
  'tt': '#t',
  'var': '#t',
  'sub': '#sub',
  'sup': '#sup'
};

/**
 * 反向HTML标签映射
 */
export const HTML_TAG_MAPPING = Object.fromEntries(
  Object.entries(REND_TAG_MAPPING).map(([k, v]) => [v, k])
);

/**
 * 代码块指示符
 */
const CODE_INDICATORS = ['{', '("', "('", '\n    '];

/**
 * 检查文本是否是代码块
 * 对应Python: _is_code_block() - htmlprocessing.py:318-325
 * 
 * @param {string} text - 文本内容
 * @returns {boolean} 是否是代码块
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
 * 转换列表标签
 * 对应Python: convert_lists() - htmlprocessing.py:284-297
 * 
 * 将 <ul>, <ol>, <dl> 转换为 <list>
 * 将 <li>, <dd>, <dt> 转换为 <item>
 * 
 * @param {Element} elem - 列表元素
 */
function convertLists(elem) {
  // 保存原始标签名作为rend属性
  const originalTag = elem.tagName.toLowerCase();
  elem.setAttribute('rend', originalTag);
  
  // 收集需要转换的子元素（避免在遍历时修改）
  const itemsToConvert = [];
  const items = elem.querySelectorAll('dd, dt, li');
  
  let i = 1;
  for (const subelem of items) {
    const tag = subelem.tagName.toLowerCase();
    
    // 处理描述列表项
    if (tag === 'dd' || tag === 'dt') {
      subelem.setAttribute('rend', `${tag}-${i}`);
      if (tag === 'dd') {
        i++;
      }
    }
    
    itemsToConvert.push(subelem);
  }
  
  // 转换所有子元素
  for (const subelem of itemsToConvert) {
    renameElement(subelem, 'item');
  }
  
  // 最后转换列表本身
  return renameElement(elem, 'list');
}

/**
 * 转换引用和代码块
 * 对应Python: convert_quotes() - htmlprocessing.py:300-316
 * 
 * 将 <blockquote>, <pre>, <q> 转换为 <quote> 或 <code>
 * 
 * @param {Element} elem - 引用或代码元素
 */
function convertQuotes(elem) {
  let codeFlag = false;
  const tag = elem.tagName.toLowerCase();
  
  if (tag === 'pre') {
    // 检测是否包含代码
    // pre with a single span is more likely to be code
    if (elem.children.length === 1 && elem.children[0].tagName.toLowerCase() === 'span') {
      codeFlag = true;
    }
    
    // 查找高亮代码元素
    const codeElems = elem.querySelectorAll('span[class^="hljs"]');
    if (codeElems.length > 0) {
      codeFlag = true;
      for (const subelem of codeElems) {
        // 清除属性
        while (subelem.attributes.length > 0) {
          subelem.removeAttribute(subelem.attributes[0].name);
        }
      }
    }
    
    // 检查文本内容
    if (isCodeBlock(elem.textContent)) {
      codeFlag = true;
    }
  }
  
  return renameElement(elem, codeFlag ? 'code' : 'quote');
}

/**
 * 转换标题标签
 * 对应Python: convert_headings() - htmlprocessing.py:327-331
 * 
 * 将 <h1>-<h6> 转换为 <head rend="h1">-<head rend="h6">
 * 
 * @param {Element} elem - 标题元素
 */
function convertHeadings(elem) {
  const tag = elem.tagName.toLowerCase();
  
  // 清除所有属性
  while (elem.attributes.length > 0) {
    elem.removeAttribute(elem.attributes[0].name);
  }
  
  // 设置rend属性为原始标签名
  elem.setAttribute('rend', tag);
  
  return renameElement(elem, 'head');
}

/**
 * 转换换行标签
 * 对应Python: convert_line_breaks() - htmlprocessing.py:334-336
 * 
 * 将 <br>, <hr> 转换为 <lb>
 * 
 * @param {Element} elem - 换行元素
 */
function convertLineBreaks(elem) {
  return renameElement(elem, 'lb');
}

/**
 * 转换删除标签
 * 对应Python: convert_deletions() - htmlprocessing.py:339-342
 * 
 * 将 <del>, <s>, <strike> 转换为 <del rend="overstrike">
 * 
 * @param {Element} elem - 删除元素
 */
function convertDeletions(elem) {
  elem.setAttribute('rend', 'overstrike');
  return renameElement(elem, 'del');
}

/**
 * 转换details标签
 * 对应Python: convert_details() - htmlprocessing.py:345-349
 * 
 * 将 <details> 转换为 <div>，<summary> 转换为 <head>
 * 
 * @param {Element} elem - details元素
 */
function convertDetails(elem) {
  const summaries = elem.querySelectorAll('summary');
  for (const subelem of summaries) {
    renameElement(subelem, 'head');
  }
  
  return renameElement(elem, 'div');
}

/**
 * 转换链接标签
 * 对应Python: convert_link() - htmlprocessing.py:375-384
 * 
 * 将 <a> 转换为 <ref>，处理href属性
 * 
 * @param {Element} elem - 链接元素
 * @param {string|null} baseUrl - 基础URL
 */
function convertLink(elem, baseUrl) {
  const target = elem.getAttribute('href');
  
  // 清除所有属性
  while (elem.attributes.length > 0) {
    elem.removeAttribute(elem.attributes[0].name);
  }
  
  // 处理URL
  if (target) {
    let fixedUrl = target;
    
    // 修复相对URL
    if (baseUrl) {
      try {
        const normalized = normalizeUrl(target, baseUrl);
        if (normalized) {
          fixedUrl = normalized;
        }
      } catch (e) {
        // 如果修复失败，保留原URL
      }
    }
    
    if (fixedUrl) {
      elem.setAttribute('target', fixedUrl);
    }
  }
  
  return renameElement(elem, 'ref');
}

/**
 * 标签转换函数映射
 * 对应Python: CONVERSIONS
 */
const CONVERSIONS = {
  'dl': convertLists,
  'ol': convertLists,
  'ul': convertLists,
  'h1': convertHeadings,
  'h2': convertHeadings,
  'h3': convertHeadings,
  'h4': convertHeadings,
  'h5': convertHeadings,
  'h6': convertHeadings,
  'br': convertLineBreaks,
  'hr': convertLineBreaks,
  'blockquote': convertQuotes,
  'pre': convertQuotes,
  'q': convertQuotes,
  'del': convertDeletions,
  's': convertDeletions,
  'strike': convertDeletions,
  'details': convertDetails
};

/**
 * 转换HTML标签为XML标准
 * 对应Python: convert_tags() - htmlprocessing.py:387-423
 * 
 * 简化标记并将相关HTML标签转换为XML标准
 * 
 * @param {Element} tree - HTML DOM树
 * @param {Extractor} options - 提取选项
 * @param {string|null} url - 页面URL
 * @returns {Element} 转换后的树
 * 
 * @example
 * const converted = convertTags(tree, options, url);
 */
export function convertTags(tree, options, url = null) {
  if (!tree || !options) {
    return tree;
  }
  
  // 1. 处理链接
  if (!options.links) {
    // Python: xpath_expr = ".//*[self::div or self::li or self::p]//a"
    let xpathExpr = 'div a, li a, p a';
    
    if (options.tables) {
      xpathExpr += ', table a';
    }
    
    // 将在div/li/p中的链接标记为ref（用于检测）
    const links = tree.querySelectorAll(xpathExpr);
    for (const elem of links) {
      renameElement(elem, 'ref');
    }
    
    // 删除其余的链接标签（保留内容）
    const remainingLinks = tree.querySelectorAll('a');
    for (const elem of remainingLinks) {
      // 将标签转换为其内容（类似strip_tags）
      while (elem.firstChild) {
        elem.parentNode.insertBefore(elem.firstChild, elem);
      }
      if (elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  } else {
    // 保留链接，获取基础URL用于转换相对URL
    const baseUrl = url ? getBaseUrl(url) : null;
    
    const allLinks = tree.querySelectorAll('a, ref');
    for (const elem of allLinks) {
      convertLink(elem, baseUrl);
    }
  }
  
  // 2. 处理格式化标签
  if (options.formatting) {
    // 转换格式化标签为 <hi rend="...">
    for (const [tag, rend] of Object.entries(REND_TAG_MAPPING)) {
      const elems = tree.querySelectorAll(tag);
      for (const elem of elems) {
        // 清除属性
        while (elem.attributes.length > 0) {
          elem.removeAttribute(elem.attributes[0].name);
        }
        elem.setAttribute('rend', rend);
        renameElement(elem, 'hi');
      }
    }
  } else {
    // 不保留格式，删除格式化标签（保留内容）
    for (const tag of Object.keys(REND_TAG_MAPPING)) {
      const elems = tree.querySelectorAll(tag);
      for (const elem of elems) {
        while (elem.firstChild) {
          elem.parentNode.insertBefore(elem.firstChild, elem);
        }
        if (elem.parentNode) {
          elem.parentNode.removeChild(elem);
        }
      }
    }
  }
  
  // 3. 遍历所有需要转换的元素
  for (const [tag, conversionFunc] of Object.entries(CONVERSIONS)) {
    const elems = tree.querySelectorAll(tag);
    for (const elem of elems) {
      conversionFunc(elem);
    }
  }
  
  // 4. 处理图片
  if (options.images) {
    const imgs = tree.querySelectorAll('img');
    for (const elem of imgs) {
      renameElement(elem, 'graphic');
    }
  }
  
  return tree;
}

/**
 * 导出所有函数
 */
export default {
  convertTags,
  REND_TAG_MAPPING,
  HTML_TAG_MAPPING
};

