/**
 * 提取器配置模块
 * 
 * 定义Extractor和Document类，用于存储提取选项和结果
 * 对应Python模块: trafilatura/settings.py
 * 
 * @module settings/extractor
 */

/**
 * 支持的输出格式
 */
export const SUPPORTED_FORMATS = new Set([
  'txt', 'markdown', 'json', 'csv', 'xml', 'xmltei', 'tei', 'python'
]);

/**
 * CLI支持的格式
 */
export const SUPPORTED_FMT_CLI = [
  'txt', 'markdown', 'json', 'csv', 'xml', 'xmltei'
];

/**
 * Extractor类
 * 对应Python: Extractor - settings.py:63-173
 * 
 * 存储所有提取选项的配置类
 * 
 * @example
 * const extractor = new Extractor({
 *   format: 'markdown',
 *   with_metadata: true,
 *   include_comments: true
 * });
 */
export class Extractor {
  constructor(options = {}) {
    // 格式设置
    this.format = 'txt';
    this.fast = false;
    this.focus = 'balanced';  // 'balanced', 'precision', 'recall'
    
    // 内容选项
    this.comments = true;
    this.formatting = false;
    this.links = false;
    this.images = false;
    this.tables = true;
    this.dedup = false;
    this.lang = null;
    
    // 大小限制 (对应Python settings.cfg)
    this.min_extracted_size = 200;
    this.min_output_size = 1;  // Python默认值: MIN_OUTPUT_SIZE = 1
    this.min_output_comm_size = 10;
    this.min_extracted_comm_size = 10;
    this.min_duplcheck_size = 100;
    this.max_repetitions = 2;
    this.max_file_size = 20000000;  // 20MB
    this.min_file_size = 10;
    this.max_tree_size = null;
    
    // 元数据选项
    this.source = null;
    this.url = null;
    this.with_metadata = false;
    this.only_with_metadata = false;
    this.tei_validation = false;
    this.date_params = null;
    this.author_blacklist = new Set();
    this.url_blacklist = new Set();
    this.prune_xpath = null;  // CSS选择器字符串或数组
    
    // 预处理规则系统（类似Turndown的addRule）
    this.preprocessing_rules = new Map();  // Map<ruleName, rule>
    
    // 应用选项
    this._applyOptions(options);
  }
  
  /**
   * 应用配置选项
   * @private
   */
  _applyOptions(options) {
    // 处理output_format（Python兼容）
    if (options.output_format) {
      options.format = options.output_format;
    }
    
    // 设置format
    if (options.format) {
      this._setFormat(options.format);
    }
    
    // 设置source
    if (options.url || options.source) {
      this._setSource(options.url, options.source);
    }
    
    // 设置focus（precision/recall）
    if (options.precision && !options.recall) {
      this.focus = 'precision';
    } else if (options.recall && !options.precision) {
      this.focus = 'recall';
    } else {
      this.focus = 'balanced';
    }
    
    // 布尔选项
    if (options.fast !== undefined) this.fast = Boolean(options.fast);
    if (options.comments !== undefined) this.comments = Boolean(options.comments);
    if (options.formatting !== undefined) this.formatting = Boolean(options.formatting);
    if (options.links !== undefined) this.links = Boolean(options.links);
    if (options.images !== undefined) this.images = Boolean(options.images);
    if (options.tables !== undefined) this.tables = Boolean(options.tables);
    if (options.dedup !== undefined) this.dedup = Boolean(options.dedup);
    if (options.with_metadata !== undefined) this.with_metadata = Boolean(options.with_metadata);
    if (options.only_with_metadata !== undefined) this.only_with_metadata = Boolean(options.only_with_metadata);
    if (options.tei_validation !== undefined) this.tei_validation = Boolean(options.tei_validation);
    
    // Markdown格式默认启用formatting
    if (this.format === 'markdown') {
      this.formatting = true;
    }
    
    // 某些格式需要元数据
    if (this.only_with_metadata || this.format === 'xmltei' || this.format === 'tei') {
      this.with_metadata = true;
    }
    
    // URL黑名单需要元数据
    if (options.url_blacklist && options.url_blacklist.size > 0) {
      this.with_metadata = true;
    }
    
    // 字符串选项
    if (options.lang) this.lang = String(options.lang);
    if (options.url) this.url = String(options.url);
    
    // Set选项
    if (options.author_blacklist) {
      this.author_blacklist = new Set(options.author_blacklist);
    }
    if (options.url_blacklist) {
      this.url_blacklist = new Set(options.url_blacklist);
    }
    
    // 设置prune_xpath（在浏览器中使用CSS选择器）
    if (options.prune_xpath) {
      this.prune_xpath = options.prune_xpath;
    }
    
    // 数字选项
    const numericOptions = [
      'min_extracted_size', 'min_output_size', 'min_output_comm_size',
      'min_extracted_comm_size', 'min_duplcheck_size', 'max_repetitions',
      'max_file_size', 'min_file_size', 'max_tree_size'
    ];
    
    for (const key of numericOptions) {
      if (options[key] !== undefined) {
        this[key] = Number(options[key]);
      }
    }
    
    // 日期参数
    if (options.date_params) {
      this.date_params = { ...options.date_params };
    } else {
      this.date_params = this._setDateParams(true);
    }
  }
  
