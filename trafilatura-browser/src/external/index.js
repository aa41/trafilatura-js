/**
 * 外部提取器集成模块
 * 
 * 对应Python模块: trafilatura/external.py
 * 
 * 集成第三方提取算法（如Readability）作为备选方案
 * 
 * @module external
 */

import Readability from '../utils/Readability.js';
import { treeCleaning } from '../processing/index.js';
import { convertTags } from '../processing/convert-tags.js';
import { trim } from '../utils/text.js';
import { TEI_VALID_TAGS } from '../output/constants.js';

/**
 * 使用Readability算法提取内容
 * 对应Python: try_readability() - external.py:32-42
 * 
 * @param {Element} htmlInput - HTML DOM元素
 * @returns {Element} 提取的内容元素
 */
export function tryReadability(htmlInput) {
  if (!htmlInput) {
    return null;
  }
  
  try {
    // 克隆元素以避免修改原始DOM
    const clonedInput = htmlInput.cloneNode(true);
    
    // 创建临时document（如果需要）
    let doc = clonedInput.ownerDocument;
    if (!doc || !doc.body) {
      // 如果没有完整的document，创建一个
      doc = document.implementation.createHTMLDocument('');
      doc.body.innerHTML = clonedInput.innerHTML || '';
    }
    
    // 使用Readability提取
    const reader = new Readability(doc, {
      debug: false,
      maxElemsToParse: 0,
      nbTopCandidates: 5,
      charThreshold: 25,
      classesToPreserve: [],
      keepClasses: false
    });
    
    const article = reader.parse();
    
    if (!article || !article.content) {
      console.debug('Readability extraction failed: no content');
      return null;
    }
    
    // 将HTML字符串转换为DOM元素
    const wrapper = document.createElement('div');
    wrapper.innerHTML = article.content;
    
    return wrapper;
    
  } catch (err) {
    console.warn('Readability extraction failed:', err.message);
    return null;
  }
}

/**
 * 清理和转换外部提取器的输出
 * 对应Python: sanitize_tree() - external.py:163-190
 * 
 * @param {Element} tree - 外部提取器返回的DOM树
 * @param {Extractor} options - 提取选项
 * @returns {Object} {body, text, length}
 */
