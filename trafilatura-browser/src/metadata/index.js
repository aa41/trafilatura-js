/**
 * 元数据提取模块 - 主入口
 * 
 * 集成所有元数据提取功能，提供统一的API
 * 对应Python模块: trafilatura/metadata.py
 * 
 * @module metadata
 */

// 导入基础元数据提取函数
import {
  extractTitle,
  extractAuthor,
  extractSitename,
  extractDescription,
  extractUrl,
  extractHostname
} from './basic.js';

// 导入Meta标签提取函数
import {
  examineMeta,
  extractOpenGraph,
  normalizeAuthors,
  normalizeTags,
  mergeMetadata
} from './meta.js';

// 导入JSON-LD提取函数
import {
  extractMetaJson,
  extractJson,
  normalizeJson
} from './json-ld.js';

// 导入日期提取函数
import { findDate } from '../utils/date-extraction.js';

/**
 * 提取完整的元数据
 * 对应Python: extract_metadata() - metadata.py:453-510
 * 
 * 这是主函数，集成所有元数据提取策略：
 * 1. 基础提取（title, author等）
 * 2. Meta标签扫描（包括OpenGraph）
 * 3. JSON-LD结构化数据
 * 
 * 提取顺序和优先级：
 * - JSON-LD优先级最高（最结构化）
 * - OpenGraph次之（社交媒体优化）
 * - Meta标签
 * - HTML基础标签（最后）
 * 
 * @param {Document|Element} tree - HTML文档树
 * @param {string} url - 页面URL（可选）
 * @param {Object} options - 提取选项（可选）
 * @returns {Object} 元数据对象
 * 
 * @example
 * const metadata = extractMetadata(document, 'https://example.com/article');
 * console.log(metadata.title, metadata.author, metadata.description);
 * 
 * @example
 * // 完整输出
 * {
 *   title: '文章标题',
 *   author: '作者名',
 *   url: 'https://example.com/article',
 *   hostname: 'example.com',
 *   description: '文章描述',
 *   sitename: '网站名称',
 *   date: '2024-01-15',
 *   categories: ['科技', '新闻'],
 *   tags: ['AI', '技术'],
 *   image: 'https://example.com/image.jpg',
 *   pagetype: 'article'
 * }
 */
export function extractMetadata(tree, url = null, options = {}) {
  if (!tree) {
    return createEmptyMetadata();
  }
  
  // 初始化元数据对象
  const metadata = createEmptyMetadata();
  
  // 步骤1: 基础提取（从简单的HTML标签）
  metadata.title = extractTitle(tree);
  metadata.author = extractAuthor(tree);
  metadata.sitename = extractSitename(tree);
  metadata.description = extractDescription(tree);
  metadata.url = extractUrl(tree, url);
  
  // 提取hostname
  if (metadata.url) {
    metadata.hostname = extractHostname(metadata.url);
  } else if (url) {
    metadata.hostname = extractHostname(url);
  }
  
  // 提取日期（使用增强的日期提取）
  const dateOptions = {
    url: metadata.url || url,
    extensive_search: !options.fast,  // 非fast模式时进行扩展搜索
    ...options.date_params
  };
  metadata.date = findDate(tree, dateOptions);
  
  // 保存Canonical URL（优先级最高）
  const canonicalUrl = metadata.url;
  
  // 步骤2: Meta标签扫描（包括OpenGraph）
  // examineMeta内部会先调用extractOpenGraph
  const metaData = examineMeta(tree);
  
  // 合并Meta数据（Meta标签补充和覆盖基础数据）
  metadata.title = metaData.title || metadata.title;
  metadata.author = metaData.author || metadata.author;
  metadata.description = metaData.description || metadata.description;
  metadata.sitename = metaData.sitename || metadata.sitename;
  // URL特殊处理：Canonical优先
  metadata.url = canonicalUrl || metaData.url || metadata.url;
  metadata.image = metaData.image || metadata.image;
  metadata.date = metaData.date || metadata.date;
  metadata.categories = metaData.categories || metadata.categories;
  metadata.tags = metaData.tags || metadata.tags;
  metadata.pagetype = metaData.pagetype || metadata.pagetype;
  
  // 步骤3: JSON-LD提取（优先级最高，覆盖之前的数据）
  const jsonldData = extractMetaJson(tree, { ...metadata });
  
  // 合并JSON-LD数据（JSON-LD优先）
  if (jsonldData.title) metadata.title = jsonldData.title;
  if (jsonldData.author) metadata.author = jsonldData.author;
  if (jsonldData.description) metadata.description = jsonldData.description;
  if (jsonldData.sitename) metadata.sitename = jsonldData.sitename;
  // URL特殊处理：Canonical优先于JSON-LD
  if (jsonldData.url && !canonicalUrl) metadata.url = jsonldData.url;
  if (jsonldData.image) metadata.image = jsonldData.image;
  if (jsonldData.date) metadata.date = jsonldData.date;
  if (jsonldData.categories && jsonldData.categories.length > 0) {
    metadata.categories = jsonldData.categories;
  }
  if (jsonldData.pagetype) metadata.pagetype = jsonldData.pagetype;
  
  // 最终处理：确保hostname
  if (!metadata.hostname && metadata.url) {
    metadata.hostname = extractHostname(metadata.url);
  }
  
  return metadata;
}

