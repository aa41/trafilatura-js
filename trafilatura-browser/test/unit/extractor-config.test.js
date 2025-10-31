/**
 * Extractor配置 - 单元测试
 * 
 * 测试 src/settings/extractor.js 中的所有类和函数
 */

import {
  Extractor,
  Document,
  validateConfig,
  SUPPORTED_FORMATS,
  SUPPORTED_FMT_CLI
} from '../../src/settings/extractor.js';

describe('Extractor配置', () => {
  
  // ============================================================================
  // Extractor类测试
  // ============================================================================
  
  describe('Extractor类', () => {
    test('默认配置', () => {
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
      expect(extractor.with_metadata).toBe(false);
    });
    
    test('自定义格式', () => {
      const extractor = new Extractor({ format: 'json' });
      expect(extractor.format).toBe('json');
    });
    
    test('output_format别名', () => {
      const extractor = new Extractor({ output_format: 'markdown' });
      expect(extractor.format).toBe('markdown');
    });
    
    test('Markdown格式自动启用formatting', () => {
      const extractor = new Extractor({ format: 'markdown' });
      expect(extractor.formatting).toBe(true);
    });
    
    test('precision模式', () => {
      const extractor = new Extractor({ precision: true });
      expect(extractor.focus).toBe('precision');
    });
    
    test('recall模式', () => {
      const extractor = new Extractor({ recall: true });
      expect(extractor.focus).toBe('recall');
    });
    
    test('precision和recall同时设置', () => {
      const extractor = new Extractor({ precision: true, recall: true });
      expect(extractor.focus).toBe('balanced');
    });
    
    test('自定义布尔选项', () => {
      const extractor = new Extractor({
        fast: true,
        comments: false,
        formatting: true,
        links: true,
        images: true,
        tables: false,
        dedup: true
      });
      
      expect(extractor.fast).toBe(true);
      expect(extractor.comments).toBe(false);
      expect(extractor.formatting).toBe(true);
      expect(extractor.links).toBe(true);
      expect(extractor.images).toBe(true);
      expect(extractor.tables).toBe(false);
      expect(extractor.dedup).toBe(true);
    });
    
    test('自定义数字选项', () => {
      const extractor = new Extractor({
        min_extracted_size: 100,
        min_output_size: 20,
        max_file_size: 10000000
      });
      
      expect(extractor.min_extracted_size).toBe(100);
      expect(extractor.min_output_size).toBe(20);
      expect(extractor.max_file_size).toBe(10000000);
    });
    
    test('设置source和url', () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        source: 'test-source'
      });
      
      expect(extractor.url).toBe('https://example.com');
      expect(extractor.source).toBe('https://example.com');
    });
    
    test('设置语言', () => {
      const extractor = new Extractor({ lang: 'zh' });
      expect(extractor.lang).toBe('zh');
    });
    
    test('设置黑名单', () => {
      const extractor = new Extractor({
        author_blacklist: new Set(['spam', 'bot']),
        url_blacklist: new Set(['http://spam.com'])
      });
      
      expect(extractor.author_blacklist.has('spam')).toBe(true);
      expect(extractor.url_blacklist.has('http://spam.com')).toBe(true);
    });
    
    test('URL黑名单自动启用with_metadata', () => {
      const extractor = new Extractor({
        url_blacklist: new Set(['http://spam.com'])
      });
      
      expect(extractor.with_metadata).toBe(true);
    });
    
    test('only_with_metadata自动启用with_metadata', () => {
      const extractor = new Extractor({
        only_with_metadata: true
      });
      
      expect(extractor.with_metadata).toBe(true);
    });
    
    test('TEI格式自动启用with_metadata', () => {
      const extractor = new Extractor({ format: 'xmltei' });
      expect(extractor.with_metadata).toBe(true);
    });
    
    test('日期参数默认值', () => {
      const extractor = new Extractor();
      
      expect(extractor.date_params).toBeTruthy();
      expect(extractor.date_params.original_date).toBe(true);
      expect(extractor.date_params.extensive_search).toBe(true);
      expect(extractor.date_params.max_date).toBeTruthy();
    });
    
    test('自定义日期参数', () => {
      const extractor = new Extractor({
        date_params: {
          original_date: false,
          extensive_search: false,
          max_date: '2023-12-31'
        }
      });
      
      expect(extractor.date_params.original_date).toBe(false);
      expect(extractor.date_params.extensive_search).toBe(false);
      expect(extractor.date_params.max_date).toBe('2023-12-31');
    });
    
    test('无效格式抛出错误', () => {
      expect(() => {
        new Extractor({ format: 'invalid' });
      }).toThrow();
    });
  });
  
  // ============================================================================
  // Document类测试
  // ============================================================================
  
  describe('Document类', () => {
    test('默认构造', () => {
      const doc = new Document();
      
      expect(doc.title).toBeNull();
      expect(doc.author).toBeNull();
      expect(doc.url).toBeNull();
      expect(doc.body).toBeNull();
    });
    
    test('带选项构造', () => {
      const doc = new Document({
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com'
      });
      
      expect(doc.title).toBe('测试标题');
      expect(doc.author).toBe('测试作者');
      expect(doc.url).toBe('https://example.com');
    });
    
    test('fromDict静态方法', () => {
      const doc = Document.fromDict({
        title: '标题',
        author: '作者',
        description: '描述'
      });
      
      expect(doc.title).toBe('标题');
      expect(doc.author).toBe('作者');
      expect(doc.description).toBe('描述');
    });
    
    test('toDict方法', () => {
      const doc = new Document({
        title: '标题',
        author: '作者',
        url: 'https://example.com'
      });
      
      const dict = doc.toDict();
      
      expect(dict.title).toBe('标题');
      expect(dict.author).toBe('作者');
      expect(dict.url).toBe('https://example.com');
    });
    
    test('cleanAndTrim - 长度限制', () => {
      const longText = 'a'.repeat(11000);
      const doc = new Document({
        title: longText
      });
      
      doc.cleanAndTrim();
      
      expect(doc.title.length).toBe(10000);
      expect(doc.title.endsWith('…')).toBe(true);
    });
    
    test('cleanAndTrim - 空白修剪', () => {
      const doc = new Document({
        title: '  测试  标题  ',
        description: 'Line1\n\nLine2   Line3'
      });
      
      doc.cleanAndTrim();
      
      expect(doc.title).toBe('测试 标题');
      expect(doc.description).toBe('Line1 Line2 Line3');
    });
    
    test('所有元数据字段', () => {
      const doc = new Document({
        title: '标题',
        author: '作者',
        url: 'https://example.com',
        hostname: 'example.com',
        description: '描述',
        sitename: '网站',
        date: '2023-01-01',
        categories: ['分类1', '分类2'],
        tags: ['标签1', '标签2'],
        fingerprint: 'abc123',
        id: 'test-123',
        license: 'MIT',
        language: 'zh',
        image: 'https://example.com/image.jpg',
        pagetype: 'article'
      });
      
      expect(doc.title).toBe('标题');
      expect(doc.author).toBe('作者');
      expect(doc.url).toBe('https://example.com');
      expect(doc.categories).toEqual(['分类1', '分类2']);
      expect(doc.tags).toEqual(['标签1', '标签2']);
    });
  });
  
  // ============================================================================
  // validateConfig函数测试
  // ============================================================================
  
  describe('validateConfig()', () => {
    test('空选项', () => {
      expect(validateConfig()).toBe(true);
      expect(validateConfig(null)).toBe(true);
      expect(validateConfig({})).toBe(true);
    });
    
    test('有效格式', () => {
      expect(validateConfig({ format: 'txt' })).toBe(true);
      expect(validateConfig({ format: 'json' })).toBe(true);
      expect(validateConfig({ format: 'markdown' })).toBe(true);
    });
    
    test('无效格式', () => {
      expect(validateConfig({ format: 'invalid' })).toBe(false);
    });
    
    test('有效数字选项', () => {
      expect(validateConfig({ min_extracted_size: 100 })).toBe(true);
      expect(validateConfig({ max_file_size: 10000 })).toBe(true);
    });
    
    test('无效数字选项', () => {
      expect(validateConfig({ min_extracted_size: -1 })).toBe(false);
      expect(validateConfig({ max_file_size: 'invalid' })).toBe(false);
    });
  });
  
  // ============================================================================
  // 常量测试
  // ============================================================================
  
  describe('常量', () => {
    test('SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toBeInstanceOf(Set);
      expect(SUPPORTED_FORMATS.has('txt')).toBe(true);
      expect(SUPPORTED_FORMATS.has('json')).toBe(true);
      expect(SUPPORTED_FORMATS.has('markdown')).toBe(true);
      expect(SUPPORTED_FORMATS.has('xml')).toBe(true);
    });
    
    test('SUPPORTED_FMT_CLI', () => {
      expect(Array.isArray(SUPPORTED_FMT_CLI)).toBe(true);
      expect(SUPPORTED_FMT_CLI).toContain('txt');
      expect(SUPPORTED_FMT_CLI).toContain('json');
      expect(SUPPORTED_FMT_CLI).toContain('markdown');
    });
  });
});