  /**
   * 设置source属性
   * 对应Python: _set_source() - settings.py:155-158
   * @private
   */
  _setSource(url, source) {
    const sourceStr = url || source;
    if (sourceStr) {
      this.source = String(sourceStr);
      if (!this.url) {
        this.url = String(sourceStr);
      }
    }
  }
  
  /**
   * 设置并验证格式
   * 对应Python: _set_format() - settings.py:160-166
   * @private
   */
  _setFormat(format) {
    const normalizedFormat = String(format).toLowerCase();
    
    if (!SUPPORTED_FORMATS.has(normalizedFormat)) {
      throw new Error(
        `Cannot set format, must be one of: ${Array.from(SUPPORTED_FORMATS).sort().join(', ')}`
      );
    }
    
    this.format = normalizedFormat;
  }
  
  /**
   * 设置日期参数
   * 对应Python: set_date_params() - settings.py:197-203
   * @private
   */
  _setDateParams(extensive = true) {
    return {
      original_date: true,
      extensive_search: extensive,
      max_date: new Date().toISOString().split('T')[0]
    };
  }
  
  /**
   * 添加预处理规则（类似Turndown的addRule）
   * 
   * 允许在HTML树加载后、提取前对节点进行自定义处理
   * 参考: https://github.com/mixmark-io/turndown
   * 
   * @param {string} name - 规则名称（唯一标识）
   * @param {Object} rule - 规则对象
   * @param {string|Array|Function} rule.filter - 元素过滤器
   *   - string: CSS选择器，如 'div.content'
   *   - Array: CSS选择器数组，如 ['div', 'span']
   *   - Function: 自定义过滤函数 (node, options) => boolean
   * @param {Function} rule.action - 处理函数 (node, options) => void|Node|null
   *   - 返回 undefined: 保持节点不变
   *   - 返回 Node: 用新节点替换
   *   - 返回 null: 删除节点
   *   - 无返回值/undefined: 原地修改节点
   * @returns {Extractor} 返回this以支持链式调用
   * 
   * @example
   * // 删除所有广告
   * extractor.addPreprocessingRule('removeAds', {
   *   filter: '.advertisement',
   *   action: (node) => null  // 删除节点
   * });
   * 
   * @example
   * // 转换特殊元素
   * extractor.addPreprocessingRule('convertVideo', {
   *   filter: (node) => node.tagName === 'VIDEO',
   *   action: (node) => {
   *     const link = document.createElement('a');
   *     link.href = node.src;
   *     link.textContent = `[视频: ${node.title || '播放'}]`;
   *     return link;  // 替换为链接
   *   }
   * });
   * 
   * @example
   * // 修改属性
   * extractor.addPreprocessingRule('fixImages', {
   *   filter: 'img[data-lazy-src]',
   *   action: (node) => {
   *     node.src = node.getAttribute('data-lazy-src');
   *     node.removeAttribute('data-lazy-src');
   *     // 不返回值，原地修改
   *   }
   * });
   */
  addPreprocessingRule(name, rule) {
    if (!name || typeof name !== 'string') {
      throw new Error('Rule name must be a non-empty string');
    }
    
    if (!rule || typeof rule !== 'object') {
      throw new Error('Rule must be an object with filter and action properties');
    }
    
    if (!rule.filter) {
      throw new Error('Rule must have a filter property');
    }
    
    if (typeof rule.action !== 'function') {
      throw new Error('Rule action must be a function');
    }
    
    // 验证filter类型
    const filterType = typeof rule.filter;
    if (filterType !== 'string' && filterType !== 'function' && !Array.isArray(rule.filter)) {
      throw new Error('Rule filter must be a string, array, or function');
    }
    
    // 存储规则
    this.preprocessing_rules.set(name, {
      filter: rule.filter,
      action: rule.action,
      name: name
    });
    
    return this;  // 链式调用
  }
  
