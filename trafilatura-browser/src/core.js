/**
 * 核心API函数
 * 
 * 提供简单易用的主要接口
 * 
 * @module core
 */

import { loadHtml } from './utils/dom.js';
import { treeCleaning } from './processing/cleaning.js';
import { extractContent } from './extraction/extractor.js';
import { Extractor } from './settings/config.js';

/**
 * 主提取函数 - 从HTML中提取主要文本内容
 * 
 * @param {string|Document} html - HTML字符串或Document对象
 * @param {Object} options - 提取选项
 * @param {string} [options.focus='balanced'] - 提取模式: 'precision' | 'balanced' | 'recall'
 * @param {boolean} [options.tables=true] - 是否包含表格
 * @param {boolean} [options.images=true] - 是否包含图片
 * @param {boolean} [options.links=true] - 是否包含链接
 * @param {boolean} [options.formatting=false] - 是否保留格式化
 * @param {string} [options.outputFormat='text'] - 输出格式: 'text' | 'markdown' | 'json' | 'xml'
 * @param {boolean} [options.withMetadata=false] - 是否包含元数据
 * @returns {string} 提取的文本内容
 */
export function extract(html, options = {}) {
  try {
    // 1. 解析HTML
    let doc;
    if (typeof html === 'string') {
      doc = loadHtml(html);
    } else if (html && html.nodeType === 9) { // Document对象
      doc = html;
    } else if (html && html.nodeType === 1) { // Element对象
      doc = html.ownerDocument || document.implementation.createHTMLDocument();
      const body = doc.body || doc.createElement('body');
      body.appendChild(html.cloneNode(true));
      doc = doc.ownerDocument || doc;
    } else {
      throw new Error('Invalid HTML input: expected string or Document/Element');
    }
    
    // 2. 创建提取器配置
    const extractorOptions = new Extractor({
      focus: options.focus || 'balanced',
      tables: options.tables !== false,
      images: options.images !== false,
      links: options.links !== false,
      formatting: options.formatting || false
    });
    
    // 3. 清理HTML
    const body = doc.body || doc;
    const cleaned = treeCleaning(body, extractorOptions);
    
    if (!cleaned) {
      return '';
    }
    
    // 4. 提取内容
    const result = extractContent(cleaned, extractorOptions);
    
    if (!result || !result.body) {
      return '';
    }
    
    // 5. 根据输出格式返回结果
    const outputFormat = options.outputFormat || 'text';
    
    switch (outputFormat) {
      case 'text':
        return result.text || '';
        
      case 'markdown':
        // TODO: 实现Markdown格式化
        return result.text || '';
        
      case 'json':
        // 返回JSON格式
        const jsonResult = {
          text: result.text || '',
          length: result.length || 0
        };
        
        if (options.withMetadata) {
          // TODO: 添加元数据提取
          jsonResult.metadata = {
            title: '',
            author: '',
            date: '',
            url: ''
          };
        }
        
        return JSON.stringify(jsonResult, null, 2);
        
      case 'xml':
        // TODO: 实现XML格式化
        return result.text || '';
        
      default:
        return result.text || '';
    }
    
  } catch (error) {
    console.error('Extraction error:', error);
    throw error;
  }
}

/**
 * 裸提取函数 - 最小化处理，快速提取
 * 
 * @param {string|Document} html - HTML字符串或Document对象
 * @returns {string} 提取的文本
 */
export function bareExtraction(html) {
  return extract(html, {
    focus: 'recall',
    formatting: false,
    outputFormat: 'text'
  });
}

/**
 * 默认导出
 */
export default {
  extract,
  bareExtraction
};

