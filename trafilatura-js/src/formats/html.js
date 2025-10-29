/**
 * HTML 格式化器
 * 输出语义化HTML5
 */

import { BaseFormatter } from './base.js';
import { trim } from '../utils/text-utils.js';

/**
 * HTML 格式化器类
 */
export class HtmlFormatter extends BaseFormatter {
  /**
   * 格式化为HTML
   * @returns {string} HTML格式的文本
   */
  format() {
    const meta = this.getMetadata();
    
    let html = '<!DOCTYPE html>\n';
    html += '<html lang="zh">\n';
    html += '<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    
    if (meta.title) {
      html += `  <title>${this.escapeHtml(meta.title)}</title>\n`;
    }
    if (meta.author) {
      html += `  <meta name="author" content="${this.escapeHtml(meta.author)}">\n`;
    }
    if (meta.description) {
      html += `  <meta name="description" content="${this.escapeHtml(meta.description)}">\n`;
    }
    if (meta.date) {
      html += `  <meta name="date" content="${meta.date}">\n`;
    }
    
    html += '</head>\n';
    html += '<body>\n';
    html += '  <article>\n';
    
    // 添加header
    if (this.options.with_metadata && meta.title) {
      html += '    <header>\n';
      html += `      <h1>${this.escapeHtml(meta.title)}</h1>\n`;
      
      html += '      <p class="meta">\n';
      if (meta.author) {
        html += `        <span class="author">${this.escapeHtml(meta.author)}</span>\n`;
      }
      if (meta.date) {
        html += `        <time datetime="${meta.date}">${meta.date}</time>\n`;
      }
      html += '      </p>\n';
      html += '    </header>\n';
    }
    
    // 正文
    html += '    <main>\n';
    if (this.document.body) {
      html += this.formatBody(this.document.body, 6);
    }
    html += '    </main>\n';
    
    // 评论
    if (this.document.commentsbody && this.options.comments) {
      html += '    <section class="comments">\n';
      html += '      <h2>评论</h2>\n';
      html += this.formatBody(this.document.commentsbody, 6);
      html += '    </section>\n';
    }
    
    html += '  </article>\n';
    html += '</body>\n';
    html += '</html>';
    
    return html;
  }

  /**
   * 格式化文档正文
   * @param {Element} body - body元素
   * @param {number} indent - 缩进空格数
   * @returns {string} HTML文本
   */
  formatBody(body, indent = 0) {
    if (!body) return '';

    const parts = [];
    const children = Array.from(body.children);
    const indentStr = ' '.repeat(indent);

    children.forEach(elem => {
      const html = this.formatElement(elem, indent);
      if (html) {
        parts.push(html);
      }
    });

    return parts.join('\n');
  }

  /**
   * 格式化单个元素
   * @param {Element} elem - 元素
   * @param {number} indent - 缩进级别
   * @returns {string} HTML文本
   */
  formatElement(elem, indent = 0) {
    if (!elem) return '';

    const tagName = elem.tagName.toLowerCase();
    const indentStr = ' '.repeat(indent);

    // 标题
    if (tagName === 'head') {
      const level = elem.getAttribute('rend')?.replace('h', '') || '1';
      const text = this.formatInline(elem);
      return `${indentStr}<h${level}>${text}</h${level}>`;
    }

    // 段落
    if (tagName === 'p') {
      const text = this.formatInline(elem);
      return `${indentStr}<p>${text}</p>`;
    }

    // 列表
    if (tagName === 'list') {
      return this.formatList(elem, indent);
    }

    // 引用
    if (tagName === 'quote') {
      const text = this.formatInline(elem);
      return `${indentStr}<blockquote>${text}</blockquote>`;
    }

    // 代码
    if (tagName === 'code') {
      const code = this.escapeHtml(elem.textContent || '');
      if (code.includes('\n')) {
        const language = elem.getAttribute('rend') || '';
        return `${indentStr}<pre><code${language ? ` class="language-${language}"` : ''}>${code}</code></pre>`;
      }
      return `${indentStr}<code>${code}</code>`;
    }

    // 表格
    if (tagName === 'table') {
      return this.formatTable(elem, indent);
    }

    // 图片
    if (tagName === 'graphic') {
      const src = elem.getAttribute('src') || '';
      const alt = elem.getAttribute('alt') || elem.getAttribute('title') || '';
      return `${indentStr}<figure>\n${indentStr}  <img src="${this.escapeHtml(src)}" alt="${this.escapeHtml(alt)}">\n${indentStr}</figure>`;
    }

    // 换行
    if (tagName === 'lb') {
      return `${indentStr}<hr>`;
    }

    return '';
  }

