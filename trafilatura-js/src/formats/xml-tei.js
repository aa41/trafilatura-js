/**
 * XML-TEI 格式化器
 * 符合TEI P5标准的XML输出
 * 参考：https://tei-c.org/
 */

import { BaseFormatter } from './base.js';
import { trim } from '../utils/text-utils.js';

/**
 * XML-TEI 格式化器类
 */
export class XmlTeiFormatter extends BaseFormatter {
  /**
   * 格式化为XML-TEI
   * @returns {string} XML-TEI格式的文本
   */
  format() {
    const meta = this.getMetadata();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<TEI xmlns="http://www.tei-c.org/ns/1.0">\n';
    
    // TEI Header
    xml += this.formatTeiHeader(meta);
    
    // Text body
    xml += '  <text>\n';
    
    if (this.document.body) {
      xml += '    <body>\n';
      xml += this.formatBody(this.document.body, 6);
      xml += '    </body>\n';
    }
    
    // Comments
    if (this.document.commentsbody) {
      xml += '    <back>\n';
      xml += '      <div type="comments">\n';
      xml += this.formatBody(this.document.commentsbody, 8);
      xml += '      </div>\n';
      xml += '    </back>\n';
    }
    
    xml += '  </text>\n';
    xml += '</TEI>';
    
    return this.normalizeUnicode(xml);
  }

  /**
   * 格式化TEI Header
   * @param {Object} meta - 元数据对象
   * @returns {string} TEI Header XML
   */
  formatTeiHeader(meta) {
    let header = '  <teiHeader>\n';
    
    // File Description
    header += '    <fileDesc>\n';
    header += '      <titleStmt>\n';
    if (meta.title) {
      header += `        <title>${this.escapeXml(meta.title)}</title>\n`;
    }
    if (meta.author) {
      header += `        <author>${this.escapeXml(meta.author)}</author>\n`;
    }
    header += '      </titleStmt>\n';
    
    // Publication Statement
    header += '      <publicationStmt>\n';
    if (meta.sitename) {
      header += `        <publisher>${this.escapeXml(meta.sitename)}</publisher>\n`;
    }
    if (meta.date) {
      header += `        <date>${this.escapeXml(meta.date)}</date>\n`;
    }
    if (meta.url) {
      header += `        <idno type="url">${this.escapeXml(meta.url)}</idno>\n`;
    }
    header += '      </publicationStmt>\n';
    
    // Source Description
    header += '      <sourceDesc>\n';
    if (meta.description) {
      header += `        <p>${this.escapeXml(meta.description)}</p>\n`;
    } else {
      header += '        <p>Extracted from web page</p>\n';
    }
    header += '      </sourceDesc>\n';
    header += '    </fileDesc>\n';
    
    // Encoding Description
    header += '    <encodingDesc>\n';
    header += '      <appInfo>\n';
    header += '        <application ident="trafilatura-js" version="0.1.0">\n';
    header += '          <label>Trafilatura JS</label>\n';
    header += '          <ptr target="https://github.com/trafilatura-js"/>\n';
    header += '        </application>\n';
    header += '      </appInfo>\n';
    header += '    </encodingDesc>\n';
    
    // Profile Description
    if (meta.categories || meta.tags || meta.license) {
      header += '    <profileDesc>\n';
      if (meta.categories || meta.tags) {
        header += '      <textClass>\n';
        header += '        <keywords>\n';
        if (meta.categories) {
          const cats = meta.categories.split(',').map(c => c.trim());
          cats.forEach(cat => {
            if (cat) {
              header += `          <term type="category">${this.escapeXml(cat)}</term>\n`;
            }
          });
        }
        if (meta.tags) {
          const tags = meta.tags.split(',').map(t => t.trim());
          tags.forEach(tag => {
            if (tag) {
              header += `          <term type="tag">${this.escapeXml(tag)}</term>\n`;
            }
          });
        }
        header += '        </keywords>\n';
        header += '      </textClass>\n';
      }
      header += '    </profileDesc>\n';
    }
    
    // Revision Description (optional)
    if (meta.fingerprint || meta.id) {
      header += '    <revisionDesc>\n';
      if (meta.fingerprint) {
        header += `      <change when="${new Date().toISOString().split('T')[0]}" who="#trafilatura-js">\n`;
        header += `        <note>Document fingerprint: ${this.escapeXml(meta.fingerprint)}</note>\n`;
        header += '      </change>\n';
      }
      header += '    </revisionDesc>\n';
    }
    
    header += '  </teiHeader>\n';
    return header;
  }

  /**
   * 格式化文档正文
   * @param {Element} body - body元素
   * @param {number} indent - 缩进空格数
   * @returns {string} XML文本
   */
  formatBody(body, indent = 0) {
    if (!body) return '';

    const parts = [];
    const children = Array.from(body.children);
    const indentStr = ' '.repeat(indent);

    children.forEach(elem => {
      const xml = this.formatElement(elem, indent);
      if (xml) {
        parts.push(xml);
      }
    });

    return parts.join('\n');
  }

