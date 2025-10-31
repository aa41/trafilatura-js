/**
 * JSON和CSV输出 - 单元测试
 * 
 * 测试 src/output/json.js 和 src/output/csv.js 中的所有函数
 */

import { buildJsonOutput } from '../../src/output/json.js';
import { xmlToCsv, getCsvHeader } from '../../src/output/csv.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('JSON输出', () => {
  
  // ============================================================================
  // buildJsonOutput() 测试
  // ============================================================================
  
  describe('buildJsonOutput()', () => {
    test('基础JSON输出（包含元数据）', () => {
      const docMeta = {
        title: '测试标题',
        author: '测试作者',
        url: 'https://example.com',
        hostname: 'example.com',
        description: '测试描述',
        sitename: '测试网站',
        date: '2023-01-01',
        categories: ['分类1', '分类2'],
        tags: ['标签1', '标签2'],
        body: loadHtml('<body><p>正文内容</p></body>'),
        commentsbody: loadHtml('<body><p>评论内容</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, true);
      const data = JSON.parse(json);
      
      expect(data.title).toBe('测试标题');
      expect(data.author).toBe('测试作者');
      expect(data.source).toBe('https://example.com'); // url → source
      expect(data.hostname).toBe('example.com');
      expect(data['source-hostname']).toBe('测试网站'); // sitename → source-hostname
      expect(data.excerpt).toBe('测试描述'); // description → excerpt
    expect(data.date).toBe('2023-01-01');
    expect(data.categories).toBe('分类1; 分类2'); // 数组 → 分号+空格分隔
    expect(data.tags).toBe('标签1; 标签2'); // 数组 → 分号+空格分隔
      expect(data.text).toContain('正文内容');
      expect(data.comments).toContain('评论内容');
    });
    
    test('JSON输出（不包含元数据）', () => {
      const docMeta = {
        body: loadHtml('<body><p>正文内容</p></body>'),
        commentsbody: loadHtml('<body><p>评论内容</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, false);
      const data = JSON.parse(json);
      
      expect(data.text).toContain('正文内容');
      expect(data.comments).toContain('评论内容');
      expect(data.title).toBeUndefined();
      expect(data.author).toBeUndefined();
    });
    
    test('空categories和tags处理', () => {
      const docMeta = {
        title: '测试',
        categories: [],
        tags: [],
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, true);
      const data = JSON.parse(json);
      
      expect(data.categories).toBe('');
      expect(data.tags).toBe('');
    });
    
    test('null categories和tags处理', () => {
      const docMeta = {
        title: '测试',
        categories: null,
        tags: null,
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, true);
      const data = JSON.parse(json);
      
      expect(data.categories).toBe('');
      expect(data.tags).toBe('');
    });
    
    test('空body处理', () => {
      const docMeta = {
        title: '测试',
        body: null,
        commentsbody: null
      };
      
      const json = buildJsonOutput(docMeta, true);
      const data = JSON.parse(json);
      
      expect(data.text).toBe('');
      expect(data.comments).toBe('');
    });
    
    test('null输入处理', () => {
      const json = buildJsonOutput(null);
      const data = JSON.parse(json);
      
      expect(data).toEqual({});
    });
    
    test('中文内容处理', () => {
      const docMeta = {
        title: '中文标题',
        author: '中文作者',
        body: loadHtml('<body><p>中文正文</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, true);
      const data = JSON.parse(json);
      
      expect(data.title).toBe('中文标题');
      expect(data.author).toBe('中文作者');
      expect(data.text).toContain('中文正文');
    });
    
    test('JSON格式化（可解析）', () => {
      const docMeta = {
        title: '测试',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const json = buildJsonOutput(docMeta, true);
      
      // 应该是有效的JSON
      expect(() => JSON.parse(json)).not.toThrow();
      
      // 应该是格式化的（有缩进）
      expect(json).toContain('\n');
      expect(json).toContain('  '); // 2空格缩进
    });
  });
});

describe('CSV输出', () => {
  
  // ============================================================================
  // getCsvHeader() 测试
  // ============================================================================
  
  describe('getCsvHeader()', () => {
    test('默认分隔符（制表符）', () => {
      const header = getCsvHeader();
      
      expect(header).toContain('url');
      expect(header).toContain('title');
      expect(header).toContain('text');
      expect(header).toContain('\t');
    });
    
    test('逗号分隔符', () => {
      const header = getCsvHeader(',');
      
      expect(header).toContain('url,');
      expect(header).toContain('title,');
      expect(header).not.toContain('\t');
    });
    
    test('包含所有必需字段', () => {
      const header = getCsvHeader();
      
      expect(header).toContain('url');
      expect(header).toContain('id');
      expect(header).toContain('fingerprint');
      expect(header).toContain('hostname');
      expect(header).toContain('title');
      expect(header).toContain('image');
      expect(header).toContain('date');
      expect(header).toContain('text');
      expect(header).toContain('comments');
      expect(header).toContain('license');
      expect(header).toContain('pagetype');
    });
  });
  
  // ============================================================================
  // xmlToCsv() 测试
  // ============================================================================
  
  describe('xmlToCsv()', () => {
    test('基础CSV输出', () => {
      const document = {
        url: 'https://example.com',
        id: '123',
        fingerprint: 'abc',
        hostname: 'example.com',
        title: '测试标题',
        image: 'https://example.com/image.jpg',
        date: '2023-01-01',
        body: loadHtml('<body><p>正文内容</p></body>'),
        commentsbody: loadHtml('<body><p>评论内容</p></body>'),
        license: 'MIT',
        pagetype: 'article'
      };
      
      const csv = xmlToCsv(document, false);
      
      expect(csv).toContain('https://example.com');
      expect(csv).toContain('123');
      expect(csv).toContain('abc');
      expect(csv).toContain('example.com');
      expect(csv).toContain('测试标题');
      expect(csv).toContain('2023-01-01');
      expect(csv).toContain('正文内容');
      expect(csv).toContain('评论内容');
      expect(csv).toContain('MIT');
      expect(csv).toContain('article');
      expect(csv).toContain('\t'); // 默认制表符分隔
    });
    
    test('逗号分隔符', () => {
      const document = {
        url: 'https://example.com',
        title: '标题',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false, { delim: ',' });
      
      expect(csv).toContain(',');
      expect(csv).not.toContain('\t');
    });
    
    test('null值处理（使用默认null）', () => {
      const document = {
        url: 'https://example.com',
        title: null,
        hostname: null,
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      
      expect(csv).toContain('null');
    });
    
    test('null值处理（自定义null值）', () => {
      const document = {
        url: 'https://example.com',
        title: null,
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false, { null: 'N/A' });
      
      expect(csv).toContain('N/A');
    });
    
    test('包含引号的字段转义', () => {
      const document = {
        url: 'https://example.com',
        title: '包含"引号"的标题',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      
      // 应该用引号包裹并转义内部引号
      expect(csv).toContain('"包含""引号""的标题"');
    });
    
    test('包含制表符的字段转义', () => {
      const document = {
        url: 'https://example.com',
        title: '包含\t制表符',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      
      // 应该用引号包裹
      expect(csv).toContain('"包含\t制表符"');
    });
    
    test('包含换行的字段转义', () => {
      const document = {
        url: 'https://example.com',
        title: '包含\n换行',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      
      // 应该用引号包裹
      expect(csv).toContain('"包含\n换行"');
    });
    
    test('空body处理', () => {
      const document = {
        url: 'https://example.com',
        title: '标题',
        body: null,
        commentsbody: null
      };
      
      const csv = xmlToCsv(document, false);
      
      expect(csv).toContain('null');
    });
    
    test('null输入处理', () => {
      const csv = xmlToCsv(null);
      
      expect(csv).toBe('');
    });
    
    test('中文内容处理', () => {
      const document = {
        url: 'https://example.com',
        title: '中文标题',
        hostname: '示例网站',
        body: loadHtml('<body><p>中文内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      
      expect(csv).toContain('中文标题');
      expect(csv).toContain('示例网站');
      expect(csv).toContain('中文内容');
    });
    
    test('字段顺序正确', () => {
      const document = {
        url: 'URL',
        id: 'ID',
        fingerprint: 'FP',
        hostname: 'HOST',
        title: 'TITLE',
        image: 'IMAGE',
        date: 'DATE',
        body: loadHtml('<body><p>TEXT</p></body>'),
        commentsbody: loadHtml('<body><p>COMMENTS</p></body>'),
        license: 'LICENSE',
        pagetype: 'TYPE'
      };
      
      const csv = xmlToCsv(document, false);
      const fields = csv.split('\t');
      
      expect(fields[0]).toBe('URL');
      expect(fields[1]).toBe('ID');
      expect(fields[2]).toBe('FP');
      expect(fields[3]).toBe('HOST');
      expect(fields[4]).toBe('TITLE');
      expect(fields[5]).toBe('IMAGE');
      expect(fields[6]).toBe('DATE');
      expect(fields[7]).toContain('TEXT');
      expect(fields[8]).toContain('COMMENTS');
      expect(fields[9]).toBe('LICENSE');
      expect(fields[10]).toBe('TYPE');
    });
  });
  
  // ============================================================================
  // 集成测试
  // ============================================================================
  
  describe('集成测试', () => {
    test('CSV表头与数据行匹配', () => {
      const header = getCsvHeader();
      const headerFields = header.split('\t');
      
      const document = {
        url: 'https://example.com',
        title: '标题',
        body: loadHtml('<body><p>内容</p></body>')
      };
      
      const csv = xmlToCsv(document, false);
      const dataFields = csv.split('\t');
      
      // 字段数量应该一致
      expect(dataFields.length).toBe(headerFields.length);
    });
  });
});

