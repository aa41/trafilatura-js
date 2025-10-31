/**
 * 输出格式控制模块
 * 
 * 提供determineReturnString函数，根据配置选择输出格式
 * 对应Python模块: trafilatura/core.py
 * 
 * @module core/output-control
 */

import { xmlToTxt } from '../output/text.js';
import { buildJsonOutput } from '../output/json.js';
import { xmlToCsv } from '../output/csv.js';
import { writeTeiTree, teiToString } from '../output/tei.js';
import { removeEmptyElements, stripDoubleTags } from '../output/xml-processing.js';

/**
 * Unicode标准化
 * 对应Python: normalize_unicode() - utils.py:277-279
 * 
 * 将字符串标准化为指定的Unicode格式
 * 
 * @param {string} str - 要标准化的字符串
 * @param {string} form - 标准化形式 ('NFC', 'NFD', 'NFKC', 'NFKD')
 * @returns {string} 标准化后的字符串
 */
export function normalizeUnicode(str, form = 'NFC') {
  if (!str) return str;
  
  try {
    return str.normalize(form);
  } catch (e) {
    console.warn('Unicode normalization failed:', e);
    return str;
  }
}

/**
 * 构建元数据头部
 * 对应Python: determine_returnstring() - core.py:73-91
 * 
 * 为TXT/Markdown格式生成元数据头部（YAML格式）
 * 
 * @param {Document} document - Document对象
 * @returns {string} 元数据头部字符串
 */
export function buildMetadataHeader(document) {
  if (!document) return '';
  
  let header = '---\n';
  
  // 元数据字段顺序（与Python保持一致）
  const metaFields = [
    'title',
    'author',
    'url',
    'hostname',
    'description',
    'sitename',
    'date',
    'categories',
    'tags',
    'fingerprint',
    'id',
    'license'
  ];
  
  for (const field of metaFields) {
    const value = document[field];
    
    if (value !== null && value !== undefined) {
      // 数组类型转换为字符串
      if (Array.isArray(value)) {
        if (value.length > 0) {
          header += `${field}: ${value.join('; ')}\n`;
        }
      } else {
        header += `${field}: ${String(value)}\n`;
      }
    }
  }
  
  header += '---\n';
  
  return header;
}

/**
 * 清理XML body中的空元素
 * 对应Python: determine_returnstring() - core.py:48-59
 * 
 * 在XML/TEI输出前进行最后清理
 * 
 * @param {Element} body - DOM元素
 */
function cleanXmlBody(body) {
  if (!body) return;
  
  // 遍历所有元素
  const elements = Array.from(body.querySelectorAll('*'));
  
  for (const element of elements) {
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    
    // 跳过graphic元素
    if (tagName === 'graphic') {
      continue;
    }
    
    // 检查是否为空元素
    const isEmpty = element.children.length === 0 &&
                   !element.textContent &&
                   !element.nextSibling?.nodeType === Node.TEXT_NODE;
    
    if (isEmpty) {
      const parent = element.parentNode;
      
      // 不移除code元素内的元素（保持格式）
      if (parent && parent.tagName?.toLowerCase() !== 'code') {
        parent.removeChild(element);
      }
    }
  }
}

/**
 * 构建简单XML输出
 * 
 * @param {Document} doc - Document对象（自定义）
 * @returns {string} XML字符串
 */
function buildXmlOutput(doc) {
  // 简单XML输出（只包含body内容）
  // 注意：使用全局document对象创建元素，而不是参数doc
  const root = window.document.createElement('doc');
  
  // 添加元数据属性
  if (doc.title) root.setAttribute('title', doc.title);
  if (doc.author) root.setAttribute('author', doc.author);
  if (doc.url) root.setAttribute('url', doc.url);
  if (doc.date) root.setAttribute('date', doc.date);
  
  // 添加body
  if (doc.body) {
    const bodyClone = doc.body.cloneNode(true);
    root.appendChild(bodyClone);
  }
  
  // 序列化
  const serializer = new XMLSerializer();
  return serializer.serializeToString(root);
}

/**
 * 根据配置选择输出格式
 * 对应Python: determine_returnstring() - core.py:44-99
 * 
 * 将Document对象转换为指定格式的字符串
 * 
 * @param {Document} doc - Document对象（自定义）
 * @param {Extractor} options - 提取器配置
 * @returns {string} 格式化后的输出字符串
 * 
 * @example
 * const result = determineReturnString(doc, {
 *   format: 'markdown',
 *   with_metadata: true,
 *   formatting: true
 * });
 */
export function determineReturnString(doc, options) {
  if (!doc) {
    return '';
  }
  
  let returnString = '';
  const format = options.format || 'txt';
  
  // XML/TEI格式
  if (format === 'xml' || format === 'xmltei' || format === 'tei') {
    // 最后清理
    if (doc.body) {
      cleanXmlBody(doc.body);
      stripDoubleTags(doc.body);
      removeEmptyElements(doc.body);
    }
    
    // 构建输出树
    if (format === 'xml') {
      returnString = buildXmlOutput(doc);
    } else {
      // TEI格式
      try {
        const teiDoc = writeTeiTree(doc);
        returnString = teiToString(teiDoc);
      } catch (e) {
        console.error('TEI generation failed:', e);
        returnString = buildXmlOutput(doc);
      }
    }
  }
  // CSV格式
  else if (format === 'csv') {
    returnString = xmlToCsv(doc, options.formatting);
  }
  // JSON格式
  else if (format === 'json') {
    returnString = buildJsonOutput(doc, options.with_metadata);
  }
  // Markdown和TXT格式
  else {
    let header = '';
    
    // 添加元数据头部
    if (options.with_metadata) {
      header = buildMetadataHeader(doc);
    }
    
    // 转换正文
    let bodyText = '';
    if (doc.body) {
      bodyText = xmlToTxt(doc.body, options.formatting);
    }
    
    // 转换评论
    let commentsText = '';
    if (doc.commentsbody) {
      const commentsContent = xmlToTxt(doc.commentsbody, options.formatting);
      if (commentsContent) {
        commentsText = '\n' + commentsContent;
      }
    }
    
    // 合并所有部分
    returnString = header + bodyText + commentsText;
    returnString = returnString.trim();
  }
  
  // 标准化Unicode（默认为NFC）
  return normalizeUnicode(returnString);
}

/**
 * 导出所有函数
 */
export default {
  determineReturnString,
  buildMetadataHeader,
  normalizeUnicode
};

