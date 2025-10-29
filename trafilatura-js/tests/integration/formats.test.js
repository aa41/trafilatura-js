/**
 * 格式化器集成测试
 * 测试所有输出格式的端到端功能
 */

import { extract } from '../../src/core.js';
import {
  SIMPLE_BLOG_POST,
  NEWS_WITH_TABLE,
  ARTICLE_WITH_IMAGES,
  COMPLEX_FORMAT_ARTICLE,
  ACADEMIC_ARTICLE,
  ARTICLE_WITH_JSON_LD,
  SHORT_ARTICLE,
  EMPTY_ARTICLE,
} from '../fixtures/sample-html.js';

describe('格式化器集成测试', () => {
  describe('Markdown格式', () => {
    test('应该正确输出简单博客文章为Markdown', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'markdown',
        with_metadata: false,
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      // 检查标题格式
      expect(result).toMatch(/^#\s+/m);
      
      // 检查列表格式
      expect(result).toMatch(/^-\s+/m);
      
      // 检查有序列表
      expect(result).toMatch(/^\d+\.\s+/m);
    });

    test('应该包含YAML front matter当with_metadata=true', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'markdown',
        with_metadata: true,
      });

      expect(result).toMatch(/^---\n/);
      expect(result).toMatch(/title:/);
      expect(result).toMatch(/author:/);
    });

    test('应该正确格式化代码块', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'markdown',
      });

      expect(result).toMatch(/```/);
    });

    test('应该正确格式化引用块', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'markdown',
      });

      expect(result).toMatch(/^>\s+/m);
    });

    test('应该正确格式化表格', async () => {
      const result = await extract(NEWS_WITH_TABLE, {
        output_format: 'markdown',
      });

      expect(result).toMatch(/\|/);
      expect(result).toMatch(/---/);
    });

    test('应该使用md别名', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'md',
      });

      expect(result).toBeTruthy();
      expect(result).toMatch(/^#\s+/m);
    });
  });

  describe('XML-TEI格式', () => {
    test('应该输出有效的XML-TEI', async () => {
      const result = await extract(ACADEMIC_ARTICLE, {
        output_format: 'xml',
        with_metadata: true,
      });

      expect(result).toBeTruthy();
      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<TEI');
      expect(result).toContain('xmlns="http://www.tei-c.org/ns/1.0"');
      expect(result).toContain('</TEI>');
    });

    test('应该包含TEI Header', async () => {
      const result = await extract(ACADEMIC_ARTICLE, {
        output_format: 'xml',
        with_metadata: true,
      });

      expect(result).toContain('<teiHeader>');
      expect(result).toContain('<fileDesc>');
      expect(result).toContain('<titleStmt>');
      expect(result).toContain('</teiHeader>');
    });

    test('应该正确映射HTML元素到TEI元素', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'xml',
      });

      // 标题 → <head>
      expect(result).toMatch(/<head\s+rend="h\d+">/);
      
      // 段落 → <p>
      expect(result).toContain('<p>');
      
      // 列表 → <list>
      expect(result).toContain('<list');
      expect(result).toContain('<item>');
    });

    test('应该正确处理表格', async () => {
      const result = await extract(NEWS_WITH_TABLE, {
        output_format: 'xml',
      });

      expect(result).toContain('<table>');
      expect(result).toContain('<row>');
      expect(result).toContain('<cell');
    });

    test('应该使用xmltei和tei别名', async () => {
      const result1 = await extract(SIMPLE_BLOG_POST, {
        output_format: 'xmltei',
      });
      const result2 = await extract(SIMPLE_BLOG_POST, {
        output_format: 'tei',
      });

      expect(result1).toContain('<TEI');
      expect(result2).toContain('<TEI');
    });
  });

  describe('JSON格式', () => {
    test('应该输出有效的JSON', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'json',
      });

      expect(result).toBeTruthy();
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('应该包含text字段', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'json',
      });

      const data = JSON.parse(result);
      expect(data).toHaveProperty('text');
      expect(typeof data.text).toBe('string');
      expect(data.text.length).toBeGreaterThan(0);
    });

    test('应该在with_metadata=true时包含metadata', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'json',
        with_metadata: true,
      });

      const data = JSON.parse(result);
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('title');
    });

    test('应该包含结构化数据', async () => {
      const result = await extract(COMPLEX_FORMAT_ARTICLE, {
        output_format: 'json',
      });

      const data = JSON.parse(result);
      
      // 检查是否有结构化内容
      if (data.structured) {
        expect(Array.isArray(data.structured)).toBe(true);
        expect(data.structured.length).toBeGreaterThan(0);
        
        // 检查元素类型
        const types = data.structured.map(item => item.type);
        expect(types.some(t => ['heading', 'paragraph', 'list'].includes(t))).toBe(true);
      }
    });
  });

  describe('HTML格式', () => {
    test('应该输出有效的HTML5', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'html',
      });

      expect(result).toBeTruthy();
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
    });

    test('应该包含meta标签', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'html',
        with_metadata: true,
      });

      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
    });

    test('应该使用语义化HTML5标签', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'html',
      });

      expect(result).toContain('<article>');
      expect(result).toContain('<main>');
    });

    test('应该包含header当with_metadata=true', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'html',
        with_metadata: true,
      });

      expect(result).toContain('<header>');
      expect(result).toContain('<h1>');
      expect(result).toContain('class="meta"');
    });

    test('应该正确格式化表格', async () => {
      const result = await extract(NEWS_WITH_TABLE, {
        output_format: 'html',
      });

      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<th>');
      expect(result).toContain('<td>');
    });
  });

  describe('CSV格式', () => {
    test('应该输出CSV格式', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'csv',
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      // 应该包含header行
      expect(result).toMatch(/^title,author,date/);
      
      // 应该有数据行
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });

    test('应该正确转义字段', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'csv',
      });

      // 字段应该用引号包围
      expect(result).toMatch(/"[^"]*"/);
    });

    test('应该包含所有标准字段', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'csv',
      });

      const headerLine = result.split('\n')[0];
      const expectedFields = ['title', 'author', 'date', 'url', 'text'];
      
      expectedFields.forEach(field => {
        expect(headerLine).toContain(field);
      });
    });
  });

  describe('TXT格式', () => {
    test('应该输出纯文本', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'txt',
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      // 不应包含HTML标签
      expect(result).not.toMatch(/<[^>]+>/);
    });

    test('应该包含元数据头部当with_metadata=true', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'txt',
        with_metadata: true,
      });

      expect(result).toMatch(/标题:/);
      expect(result).toMatch(/作者:/);
      expect(result).toContain('---');
    });

    test('应该包含主要内容', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'txt',
      });

      expect(result.length).toBeGreaterThan(50);
    });
  });

  describe('边界情况', () => {
    test('应该处理空文章', async () => {
      const result = await extract(EMPTY_ARTICLE, {
        output_format: 'markdown',
      });

      // 应该返回null或空字符串，不应该抛出错误
      expect(result === null || result === '' || typeof result === 'string').toBe(true);
    });

    test('应该处理短文章', async () => {
      const result = await extract(SHORT_ARTICLE, {
        output_format: 'json',
      });

      if (result) {
        expect(() => JSON.parse(result)).not.toThrow();
      }
    });

    test('应该处理null输入', async () => {
      const result = await extract(null, {
        output_format: 'markdown',
      });

      expect(result).toBeNull();
    });

    test('应该处理未知格式（默认为txt）', async () => {
      const result = await extract(SIMPLE_BLOG_POST, {
        output_format: 'unknown-format',
      });

      expect(result).toBeTruthy();
      // 应该回退到txt格式
      expect(typeof result).toBe('string');
    });
  });

  describe('格式比较', () => {
    test('不同格式应该产生不同输出', async () => {
      const html = SIMPLE_BLOG_POST;
      
      const markdown = await extract(html, { output_format: 'markdown' });
      const xml = await extract(html, { output_format: 'xml' });
      const json = await extract(html, { output_format: 'json' });
      const csv = await extract(html, { output_format: 'csv' });
      
      // 所有格式都应该有输出
      expect(markdown).toBeTruthy();
      expect(xml).toBeTruthy();
      expect(json).toBeTruthy();
      expect(csv).toBeTruthy();
      
      // 输出应该不同
      expect(markdown).not.toBe(xml);
      expect(markdown).not.toBe(json);
      expect(xml).not.toBe(json);
    });

    test('所有格式都应该包含核心内容', async () => {
      const html = SIMPLE_BLOG_POST;
      const keyword = 'JavaScript';
      
      const formats = ['txt', 'markdown', 'xml', 'json', 'html'];
      
      for (const format of formats) {
        const result = await extract(html, { output_format: format });
        
        if (result) {
          // 所有格式都应该包含关键词（直接或在嵌套结构中）
          expect(result.toLowerCase()).toContain(keyword.toLowerCase());
        }
      }
    });
  });

  describe('JSON-LD元数据', () => {
    test('应该提取JSON-LD元数据', async () => {
      const result = await extract(ARTICLE_WITH_JSON_LD, {
        output_format: 'json',
        with_metadata: true,
      });

      const data = JSON.parse(result);
      expect(data.metadata).toBeTruthy();
      
      // 应该包含从JSON-LD提取的数据
      expect(data.metadata.title || data.metadata.author || data.metadata.date).toBeTruthy();
    });
  });

  describe('性能测试', () => {
    test('应该在合理时间内处理中等大小文章', async () => {
      const startTime = Date.now();
      
      await extract(COMPLEX_FORMAT_ARTICLE, {
        output_format: 'markdown',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });

    test('所有格式应该有相似的性能', async () => {
      const formats = ['txt', 'markdown', 'xml', 'json', 'html', 'csv'];
      const timings = {};
      
      for (const format of formats) {
        const startTime = Date.now();
        await extract(SIMPLE_BLOG_POST, { output_format: format });
        const endTime = Date.now();
        
        timings[format] = endTime - startTime;
      }
      
      // 所有格式都应该在合理时间内完成
      Object.values(timings).forEach(time => {
        expect(time).toBeLessThan(500);
      });
    });
  });
});

