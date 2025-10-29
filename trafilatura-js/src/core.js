/**
 * 核心流程编排
 * 对应 Python: trafilatura/core.py
 * 
 * 功能：
 * - 主提取函数（公共API）
 * - 提取序列控制
 * - 格式转换
 * - 流程编排
 */

import { Document, Extractor, useConfig } from './settings/config.js';
import { parseHTML  } from './utils/dom-utils.js';
import { normalizeUnicode, languageFilter } from './utils/text-utils.js';
import { extractMetadata } from './extraction/metadata.js';
import { extractContent, extractComments } from './extraction/extractor.js';
import { baseline, smartBaseline } from './extraction/baseline.js';
import { 
  treeCleaning, 
  pruneUnwantedNodes, 
  convertTags, 
  buildHtmlOutput 
} from './processing/html-processing.js';
import { getFormatter } from './formats/index.js';

// 文本格式集合
const TXT_FORMATS = new Set(['markdown', 'txt']);

/**
 * 确定返回字符串格式
 * 对应 Python: determine_returnstring()
 * 
 * @param {Document} document - 文档对象
 * @param {Extractor} options - 提取选项
 * @returns {string} 格式化后的字符串
 */
export function determineReturnString(document, options) {
  // 清理空元素
  if (document.body) {
    const elements = Array.from(document.body.querySelectorAll('*'));
    elements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      if (tagName !== 'graphic' &&
          element.children.length === 0 &&
          !element.textContent &&
          !element.getAttribute('tail')) {
        const parent = element.parentElement;
        if (parent && parent.tagName.toLowerCase() !== 'code') {
          parent.removeChild(element);
        }
      }
    });
  }
  
  // 使用新的格式化器系统
  const FormatterClass = getFormatter(options.format);
  const formatter = new FormatterClass(document, {
    with_metadata: options.with_metadata,
    formatting: options.formatting,
    links: options.links,
    images: options.images,
    comments: options.comments,
    include_structure: true,
  });
  
  return formatter.format();
}

/**
 * Trafilatura 提取序列
 * 对应 Python: trafilatura_sequence()
 * 
 * @param {Element} cleanedTree - 清理后的树
 * @param {Element} cleanedTreeBackup - 清理树备份
 * @param {Element} treeBackup - 原始树备份
 * @param {Extractor} options - 提取选项
 * @returns {Array} [postbody, tempText, lenText]
 */
export function trafilaturaSequence(cleanedTree, cleanedTreeBackup, treeBackup, options) {
  // Trafilatura 主提取器
  let [postbody, tempText, lenText] = extractContent(cleanedTree, options);
  
  // 与外部提取器比较（如果不是快速模式）
  if (!options.fast) {
    // TODO: 实现外部提取器对比
    // [postbody, tempText, lenText] = compareExtraction(...)
  }
  
  // 救援：在原始/脏树上进行基线提取
  if (lenText < options.min_extracted_size && options.focus !== 'precision') {
    [postbody, tempText, lenText] = baseline(treeBackup.cloneNode(true));
    console.debug(`Non-clean extracted length: ${lenText} (extraction)`);
  }
  
  return [postbody, tempText, lenText];
}

/**
 * 底层提取函数
 * 对应 Python: bare_extraction()
 * 
 * @param {string|Element} filecontent - HTML 内容
 * @param {Object} config - 配置选项
 * @returns {Document|null} 文档对象
 */
export async function bareExtraction(filecontent, config = {}) {
  // 解析配置
  const options = new Extractor(config);
  
  // 加载 HTML
  const tree = parseHTML(filecontent);
  if (!tree) {
    console.warn('Empty HTML or parsing failed');
    return null;
  }
  
  // 提取元数据
  const document = await extractMetadata(
    tree,
    config.url || null,
    config.date_extraction_params || null,
    config.extensive !== false,
    config.author_blacklist || null
  );
  
  // 语言过滤
  if (config.target_language) {
    if (!languageFilter(tree, document, config.target_language)) {
      console.warn('Language mismatch');
      return null;
    }
  }
  
  // 准备树的副本
  const treeBackup = tree.cloneNode(true);
  
  // 清理树
  let cleanedTree = treeCleaning(tree, options);
  const cleanedTreeBackup = cleanedTree.cloneNode(true);
  
  // 转换标签
  cleanedTree = convertTags(cleanedTree, options, config.url);
  
  // 提取序列
  let [postbody, tempText, lenText] = trafilaturaSequence(
    cleanedTree,
    cleanedTreeBackup,
    treeBackup,
    options
  );
  
  // 检查最小提取大小
  if (lenText < options.min_extracted_size) {
    if (!config.no_fallback) {
      console.debug('Trying baseline extraction');
      [postbody, tempText, lenText] = smartBaseline(treeBackup);
    }
    
    if (lenText < options.min_extracted_size) {
      console.warn(`Extraction failed: text too short (${lenText} chars)`);
      return null;
    }
  }
  
  // 提取评论
  if (options.comments) {
    const [commentsBody, commentsText, commentsLen] = extractComments(
      cleanedTreeBackup.cloneNode(true),
      options
    );
    
    if (commentsLen > options.min_extracted_comm_size) {
      document.commentsbody = commentsBody;
    }
  }
  
  // 设置文档内容
  document.body = postbody;
  document.text = tempText;
  
  // 只返回带元数据的文档
  if (config.only_with_metadata && !document.title) {
    console.warn('No metadata found, skipping');
    return null;
  }
  
  return document;
}

