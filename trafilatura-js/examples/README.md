# Trafilatura.js 示例和测试

本目录包含各种示例和集成测试文件。

## 📋 文件说明

### 测试文件

#### `test-all-formats.html` ⭐⭐⭐⭐⭐
**完整的浏览器集成测试套件**

**功能特性**：
- ✅ 真实浏览器环境测试
- ✅ 所有6种格式化器测试
- ✅ 6个预设测试场景
- ✅ 实时性能监控
- ✅ 可视化测试结果
- ✅ 格式对比功能
- ✅ 性能基准测试
- ✅ 美观的UI界面

**测试场景**：
1. 简单博客文章
2. 带表格的新闻
3. 学术文章
4. 带图片文章
5. 复杂格式文章
6. 当前页面测试

**使用方法**：
```bash
# 1. 确保已构建
npm run build

# 2. 在浏览器中打开
open examples/test-all-formats.html
# 或者用任何Web服务器
python3 -m http.server 8000
# 然后访问 http://localhost:8000/examples/test-all-formats.html
```

**功能说明**：

1. **格式切换**：点击顶部格式按钮（Markdown, XML-TEI, JSON, HTML, CSV, TXT）
2. **单个测试**：点击测试卡片上的"运行测试"按钮
3. **批量测试**：点击"运行所有测试"执行全部场景
4. **性能测试**：点击"性能测试"运行基准测试
5. **格式对比**：点击"格式对比"查看所有格式的输出差异

**测试指标**：
- 总测试数
- 通过数量
- 失败数量
- 平均耗时

#### `basic-usage.html`
**基础使用示例**

简单的入门示例，展示最基本的用法。

---

## 🚀 快速开始

### 方法1：直接打开（推荐）

如果已经构建了项目：

```bash
# 1. 构建
cd trafilatura-js
npm run build

# 2. 打开测试文件
open examples/test-all-formats.html
```

### 方法2：使用Web服务器

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

然后访问：`http://localhost:8000/examples/test-all-formats.html`

---

## 📊 测试场景详解

### 1. 简单博客文章
**测试内容**：
- ✅ 标题提取（h1, h2）
- ✅ 段落处理
- ✅ 无序列表（ul/li）
- ✅ 有序列表（ol/li）
- ✅ 引用块（blockquote）
- ✅ 代码块（pre/code）

**适用格式**：所有格式

### 2. 带表格的新闻
**测试内容**：
- ✅ 表格提取（table/thead/tbody）
- ✅ 表头识别（th）
- ✅ 单元格内容（td）

**适用格式**：Markdown, XML-TEI, HTML, JSON

### 3. 学术文章
**测试内容**：
- ✅ 结构化内容（摘要、引言、结论）
- ✅ 参考文献列表
- ✅ 引用处理
- ✅ 关键词提取

**适用格式**：XML-TEI（最佳）, Markdown, JSON

### 4. 带图片文章
**测试内容**：
- ✅ 图片src提取
- ✅ alt文本处理
- ✅ figcaption处理

**适用格式**：Markdown, XML-TEI, HTML

### 5. 复杂格式文章
**测试内容**：
- ✅ 嵌套列表
- ✅ 内联格式（粗体、斜体、删除线）
- ✅ 内联代码
- ✅ 代码块
- ✅ 链接处理
- ✅ 水平线

**适用格式**：Markdown（最佳）, HTML

### 6. 当前页面测试
**测试内容**：
- ✅ 提取当前HTML页面
- ✅ 测试自我提取能力

**适用格式**：所有格式

---

## 🎯 测试检查清单

