/**
 * TEI-XML输出 - 单元测试
 * 
 * 测试 src/output/tei.js 中的所有函数
 */

import {
  writeFullHeader,
  writeTeiTree,
  buildTeiOutput,
  teiToString
} from '../../src/output/tei.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('TEI-XML输出', () => {
  
  // ============================================================================
  // writeFullHeader() 测试
  // ============================================================================
  
  describe('writeFullHeader()', () => {
    test('基础TEI头部生成', () => {
      const docMeta = {
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com',
        hostname: 'example.com',
        sitename: '测试网站',
        description: '测试描述',
        date: '2023-01-01',
        license: 'MIT',
        id: 'test-123',
        fingerprint: 'abc123',
        categories: ['分类1', '分类2'],
        tags: ['标签1', '标签2'],
        filedate: '2023-12-01'
      };
      
      const teiDoc = document.createElement('TEI');
      const header = writeFullHeader(teiDoc, docMeta);
      
      expect(header).not.toBeNull();
      expect(header.tagName).toBe('teiHeader');
      
      // 检查是否被添加到文档
      expect(teiDoc.querySelector('teiHeader')).toBe(header);
    });
    
    test('包含标题信息', () => {
      const docMeta = {
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const title = teiDoc.querySelector('titleStmt > title[type="main"]');
      expect(title).not.toBeNull();
      expect(title.textContent).toBe('测试标题');
      
      const author = teiDoc.querySelector('titleStmt > author');
      expect(author).not.toBeNull();
      expect(author.textContent).toBe('测试作者');
    });
    
    test('包含发布信息', () => {
      const docMeta = {
        title: '测试',
        hostname: 'example.com',
        sitename: '测试网站',
        license: 'MIT'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const publisher = teiDoc.querySelector('publicationStmt > publisher');
      expect(publisher).not.toBeNull();
      expect(publisher.textContent).toContain('测试网站');
      expect(publisher.textContent).toContain('example.com');
      
      const licensePara = teiDoc.querySelector('availability > p');
      expect(licensePara).not.toBeNull();
      expect(licensePara.textContent).toBe('MIT');
    });
    
    test('没有license时插入空段落', () => {
      const docMeta = {
        title: '测试',
        hostname: 'example.com'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const emptyPara = teiDoc.querySelector('publicationStmt > p');
      expect(emptyPara).not.toBeNull();
      expect(emptyPara.textContent).toBe('');
    });
    
    test('包含ID和指纹', () => {
      const docMeta = {
        title: '测试',
        id: 'test-123',
        fingerprint: 'abc123'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const idNote = teiDoc.querySelector('note[type="id"]');
      expect(idNote).not.toBeNull();
      expect(idNote.textContent).toBe('test-123');
      
      const fingerprintNote = teiDoc.querySelector('note[type="fingerprint"]');
      expect(fingerprintNote).not.toBeNull();
      expect(fingerprintNote.textContent).toBe('abc123');
    });
    
    test('包含URL指针', () => {
      const docMeta = {
        title: '测试',
        url: 'https://example.com',
        hostname: 'example.com'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const ptr = teiDoc.querySelector('biblFull > publicationStmt > ptr[type="URL"]');
      expect(ptr).not.toBeNull();
      expect(ptr.getAttribute('target')).toBe('https://example.com');
    });
    
    test('包含摘要', () => {
      const docMeta = {
        title: '测试',
        description: '这是一个测试描述'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const abstract = teiDoc.querySelector('abstract > p');
      expect(abstract).not.toBeNull();
      expect(abstract.textContent).toBe('这是一个测试描述');
    });
    
    test('包含分类和标签', () => {
      const docMeta = {
        title: '测试',
        categories: ['分类1', '分类2'],
        tags: ['标签1', '标签2']
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const categoriesTerm = teiDoc.querySelector('term[type="categories"]');
      expect(categoriesTerm).not.toBeNull();
      expect(categoriesTerm.textContent).toBe('分类1,分类2');
      
      const tagsTerm = teiDoc.querySelector('term[type="tags"]');
      expect(tagsTerm).not.toBeNull();
      expect(tagsTerm.textContent).toBe('标签1,标签2');
    });
    
    test('包含下载日期', () => {
      const docMeta = {
        title: '测试',
        filedate: '2023-12-01'
      };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const downloadDate = teiDoc.querySelector('creation > date[type="download"]');
      expect(downloadDate).not.toBeNull();
      expect(downloadDate.textContent).toBe('2023-12-01');
    });
    
    test('包含应用信息', () => {
      const docMeta = { title: '测试' };
      
      const teiDoc = document.createElement('TEI');
      writeFullHeader(teiDoc, docMeta);
      
      const application = teiDoc.querySelector('application[ident="Trafilatura"]');
      expect(application).not.toBeNull();
      expect(application.hasAttribute('version')).toBe(true);
      
      const label = teiDoc.querySelector('application > label');
      expect(label.textContent).toBe('Trafilatura');
      
      const ptr = teiDoc.querySelector('application > ptr');
      expect(ptr.getAttribute('target')).toContain('trafilatura');
    });
  });
  
  // ============================================================================
  // writeTeiTree() 测试
  // ============================================================================
  
  describe('writeTeiTree()', () => {
    test('生成完整的TEI文档', () => {
      const docMeta = {
        title: '测试标题',
        author: '测试作者',
        hostname: 'example.com',
        body: loadHtml('<body><p>正文内容</p></body>'),
        commentsbody: loadHtml('<body><p>评论内容</p></body>')
      };
      
      const teiDoc = writeTeiTree(docMeta);
      
      expect(teiDoc.tagName).toBe('TEI');
      expect(teiDoc.getAttribute('xmlns')).toBe('http://www.tei-c.org/ns/1.0');
      
      // 检查结构
      expect(teiDoc.querySelector('teiHeader')).not.toBeNull();
      expect(teiDoc.querySelector('text')).not.toBeNull();
      expect(teiDoc.querySelector('text > body')).not.toBeNull();
    });
    
    test('包含正文div', () => {
      const docMeta = {
        title: '测试',
        body: loadHtml('<body><p>正文内容</p></body>')
      };
      
      const teiDoc = writeTeiTree(docMeta);
      
      const entryDiv = teiDoc.querySelector('text > body > div[type="entry"]');
      expect(entryDiv).not.toBeNull();
      expect(entryDiv.textContent).toContain('正文内容');
    });
    
    test('包含评论div', () => {
      const docMeta = {
        title: '测试',
        commentsbody: loadHtml('<body><p>评论内容</p></body>')
      };
      
      const teiDoc = writeTeiTree(docMeta);
      
      const commentsDiv = teiDoc.querySelector('text > body > div[type="comments"]');
      expect(commentsDiv).not.toBeNull();
      expect(commentsDiv.textContent).toContain('评论内容');
    });
    
    test('处理空body', () => {
      const docMeta = {
        title: '测试',
        body: null,
        commentsbody: null
      };
      
      const teiDoc = writeTeiTree(docMeta);
      
      expect(teiDoc.querySelector('text > body')).not.toBeNull();
    });
  });
  
  // ============================================================================
  // buildTeiOutput() 测试
  // ============================================================================
  
  describe('buildTeiOutput()', () => {
    test('构建TEI输出', () => {
      const docMeta = {
        title: '测试标题',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      
      expect(teiDoc.tagName).toBe('TEI');
      expect(teiDoc.querySelector('teiHeader')).not.toBeNull();
      expect(teiDoc.querySelector('text')).not.toBeNull();
    });
  });
  
  // ============================================================================
  // teiToString() 测试
  // ============================================================================
  
  describe('teiToString()', () => {
    test('转换为XML字符串', () => {
      const docMeta = {
        title: '测试',
        hostname: 'example.com',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      const xmlString = teiToString(teiDoc);
      
      expect(xmlString).toContain('<?xml');
      expect(xmlString).toContain('<TEI');
      expect(xmlString).toContain('xmlns="http://www.tei-c.org/ns/1.0"');
      expect(xmlString).toContain('</TEI>');
    });
    
    test('包含中文内容', () => {
      const docMeta = {
        title: '中文标题',
        author: '中文作者',
        body: loadHtml('<body><p>中文内容</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      const xmlString = teiToString(teiDoc);
      
      expect(xmlString).toContain('中文标题');
      expect(xmlString).toContain('中文作者');
      expect(xmlString).toContain('中文内容');
    });
    
    test('格式化输出', () => {
      const docMeta = {
        title: '测试',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      const xmlString = teiToString(teiDoc, true);
      
      // 应该包含换行
      expect(xmlString).toContain('\n');
    });
    
    test('非格式化输出', () => {
      const docMeta = {
        title: '测试',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      const xmlString = teiToString(teiDoc, false);
      
      expect(xmlString).toContain('<TEI');
    });
    
    test('null输入处理', () => {
      const xmlString = teiToString(null);
      expect(xmlString).toBe('');
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('完整的TEI文档生成', () => {
      const docMeta = {
        title: '完整测试标题',
        author: '测试作者',
        url: 'https://example.com/article',
        hostname: 'example.com',
        sitename: '示例网站',
        description: '这是一篇测试文章的描述',
        date: '2023-01-15',
        license: 'CC-BY-SA',
        id: 'article-001',
        fingerprint: 'fp123abc',
        categories: ['技术', 'JavaScript'],
        tags: ['测试', 'TEI', 'XML'],
        filedate: '2023-12-01',
        body: loadHtml('<body><p>这是文章的正文内容。</p><p>第二段内容。</p></body>'),
        commentsbody: loadHtml('<body><p>这是评论1</p><p>这是评论2</p></body>')
      };
      
      const teiDoc = buildTeiOutput(docMeta);
      const xmlString = teiToString(teiDoc);
      
      // 验证XML结构
      expect(xmlString).toContain('<?xml');
      expect(xmlString).toContain('<TEI xmlns="http://www.tei-c.org/ns/1.0"');
      
      // 验证头部信息
      expect(xmlString).toContain('完整测试标题');
      expect(xmlString).toContain('测试作者');
      expect(xmlString).toContain('示例网站');
      expect(xmlString).toContain('example.com');
      expect(xmlString).toContain('这是一篇测试文章的描述');
      expect(xmlString).toContain('CC-BY-SA');
      
      // 验证元数据
      expect(xmlString).toContain('article-001');
      expect(xmlString).toContain('fp123abc');
      expect(xmlString).toContain('技术,JavaScript');
      expect(xmlString).toContain('测试,TEI,XML');
      
      // 验证内容
      expect(xmlString).toContain('这是文章的正文内容');
      expect(xmlString).toContain('第二段内容');
      expect(xmlString).toContain('这是评论1');
      expect(xmlString).toContain('这是评论2');
      
      // 验证div类型
      expect(xmlString).toContain('type="entry"');
      expect(xmlString).toContain('type="comments"');
    });
  });
});

