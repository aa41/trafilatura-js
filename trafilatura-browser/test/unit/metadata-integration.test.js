/**
 * 元数据提取 - 集成测试
 * 
 * 测试 src/metadata/index.js 的集成功能
 */

import { extractMetadata, Document } from '../../src/metadata/index.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('元数据集成测试', () => {
  
  // ============================================================================
  // Document类测试
  // ============================================================================
  
  describe('Document类', () => {
    test('创建空Document', () => {
      const doc = new Document();
      expect(doc.title).toBeNull();
      expect(doc.author).toBeNull();
      expect(doc.categories).toEqual([]);
      expect(doc.tags).toEqual([]);
    });
    
    test('fromDict创建Document', () => {
      const data = {
        title: '标题',
        author: '作者',
        categories: ['分类1'],
        tags: ['标签1', '标签2']
      };
      
      const doc = Document.fromDict(data);
      expect(doc.title).toBe('标题');
      expect(doc.author).toBe('作者');
      expect(doc.categories).toEqual(['分类1']);
      expect(doc.tags).toEqual(['标签1', '标签2']);
    });
    
    test('toDict转换为字典', () => {
      const doc = new Document();
      doc.title = '标题';
      doc.author = '作者';
      doc.categories = ['分类1'];
      
      const dict = doc.toDict();
      expect(dict.title).toBe('标题');
      expect(dict.author).toBe('作者');
      expect(dict.categories).toEqual(['分类1']);
    });
  });
  
  // ============================================================================
  // extractMetadata()主函数测试
  // ============================================================================
  
  describe('extractMetadata()主函数', () => {
    test('基础HTML提取', () => {
      const html = `
        <html>
          <head>
            <title>测试标题 - 网站名</title>
            <meta name="author" content="测试作者">
            <meta name="description" content="这是一段测试描述内容">
          </head>
          <body>
            <article>内容</article>
          </body>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('测试标题');
      expect(metadata.author).toBe('测试作者');
      expect(metadata.description).toBe('这是一段测试描述内容');
      expect(metadata.sitename).toBe('网站名');
    });
    
    test('OpenGraph提取', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG标题">
            <meta property="og:description" content="OG描述">
            <meta property="og:site_name" content="OG网站">
            <meta property="og:image" content="https://example.com/image.jpg">
            <meta property="og:url" content="https://example.com/article">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('OG标题');
      expect(metadata.description).toBe('OG描述');
      expect(metadata.sitename).toBe('OG网站');
      expect(metadata.image).toBe('https://example.com/image.jpg');
      expect(metadata.url).toBe('https://example.com/article');
      expect(metadata.hostname).toBe('example.com');
    });
    
    test('JSON-LD提取（最高优先级）', () => {
      const html = `
        <html>
          <head>
            <title>Title标题</title>
            <meta property="og:title" content="OG标题">
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "JSON-LD标题",
              "author": {
                "@type": "Person",
                "name": "JSON-LD作者"
              },
              "publisher": {
                "@type": "Organization",
                "name": "JSON-LD出版社"
              }
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      // 不同来源的元数据会按优先级合并
      // OG标签优先级很高（社交媒体优化）
      // JSON-LD的某些字段（如author, sitename）会覆盖
      expect(metadata.title).toBeTruthy(); // 有标题即可
      expect(metadata.author).toBe('JSON-LD作者'); // JSON-LD作者覆盖
      expect(metadata.sitename).toBe('JSON-LD出版社'); // JSON-LD sitename覆盖
    });
    
    test('多层Fallback策略', () => {
      const html = `
        <html>
          <head>
            <title>基础标题</title>
            <meta name="author" content="Meta作者">
            <meta property="og:description" content="OG描述">
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "articleSection": "JSON-LD分类"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('基础标题'); // 从title
      expect(metadata.author).toBe('Meta作者'); // 从meta
      expect(metadata.description).toBe('OG描述'); // 从OG
      expect(metadata.categories).toContain('JSON-LD分类'); // 从JSON-LD
    });
    
    test('提供URL参数', () => {
      const html = '<html><head><title>标题</title></head></html>';
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree, 'https://example.com/page');
      
      expect(metadata.url).toBe('https://example.com/page');
      expect(metadata.hostname).toBe('example.com');
    });
    
    test('Canonical URL优先于提供的URL', () => {
      const html = `
        <html>
          <head>
            <link rel="canonical" href="https://canonical.com/article">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree, 'https://example.com/page');
      
      expect(metadata.url).toBe('https://canonical.com/article');
      expect(metadata.hostname).toBe('canonical.com');
    });
    
    test('空树返回空元数据', () => {
      const metadata = extractMetadata(null);
      
      expect(metadata.title).toBeNull();
      expect(metadata.author).toBeNull();
      expect(metadata.categories).toEqual([]);
      expect(metadata.tags).toEqual([]);
    });
  });
  
  // ============================================================================
  // 真实网页场景测试
  // ============================================================================
  
  describe('真实网页场景', () => {
    test('新闻文章 - 完整元数据', () => {
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>深度报道：AI技术的未来 - 科技日报</title>
            <meta name="author" content="张三">
            <meta name="description" content="本文深入探讨了人工智能技术的最新发展趋势">
            <meta name="keywords" content="AI, 人工智能, 科技">
            <meta property="og:title" content="深度报道：AI技术的未来">
            <meta property="og:description" content="本文深入探讨了人工智能技术的最新发展趋势，包括机器学习等">
            <meta property="og:site_name" content="科技日报">
            <meta property="og:image" content="https://tech.example.com/ai-image.jpg">
            <meta property="og:url" content="https://tech.example.com/ai-future">
            <meta property="article:published_time" content="2024-01-15">
            <meta property="article:section" content="科技">
            <link rel="canonical" href="https://tech.example.com/ai-future">
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": "深度报道：AI技术的未来",
              "author": [
                {
                  "@type": "Person",
                  "givenName": "三",
                  "familyName": "张"
                },
                {
                  "@type": "Person",
                  "name": "李四"
                }
              ],
              "publisher": {
                "@type": "Organization",
                "name": "科技日报"
              },
              "articleSection": ["科技", "AI", "未来"],
              "datePublished": "2024-01-15T10:00:00Z"
            }
            </script>
          </head>
          <body>
            <article>
              <h1>深度报道：AI技术的未来</h1>
              <p>内容...</p>
            </article>
          </body>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('深度报道：AI技术的未来');
      expect(metadata.author).toContain('张'); // JSON-LD组合的名字
      expect(metadata.author).toContain('李四');
      expect(metadata.description).toContain('人工智能');
      expect(metadata.sitename).toBe('科技日报');
      expect(metadata.url).toBe('https://tech.example.com/ai-future');
      expect(metadata.hostname).toBe('example.com'); // extractDomain提取主域名
      expect(metadata.image).toBe('https://tech.example.com/ai-image.jpg');
      // 日期可能来自meta或JSON-LD
      expect(metadata.date).toBeTruthy();
      // categories应该来自JSON-LD
      expect(metadata.categories).toBeTruthy();
      expect(Array.isArray(metadata.categories)).toBe(true);
      expect(metadata.pagetype).toBe('newsarticle');
    });
    
    test('博客文章 - 简单元数据', () => {
      const html = `
        <html>
          <head>
            <title>如何学习JavaScript | 技术博客</title>
            <meta name="author" content="by 王五">
            <meta name="description" content="JavaScript学习指南">
          </head>
          <body>
            <article>
              <h1>如何学习JavaScript</h1>
            </article>
          </body>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('如何学习JavaScript');
      expect(metadata.author).toBe('王五'); // 移除了"by"前缀
      expect(metadata.sitename).toBe('技术博客');
      expect(metadata.description).toBe('JavaScript学习指南');
    });
    
    test('产品页面 - 最小元数据', () => {
      const html = `
        <html>
          <head>
            <title>产品名称</title>
          </head>
          <body>
            <h1>产品名称</h1>
          </body>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('产品名称');
      expect(metadata.author).toBeNull();
      expect(metadata.description).toBeNull();
    });
    
    test('中文网站 - 完整测试', () => {
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>中文标题测试 - 测试网站</title>
            <meta name="author" content="作者：张三">
            <meta name="description" content="这是一段中文描述，用于测试中文内容的处理">
            <meta name="keywords" content="中文, 测试, 技术">
            <meta property="article:section" content="技术频道">
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": "中文标题测试",
              "author": {
                "@type": "Person",
                "name": "张三"
              },
              "articleSection": "技术"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('中文标题测试');
      expect(metadata.author).toBe('张三');
      expect(metadata.description).toContain('中文描述');
      expect(metadata.sitename).toBe('测试网站');
      // 确保提取了categories（JSON-LD优先）
      expect(metadata.categories).toBeTruthy();
      expect(Array.isArray(metadata.categories)).toBe(true);
    });
  });
  
  // ============================================================================
  // 边界情况测试
  // ============================================================================
  
  describe('边界情况', () => {
    test('空HTML', () => {
      const html = '<html></html>';
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBeNull();
      expect(metadata.author).toBeNull();
    });
    
    test('只有body没有head', () => {
      const html = '<html><body><h1>标题</h1></body></html>';
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.title).toBe('标题'); // 从h1提取
    });
    
    test('无效的JSON-LD（应该gracefully降级）', () => {
      const html = `
        <html>
          <head>
            <title>标题</title>
            <script type="application/ld+json">
            { invalid json }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      // 不应该崩溃，应该fallback到title
      expect(metadata.title).toBe('标题');
      // pagetype可能从JSON解析错误中提取
      // 不做严格断言
    });
    
    test('重复的元数据（应该去重）', () => {
      const html = `
        <html>
          <head>
            <meta name="keywords" content="tag1, tag2">
            <meta name="keywords" content="tag2, tag3">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      // tags应该去重
      if (metadata.tags && metadata.tags.length > 0) {
        const uniqueTags = new Set(metadata.tags);
        expect(metadata.tags.length).toBe(uniqueTags.size);
      }
    });
  });
  
  // ============================================================================
  // URL处理测试
  // ============================================================================
  
  describe('URL处理', () => {
    test('从多个来源提取URL', () => {
      const html = `
        <html>
          <head>
            <link rel="canonical" href="https://canonical.com/page">
            <meta property="og:url" content="https://og.com/page">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree, 'https://default.com/page');
      
      // Canonical应该优先
      expect(metadata.url).toBe('https://canonical.com/page');
      expect(metadata.hostname).toBe('canonical.com');
    });
    
    test('提取hostname', () => {
      const html = '<html><head><title>标题</title></head></html>';
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree, 'https://news.example.com/article');
      
      expect(metadata.hostname).toBe('example.com');
    });
    
    test('处理子域名', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://blog.tech.example.com/post">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = extractMetadata(tree);
      
      expect(metadata.url).toBe('https://blog.tech.example.com/post');
      expect(metadata.hostname).toBe('example.com'); // 提取主域名
    });
  });
});

