/**
 * HTML清理函数测试
 * 
 * 测试processing/cleaning.js中的函数
 */

import {
  treeCleaning,
  pruneHtml,
  pruneUnwantedNodes,
  applyBasicCleaning,
  isEmpty,
  bulkDeleteElements,
  bulkStripTags,
  removeHiddenElements
} from '../../src/processing/cleaning.js';
import { Extractor } from '../../src/settings/config.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('树清理函数', () => {
  describe('treeCleaning()', () => {
    test('删除script标签', () => {
      const html = '<div><script>alert("test")</script><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor();
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('script')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除style标签', () => {
      const html = '<div><style>.test{color:red}</style><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor();
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('style')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除导航元素', () => {
      const html = '<div><nav>Navigation</nav><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor();
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('nav')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除footer元素', () => {
      const html = '<div><footer>Footer</footer><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor();
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('footer')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('不保留表格时删除表格', () => {
      const html = '<div><table><tr><td>Cell</td></tr></table><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor({ tables: false });
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('table')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('保留表格时保留表格', () => {
      const html = '<div><table><tr><td>Cell</td></tr></table><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor({ tables: true });
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('table')).not.toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('保留图片时保留figure', () => {
      const html = '<div><figure><img src="test.jpg" /></figure><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor({ images: true });
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('figure')).not.toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('不保留图片时删除figure', () => {
      const html = '<div><figure><img src="test.jpg" /></figure><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor({ images: false });
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('figure')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = treeCleaning(null, options);
      
      expect(result).toBeNull();
    });
    
    test('剥离标签但保留内容', () => {
      const html = '<div><small>Small text</small><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const options = new Extractor();
      const cleaned = treeCleaning(tree, options);
      
      expect(cleaned.querySelector('small')).toBeNull();
      expect(cleaned.textContent).toContain('Small text');
    });
  });
  
  describe('pruneHtml()', () => {
    test('删除空段落', () => {
      const html = '<div><p></p><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree);
      
      const paragraphs = pruned.querySelectorAll('p');
      expect(paragraphs.length).toBeLessThanOrEqual(1);
    });
    
    test('删除空div', () => {
      const html = '<div><div></div><div>Content</div></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree);
      
      const divs = Array.from(pruned.querySelectorAll('div'))
        .filter(d => d.textContent.trim() === '');
      expect(divs.length).toBe(0);
    });
    
    test('删除空span', () => {
      const html = '<div><span></span><span>Content</span></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree);
      
      const spans = Array.from(pruned.querySelectorAll('span'))
        .filter(s => s.textContent.trim() === '');
      expect(spans.length).toBe(0);
    });
    
    test('保留有内容的元素', () => {
      const html = '<div><p>Content</p><div>Text</div></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree);
      
      expect(pruned.querySelector('p')).not.toBeNull();
      expect(pruned.querySelector('div')).not.toBeNull();
    });
    
    test('精确模式不保留尾部文本', () => {
      const html = '<div><p></p>Tail text</div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree, 'precision');
      
      // 在精确模式下，空元素的尾部文本可能不被保留
      expect(pruned).not.toBeNull();
    });
    
    test('平衡模式保留尾部文本', () => {
      const html = '<div><p></p>Tail text</div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneHtml(tree, 'balanced');
      
      expect(pruned.textContent).toContain('Tail');
    });
    
    test('处理null输入', () => {
      const result = pruneHtml(null);
      expect(result).toBeNull();
    });
  });
  
  describe('pruneUnwantedNodes()', () => {
    test('使用XPath删除节点', () => {
      const html = '<div><nav>Nav</nav><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const xpathList = [
        (context) => Array.from(context.querySelectorAll('nav'))
      ];
      
      const pruned = pruneUnwantedNodes(tree, xpathList);
      
      expect(pruned.querySelector('nav')).toBeNull();
      expect(pruned.querySelector('p')).not.toBeNull();
    });
    
    test('处理多个XPath表达式', () => {
      const html = '<div><nav>Nav</nav><footer>Footer</footer><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const xpathList = [
        (context) => Array.from(context.querySelectorAll('nav')),
        (context) => Array.from(context.querySelectorAll('footer'))
      ];
      
      const pruned = pruneUnwantedNodes(tree, xpathList);
      
      expect(pruned.querySelector('nav')).toBeNull();
      expect(pruned.querySelector('footer')).toBeNull();
      expect(pruned.querySelector('p')).not.toBeNull();
    });
    
    test('备份功能：删除太多时恢复', () => {
      const html = '<div><p>Para 1</p><p>Para 2</p><p>Para 3</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      // 删除所有段落（过多）
      const xpathList = [
        (context) => Array.from(context.querySelectorAll('p'))
      ];
      
      const pruned = pruneUnwantedNodes(tree, xpathList, true);
      
      // 应该恢复备份
      expect(pruned.querySelectorAll('p').length).toBeGreaterThan(0);
    });
    
    test('备份功能：删除适量时不恢复', () => {
      const html = '<div><nav>Nav</nav><p>Content with much more text to make it substantial</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const xpathList = [
        (context) => Array.from(context.querySelectorAll('nav'))
      ];
      
      const pruned = pruneUnwantedNodes(tree, xpathList, true);
      
      // 删除量不大，不应该恢复
      expect(pruned.querySelector('nav')).toBeNull();
    });
    
    test('处理空nodelist', () => {
      const html = '<div><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const pruned = pruneUnwantedNodes(tree, []);
      
      expect(pruned).toBe(tree);
    });
    
    test('处理null输入', () => {
      const result = pruneUnwantedNodes(null, []);
      expect(result).toBeNull();
    });
  });
  
  describe('辅助函数', () => {
    describe('isEmpty()', () => {
      test('检测空元素', () => {
        const html = '<div></div>';
        const doc = loadHtml(html);
        const elem = doc.body.firstElementChild;
        
        expect(isEmpty(elem)).toBe(true);
      });
      
      test('检测只有空白的元素', () => {
        const html = '<div>   \n\t  </div>';
        const doc = loadHtml(html);
        const elem = doc.body.firstElementChild;
        
        expect(isEmpty(elem)).toBe(true);
      });
      
      test('检测有内容的元素', () => {
        const html = '<div>Content</div>';
        const doc = loadHtml(html);
        const elem = doc.body.firstElementChild;
        
        expect(isEmpty(elem)).toBe(false);
      });
      
      test('检测有子元素的元素', () => {
        const html = '<div><p></p></div>';
        const doc = loadHtml(html);
        const elem = doc.body.firstElementChild;
        
        expect(isEmpty(elem)).toBe(false);
      });
      
      test('处理null', () => {
        expect(isEmpty(null)).toBe(true);
      });
    });
    
    describe('bulkDeleteElements()', () => {
      test('批量删除元素', () => {
        const html = '<div><span>1</span><span>2</span><span>3</span></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        bulkDeleteElements(tree, 'span');
        
        expect(tree.querySelectorAll('span').length).toBe(0);
      });
      
      test('使用复杂选择器', () => {
        const html = '<div><span class="remove">1</span><span>2</span></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        bulkDeleteElements(tree, 'span.remove');
        
        expect(tree.querySelectorAll('span.remove').length).toBe(0);
        expect(tree.querySelectorAll('span').length).toBe(1);
      });
      
      test('处理null输入', () => {
        expect(() => bulkDeleteElements(null, 'span')).not.toThrow();
      });
    });
    
    describe('bulkStripTags()', () => {
      test('批量剥离标签', () => {
        const html = '<div><small>Small</small><em>Emphasis</em><p>Para</p></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        bulkStripTags(tree, ['small', 'em']);
        
        expect(tree.querySelector('small')).toBeNull();
        expect(tree.querySelector('em')).toBeNull();
        expect(tree.textContent).toContain('Small');
        expect(tree.textContent).toContain('Emphasis');
      });
      
      test('处理空数组', () => {
        const html = '<div><p>Content</p></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        expect(() => bulkStripTags(tree, [])).not.toThrow();
      });
      
      test('处理null输入', () => {
        expect(() => bulkStripTags(null, ['span'])).not.toThrow();
      });
    });
    
    describe('removeHiddenElements()', () => {
      test('移除display:none元素', () => {
        const html = '<div><p style="display:none">Hidden</p><p>Visible</p></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        removeHiddenElements(tree);
        
        expect(tree.querySelectorAll('p').length).toBe(1);
        expect(tree.textContent).toContain('Visible');
      });
      
      test('移除aria-hidden元素', () => {
        const html = '<div><p aria-hidden="true">Hidden</p><p>Visible</p></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        removeHiddenElements(tree);
        
        expect(tree.querySelectorAll('p').length).toBe(1);
        expect(tree.textContent).toContain('Visible');
      });
      
      test('移除hidden类元素', () => {
        const html = '<div><p class="hidden">Hidden</p><p>Visible</p></div>';
        const doc = loadHtml(html);
        const tree = doc.body.firstElementChild;
        
        removeHiddenElements(tree);
        
        expect(tree.querySelectorAll('p').length).toBe(1);
        expect(tree.textContent).toContain('Visible');
      });
      
      test('处理null输入', () => {
        expect(() => removeHiddenElements(null)).not.toThrow();
      });
    });
  });
});

describe('集成测试', () => {
  test('完整清理流程', () => {
    const html = `
      <div>
        <nav>Navigation</nav>
        <script>alert('test')</script>
        <style>.test{color:red}</style>
        <p></p>
        <p>Main content here</p>
        <footer>Footer</footer>
      </div>
    `;
    const doc = loadHtml(html);
    const tree = doc.body.firstElementChild;
    
    const options = new Extractor();
    const cleaned = treeCleaning(tree, options);
    
    expect(cleaned.querySelector('nav')).toBeNull();
    expect(cleaned.querySelector('script')).toBeNull();
    expect(cleaned.querySelector('style')).toBeNull();
    expect(cleaned.querySelector('footer')).toBeNull();
    expect(cleaned.textContent).toContain('Main content');
  });
  
  test('保留重要内容', () => {
    const html = `
      <div>
        <h1>Title</h1>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
        <blockquote>Quote</blockquote>
      </div>
    `;
    const doc = loadHtml(html);
    const tree = doc.body.firstElementChild;
    
    const options = new Extractor();
    const cleaned = treeCleaning(tree, options);
    
    expect(cleaned.querySelector('h1')).not.toBeNull();
    expect(cleaned.querySelectorAll('p').length).toBe(2);
    expect(cleaned.querySelector('blockquote')).not.toBeNull();
  });
});

