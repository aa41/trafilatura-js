/**
 * 测试用例的样本文章数据
 */

export const simpleArticle = {
  html: `
    <html>
      <head><title>简单测试</title></head>
      <body>
        <article>
          <h1>测试标题</h1>
          <p>这是第一段内容。</p>
          <p>这是第二段内容。</p>
        </article>
      </body>
    </html>
  `,
  expected: {
    title: '测试标题',
    text: '这是第一段内容。 这是第二段内容。',
  },
};

export const articleWithMetadata = {
  html: `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="author" content="张三">
      <meta name="description" content="这是一篇关于测试的文章">
      <meta property="og:title" content="测试文章">
      <meta property="og:type" content="article">
      <meta property="og:url" content="https://example.com/article">
      <title>测试文章 - 测试网站</title>
    </head>
    <body>
      <article>
        <h1>测试文章</h1>
        <p>文章内容。</p>
      </article>
    </body>
    </html>
  `,
  expected: {
    title: '测试文章',
    author: '张三',
    description: '这是一篇关于测试的文章',
    url: 'https://example.com/article',
  },
};

export const articleWithLists = {
  html: `
    <html>
      <body>
        <article>
          <h2>列表测试</h2>
          <ul>
            <li>项目1</li>
            <li>项目2</li>
            <li>项目3</li>
          </ul>
          <ol>
            <li>步骤1</li>
            <li>步骤2</li>
          </ol>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasLists: true,
    listItems: ['项目1', '项目2', '项目3', '步骤1', '步骤2'],
  },
};

export const articleWithTable = {
  html: `
    <html>
      <body>
        <article>
          <h2>数据对比</h2>
          <table>
            <thead>
              <tr>
                <th>项目</th>
                <th>数值</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>100</td>
              </tr>
              <tr>
                <td>B</td>
                <td>200</td>
              </tr>
            </tbody>
          </table>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasTable: true,
    tableData: [
      ['项目', '数值'],
      ['A', '100'],
      ['B', '200'],
    ],
  },
};

export const articleWithQuotes = {
  html: `
    <html>
      <body>
        <article>
          <h2>引用测试</h2>
          <p>正文内容。</p>
          <blockquote>
            <p>这是一段引用。</p>
          </blockquote>
          <p>更多内容。</p>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasQuote: true,
    quoteText: '这是一段引用。',
  },
};

export const articleWithCode = {
  html: `
    <html>
      <body>
        <article>
          <h2>代码示例</h2>
          <p>以下是代码：</p>
          <pre><code>
function test() {
  return true;
}
          </code></pre>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasCode: true,
    codeContent: 'function test()',
  },
};

export const articleWithComments = {
  html: `
    <html>
      <body>
        <article>
          <h1>主文章</h1>
          <p>文章内容。</p>
        </article>
        <section class="comments">
          <h3>评论</h3>
          <div class="comment">
            <p class="author">用户A</p>
            <p class="content">很好的文章！</p>
          </div>
          <div class="comment">
            <p class="author">用户B</p>
            <p class="content">学到了很多。</p>
          </div>
        </section>
      </body>
    </html>
  `,
  expected: {
    hasComments: true,
    commentCount: 2,
    comments: ['很好的文章！', '学到了很多。'],
  },
};

export const noisyArticle = {
  html: `
    <html>
      <body>
        <div class="advertisement">广告内容</div>
        <nav>
          <a href="/">首页</a>
          <a href="/about">关于</a>
        </nav>
        <article>
          <h1>真实标题</h1>
          <p>真实内容段落1。</p>
          <div class="social-share">
            <button>Facebook</button>
            <button>Twitter</button>
          </div>
          <p>真实内容段落2。</p>
        </article>
        <aside class="sidebar">
          <div class="ad">侧边栏广告</div>
          <div class="widget">小工具</div>
        </aside>
        <footer>
          <p>版权信息</p>
        </footer>
      </body>
    </html>
  `,
  expected: {
    title: '真实标题',
    text: '真实内容段落1。 真实内容段落2。',
    shouldNotContain: ['广告', '首页', '关于', 'Facebook', 'Twitter', '版权信息'],
  },
};

export const articleWithImages = {
  html: `
    <html>
      <body>
        <article>
          <h1>图片测试</h1>
          <p>这是一篇包含图片的文章。</p>
          <figure>
            <img src="https://example.com/image1.jpg" alt="示例图片1" />
            <figcaption>图片说明</figcaption>
          </figure>
          <p>更多内容。</p>
          <img src="https://example.com/image2.png" alt="示例图片2" title="图片标题" />
        </article>
      </body>
    </html>
  `,
  expected: {
    hasImages: true,
    imageCount: 2,
    images: [
      { src: 'https://example.com/image1.jpg', alt: '示例图片1' },
      { src: 'https://example.com/image2.png', alt: '示例图片2', title: '图片标题' },
    ],
  },
};

