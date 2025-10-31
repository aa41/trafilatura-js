/**
 * 配置类测试
 * 
 * 测试Extractor和Document类
 */

import { Extractor, Document, createExtractor, createDocument } from '../../src/settings/config.js';

describe('Extractor类', () => {
  describe('构造函数', () => {
    test('创建默认配置', () => {
      const extractor = new Extractor();
      
      expect(extractor.format).toBe('txt');
      expect(extractor.fast).toBe(false);
      expect(extractor.focus).toBe('balanced');
      expect(extractor.comments).toBe(true);
      expect(extractor.formatting).toBe(false);
      expect(extractor.links).toBe(false);
      expect(extractor.images).toBe(false);
      expect(extractor.tables).toBe(true);
      expect(extractor.dedup).toBe(false);
      expect(extractor.lang).toBeNull();
    });
    
    test('创建自定义配置', () => {
      const extractor = new Extractor({
        format: 'json',
        fast: true,
        precision: true,
        comments: false,
        formatting: true,
        links: true,
        images: true,
        tables: false
      });
      
      expect(extractor.format).toBe('json');
      expect(extractor.fast).toBe(true);
      expect(extractor.focus).toBe('precision');
      expect(extractor.comments).toBe(false);
      expect(extractor.formatting).toBe(true);
      expect(extractor.links).toBe(true);
      expect(extractor.images).toBe(true);
      expect(extractor.tables).toBe(false);
    });
    
    test('recall模式设置focus', () => {
      const extractor = new Extractor({ recall: true });
      expect(extractor.focus).toBe('recall');
    });
    
    test('precision模式设置focus', () => {
      const extractor = new Extractor({ precision: true });
      expect(extractor.focus).toBe('precision');
    });
    
    test('markdown格式自动启用formatting', () => {
      const extractor = new Extractor({ format: 'markdown' });
      expect(extractor.formatting).toBe(true);
    });
    
    test('设置URL和source', () => {
      const extractor = new Extractor({ 
        url: 'https://example.com' 
      });
      
      expect(extractor.url).toBe('https://example.com');
      expect(extractor.source).toBe('https://example.com');
    });
    
    test('source优先于url', () => {
      const extractor = new Extractor({ 
        url: 'https://example.com',
        source: 'custom-source'
      });
      
      expect(extractor.source).toBe('custom-source');
    });
  });
  
  describe('格式验证', () => {
    test('接受支持的格式', () => {
      const formats = ['txt', 'html', 'markdown', 'json', 'xml', 'xmltei'];
      
      for (const format of formats) {
        expect(() => new Extractor({ format })).not.toThrow();
      }
    });
    
    test('拒绝不支持的格式', () => {
      expect(() => new Extractor({ format: 'invalid' }))
        .toThrow(/Unsupported format/);
    });
  });
  
  describe('黑名单', () => {
    test('设置作者黑名单', () => {
      const blacklist = new Set(['spam-author', 'bot']);
      const extractor = new Extractor({ authorBlacklist: blacklist });
      
      expect(extractor.authorBlacklist).toBe(blacklist);
      expect(extractor.authorBlacklist.has('spam-author')).toBe(true);
    });
    
    test('设置URL黑名单', () => {
      const blacklist = new Set(['spam.com', 'ads.com']);
      const extractor = new Extractor({ urlBlacklist: blacklist });
      
      expect(extractor.urlBlacklist).toBe(blacklist);
      expect(extractor.urlBlacklist.has('spam.com')).toBe(true);
    });
  });
  
  describe('大小限制', () => {
    test('使用默认大小限制', () => {
      const extractor = new Extractor();
      
      expect(extractor.minExtractedSize).toBeGreaterThan(0);
      expect(extractor.maxFileSize).toBeGreaterThan(0);
    });
    
    test('自定义大小限制', () => {
      const extractor = new Extractor({
        minExtractedSize: 500,
        maxFileSize: 5000000
      });
      
      expect(extractor.minExtractedSize).toBe(500);
      expect(extractor.maxFileSize).toBe(5000000);
    });
  });
  
  describe('toObject()', () => {
    test('转换为对象', () => {
      const extractor = new Extractor({
        format: 'json',
        fast: true,
        links: true
      });
      
      const obj = extractor.toObject();
      
      expect(obj.format).toBe('json');
      expect(obj.fast).toBe(true);
      expect(obj.links).toBe(true);
      expect(obj).toHaveProperty('focus');
      expect(obj).toHaveProperty('comments');
    });
  });
});

