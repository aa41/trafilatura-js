/**
 * Markdown 格式化器
 * 将文档转换为Markdown格式
 */

import { BaseFormatter } from './base.js';
import { trim } from '../utils/text-utils.js';

/**
 * Markdown 格式化器类
 */
export class MarkdownFormatter extends BaseFormatter {
  /**
   * 格式化为Markdown
   * @returns {string} Markdown格式的文本
   */
  format() {
    let output = '';

    // 添加元数据（YAML front matter）
    if (this.options.with_metadata) {
      output += this.formatFrontMatter();
    }

    // 格式化正文
    if (this.document.body) {
      output += this.formatBody(this.document.body);
    }

    // 格式化评论
    if (this.document.commentsbody && this.options.comments) {
      output += '\n\n---\n\n## 评论\n\n';
      output += this.formatBody(this.document.commentsbody);
    }

    return this.normalizeUnicode(output.trim());
  }

  /**
   * 格式化YAML front matter
   * @returns {string} YAML front matter
   */
  formatFrontMatter() {
    const meta = this.getMetadata();
    let yaml = '---\n';

    if (meta.title) yaml += `title: "${this.escapeYaml(meta.title)}"\n`;
    if (meta.author) yaml += `author: "${this.escapeYaml(meta.author)}"\n`;
    if (meta.date) yaml += `date: "${meta.date}"\n`;
    if (meta.url) yaml += `url: "${meta.url}"\n`;
    if (meta.description) yaml += `description: "${this.escapeYaml(meta.description)}"\n`;
    if (meta.sitename) yaml += `sitename: "${this.escapeYaml(meta.sitename)}"\n`;
    if (meta.categories) yaml += `categories: "${this.escapeYaml(meta.categories)}"\n`;
    if (meta.tags) yaml += `tags: "${this.escapeYaml(meta.tags)}"\n`;
    if (meta.license) yaml += `license: "${this.escapeYaml(meta.license)}"\n`;

    yaml += '---\n\n';
    return yaml;
  }

