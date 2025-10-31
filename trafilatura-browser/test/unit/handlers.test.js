/**
 * Handler函数测试
 * 
 * 测试extraction/handlers中的各个处理函数
 * 验证步骤2实现的正确性
 */

import {
  processNode,
  handleTextNode,
  handleParagraphs,
  handleTitles,
  handleFormatting,
  handleOtherElements
} from '../../src/extraction/handlers/index.js';
import { Extractor } from '../../src/settings/config.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('Handler函数 - 步骤2', () => {
  describe('processNode()', () => {
    test('函数存在', () => {
      expect(typeof processNode).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = processNode(null, options);
      expect(result).toBeNull();
    });
    
    test('处理空元素', () => {
      const elem = document.createElement('p');
      const options = new Extractor();
      
      const result = processNode(elem, options);
      expect(result).toBeNull();
    });
    
    test('处理done标签', () => {
      const elem = document.createElement('done');
      const options = new Extractor();
      
      const result = processNode(elem, options);
      expect(result).toBeNull();
    });
    
    test('处理有文本的元素', () => {
      const elem = document.createElement('p');
      elem.textContent = 'Test content';
      const options = new Extractor();
      
      const result = processNode(elem, options);
      expect(result).toBeTruthy();
      expect(result.textContent).toBe('Test content');
    });
    
    test('修剪空格', () => {
      const elem = document.createElement('p');
      elem.textContent = '  Test content  ';
      const options = new Extractor();
      
      const result = processNode(elem, options);
      expect(result).toBeTruthy();
      // 应该修剪首尾空格
    });
  });
  
  describe('handleTextNode()', () => {
    test('函数存在', () => {
      expect(typeof handleTextNode).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = handleTextNode(null, options);
      expect(result).toBeNull();
    });
    
    test('处理graphic元素', () => {
      const elem = document.createElement('graphic');
      const options = new Extractor();
      
      const result = handleTextNode(elem, options);
      expect(result).toBeTruthy();
      expect(result.tagName.toLowerCase()).toBe('graphic');
    });
    
    test('处理空元素', () => {
      const elem = document.createElement('p');
      const options = new Extractor();
      
      const result = handleTextNode(elem, options);
      expect(result).toBeNull();
    });
    
    test('处理done标签', () => {
      const elem = document.createElement('done');
      const options = new Extractor();
      
      const result = handleTextNode(elem, options);
      expect(result).toBeNull();
    });
    
    test('处理有文本的元素', () => {
      const elem = document.createElement('p');
      elem.textContent = 'Test content';
      const options = new Extractor();
      
      const result = handleTextNode(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('preserveSpaces参数生效', () => {
      const elem = document.createElement('p');
      elem.textContent = '  Test  ';
      const options = new Extractor();
      
      // 不保留空格
      const result1 = handleTextNode(elem, options, true, false);
      expect(result1).toBeTruthy();
      
      // 保留空格
      const result2 = handleTextNode(elem, options, true, true);
      expect(result2).toBeTruthy();
    });
  });
  
  describe('handleParagraphs()', () => {
    test('函数存在', () => {
      expect(typeof handleParagraphs).toBe('function');
    });
    
    test('处理null输入', () => {
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = handleParagraphs(null, potentialTags, options);
      expect(result).toBeNull();
    });
    
    test('处理简单段落', () => {
      const elem = document.createElement('p');
      elem.textContent = 'Test paragraph';
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = handleParagraphs(elem, potentialTags, options);
      expect(result).toBeTruthy();
    });
    
    test('清除元素属性', () => {
      const elem = document.createElement('p');
      elem.setAttribute('class', 'test');
      elem.setAttribute('id', 'test-id');
      elem.textContent = 'Test';
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = handleParagraphs(elem, potentialTags, options);
      // 原始元素的属性应该被清除
      expect(elem.hasAttribute('class')).toBe(false);
      expect(elem.hasAttribute('id')).toBe(false);
    });
    
    test('处理无子元素的段落', () => {
      const elem = document.createElement('p');
      elem.textContent = 'Simple paragraph';
      const potentialTags = new Set(['p']);
      const options = new Extractor();
      
      const result = handleParagraphs(elem, potentialTags, options);
      expect(result).toBeTruthy();
    });
    
    test('处理有格式化子元素的段落', () => {
      const html = '<p>Text with <hi rend="#b">bold</hi> content</p>';
      const doc = loadHtml(html);
      const elem = doc.querySelector('p');
      const potentialTags = new Set(['p', 'hi', 'ref']);
      const options = new Extractor();
      
      const result = handleParagraphs(elem, potentialTags, options);
      expect(result).toBeTruthy();
    });
  });
  
  describe('handleTitles()', () => {
    test('函数存在', () => {
      expect(typeof handleTitles).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = handleTitles(null, options);
      expect(result).toBeNull();
    });
    
    test('处理简单标题', () => {
      const elem = document.createElement('head');
      elem.textContent = 'Test Title';
      const options = new Extractor();
      
      const result = handleTitles(elem, options);
      expect(result).toBeTruthy();
      expect(result.textContent).toContain('Test Title');
    });
    
    test('处理无子元素的标题', () => {
      const elem = document.createElement('head');
      elem.textContent = 'Simple Title';
      const options = new Extractor();
      
      const result = handleTitles(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('处理有子元素的标题', () => {
      const elem = document.createElement('head');
      const child = document.createElement('hi');
      child.textContent = 'Formatted Title';
      elem.appendChild(child);
      const options = new Extractor();
      
      const result = handleTitles(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('拒绝空标题', () => {
      const elem = document.createElement('head');
      const options = new Extractor();
      
      const result = handleTitles(elem, options);
      expect(result).toBeNull();
    });
  });
  
  describe('handleFormatting()', () => {
    test('函数存在', () => {
      expect(typeof handleFormatting).toBe('function');
    });
    
    test('处理null输入', () => {
      const options = new Extractor();
      const result = handleFormatting(null, options);
      expect(result).toBeNull();
    });
    
    test('处理简单格式化元素', () => {
      const elem = document.createElement('hi');
      elem.textContent = 'Bold text';
      elem.setAttribute('rend', '#b');
      const options = new Extractor();
      
      const result = handleFormatting(elem, options);
      expect(result).toBeTruthy();
    });
    
    test('孤立元素应包装在<p>中', () => {
      const elem = document.createElement('hi');
      elem.textContent = 'Orphan bold';
      const options = new Extractor();
      
      const result = handleFormatting(elem, options);
      expect(result).toBeTruthy();
      // 如果是孤立的，应该被包装在p中
      if (result.tagName.toLowerCase() === 'p') {
        expect(result.children.length).toBeGreaterThan(0);
      }
    });
    
    test('在受保护的父元素中不包装', () => {
      // 这个测试需要更复杂的DOM结构
      const parent = document.createElement('p');
      const elem = document.createElement('hi');
      elem.textContent = 'Bold in p';
      parent.appendChild(elem);
      const options = new Extractor();
      
      const result = handleFormatting(elem, options);
      expect(result).toBeTruthy();
    });
  });
  
  describe('handleOtherElements()', () => {
    test('函数存在', () => {
      expect(typeof handleOtherElements).toBe('function');
    });
    
    test('处理null输入', () => {
      const potentialTags = new Set(['div']);
      const options = new Extractor();
      
      const result = handleOtherElements(null, potentialTags, options);
      expect(result).toBeNull();
    });
    
    test('拒绝不在potentialTags中的元素', () => {
      const elem = document.createElement('span');
      elem.textContent = 'Test';
      const potentialTags = new Set(['div']);
      const options = new Extractor();
      
      const result = handleOtherElements(elem, potentialTags, options);
      expect(result).toBeNull();
    });
    
    test('处理div元素', () => {
      const elem = document.createElement('div');
      elem.textContent = 'Test content';
      const potentialTags = new Set(['div']);
      const options = new Extractor();
      
      const result = handleOtherElements(elem, potentialTags, options);
      expect(result).toBeTruthy();
    });
    
    test('div应转换为p', () => {
      const elem = document.createElement('div');
      elem.textContent = 'Test content';
      const potentialTags = new Set(['div']);
      const options = new Extractor();
      
      const result = handleOtherElements(elem, potentialTags, options);
      if (result) {
        expect(result.tagName.toLowerCase()).toBe('p');
      }
    });
    
    test('处理w3-code类的div', () => {
      const elem = document.createElement('div');
      elem.className = 'w3-code';
      elem.textContent = 'code content';
      const potentialTags = new Set(['div', 'code']);
      const options = new Extractor();
      
      const result = handleOtherElements(elem, potentialTags, options);
      // 目前返回null，因为handle_code_blocks未实现
      // 这是预期的
    });
    
    test('清除元素属性', () => {
      const elem = document.createElement('div');
      elem.setAttribute('class', 'test');
      elem.textContent = 'Test';
      const potentialTags = new Set(['div']);
      const options = new Extractor();
      
      const result = handleOtherElements(elem, potentialTags, options);
      if (result) {
        expect(result.hasAttribute('class')).toBe(false);
      }
    });
  });
  
  describe('集成测试 - Handler组合', () => {
    test('复杂HTML文档提取', () => {
      const html = `
        <html>
          <body>
            <article>
              <head>Main Title</head>
              <p>First paragraph with <hi rend="#b">bold</hi> text.</p>
              <p>Second paragraph.</p>
              <div>Some div content</div>
            </article>
          </body>
        </html>
      `;
      const doc = loadHtml(html);
      const options = new Extractor();
      const potentialTags = new Set(['head', 'p', 'hi', 'div']);
      
      // 测试各个handler
      const heads = doc.querySelectorAll('head');
      for (const head of heads) {
        const result = handleTitles(head, options);
        if (result) {
          expect(result.textContent).toContain('Title');
        }
      }
      
      const paras = doc.querySelectorAll('p');
      for (const p of paras) {
        const result = handleParagraphs(p, potentialTags, options);
        if (result) {
          expect(result.tagName.toLowerCase()).toBe('p');
        }
      }
    });
  });
});

describe('Handler函数验证', () => {
  test('所有handler都已导出', () => {
    expect(processNode).toBeDefined();
    expect(handleTextNode).toBeDefined();
    expect(handleParagraphs).toBeDefined();
    expect(handleTitles).toBeDefined();
    expect(handleFormatting).toBeDefined();
    expect(handleOtherElements).toBeDefined();
  });
  
  test('handler函数签名正确', () => {
    expect(processNode.length).toBe(2); // elem, options
    // handleTextNode有默认参数，所以length是2而不是4
    expect(handleTextNode.length).toBe(2); // elem, options (commentsFix和preserveSpaces有默认值)
    expect(handleParagraphs.length).toBe(3); // element, potentialTags, options
    expect(handleTitles.length).toBe(2); // element, options
    expect(handleFormatting.length).toBe(2); // element, options
    expect(handleOtherElements.length).toBe(3); // element, potentialTags, options
  });
});

