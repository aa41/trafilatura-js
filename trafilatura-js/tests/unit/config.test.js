/**
 * 配置系统单元测试
 */

import { Document, Extractor, useConfig, setDateParams } from '../../src/settings/config.js';

describe('config', () => {
  describe('Document', () => {
    test('should create empty document', () => {
      const doc = new Document();
      expect(doc.title).toBeNull();
      expect(doc.author).toBeNull();
      expect(doc.text).toBeNull();
      expect(doc.categories).toEqual([]);
      expect(doc.tags).toEqual([]);
    });

    test('should set properties from dict', () => {
      const doc = new Document();
      doc.fromDict({
        title: '测试标题',
        author: '测试作者',
        tags: ['tag1', 'tag2'],
      });

      expect(doc.title).toBe('测试标题');
      expect(doc.author).toBe('测试作者');
      expect(doc.tags).toEqual(['tag1', 'tag2']);
    });

    test('should convert to dict', () => {
      const doc = new Document();
      doc.title = '标题';
      doc.author = '作者';
      doc.text = '内容';

      const dict = doc.asDict();
      expect(dict.title).toBe('标题');
      expect(dict.author).toBe('作者');
      expect(dict.text).toBe('内容');
      expect(dict.body).toBeUndefined(); // 内部字段不导出
    });

    test('should clean and trim data', () => {
      const doc = new Document();
      doc.title = '  标题  ';
      doc.author = '  作者  ';
      doc.categories = ['cat1', '', '  ', 'cat2'];
      doc.tags = ['tag1', null, '', 'tag2'];

      doc.cleanAndTrim();

      expect(doc.title).toBe('标题');
      expect(doc.author).toBe('作者');
      expect(doc.categories).toEqual(['cat1', 'cat2']);
      expect(doc.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Extractor', () => {
    test('should create with default config', () => {
      const ext = new Extractor();
      expect(ext.fast).toBe(false);
      expect(ext.comments).toBe(true);
      expect(ext.tables).toBe(true);
      expect(ext.format).toBe('txt');
      expect(ext.focus).toBe('balanced');
    });

    test('should accept custom options', () => {
      const ext = new Extractor({
        fast: true,
        comments: false,
        format: 'json',
        includeImages: true,
      });

      expect(ext.fast).toBe(true);
      expect(ext.comments).toBe(false);
      expect(ext.format).toBe('json');
      expect(ext.images).toBe(true);
    });

    test('should set focus mode based on precision/recall', () => {
      const ext1 = new Extractor({ precision: true });
      expect(ext1.focus).toBe('precision');

      const ext2 = new Extractor({ recall: true });
      expect(ext2.focus).toBe('recall');

      const ext3 = new Extractor({ favorPrecision: true });
      expect(ext3.focus).toBe('precision');
    });

    test('should handle camelCase and snake_case options', () => {
      const ext = new Extractor({
        includeComments: true,
        includeTables: false,
        outputFormat: 'markdown',
        withMetadata: true,
      });

      expect(ext.comments).toBe(true);
      expect(ext.tables).toBe(false);
      expect(ext.format).toBe('markdown');
      expect(ext.with_metadata).toBe(true);
    });

    test('should initialize blacklists', () => {
      const ext = new Extractor({
        urlBlacklist: new Set(['http://spam.com']),
        authorBlacklist: new Set(['Spammer']),
      });

      expect(ext.url_blacklist.has('http://spam.com')).toBe(true);
      expect(ext.author_blacklist.has('Spammer')).toBe(true);
    });
  });

  describe('useConfig()', () => {
    test('should return default config when no arg', () => {
      const config = useConfig();
      expect(config.fast).toBe(false);
      expect(config.comments).toBe(true);
    });

    test('should merge with default config', () => {
      const config = useConfig({ fast: true, format: 'json' });
      expect(config.fast).toBe(true);
      expect(config.format).toBe('json');
      expect(config.comments).toBe(true); // 默认值
    });
  });

  describe('setDateParams()', () => {
    test('should create date params', () => {
      const params = setDateParams(true);
      expect(params.extensive_search).toBe(true);
      expect(params.original_date).toBe(true);
      expect(params.outputformat).toBe('%Y-%m-%d');
      expect(params.max_date).toBeTruthy();
    });

    test('should handle non-extensive mode', () => {
      const params = setDateParams(false);
      expect(params.extensive_search).toBe(false);
    });
  });
});