### Markdown格式 ✅
- [ ] 标题格式（# ## ###）
- [ ] 列表格式（- 1.）
- [ ] 引用格式（>）
- [ ] 代码块格式（```）
- [ ] 链接格式（[text](url)）
- [ ] 图片格式（![alt](src)）
- [ ] YAML front matter

### XML-TEI格式 ✅
- [ ] XML声明
- [ ] TEI命名空间
- [ ] teiHeader结构
- [ ] fileDesc完整性
- [ ] 元素映射正确性
- [ ] 格式良好性

### JSON格式 ✅
- [ ] 有效的JSON
- [ ] text字段存在
- [ ] metadata包含
- [ ] structured数据

### HTML格式 ✅
- [ ] DOCTYPE声明
- [ ] HTML5标签
- [ ] meta标签
- [ ] 语义化标签

### CSV格式 ✅
- [ ] 标题行
- [ ] 字段转义
- [ ] RFC 4180符合

### TXT格式 ✅
- [ ] 纯文本输出
- [ ] 元数据头部（可选）
- [ ] 内容完整性

---

## 📈 性能基准

### 预期性能指标

| 格式 | 平均耗时 | 备注 |
|------|---------|------|
| TXT | < 50ms | 最快 |
| Markdown | < 100ms | 格式化开销 |
| JSON | < 80ms | 结构化开销 |
| HTML | < 120ms | DOM构建 |
| XML-TEI | < 150ms | 最完整的结构 |
| CSV | < 60ms | 简单格式 |

### 性能优化建议

1. **缓存DOM解析结果**
2. **批量处理时复用Document对象**
3. **大文档考虑分块处理**
4. **Production环境使用压缩版本**

---

## 🐛 调试技巧

### 1. 查看浏览器控制台
```javascript
// 在控制台中直接测试
const result = await trafilatura.extract(html, {
  output_format: 'markdown'
});
console.log(result);
```

### 2. 查看完整API
```javascript
console.log(trafilatura);
// 输出所有可用的函数和类
```

### 3. 单步调试
在浏览器开发者工具中设置断点：
- Sources标签
- 找到trafilatura.umd.js
- 设置断点
- 重新运行测试

---

## 💡 进阶用法

### 自定义测试HTML

在测试页面的控制台中：

```javascript
// 自定义HTML测试
const myHtml = `
<!DOCTYPE html>
<html>
<head><title>我的测试</title></head>
<body>
  <article>
    <h1>自定义标题</h1>
    <p>自定义内容</p>
  </article>
</body>
</html>
`;

const result = await trafilatura.extract(myHtml, {
  output_format: 'markdown',
  with_metadata: true,
  include_formatting: true,
  include_links: true,
  include_images: true,
});

console.log(result);
```

### 配置选项测试

```javascript
// 测试不同配置
const options = [
  { output_format: 'markdown', with_metadata: false },
  { output_format: 'markdown', with_metadata: true },
  { output_format: 'xml', with_metadata: true },
  { output_format: 'json', include_structure: true },
];

for (const opt of options) {
  const result = await trafilatura.extract(html, opt);
  console.log(opt, result.length);
}
```

---

## 📝 问题排查

### 常见问题

#### 1. 页面显示空白
**原因**：未构建或构建文件路径不对
**解决**：
```bash
npm run build
# 确保 dist/trafilatura.umd.js 存在
```

#### 2. 测试报错：trafilatura is not defined
**原因**：构建文件未加载
**解决**：检查script标签路径，确保相对路径正确

#### 3. 提取结果为null
**原因**：HTML结构不符合提取要求
**解决**：确保HTML中有<article>标签或足够的内容

#### 4. 格式不符合预期
**原因**：配置选项问题
**解决**：检查output_format和其他选项是否正确

---

## 🎓 学习资源

### 相关文档
- [主README](../README.md)
- [开发指南](../DEVELOPMENT.md)
- [测试文档](../TESTING.md)
- [阶段5完成报告](../PHASE5_COMPLETE.md)

### 在线示例
运行测试套件后，可以：
1. 查看各种格式的实际输出
2. 对比不同格式的差异
3. 测试性能表现
4. 验证功能完整性

---

## 🚀 下一步

完成测试后，你可以：

1. **查看测试结果** - 了解每种格式的输出
2. **性能分析** - 运行性能测试查看各格式耗时
3. **格式对比** - 并排比较不同格式
4. **自定义测试** - 使用自己的HTML进行测试
5. **集成到项目** - 参考示例集成到你的应用

---

**创建日期**: 2025-10-29  
**最后更新**: 2025-10-29  
**版本**: 1.0.0

