/**
 * Meta标签提取 - 单元测试
 * 
 * 测试 src/metadata/meta.js 中的所有函数
 */

import {
  examineMeta,
  extractOpenGraph,
  normalizeAuthors,
  normalizeTags,
  mergeMetadata
} from '../../src/metadata/meta.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('Meta标签提取', () => {
  
  // ============================================================================
  // normalizeTags() 测试
  // ============================================================================
  
  describe('normalizeTags()', () => {
    test('基础标签标准化', () => {
      expect(normalizeTags('tag1, tag2, tag3')).toBe('tag1, tag2, tag3');
    });
    
    test('移除多余空格', () => {
      expect(normalizeTags('tag1,  tag2,   tag3')).toBe('tag1, tag2, tag3');
    });
    
    test('移除空标签', () => {
      expect(normalizeTags('tag1, , tag2,, tag3')).toBe('tag1, tag2, tag3');
    });
    
    test('去重标签', () => {
      expect(normalizeTags('tag1, tag2, tag1, tag3')).toBe('tag1, tag2, tag3');
    });
    
    test('处理中文标签', () => {
      expect(normalizeTags('科技, 新闻, 技术')).toBe('科技, 新闻, 技术');
    });
    
    test('处理混合标签', () => {
      expect(normalizeTags('tech, 科技, AI, 人工智能')).toBe('tech, 科技, AI, 人工智能');
    });
    
    test('空输入返回空字符串', () => {
      expect(normalizeTags('')).toBe('');
      expect(normalizeTags(null)).toBe('');
      expect(normalizeTags(undefined)).toBe('');
    });
    
    test('移除特殊字符', () => {
      expect(normalizeTags('tag1!, @tag2, #tag3')).toBe('tag1, tag2, tag3');
    });
    
    test('保留连字符', () => {
      expect(normalizeTags('machine-learning, deep-learning')).toBe('machine-learning, deep-learning');
    });
  });
  
  // ============================================================================
  // normalizeAuthors() 测试
  // ============================================================================
  
  describe('normalizeAuthors()', () => {
    test('首次添加作者', () => {
      expect(normalizeAuthors(null, 'John Doe')).toBe('John Doe');
    });
    
    test('移除"by"前缀', () => {
      expect(normalizeAuthors(null, 'by John Doe')).toBe('John Doe');
    });
    
    test('移除"作者："前缀', () => {
      expect(normalizeAuthors(null, '作者：张三')).toBe('张三');
    });
    
    test('移除"written by"前缀', () => {
      expect(normalizeAuthors(null, 'written by Jane Smith')).toBe('Jane Smith');
    });
    
    test('合并不同作者', () => {
      const result = normalizeAuthors('John Doe', 'Jane Smith');
      expect(result).toContain('John Doe');
      expect(result).toContain('Jane Smith');
      expect(result).toContain(';');
    });
    
    test('避免重复作者', () => {
      expect(normalizeAuthors('John Doe', 'John Doe')).toBe('John Doe');
    });
    
    test('部分匹配不重复', () => {
      expect(normalizeAuthors('John', 'John Doe')).toBe('John Doe');
    });
    
    test('选择更长的作者名', () => {
      const result = normalizeAuthors('John', 'John Doe Smith');
      expect(result).toBe('John Doe Smith');
    });
    
    test('过滤黑名单作者', () => {
      const blacklist = new Set(['admin', 'anonymous']);
      expect(normalizeAuthors(null, 'admin', blacklist)).toBeNull();
    });
    
    test('过滤纯数字', () => {
      expect(normalizeAuthors(null, '12345')).toBeNull();
    });
    
    test('过滤过短的名字', () => {
      expect(normalizeAuthors(null, 'a')).toBeNull();
    });
    
    test('处理分号分隔的多作者', () => {
      const result = normalizeAuthors('John Doe', 'Jane; Bob');
      expect(result).toContain('John Doe');
      expect(result).toContain('Jane');
      expect(result).toContain('Bob');
    });
  });
  
  // ============================================================================
  // extractOpenGraph() 测试
  // ============================================================================
  
  describe('extractOpenGraph()', () => {
    test('提取基础OG标签', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG标题">
            <meta property="og:description" content="OG描述">
            <meta property="og:url" content="https://example.com">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.title).toBe('OG标题');
      expect(og.description).toBe('OG描述');
      expect(og.url).toBe('https://example.com');
    });
    
    test('提取OG图片', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.image).toBe('https://example.com/image.jpg');
    });
    
    test('提取OG网站名', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Example Site">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.sitename).toBe('Example Site');
    });
    
    test('提取OG作者', () => {
      const html = `
        <html>
          <head>
            <meta property="og:author" content="John Doe">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.author).toBe('John Doe');
    });
    
    test('提取OG类型', () => {
      const html = `
        <html>
          <head>
            <meta property="og:type" content="article">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.pagetype).toBe('article');
    });
    
    test('忽略空内容', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="">
            <meta property="og:description" content="  ">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.title).toBeNull();
      expect(og.description).toBeNull();
    });
    
    test('处理多个图片（保留第一个）', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image1.jpg">
            <meta property="og:image:url" content="https://example.com/image2.jpg">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.image).toBe('https://example.com/image1.jpg');
    });
    
    test('验证URL格式', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="/relative/path">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const og = extractOpenGraph(tree);
      
      expect(og.url).toBeNull(); // 不是完整URL
    });
    
    test('空树返回空对象', () => {
      const og = extractOpenGraph(null);
      expect(og).toEqual({});
    });
  });
  
  // ============================================================================
  // examineMeta() 测试
  // ============================================================================
  
  describe('examineMeta()', () => {
    test('提取基础meta标签', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="测试标题">
            <meta name="author" content="张三">
            <meta name="description" content="测试描述">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.title).toBe('测试标题');
      expect(meta.author).toBe('张三');
      expect(meta.description).toBe('测试描述');
    });
    
    test('提取关键词标签', () => {
      const html = `
        <html>
          <head>
            <meta name="keywords" content="tag1, tag2, tag3">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
    
    test('提取多个标签源并合并', () => {
      const html = `
        <html>
          <head>
            <meta name="keywords" content="tag1, tag2">
            <meta name="tags" content="tag3, tag4">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.tags).toEqual(expect.arrayContaining(['tag1', 'tag2', 'tag3', 'tag4']));
    });
    
    test('提取分类信息', () => {
      const html = `
        <html>
          <head>
            <meta property="article:section" content="技术">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.categories).toContain('技术');
    });
    
    test('提取日期信息', () => {
      const html = `
        <html>
          <head>
            <meta property="article:published_time" content="2024-01-01">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.date).toBe('2024-01-01');
    });
    
    test('提取图片', () => {
      const html = `
        <html>
          <head>
            <meta name="image" content="https://example.com/image.jpg">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.image).toBe('https://example.com/image.jpg');
    });
    
    test('提取网站名', () => {
      const html = `
        <html>
          <head>
            <meta name="application-name" content="测试网站">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.sitename).toBe('测试网站');
    });
    
    test('处理itemprop属性', () => {
      const html = `
        <html>
          <head>
            <meta itemprop="author" content="李四">
            <meta itemprop="headline" content="新闻标题">
            <meta itemprop="description" content="新闻描述">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.author).toBe('李四');
      expect(meta.title).toBe('新闻标题');
      expect(meta.description).toBe('新闻描述');
    });
    
    test('选择最长的标题', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="短标题">
            <meta property="og:title" content="这是一个更长的标题">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.title).toBe('这是一个更长的标题');
    });
    
    test('选择最长的描述', () => {
      const html = `
        <html>
          <head>
            <meta name="description" content="短描述">
            <meta property="og:description" content="这是一个更长更详细的描述内容">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.description).toBe('这是一个更长更详细的描述内容');
    });
    
    test('合并多个作者', () => {
      const html = `
        <html>
          <head>
            <meta name="author" content="张三">
            <meta property="article:author" content="李四">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.author).toContain('张三');
      expect(meta.author).toContain('李四');
    });
    
    test('忽略空内容的meta标签', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="">
            <meta name="author" content="  ">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.title).toBeNull();
      expect(meta.author).toBeNull();
    });
    
    test('处理Twitter标签', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:title" content="Twitter标题">
            <meta name="twitter:description" content="Twitter描述">
            <meta name="twitter:image" content="https://example.com/twitter.jpg">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.title).toBe('Twitter标题');
      expect(meta.description).toBe('Twitter描述');
      expect(meta.image).toBe('https://example.com/twitter.jpg');
    });
    
    test('去重分类', () => {
      const html = `
        <html>
          <head>
            <meta name="category" content="技术">
            <meta name="category" content="技术">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.categories.length).toBe(1);
      expect(meta.categories[0]).toBe('技术');
    });
    
    test('空树返回空对象', () => {
      const meta = examineMeta(null);
      expect(meta).toEqual({});
    });
  });
  
  // ============================================================================
  // mergeMetadata() 测试
  // ============================================================================
  
  describe('mergeMetadata()', () => {
    test('合并两个元数据源', () => {
      const source1 = {
        title: '标题1',
        author: '作者1',
        description: '描述1'
      };
      const source2 = {
        url: 'https://example.com',
        sitename: '网站名',
        date: '2024-01-01'
      };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.title).toBe('标题1');
      expect(merged.author).toBe('作者1');
      expect(merged.description).toBe('描述1');
      expect(merged.url).toBe('https://example.com');
      expect(merged.sitename).toBe('网站名');
      expect(merged.date).toBe('2024-01-01');
    });
    
    test('优先使用第一个源的值', () => {
      const source1 = { title: '标题1' };
      const source2 = { title: '标题2' };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.title).toBe('标题1');
    });
    
    test('选择最长的描述', () => {
      const source1 = { description: '短' };
      const source2 = { description: '这是一个更长的描述' };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.description).toBe('这是一个更长的描述');
    });
    
    test('合并作者', () => {
      const source1 = { author: '张三' };
      const source2 = { author: '李四' };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.author).toContain('张三');
      expect(merged.author).toContain('李四');
    });
    
    test('合并标签数组', () => {
      const source1 = { tags: ['tag1', 'tag2'] };
      const source2 = { tags: ['tag3', 'tag4'] };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.tags).toEqual(expect.arrayContaining(['tag1', 'tag2', 'tag3', 'tag4']));
    });
    
    test('去重标签', () => {
      const source1 = { tags: ['tag1', 'tag2'] };
      const source2 = { tags: ['tag2', 'tag3'] };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
    
    test('合并分类数组', () => {
      const source1 = { categories: ['分类1'] };
      const source2 = { categories: ['分类2'] };
      
      const merged = mergeMetadata(source1, source2);
      
      expect(merged.categories).toEqual(expect.arrayContaining(['分类1', '分类2']));
    });
    
    test('处理null源', () => {
      const source1 = { title: '标题' };
      
      const merged = mergeMetadata(source1, null, undefined);
      
      expect(merged.title).toBe('标题');
    });
    
    test('合并多个源', () => {
      const source1 = { title: '标题' };
      const source2 = { author: '作者' };
      const source3 = { url: 'https://example.com' };
      
      const merged = mergeMetadata(source1, source2, source3);
      
      expect(merged.title).toBe('标题');
      expect(merged.author).toBe('作者');
      expect(merged.url).toBe('https://example.com');
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('真实HTML - 完整元数据提取', () => {
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta property="og:title" content="深度学习入门">
            <meta property="og:description" content="本文介绍深度学习的基础知识">
            <meta property="og:site_name" content="AI技术博客">
            <meta property="og:url" content="https://ai-blog.com/article">
            <meta property="og:image" content="https://ai-blog.com/image.jpg">
            <meta property="og:type" content="article">
            <meta name="author" content="by 张三">
            <meta name="keywords" content="AI, 深度学习, 机器学习">
            <meta property="article:published_time" content="2024-01-15">
            <meta property="article:section" content="技术">
            <meta name="twitter:creator" content="@ai_expert">
            <title>深度学习入门 - AI技术博客</title>
          </head>
          <body>
            <article>内容</article>
          </body>
        </html>
      `;
      
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.title).toBe('深度学习入门');
      expect(meta.author).toContain('张三');
      expect(meta.description).toBe('本文介绍深度学习的基础知识');
      expect(meta.sitename).toBe('AI技术博客');
      expect(meta.date).toBe('2024-01-15');
      expect(meta.tags).toEqual(expect.arrayContaining(['AI', '深度学习', '机器学习']));
      expect(meta.categories).toContain('技术');
      expect(meta.image).toBe('https://ai-blog.com/image.jpg');
    });
    
    test('真实HTML - OpenGraph优先级', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="普通标题">
            <meta property="og:title" content="OpenGraph标题">
            <meta name="description" content="普通描述">
            <meta property="og:description" content="OpenGraph描述">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      
      // 分别测试
      const og = extractOpenGraph(tree);
      expect(og.title).toBe('OpenGraph标题');
      
      const meta = examineMeta(tree);
      // examineMeta选择更长的
      expect(meta.title).toBe('OpenGraph标题');
    });
    
    test('真实HTML - 中文内容', () => {
      const html = `
        <html>
          <head>
            <meta name="author" content="作者：李四">
            <meta name="keywords" content="科技, 新闻, 互联网">
            <meta property="article:section" content="科技频道">
            <meta name="description" content="这是一篇关于科技的文章">
          </head>
        </html>
      `;
      
      const tree = loadHtml(html);
      const meta = examineMeta(tree);
      
      expect(meta.author).toBe('李四');
      expect(meta.tags).toEqual(['科技', '新闻', '互联网']);
      expect(meta.categories).toContain('科技频道');
      expect(meta.description).toBe('这是一篇关于科技的文章');
    });
  });
});