  /**
   * 格式化内联内容
   * @param {Element} elem - 元素
   * @returns {string} HTML文本
   */
  formatInline(elem) {
    let html = '';

    elem.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        html += this.escapeHtml(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const text = this.escapeHtml(node.textContent || '');

        if (tagName === 'hi') {
          const rend = node.getAttribute('rend');
          if (rend === 'bold' || rend === '#b') {
            html += `<strong>${text}</strong>`;
          } else if (rend === 'italic' || rend === '#i') {
            html += `<em>${text}</em>`;
          } else {
            html += text;
          }
        } else if (tagName === 'code') {
          html += `<code>${text}</code>`;
        } else if (tagName === 'del') {
          html += `<del>${text}</del>`;
        } else if (tagName === 'ref') {
          const target = node.getAttribute('target') || '';
          html += `<a href="${this.escapeHtml(target)}">${text}</a>`;
        } else {
          html += text;
        }
      }
    });

    return html;
  }

  /**
   * 格式化列表
   * @param {Element} elem - 列表元素
   * @param {number} indent - 缩进级别
   * @returns {string} HTML列表
   */
  formatList(elem, indent = 0) {
    const items = Array.from(elem.children);
    const indentStr = ' '.repeat(indent);
    const itemIndent = ' '.repeat(indent + 2);
    const rend = elem.getAttribute('rend') || 'ul';
    const listTag = rend === 'ol' ? 'ol' : 'ul';
    
    let html = `${indentStr}<${listTag}>\n`;
    
    items.forEach(item => {
      if (item.tagName.toLowerCase() === 'item') {
        const text = this.formatInline(item);
        html += `${itemIndent}<li>${text}</li>\n`;
      }
    });
    
    html += `${indentStr}</${listTag}>`;
    return html;
  }

  /**
   * 格式化表格
   * @param {Element} elem - 表格元素
   * @param {number} indent - 缩进级别
   * @returns {string} HTML表格
   */
  formatTable(elem, indent = 0) {
    const rows = Array.from(elem.querySelectorAll('row'));
    const indentStr = ' '.repeat(indent);
    const rowIndent = ' '.repeat(indent + 2);
    const cellIndent = ' '.repeat(indent + 4);
    
    let html = `${indentStr}<table>\n`;
    let inThead = true;
    
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('cell'));
      const hasHeader = cells.some(cell => cell.getAttribute('role') === 'head');
      
      if (inThead && hasHeader) {
        html += `${rowIndent}<thead>\n`;
      } else if (inThead) {
        html += `${rowIndent}<tbody>\n`;
        inThead = false;
      }
      
      html += `${rowIndent}<tr>\n`;
      
      cells.forEach(cell => {
        const role = cell.getAttribute('role');
        const tag = role === 'head' ? 'th' : 'td';
        const text = this.escapeHtml(trim(cell.textContent));
        html += `${cellIndent}<${tag}>${text}</${tag}>\n`;
      });
      
      html += `${rowIndent}</tr>\n`;
      
      if (rowIndex === 0 && hasHeader) {
        html += `${rowIndent}</thead>\n${rowIndent}<tbody>\n`;
        inThead = false;
      }
    });
    
    if (!inThead) {
      html += `${rowIndent}</tbody>\n`;
    }
    
    html += `${indentStr}</table>`;
    return html;
  }

  /**
   * 转义HTML特殊字符
   * @param {string} text - 输入文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default HtmlFormatter;

