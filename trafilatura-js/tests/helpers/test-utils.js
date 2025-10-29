/**
 * 测试工具函数
 */

/**
 * 创建测试用的 HTML 元素
 */
export function createElementFromHTML(html) {
  const container = document.createElement('div');
  container.innerHTML = html.trim();
  return container.firstElementChild || container;
}

/**
 * 创建测试用的 HTML 文档
 */
export function createDocumentFromHTML(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * 创建简单的文章结构
 */
export function createSimpleArticle(options = {}) {
  const {
    title = 'Test Article',
    author = 'Test Author',
    date = '2024-01-01',
    content = 'This is test content.',
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="author" content="${author}">
      <meta name="date" content="${date}">
      <title>${title}</title>
    </head>
    <body>
      <article>
        <h1>${title}</h1>
        <div class="meta">
          <span class="author">${author}</span>
          <time datetime="${date}">${date}</time>
        </div>
        <div class="content">
          <p>${content}</p>
        </div>
      </article>
    </body>
    </html>
  `;
}

/**
 * 创建复杂的文章结构（包含多种元素）
 */
export function createComplexArticle() {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="author" content="张三">
      <meta name="description" content="这是一篇测试文章">
      <meta property="og:title" content="测试文章标题">
      <meta property="og:type" content="article">
      <title>复杂文章测试 - 测试网站</title>
    </head>
    <body>
      <header>
        <nav>
          <a href="/">首页</a>
          <a href="/about">关于</a>
        </nav>
      </header>

      <main>
        <article>
          <h1>人工智能的未来发展</h1>
          
          <div class="meta">
            <span class="author">作者：张三</span>
            <time datetime="2024-01-15">2024-01-15</time>
            <span class="tags">
              <a href="/tag/ai">人工智能</a>
              <a href="/tag/tech">技术</a>
            </span>
          </div>

          <div class="content">
            <p>人工智能（AI）正在快速改变我们的世界。从自动驾驶汽车到智能助手，AI 技术已经深入到我们生活的方方面面。</p>

            <h2>主要应用领域</h2>
            <ul>
              <li>医疗诊断</li>
              <li>金融分析</li>
              <li>自然语言处理</li>
              <li>计算机视觉</li>
            </ul>

            <blockquote>
              <p>"人工智能是新的电力。" - 吴恩达</p>
            </blockquote>

            <h2>技术细节</h2>
            <p>深度学习是 AI 的核心技术之一。它通过模拟人脑神经网络的工作方式来处理数据。</p>

            <pre><code>
function predict(input) {
  return model.forward(input);
}
            </code></pre>

            <h2>数据对比</h2>
            <table>
              <thead>
                <tr>
                  <th>技术</th>
                  <th>准确率</th>
                  <th>应用场景</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>传统算法</td>
                  <td>75%</td>
                  <td>简单分类</td>
                </tr>
                <tr>
                  <td>深度学习</td>
                  <td>95%</td>
                  <td>复杂识别</td>
                </tr>
              </tbody>
            </table>

            <p>总而言之，人工智能的发展将继续加速，为人类社会带来深刻变革。</p>

            <img src="/images/ai-future.jpg" alt="AI 未来展望" />
          </div>
        </article>

        <aside class="sidebar">
          <h3>相关文章</h3>
          <ul>
            <li><a href="/article1">机器学习入门</a></li>
            <li><a href="/article2">神经网络原理</a></li>
          </ul>
        </aside>

        <section class="comments">
          <h3>评论</h3>
          <div class="comment">
            <p class="author">李四</p>
            <p class="content">写得很好！</p>
          </div>
          <div class="comment">
            <p class="author">王五</p>
            <p class="content">期待更多内容。</p>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2024 测试网站</p>
        <nav>
          <a href="/privacy">隐私政策</a>
          <a href="/terms">服务条款</a>
        </nav>
      </footer>
    </body>
    </html>
  `;
}

/**
 * 创建带有噪音的 HTML（广告、社交媒体按钮等）
 */
export function createNoisyHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>带噪音的页面</title>
    </head>
    <body>
      <div class="ad-banner">广告内容</div>
      
      <article>
        <h1>真实内容标题</h1>
        <p>这是真实的文章内容。</p>
        
        <div class="social-share">
          <button>分享到 Facebook</button>
          <button>分享到 Twitter</button>
          <button>分享到 WeChat</button>
        </div>
        
        <p>更多真实内容。</p>
      </article>
      
      <aside class="sidebar-ads">
        <div class="ad">侧边栏广告1</div>
        <div class="ad">侧边栏广告2</div>
      </aside>
      
      <div class="popup-ad">弹窗广告</div>
    </body>
    </html>
  `;
}

/**
 * 获取元素的纯文本（去除多余空格）
 */
export function getCleanText(element) {
  if (!element) return '';
  return element.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * 断言元素包含特定标签
 */
export function expectElementToContainTag(element, tagName) {
  const tags = Array.from(element.getElementsByTagName(tagName));
  expect(tags.length).toBeGreaterThan(0);
  return tags;
}

/**
 * 断言元素不包含特定标签
 */
export function expectElementNotToContainTag(element, tagName) {
  const tags = Array.from(element.getElementsByTagName(tagName));
  expect(tags.length).toBe(0);
}

/**
 * 创建 mock 配置
 */
export function createMockConfig(overrides = {}) {
  return {
    fast: false,
    precision: false,
    recall: false,
    comments: true,
    formatting: false,
    links: false,
    images: false,
    tables: true,
    format: 'txt',
    with_metadata: false,
    ...overrides,
  };
}

/**
 * 创建 mock Extractor
 */
export function createMockExtractor(options = {}) {
  const { Extractor } = require('../../src/settings/config.js');
  return new Extractor(options);
}

/**
 * 等待 Promise（用于异步测试）
 */
export function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 比较两个文本是否相似（忽略空格差异）
 */
export function textSimilar(text1, text2, threshold = 0.9) {
  const normalize = text => text.replace(/\s+/g, ' ').trim().toLowerCase();
  const t1 = normalize(text1);
  const t2 = normalize(text2);
  
  if (t1 === t2) return true;
  
  // 计算相似度（简单的字符匹配）
  const maxLen = Math.max(t1.length, t2.length);
  let matches = 0;
  for (let i = 0; i < Math.min(t1.length, t2.length); i++) {
    if (t1[i] === t2[i]) matches++;
  }
  
  return matches / maxLen >= threshold;
}

