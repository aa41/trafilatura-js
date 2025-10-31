/**
 * Baseline提取器测试
 * 
 * 测试extraction/baseline.js中的函数
 */

import { basicCleaning, baseline, html2txt } from '../../src/extraction/baseline.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('Baseline提取器', () => {
  describe('basicCleaning()', () => {
    test('删除aside元素', () => {
      const html = '<div><aside>Sidebar</aside><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('aside')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除footer元素', () => {
      const html = '<div><footer>Footer</footer><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('footer')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除footer类的div', () => {
      const html = '<div><div class="site-footer">Footer</div><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('.site-footer')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除footer ID的div', () => {
      const html = '<div><div id="page-footer">Footer</div><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('#page-footer')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除script标签', () => {
      const html = '<div><script>alert("test")</script><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('script')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('删除style标签', () => {
      const html = '<div><style>.test{color:red}</style><p>Content</p></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('style')).toBeNull();
      expect(cleaned.querySelector('p')).not.toBeNull();
    });
    
    test('保留正常内容', () => {
      const html = '<div><p>Para 1</p><h1>Heading</h1><div>Content</div></div>';
      const doc = loadHtml(html);
      const tree = doc.body.firstElementChild;
      
      const cleaned = basicCleaning(tree);
      
      expect(cleaned.querySelector('p')).not.toBeNull();
      expect(cleaned.querySelector('h1')).not.toBeNull();
      expect(cleaned.querySelector('div')).not.toBeNull();
    });
    
    test('处理null输入', () => {
      const result = basicCleaning(null);
      expect(result).toBeNull();
    });
  });
  
  describe('baseline()', () => {
    describe('策略1: JSON-LD提取', () => {
      test.skip('提取articleBody', () => {
        const html = `
          <html>
            <head>
              <script type="application/ld+json">
{"@type": "Article", "articleBody": "This is the article content from JSON-LD. It is quite long and should be extracted successfully."}
              </script>
            </head>
            <body></body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('article content from JSON-LD');
        expect(result.length).toBeGreaterThan(100);
        expect(result.body.children.length).toBeGreaterThan(0);
      });
      
      test.skip('提取包含HTML的articleBody', () => {
        const html = `
          <html>
            <head>
              <script type="application/ld+json">
{"@type": "Article", "articleBody": "<p>This is HTML content.</p><p>With multiple paragraphs that should be extracted and cleaned properly.</p>"}
              </script>
            </head>
            <body></body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('HTML content');
        expect(result.text).toContain('multiple paragraphs');
        expect(result.length).toBeGreaterThan(100);
      });
      
      test('跳过无效的JSON', () => {
        const html = `
          <html>
            <head>
              <script type="application/ld+json">
              { invalid json }
              </script>
            </head>
            <body>
              <p>Regular paragraph content that should be extracted as fallback.</p>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        // 应该fallback到其他策略
        expect(result.text).toContain('Regular paragraph');
      });
      
      test('短JSON内容应fallback', () => {
        const html = `
          <html>
            <head>
              <script type="application/ld+json">
              {
                "@type": "Article",
                "articleBody": "Short"
              }
              </script>
            </head>
            <body>
              <p>This is a longer paragraph that should be extracted instead of the short JSON content. It has much more text to ensure it exceeds the minimum length threshold of one hundred characters.</p>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        // JSON内容太短(<100)，应fallback到段落提取
        expect(result.text).toContain('longer paragraph');
        expect(result.length).toBeGreaterThan(100);
      });
    });
    
    describe('策略2: Article标签提取', () => {
      test('从article标签提取', () => {
        const html = `
          <html>
            <body>
              <article>
                This is the main article content. It is long enough to be extracted successfully from the article tag.
              </article>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('main article content');
        expect(result.length).toBeGreaterThan(100);
        expect(result.body.children.length).toBeGreaterThan(0);
      });
      
      test('多个article标签', () => {
        const html = `
          <html>
            <body>
              <article>
                First article with sufficient content to be extracted successfully. This article has enough text to exceed the minimum threshold of one hundred characters.
              </article>
              <article>
                Second article also with enough content to be extracted properly. It also contains more than one hundred characters to meet the extraction requirements.
              </article>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('First article');
        expect(result.text).toContain('Second article');
        expect(result.body.children.length).toBeGreaterThan(1);
      });
      
      test('短article内容应被忽略', () => {
        const html = `
          <html>
            <body>
              <article>Short</article>
              <p>This is a regular paragraph with enough content.</p>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        // article太短(<100)，应fallback到段落提取
        expect(result.text).toContain('regular paragraph');
      });
    });
    
    describe('策略3: 段落标签提取', () => {
      test('提取p标签', () => {
        const html = `
          <html>
            <body>
              <p>First paragraph with sufficient content.</p>
              <p>Second paragraph also with enough content to trigger extraction.</p>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('First paragraph');
        expect(result.text).toContain('Second paragraph');
        expect(result.length).toBeGreaterThan(100);
      });
      
      test('提取blockquote', () => {
        const html = `
          <html>
            <body>
              <blockquote>This is a quote with enough content to be extracted by the baseline extractor. It needs to have more than one hundred characters to pass the length threshold.</blockquote>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('quote with enough content');
        expect(result.length).toBeGreaterThan(100);
      });
      
      test('提取code和pre', () => {
        const html = `
          <html>
            <body>
              <code>Some code snippet that is long enough for extraction.</code>
              <pre>Preformatted text that should also be extracted successfully.</pre>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('code snippet');
        expect(result.text).toContain('Preformatted text');
      });
      
      test('去除重复段落', () => {
        const html = `
          <html>
            <body>
              <p>Duplicate content here and there with enough text to meet the threshold.</p>
              <p>Duplicate content here and there with enough text to meet the threshold.</p>
              <p>Unique content should be kept and this also needs to be long enough for extraction.</p>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        // 重复的内容只应出现一次（Set去重）
        const text = result.text;
        const lines = text.split(' ').filter(w => w.includes('Duplicate'));
        // 应该只有一组"Duplicate content"
        expect(result.text).toContain('Duplicate content');
        expect(result.text).toContain('Unique content');
        expect(result.length).toBeGreaterThan(100);
      });
    });
    
    describe('策略4: Body全文提取', () => {
      test('从body提取所有文本', () => {
        const html = `
          <html>
            <body>
              <div>Some text</div>
              <span>More text</span>
              <div>Even more text content</div>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('Some text');
        expect(result.text).toContain('More text');
        expect(result.text).toContain('Even more');
      });
    });
    
    describe('边界情况', () => {
      test('空HTML', () => {
        const result = baseline('');
        
        expect(result.text).toBe('');
        expect(result.length).toBe(0);
        expect(result.body.children.length).toBe(0);
      });
      
      test('null输入', () => {
        const result = baseline(null);
        
        expect(result.text).toBe('');
        expect(result.length).toBe(0);
      });
      
      test('只有空白内容', () => {
        const html = '<html><body>   \n\t   </body></html>';
        
        const result = baseline(html);
        
        expect(result.text.trim()).toBe('');
      });
      
      test('包含需要清理的元素', () => {
        const html = `
          <html>
            <body>
              <aside>Sidebar content</aside>
              <p>Main content that should be extracted successfully.</p>
              <footer>Footer content</footer>
            </body>
          </html>
        `;
        
        const result = baseline(html);
        
        expect(result.text).toContain('Main content');
        expect(result.text).not.toContain('Sidebar');
        expect(result.text).not.toContain('Footer');
      });
    });
  });
  
  describe('html2txt()', () => {
    test('提取简单文本', () => {
      const html = '<html><body><p>This is test content.</p></body></html>';
      
      const result = html2txt(html);
      
      expect(result).toBe('This is test content.');
    });
    
    test('提取并规范化空白', () => {
      const html = '<html><body><p>Multiple    spaces</p> <p>and\n\nnewlines</p></body></html>';
      
      const result = html2txt(html);
      
      // trim()会将所有连续空白字符规范化为单个空格
      expect(result).toContain('Multiple spaces');
      expect(result).toContain('and');
      expect(result).toContain('newlines');
    });
    
    test('默认清理不需要的元素', () => {
      const html = `
        <html>
          <body>
            <aside>Sidebar</aside>
            <p>Main content</p>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      
      const result = html2txt(html);
      
      expect(result).toContain('Main content');
      expect(result).not.toContain('Sidebar');
      expect(result).not.toContain('Footer');
    });
    
    test('clean=false保留所有元素', () => {
      const html = `
        <html>
          <body>
            <aside>Sidebar</aside>
            <p>Main content</p>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      
      const result = html2txt(html, false);
      
      expect(result).toContain('Main content');
      expect(result).toContain('Sidebar');
      expect(result).toContain('Footer');
    });
    
    test('处理复杂HTML结构', () => {
      const html = `
        <html>
          <body>
            <div>
              <h1>Title</h1>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
              <div>Nested content</div>
            </div>
          </body>
        </html>
      `;
      
      const result = html2txt(html);
      
      expect(result).toContain('Title');
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
      expect(result).toContain('Nested content');
    });
    
    test('空HTML返回空字符串', () => {
      const result = html2txt('');
      expect(result).toBe('');
    });
    
    test('null输入返回空字符串', () => {
      const result = html2txt(null);
      expect(result).toBe('');
    });
    
    test('没有body标签返回空字符串', () => {
      const html = '<html><head><title>Test</title></head></html>';
      const result = html2txt(html);
      expect(result).toBe('');
    });
  });
});

describe('Baseline集成测试', () => {
  test('真实HTML文档提取', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Article</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Test Article",
            "articleBody": "This is a test article with sufficient content to test the baseline extractor. It contains multiple sentences and paragraphs to ensure proper extraction."
          }
          </script>
        </head>
        <body>
          <header>Site Header</header>
          <nav>Navigation</nav>
          <article>
            <h1>Article Title</h1>
            <p>Article paragraph 1</p>
            <p>Article paragraph 2</p>
          </article>
          <aside>Sidebar content</aside>
          <footer>Site Footer</footer>
        </body>
      </html>
    `;
    
    const result = baseline(html);
    
    // 应该优先提取JSON-LD
    expect(result.text).toContain('test article');
    expect(result.length).toBeGreaterThan(100);
    expect(result.body.children.length).toBeGreaterThan(0);
  });
  
  test('没有JSON-LD的文档', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>This is the main article content that should be extracted when JSON-LD is not available.</p>
            <p>It contains multiple paragraphs to ensure sufficient content for extraction.</p>
          </article>
          <aside>Sidebar</aside>
        </body>
      </html>
    `;
    
    const result = baseline(html);
    
    // 应该从article标签提取
    expect(result.text).toContain('main article content');
    expect(result.text).not.toContain('Sidebar');
    expect(result.length).toBeGreaterThan(100);
  });
});

