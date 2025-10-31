/**
 * 文本输出 - 单元测试
 * 
 * 测试 src/output/text.js 中的所有函数
 */

import {
  replaceElementText,
  processElement,
  xmlToTxt
} from '../../src/output/text.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('文本输出', () => {
  
  // ============================================================================
  // replaceElementText() 测试
  // ============================================================================
  
  describe('replaceElementText()', () => {
    test('基础文本提取', () => {
      const html = '<p>段落文本</p>';
      const tree = loadHtml(html);
      const p = tree.querySelector('p');
      
      const text = replaceElementText(p, false);
      expect(text).toBe('段落文本');
    });
    
    test('Markdown粗体格式', () => {
      const html = '<hi rend="#b">粗体文本</hi>';
      const tree = loadHtml(html);
      const hi = tree.querySelector('hi');
      
      const text = replaceElementText(hi, true);
      expect(text).toBe('**粗体文本**');
    });
    
    test('Markdown斜体格式', () => {
      const html = '<hi rend="#i">斜体文本</hi>';
      const tree = loadHtml(html);
      const hi = tree.querySelector('hi');
      
      const text = replaceElementText(hi, true);
      expect(text).toBe('*斜体文本*');
    });
    
    test('Markdown下划线格式', () => {
      const html = '<hi rend="#u">下划线文本</hi>';
      const tree = loadHtml(html);
      const hi = tree.querySelector('hi');
      
      const text = replaceElementText(hi, true);
      expect(text).toBe('__下划线文本__');
    });
    
    test('Markdown代码格式', () => {
      const html = '<hi rend="#t">代码文本</hi>';
      const tree = loadHtml(html);
      const hi = tree.querySelector('hi');
      
      const text = replaceElementText(hi, true);
      expect(text).toBe('`代码文本`');
    });
    
    test('Markdown标题h1', () => {
      // 直接创建元素（避免DOM解析器对head标签的特殊处理）
      const head = document.createElement('head');
      head.setAttribute('rend', 'h1');
      head.textContent = '一级标题';
      
      const text = replaceElementText(head, true);
      expect(text).toBe('# 一级标题');
    });
    
    test('Markdown标题h2', () => {
      const head = document.createElement('head');
      head.setAttribute('rend', 'h2');
      head.textContent = '二级标题';
      
      const text = replaceElementText(head, true);
      expect(text).toBe('## 二级标题');
    });
    
    test('Markdown标题h3', () => {
      const head = document.createElement('head');
      head.setAttribute('rend', 'h3');
      head.textContent = '三级标题';
      
      const text = replaceElementText(head, true);
      expect(text).toBe('### 三级标题');
    });
    
    test('Markdown删除线', () => {
      const html = '<del>删除文本</del>';
      const tree = loadHtml(html);
      const del = tree.querySelector('del');
      
      const text = replaceElementText(del, true);
      expect(text).toBe('~~删除文本~~');
    });
    
    test('Markdown链接', () => {
      const html = '<ref target="https://example.com">链接文本</ref>';
      const tree = loadHtml(html);
      const ref = tree.querySelector('ref');
      
      const text = replaceElementText(ref, false);
      expect(text).toBe('[链接文本](https://example.com)');
    });
    
    test('Markdown链接（无target）', () => {
      const html = '<ref>链接文本</ref>';
      const tree = loadHtml(html);
      const ref = tree.querySelector('ref');
      
      const text = replaceElementText(ref, false);
      expect(text).toBe('[链接文本]');
    });
    
    test('Markdown内联代码', () => {
      const html = '<code>inline code</code>';
      const tree = loadHtml(html);
      const code = tree.querySelector('code');
      
      const text = replaceElementText(code, true);
      expect(text).toBe('`inline code`');
    });
    
    test('Markdown代码块', () => {
      const html = '<code>line1\nline2</code>';
      const tree = loadHtml(html);
      const code = tree.querySelector('code');
      
      const text = replaceElementText(code, true);
      expect(text).toContain('```\n');
      expect(text).toContain('line1\nline2');
      expect(text).toContain('\n```\n');
    });
    
    test('空元素返回空字符串', () => {
      const text = replaceElementText(null, false);
      expect(text).toBe('');
    });
    
    test('不包含格式时返回纯文本', () => {
      const html = '<hi rend="#b">粗体文本</hi>';
      const tree = loadHtml(html);
      const hi = tree.querySelector('hi');
      
      const text = replaceElementText(hi, false);
      expect(text).toBe('粗体文本');
    });
  });
  
  // ============================================================================
  // processElement() 测试
  // ============================================================================
  
  describe('processElement()', () => {
    test('处理简单段落', () => {
      const html = '<p>段落文本</p>';
      const tree = loadHtml(html);
      const p = tree.querySelector('p');
      
      const result = [];
      processElement(p, result, false);
      
      expect(result.join('')).toContain('段落文本');
    });
    
    test('处理嵌套元素', () => {
      const html = '<p>文本<hi rend="#b">粗体</hi>更多</p>';
      const tree = loadHtml(html);
      const p = tree.querySelector('p');
      
      const result = [];
      processElement(p, result, true);
      
      const text = result.join('');
      expect(text).toContain('文本');
      expect(text).toContain('**粗体**');
    });
    
    test('递归处理子元素', () => {
      const html = `
        <div>
          <p>第一段</p>
          <p>第二段</p>
        </div>
      `;
      const tree = loadHtml(html);
      const div = tree.querySelector('div');
      
      const result = [];
      processElement(div, result, false);
      
      const text = result.join('');
      expect(text).toContain('第一段');
      expect(text).toContain('第二段');
    });
    
    test('处理null元素不报错', () => {
      const result = [];
      expect(() => processElement(null, result, false)).not.toThrow();
    });
    
    test('处理null列表不报错', () => {
      const html = '<p>文本</p>';
      const tree = loadHtml(html);
      const p = tree.querySelector('p');
      
      expect(() => processElement(p, null, false)).not.toThrow();
    });
  });
  
  // ============================================================================
  // xmlToTxt() 测试
  // ============================================================================
  
  describe('xmlToTxt()', () => {
    test('基础文本输出', () => {
      const html = `
        <body>
          <p>段落1</p>
          <p>段落2</p>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, false);
      
      expect(text).toContain('段落1');
      expect(text).toContain('段落2');
    });
    
    test('Markdown格式输出', () => {
      const html = `
        <body>
          <p>这是<hi rend="#b">粗体</hi>和<hi rend="#i">斜体</hi></p>
        </body>
      `;
      const tree = loadHtml(html);
      const markdown = xmlToTxt(tree, true);
      
      expect(markdown).toContain('**粗体**');
      expect(markdown).toContain('*斜体*');
    });
    
    test('链接输出', () => {
      const html = `
        <body>
          <p><ref target="https://example.com">链接文本</ref></p>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, true);
      
      expect(text).toContain('[链接文本](https://example.com)');
    });
    
    test('列表输出', () => {
      const html = `
        <body>
          <list>
            <item>项目1</item>
            <item>项目2</item>
          </list>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, true);
      
      expect(text).toContain('- ');
    });
    
    test('空树返回空字符串', () => {
      const text = xmlToTxt(null, false);
      expect(text).toBe('');
    });
    
    test('没有body元素时处理整个树', () => {
      const html = '<p>段落文本</p>';
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, false);
      
      expect(text).toContain('段落');
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('完整文章输出（纯文本）', () => {
      const html = `
        <body>
          <p>第一段内容</p>
          <p>第二段内容</p>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, false);
      
      expect(text).toContain('第一段内容');
      expect(text).toContain('第二段内容');
    });
    
    test('完整文章输出（Markdown）', () => {
      const html = `
        <body>
          <p>这是<hi rend="#b">粗体</hi>和<hi rend="#i">斜体</hi>的段落。</p>
          <list>
            <item>列表项1</item>
            <item>列表项2</item>
          </list>
          <p>包含<ref target="https://example.com">链接</ref>的段落。</p>
        </body>
      `;
      const tree = loadHtml(html);
      const markdown = xmlToTxt(tree, true);
      
      expect(markdown).toContain('**粗体**');
      expect(markdown).toContain('*斜体*');
      expect(markdown).toContain('- ');
      expect(markdown).toContain('[链接](https://example.com)');
    });
    
    test('中文内容输出', () => {
      const html = `
        <body>
          <p>这是一段中文内容。</p>
          <p>包含<hi rend="#b">粗体中文</hi>的段落。</p>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, true);
      
      expect(text).toContain('中文内容');
      expect(text).toContain('**粗体中文**');
    });
    
    test('复杂嵌套结构', () => {
      const html = `
        <body>
          <p>段落包含<hi rend="#b">粗体<hi rend="#i">和斜体</hi></hi>嵌套。</p>
        </body>
      `;
      const tree = loadHtml(html);
      const text = xmlToTxt(tree, true);
      
      expect(text).toContain('**');
      expect(text).toContain('*');
    });
  });
});

