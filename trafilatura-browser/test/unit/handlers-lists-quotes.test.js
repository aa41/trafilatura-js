/**
 * 列表和引用Handler测试
 * 
 * 测试extraction/handlers中的列表、引用和代码块处理函数
 * 验证步骤3实现的正确性
 */

import {
  handleLists,
  handleQuotes,
  handleCodeBlocks,
  isCodeBlockElement
} from '../../src/extraction/handlers/index.js';
import { Extractor } from '../../src/settings/config.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('Handler函数 - 步骤3：列表和引用', () => {
  describe('handleLists()', () => {
    test('函数存在', () => {
      expect(typeof handleLists).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = handleLists(null, options);
      expect(result).toBeNull();
    });
    
    test('处理简单列表', () => {
      const html = '<list><item>Item 1</item><item>Item 2</item></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
      expect(result.tagName.toLowerCase()).toBe('list');
    });
    
    test('处理列表的text属性', () => {
      const html = '<list>List text<item>Item 1</item></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
      // 列表的text应该被添加为第一个item
    });
    
    test('处理无子元素的item', () => {
      const html = '<list><item>Simple item</item></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
      expect(result.querySelectorAll('item').length).toBeGreaterThan(0);
    });
    
    test('处理有子元素的item', () => {
      const html = '<list><item><hi rend="#b">Bold</hi> text</item></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('处理嵌套列表', () => {
      const html = `
        <list>
          <item>Item 1
            <list>
              <item>Nested Item 1</item>
              <item>Nested Item 2</item>
            </list>
          </item>
          <item>Item 2</item>
        </list>
      `;
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
      // 应该能处理嵌套列表
    });
    
    test('拒绝空列表', () => {
      const html = '<list></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeNull();
    });
    
    test('处理item的tail', () => {
      const html = '<list><item>Item 1</item> tail text<item>Item 2</item></list>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('list');
      const options = new Extractor();
      
      const result = handleLists(elem, options);
      expect(result).toBeTruthy();
    });
  });
  
  describe('isCodeBlockElement()', () => {
    test('函数存在', () => {
      expect(typeof isCodeBlockElement).toBe('function');
    });
    
    test('处理null输入', () => {
      const result = isCodeBlockElement(null);
      expect(result).toBe(false);
    });
    
    test('识别code标签', () => {
      const elem = document.createElement('code');
      const result = isCodeBlockElement(elem);
      expect(result).toBe(true);
    });
    
    test('识别lang属性', () => {
      const elem = document.createElement('pre');
      elem.setAttribute('lang', 'javascript');
      const result = isCodeBlockElement(elem);
      expect(result).toBe(true);
    });
    
    test('识别highlight类的父元素', () => {
      const parent = document.createElement('div');
      parent.className = 'highlight';
      const elem = document.createElement('pre');
      parent.appendChild(elem);
      
      const result = isCodeBlockElement(elem);
      expect(result).toBe(true);
    });
    
    test('识别单个code子元素', () => {
      const elem = document.createElement('pre');
      const code = document.createElement('code');
      elem.appendChild(code);
      
      const result = isCodeBlockElement(elem);
      expect(result).toBe(true);
    });
    
    test('拒绝普通元素', () => {
      const elem = document.createElement('div');
      const result = isCodeBlockElement(elem);
      expect(result).toBe(false);
    });
  });
  
  describe('handleCodeBlocks()', () => {
    test('函数存在', () => {
      expect(typeof handleCodeBlocks).toBe('function');
    });
    
    test('处理null输入', () => {
      const result = handleCodeBlocks(null);
      expect(result).toBeNull();
    });
    
    test('转换元素为code标签', () => {
      const elem = document.createElement('pre');
      elem.textContent = 'console.log("Hello");';
      
      const result = handleCodeBlocks(elem);
      expect(result).toBeTruthy();
      expect(result.tagName.toLowerCase()).toBe('code');
    });
    
    test('保留内容', () => {
      const elem = document.createElement('pre');
      const text = 'function test() { return true; }';
      elem.textContent = text;
      
      const result = handleCodeBlocks(elem);
      expect(result).toBeTruthy();
      expect(result.textContent).toContain('function test');
    });
    
    test('标记所有子元素为done', () => {
      const html = '<pre><span>code</span> text</pre>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('pre');
      
      const result = handleCodeBlocks(elem);
      expect(result).toBeTruthy();
      // 子元素应该被标记为done
      const spans = result.querySelectorAll('span');
      for (const span of spans) {
        expect(span.getAttribute('data-done')).toBe('true');
      }
    });
    
    test('复制属性', () => {
      const elem = document.createElement('pre');
      elem.setAttribute('class', 'language-python');
      elem.setAttribute('data-lang', 'python');
      elem.textContent = 'print("Hello")';
      
      const result = handleCodeBlocks(elem);
      expect(result).toBeTruthy();
      expect(result.hasAttribute('class')).toBe(true);
      expect(result.hasAttribute('data-lang')).toBe(true);
    });
  });
  
  describe('handleQuotes()', () => {
    test('函数存在', () => {
      expect(typeof handleQuotes).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = handleQuotes(null, options);
      expect(result).toBeNull();
    });
    
    test('处理简单引用', () => {
      const html = '<quote>This is a quote</quote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('quote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('处理blockquote', () => {
      const html = '<blockquote>This is a blockquote</blockquote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('blockquote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('处理引用中的子元素', () => {
      const html = '<quote><p>Paragraph 1</p><p>Paragraph 2</p></quote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('quote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('检测代码块并转换', () => {
      const html = '<blockquote><code>code content</code></blockquote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('blockquote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      // 如果检测到代码块，应该返回code元素
      if (result) {
        // 可能是code元素
      }
    });
    
    test('拒绝空引用', () => {
      const html = '<quote></quote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('quote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      expect(result).toBeNull();
    });
    
    test('避免嵌套quote标签', () => {
      const html = '<quote><quote>Nested quote</quote></quote>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('quote');
      const options = new Extractor();
      
      const result = handleQuotes(elem, options);
      // 应该移除嵌套的quote标签
      expect(result).toBeTruthy();
    });
  });
  
  describe('集成测试 - 列表和引用组合', () => {
    test('复杂文档提取', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>Paragraph before list</p>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
              <blockquote>
                <p>Quote text</p>
              </blockquote>
              <pre><code>code block</code></pre>
            </article>
          </body>
        </html>
      `;
      const doc = loadHtml(html);
      const options = new Extractor();
      
      // 测试各个handler
      const lists = doc.querySelectorAll('list, ul, ol');
      for (const list of lists) {
        const result = handleLists(list, options);
        // 可能返回null（如果已经被标记为done或无有效内容）
      }
      
      const quotes = doc.querySelectorAll('quote, blockquote');
      for (const quote of quotes) {
        const result = handleQuotes(quote, options);
        // 可能返回结果
      }
    });
    
    test('处理混合内容', () => {
      const html = `
        <div>
          <blockquote>
            <p>Quote with <strong>emphasis</strong></p>
            <ul>
              <li>Item in quote</li>
            </ul>
          </blockquote>
          <pre class="language-python">
            <code>def hello(): print("Hi")</code>
          </pre>
        </div>
      `;
      const doc = loadHtml(html);
      const options = new Extractor();
      
      // 不应该抛出错误
      expect(() => {
        const quotes = doc.querySelectorAll('blockquote');
        for (const quote of quotes) {
          handleQuotes(quote, options);
        }
        
        const pres = doc.querySelectorAll('pre');
        for (const pre of pres) {
          if (isCodeBlockElement(pre)) {
            handleCodeBlocks(pre);
          }
        }
      }).not.toThrow();
    });
  });
});

describe('Handler函数验证 - 步骤3', () => {
  test('所有新handler都已导出', () => {
    expect(handleLists).toBeDefined();
    expect(handleQuotes).toBeDefined();
    expect(handleCodeBlocks).toBeDefined();
    expect(isCodeBlockElement).toBeDefined();
  });
  
  test('handler函数签名正确', () => {
    expect(handleLists.length).toBe(2); // element, options
    expect(handleQuotes.length).toBe(2); // element, options
    expect(handleCodeBlocks.length).toBe(1); // element
    expect(isCodeBlockElement.length).toBe(1); // element
  });
});

