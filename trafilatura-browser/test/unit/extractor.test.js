/**
 * 核心提取器测试
 * 
 * 测试extraction/extractor.js中的核心架构
 * 
 * 注意：由于handler函数还未实现，这些测试主要验证架构正确性
 */

import { extractContent, handleTextElem, pruneUnwantedSections, recoverWildText } from '../../src/extraction/extractor.js';
import { Extractor } from '../../src/settings/config.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('核心提取器 - 步骤1：架构', () => {
  describe('extractContent()', () => {
    test('函数存在且可调用', () => {
      expect(typeof extractContent).toBe('function');
    });
    
    test('处理空输入', () => {
      const options = new Extractor();
      const result = extractContent(null, options);
      
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('length');
      expect(result.text).toBe('');
      expect(result.length).toBe(0);
    });
    
    test('处理简单HTML', () => {
      const html = '<html><body><p>Test content</p></body></html>';
      const doc = loadHtml(html);
      const options = new Extractor();
      
      const result = extractContent(doc, options);
      
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('length');
      // 注意：由于handler未实现，text可能为空，这是预期的
    });
    
    test('创建备份树', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      const options = new Extractor();
      
      // 不应该抛出错误
      expect(() => {
        extractContent(doc, options);
      }).not.toThrow();
    });
    
    test('返回正确的结构', () => {
      const html = '<html><body></body></html>';
      const doc = loadHtml(html);
      const options = new Extractor();
      
      const result = extractContent(doc, options);
      
      expect(result.body).toBeInstanceOf(Element);
      expect(result.body.tagName.toLowerCase()).toBe('body');
      expect(typeof result.text).toBe('string');
      expect(typeof result.length).toBe('number');
    });
  });
  
  describe('handleTextElem()', () => {
    test('函数存在且可调用', () => {
      expect(typeof handleTextElem).toBe('function');
    });
    
    test('处理null输入', () => {
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = handleTextElem(null, potentialTags, options);
      
      expect(result).toBeNull();
    });
    
    test('分发到不同的handler（虽然handler未实现）', () => {
      const potentialTags = new Set(['p', 'head', 'list']);
      const options = new Extractor();
      
      // 创建不同类型的元素
      const pElem = document.createElement('p');
      const headElem = document.createElement('head');
      const listElem = document.createElement('list');
      
      // 不应该抛出错误（即使handler返回null）
      expect(() => {
        handleTextElem(pElem, potentialTags, options);
      }).not.toThrow();
      
      expect(() => {
        handleTextElem(headElem, potentialTags, options);
      }).not.toThrow();
      
      expect(() => {
        handleTextElem(listElem, potentialTags, options);
      }).not.toThrow();
    });
    
    test('lb标签特殊处理', () => {
      const potentialTags = new Set(['lb']);
      const options = new Extractor();
      
      const lbElem = document.createElement('lb');
      
      // 不应该抛出错误
      expect(() => {
        handleTextElem(lbElem, potentialTags, options);
      }).not.toThrow();
    });
    
    test('table标签需要在potentialTags中', () => {
      const options = new Extractor();
      
      const tableElem = document.createElement('table');
      
      // 没有table在potentialTags中
      const result1 = handleTextElem(tableElem, new Set(['p']), options);
      // 应该走other分支
      
      // 有table在potentialTags中
      const result2 = handleTextElem(tableElem, new Set(['table']), options);
      // 应该走table分支
      
      // 两者都不应该抛出错误
      // 由于handler未实现，结果可能都是null
    });
    
    test('graphic标签需要在potentialTags中', () => {
      const options = new Extractor();
      
      const graphicElem = document.createElement('graphic');
      
      // 不在potentialTags中
      const result1 = handleTextElem(graphicElem, new Set(['p']), options);
      
      // 在potentialTags中
      const result2 = handleTextElem(graphicElem, new Set(['graphic']), options);
      
      // 不应该抛出错误
    });
  });
  
  describe('pruneUnwantedSections()', () => {
    test('函数存在且可调用', () => {
      expect(typeof pruneUnwantedSections).toBe('function');
    });
    
    test('处理null输入', () => {
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = pruneUnwantedSections(null, potentialTags, options);
      
      expect(result).toBeNull();
    });
    
    test('返回树（即使未完全实现）', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      const tree = doc.body;
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = pruneUnwantedSections(tree, potentialTags, options);
      
      // 应该返回一个元素
      expect(result).toBeTruthy();
    });
    
    test('precision模式', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      const tree = doc.body;
      const potentialTags = new Set(['p']);
      const options = new Extractor({ precision: true });
      
      expect(() => {
        pruneUnwantedSections(tree, potentialTags, options);
      }).not.toThrow();
      
      expect(options.focus).toBe('precision');
    });
  });
  
  describe('recoverWildText()', () => {
    test('函数存在且可调用', () => {
      expect(typeof recoverWildText).toBe('function');
    });
    
    test('处理null树', () => {
      const resultBody = document.createElement('body');
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = recoverWildText(null, resultBody, options, potentialTags);
      
      expect(result).toBe(resultBody);
    });
    
    test('recall模式添加额外标签', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      const resultBody = document.createElement('body');
      const potentialTags = new Set(['p']);
      const options = new Extractor({ recall: true });
      
      const result = recoverWildText(doc.body, resultBody, options, potentialTags);
      
      // potentialTags应该被更新
      expect(potentialTags.has('div')).toBe(true);
      expect(potentialTags.has('lb')).toBe(true);
      expect(options.focus).toBe('recall');
    });
    
    test('搜索多种元素类型', () => {
      const html = `
        <html>
          <body>
            <p>Paragraph</p>
            <blockquote>Quote</blockquote>
            <code>Code</code>
            <pre>Pre</pre>
          </body>
        </html>
      `;
      const doc = loadHtml(html);
      const resultBody = document.createElement('body');
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      expect(() => {
        recoverWildText(doc.body, resultBody, options, potentialTags);
      }).not.toThrow();
    });
  });
  
  describe('集成测试 - 架构验证', () => {
    test('完整流程不抛出错误', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <article>
              <h1>Title</h1>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </article>
          </body>
        </html>
      `;
      const doc = loadHtml(html);
      const options = new Extractor();
      
      expect(() => {
        const result = extractContent(doc, options);
        expect(result).toBeTruthy();
      }).not.toThrow();
    });
    
    test('处理复杂HTML结构', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <header>Header</header>
            <nav>Navigation</nav>
            <main>
              <article>
                <h1>Title</h1>
                <p>Content</p>
                <blockquote>Quote</blockquote>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
                <table>
                  <tr><td>Cell</td></tr>
                </table>
              </article>
            </main>
            <aside>Sidebar</aside>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      const doc = loadHtml(html);
      const options = new Extractor({ tables: true });
      
      expect(() => {
        const result = extractContent(doc, options);
        expect(result).toBeTruthy();
        expect(result.body).toBeInstanceOf(Element);
      }).not.toThrow();
    });
    
    test('选项配置影响potentialTags', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const doc = loadHtml(html);
      
      // 启用所有选项
      const optionsAll = new Extractor({
        tables: true,
        images: true,
        links: true
      });
      
      expect(() => {
        extractContent(doc, optionsAll);
      }).not.toThrow();
    });
  });
});

describe('架构验证总结', () => {
  test('所有核心函数都已导出', () => {
    expect(extractContent).toBeDefined();
    expect(handleTextElem).toBeDefined();
    expect(pruneUnwantedSections).toBeDefined();
    expect(recoverWildText).toBeDefined();
  });
  
  test('核心架构符合Python设计', () => {
    // 验证函数签名
    expect(extractContent.length).toBe(2); // cleanedTree, options
    expect(handleTextElem.length).toBe(3); // element, potentialTags, options
    expect(pruneUnwantedSections.length).toBe(3); // tree, potentialTags, options
    // recoverWildText有默认参数，所以length是3而不是4
    expect(recoverWildText.length).toBe(3); // tree, resultBody, options, potentialTags=default
  });
});