  /**
   * 移除预处理规则
   * 
   * @param {string} name - 规则名称
   * @returns {boolean} 是否成功移除
   */
  removePreprocessingRule(name) {
    return this.preprocessing_rules.delete(name);
  }
  
  /**
   * 清空所有预处理规则
   */
  clearPreprocessingRules() {
    this.preprocessing_rules.clear();
  }
  
  /**
   * 获取所有规则名称
   * 
   * @returns {Array<string>} 规则名称数组
   */
  getPreprocessingRuleNames() {
    return Array.from(this.preprocessing_rules.keys());
  }
}

/**
 * Document类
 * 对应Python: Document - settings.py:207-309
 * 
 * 存储提取的数据和元数据
 * 
 * @example
 * const doc = new Document({
 *   title: '文章标题',
 *   author: '作者',
 *   body: bodyElement
 * });
 */
export class Document {
  constructor(options = {}) {
    // 元数据字段
    this.title = null;
    this.author = null;
    this.url = null;
    this.hostname = null;
    this.description = null;
    this.sitename = null;
    this.date = null;
    this.categories = null;
    this.tags = null;
    this.fingerprint = null;
    this.id = null;
    this.license = null;
    
    // 内容字段
    this.body = null;
    this.comments = null;
    this.commentsbody = null;
    this.raw_text = null;
    this.text = null;
    
    // 其他字段
    this.language = null;
    this.image = null;
    this.pagetype = null;
    this.filedate = null;
    
    // 应用选项
    Object.assign(this, options);
  }
  
  /**
   * 从字典创建Document
   * 对应Python: from_dict() - settings.py:281-287
   * 
   * @param {Object} data - 数据字典
   * @returns {Document} Document实例
   */
  static fromDict(data) {
    const doc = new Document();
    Object.assign(doc, data);
    return doc;
  }
  
  /**
   * 转换为字典
   * 
   * @returns {Object} 数据字典
   */
  toDict() {
    const result = {};
    
    for (const key of Object.keys(this)) {
      if (this[key] !== null && this[key] !== undefined) {
        result[key] = this[key];
      }
    }
    
    return result;
  }
  
  /**
   * 清理和修剪属性
   * 对应Python: clean_and_trim() - settings.py:289-299
   * 
   * 限制文本长度并修剪属性
   */
  cleanAndTrim() {
    const maxLength = 10000;
    
    for (const key of Object.keys(this)) {
      const value = this[key];
      
      if (typeof value === 'string') {
        let trimmed = value;
        
        // 长度限制
        if (trimmed.length > maxLength) {
          trimmed = trimmed.substring(0, maxLength - 1) + '…';
        }
        
        // 移除多余空白
        trimmed = trimmed.trim().replace(/\s+/g, ' ');
        
        this[key] = trimmed;
      }
    }
  }
}

/**
 * 验证配置选项
 * 
 * @param {Object} options - 配置选项
 * @returns {boolean} 是否有效
 */
export function validateConfig(options) {
  if (!options) {
    return true;
  }
  
  // 验证format
  if (options.format) {
    const format = String(options.format).toLowerCase();
    if (!SUPPORTED_FORMATS.has(format)) {
      console.warn(`Invalid format: ${format}. Using default 'txt'.`);
      return false;
    }
  }
  
  // 验证互斥选项
  if (options.precision && options.recall) {
    console.warn('Both precision and recall are set to true. Using balanced mode.');
  }
  
  // 验证数字选项
  const numericFields = [
    'min_extracted_size', 'min_output_size', 'max_file_size', 'min_file_size'
  ];
  
  for (const field of numericFields) {
    if (options[field] !== undefined) {
      const value = Number(options[field]);
      if (isNaN(value) || value < 0) {
        console.warn(`Invalid value for ${field}: ${options[field]}`);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 导出所有内容
 */
export default {
  Extractor,
  Document,
  validateConfig,
  SUPPORTED_FORMATS,
  SUPPORTED_FMT_CLI
};

