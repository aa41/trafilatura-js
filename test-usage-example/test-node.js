/**
 * Node.js 环境测试
 * 演示如何在 Node.js 项目中使用 trafilatura-browser
 */

// 方法1：如果使用 npm link
// import { extract, bareExtraction } from 'trafilatura-browser';

// 方法2：直接引用源码（开发阶段）
import { extract, bareExtraction, extractMetadata } from '../trafilatura-browser/src/index.js';

// 测试 HTML
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="author" content="张三">
  <meta name="description" content="这是一篇测试文章">
  <title>测试文章标题</title>
</head>
<body>
  <header>
    <nav>导航菜单</nav>
  </header>
  
  <article>
    <h1>主标题：JavaScript 内容提取技术</h1>
    <p class="meta">发布时间：2025-10-31 | 作者：张三</p>
    
    <p>这是文章的第一段内容。介绍了内容提取的重要性。</p>
    
    <h2>第一节：为什么需要内容提取</h2>
    <p>在网页抓取和数据分析中，我们经常需要从HTML中提取主要内容。</p>
    <p>传统方法往往会包含大量噪声数据，如广告、导航栏等。</p>
    
    <h2>第二节：Trafilatura 的优势</h2>
    <ul>
      <li>智能识别主要内容</li>
      <li>过滤广告和导航</li>
      <li>提取完整元数据</li>
    </ul>
    
    <blockquote>
      "好的工具能让工作事半功倍" - 某位智者
    </blockquote>
    
    <p>最后一段总结内容。</p>
  </article>
  
  <aside>
    <h3>相关文章</h3>
    <ul>
      <li>文章1</li>
      <li>文章2</li>
    </ul>
  </aside>
  
  <footer>
    版权所有 © 2025
  </footer>
</body>
</html>
`;

console.log('='.repeat(80));
console.log('Trafilatura-Browser 测试');
console.log('='.repeat(80));
console.log();

// 测试1：基础提取（Markdown格式）
console.log('【测试1】基础提取（Markdown）');
console.log('-'.repeat(80));
try {
  const markdown = extract(testHtml);
  console.log(markdown);
} catch (error) {
  console.error('错误:', error.message);
}
console.log();

// 测试2：纯文本格式
console.log('【测试2】纯文本格式');
console.log('-'.repeat(80));
try {
  const plainText = extract(testHtml, {
    outputFormat: 'txt'
  });
  console.log(plainText);
} catch (error) {
  console.error('错误:', error.message);
}
console.log();

// 测试3：带元数据的完整提取
console.log('【测试3】完整文档提取（带元数据）');
console.log('-'.repeat(80));
try {
  const doc = bareExtraction(testHtml, {
    withMetadata: true
  });
  
  console.log('标题:', doc.title || '未提取到');
  console.log('作者:', doc.author || '未提取到');
  console.log('日期:', doc.date || '未提取到');
  console.log('描述:', doc.description || '未提取到');
  console.log('URL:', doc.url || '未提取到');
  console.log();
  console.log('正文内容:');
  console.log(doc.text || '未提取到内容');
} catch (error) {
  console.error('错误:', error.message);
}
console.log();

// 测试4：仅提取元数据
console.log('【测试4】仅提取元数据');
console.log('-'.repeat(80));
try {
  const metadata = extractMetadata(testHtml, 'https://example.com/test-article');
  console.log(JSON.stringify(metadata, null, 2));
} catch (error) {
  console.error('错误:', error.message);
}
console.log();

// 测试5：JSON 格式输出
console.log('【测试5】JSON 格式输出');
console.log('-'.repeat(80));
try {
  const jsonOutput = extract(testHtml, {
    outputFormat: 'json',
    withMetadata: true
  });
  const jsonData = JSON.parse(jsonOutput);
  console.log(JSON.stringify(jsonData, null, 2));
} catch (error) {
  console.error('错误:', error.message);
}
console.log();

// 测试6：配置选项测试
console.log('【测试6】自定义配置');
console.log('-'.repeat(80));
try {
  const customResult = extract(testHtml, {
    outputFormat: 'markdown',
    withMetadata: true,
    formatting: true,
    links: true,
    images: true,
    tables: true,
    focus: 'precision',
    minExtractedSize: 50
  });
  console.log(customResult);
} catch (error) {
  console.error('错误:', error.message);
}

console.log();
console.log('='.repeat(80));
console.log('测试完成！');
console.log('='.repeat(80));

