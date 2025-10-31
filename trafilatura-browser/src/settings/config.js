/**
 * 配置类定义
 * 
 * 对应Python模块: trafilatura/settings.py (Extractor和Document类)
 * 定义提取选项和文档数据结构
 * 
 * @module settings/config
 */

import {
  MIN_EXTRACTED_SIZE,
  MIN_OUTPUT_SIZE,
  MIN_OUTPUT_COMM_SIZE,
  MIN_EXTRACTED_COMM_SIZE,
  MIN_DUPLCHECK_SIZE,
  MAX_REPETITIONS,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE
} from './constants.js';

/**
 * 提取器配置类
 * 对应Python: Extractor类 (settings.py:63-173)
 * 
 * 存储所有提取选项和配置
 */
export class Extractor {
  /**
   * 创建提取器配置
   * 
   * @param {Object} options - 配置选项
   * @param {string} [options.format='txt'] - 输出格式 (txt, html, markdown, json, xml, xmltei)
   * @param {boolean} [options.fast=false] - 快速模式
   * @param {boolean} [options.precision=false] - 精确模式
   * @param {boolean} [options.recall=false] - 召回模式
   * @param {boolean} [options.comments=true] - 是否提取评论
   * @param {boolean} [options.formatting=false] - 是否保留格式
   * @param {boolean} [options.links=false] - 是否保留链接
   * @param {boolean} [options.images=false] - 是否保留图片
   * @param {boolean} [options.tables=true] - 是否提取表格
   * @param {boolean} [options.dedup=false] - 是否去重
   * @param {string} [options.lang=null] - 目标语言
   * @param {string} [options.url=null] - 源URL
   * @param {string} [options.source=null] - 源标识
   * @param {boolean} [options.withMetadata=false] - 是否提取元数据
   * @param {boolean} [options.onlyWithMetadata=false] - 是否只在有元数据时提取
   * @param {Set<string>} [options.authorBlacklist=null] - 作者黑名单
   * @param {Set<string>} [options.urlBlacklist=null] - URL黑名单
   */
  constructor(options = {}) {
    // 处理null或undefined参数
    if (!options || typeof options !== 'object') {
      options = {};
    }
    
    // 格式化选项
    this.format = this._validateFormat(options.format || 'txt');
    
    // 提取模式
    this.fast = Boolean(options.fast);
    this.focus = options.recall ? 'recall' : 
                  options.precision ? 'precision' : 
                  'balanced';
    
    // 内容选项
    this.comments = options.comments !== undefined ? Boolean(options.comments) : true;
    this.formatting = Boolean(options.formatting) || this.format === 'markdown';
    this.links = Boolean(options.links);
    this.images = Boolean(options.images);
    this.tables = options.tables !== undefined ? Boolean(options.tables) : true;
    this.dedup = Boolean(options.dedup);
    this.lang = options.lang || null;
    
    // 元数据选项
    this.url = options.url || null;
    this.source = options.source || options.url || null;
    this.withMetadata = Boolean(options.withMetadata || options.onlyWithMetadata || 
                                  options.urlBlacklist || this.format === 'xmltei');
    this.onlyWithMetadata = Boolean(options.onlyWithMetadata);
    
    // 黑名单
    this.authorBlacklist = options.authorBlacklist || new Set();
    this.urlBlacklist = options.urlBlacklist || new Set();
    
    // 大小限制（从常量读取）
    this.minExtractedSize = options.minExtractedSize || MIN_EXTRACTED_SIZE;
    this.minOutputSize = options.minOutputSize || MIN_OUTPUT_SIZE;
    this.minOutputCommSize = options.minOutputCommSize || MIN_OUTPUT_COMM_SIZE;
    this.minExtractedCommSize = options.minExtractedCommSize || MIN_EXTRACTED_COMM_SIZE;
    this.minDuplcheckSize = options.minDuplcheckSize || MIN_DUPLCHECK_SIZE;
    this.maxRepetitions = options.maxRepetitions || MAX_REPETITIONS;
    this.maxFileSize = options.maxFileSize || MAX_FILE_SIZE;
    this.minFileSize = options.minFileSize || MIN_FILE_SIZE;
    this.maxTreeSize = options.maxTreeSize || null;
    
    // 日期参数
    this.dateParams = options.dateParams || {
      originalDate: true,
      extensiveSearch: true,
      maxDate: new Date().toISOString().split('T')[0]
    };
  }
  
