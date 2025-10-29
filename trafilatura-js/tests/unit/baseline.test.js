/**
 * baseline.js 单元测试
 * 测试基线提取器功能
 */

import {
  baseline,
  basicBaseline,
  extractFromArea,
  tryContentAreas,
  smartBaseline,
} from '../../src/extraction/baseline.js';

describe('baseline.js - 基线提取器', () => {
  beforeEach(() => {
    // 每个测试前重置 DOM
    if (typeof document !== 'undefined' && document.body) {
      document.body.innerHTML = '';
    }
  });

  describe('baseline()', () => {
    test('应该从简单HTML中提取段落', () => {
      const html = `
        <html>
          <body>
            <p>这是第一段文本内容，需要足够长才能被提取出来。我们需要添加更多的文字内容来满足最小长度要求，这样才能确保内容被正确提取。</p>
            <p>这是第二段文本内容，同样需要足够长才行。这里也添加更多文字内容以满足提取的最小长度限制，确保测试能够通过。</p>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(body).toBeTruthy();
      expect(text).toContain('第一段');
      expect(text).toContain('第二段');
      expect(length).toBeGreaterThan(0);
    });

    test('应该从列表中提取项目', () => {
      const html = `
        <html>
          <body>
            <ul>
              <li>列表项一，包含足够多的文字内容用于测试提取功能，确保达到最小长度要求</li>
              <li>列表项二，同样包含足够多的文字内容，这里添加更多文字以满足长度</li>
              <li>列表项三，继续添加足够的文字内容来确保测试能够通过验证</li>
            </ul>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(text).toContain('列表项一');
      expect(text).toContain('列表项二');
      expect(length).toBeGreaterThan(0);
    });

    test('应该从引用块中提取内容', () => {
      const html = `
        <html>
          <body>
            <blockquote>这是一段重要的引用内容，包含足够的文字用于测试提取功能。我们需要确保文本长度达到要求。</blockquote>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(text).toContain('引用内容');
      expect(length).toBeGreaterThan(0);
    });

    test('应该从代码块中提取内容', () => {
      const html = `
        <html>
          <body>
            <pre><code>function test() { return true; }</code></pre>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(text).toContain('function test');
      expect(length).toBeGreaterThan(0);
    });

    test('应该过滤太短的文本', () => {
      const html = `
        <html>
          <body>
            <p>短</p>
            <p>这是一段足够长的文本内容，应该被提取出来。添加更多文字使其达到最小长度要求。我们需要确保这段文本足够长。</p>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(text).toContain('足够长');
      // 注意：太短的内容会被过滤
    });

    test('应该清理不需要的元素', () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body>
            <p>这是正文内容，包含足够多的文字用于测试提取功能。这里需要更多文字来确保达到最小长度要求。</p>
            <script>console.log('test');</script>
            <style>body { color: red; }</style>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(text).toContain('正文内容');
      expect(text).not.toContain('console.log');
      expect(text).not.toContain('color: red');
    });

    test('应该处理空HTML', () => {
      const html = '<html><body></body></html>';
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = baseline(tree);
      
      expect(body).toBeTruthy();
      expect(text).toBe('');
      expect(length).toBe(0);
    });
  });

  describe('basicBaseline()', () => {
    test('应该提取所有文本内容', () => {
      const html = `
        <html>
          <body>
            <h1>标题</h1>
            <p>段落一</p>
            <p>段落二</p>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const text = basicBaseline(tree);
      
      expect(text).toContain('标题');
      expect(text).toContain('段落一');
      expect(text).toContain('段落二');
    });

    test('应该移除脚本和样式', () => {
      const html = `
        <html>
          <head>
            <style>body { color: red; }</style>
          </head>
          <body>
            <p>可见文本</p>
            <script>alert('test');</script>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const text = basicBaseline(tree);
      
      expect(text).toContain('可见文本');
      expect(text).not.toContain('alert');
      expect(text).not.toContain('color: red');
    });

    test('应该清理空白行', () => {
      const html = `
        <html>
          <body>
            <p>第一行</p>
            
            
            <p>第二行</p>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const text = basicBaseline(tree);
      const lines = text.split('\n').filter(l => l.trim());
      
      expect(lines.length).toBe(2);
    });

    test('应该处理null输入', () => {
      const text = basicBaseline(null);
      expect(text).toBe('');
    });
  });

  describe('extractFromArea()', () => {
    test('应该从指定区域提取内容', () => {
      const html = `
        <html>
          <body>
            <div class="sidebar">侧边栏内容不要提取</div>
            <article class="content">
              <p>这是正文内容，需要从这里提取。添加足够的文字长度来确保达到最小要求。我们需要更多文字内容。</p>
              <p>第二段正文内容，同样需要足够长度才能被提取。更多文字内容在这里继续添加以满足要求。</p>
            </article>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const text = extractFromArea(tree, '.content');
      
      expect(text).toContain('正文内容');
      expect(text).not.toContain('侧边栏');
    });

    test('应该返回空字符串如果找不到区域', () => {
      const html = '<html><body><p>文本</p></body></html>';
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const text = extractFromArea(tree, '.not-exist');
      
      expect(text).toBe('');
    });
  });

  describe('tryContentAreas()', () => {
    test('应该优先从article标签提取', () => {
      const html = `
        <html>
          <body>
            <div>其他内容</div>
            <article>
              <p>这是文章主要内容，需要从这里提取。包含足够的文字长度用于测试功能。我们需要添加更多文字来确保达到最小长度要求。</p>
            </article>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = tryContentAreas(tree);
      
      expect(text).toContain('文章主要内容');
      expect(length).toBeGreaterThan(0);
    });

    test('应该从main标签提取', () => {
      const html = `
        <html>
          <body>
            <main>
              <p>主要内容区域的文本，需要提取出来。包含足够的文字长度来满足最小要求。添加更多文字内容。</p>
            </main>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = tryContentAreas(tree);
      
      expect(text).toContain('主要内容');
      expect(length).toBeGreaterThan(0);
    });

    test('应该从常见class选择器提取', () => {
      const html = `
        <html>
          <body>
            <div class="content">
              <p>内容区域的文本，需要被提取。包含足够长度的文字内容来满足最小要求。添加更多文字内容。</p>
            </div>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = tryContentAreas(tree);
      
      expect(text).toContain('内容区域');
      expect(length).toBeGreaterThan(0);
    });

    test('如果找不到特定区域，应该使用整个树', () => {
      const html = `
        <html>
          <body>
            <div>
              <p>普通div中的内容，也应该被提取。包含足够的文字长度来满足最小要求。添加更多文字。</p>
            </div>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = tryContentAreas(tree);
      
      expect(text).toContain('普通div');
      expect(length).toBeGreaterThan(0);
    });
  });

  describe('smartBaseline()', () => {
    test('应该优先使用内容区域提取', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>这是文章内容，应该被智能提取。包含足够的文字长度用于测试功能。我们需要添加更多文字来确保达到最小长度要求。</p>
              <p>第二段文章内容，同样需要足够长。更多文字内容在这里继续添加以满足提取的最小要求和测试期望。</p>
            </article>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = smartBaseline(tree);
      
      expect(text).toContain('文章内容');
      expect(length).toBeGreaterThan(100);
    });

    test('如果内容区域提取不够，应该回退到全树提取', () => {
      const html = `
        <html>
          <body>
            <article>
              <p>短文本</p>
            </article>
            <div>
              <p>这是另一个区域的长文本内容，应该在回退时被提取。包含更多文字来满足最小长度要求。持续添加文字。</p>
            </div>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = smartBaseline(tree);
      
      // 应该提取到足够的内容
      expect(length).toBeGreaterThan(0);
    });

    test('应该返回内容更多的结果', () => {
      const html = `
        <html>
          <body>
            <p>这是第一段文本，包含大量内容用于测试智能提取功能。需要足够长的文字来满足最小长度要求。</p>
            <p>这是第二段文本，同样包含大量内容。更多文字在这里继续添加以确保达到提取的最小要求。</p>
            <p>第三段文本继续添加更多内容，确保有足够的文字长度用于测试。持续添加文字内容直到满足要求。</p>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const tree = parser.parseFromString(html, 'text/html').documentElement;
      
      const [body, text, length] = smartBaseline(tree);
      
      expect(length).toBeGreaterThan(100);
      expect(text).toContain('第一段');
      expect(text).toContain('第二段');
    });
  });
});

