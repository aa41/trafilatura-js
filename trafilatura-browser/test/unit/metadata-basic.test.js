/**
 * 基础元数据提取 - 单元测试
 * 
 * 测试 src/metadata/basic.js 中的所有函数
 */

import { 
  extractTitle, 
  extractAuthor, 
  extractSitename, 
  extractDescription, 
  extractUrl,
  extractHostname
} from '../../src/metadata/basic.js';
import { loadHtml } from '../../src/utils/dom.js';

describe('基础元数据提取', () => {
  
  // ============================================================================
  // extractTitle() 测试
  // ============================================================================
  
  describe('extractTitle()', () => {
    test('从<title>标签提取', () => {
      const html = '<html><head><title>测试标题</title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('测试标题');
    });
    
    test('从<title>标签提取并处理分隔符', () => {
      const html = '<html><head><title>文章标题 - 网站名称</title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('文章标题');
    });
    
    test('处理不同的分隔符', () => {
      const testCases = [
        { html: '<title>标题 | 网站</title>', expected: '标题' },
        { html: '<title>标题 – 网站</title>', expected: '标题' },
        { html: '<title>标题 — 网站</title>', expected: '标题' },
        { html: '<title>标题 :: 网站</title>', expected: '标题' }
      ];
      
      for (const { html, expected } of testCases) {
        const tree = loadHtml(`<html><head>${html}</head></html>`);
        const title = extractTitle(tree);
        expect(title).toBe(expected);
      }
    });
    
    test('从OpenGraph提取（优先级最高）', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG标题">
            <title>Title标题</title>
            <h1>H1标题</h1>
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('OG标题'); // OG优先
    });
    
    test('从Meta标签提取', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="Meta标题">
            <title>Title标题</title>
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('Meta标题'); // Meta优先于title
    });
    
    test('从<h1>标签提取（最后选择）', () => {
      const html = '<html><body><h1>H1标题</h1></body></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('H1标题');
    });
    
    test('空内容返回null', () => {
      const html = '<html><head><title></title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBeNull();
    });
    
    test('没有标题元素返回null', () => {
      const html = '<html><body><p>内容</p></body></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBeNull();
    });
    
    test('清理空格和换行', () => {
      const html = '<html><head><title>  \n  标题  \n  </title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('标题');
    });
  });
  
  // ============================================================================
  // extractAuthor() 测试
  // ============================================================================
  
  describe('extractAuthor()', () => {
    test('从meta name="author"提取', () => {
      const html = '<html><head><meta name="author" content="张三"></head></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('张三');
    });
    
    test('从meta property="author"提取', () => {
      const html = '<html><head><meta property="author" content="李四"></head></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('李四');
    });
    
    test('移除"by"前缀', () => {
      const html = '<html><head><meta name="author" content="by 王五"></head></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('王五');
    });
    
    test('移除"作者："前缀', () => {
      const html = '<html><head><meta name="author" content="作者：赵六"></head></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('赵六');
    });
    
    test('从class="author"提取', () => {
      const html = '<html><body><div class="author">田七</div></body></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('田七');
    });
    
    test('从多个候选中提取', () => {
      const html = `
        <html>
          <body>
            <span class="by-author">孙八</span>
          </body>
        </html>
      `;
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('孙八');
    });
    
    test('从itemprop="author"提取', () => {
      const html = '<html><body><span itemprop="author">周九</span></body></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('周九');
    });
    
    test('没有作者信息返回null', () => {
      const html = '<html><body><p>内容</p></body></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBeNull();
    });
    
    test('过滤过长的作者名', () => {
      const longName = 'a'.repeat(150);
      const html = `<html><body><div class="author">${longName}</div></body></html>`;
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBeNull(); // 超过100字符
    });
  });
  
  // ============================================================================
  // extractSitename() 测试
  // ============================================================================
  
  describe('extractSitename()', () => {
    test('从og:site_name提取', () => {
      const html = '<html><head><meta property="og:site_name" content="测试网站"></head></html>';
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBe('测试网站');
    });
    
    test('从application-name提取', () => {
      const html = '<html><head><meta name="application-name" content="应用名称"></head></html>';
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBe('应用名称');
    });
    
    test('从title推断（取最后部分）', () => {
      const html = '<html><head><title>文章标题 - 新浪新闻</title></head></html>';
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBe('新浪新闻');
    });
    
    test('从title推断（使用|分隔符）', () => {
      const html = '<html><head><title>文章 | 知乎</title></head></html>';
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBe('知乎');
    });
    
    test('过滤过长的网站名', () => {
      const longName = 'a'.repeat(60);
      const html = `<html><head><title>文章 - ${longName}</title></head></html>`;
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBeNull(); // 超过50字符
    });
    
    test('没有网站名返回null', () => {
      const html = '<html><head><title>简单标题</title></head></html>';
      const tree = loadHtml(html);
      const sitename = extractSitename(tree);
      expect(sitename).toBeNull();
    });
  });
  
  // ============================================================================
  // extractDescription() 测试
  // ============================================================================
  
  describe('extractDescription()', () => {
    test('从meta name="description"提取', () => {
      const html = '<html><head><meta name="description" content="这是一段描述内容，包含足够的长度"></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toBe('这是一段描述内容，包含足够的长度');
    });
    
    test('从og:description提取', () => {
      const html = '<html><head><meta property="og:description" content="这是OpenGraph描述，包含足够的长度"></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toBe('这是OpenGraph描述，包含足够的长度');
    });
    
    test('选择最长的描述', () => {
      const html = `
        <html>
          <head>
            <meta name="description" content="短描述内容短描述内容短">
            <meta property="og:description" content="这是一个更长的描述内容，应该被选中因为它包含更多信息">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toContain('更长的描述');
    });
    
    test('从twitter:description提取', () => {
      const html = '<html><head><meta name="twitter:description" content="Twitter描述内容足够长度"></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toBe('Twitter描述内容足够长度');
    });
    
    test('过滤过短的描述（少于20字符）', () => {
      const html = '<html><head><meta name="description" content="太短"></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toBeNull();
    });
    
    test('没有描述返回null', () => {
      const html = '<html><head><title>标题</title></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toBeNull();
    });
  });
  
  // ============================================================================
  // extractUrl() 测试
  // ============================================================================
  
  describe('extractUrl()', () => {
    test('从canonical链接提取', () => {
      const html = '<html><head><link rel="canonical" href="https://example.com/article"></head></html>';
      const tree = loadHtml(html);
      const url = extractUrl(tree);
      expect(url).toBe('https://example.com/article');
    });
    
    test('从og:url提取', () => {
      const html = '<html><head><meta property="og:url" content="https://example.com/page"></head></html>';
      const tree = loadHtml(html);
      const url = extractUrl(tree);
      expect(url).toBe('https://example.com/page');
    });
    
    test('canonical优先于og:url', () => {
      const html = `
        <html>
          <head>
            <link rel="canonical" href="https://example.com/canonical">
            <meta property="og:url" content="https://example.com/og">
          </head>
        </html>
      `;
      const tree = loadHtml(html);
      const url = extractUrl(tree);
      expect(url).toBe('https://example.com/canonical');
    });
    
    test('使用默认URL', () => {
      const html = '<html><head><title>标题</title></head></html>';
      const tree = loadHtml(html);
      const url = extractUrl(tree, 'https://default.com');
      expect(url).toBe('https://default.com');
    });
    
    test('没有URL且无默认值返回null', () => {
      const html = '<html><head><title>标题</title></head></html>';
      const tree = loadHtml(html);
      const url = extractUrl(tree);
      expect(url).toBeNull();
    });
    
    test('忽略非HTTP(S)的URL', () => {
      const html = '<html><head><link rel="canonical" href="/relative/path"></head></html>';
      const tree = loadHtml(html);
      const url = extractUrl(tree, 'https://default.com');
      expect(url).toBe('https://default.com'); // 使用默认
    });
  });
  
  // ============================================================================
  // extractHostname() 测试
  // ============================================================================
  
  describe('extractHostname()', () => {
    test('从URL提取域名', () => {
      const hostname = extractHostname('https://news.sina.com.cn/article.html');
      expect(hostname).toBe('sina.com.cn');
    });
    
    test('提取简单域名', () => {
      const hostname = extractHostname('https://example.com/page');
      expect(hostname).toBe('example.com');
    });
    
    test('空URL返回null', () => {
      const hostname = extractHostname(null);
      expect(hostname).toBeNull();
    });
    
    test('无效URL返回null', () => {
      const hostname = extractHostname('not-a-url');
      expect(hostname).toBeNull();
    });
  });
  
  // ============================================================================
  // 边界情况和集成测试
  // ============================================================================
  
  describe('边界情况', () => {
    test('处理null输入', () => {
      expect(extractTitle(null)).toBeNull();
      expect(extractAuthor(null)).toBeNull();
      expect(extractSitename(null)).toBeNull();
      expect(extractDescription(null)).toBeNull();
      expect(extractUrl(null)).toBeNull();
    });
    
    test('处理空HTML', () => {
      const html = '<html></html>';
      const tree = loadHtml(html);
      
      expect(extractTitle(tree)).toBeNull();
      expect(extractAuthor(tree)).toBeNull();
      expect(extractSitename(tree)).toBeNull();
      expect(extractDescription(tree)).toBeNull();
      expect(extractUrl(tree)).toBeNull();
    });
    
    test('处理复杂的真实HTML', () => {
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta property="og:title" content="深度解析AI技术">
            <meta property="og:site_name" content="科技日报">
            <meta property="og:url" content="https://tech.example.com/ai">
            <meta property="og:description" content="本文深入探讨了人工智能技术的最新发展趋势，包括机器学习、深度学习等领域">
            <meta name="author" content="by 张三">
            <title>深度解析AI技术 - 科技日报</title>
            <link rel="canonical" href="https://tech.example.com/ai">
          </head>
          <body>
            <article>
              <h1>深度解析AI技术</h1>
              <div class="author">李四</div>
              <p>内容...</p>
            </article>
          </body>
        </html>
      `;
      const tree = loadHtml(html);
      
      // 应该从OG提取（优先级最高）
      expect(extractTitle(tree)).toBe('深度解析AI技术');
      expect(extractAuthor(tree)).toBe('张三'); // Meta优先
      expect(extractSitename(tree)).toBe('科技日报');
      expect(extractDescription(tree)).toContain('人工智能');
      expect(extractUrl(tree)).toBe('https://tech.example.com/ai');
    });
  });
  
  // ============================================================================
  // 中文内容测试
  // ============================================================================
  
  describe('中文内容处理', () => {
    test('处理中文标题', () => {
      const html = '<html><head><title>这是一个中文标题</title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('这是一个中文标题');
    });
    
    test('处理中文作者名', () => {
      const html = '<html><head><meta name="author" content="张三丰"></head></html>';
      const tree = loadHtml(html);
      const author = extractAuthor(tree);
      expect(author).toBe('张三丰');
    });
    
    test('处理中文描述', () => {
      const html = '<html><head><meta name="description" content="这是一段中文描述，用于测试中文字符的处理能力"></head></html>';
      const tree = loadHtml(html);
      const desc = extractDescription(tree);
      expect(desc).toContain('中文描述');
    });
    
    test('处理混合中英文', () => {
      const html = '<html><head><title>AI技术 - Artificial Intelligence</title></head></html>';
      const tree = loadHtml(html);
      const title = extractTitle(tree);
      expect(title).toBe('AI技术');
    });
  });
});