  /**
   * 转义YAML特殊字符
   * @param {string|Array} text - 输入文本
   * @returns {string} 转义后的文本
   */
  escapeYaml(text) {
    if (!text) return '';
    
    // 处理数组
    if (Array.isArray(text)) {
      return text.join(', ');
    }
    
    // 转换为字符串
    const str = String(text);
    return str.replace(/"/g, '\\"').replace(/\n/g, ' ');
  }

  /**
   * 格式化文档正文
   * @param {Element} body - body元素
   * @returns {string} Markdown文本
   */
  formatBody(body) {
    if (!body) return '';

    const parts = [];
    const children = Array.from(body.children);

    children.forEach(elem => {
      const markdown = this.formatElement(elem);
      if (markdown) {
        parts.push(markdown);
      }
    });

    return parts.join('\n\n');
  }

  /**
   * 格式化单个元素
   * @param {Element} elem - 元素
   * @param {number} level - 嵌套级别
   * @returns {string} Markdown文本
   */
  formatElement(elem, level = 0) {
    if (!elem) return '';

    const tagName = elem.tagName.toLowerCase();

    // 标题
    if (tagName === 'head') {
      return this.formatHeading(elem);
    }

    // 段落
    if (tagName === 'p') {
      return this.formatParagraph(elem);
    }

    // 列表
    if (tagName === 'list') {
      return this.formatList(elem, level);
    }

    // 引用
    if (tagName === 'quote') {
      return this.formatQuote(elem);
    }

    // 代码块
    if (tagName === 'code') {
      return this.formatCode(elem);
    }

    // 表格
    if (tagName === 'table') {
      return this.formatTable(elem);
    }

    // 图片
    if (tagName === 'graphic' && this.options.images) {
      return this.formatImage(elem);
    }

    // 水平线
    if (tagName === 'lb') {
      return '---';
    }

    // 默认：提取文本
    return trim(elem.textContent);
  }

  /**
   * 格式化标题
   * @param {Element} elem - 标题元素
   * @returns {string} Markdown标题
   */
  formatHeading(elem) {
    const level = parseInt(elem.getAttribute('rend')?.replace('h', '') || '1');
    const hashes = '#'.repeat(Math.min(level, 6));
    const text = this.formatInline(elem);
    return `${hashes} ${text}`;
  }

  /**
   * 格式化段落
   * @param {Element} elem - 段落元素
   * @returns {string} Markdown段落
   */
  formatParagraph(elem) {
    return this.formatInline(elem);
  }

  /**
   * 格式化内联内容
   * @param {Element} elem - 元素
   * @returns {string} 格式化后的文本
   */
  formatInline(elem) {
    let text = '';

    elem.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // 格式化标记
        if (this.options.formatting) {
          if (tagName === 'hi') {
            const rend = node.getAttribute('rend');
            if (rend === 'bold' || rend === '#b') {
              text += `**${node.textContent}**`;
            } else if (rend === 'italic' || rend === '#i') {
              text += `*${node.textContent}*`;
            } else {
              text += node.textContent;
            }
          } else if (tagName === 'code') {
            text += `\`${node.textContent}\``;
          } else if (tagName === 'del') {
            text += `~~${node.textContent}~~`;
          } else if (tagName === 'ref') {
            text += this.formatLink(node);
          } else {
            text += node.textContent;
          }
        } else {
          text += node.textContent;
        }
      }
    });

    return trim(text);
  }

  /**
   * 格式化链接
   * @param {Element} elem - 链接元素
   * @returns {string} Markdown链接
   */
  formatLink(elem) {
    if (!this.options.links) {
      return elem.textContent;
    }

    const href = elem.getAttribute('target') || '';
    const text = elem.textContent || href;
    return `[${text}](${href})`;
  }

  /**
   * 格式化列表
   * @param {Element} elem - 列表元素
   * @param {number} level - 嵌套级别
   * @returns {string} Markdown列表
   */
  formatList(elem, level = 0) {
    const items = Array.from(elem.querySelectorAll('item'));
    const indent = '  '.repeat(level);
    const rend = elem.getAttribute('rend') || 'ul';
    const isOrdered = rend === 'ol';

    const lines = items.map((item, index) => {
      const marker = isOrdered ? `${index + 1}.` : '-';
      const text = this.formatInline(item);
      
      // 处理嵌套列表
      const nestedList = item.querySelector('list');
      if (nestedList) {
        return `${indent}${marker} ${text}\n${this.formatList(nestedList, level + 1)}`;
      }
      
      return `${indent}${marker} ${text}`;
    });

    return lines.join('\n');
  }

  /**
   * 格式化引用块
   * @param {Element} elem - 引用元素
   * @returns {string} Markdown引用
   */
  formatQuote(elem) {
    const text = this.formatInline(elem);
    const lines = text.split('\n');
    return lines.map(line => `> ${line}`).join('\n');
  }

  /**
   * 格式化代码块
   * @param {Element} elem - 代码元素
   * @returns {string} Markdown代码块
   */
  formatCode(elem) {
    const language = elem.getAttribute('rend') || '';
    const code = elem.textContent || '';
    
    if (code.includes('\n')) {
      // 多行代码块
      return `\`\`\`${language}\n${code}\n\`\`\``;
    } else {
      // 内联代码
      return `\`${code}\``;
    }
  }

  /**
   * 格式化表格
   * @param {Element} elem - 表格元素
   * @returns {string} Markdown表格
   */
  formatTable(elem) {
    const rows = Array.from(elem.querySelectorAll('row'));
    if (rows.length === 0) return '';

    const lines = [];
    
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('cell'));
      const cellTexts = cells.map(cell => trim(cell.textContent));
      lines.push(`| ${cellTexts.join(' | ')} |`);
      
      // 添加表头分隔符
      if (rowIndex === 0) {
        const separator = cells.map(() => '---').join(' | ');
        lines.push(`| ${separator} |`);
      }
    });

    return lines.join('\n');
  }

  /**
   * 格式化图片
   * @param {Element} elem - 图片元素
   * @returns {string} Markdown图片
   */
  formatImage(elem) {
    const src = elem.getAttribute('src') || '';
    const alt = elem.getAttribute('alt') || elem.getAttribute('title') || '';
    return `![${alt}](${src})`;
  }
}

export default MarkdownFormatter;

