/**
 * 测试用HTML样本集
 * 涵盖各种真实场景
 */

/**
 * 简单博客文章
 */
export const SIMPLE_BLOG_POST = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>如何学习JavaScript</title>
  <meta name="author" content="张三">
  <meta name="description" content="本文介绍JavaScript学习路径和最佳实践">
  <meta name="date" content="2023-06-15">
</head>
<body>
  <article>
    <header>
      <h1>如何学习JavaScript</h1>
      <p class="meta">
        <span class="author">张三</span>
        <time datetime="2023-06-15">2023年6月15日</time>
      </p>
    </header>
    
    <main>
      <p>JavaScript是现代Web开发中最重要的编程语言之一。本文将介绍如何系统地学习JavaScript。</p>
      
      <h2>基础知识</h2>
      <p>首先，你需要掌握以下基础概念：</p>
      <ul>
        <li>变量和数据类型</li>
        <li>函数和作用域</li>
        <li>对象和数组</li>
        <li>异步编程</li>
      </ul>
      
      <h2>学习路径</h2>
      <p>推荐的学习顺序如下：</p>
      <ol>
        <li>学习HTML和CSS基础</li>
        <li>掌握JavaScript核心语法</li>
        <li>理解DOM操作</li>
        <li>学习现代框架（React、Vue等）</li>
      </ol>
      
      <blockquote>
        <p>编程是一项需要持续练习的技能。</p>
      </blockquote>
      
      <h2>实践建议</h2>
      <p>理论学习之外，实践非常重要。建议每天编写代码，参与开源项目。</p>
      
      <pre><code class="language-javascript">
// 示例代码
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
      </code></pre>
    </main>
  </article>
</body>
</html>
`;

/**
 * 带表格的新闻文章
 */
export const NEWS_WITH_TABLE = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>2023年科技发展报告</title>
  <meta name="author" content="李四">
  <meta property="og:title" content="2023年科技发展报告">
  <meta property="og:description" content="年度科技趋势分析">
  <meta property="og:url" content="https://example.com/tech-report-2023">
</head>
<body>
  <article>
    <h1>2023年科技发展报告</h1>
    
    <p>本报告总结了2023年科技领域的主要发展趋势。</p>
    
    <h2>主要技术领域</h2>
    <table>
      <thead>
        <tr>
          <th>技术领域</th>
          <th>增长率</th>
          <th>市场规模</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>人工智能</td>
          <td>45%</td>
          <td>$500B</td>
        </tr>
        <tr>
          <td>云计算</td>
          <td>32%</td>
          <td>$800B</td>
        </tr>
        <tr>
          <td>物联网</td>
          <td>28%</td>
          <td>$300B</td>
        </tr>
      </tbody>
    </table>
    
    <p>从表格可以看出，人工智能增长最快。</p>
    
    <h2>未来展望</h2>
    <p>预计未来五年，这些技术将继续保持高速增长。</p>
  </article>
</body>
</html>
`;

/**
 * 带图片的文章
 */
export const ARTICLE_WITH_IMAGES = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>美丽的自然风光</title>
  <meta name="author" content="王五">
</head>
<body>
  <article>
    <h1>美丽的自然风光</h1>
    
    <p>大自然的美景总是令人惊叹。</p>
    
    <figure>
      <img src="https://example.com/mountain.jpg" alt="壮丽的山峰">
      <figcaption>高耸入云的雪山</figcaption>
    </figure>
    
    <p>这张照片拍摄于喜马拉雅山脉。</p>
    
    <h2>海洋之美</h2>
    <figure>
      <img src="https://example.com/ocean.jpg" alt="蔚蓝的海洋">
      <figcaption>清澈的海水</figcaption>
    </figure>
    
    <p>海洋覆盖了地球表面的70%。</p>
  </article>
</body>
</html>
`;

/**
 * 带评论的文章
 */
export const ARTICLE_WITH_COMMENTS = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>产品评测：iPhone 15</title>
</head>
<body>
  <article>
    <h1>产品评测：iPhone 15</h1>
    <p>本文详细评测iPhone 15的各项性能。</p>
    
    <h2>设计</h2>
    <p>iPhone 15采用全新的钛金属边框，重量更轻。</p>
    
    <h2>性能</h2>
    <p>搭载A17 Pro芯片，性能提升显著。</p>
  </article>
  
  <section class="comments">
    <h2>用户评论</h2>
    
    <div class="comment">
      <p class="author">用户A</p>
      <p>很不错的评测，写得很详细！</p>
    </div>
    
    <div class="comment">
      <p class="author">用户B</p>
      <p>价格还是太贵了。</p>
    </div>
    
    <div class="comment">
      <p class="author">用户C</p>
      <p>期待真机体验。</p>
    </div>
  </section>
</body>
</html>
`;

/**
 * 学术文章（适合TEI格式）
 */
export const ACADEMIC_ARTICLE = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>深度学习在自然语言处理中的应用</title>
  <meta name="author" content="张教授">
  <meta name="date" content="2023-08-20">
  <meta name="keywords" content="深度学习, NLP, 神经网络">