export const articleWithLinks = {
  html: `
    <html>
      <body>
        <article>
          <h1>链接测试</h1>
          <p>访问 <a href="https://example.com">示例网站</a> 了解更多。</p>
          <p>还可以查看 <a href="/related">相关文章</a>。</p>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasLinks: true,
    links: [
      { href: 'https://example.com', text: '示例网站' },
      { href: '/related', text: '相关文章' },
    ],
  },
};

export const articleWithFormatting = {
  html: `
    <html>
      <body>
        <article>
          <h1>格式化测试</h1>
          <p>这是 <strong>加粗文本</strong> 和 <em>斜体文本</em>。</p>
          <p>还有 <u>下划线</u> 和 <del>删除线</del>。</p>
          <p>上标：H<sub>2</sub>O，下标：X<sup>2</sup>。</p>
        </article>
      </body>
    </html>
  `,
  expected: {
    hasFormatting: true,
    formatted: ['加粗文本', '斜体文本', '下划线', '删除线'],
  },
};

export const emptyArticle = {
  html: `
    <html>
      <body>
        <article></article>
      </body>
    </html>
  `,
  expected: {
    text: null,
    title: null,
  },
};

export const malformedHTML = {
  html: `
    <html>
      <body>
        <article>
          <h1>测试<h1>
          <p>段落1
          <p>段落2</p>
        </article>
    </html>
  `,
  expected: {
    shouldHandleGracefully: true,
  },
};

// 真实网页示例（简化版）
export const realWorldExample = {
  html: `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="author" content="技术博客">
      <meta name="description" content="深入探讨现代 JavaScript 框架的发展趋势">
      <meta property="og:title" content="JavaScript 框架演进史">
      <meta property="og:description" content="从 jQuery 到 React、Vue、Angular">
      <meta property="og:image" content="https://blog.example.com/images/js-frameworks.jpg">
      <meta property="og:url" content="https://blog.example.com/js-frameworks">
      <title>JavaScript 框架演进史 | 技术博客</title>
    </head>
    <body>
      <header class="site-header">
        <div class="logo">技术博客</div>
        <nav>
          <a href="/">首页</a>
          <a href="/articles">文章</a>
          <a href="/about">关于</a>
        </nav>
      </header>

      <main>
        <article class="post-content">
          <header class="post-header">
            <h1>JavaScript 框架演进史</h1>
            <div class="post-meta">
              <span class="author">作者：技术博客</span>
              <time datetime="2024-01-15">2024年1月15日</time>
              <span class="reading-time">阅读时间：5分钟</span>
            </div>
            <div class="tags">
              <a href="/tag/javascript">JavaScript</a>
              <a href="/tag/framework">框架</a>
              <a href="/tag/frontend">前端</a>
            </div>
          </header>

          <div class="post-body">
            <p class="lead">JavaScript 框架的发展历史反映了 Web 开发技术的进化。从最初的 jQuery 到现代的三大框架，每一次变革都带来了新的开发范式。</p>

            <h2>早期时代：jQuery 的统治</h2>
            <p>在 2006 年，jQuery 的出现彻底改变了 JavaScript 开发。它简化了 DOM 操作，解决了浏览器兼容性问题。</p>

            <h2>现代框架的崛起</h2>
            <h3>React</h3>
            <p>Facebook 在 2013 年开源了 React，引入了虚拟 DOM 和组件化的概念。</p>
            
            <h3>Vue</h3>
            <p>Vue.js 由尤雨溪创建，以其简单易学和渐进式的特点受到欢迎。</p>

            <h3>Angular</h3>
            <p>Google 的 Angular 提供了完整的企业级解决方案。</p>

            <h2>技术对比</h2>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>框架</th>
                  <th>发布年份</th>
                  <th>特点</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>React</td>
                  <td>2013</td>
                  <td>虚拟DOM、组件化</td>
                </tr>
                <tr>
                  <td>Vue</td>
                  <td>2014</td>
                  <td>渐进式、易学</td>
                </tr>
                <tr>
                  <td>Angular</td>
                  <td>2016</td>
                  <td>完整方案、TypeScript</td>
                </tr>
              </tbody>
            </table>

            <blockquote>
              <p>"选择合适的框架比追逐最新的框架更重要。" - 匿名开发者</p>
            </blockquote>

            <h2>未来展望</h2>
            <p>随着 Web 标准的不断完善，未来的框架将更加注重性能和开发体验。</p>

            <figure>
              <img src="https://blog.example.com/images/framework-timeline.jpg" alt="框架发展时间线" />
              <figcaption>主流 JavaScript 框架发展时间线</figcaption>
            </figure>
          </div>
        </article>

        <aside class="related-posts">
          <h3>相关文章</h3>
          <ul>
            <li><a href="/react-basics">React 基础入门</a></li>
            <li><a href="/vue-guide">Vue 完全指南</a></li>
          </ul>
        </aside>

        <section class="comments-section">
          <h3>评论 (2)</h3>
          <div class="comment">
            <div class="comment-author">开发者A</div>
            <div class="comment-date">2024-01-16</div>
            <div class="comment-content">
              <p>写得很全面，对框架历史有了更深的理解。</p>
            </div>
          </div>
          <div class="comment">
            <div class="comment-author">开发者B</div>
            <div class="comment-date">2024-01-17</div>
            <div class="comment-content">
              <p>期待更多前端技术分享！</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="footer-content">
          <p>&copy; 2024 技术博客. All rights reserved.</p>
          <nav class="footer-nav">
            <a href="/privacy">隐私政策</a>
            <a href="/terms">服务条款</a>
            <a href="/contact">联系我们</a>
          </nav>
        </div>
      </footer>
    </body>
    </html>
  `,
  expected: {
    title: 'JavaScript 框架演进史',
    author: '技术博客',
    date: '2024-01-15',
    description: '深入探讨现代 JavaScript 框架的发展趋势',
    url: 'https://blog.example.com/js-frameworks',
    tags: ['JavaScript', '框架', '前端'],
    hasTable: true,
    hasQuote: true,
    hasComments: true,
    commentCount: 2,
    mainContent: [
      'JavaScript 框架的发展历史',
      'jQuery 的统治',
      '现代框架的崛起',
      'React',
      'Vue',
      'Angular',
    ],
  },
};

