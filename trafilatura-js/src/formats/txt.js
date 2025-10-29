/**
 * TXT 格式化器
 * 纯文本输出
 */

import { BaseFormatter } from './base.js';
import { trim } from '../utils/text-utils.js';

/**
 * TXT 格式化器类
 */
export class TxtFormatter extends BaseFormatter {
  /**
   * 格式化为纯文本
   * @returns {string} 纯文本
   */
  format() {
    let output = '';

    // 添加元数据头部
    if (this.options.with_metadata) {
      output += this.formatMetadataHeader();
    }

    // 正文文本
    output += this.getText();

    // 评论文本
    if (this.document.commentsbody && this.options.comments) {
      const comments = this.getComments();
      if (comments) {
        output += '\n\n---\n评论\n---\n\n';
        output += comments;
      }
    }

    return this.normalizeUnicode(output.trim());
  }

  /**
   * 格式化元数据头部
   * @returns {string} 元数据文本
   */
  formatMetadataHeader() {
    const meta = this.getMetadata();
    let header = '';

    if (meta.title) header += `标题: ${meta.title}\n`;
    if (meta.author) header += `作者: ${meta.author}\n`;
    if (meta.date) header += `日期: ${meta.date}\n`;
    if (meta.url) header += `URL: ${meta.url}\n`;
    if (meta.sitename) header += `来源: ${meta.sitename}\n`;
    if (meta.description) header += `描述: ${meta.description}\n`;
    if (meta.categories) header += `分类: ${meta.categories}\n`;
    if (meta.tags) header += `标签: ${meta.tags}\n`;

    if (header) {
      header += '\n---\n\n';
    }

    return header;
  }
}

export default TxtFormatter;