/**
 * 主提取函数 - 公共API
 * 对应 Python: extract()
 * 
 * @param {string|Element} filecontent - HTML 内容
 * @param {Object} config - 配置选项
 * @returns {string|null} 提取的内容
 */
export async function extract(filecontent, config = {}) {
  // 设置默认配置
  const options = {
    url: null,
    fast: false,
    no_fallback: false,
    favor_precision: false,
    favor_recall: false,
    include_comments: true,
    output_format: 'txt',
    target_language: null,
    include_tables: true,
    include_images: false,
    include_formatting: false,
    include_links: false,
    deduplicate: false,
    date_extraction_params: null,
    with_metadata: false,
    only_with_metadata: false,
    max_tree_size: null,
    url_blacklist: null,
    author_blacklist: null,
    ...config
  };
  
  // 映射参数名称
  const extractorConfig = {
    url: options.url,
    fast: options.fast,
    focus: options.favor_precision ? 'precision' : 
           (options.favor_recall ? 'recall' : 'balanced'),
    comments: options.include_comments,
    format: options.output_format,
    tables: options.include_tables,
    images: options.include_images,
    formatting: options.include_formatting,
    links: options.include_links,
    dedup: options.deduplicate,
    with_metadata: options.with_metadata,
    only_with_metadata: options.only_with_metadata,
    target_language: options.target_language,
    author_blacklist: options.author_blacklist,
    url_blacklist: options.url_blacklist,
  };
  
  // 执行提取
  const document = await bareExtraction(filecontent, {
    ...extractorConfig,
    no_fallback: options.no_fallback,
    extensive: true,
    date_extraction_params: options.date_extraction_params,
  });
  
  if (!document) {
    return null;
  }
  
  // 创建提取器以确定返回格式
  const extractor = new Extractor(extractorConfig);
  
  // 返回格式化的字符串
  return determineReturnString(document, extractor);
}

/**
 * 提取内容和元数据
 * 对应 Python: extract_with_metadata()
 * 
 * @param {string|Element} filecontent - HTML 内容
 * @param {Object} config - 配置选项
 * @returns {Object|null} 包含 text 和 metadata 的对象
 */
export async function extractWithMetadata(filecontent, config = {}) {
  const document = await bareExtraction(filecontent, {
    ...config,
    with_metadata: true,
  });
  
  if (!document) {
    return null;
  }
  
  return {
    text: document.text,
    metadata: document.asDict(),
  };
}

// ============= 辅助函数（简化版） =============

/**
 * 控制 XML 输出
 * 简化版实现
 * 
 * @param {Document} document - 文档对象
 * @param {Extractor} options - 提取选项
 * @returns {string} XML 字符串
 */
function controlXmlOutput(document, options) {
  // TODO: 完整的 XML-TEI 输出
  // 目前返回简化的 XML
  let xml = '<doc>\n';
  
  if (options.with_metadata) {
    xml += '  <metadata>\n';
    const attrs = ['title', 'author', 'url', 'date', 'sitename'];
    attrs.forEach(attr => {
      const value = document[attr];
      if (value) {
        xml += `    <${attr}>${value}</${attr}>\n`;
      }
    });
    xml += '  </metadata>\n';
  }
  
  xml += '  <body>\n';
  xml += `    ${document.body.innerHTML}\n`;
  xml += '  </body>\n';
  xml += '</doc>';
  
  return xml;
}

/**
 * XML 转文本
 * 简化版实现
 * 
 * @param {Element} body - body 元素
 * @param {boolean} formatting - 是否保留格式
 * @returns {string} 文本内容
 */
function xmlToTxt(body, formatting = false) {
  if (!body) return '';
  
  // 简单地提取所有文本
  let text = body.textContent || '';
  
  // 清理多余空白
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * XML 转 CSV
 * 简化版实现
 * 
 * @param {Document} document - 文档对象
 * @param {boolean} formatting - 是否保留格式
 * @returns {string} CSV 字符串
 */
function xmlToCsv(document, formatting = false) {
  const text = xmlToTxt(document.body, formatting);
  
  // 简单的 CSV 格式
  const csvRow = [
    document.url || '',
    document.title || '',
    document.author || '',
    document.date || '',
    text.replace(/"/g, '""'), // 转义引号
  ];
  
  return csvRow.map(field => `"${field}"`).join(',');
}

/**
 * 构建 JSON 输出
 * 简化版实现
 * 
 * @param {Document} document - 文档对象
 * @param {boolean} withMetadata - 是否包含元数据
 * @returns {string} JSON 字符串
 */
function buildJsonOutput(document, withMetadata = false) {
  const output = {
    text: document.text || '',
  };
  
  if (withMetadata) {
    output.metadata = {
      title: document.title,
      author: document.author,
      url: document.url,
      hostname: document.hostname,
      description: document.description,
      sitename: document.sitename,
      date: document.date,
      categories: document.categories,
      tags: document.tags,
      license: document.license,
    };
  }
  
  return JSON.stringify(output, null, 2);
}

// 默认导出
export default {
  extract,
  extractWithMetadata,
  bareExtraction,
  trafilaturaSequence,
  determineReturnString,
};

