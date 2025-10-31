/**
 * JSON-LD元数据提取 - 单元测试
 * 
 * 测试 src/metadata/json-ld.js 中的所有函数
 */

import {
  extractMetaJson,
  extractJson,
  normalizeJson
} from '../../src/metadata/json-ld.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('JSON-LD元数据提取', () => {
  
  // ============================================================================
  // normalizeJson() 测试
  // ============================================================================
  
  describe('normalizeJson()', () => {
    test('基础字符串标准化', () => {
      expect(normalizeJson('test string')).toBe('test string');
    });
    
    test('移除转义字符', () => {
      expect(normalizeJson('line1\\nline2\\r\\nline3\\t')).toBe('line1line2line3');
    });
    
    test('解码Unicode转义', () => {
      expect(normalizeJson('\\u4e2d\\u6587')).toBe('中文');
    });
    
    test('移除HTML标签', () => {
      expect(normalizeJson('<p>Text</p>')).toBe('Text');
      expect(normalizeJson('Text with <b>bold</b>')).toBe('Text with bold');
    });
    
    test('处理包含特殊字符的内容', () => {
      // 测试实际场景：带标签和HTML实体的混合内容
      const input = '<p>Title with content</p>';
      const result = normalizeJson(input);
      expect(result).toBe('Title with content');
      
      // 测试转义字符
      const input2 = 'Line1\\nLine2\\rLine3';
      const result2 = normalizeJson(input2);
      expect(result2).toBe('Line1Line2Line3');
    });
    
    test('清理多余空格', () => {
      expect(normalizeJson('  text  with   spaces  ')).toBe('text with spaces');
    });
    
    test('综合测试', () => {
      const input = '<p>Test\\nwith\\u4e2d\\u6587and&amp;entities</p>';
      const expected = 'Testwith中文and&entities';
      expect(normalizeJson(input)).toBe(expected);
    });
    
    test('空输入返回空字符串', () => {
      expect(normalizeJson('')).toBe('');
      expect(normalizeJson(null)).toBe('');
      expect(normalizeJson(undefined)).toBe('');
    });
  });
  
  // ============================================================================
  // extractJson() 测试
  // ============================================================================
  
  describe('extractJson()', () => {
    test('提取Article类型的基本信息', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: '文章标题',
        author: {
          '@type': 'Person',
          name: '张三'
        }
      };
      
      const metadata = { title: null, author: null };
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('文章标题');
      expect(result.author).toBe('张三');
    });
    
    test('提取多个作者', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: [
          { '@type': 'Person', name: '张三' },
          { '@type': 'Person', name: '李四' }
        ]
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toContain('张三');
      expect(result.author).toContain('李四');
    });
    
    test('从givenName和familyName组合作者名', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: {
          '@type': 'Person',
          givenName: 'John',
          familyName: 'Doe'
        }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toBe('John Doe');
    });
    
    test('提取NewsArticle类型', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: '新闻标题',
        author: { name: '记者' }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('新闻标题');
      expect(result.author).toBe('记者');
    });
    
    test('提取BlogPosting类型', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: '博客标题',
        author: { name: '博主' }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('博客标题');
      expect(result.author).toBe('博主');
    });
    
    test('提取分类信息', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        articleSection: '科技'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.categories).toEqual(['科技']);
    });
    
    test('提取多个分类', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        articleSection: ['科技', '新闻', '互联网']
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.categories).toEqual(['科技', '新闻', '互联网']);
    });
    
    test('提取出版商信息', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        publisher: {
          '@type': 'Organization',
          name: '新浪新闻'
        }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.sitename).toBe('新浪新闻');
    });
    
    test('提取Organization类型', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '公司名称'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.sitename).toBe('公司名称');
    });
    
    test('提取WebSite类型', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '网站名称'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.sitename).toBe('网站名称');
    });
    
    test('提取Person类型', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: '个人名称'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toBe('个人名称');
    });
    
    test('设置pagetype', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.pagetype).toBe('article');
    });
    
    test('处理@graph结构', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: '标题1'
          },
          {
            '@type': 'Organization',
            name: '组织名'
          }
        ]
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('标题1');
      expect(result.sitename).toBe('组织名');
    });
    
    test('处理数组格式的schema', () => {
      const schema = [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: '标题'
        }
      ];
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('标题');
    });
    
    test('处理作者名是数组的情况', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: {
          name: ['张三', '李四']
        }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toContain('张三');
      expect(result.author).toContain('李四');
    });
    
    test('处理作者名是嵌套对象的情况', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: {
          name: {
            name: '嵌套名称'
          }
        }
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toBe('嵌套名称');
    });
    
    test('处理作者是字符串的情况', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: '直接字符串作者'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toBe('直接字符串作者');
    });
    
    test('忽略HTTP开头的Person名称', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'https://example.com/author'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.author).toBeUndefined();
    });
    
    test('处理没有@context的schema', () => {
      const schema = {
        '@type': 'Article',
        headline: '无context'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      // 没有@context，不应该提取
      expect(result.title).toBeUndefined();
    });
    
    test('处理@type是数组的情况', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': ['Article', 'NewsArticle'],
        headline: '多类型标题'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('多类型标题');
    });
    
    test('Article优先使用headline而不是name', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        name: '名称',
        headline: '标题'
      };
      
      const metadata = {};
      const result = extractJson(schema, metadata);
      
      expect(result.title).toBe('标题');
    });
  });
  
  // ============================================================================
  // extractMetaJson() 测试
  // ============================================================================
  
  describe('extractMetaJson()', () => {
    test('从HTML中提取JSON-LD', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "测试标题",
              "author": {
                "@type": "Person",
                "name": "测试作者"
              }
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.title).toBe('测试标题');
      expect(result.author).toBe('测试作者');
    });
    
    test('处理多个JSON-LD script标签', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "文章标题"
            }
            </script>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "组织名"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.title).toBe('文章标题');
      expect(result.sitename).toBe('组织名');
    });
    
    test('处理无效的JSON（触发fallback）', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "标题",
              // 无效的注释
              "author": { invalid json }
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      // 应该通过正则表达式提取部分信息
      expect(result.pagetype).toBe('article');
    });
    
    test('忽略空的script标签', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json"></script>
            <script type="application/ld+json">   </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result).toEqual({});
    });
    
    test('处理application/settings+json类型', () => {
      const html = `
        <html>
          <head>
            <script type="application/settings+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "网站"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.sitename).toBe('网站');
    });
    
    test('空树返回原metadata', () => {
      const metadata = { title: '原始标题' };
      const result = extractMetaJson(null, metadata);
      
      expect(result).toEqual({ title: '原始标题' });
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('真实HTML - 完整的Article JSON-LD', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": "深度报道：AI技术的未来",
              "author": [
                {
                  "@type": "Person",
                  "givenName": "John",
                  "familyName": "Doe"
                },
                {
                  "@type": "Person",
                  "name": "Jane Smith"
                }
              ],
              "publisher": {
                "@type": "Organization",
                "name": "科技日报"
              },
              "articleSection": ["科技", "AI", "未来"],
              "datePublished": "2024-01-15"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.title).toBe('深度报道：AI技术的未来');
      expect(result.author).toContain('John Doe');
      expect(result.author).toContain('Jane Smith');
      expect(result.sitename).toBe('科技日报');
      expect(result.categories).toEqual(['科技', 'AI', '未来']);
      expect(result.pagetype).toBe('newsarticle');
    });
    
    test('真实HTML - @graph格式', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "示例网站"
                },
                {
                  "@type": "Article",
                  "headline": "示例文章",
                  "author": {
                    "name": "示例作者"
                  }
                }
              ]
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.sitename).toBe('示例网站');
      expect(result.title).toBe('示例文章');
      expect(result.author).toBe('示例作者');
    });
    
    test('真实HTML - 中文内容', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": "如何学习JavaScript",
              "author": {
                "@type": "Person",
                "name": "张三"
              },
              "publisher": {
                "@type": "Organization",
                "name": "技术博客"
              },
              "articleSection": "编程教程"
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.title).toBe('如何学习JavaScript');
      expect(result.author).toBe('张三');
      expect(result.sitename).toBe('技术博客');
      expect(result.categories).toEqual(['编程教程']);
    });
    
    test('真实HTML - 复杂嵌套结构', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "复杂文章",
              "author": {
                "@type": "Person",
                "name": {
                  "name": "嵌套作者"
                }
              },
              "publisher": {
                "@type": "Organization",
                "name": "出版社",
                "logo": {
                  "@type": "ImageObject",
                  "url": "logo.jpg"
                }
              }
            }
            </script>
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const metadata = {};
      const result = extractMetaJson(tree, metadata);
      
      expect(result.title).toBe('复杂文章');
      expect(result.author).toBe('嵌套作者');
      expect(result.sitename).toBe('出版社');
    });
  });
});

