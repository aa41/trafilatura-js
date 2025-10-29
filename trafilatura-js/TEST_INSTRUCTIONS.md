# 🚀 Trafilatura.js 测试说明

## ⚠️ 重要提示

**全局变量名是 `Trafilatura`（首字母大写）**，不是 `trafilatura`！

```javascript
// ✅ 正确
await Trafilatura.extract(html, options);

// ❌ 错误
await trafilatura.extract(html, options);
```

---

## 🎯 快速开始

### 1. 构建项目

```bash
cd /Users/mxc/coding/trafilatura/trafilatura-js
npm run build
```

### 2. 运行HTML测试

```bash
# 方法1：直接打开
open examples/test-all-formats.html

# 方法2：使用Web服务器
python3 -m http.server 8000
# 然后访问 http://localhost:8000/examples/test-all-formats.html
```

---

## 📖 使用方法

### 在浏览器中

```html
<!-- 引入UMD构建 -->
<script src="../dist/trafilatura.umd.js"></script>

<script>
  // 全局变量是 Trafilatura（首字母大写）
  const result = await Trafilatura.extract(html, {
    output_format: 'markdown',
    with_metadata: true,
  });
  
  console.log(result);
</script>
```

### 在控制台中测试

打开测试页面后，在浏览器控制台中：

```javascript
// 1. 查看可用API
console.log(Trafilatura);

// 2. 测试简单提取
const html = `
<!DOCTYPE html>
<html>
<head><title>测试</title></head>
<body>
  <article>
    <h1>标题</h1>
    <p>这是一段测试文本。</p>
  </article>
</body>
</html>
`;

const result = await Trafilatura.extract(html, {
  output_format: 'markdown'
});

console.log(result);
```

---

## 🎨 测试界面功能

### 格式切换
点击顶部的格式按钮切换输出格式：
- **Markdown** - CommonMark格式
- **XML-TEI** - TEI P5标准XML
- **JSON** - 结构化JSON数据
- **HTML** - 语义化HTML5
- **CSV** - RFC 4180标准CSV
- **TXT** - 纯文本

### 测试场景
点击测试卡片上的"运行测试"按钮：
- 简单博客文章
- 带表格的新闻
- 学术文章
- 带图片文章
- 复杂格式文章
- 当前页面测试

### 批量操作
- **运行所有测试** - 执行全部6个测试场景
- **清除结果** - 清空显示区域
- **性能测试** - 运行性能基准测试
- **格式对比** - 并排显示所有格式

---

## 🔧 API 参考

### extract(html, options)

提取HTML内容并格式化输出。

**参数**：
- `html` (string) - HTML字符串
- `options` (object) - 配置选项
  - `output_format` (string) - 输出格式：'txt', 'markdown', 'xml', 'json', 'html', 'csv'
  - `with_metadata` (boolean) - 是否包含元数据，默认false
  - `include_formatting` (boolean) - 是否保留格式，默认false
  - `include_links` (boolean) - 是否保留链接，默认false
  - `include_images` (boolean) - 是否包含图片，默认false
  - `include_comments` (boolean) - 是否包含评论，默认true

**返回值**：
- (string|null) - 格式化后的文本，失败返回null

**示例**：

```javascript
// Markdown格式
const md = await Trafilatura.extract(html, {
  output_format: 'markdown',
  with_metadata: true,
  include_formatting: true,
  include_links: true,
});

// XML-TEI格式
const xml = await Trafilatura.extract(html, {
  output_format: 'xml',
  with_metadata: true,
});

// JSON格式
const json = await Trafilatura.extract(html, {
  output_format: 'json',
  with_metadata: true,
});
```

---

## 📊 验证测试结果

### 预期输出

#### Markdown
```markdown
# 标题

段落文本...

- 列表项1
- 列表项2

> 引用内容
```

#### XML-TEI
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>...</fileDesc>
  </teiHeader>
  <text>
    <body>
      <head rend="h1">标题</head>
      <p>段落文本...</p>
    </body>
  </text>
</TEI>
```

#### JSON
```json
{
  "text": "完整文本...",
  "metadata": {
    "title": "标题",
    "author": "作者",
    ...
  }
}
```

---

## ⚡ 性能基准

预期性能（MacBook Pro, M1）：

| 格式 | 平均耗时 | 说明 |
|------|---------|------|
| TXT | 20-40ms | 最快 |
| Markdown | 40-80ms | 格式化开销 |
| JSON | 30-60ms | 结构化 |
| HTML | 50-100ms | DOM构建 |
| XML-TEI | 60-120ms | 完整结构 |
| CSV | 25-50ms | 简单格式 |

---

## 🐛 故障排除

### 问题1：trafilatura is not defined
**原因**：使用了错误的全局变量名
**解决**：使用 `Trafilatura`（首字母大写）

### 问题2：页面空白
**原因**：未构建或路径错误
**解决**：运行 `npm run build` 并检查文件路径

### 问题3：提取返回null
**原因**：HTML结构不符合要求
**解决**：确保HTML有 `<article>` 标签或足够内容

### 问题4：格式输出不正确
**原因**：配置选项问题
**解决**：检查 `output_format` 和其他选项

---

## 📝 注意事项

1. **文件路径**：确保 `dist/trafilatura.umd.js` 存在
2. **浏览器兼容**：需要支持ES6+的现代浏览器
3. **CORS**：使用Web服务器而不是file://协议
4. **console**：打开浏览器控制台查看详细日志

---

## 🎓 进阶使用

### 自定义测试

```javascript
// 创建自己的测试HTML
const myHtml = `
<!DOCTYPE html>
<html>
<head><title>我的测试</title></head>
<body>
  <article>
    <h1>自定义标题</h1>
    <p>自定义内容...</p>
    <ul>
      <li>项目1</li>
      <li>项目2</li>
    </ul>
  </article>
</body>
</html>
`;

// 测试所有格式
const formats = ['markdown', 'xml', 'json', 'html', 'csv', 'txt'];

for (const format of formats) {
  const result = await Trafilatura.extract(myHtml, {
    output_format: format,
    with_metadata: true,
  });
  
  console.log(`\n=== ${format.toUpperCase()} ===`);
  console.log(result);
}
```

### 性能测试

```javascript
// 测试性能
const iterations = 100;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  await Trafilatura.extract(html, { output_format: 'markdown' });
}

const end = performance.now();
const avg = (end - start) / iterations;

console.log(`Average time: ${avg.toFixed(2)}ms`);
```

---

**版本**: 0.1.0  
**最后更新**: 2025-10-29  
**状态**: ✅ 就绪

