/**
 * 集成测试 - 完整提取流程
 * 测试从HTML到最终输出的端到端功能
 */

import { extract, extractWithMetadata, bareExtraction } from '../../src/core.js';

describe('集成测试 - 完整提取流程', () => {
  describe('extract() - 主API', () => {
    test('应该从简单HTML中提取文本内容', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>测试文章</title>
          </head>
          <body>
            <article>
              <h1>这是标题</h1>
              <p>这是第一段内容，包含足够多的文字用于测试提取功能。我们需要确保文本长度达到最小要求。</p>
              <p>这是第二段内容，继续添加更多文字来满足提取的最小长度限制。确保测试能够正常通过。</p>
            </article>
          </body>
        </html>
      `;
      
      const result = await extract(html);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('第一段');
      expect(result).toContain('第二段');
    });

    test('应该处理空HTML', async () => {
      const html = '<html><body></body></html>';
      
      const result = await extract(html);
      
      // 空HTML应该返回null或空字符串
      expect(result === null || result === '').toBeTruthy();
    });

    test('应该处理null输入', async () => {
      const result = await extract(null);
      expect(result).toBeNull();
    });
  });

  describe('extractWithMetadata() - 带元数据提取', () => {
    test('应该同时提取内容和元数据', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>测试文章标题</title>
            <meta name="author" content="测试作者">
            <meta name="description" content="这是测试描述">
          </head>
          <body>
            <article>
              <h1>文章标题</h1>
              <p>文章内容，这里需要足够长的文本来确保能够被正确提取。添加更多文字内容。</p>
            </article>
          </body>
        </html>
      `;
      
      const result = await extractWithMetadata(html);
      
      expect(result).toBeTruthy();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('title');
    });
  });

  describe('bareExtraction() - 底层提取', () => {
    test('应该返回Document对象', async () => {
      const html = `
        <html>
          <body>
            <p>这是测试内容，需要足够长才能被提取。添加更多文字来满足最小长度要求。</p>
          </body>
        </html>
      `;
      
      const doc = await bareExtraction(html);
      
      expect(doc).toBeTruthy();
      expect(doc).toHaveProperty('body');
      expect(doc).toHaveProperty('text');
    });
  });
});

