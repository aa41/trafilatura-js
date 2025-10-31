/**
 * 核心提取函数 - 单元测试
 * 
 * 测试 src/core/extract.js 中的extract和bareExtraction函数
 */

import { extract, bareExtraction } from '../../src/core/extract.js';
import { Extractor } from '../../src/settings/extractor.js';

describe('核心提取函数', () => {
  
  // ============================================================================
  // extract()基础测试
  // ============================================================================
  
  describe('extract() - 基础功能', () => {
    test('提取简单文本', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>这是测试内容。</p>
              <p>第二段内容。</p>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html);
      
      expect(result).toBeTruthy();
      expect(result).toContain('这是测试内容');
      expect(result).toContain('第二段内容');
    });
    
    test('空HTML返回null', () => {
      const result = extract('');
      expect(result).toBeNull();
    });
    
    test('null输入返回null', () => {
      const result = extract(null);
      expect(result).toBeNull();
    });
    
    test('无效HTML返回null', () => {
      const result = extract('<html></html>');
      expect(result).toBeNull();
    });
    
    test('默认格式为txt', () => {
      const html = '<div><p>测试</p></div>';
      const result = extract(html);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('测试');
    });
  });
  
  // ============================================================================
  // extract() - 格式选项
  // ============================================================================
  
  describe('extract() - 输出格式', () => {
    const testHtml = `
      <html>
        <head>
          <title>测试文章</title>
          <meta name="author" content="测试作者">
        </head>
        <body>
          <article>
            <h1>标题</h1>
            <p>内容段落。</p>
          </article>
        </body>
      </html>
    `;
    
    test('TXT格式', () => {
      const result = extract(testHtml, {
        format: 'txt',
        with_metadata: false
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('内容段落');
    });
    
    test('Markdown格式', () => {
      const result = extract(testHtml, {
        format: 'markdown',
        with_metadata: false,
        include_formatting: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('内容段落');
    });
    
    test('JSON格式', () => {
      const result = extract(testHtml, {
        format: 'json',
        with_metadata: true
      });
      
      expect(result).toBeTruthy();
      expect(() => JSON.parse(result)).not.toThrow();
      
      const data = JSON.parse(result);
      expect(data.text).toContain('内容段落');
    });
    
    test('CSV格式', () => {
      const result = extract(testHtml, {
        format: 'csv',
        with_metadata: true
      });
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
  
  // ============================================================================
  // extract() - 元数据选项
  // ============================================================================
  
  describe('extract() - 元数据', () => {
    const htmlWithMeta = `
      <html>
        <head>
          <title>文章标题</title>
          <meta name="author" content="作者名">
          <meta name="description" content="文章描述">
          <meta property="og:url" content="https://example.com">
        </head>
        <body>
          <article>
            <p>文章内容。</p>
          </article>
        </body>
      </html>
    `;
    
    test('不包含元数据', () => {
      const result = extract(htmlWithMeta, {
        format: 'txt',
        with_metadata: false
      });
      
      expect(result).not.toContain('---');
      expect(result).not.toContain('title:');
      expect(result).toContain('文章内容');
    });
    
    test('包含元数据', () => {
      const result = extract(htmlWithMeta, {
        format: 'txt',
        with_metadata: true
      });
      
      expect(result).toContain('---');
      expect(result).toContain('title: 文章标题');
      expect(result).toContain('author: 作者名');
      expect(result).toContain('文章内容');
    });
    
    test('Markdown带元数据', () => {
      const result = extract(htmlWithMeta, {
        format: 'markdown',
        with_metadata: true,
        include_formatting: true
      });
      
      expect(result).toContain('---');
      expect(result).toContain('title: 文章标题');
      expect(result).toContain('文章内容');
    });
  });
  
  // ============================================================================
  // extract() - 表格和列表
  // ============================================================================
  
  describe('extract() - 表格和列表', () => {
    test('包含表格', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>前文</p>
              <table>
                <tr><td>单元格1</td><td>单元格2</td></tr>
                <tr><td>单元格3</td><td>单元格4</td></tr>
              </table>
              <p>后文</p>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        include_tables: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('前文');
      expect(result).toContain('后文');
      // 表格内容应该被提取
    });
    
    test('不包含表格', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>前文</p>
              <table>
                <tr><td>单元格1</td></tr>
              </table>
              <p>后文</p>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        include_tables: false
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('前文');
      expect(result).toContain('后文');
    });
    
    test('包含列表', () => {
      const html = `
        <html>
          <body>
            <article>
              <ul>
                <li>列表项1</li>
                <li>列表项2</li>
                <li>列表项3</li>
              </ul>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        format: 'markdown',
        include_formatting: true
      });
      
      expect(result).toBeTruthy();
      // Markdown列表应该包含
    });
  });
  
  // ============================================================================
  // extract() - Extractor对象
  // ============================================================================
  
  describe('extract() - Extractor对象', () => {
    test('接受Extractor实例', () => {
      const html = '<div><p>测试内容</p></div>';
      
      const extractor = new Extractor({
        format: 'txt',
        with_metadata: false
      });
      
      const result = extract(html, extractor);
      
      expect(result).toBeTruthy();
      expect(result).toContain('测试内容');
    });
    
    test('Extractor优先级设置', () => {
      const html = '<div><p>测试</p></div>';
      
      const extractor = new Extractor({
        precision: true
      });
      
      expect(extractor.focus).toBe('precision');
      
      const result = extract(html, extractor);
      expect(result).toBeTruthy();
    });
  });
  
  // ============================================================================
  // bareExtraction()测试
  // ============================================================================
  
  describe('bareExtraction()', () => {
    test('简单提取', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>这是简单内容。</p>
              <p>第二段。</p>
            </article>
          </body>
        </html>
      `;
      
      const result = bareExtraction(html);
      
      expect(result).toBeTruthy();
      expect(result).toContain('这是简单内容');
      expect(result).toContain('第二段');
    });
    
    test('不包含元数据', () => {
      const html = `
        <html>
          <head>
            <title>标题</title>
            <meta name="author" content="作者">
          </head>
          <body>
            <p>内容</p>
          </body>
        </html>
      `;
      
      const result = bareExtraction(html);
      
      expect(result).toBeTruthy();
      expect(result).not.toContain('title:');
      expect(result).not.toContain('author:');
      expect(result).toContain('内容');
    });
    
    test('带格式化选项', () => {
      const html = '<div><p>测试</p></div>';
      
      const result = bareExtraction(html, {
        formatting: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('测试');
    });
    
    test('空HTML返回null', () => {
      const result = bareExtraction('');
      expect(result).toBeNull();
    });
    
    test('无效HTML返回null', () => {
      const result = bareExtraction('<html></html>');
      expect(result).toBeNull();
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('完整文章提取 - TXT', () => {
      const html = `
        <html>
          <head>
            <title>完整文章标题</title>
            <meta name="author" content="张三">
            <meta name="description" content="这是一篇测试文章">
          </head>
          <body>
            <article>
              <h1>主标题</h1>
              <p>这是第一段内容，包含重要信息。</p>
              <p>这是第二段内容，继续描述。</p>
              <h2>子标题</h2>
              <p>子章节的内容。</p>
              <ul>
                <li>列表项一</li>
                <li>列表项二</li>
              </ul>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        format: 'txt',
        with_metadata: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('---');
      expect(result).toContain('title: 完整文章标题');
      expect(result).toContain('author: 张三');
      expect(result).toContain('第一段内容');
      expect(result).toContain('第二段内容');
      expect(result).toContain('子章节的内容');
    });
    
    test('完整文章提取 - Markdown', () => {
      const html = `
        <html>
          <head>
            <title>Markdown文章</title>
          </head>
          <body>
            <article>
              <h1>大标题</h1>
              <p>段落内容</p>
              <h2>小标题</h2>
              <p>更多内容</p>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        format: 'markdown',
        with_metadata: true,
        include_formatting: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('---');
      expect(result).toContain('title: Markdown文章');
      expect(result).toContain('段落内容');
      expect(result).toContain('更多内容');
    });
    
    test('完整文章提取 - JSON', () => {
      const html = `
        <html>
          <head>
            <title>JSON测试</title>
            <meta name="author" content="李四">
          </head>
          <body>
            <article>
              <p>测试内容</p>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        format: 'json',
        with_metadata: true
      });
      
      expect(result).toBeTruthy();
      
      const data = JSON.parse(result);
      expect(data.title).toBe('JSON测试');
      expect(data.author).toBe('李四');
      expect(data.text).toContain('测试内容');
    });
    
    test('真实博客文章模拟', () => {
      const html = `
        <html>
          <head>
            <title>如何学习JavaScript</title>
            <meta name="author" content="技术博主">
            <meta property="og:url" content="https://blog.example.com/learn-js">
            <meta name="keywords" content="JavaScript,编程,教程">
          </head>
          <body>
            <article class="post">
              <header>
                <h1>如何学习JavaScript</h1>
                <p class="meta">发布于 2023-01-01</p>
              </header>
              <div class="content">
                <p>JavaScript是一门强大的编程语言。</p>
                <p>学习JavaScript需要掌握以下几点：</p>
                <ol>
                  <li>基础语法</li>
                  <li>DOM操作</li>
                  <li>异步编程</li>
                </ol>
                <h2>基础语法</h2>
                <p>变量、函数、对象是JavaScript的基础。</p>
                <h2>DOM操作</h2>
                <p>操作网页元素是前端开发的核心。</p>
              </div>
            </article>
          </body>
        </html>
      `;
      
      const result = extract(html, {
        format: 'markdown',
        with_metadata: true,
        include_formatting: true
      });
      
      expect(result).toBeTruthy();
      expect(result).toContain('title: 如何学习JavaScript');
      expect(result).toContain('author: 技术博主');
      expect(result).toContain('JavaScript是一门强大的编程语言');
      expect(result).toContain('基础语法');
      expect(result).toContain('DOM操作');
    });
  });
});

