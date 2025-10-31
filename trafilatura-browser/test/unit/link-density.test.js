/**
 * 链接密度算法测试
 * 
 * 测试processing/link-density.js中的核心算法
 */

import {
  collectLinkInfo,
  linkDensityTest,
  linkDensityTestTables,
  calculateLinkDensity,
  isNavigationElement,
  batchLinkDensityTest
} from '../../src/processing/link-density.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('链接密度算法', () => {
  describe('collectLinkInfo()', () => {
    test('收集链接信息', () => {
      const html = '<div><ref>Link 1</ref><ref>Link 2</ref></div>';
      const doc = loadHtml(html);
      const links = Array.from(doc.querySelectorAll('ref'));
      
      const info = collectLinkInfo(links);
      
      expect(info.elemNum).toBe(2);
      expect(info.textList).toEqual(['Link 1', 'Link 2']);
      expect(info.totalLen).toBe(12); // 6 + 6
      expect(info.shortElems).toBe(2); // 两个都<10字符
    });
    
    test('识别短链接', () => {
      const html = '<div><ref>Short</ref><ref>This is a much longer link text</ref></div>';
      const doc = loadHtml(html);
      const links = Array.from(doc.querySelectorAll('ref'));
      
      const info = collectLinkInfo(links);
      
      expect(info.elemNum).toBe(2);
      expect(info.shortElems).toBe(1); // 只有一个<10字符
    });
    
    test('处理空链接', () => {
      const html = '<div><ref></ref><ref>   </ref><ref>Valid</ref></div>';
      const doc = loadHtml(html);
      const links = Array.from(doc.querySelectorAll('ref'));
      
      const info = collectLinkInfo(links);
      
      expect(info.elemNum).toBe(1); // 只计算有内容的链接
      expect(info.textList).toEqual(['Valid']);
    });
    
    test('处理空数组', () => {
      const info = collectLinkInfo([]);
      
      expect(info.totalLen).toBe(0);
      expect(info.elemNum).toBe(0);
      expect(info.shortElems).toBe(0);
      expect(info.textList).toEqual([]);
    });
    
    test('处理null输入', () => {
      const info = collectLinkInfo(null);
      
      expect(info.totalLen).toBe(0);
      expect(info.elemNum).toBe(0);
    });
  });
  
  describe('linkDensityTest()', () => {
    describe('单链接场景', () => {
      test('长链接占主导（精确模式）', () => {
        const html = '<p><ref>This is a very long link that dominates the element</ref></p>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, true);
        
        expect(result.isBoilerplate).toBe(true);
      });
      
      test('长链接占主导（平衡模式）', () => {
        const html = '<p><ref>' + 'a'.repeat(150) + '</ref></p>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(true);
      });
      
      test('短链接不算样板', () => {
        const html = '<p><ref>Link</ref> and much more regular content here</p>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
      });
    });
    
    describe('多链接场景', () => {
      test('链接文本占80%以上', () => {
        const html = '<div><ref>Link 1</ref> <ref>Link 2</ref> <ref>Link 3</ref> x</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(true);
      });
      
      test('80%以上是短链接', () => {
        const html = '<div><ref>L1</ref> <ref>L2</ref> <ref>L3</ref> <ref>L4</ref> <ref>L5</ref></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        // 5个短链接，占100%
        expect(result.isBoilerplate).toBe(true);
      });
      
      test('长内容低链接密度不算样板', () => {
        const html = `
          <div>
            <ref>Link</ref>
            This is a substantial amount of regular text content that is not a link.
            There is much more text here than in the link, so the link density is low.
          </div>
        `;
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        const text = elem.textContent.trim();
        
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
      });
    });
    
    describe('段落元素特殊规则', () => {
      test('最后一个段落 - limitLen=60', () => {
        const html = '<div><p><ref>Link text</ref> some content</p></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        const text = elem.textContent;
        
        // 总长度<60，会执行详细检查
        const result = linkDensityTest(elem, text, false);
        
        // 链接文本/总文本 < 0.8，不算样板
        expect(result.isBoilerplate).toBe(false);
      });
      
      test('非最后段落 - limitLen=30', () => {
        const html = '<div><p id="first"><ref>Link</ref> text</p><p id="second">Para 2</p></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('#first');
        const text = elem.textContent;
        
        // 有下一个兄弟，limitLen=30
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
      });
    });
    
    describe('其他元素规则', () => {
      test('最后一个元素 - limitLen=300', () => {
        const html = '<div><div id="target"><ref>Link</ref> content here</div></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('#target');
        const text = elem.textContent;
        
        // 长度<300，会检查
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
      });
      
      test('非最后元素 - limitLen=100', () => {
        const html = '<div><div id="first"><ref>Link</ref> and some more content</div><div id="second">Div 2</div></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('#first');
        const text = elem.textContent;
        
        // 有下一个兄弟，limitLen=100
        // 元素文本: "Link and some more content" (28字符)
        // 链接文本: "Link" (4字符)
        // 4 / 28 = 14.3% < 80%，所以不是样板
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
      });
    });
    
    describe('边界情况', () => {
      test('没有链接', () => {
        const html = '<p>Just regular text content</p>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        expect(result.isBoilerplate).toBe(false);
        expect(result.linkTexts).toEqual([]);
      });
      
      test('处理null元素', () => {
        const result = linkDensityTest(null, 'text', false);
        
        expect(result.isBoilerplate).toBe(false);
      });
      
      test('处理空文本', () => {
        const html = '<p><ref>Link</ref></p>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('p');
        
        const result = linkDensityTest(elem, '', false);
        
        expect(result.isBoilerplate).toBe(false);
      });
      
      test('所有链接都是空的', () => {
        const html = '<div><ref></ref><ref>  </ref></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        const text = elem.textContent;
        
        const result = linkDensityTest(elem, text, false);
        
        // elemNum = 0，返回true
        expect(result.isBoilerplate).toBe(true);
      });
    });
  });
  
  describe('linkDensityTestTables()', () => {
    test('高链接密度表格', () => {
      const html = `<table><tr><td><ref>L1</ref></td><td><ref>L2</ref></td><td><ref>L3</ref></td><td><ref>L4</ref></td><td><ref>L5</ref></td></tr></table>`;
      const doc = loadHtml(html);
      const table = doc.querySelector('table');
      
      const result = linkDensityTestTables(table);
      
      // 5个短链接，几乎全是链接文本
      // 链接文本长度 / 总文本长度 > 50%
      // 注意：紧凑的HTML减少了空白字符的影响
      expect(result).toBe(true);
    });
    
    test('低链接密度表格', () => {
      const html = `
        <table>
          <tr>
            <td>Regular content</td>
            <td>More content</td>
            <td><ref>One Link</ref></td>
          </tr>
          <tr>
            <td>Even more regular content here</td>
            <td>And more text</td>
            <td>Text cell</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const table = doc.querySelector('table');
      
      const result = linkDensityTestTables(table);
      
      // 链接文本<50%
      expect(result).toBe(false);
    });
    
    test('空表格', () => {
      const html = '<table></table>';
      const doc = loadHtml(html);
      const table = doc.querySelector('table');
      
      const result = linkDensityTestTables(table);
      
      // 空表格算样板
      expect(result).toBe(true);
    });
    
    test('没有链接的表格', () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;
      const doc = loadHtml(html);
      const table = doc.querySelector('table');
      
      const result = linkDensityTestTables(table);
      
      // 没有链接，不算样板
      expect(result).toBe(false);
    });
    
    test('处理null输入', () => {
      const result = linkDensityTestTables(null);
      
      expect(result).toBe(false);
    });
  });
  
  describe('辅助函数', () => {
    describe('calculateLinkDensity()', () => {
      test('计算链接密度比率', () => {
        const html = '<div><ref>Link text</ref> Regular text here</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const density = calculateLinkDensity(elem);
        
        expect(density).toBeGreaterThan(0);
        expect(density).toBeLessThan(1);
      });
      
      test('100%链接', () => {
        const html = '<div><ref>All link text</ref></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const density = calculateLinkDensity(elem);
        
        expect(density).toBeCloseTo(1, 1);
      });
      
      test('0%链接', () => {
        const html = '<div>No links here</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const density = calculateLinkDensity(elem);
        
        expect(density).toBe(0);
      });
      
      test('处理空元素', () => {
        const html = '<div></div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const density = calculateLinkDensity(elem);
        
        expect(density).toBe(0);
      });
      
      test('处理null', () => {
        const density = calculateLinkDensity(null);
        
        expect(density).toBe(0);
      });
    });
    
    describe('isNavigationElement()', () => {
      test('识别nav元素', () => {
        const html = '<nav>Navigation</nav>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('nav');
        
        const result = isNavigationElement(elem);
        
        expect(result).toBe(true);
      });
      
      test('识别nav类名', () => {
        const html = '<div class="navigation">Links</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const result = isNavigationElement(elem);
        
        expect(result).toBe(true);
      });
      
      test('识别sidebar', () => {
        const html = '<div class="sidebar">Sidebar content</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const result = isNavigationElement(elem);
        
        expect(result).toBe(true);
      });
      
      test('高链接密度', () => {
        const html = '<div><ref>L1</ref><ref>L2</ref><ref>L3</ref> x</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const result = isNavigationElement(elem);
        
        // 链接密度>60%
        expect(result).toBe(true);
      });
      
      test('识别menu', () => {
        const html = '<div id="menu">Menu items</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const result = isNavigationElement(elem);
        
        expect(result).toBe(true);
      });
      
      test('普通内容元素', () => {
        const html = '<div>Regular content with some text</div>';
        const doc = loadHtml(html);
        const elem = doc.querySelector('div');
        
        const result = isNavigationElement(elem);
        
        expect(result).toBe(false);
      });
      
      test('处理null', () => {
        const result = isNavigationElement(null);
        
        expect(result).toBe(false);
      });
    });
    
    describe('batchLinkDensityTest()', () => {
      test('批量检查元素', () => {
        const html = `
          <div>
            <p id="p1"><ref>Link 1</ref> <ref>Link 2</ref> x</p>
            <p id="p2">Regular content here</p>
            <p id="p3"><ref>Link</ref> some text</p>
          </div>
        `;
        const doc = loadHtml(html);
        const elements = Array.from(doc.querySelectorAll('p'));
        
        const results = batchLinkDensityTest(elements, false);
        
        expect(results).toHaveLength(3);
        expect(results[0].isBoilerplate).toBe(true); // 高链接密度
        expect(results[1].isBoilerplate).toBe(false); // 无链接
        expect(results[2].isBoilerplate).toBe(false); // 低链接密度
      });
      
      test('处理空数组', () => {
        const results = batchLinkDensityTest([], false);
        
        expect(results).toEqual([]);
      });
      
      test('处理null', () => {
        const results = batchLinkDensityTest(null, false);
        
        expect(results).toEqual([]);
      });
    });
  });
});

describe('真实场景测试', () => {
  test('导航菜单', () => {
    const html = `
      <nav>
        <ref>Home</ref>
        <ref>About</ref>
        <ref>Contact</ref>
        <ref>Blog</ref>
        <ref>Products</ref>
      </nav>
    `;
    const doc = loadHtml(html);
    const nav = doc.querySelector('nav');
    const text = nav.textContent;
    
    const result = linkDensityTest(nav, text, false);
    
    // 全是短链接，应该识别为样板
    expect(result.isBoilerplate).toBe(true);
  });
  
  test('侧边栏小工具', () => {
    const html = `
      <div class="sidebar">
        <ref>Category 1</ref>
        <ref>Category 2</ref>
        <ref>Category 3</ref>
        <ref>Tag 1</ref>
        <ref>Tag 2</ref>
      </div>
    `;
    const doc = loadHtml(html);
    const sidebar = doc.querySelector('.sidebar');
    
    const isNav = isNavigationElement(sidebar);
    
    expect(isNav).toBe(true);
  });
  
  test('文章段落（正常内容）', () => {
    const html = `
      <p>
        This is a regular paragraph with some <ref>inline link</ref> embedded
        in the text. The link is part of the content flow and the paragraph
        contains substantial text beyond just the link.
      </p>
    `;
    const doc = loadHtml(html);
    const para = doc.querySelector('p');
    const text = para.textContent.trim();
    
    const result = linkDensityTest(para, text, false);
    
    // 低链接密度，不算样板
    expect(result.isBoilerplate).toBe(false);
  });
  
  test('相关文章列表（可能是样板）', () => {
    const html = `
      <div class="related-posts">
        <ref>Link 1</ref>
        <ref>Link 2</ref>
        <ref>Link 3</ref>
        <ref>Link 4</ref>
        <ref>Link 5</ref>
      </div>
    `;
    const doc = loadHtml(html);
    const related = doc.querySelector('.related-posts');
    const text = related.textContent.trim();
    
    // 5个短链接，总共约30字符
    // 元素长度<100，会进入详细检查
    // 全是短链接（<10字符），短链接比例100%，应该识别为样板
    const result = linkDensityTest(related, text, false);
    
    expect(result.isBoilerplate).toBe(true);
  });
  
  test('面包屑导航', () => {
    const html = `
      <div class="breadcrumb">
        <ref>Home</ref> / <ref>Category</ref> / <ref>Subcategory</ref> / Article
      </div>
    `;
    const doc = loadHtml(html);
    const breadcrumb = doc.querySelector('.breadcrumb');
    
    const isNav = isNavigationElement(breadcrumb);
    
    expect(isNav).toBe(true);
  });
});

