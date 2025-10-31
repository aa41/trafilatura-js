/**
 * 表格和图片Handler测试
 * 
 * 测试extraction/handlers中的表格和图片处理函数
 * 验证步骤4实现的正确性
 */

import {
  handleTable,
  defineCellType,
  handleImage
} from '../../src/extraction/handlers/index.js';
import { Extractor } from '../../src/settings/config.js';
import { loadHtml } from '../../src/utils/dom.js';
import { isImageFile } from '../../src/utils/text.js';

describe('Handler函数 - 步骤4：表格和图片', () => {
  // ============================================================================
  // defineCellType() 测试
  // ============================================================================
  describe('defineCellType()', () => {
    test('函数存在', () => {
      expect(typeof defineCellType).toBe('function');
    });
    
    test('创建普通单元格', () => {
      const cell = defineCellType(false);
      expect(cell).toBeTruthy();
      expect(cell.tagName.toLowerCase()).toBe('cell');
      expect(cell.hasAttribute('role')).toBe(false);
    });
    
    test('创建表头单元格', () => {
      const cell = defineCellType(true);
      expect(cell).toBeTruthy();
      expect(cell.tagName.toLowerCase()).toBe('cell');
      expect(cell.getAttribute('role')).toBe('head');
    });
  });

  // ============================================================================
  // handleTable() 测试
  // ============================================================================
  describe('handleTable()', () => {
    test('函数存在', () => {
      expect(typeof handleTable).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      const result = handleTable(null, potentialTags, options);
      expect(result).toBeNull();
    });
    
    test('处理空表格', () => {
      const html = '<table></table>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeNull(); // 空表格应该返回null
    });
    
    test('处理简单表格', () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
          <tr>
            <td>Cell 3</td>
            <td>Cell 4</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeTruthy();
      expect(result.tagName.toLowerCase()).toBe('table');
      expect(result.querySelectorAll('row').length).toBeGreaterThan(0);
    });
    
    test('处理带表头的表格', () => {
      const html = `
        <table>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
          <tr>
            <td>Data 1</td>
            <td>Data 2</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeTruthy();
      
      // 检查表头单元格是否有role="head"
      const cells = result.querySelectorAll('cell');
      const headCells = Array.from(cells).filter(c => c.getAttribute('role') === 'head');
      expect(headCells.length).toBeGreaterThan(0);
    });
    
    test('处理带thead/tbody的表格', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Data</td></tr>
          </tbody>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeTruthy();
      // thead/tbody应该被剥离，但内容保留
    });
    
    test('处理带colspan的表格', () => {
      const html = `
        <table>
          <tr>
            <td colspan="2">Wide Cell</td>
          </tr>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeTruthy();
      // 应该计算最大列数并设置span属性
      const rows = result.querySelectorAll('row');
      if (rows.length > 0) {
        const firstRow = rows[0];
        // 如果所有行的colspan不同，应该有span属性
        // 如果所有行的colspan相同，不应该有span属性
      }
    });
    
    test('处理单元格中的格式化元素', () => {
      const html = `
        <table>
          <tr>
            <td><strong>Bold</strong> text</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi', 'strong']);
      
      const result = handleTable(elem, potentialTags, options);
      expect(result).toBeTruthy();
      // 格式化元素应该被处理
    });
    
    test('处理嵌套表格（应该停止处理）', () => {
      const html = `
        <table>
          <tr>
            <td>
              Cell with nested table
              <table>
                <tr><td>Nested</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi']);
      
      const result = handleTable(elem, potentialTags, options);
      // 应该在遇到嵌套表格时停止处理
      expect(result).toBeTruthy();
    });
  });

  // ============================================================================
  // handleImage() 测试
  // ============================================================================
  describe('handleImage()', () => {
    test('函数存在', () => {
      expect(typeof handleImage).toBe('function');
    });
    
    test('处理null输入', () => {
      const result = handleImage(null);
      expect(result).toBeNull();
    });
    
    test('处理无src属性的图片', () => {
      const html = '<img alt="No source" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeNull(); // 无src应该返回null
    });
    
    test('处理带src的图片', () => {
      const html = '<img src="https://example.com/image.jpg" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      expect(result.tagName.toLowerCase()).toBe('graphic');
      expect(result.getAttribute('src')).toBe('https://example.com/image.jpg');
    });
    
    test('处理带data-src的图片（优先级）', () => {
      const html = '<img data-src="https://example.com/lazy.jpg" src="placeholder.jpg" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      // data-src应该优先于src
      expect(result.getAttribute('src')).toBe('https://example.com/lazy.jpg');
    });
    
    test('处理带alt属性的图片', () => {
      const html = '<img src="https://example.com/image.png" alt="Test image" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      expect(result.getAttribute('alt')).toBe('Test image');
    });
    
    test('处理带title属性的图片', () => {
      const html = '<img src="https://example.com/image.png" title="Image title" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      expect(result.getAttribute('title')).toBe('Image title');
    });
    
    test('处理带alt和title的图片', () => {
      const html = '<img src="https://example.com/image.png" alt="Alt text" title="Title text" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      expect(result.getAttribute('alt')).toBe('Alt text');
      expect(result.getAttribute('title')).toBe('Title text');
    });
    
    test('处理相对URL（无options）', () => {
      const html = '<img src="/images/test.jpg" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      // 相对URL应该被处理
      const src = result.getAttribute('src');
      expect(src).toBeTruthy();
    });
    
    test('处理相对URL（带options.url）', () => {
      const html = '<img src="/images/test.jpg" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      const options = new Extractor();
      options.url = 'https://example.com/page.html';
      
      const result = handleImage(elem, options);
      expect(result).toBeTruthy();
      // 应该转换为绝对URL
      expect(result.getAttribute('src')).toBe('https://example.com/images/test.jpg');
    });
    
    test('处理协议相对URL', () => {
      const html = '<img src="//example.com/image.jpg" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      // 应该添加http://前缀
      expect(result.getAttribute('src')).toBe('http://example.com/image.jpg');
    });
    
    test('处理非图片扩展名', () => {
      const html = '<img src="https://example.com/file.pdf" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      // 非图片扩展名应该返回null
      expect(result).toBeNull();
    });
    
    test('处理data-src-*属性', () => {
      const html = '<img data-src-retina="https://example.com/image@2x.png" />';
      const doc = loadHtml(html);
      const elem = doc.querySelector('img');
      
      const result = handleImage(elem);
      expect(result).toBeTruthy();
      expect(result.getAttribute('src')).toBe('https://example.com/image@2x.png');
    });
    
    test('处理不同图片格式', () => {
      const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'];
      
      formats.forEach(format => {
        const html = `<img src="https://example.com/image.${format}" />`;
        const doc = loadHtml(html);
        const elem = doc.querySelector('img');
        
        const result = handleImage(elem);
        expect(result).toBeTruthy();
        expect(result.getAttribute('src')).toContain(`.${format}`);
      });
    });
  });

  // ============================================================================
  // isImageFile() 测试（工具函数）
  // ============================================================================
  describe('isImageFile()', () => {
    test('识别有效的图片URL', () => {
      expect(isImageFile('https://example.com/image.jpg')).toBe(true);
      expect(isImageFile('https://example.com/photo.png')).toBe(true);
      expect(isImageFile('https://example.com/pic.gif')).toBe(true);
      expect(isImageFile('https://example.com/img.webp')).toBe(true);
    });
    
    test('拒绝无效的URL', () => {
      expect(isImageFile(null)).toBe(false);
      expect(isImageFile('')).toBe(false);
      expect(isImageFile('https://example.com/file.pdf')).toBe(false);
      expect(isImageFile('https://example.com/page.html')).toBe(false);
    });
    
    test('拒绝过长的URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(8200) + '.jpg';
      expect(isImageFile(longUrl)).toBe(false);
    });
    
    test('处理不同的图片格式', () => {
      expect(isImageFile('image.jpg')).toBe(true);
      expect(isImageFile('image.jpeg')).toBe(true);
      expect(isImageFile('image.png')).toBe(true);
      expect(isImageFile('image.gif')).toBe(true);
      expect(isImageFile('image.webp')).toBe(true);
      expect(isImageFile('image.avif')).toBe(true);
      expect(isImageFile('image.bmp')).toBe(true);
      expect(isImageFile('image.heic')).toBe(true);
      expect(isImageFile('image.heif')).toBe(true);
    });
  });

  // ============================================================================
  // 集成测试
  // ============================================================================
  describe('集成测试', () => {
    test('表格和图片组合', () => {
      const html = `
        <table>
          <tr>
            <td>Text cell</td>
            <td><img src="https://example.com/icon.png" alt="Icon" /></td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const tableElem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi', 'img']);
      
      const result = handleTable(tableElem, potentialTags, options);
      expect(result).toBeTruthy();
      // 表格应该能处理包含图片的单元格
    });
    
    test('复杂表格结构', () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Product A</strong></td>
              <td>A great <em>product</em></td>
              <td><img src="https://example.com/a.jpg" /></td>
            </tr>
            <tr>
              <td>Product B</td>
              <td>Another product</td>
              <td><img src="https://example.com/b.png" /></td>
            </tr>
          </tbody>
        </table>
      `;
      const doc = loadHtml(html);
      const tableElem = doc.querySelector('table');
      const options = new Extractor();
      const potentialTags = new Set(['p', 'hi', 'strong', 'em', 'img']);
      
      const result = handleTable(tableElem, potentialTags, options);
      expect(result).toBeTruthy();
      expect(result.querySelectorAll('row').length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 函数验证测试
  // ============================================================================
  describe('函数导出验证', () => {
    test('所有函数都已导出', () => {
      expect(typeof defineCellType).toBe('function');
      expect(typeof handleTable).toBe('function');
      expect(typeof handleImage).toBe('function');
    });
  });
});