/**
 * 创建空的元数据对象
 * 
 * @returns {Object} 空元数据对象
 */
function createEmptyMetadata() {
  return {
    title: null,
    author: null,
    url: null,
    hostname: null,
    description: null,
    sitename: null,
    date: null,
    categories: [],
    tags: [],
    image: null,
    pagetype: null
  };
}

/**
 * Document类（用于结构化存储元数据）
 * 对应Python: Document类 - settings.py
 */
export class Document {
  constructor() {
    this.title = null;
    this.author = null;
    this.url = null;
    this.hostname = null;
    this.description = null;
    this.sitename = null;
    this.date = null;
    this.categories = [];
    this.tags = [];
    this.image = null;
    this.pagetype = null;
    this.text = null;
    this.body = null;
  }
  
  /**
   * 从字典创建Document对象
   * 
   * @param {Object} data - 数据字典
   * @returns {Document} Document实例
   */
  static fromDict(data) {
    const doc = new Document();
    Object.keys(data).forEach(key => {
      if (key in doc) {
        doc[key] = data[key];
      }
    });
    return doc;
  }
  
  /**
   * 转换为字典
   * 
   * @returns {Object} 数据字典
   */
  toDict() {
    return {
      title: this.title,
      author: this.author,
      url: this.url,
      hostname: this.hostname,
      description: this.description,
      sitename: this.sitename,
      date: this.date,
      categories: this.categories,
      tags: this.tags,
      image: this.image,
      pagetype: this.pagetype,
      text: this.text,
      body: this.body
    };
  }
}

// 导出所有子模块的函数
export {
  // basic.js
  extractTitle,
  extractAuthor,
  extractSitename,
  extractDescription,
  extractUrl,
  extractHostname,
  
  // meta.js
  examineMeta,
  extractOpenGraph,
  normalizeAuthors,
  normalizeTags,
  mergeMetadata,
  
  // json-ld.js
  extractMetaJson,
  extractJson,
  normalizeJson
};

// 默认导出
export default {
  // 主函数
  extractMetadata,
  Document,
  
  // basic.js
  extractTitle,
  extractAuthor,
  extractSitename,
  extractDescription,
  extractUrl,
  extractHostname,
  
  // meta.js
  examineMeta,
  extractOpenGraph,
  normalizeAuthors,
  normalizeTags,
  mergeMetadata,
  
  // json-ld.js
  extractMetaJson,
  extractJson,
  normalizeJson
};

