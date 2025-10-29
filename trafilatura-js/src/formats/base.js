/**
 * 基础格式化器
 * 所有格式化器的抽象基类
 */

/**
 * 基础格式化器类
 */
export class BaseFormatter {
  /**
   * 构造函数
   * @param {Document} document - 文档对象
   * @param {Object} options - 格式化选项
   */
  constructor(document, options = {}) {
    this.document = document;
    this.options = {
      with_metadata: false,
      formatting: false,
      links: false,
      images: false,
      ...options
    };
  }

  /**
   * 格式化输出 - 子类必须实现
   * @returns {string} 格式化后的字符串
   */
  format() {
    throw new Error('Subclass must implement format() method');
  }

  /**
   * 获取元数据
   * @returns {Object} 元数据对象
   */
  getMetadata() {
    return {
      title: this.document.title || '',
      author: this.document.author || '',
      date: this.document.date || '',
      url: this.document.url || '',
      hostname: this.document.hostname || '',
      description: this.document.description || '',
      sitename: this.document.sitename || '',
      categories: this.document.categories || '',
      tags: this.document.tags || '',
      license: this.document.license || '',
      id: this.document.id || '',
      fingerprint: this.document.fingerprint || '',
    };
  }

  /**
   * 获取正文文本
   * @returns {string} 正文文本
   */
  getText() {
    return this.document.text || '';
  }

  /**
   * 获取评论文本
   * @returns {string} 评论文本
   */
  getComments() {
    if (!this.document.commentsbody) {
      return '';
    }
    return this.document.commentsbody.textContent || '';
  }

  /**
   * 转义特殊字符
   * @param {string} text - 输入文本
   * @param {Object} replacements - 替换映射
   * @returns {string} 转义后的文本
   */
  escape(text, replacements = {}) {
    if (!text) return '';
    
    let result = text;
    for (const [char, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(char, 'g'), replacement);
    }
    
    return result;
  }

  /**
   * 规范化Unicode
   * @param {string} text - 输入文本
   * @param {string} form - 规范化形式
   * @returns {string} 规范化后的文本
   */
  normalizeUnicode(text, form = 'NFC') {
    if (!text) return '';
    return text.normalize(form);
  }
}

export default BaseFormatter;