export function sanitizeTree(tree, options) {
  if (!tree) {
    return { body: null, text: '', length: 0 };
  }
  
  // 1. 清理
  let cleanedTree = treeCleaning(tree, options);
  
  // 移除链接（如果不需要）
  if (!options.links) {
    const links = cleanedTree.querySelectorAll('a');
    for (const link of links) {
      // 替换为文本内容
      const text = document.createTextNode(link.textContent);
      link.parentNode.replaceChild(text, link);
    }
  }
  
  // 移除span标签
  const spans = cleanedTree.querySelectorAll('span');
  for (const span of spans) {
    while (span.firstChild) {
      span.parentNode.insertBefore(span.firstChild, span);
    }
    if (span.parentNode) {
      span.parentNode.removeChild(span);
    }
  }
  
  // 2. 转换标签
  cleanedTree = convertTags(cleanedTree, options);
  
  // 3. 转换表格标签
  const tableElems = cleanedTree.querySelectorAll('td, th, tr');
  for (const elem of tableElems) {
    if (elem.tagName.toLowerCase() === 'tr') {
      elem.tagName = 'row';
    } else if (elem.tagName.toLowerCase() === 'td' || elem.tagName.toLowerCase() === 'th') {
      if (elem.tagName.toLowerCase() === 'th') {
        elem.setAttribute('role', 'head');
      }
      // 注意：浏览器不允许直接修改tagName，这里需要用renameElement
      const newElem = document.createElement('cell');
      while (elem.firstChild) {
        newElem.appendChild(elem.firstChild);
      }
      for (let i = 0; i < elem.attributes.length; i++) {
        newElem.setAttribute(elem.attributes[i].name, elem.attributes[i].value);
      }
      if (elem.parentNode) {
        elem.parentNode.replaceChild(newElem, elem);
      }
    }
  }
  
  // 4. 清理无效标签
  const allElements = cleanedTree.querySelectorAll('*');
  const invalidTags = new Set();
  
  for (const elem of allElements) {
    const tagName = elem.tagName.toLowerCase();
    if (!TEI_VALID_TAGS.includes(tagName)) {
      invalidTags.add(tagName);
    }
  }
  
  // 移除无效标签（保留内容）
  for (const tagName of invalidTags) {
    const elements = cleanedTree.querySelectorAll(tagName);
    for (const elem of elements) {
      while (elem.firstChild) {
        elem.parentNode.insertBefore(elem.firstChild, elem);
      }
      if (elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  }
  
  // 5. 返回结果
  const text = trim(cleanedTree.textContent || '');
  return {
    body: cleanedTree,
    text: text,
    length: text.length
  };
}

/**
 * 比较Trafilatura和外部提取器的结果，选择更好的
 * 对应Python: compare_extraction() - external.py:45-108
 * 
 * @param {Element} tree - 原始HTML树
 * @param {Element} backupTree - 备份的HTML树
 * @param {Element} body - Trafilatura提取的内容
 * @param {string} text - Trafilatura提取的文本
 * @param {number} lenText - 文本长度
 * @param {Extractor} options - 提取选项
 * @returns {Object} {body, text, length}
 */
export function compareExtraction(tree, backupTree, body, text, lenText, options) {
  // 1. 如果是recall模式且文本足够长，直接返回
  if (options.focus === 'recall' && lenText > options.min_extracted_size * 10) {
    console.debug('Recall mode with sufficient text, skipping comparison');
    return { body, text, length: lenText };
  }
  
  let useReadability = false;
  
  // 2. 尝试使用Readability
  const tempPostAlgo = tryReadability(backupTree);
  
  if (!tempPostAlgo) {
    console.debug('Readability extraction returned null');
    return { body, text, length: lenText };
  }
  
  const algoText = trim(tempPostAlgo.textContent || '');
  const lenAlgo = algoText.length;
  
  // 3. 比较结果
  console.debug(`Extracted length: ${lenAlgo} (Readability) vs ${lenText} (Trafilatura)`);
  
  // 决定是否使用Readability
  if (lenAlgo === 0 || lenAlgo === lenText) {
    // 相同长度或Readability无结果
    useReadability = false;
  } else if (lenText === 0 && lenAlgo > 0) {
    // Trafilatura无结果但Readability有
    useReadability = true;
  } else if (lenText > 2 * lenAlgo) {
    // Trafilatura结果远好于Readability
    useReadability = false;
  } else if (lenAlgo > 2 * lenText && !algoText.startsWith('{')) {
    // Readability结果远好于Trafilatura（排除JSON）
    useReadability = true;
  } else if (!body.querySelectorAll('p').length && lenAlgo > options.min_extracted_size * 2) {
    // Trafilatura没有段落但Readability有足够内容
    useReadability = true;
  } else if (body.querySelectorAll('table').length > body.querySelectorAll('p').length && 
             lenAlgo > options.min_extracted_size * 2) {
    // 表格多于段落，且Readability有足够内容
    useReadability = true;
  } else if (options.focus === 'recall' && 
             !body.querySelectorAll('head').length && 
             tempPostAlgo.querySelectorAll('h2, h3, h4').length && 
             lenAlgo > lenText) {
    // Recall模式：Trafilatura缺少标题但Readability有
    useReadability = true;
  } else {
    console.debug(`Extraction values: ${lenText} (Trafilatura) vs ${lenAlgo} (Readability) for ${options.source || 'unknown'}`);
    useReadability = false;
  }
  
  // 4. 应用决策
  if (useReadability) {
    console.debug(`Using Readability algorithm for ${options.source || 'unknown'}`);
    
    // 清理和转换Readability的输出
    const sanitized = sanitizeTree(tempPostAlgo, options);
    return {
      body: sanitized.body,
      text: sanitized.text,
      length: sanitized.length
    };
  } else {
    console.debug(`Using Trafilatura extraction for ${options.source || 'unknown'}`);
    return { body, text, length: lenText };
  }
}

/**
 * 导出所有函数
 */
export default {
  tryReadability,
  sanitizeTree,
  compareExtraction
};