  /**
   * 验证输出格式
   * 对应Python: _set_format()
   * 
   * @private
   * @param {string} format - 输出格式
   * @returns {string} 验证后的格式
   * @throws {Error} 如果格式不支持
   */
  _validateFormat(format) {
    const SUPPORTED_FORMATS = new Set([
      'txt', 'text', 
      'html', 
      'markdown', 'md',
      'json',
      'xml', 'xmltei',
      'csv',
      'python' // 仅用于bare_extraction()
    ]);
    
    if (!SUPPORTED_FORMATS.has(format)) {
      throw new Error(
        `Unsupported format: ${format}. Must be one of: ${Array.from(SUPPORTED_FORMATS).sort().join(', ')}`
      );
    }
    
    return format;
  }
  
  /**
   * 转换为配置对象
   * 
   * @returns {Object} 配置对象
   */
  toObject() {
    return {
      format: this.format,
      fast: this.fast,
      focus: this.focus,
      comments: this.comments,
      formatting: this.formatting,
      links: this.links,
      images: this.images,
      tables: this.tables,
      dedup: this.dedup,
      lang: this.lang,
      url: this.url,
      source: this.source,
      withMetadata: this.withMetadata,
      onlyWithMetadata: this.onlyWithMetadata,
      authorBlacklist: this.authorBlacklist,
      urlBlacklist: this.urlBlacklist,
      minExtractedSize: this.minExtractedSize,
      minOutputSize: this.minOutputSize,
      minOutputCommSize: this.minOutputCommSize,
      minExtractedCommSize: this.minExtractedCommSize,
      minDuplcheckSize: this.minDuplcheckSize,
      maxRepetitions: this.maxRepetitions,
      maxFileSize: this.maxFileSize,
      minFileSize: this.minFileSize,
      maxTreeSize: this.maxTreeSize,
      dateParams: this.dateParams
    };
  }
}

/**
 * 文档数据类
 * 对应Python: Document类 (settings.py:207-303)
 * 
 * 存储提取的文档内容和元数据
 */
export class Document {
  /**
   * 创建文档实例
   * 
   * @param {Object} data - 文档数据
   * @param {string} [data.title=null] - 标题
   * @param {string} [data.author=null] - 作者
   * @param {string} [data.url=null] - URL
   * @param {string} [data.hostname=null] - 主机名
   * @param {string} [data.description=null] - 描述
   * @param {string} [data.sitename=null] - 站点名称
   * @param {string} [data.date=null] - 日期
   * @param {Array<string>} [data.categories=null] - 分类
   * @param {Array<string>} [data.tags=null] - 标签
   * @param {string} [data.fingerprint=null] - 指纹
   * @param {string} [data.id=null] - ID
   * @param {string} [data.license=null] - 许可证
   * @param {Element} [data.body=null] - 主体内容DOM
   * @param {string} [data.comments=null] - 评论文本
   * @param {Element} [data.commentsbody=null] - 评论DOM
   * @param {string} [data.rawText=null] - 原始文本
   * @param {string} [data.text=null] - 提取的文本
   * @param {string} [data.language=null] - 语言
   * @param {string} [data.image=null] - 图片URL
   * @param {string} [data.pagetype=null] - 页面类型
   * @param {string} [data.filedate=null] - 文件日期
   */
  constructor(data = {}) {
    // 处理null或undefined参数
    if (!data || typeof data !== 'object') {
      data = {};
    }
    
    // 元数据字段
    this.title = data.title || null;
    this.author = data.author || null;
    this.url = data.url || null;
    this.hostname = data.hostname || null;
    this.description = data.description || null;
    this.sitename = data.sitename || null;
    this.date = data.date || null;
    this.categories = data.categories || null;
    this.tags = data.tags || null;
    this.fingerprint = data.fingerprint || null;
    this.id = data.id || null;
    this.license = data.license || null;
    
    // 内容字段
    this.body = data.body || null;
    this.comments = data.comments || null;
    this.commentsbody = data.commentsbody || null;
    this.rawText = data.rawText || null;
    this.text = data.text || null;
    
    // 其他字段
    this.language = data.language || null;
    this.image = data.image || null;
    this.pagetype = data.pagetype || null;
    this.filedate = data.filedate || null;
  }
  
