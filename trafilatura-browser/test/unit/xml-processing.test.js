/**
 * XML处理函数 - 单元测试
 * 
 * 测试 src/output/xml-processing.js 中的所有函数
 */

import {
  deleteElement,
  mergeWithParent,
  removeEmptyElements,
  stripDoubleTags,
  cleanAttributes
} from '../../src/output/xml-processing.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('XML处理函数', () => {
  
  // ============================================================================
  // deleteElement() 测试
  // ============================================================================
  
  describe('deleteElement()', () => {
    test('删除元素并保留tail文本', () => {
      const html = '<p>前置<span>删除</span>后置</p>';
      const tree = loadHtml(html);
      const span = tree.querySelector('span');
      
      deleteElement(span, true);
      
      expect(tree.querySelector('span')).toBeNull();
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('前置');
      expect(p.textContent).toContain('后置');
    });
    
    test('删除元素不保留tail文本', () => {
      const html = '<p>前置<span>删除</span>后置</p>';
      const tree = loadHtml(html);
      const span = tree.querySelector('span');
      
      deleteElement(span, false);
      
      expect(tree.querySelector('span')).toBeNull();
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('前置');
    });
    
    test('删除没有前置元素的元素', () => {
      const html = '<p><span>删除</span>后置</p>';
      const tree = loadHtml(html);
      const span = tree.querySelector('span');
      
      deleteElement(span, true);
      
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('后置');
    });
    
    test('删除多个子元素', () => {
      const html = '<p>文本<span>删除1</span>中间<span>删除2</span>结尾</p>';
      const tree = loadHtml(html);
      const spans = tree.querySelectorAll('span');
      
      for (const span of spans) {
        deleteElement(span, true);
      }
      
      expect(tree.querySelectorAll('span').length).toBe(0);
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('中间');
      expect(p.textContent).toContain('结尾');
    });
    
    test('处理null元素', () => {
      expect(() => deleteElement(null)).not.toThrow();
    });
    
    test('处理没有父元素的元素', () => {
      const div = document.createElement('div');
      expect(() => deleteElement(div)).not.toThrow();
    });
  });
  
  // ============================================================================
  // mergeWithParent() 测试
  // ============================================================================
  
  describe('mergeWithParent()', () => {
    test('合并元素到父元素', () => {
      const html = '<p>文本<span>合并</span>更多</p>';
      const tree = loadHtml(html);
      const span = tree.querySelector('span');
      
      mergeWithParent(span, false);
      
      expect(tree.querySelector('span')).toBeNull();
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('合并');
      expect(p.textContent).toContain('更多');
    });
    
    test('合并到前一个兄弟元素', () => {
      const html = '<p><strong>前置</strong><span>合并</span></p>';
      const tree = loadHtml(html);
      const span = tree.querySelector('span');
      
      mergeWithParent(span, false);
      
      expect(tree.querySelector('span')).toBeNull();
      const p = tree.querySelector('p');
      expect(p).not.toBeNull();
      expect(p.textContent).toContain('前置');
      expect(p.textContent).toContain('合并');
    });
    
    test('处理null元素', () => {
      expect(() => mergeWithParent(null)).not.toThrow();
    });
  });
  
  // ============================================================================
  // removeEmptyElements() 测试
  // ============================================================================
  
  describe('removeEmptyElements()', () => {
    test('移除空段落', () => {
      const html = `
        <body>
          <p>有内容</p>
          <p></p>
          <p>   </p>
          <p>也有内容</p>
        </body>
      `;
      const tree = loadHtml(html);
      const cleaned = removeEmptyElements(tree);
      const paragraphs = cleaned.querySelectorAll('p');
      
      // 应该只保留有内容的段落
      expect(paragraphs.length).toBeLessThanOrEqual(2);
      
      // 检查有内容的段落还在
      const texts = Array.from(paragraphs).map(p => p.textContent.trim());
      expect(texts).toContain('有内容');
      expect(texts).toContain('也有内容');
    });
    
    test('移除空的hi元素', () => {
      const html = `
        <p>
          <hi rend="#b">粗体</hi>
          <hi rend="#i"></hi>
          <hi rend="#u">下划线</hi>
        </p>
      `;
      const tree = loadHtml(html);
      const cleaned = removeEmptyElements(tree);
      const his = cleaned.querySelectorAll('hi');
      
      expect(his.length).toBe(2);
    });
    
    test('保留有tail的空元素', () => {
      const html = '<p><span></span>tail文本</p>';
      const tree = loadHtml(html);
      const originalSpans = tree.querySelectorAll('span').length;
      
      const cleaned = removeEmptyElements(tree);
      const cleanedSpans = cleaned.querySelectorAll('span').length;
      
      // 有tail的元素应该保留
      expect(cleanedSpans).toBe(originalSpans);
    });
    
    test('不移除graphic元素（自然为空）', () => {
      const html = '<body><graphic></graphic></body>';
      const tree = loadHtml(html);
      const cleaned = removeEmptyElements(tree);
      
      expect(cleaned.querySelector('graphic')).not.toBeNull();
    });
    
    test('不移除lb元素（自然为空）', () => {
      const html = '<body><p>文本<lb></lb>换行</p></body>';
      const tree = loadHtml(html);
      const cleaned = removeEmptyElements(tree);
      
      expect(cleaned.querySelector('lb')).not.toBeNull();
    });
    
    test('处理null输入', () => {
      const result = removeEmptyElements(null);
      expect(result).toBeNull();
    });
  });
  
  // ============================================================================
  // stripDoubleTags() 测试
  // ============================================================================
  
  describe('stripDoubleTags()', () => {
    test('合并连续的相同hi标签', () => {
      const html = `
        <p>
          <hi rend="#b">粗体1</hi><hi rend="#b">粗体2</hi>
        </p>
      `;
      const tree = loadHtml(html);
      const cleaned = stripDoubleTags(tree);
      const his = cleaned.querySelectorAll('hi');
      
      expect(his.length).toBe(1);
      expect(his[0].textContent).toContain('粗体1');
      expect(his[0].textContent).toContain('粗体2');
    });
    
    test('不合并rend不同的hi标签', () => {
      const html = `
        <p>
          <hi rend="#b">粗体</hi><hi rend="#i">斜体</hi>
        </p>
      `;
      const tree = loadHtml(html);
      const original = tree.querySelectorAll('hi').length;
      
      const cleaned = stripDoubleTags(tree);
      const after = cleaned.querySelectorAll('hi').length;
      
      expect(after).toBe(original); // 应该保持不变
    });
    
    test('合并连续的del标签', () => {
      const html = `
        <p>
          <del>删除1</del><del>删除2</del>
        </p>
      `;
      const tree = loadHtml(html);
      const cleaned = stripDoubleTags(tree);
      const dels = cleaned.querySelectorAll('del');
      
      expect(dels.length).toBe(1);
    });
    
    test('跳过有文本间隔的标签', () => {
      const html = `
        <p>
          <hi rend="#b">粗体1</hi>间隔文本<hi rend="#b">粗体2</hi>
        </p>
      `;
      const tree = loadHtml(html);
      const original = tree.querySelectorAll('hi').length;
      
      const cleaned = stripDoubleTags(tree);
      const after = cleaned.querySelectorAll('hi').length;
      
      expect(after).toBe(original); // 有间隔，不应该合并
    });
    
    test('处理null输入', () => {
      const result = stripDoubleTags(null);
      expect(result).toBeNull();
    });
  });
  
  // ============================================================================
  // cleanAttributes() 测试
  // ============================================================================
  
  describe('cleanAttributes()', () => {
    test('移除p元素的属性', () => {
      const html = '<p class="test" id="para">文本</p>';
      const tree = loadHtml(html);
      const cleaned = cleanAttributes(tree);
      const p = cleaned.querySelector('p');
      
      expect(p.hasAttribute('class')).toBe(false);
      expect(p.hasAttribute('id')).toBe(false);
    });
    
    test('保留hi元素的rend属性', () => {
      const html = '<hi rend="#b" class="bold">粗体</hi>';
      const tree = loadHtml(html);
      const cleaned = cleanAttributes(tree);
      const hi = cleaned.querySelector('hi');
      
      expect(hi.hasAttribute('rend')).toBe(true);
      expect(hi.getAttribute('rend')).toBe('#b');
    });
    
    test('保留ref元素的target属性', () => {
      const html = '<ref target="https://example.com" class="link">链接</ref>';
      const tree = loadHtml(html);
      const cleaned = cleanAttributes(tree);
      const ref = cleaned.querySelector('ref');
      
      expect(ref.hasAttribute('target')).toBe(true);
    });
    
    test('移除body的所有属性', () => {
      const html = '<body class="main" id="content"><p>文本</p></body>';
      const tree = loadHtml(html);
      const cleaned = cleanAttributes(tree);
      const body = cleaned.querySelector('body');
      
      expect(body.hasAttribute('class')).toBe(false);
      expect(body.hasAttribute('id')).toBe(false);
    });
    
    test('保留cell元素的role属性', () => {
      const html = '<cell role="head">标题</cell>';
      const tree = loadHtml(html);
      const cleaned = cleanAttributes(tree);
      const cell = cleaned.querySelector('cell');
      
      expect(cell.hasAttribute('role')).toBe(true);
    });
    
    test('处理null输入', () => {
      const result = cleanAttributes(null);
      expect(result).toBeNull();
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('完整清理流程', () => {
      const html = `
        <body class="main">
          <p>有内容</p>
          <p></p>
          <hi rend="#b">粗体1</hi><hi rend="#b">粗体2</hi>
          <p id="test">更多内容</p>
        </body>
      `;
      const tree = loadHtml(html);
      
      // 依次应用所有清理函数
      let cleaned = removeEmptyElements(tree);
      cleaned = stripDoubleTags(cleaned);
      cleaned = cleanAttributes(cleaned);
      
      // 验证结果
      const paragraphs = cleaned.querySelectorAll('p');
      const his = cleaned.querySelectorAll('hi');
      const body = cleaned.querySelector('body');
      
      expect(paragraphs.length).toBeLessThanOrEqual(2); // 空段落被移除
      expect(his.length).toBe(1); // 重复hi被合并
      expect(body.hasAttribute('class')).toBe(false); // 属性被清理
    });
  });
});