</head>
<body>
  <article>
    <h1>深度学习在自然语言处理中的应用</h1>
    
    <h2>摘要</h2>
    <p>本文综述了深度学习技术在自然语言处理领域的最新进展，重点介绍了Transformer架构及其变体。</p>
    
    <h2>1. 引言</h2>
    <p>自然语言处理（NLP）是人工智能的重要分支。近年来，深度学习技术的发展极大地推动了NLP的进步。</p>
    
    <h2>2. 相关工作</h2>
    <p>早期的NLP方法主要基于规则和统计模型。2018年，BERT模型的提出标志着预训练语言模型时代的到来。</p>
    
    <blockquote cite="Brown et al., 2020">
      <p>大规模语言模型展现出了惊人的few-shot学习能力。</p>
    </blockquote>
    
    <h2>3. 方法</h2>
    <p>我们采用以下方法进行实验：</p>
    <ul>
      <li>数据预处理</li>
      <li>模型训练</li>
      <li>性能评估</li>
    </ul>
    
    <h2>4. 结论</h2>
    <p>实验结果表明，深度学习方法在多项NLP任务上取得了最优性能。</p>
    
    <h2>参考文献</h2>
    <ol>
      <li>Vaswani et al. (2017). Attention is All You Need.</li>
      <li>Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers.</li>
      <li>Brown et al. (2020). Language Models are Few-Shot Learners.</li>
    </ol>
  </article>
</body>
</html>
`;

/**
 * 复杂格式的文章
 */
export const COMPLEX_FORMAT_ARTICLE = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>Markdown语法完全指南</title>
  <meta name="author" content="赵六">
  <meta name="description" content="详细介绍Markdown的各种语法">
  <meta name="categories" content="技术,文档">
  <meta name="tags" content="Markdown,写作,格式化">
</head>
<body>
  <article>
    <h1>Markdown语法完全指南</h1>
    
    <p>Markdown是一种轻量级标记语言，广泛用于文档编写。</p>
    
    <h2>文本格式化</h2>
    <p>Markdown支持<strong>粗体</strong>、<em>斜体</em>和<del>删除线</del>。</p>
    
    <h3>代码</h3>
    <p>内联代码使用<code>反引号</code>包围。</p>
    
    <p>代码块示例：</p>
    <pre><code class="language-python">
def hello_world():
    print("Hello, World!")
    return True
    </code></pre>
    
    <h2>列表</h2>
    
    <h3>无序列表</h3>
    <ul>
      <li>项目一</li>
      <li>项目二
        <ul>
          <li>子项目2.1</li>
          <li>子项目2.2</li>
        </ul>
      </li>
      <li>项目三</li>
    </ul>
    
    <h3>有序列表</h3>
    <ol>
      <li>第一步</li>
      <li>第二步</li>
      <li>第三步</li>
    </ol>
    
    <h2>引用</h2>
    <blockquote>
      <p>这是一段引用文字。</p>
      <p>可以包含多个段落。</p>
    </blockquote>
    
    <h2>链接</h2>
    <p>访问<a href="https://example.com">我的网站</a>了解更多。</p>
    
    <h2>分隔线</h2>
    <hr>
    
    <p>以上就是Markdown的基本语法。</p>
  </article>
</body>
</html>
`;

/**
 * 简短文章（测试最小内容）
 */
export const SHORT_ARTICLE = `
<!DOCTYPE html>
<html>
<head>
  <title>简短通知</title>
</head>
<body>
  <h1>网站维护通知</h1>
  <p>本站将于明天进行系统维护，预计持续2小时。</p>
</body>
</html>
`;

/**
 * 空文章（边界测试）
 */
export const EMPTY_ARTICLE = `
<!DOCTYPE html>
<html>
<head>
  <title>空页面</title>
</head>
<body>
</body>
</html>
`;

/**
 * 带JSON-LD的文章
 */
export const ARTICLE_WITH_JSON_LD = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>美食推荐：北京烤鸭</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "美食推荐：北京烤鸭",
    "author": {
      "@type": "Person",
      "name": "美食家"
    },
    "datePublished": "2023-09-01",
    "articleBody": "北京烤鸭是中国的传统名菜，以其独特的烹饪技艺和鲜美的口感闻名于世。"
  }
  </script>
</head>
<body>
  <article>
    <h1>美食推荐：北京烤鸭</h1>
    <p>北京烤鸭是中国的传统名菜，以其独特的烹饪技艺和鲜美的口感闻名于世。</p>
    
    <h2>历史渊源</h2>
    <p>烤鸭的历史可以追溯到明朝时期。</p>
    
    <h2>制作工艺</h2>
    <p>传统的北京烤鸭需要经过多道工序：</p>
    <ol>
      <li>选鸭：选用优质北京填鸭</li>
      <li>处理：清洗并风干</li>
      <li>烤制：挂炉烤制约40分钟</li>
      <li>片鸭：刀工讲究，薄而完整</li>
    </ol>
    
    <h2>品尝方式</h2>
    <p>烤鸭通常搭配荷叶饼、葱丝和甜面酱一起食用。</p>
  </article>
</body>
</html>
`;

// 导出所有样本
export const ALL_SAMPLES = {
  SIMPLE_BLOG_POST,
  NEWS_WITH_TABLE,
  ARTICLE_WITH_IMAGES,
  ARTICLE_WITH_COMMENTS,
  ACADEMIC_ARTICLE,
  COMPLEX_FORMAT_ARTICLE,
  SHORT_ARTICLE,
  EMPTY_ARTICLE,
  ARTICLE_WITH_JSON_LD,
};

export default ALL_SAMPLES;