describe('Document类', () => {
  describe('构造函数', () => {
    test('创建空文档', () => {
      const doc = new Document();
      
      expect(doc.title).toBeNull();
      expect(doc.author).toBeNull();
      expect(doc.url).toBeNull();
      expect(doc.text).toBeNull();
      expect(doc.body).toBeNull();
    });
    
    test('创建带数据的文档', () => {
      const doc = new Document({
        title: 'Test Title',
        author: 'Test Author',
        url: 'https://example.com',
        text: 'Test content'
      });
      
      expect(doc.title).toBe('Test Title');
      expect(doc.author).toBe('Test Author');
      expect(doc.url).toBe('https://example.com');
      expect(doc.text).toBe('Test content');
    });
    
    test('设置所有元数据字段', () => {
      const doc = new Document({
        title: 'Title',
        author: 'Author',
        url: 'https://example.com',
        hostname: 'example.com',
        description: 'Description',
        sitename: 'Site Name',
        date: '2025-10-30',
        categories: ['cat1', 'cat2'],
        tags: ['tag1', 'tag2'],
        language: 'en'
      });
      
      expect(doc.title).toBe('Title');
      expect(doc.hostname).toBe('example.com');
      expect(doc.description).toBe('Description');
      expect(doc.sitename).toBe('Site Name');
      expect(doc.date).toBe('2025-10-30');
      expect(doc.categories).toEqual(['cat1', 'cat2']);
      expect(doc.tags).toEqual(['tag1', 'tag2']);
      expect(doc.language).toBe('en');
    });
  });
  
  describe('fromDict()', () => {
    test('从对象创建文档', () => {
      const data = {
        title: 'Test Title',
        author: 'Test Author',
        url: 'https://example.com'
      };
      
      const doc = Document.fromDict(data);
      
      expect(doc.title).toBe('Test Title');
      expect(doc.author).toBe('Test Author');
      expect(doc.url).toBe('https://example.com');
    });
  });
  
  describe('cleanAndTrim()', () => {
    test('修剪多余空白', () => {
      const doc = new Document({
        title: '  Test   Title  ',
        author: 'Test\n\nAuthor',
        description: 'Test    description'
      });
      
      doc.cleanAndTrim();
      
      expect(doc.title).toBe('Test Title');
      expect(doc.author).toBe('Test Author');
      expect(doc.description).toBe('Test description');
    });
    
    test('限制长度', () => {
      const longText = 'a'.repeat(15000);
      const doc = new Document({
        title: longText
      });
      
      doc.cleanAndTrim();
      
      expect(doc.title.length).toBeLessThanOrEqual(10000);
      expect(doc.title.endsWith('…')).toBe(true);
    });
    
    test('处理HTML实体', () => {
      const doc = new Document({
        title: 'Test &amp; Title',
        author: 'Test &lt;Author&gt;'
      });
      
      doc.cleanAndTrim();
      
      expect(doc.title).toBe('Test & Title');
      expect(doc.author).toBe('Test <Author>');
    });
    
    test('清理数组字段', () => {
      const doc = new Document({
        categories: ['  cat1  ', 'cat2', '', '  '],
        tags: ['tag1  ', '  tag2']
      });
      
      doc.cleanAndTrim();
      
      expect(doc.categories).toEqual(['cat1', 'cat2']);
      expect(doc.tags).toEqual(['tag1', 'tag2']);
    });
    
    test('处理null和undefined', () => {
      const doc = new Document({
        title: null,
        author: undefined
      });
      
      expect(() => doc.cleanAndTrim()).not.toThrow();
    });
  });
  
  describe('asDict()', () => {
    test('转换为对象', () => {
      const doc = new Document({
        title: 'Test Title',
        author: 'Test Author',
        url: 'https://example.com'
      });
      
      const obj = doc.asDict();
      
      expect(obj.title).toBe('Test Title');
      expect(obj.author).toBe('Test Author');
      expect(obj.url).toBe('https://example.com');
      expect(obj).toHaveProperty('body');
      expect(obj).toHaveProperty('text');
    });
  });
  
  describe('toJSON()', () => {
    test('转换为JSON字符串', () => {
      const doc = new Document({
        title: 'Test Title',
        author: 'Test Author'
      });
      
      const json = doc.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.title).toBe('Test Title');
      expect(parsed.author).toBe('Test Author');
    });
    
    test('默认不包含body', () => {
      const doc = new Document({
        title: 'Test Title'
      });
      
      const json = doc.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed).not.toHaveProperty('body');
    });
    
    test('可选包含body', () => {
      const doc = new Document({
        title: 'Test Title'
      });
      
      const json = doc.toJSON(true);
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveProperty('body');
    });
  });
});

describe('工厂函数', () => {
  test('createExtractor()', () => {
    const extractor = createExtractor({ format: 'json' });
    
    expect(extractor).toBeInstanceOf(Extractor);
    expect(extractor.format).toBe('json');
  });
  
  test('createDocument()', () => {
    const doc = createDocument();
    
    expect(doc).toBeInstanceOf(Document);
    expect(doc.title).toBeNull();
  });
});

describe('边界情况', () => {
  test('Extractor处理空选项', () => {
    expect(() => new Extractor({})).not.toThrow();
    expect(() => new Extractor(null)).not.toThrow();
  });
  
  test('Document处理空数据', () => {
    expect(() => new Document({})).not.toThrow();
    expect(() => new Document(null)).not.toThrow();
  });
  
  test('处理特殊字符', () => {
    const doc = new Document({
      title: 'Test "Title" with \'quotes\'',
      author: 'Test <Author> with <tags>'
    });
    
    expect(doc.title).toContain('"');
    expect(doc.author).toContain('<');
  });
  
  test('处理Unicode字符', () => {
    const doc = new Document({
      title: '测试标题 🚀',
      author: 'тест автор'
    });
    
    expect(doc.title).toBe('测试标题 🚀');
    expect(doc.author).toBe('тест автор');
  });
});

