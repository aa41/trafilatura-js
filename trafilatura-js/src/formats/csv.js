/**
 * CSV 格式化器
 * 符合RFC 4180标准
 */

import { BaseFormatter } from './base.js';

/**
 * CSV 格式化器类
 */
export class CsvFormatter extends BaseFormatter {
  /**
   * 格式化为CSV
   * @returns {string} CSV格式的文本
   */
  format() {
    const meta = this.getMetadata();
    const text = this.getText().replace(/\n/g, ' ');
    
    // CSV列定义
    const columns = [
      'title',
      'author',
      'date',
      'url',
      'hostname',
      'description',
      'sitename',
      'categories',
      'tags',
      'text'
    ];
    
    // CSV数据
    const row = [
      meta.title,
      meta.author,
      meta.date,
      meta.url,
      meta.hostname,
      meta.description,
      meta.sitename,
      meta.categories,
      meta.tags,
      text
    ];
    
    // 生成CSV
    const header = columns.join(',');
    const dataRow = row.map(field => this.escapeCsv(field)).join(',');
    
    return `${header}\n${dataRow}`;
  }

  /**
   * 转义CSV字段
   * @param {string} field - 字段值
   * @returns {string} 转义后的字段
   */
  escapeCsv(field) {
    if (!field) return '""';
    
    const str = String(field);
    
    // 如果包含逗号、引号或换行符，需要用引号包围并转义内部引号
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return `"${str}"`;
  }
}

export default CsvFormatter;