  /**
   * 格式化单个元素
   * @param {Element} elem - 元素
   * @param {number} indent - 缩进级别
   * @returns {string} XML文本
   */
  formatElement(elem, indent = 0) {
    if (!elem) return '';

    const tagName = elem.tagName.toLowerCase();
    const indentStr = ' '.repeat(indent);

    // 标题 → <head>
    if (tagName === 'head') {
      const rend = elem.getAttribute('rend') || 'h1';
      const text = this.formatInline(elem);
      return `${indentStr}<head rend="${rend}">${text}</head>`;
    }

    // 段落 → <p>
    if (tagName === 'p') {
      const text = this.formatInline(elem);
      return `${indentStr}<p>${text}</p>`;
    }

    // 列表 → <list>
    if (tagName === 'list') {
      return this.formatList(elem, indent);
    }

    // 引用 → <quote>
    if (tagName === 'quote') {
      const text = this.formatInline(elem);
      return `${indentStr}<quote>${text}</quote>`;
    }

    // 代码 → <code>
    if (tagName === 'code') {
      const language = elem.getAttribute('rend') || '';
      const code = this.escapeXml(elem.textContent || '');
      if (language) {
        return `${indentStr}<code rend="${language}">${code}</code>`;
      }
      return `${indentStr}<code>${code}</code>`;
    }

    // 表格 → <table>
    if (tagName === 'table') {
      return this.formatTable(elem, indent);
    }

    // 图片 → <figure>/<graphic>
    if (tagName === 'graphic') {
      return this.formatGraphic(elem, indent);
    }

    // 换行 → <lb/>
    if (tagName === 'lb') {
      return `${indentStr}<lb/>`;
    }

    // 删除线 → <del>
    if (tagName === 'del') {
      const text = this.formatInline(elem);
      return `${indentStr}<del>${text}</del>`;
    }

    // 默认：段落
    const text = trim(elem.textContent);
    if (text) {
      return `${indentStr}<p>${this.escapeXml(text)}</p>`;
    }

    return '';
  }

  /**
   * 格式化内联内容
   * @param {Element} elem - 元素
   * @returns {string} 格式化后的XML
   */
  formatInline(elem) {
    let xml = '';

    elem.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        xml += this.escapeXml(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // 格式化标记 → <hi>
        if (tagName === 'hi') {
          const rend = node.getAttribute('rend') || '';
          const text = this.escapeXml(node.textContent || '');
          xml += `<hi rend="${rend}">${text}</hi>`;
        }
        // 代码 → <code>
        else if (tagName === 'code') {
          const text = this.escapeXml(node.textContent || '');
          xml += `<code>${text}</code>`;
        }
        // 删除线 → <del>
        else if (tagName === 'del') {
          const text = this.escapeXml(node.textContent || '');
          xml += `<del>${text}</del>`;
        }
        // 链接 → <ref>
        else if (tagName === 'ref') {
          xml += this.formatRef(node);
        }
        // 其他：直接文本
        else {
          xml += this.escapeXml(node.textContent || '');
        }
      }
    });

    return xml;
  }

  /**
   * 格式化链接
   * @param {Element} elem - 链接元素
   * @returns {string} XML链接
   */
  formatRef(elem) {
    const target = elem.getAttribute('target') || '';
    const text = this.escapeXml(elem.textContent || '');
    
    if (target) {
      return `<ref target="${this.escapeXml(target)}">${text}</ref>`;
    }
    return text;
  }

  /**
   * 格式化列表
   * @param {Element} elem - 列表元素
   * @param {number} indent - 缩进级别
   * @returns {string} XML列表
   */
  formatList(elem, indent = 0) {
    const items = Array.from(elem.children);
    const indentStr = ' '.repeat(indent);
    const itemIndent = ' '.repeat(indent + 2);
    const rend = elem.getAttribute('rend') || 'ul';
    
    let xml = `${indentStr}<list rend="${rend}">\n`;
    
    items.forEach(item => {
      if (item.tagName.toLowerCase() === 'item') {
        const text = this.formatInline(item);
        xml += `${itemIndent}<item>${text}</item>\n`;
      }
    });
    
    xml += `${indentStr}</list>`;
    return xml;
  }

  /**
   * 格式化表格
   * @param {Element} elem - 表格元素
   * @param {number} indent - 缩进级别
   * @returns {string} XML表格
   */
  formatTable(elem, indent = 0) {
    const rows = Array.from(elem.querySelectorAll('row'));
    const indentStr = ' '.repeat(indent);
    const rowIndent = ' '.repeat(indent + 2);
    const cellIndent = ' '.repeat(indent + 4);
    
    let xml = `${indentStr}<table>\n`;
    
    rows.forEach(row => {
      xml += `${rowIndent}<row>\n`;
      
      const cells = Array.from(row.querySelectorAll('cell'));
      cells.forEach(cell => {
        const role = cell.getAttribute('role') || '';
        const text = this.escapeXml(trim(cell.textContent));
        
        if (role) {
          xml += `${cellIndent}<cell role="${role}">${text}</cell>\n`;
        } else {
          xml += `${cellIndent}<cell>${text}</cell>\n`;
        }
      });
      
      xml += `${rowIndent}</row>\n`;
    });
    
    xml += `${indentStr}</table>`;
    return xml;
  }

  /**
   * 格式化图片
   * @param {Element} elem - 图片元素
   * @param {number} indent - 缩进级别
   * @returns {string} XML图片
   */
  formatGraphic(elem, indent = 0) {
    const indentStr = ' '.repeat(indent);
    const src = elem.getAttribute('src') || '';
    const alt = elem.getAttribute('alt') || elem.getAttribute('title') || '';
    
    let xml = `${indentStr}<figure>\n`;
    xml += `${indentStr}  <graphic url="${this.escapeXml(src)}"`;
    
    if (alt) {
      xml += `>\n${indentStr}    <desc>${this.escapeXml(alt)}</desc>\n${indentStr}  </graphic>`;
    } else {
      xml += '/>';
    }
    
    xml += `\n${indentStr}</figure>`;
    return xml;
  }

  /**
   * 转义XML特殊字符
   * @param {string} text - 输入文本
   * @returns {string} 转义后的文本
   */
  escapeXml(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default XmlTeiFormatter;

