/**
 * 配置管理模块
 * 对应 Python: settings.py
 */

import { DEFAULT_CONFIG } from './constants.js';

/**
 * Document 类 - 存储提取的文档信息
 * 对应 Python: Document class
 */
export class Document {
  constructor() {
    // 元数据字段
    this.title = null;
    this.author = null;
    this.url = null;
    this.hostname = null;
    this.description = null;
    this.sitename = null;
    this.date = null;
    this.categories = [];
    this.tags = [];
    this.fingerprint = null;
    this.id = null;
    this.license = null;
    this.language = null;
    this.image = null;
    this.pagetype = null;
    
    // 内容字段
    this.text = null;
    this.comments = null;
    this.raw_text = null;
    
    // 内部字段
    this.body = null;
    this.commentsbody = null;
    this.filedate = null;
  }

  /**
   * 从对象设置属性
   */
  fromDict(dict) {
    Object.keys(dict).forEach(key => {
      if (dict[key] !== undefined && dict[key] !== null) {
        this[key] = dict[key];
      }
    });
    return this;
  }

  /**
   * 转换为普通对象
   */
  asDict() {
    const result = {};
    [
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
      'license',
      'language',
      'image',
      'pagetype',
      'text',
      'comments',
    ].forEach(key => {
      if (this[key] !== null && this[key] !== undefined) {
        result[key] = this[key];
      }
    });
    return result;
  }

  /**
   * 清理和修整数据
   */
  cleanAndTrim() {
    // 修整字符串字段
    ['title', 'author', 'description', 'sitename', 'license'].forEach(field => {
      if (typeof this[field] === 'string') {
        this[field] = this[field].trim() || null;
      }
    });

    // 清理数组字段
    ['categories', 'tags'].forEach(field => {
      if (Array.isArray(this[field])) {
        this[field] = this[field].filter(item => item && item.trim());
      }
    });
  }
}

/**
 * Extractor 类 - 提取器配置
 * 对应 Python: Extractor class
 */
export class Extractor {
  constructor(options = {}) {
    // 提取选项（不合并，单独判断）
    this.fast = options.fast || DEFAULT_CONFIG.fast;
    this.precision = options.precision || options.favorPrecision || DEFAULT_CONFIG.precision;
    this.recall = options.recall || options.favorRecall || DEFAULT_CONFIG.recall;
    
    // 内容选项 - 支持驼峰和下划线命名
    if (options.comments !== undefined) {
      this.comments = options.comments;
    } else if (options.includeComments !== undefined) {
      this.comments = options.includeComments;
    } else {
      this.comments = DEFAULT_CONFIG.comments;
    }
    
    if (options.formatting !== undefined) {
      this.formatting = options.formatting;
    } else if (options.includeFormatting !== undefined) {
      this.formatting = options.includeFormatting;
    } else {
      this.formatting = DEFAULT_CONFIG.formatting;
    }
    
    if (options.links !== undefined) {
      this.links = options.links;
    } else if (options.includeLinks !== undefined) {
      this.links = options.includeLinks;
    } else {
      this.links = DEFAULT_CONFIG.links;
    }
    
    if (options.images !== undefined) {
      this.images = options.images;
    } else if (options.includeImages !== undefined) {
      this.images = options.includeImages;
    } else {
      this.images = DEFAULT_CONFIG.images;
    }
    
    if (options.tables !== undefined) {
      this.tables = options.tables;
    } else if (options.includeTables !== undefined) {
      this.tables = options.includeTables;
    } else {
      this.tables = DEFAULT_CONFIG.tables;
    }
    
    // 输出选项
    this.format = options.format || options.outputFormat || DEFAULT_CONFIG.format;
    this.with_metadata = options.with_metadata || options.withMetadata || DEFAULT_CONFIG.with_metadata;
    this.only_with_metadata = options.only_with_metadata || options.onlyWithMetadata || DEFAULT_CONFIG.only_with_metadata;
    this.tei_validation = options.tei_validation || DEFAULT_CONFIG.tei_validation || false;
    
    // 去重和过滤
    this.dedup = options.dedup || options.deduplicate || DEFAULT_CONFIG.dedup;
    this.lang = options.lang || options.targetLanguage || DEFAULT_CONFIG.lang;
    
    // 黑名单 - 优先使用传入的值
    if (options.urlBlacklist) {
      this.url_blacklist = options.urlBlacklist;
    } else if (options.url_blacklist) {
      this.url_blacklist = options.url_blacklist;
    } else {
      this.url_blacklist = DEFAULT_CONFIG.url_blacklist;
    }
    
    if (options.authorBlacklist) {
      this.author_blacklist = options.authorBlacklist;
    } else if (options.author_blacklist) {
      this.author_blacklist = options.author_blacklist;
    } else {
      this.author_blacklist = DEFAULT_CONFIG.author_blacklist;
    }
    
    // URL
    this.url = options.url || null;
    this.source = options.source || this.url || 'unknown';
    
    // 日期参数
    this.date_params = options.date_params || options.dateExtractionParams || {};
    
    // 尺寸限制
    this.min_file_size = options.min_file_size || DEFAULT_CONFIG.min_file_size;
    this.max_file_size = options.max_file_size || DEFAULT_CONFIG.max_file_size;
    this.min_extracted_size = options.min_extracted_size || DEFAULT_CONFIG.min_extracted_size;
    this.min_output_size = options.min_output_size || DEFAULT_CONFIG.min_output_size;
    this.min_output_comm_size = options.min_output_comm_size || DEFAULT_CONFIG.min_output_comm_size;
    this.min_extracted_comm_size = options.min_extracted_comm_size || DEFAULT_CONFIG.min_extracted_comm_size;
    this.max_tree_size = options.max_tree_size || null;
    
    // 焦点模式
    if (this.precision) {
      this.focus = 'precision';
    } else if (this.recall) {
      this.focus = 'recall';
    } else {
      this.focus = options.focus || 'balanced';
    }
  }
}

/**
 * 使用配置对象
 */
export function useConfig(configObj = null) {
  if (!configObj) {
    return DEFAULT_CONFIG;
  }
  return { ...DEFAULT_CONFIG, ...configObj };
}

/**
 * 设置日期提取参数
 */
export function setDateParams(extensive = true) {
  return {
    extensive_search: extensive,
    original_date: true,
    outputformat: '%Y-%m-%d',
    max_date: new Date().toISOString().split('T')[0],
  };
}

