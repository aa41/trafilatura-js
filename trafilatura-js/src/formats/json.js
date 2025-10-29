/**
 * JSON 格式化器
 * 输出结构化JSON数据
 */

import { BaseFormatter } from './base.js';
import { trim } from '../utils/text-utils.js';

/**
 * JSON 格式化器类
 */
export class JsonFormatter extends BaseFormatter {
  /**
   * 格式化为JSON
   * @returns {string} JSON格式的文本
   */
  format() {
    const output = {
      text: this.getText(),
    };

    // 添加元数据
    if (this.options.with_metadata) {
      output.metadata = this.getMetadata();
    }

    // 添加结构化内容
    if (this.options.include_structure && this.document.body) {
      output.structured = this.formatStructured(this.document.body);
    }

    // 添加评论
    if (this.document.commentsbody && this.options.comments) {
      output.comments = this.getComments();
    }

    return JSON.stringify(output, null, 2);
  }

  /**
   * 格式化为结构化数据
   * @param {Element} body - body元素
   * @returns {Array} 结构化内容数组
   */
  formatStructured(body) {
    const structured = [];
    const children = Array.from(body.children);

    children.forEach(elem => {
      const item = this.formatElement(elem);
      if (item) {
        structured.push(item);
      }
    });

    return structured;
  }

  /**
   * 格式化单个元素
   * @param {Element} elem - 元素
   * @returns {Object|null} 元素对象
   */
  formatElement(elem) {
    if (!elem) return null;

    const tagName = elem.tagName.toLowerCase();

    // 标题
    if (tagName === 'head') {
      const level = parseInt(elem.getAttribute('rend')?.replace('h', '') || '1');
      return {
        type: 'heading',
        level: level,
        text: trim(elem.textContent)
      };
    }

    // 段落
    if (tagName === 'p') {
      return {
        type: 'paragraph',
        text: trim(elem.textContent)
      };
    }

    // 列表
    if (tagName === 'list') {
      return this.formatList(elem);
    }

    // 引用
    if (tagName === 'quote') {
      return {
        type: 'quote',
        text: trim(elem.textContent)
      };
    }

    // 代码
    if (tagName === 'code') {
      return {
        type: 'code',
        language: elem.getAttribute('rend') || '',
        code: elem.textContent || ''
      };
    }

    // 表格
    if (tagName === 'table') {
      return this.formatTable(elem);
    }

    // 图片
    if (tagName === 'graphic') {
      return {
        type: 'image',
        src: elem.getAttribute('src') || '',
        alt: elem.getAttribute('alt') || elem.getAttribute('title') || ''
      };
    }

    return null;
  }

  /**
   * 格式化列表
   * @param {Element} elem - 列表元素
   * @returns {Object} 列表对象
   */
  formatList(elem) {
    const items = Array.from(elem.querySelectorAll('item'));
    const rend = elem.getAttribute('rend') || 'ul';

    return {
      type: 'list',
      style: rend === 'ol' ? 'ordered' : 'unordered',
      items: items.map(item => trim(item.textContent))
    };
  }

  /**
   * 格式化表格
   * @param {Element} elem - 表格元素
   * @returns {Object} 表格对象
   */
  formatTable(elem) {
    const rows = Array.from(elem.querySelectorAll('row'));

    return {
      type: 'table',
      rows: rows.map(row => {
        const cells = Array.from(row.querySelectorAll('cell'));
        return cells.map(cell => ({
          text: trim(cell.textContent),
          role: cell.getAttribute('role') || ''
        }));
      })
    };
  }
}

export default JsonFormatter;