  /**
   * 从对象创建文档实例
   * 对应Python: from_dict()
   * 
   * @param {Object} data - 数据对象
   * @returns {Document} 文档实例
   */
  static fromDict(data) {
    return new Document(data);
  }
  
  /**
   * 清理和修剪文档属性
   * 对应Python: clean_and_trim()
   * 
   * 限制文本长度并修剪属性
   */
  cleanAndTrim() {
    const MAX_LENGTH = 10000;
    
    // 处理所有字符串属性
    const stringFields = [
      'title', 'author', 'url', 'hostname', 'description',
      'sitename', 'date', 'fingerprint', 'id', 'license',
      'comments', 'rawText', 'text', 'language', 'image',
      'pagetype', 'filedate'
    ];
    
    for (const field of stringFields) {
      let value = this[field];
      if (typeof value === 'string' && value.length > 0) {
        // 长度限制
        if (value.length > MAX_LENGTH) {
          value = value.substring(0, MAX_LENGTH - 1) + '…';
        }
        
        // 移除多余空白和控制字符
        value = value.replace(/\s+/g, ' ').trim();
        
        // HTML实体解码（浏览器中使用textarea）
        const textarea = document.createElement('textarea');
        textarea.innerHTML = value;
        value = textarea.value;
        
        this[field] = value;
      }
    }
    
    // 处理数组字段
    if (Array.isArray(this.categories)) {
      this.categories = this.categories.map(c => c.trim()).filter(c => c);
    }
    if (Array.isArray(this.tags)) {
      this.tags = this.tags.map(t => t.trim()).filter(t => t);
    }
  }
  
  /**
   * 转换为对象
   * 对应Python: as_dict()
   * 
   * @returns {Object} 文档对象
   */
  asDict() {
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
      fingerprint: this.fingerprint,
      id: this.id,
      license: this.license,
      body: this.body,
      comments: this.comments,
      commentsbody: this.commentsbody,
      rawText: this.rawText,
      text: this.text,
      language: this.language,
      image: this.image,
      pagetype: this.pagetype,
      filedate: this.filedate
    };
  }
  
  /**
   * 转换为JSON字符串
   * 
   * @param {boolean} [includeBody=false] - 是否包含DOM元素
   * @returns {string} JSON字符串
   */
  toJSON(includeBody = false) {
    const obj = this.asDict();
    
    // 默认不包含DOM元素
    if (!includeBody) {
      delete obj.body;
      delete obj.commentsbody;
    }
    
    return JSON.stringify(obj, null, 2);
  }
}

/**
 * 创建默认提取器配置
 * 
 * @param {Object} options - 配置选项
 * @returns {Extractor} 提取器实例
 */
export function createExtractor(options = {}) {
  return new Extractor(options);
}

/**
 * 创建空文档
 * 
 * @returns {Document} 文档实例
 */
export function createDocument() {
  return new Document();
}

// 导出
export default {
  Extractor,
  Document,
  createExtractor,
  createDocument
};

