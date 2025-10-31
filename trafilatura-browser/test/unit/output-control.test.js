/**
 * 输出格式控制 - 单元测试
 * 
 * 测试 src/core/output-control.js 中的所有函数
 */

import {
  determineReturnString,
  buildMetadataHeader,
  normalizeUnicode
} from '../../src/core/output-control.js';
import { Document } from '../../src/settings/extractor.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('输出格式控制', () => {
  
  // ============================================================================
  // normalizeUnicode()测试
  // ============================================================================
  
  describe('normalizeUnicode()', () => {
    test('NFC标准化（默认）', () => {
      const str = 'café'; // 可能有不同的Unicode表示
      const result = normalizeUnicode(str);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    test('NFD标准化', () => {
      const str = 'café';
      const result = normalizeUnicode(str, 'NFD');
      expect(result).toBeTruthy();
    });
    
    test('NFKC标准化', () => {
      const str = 'ﬁ'; // 连字
      const result = normalizeUnicode(str, 'NFKC');
      expect(result).toBeTruthy();
    });
    
    test('空字符串', () => {
      expect(normalizeUnicode('')).toBe('');
      expect(normalizeUnicode(null)).toBe(null);
      expect(normalizeUnicode(undefined)).toBe(undefined);
    });
    
    test('中文字符', () => {
      const str = '测试文本';
      const result = normalizeUnicode(str);
      expect(result).toBe('测试文本');
    });
  });
  
  // ============================================================================
  // buildMetadataHeader()测试
  // ============================================================================
  
  describe('buildMetadataHeader()', () => {
    test('完整元数据', () => {
      const doc = new Document({
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com',
        hostname: 'example.com',
        description: '测试描述',
        sitename: '测试网站',
        date: '2023-01-01',
        categories: ['分类1', '分类2'],
        tags: ['标签1', '标签2'],
        fingerprint: 'abc123',
        id: 'test-123',
        license: 'MIT'
      });
      
      const header = buildMetadataHeader(doc);
      
      expect(header).toContain('---\n');
      expect(header).toContain('title: 测试标题');
      expect(header).toContain('author: 测试作者');
      expect(header).toContain('url: https://example.com');
      expect(header).toContain('hostname: example.com');
      expect(header).toContain('description: 测试描述');
      expect(header).toContain('sitename: 测试网站');
      expect(header).toContain('date: 2023-01-01');
      expect(header).toContain('categories: 分类1; 分类2');
      expect(header).toContain('tags: 标签1; 标签2');
      expect(header).toContain('fingerprint: abc123');
      expect(header).toContain('id: test-123');
      expect(header).toContain('license: MIT');
      expect(header.endsWith('---\n')).toBe(true);
    });
    
    test('部分元数据', () => {
      const doc = new Document({
        title: '标题',
        author: '作者'
      });
      
      const header = buildMetadataHeader(doc);
      
      expect(header).toContain('title: 标题');
      expect(header).toContain('author: 作者');
      expect(header).not.toContain('url:');
      expect(header).not.toContain('description:');
    });
    
    test('空元数据', () => {
      const doc = new Document();
      const header = buildMetadataHeader(doc);
      
      expect(header).toBe('---\n---\n');
    });
    
    test('null文档', () => {
      const header = buildMetadataHeader(null);
      expect(header).toBe('');
    });
    
    test('数组字段格式', () => {
      const doc = new Document({
        categories: ['Cat1', 'Cat2', 'Cat3'],
        tags: ['Tag1']
      });
      
      const header = buildMetadataHeader(doc);
      
      expect(header).toContain('categories: Cat1; Cat2; Cat3');
      expect(header).toContain('tags: Tag1');
    });
    
    test('空数组不输出', () => {
      const doc = new Document({
        title: '标题',
        categories: [],
        tags: []
      });
      
      const header = buildMetadataHeader(doc);
      
      expect(header).toContain('title: 标题');
      expect(header).not.toContain('categories:');
      expect(header).not.toContain('tags:');
    });
  });
  
  // ============================================================================
  // determineReturnString()测试
  // ============================================================================
  
  describe('determineReturnString()', () => {
    
    // 创建测试文档
    function createTestDocument() {
      const html = `
        <div>
          <p>第一段内容。</p>
          <p>第二段内容。</p>
        </div>
      `;
      
      const body = loadHtml(html);
      
      return new Document({
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com',
        date: '2023-01-01',
        body: body
      });
    }
    
    // ------------------------------------------------------------------------
    // TXT格式
    // ------------------------------------------------------------------------
    
    test('TXT格式 - 不带元数据', () => {
      const doc = createTestDocument();
      const result = determineReturnString(doc, {
        format: 'txt',
        with_metadata: false,
        formatting: false
      });
      
      expect(result).toContain('第一段内容');
      expect(result).toContain('第二段内容');
      expect(result).not.toContain('---');
      expect(result).not.toContain('title:');
    });
    
    test('TXT格式 - 带元数据', () => {
      const doc = createTestDocument();
      const result = determineReturnString(doc, {
        format: 'txt',
        with_metadata: true,
        formatting: false
      });
      
      expect(result).toContain('---');
      expect(result).toContain('title: 测试标题');
      expect(result).toContain('author: 测试作者');
      expect(result).toContain('第一段内容');
    });
    
    // ------------------------------------------------------------------------
    // Markdown格式
    // ------------------------------------------------------------------------
    
    test('Markdown格式', () => {
      const body = document.createElement('div');
      
      const head = document.createElement('head');
      head.setAttribute('rend', 'h1');
      head.textContent = '标题';
      
      const p = document.createElement('p');
      p.textContent = '段落内容';
      
      body.appendChild(head);
      body.appendChild(p);
      
      const doc = new Document({
        title: '文章标题',
        body: body
      });
      
      const result = determineReturnString(doc, {
        format: 'markdown',
        with_metadata: false,
        formatting: true
      });
      
      expect(result).toContain('# 标题');
      expect(result).toContain('段落内容');
    });
    
    // ------------------------------------------------------------------------
    // JSON格式
    // ------------------------------------------------------------------------
    
    test('JSON格式', () => {
      const doc = createTestDocument();
      const result = determineReturnString(doc, {
        format: 'json',
        with_metadata: true
      });
      
      expect(() => JSON.parse(result)).not.toThrow();
      
      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('测试标题');
      expect(parsed.author).toBe('测试作者');
      expect(parsed.text).toContain('第一段内容');
    });
    
    // ------------------------------------------------------------------------
    // CSV格式
    // ------------------------------------------------------------------------
    
    test('CSV格式', () => {
      const doc = createTestDocument();
      const result = determineReturnString(doc, {
        format: 'csv',
        formatting: false
      });
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // CSV应该包含制表符分隔的字段
    });
    
    // ------------------------------------------------------------------------
    // 评论处理
    // ------------------------------------------------------------------------
    
    test('包含评论', () => {
      const bodyHtml = '<p>正文内容</p>';
      const commentsHtml = '<p>评论内容</p>';
      
      const doc = new Document({
        title: '测试',
        body: loadHtml(bodyHtml),
        commentsbody: loadHtml(commentsHtml)
      });
      
      const result = determineReturnString(doc, {
        format: 'txt',
        with_metadata: false,
        formatting: false
      });
      
      expect(result).toContain('正文内容');
      expect(result).toContain('评论内容');
    });
    
    test('空评论不影响输出', () => {
      const doc = createTestDocument();
      doc.commentsbody = loadHtml('<div></div>');
      
      const result = determineReturnString(doc, {
        format: 'txt',
        with_metadata: false,
        formatting: false
      });
      
      expect(result).toContain('第一段内容');
      // 不应该有额外的换行
    });
    
    // ------------------------------------------------------------------------
    // 边界情况
    // ------------------------------------------------------------------------
    
    test('空文档', () => {
      const doc = new Document();
      const result = determineReturnString(doc, {
        format: 'txt',
        with_metadata: false
      });
      
      expect(result).toBe('');
    });
    
    test('null文档', () => {
      const result = determineReturnString(null, {
        format: 'txt'
      });
      
      expect(result).toBe('');
    });
    
    test('默认格式（txt）', () => {
      const doc = createTestDocument();
      const result = determineReturnString(doc, {});
      
      expect(result).toContain('第一段内容');
    });
    
    test('Unicode标准化应用', () => {
      const html = '<p>café</p>';
      const doc = new Document({
        body: loadHtml(html)
      });
      
      const result = determineReturnString(doc, {
        format: 'txt',
        formatting: false
      });
      
      expect(result).toContain('café');
      // 结果应该是标准化的Unicode
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('完整工作流 - Markdown', () => {
      const body = document.createElement('div');
      
      const head1 = document.createElement('head');
      head1.setAttribute('rend', 'h1');
      head1.textContent = '主标题';
      
      const p1 = document.createElement('p');
      p1.textContent = '这是第一段。';
      
      const head2 = document.createElement('head');
      head2.setAttribute('rend', 'h2');
      head2.textContent = '子标题';
      
      const p2 = document.createElement('p');
      p2.textContent = '这是第二段。';
      
      const list = document.createElement('list');
      const item1 = document.createElement('item');
      item1.textContent = '列表项1';
      const item2 = document.createElement('item');
      item2.textContent = '列表项2';
      list.appendChild(item1);
      list.appendChild(item2);
      
      body.appendChild(head1);
      body.appendChild(p1);
      body.appendChild(head2);
      body.appendChild(p2);
      body.appendChild(list);
      
      const doc = new Document({
        title: '文章标题',
        author: '作者名',
        url: 'https://example.com',
        date: '2023-01-01',
        body: body
      });
      
      const result = determineReturnString(doc, {
        format: 'markdown',
        with_metadata: true,
        formatting: true
      });
      
      // 检查元数据头部
      expect(result).toContain('---');
      expect(result).toContain('title: 文章标题');
      expect(result).toContain('author: 作者名');
      
      // 检查Markdown格式
      expect(result).toContain('# 主标题');
      expect(result).toContain('## 子标题');
      expect(result).toContain('- 列表项1');
      expect(result).toContain('- 列表项2');
    });
    
    test('完整工作流 - JSON', () => {
      const html = '<p>测试内容</p>';
      
      const doc = new Document({
        title: 'JSON测试',
        author: '测试',
        body: loadHtml(html),
        categories: ['科技', '新闻'],
        tags: ['测试', 'JSON']
      });
      
      const result = determineReturnString(doc, {
        format: 'json',
        with_metadata: true
      });
      
      const parsed = JSON.parse(result);
      
      expect(parsed.title).toBe('JSON测试');
      expect(parsed.author).toBe('测试');
      expect(parsed.categories).toBe('科技; 新闻');
      expect(parsed.tags).toBe('测试; JSON');
      expect(parsed.text).toContain('测试内容');
    });
  });
});

