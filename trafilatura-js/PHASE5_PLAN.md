# 阶段5：多种输出格式支持

## 📅 开始时间
2025-10-29

## 🎯 目标

实现多种输出格式，满足不同使用场景的需求：
- ✅ 纯文本（TXT）- 已有基础实现
- ✅ JSON - 已有基础实现
- ✅ CSV - 已有基础实现
- ✅ HTML - 已有基础实现
- ⏳ XML-TEI - 需完整实现
- ⏳ Markdown - 需格式化增强

---

## 📊 当前状态

### 已实现格式（简化版）

| 格式 | 状态 | 完整度 | 位置 |
|------|------|--------|------|
| TXT | ✅ 基础版 | 60% | `core.js: xmlToTxt()` |
| JSON | ✅ 基础版 | 70% | `core.js: buildJsonOutput()` |
| CSV | ✅ 基础版 | 50% | `core.js: xmlToCsv()` |
| HTML | ✅ 基础版 | 60% | `html-processing.js: buildHtmlOutput()` |
| XML | ✅ 简化版 | 40% | `core.js: controlXmlOutput()` |
| Markdown | ❌ 未实现 | 0% | - |

### 需要完善的功能

#### 1. XML-TEI 格式
**当前问题**：
- 只有简化的XML输出
- 缺少TEI标准结构
- 没有元数据封装

**需要实现**：
- 完整的TEI-XML结构
- 标准的元数据头部
- 正确的元素映射
- Schema验证支持

#### 2. Markdown 格式
**当前问题**：
- 与TXT格式相同，没有Markdown语法
- 缺少格式化标记
- 链接和图片未处理

**需要实现**：
- 标题格式（#, ##, ###）
- 列表格式（-, *, 1.）
- 链接和图片语法
- 代码块格式
- 引用块格式
- 粗体/斜体支持

#### 3. HTML 格式
**当前需求**：
- 语义化HTML5
- CSS类支持
- 可读性优化

#### 4. JSON 格式
**当前需求**：
- 完整的结构化数据
- 嵌套内容支持
- 元数据整合

#### 5. CSV 格式
**当前需求**：
- 正确的字段转义
- 多列支持
- 标准RFC 4180格式

---

## 🏗️ 架构设计

### 模块结构

```
src/
  ├── formats/              # 新增：格式化模块
  │   ├── index.js         # 格式导出
  │   ├── xml-tei.js       # XML-TEI输出
  │   ├── markdown.js      # Markdown输出
  │   ├── html.js          # HTML输出
  │   ├── json.js          # JSON输出
  │   ├── csv.js           # CSV输出
  │   └── txt.js           # 纯文本输出
  └── core.js              # 主流程（调用formats）
```

### 格式转换流程

```
Document对象
    ↓
format选择器
    ↓
    ├─→ XML-TEI → xmlTeiFormatter → TEI-XML字符串
    ├─→ Markdown → markdownFormatter → Markdown字符串
    ├─→ HTML → htmlFormatter → HTML字符串
    ├─→ JSON → jsonFormatter → JSON字符串
    ├─→ CSV → csvFormatter → CSV字符串
    └─→ TXT → txtFormatter → 纯文本字符串
```

---

## 📋 实施计划

### 第一步：创建格式化模块架构 ⏰ 30分钟

#### 1.1 创建基础结构
- [ ] 创建 `src/formats/` 目录
- [ ] 创建基础格式化接口
- [ ] 设计统一的API

#### 1.2 抽象公共功能
```javascript
// src/formats/base.js
export class BaseFormatter {
  constructor(document, options) {
    this.document = document;
    this.options = options;
  }
  
  format() {
    throw new Error('Subclass must implement format()');
  }
}
```

### 第二步：实现 Markdown 格式 ⏰ 2小时

#### 2.1 基础Markdown格式化
```markdown
# 标题1
## 标题2

段落文本

- 列表项1
- 列表项2

> 引用内容

[链接文本](URL)

![图片](URL)
```

#### 2.2 功能清单
- [ ] 标题转换（h1-h6 → #）
- [ ] 段落处理
- [ ] 列表格式化（ul, ol）
- [ ] 引用块（blockquote → >）
- [ ] 代码块（code, pre → ```）
- [ ] 链接处理（a → [text](url)）
- [ ] 图片处理（img → ![alt](src)）
- [ ] 粗体/斜体（strong/em → **/** ）
- [ ] 水平线（hr → ---）

### 第三步：实现 XML-TEI 格式 ⏰ 3小时

#### 3.1 TEI结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>{document.title}</title>
        <author>{document.author}</author>
      </titleStmt>
      <publicationStmt>
        <publisher>{document.sitename}</publisher>
        <date>{document.date}</date>
      </publicationStmt>
      <sourceDesc>
        <p>{document.url}</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      {content}
    </body>
  </text>
</TEI>
```

#### 3.2 元素映射
| HTML标签 | TEI标签 |
|---------|---------|
| h1-h6 | head |
| p | p |
| ul/ol | list |
| li | item |
| blockquote | quote |
| em | hi[@rend="italic"] |
| strong | hi[@rend="bold"] |
| code | code |
| table | table |
| img | figure/graphic |

### 第四步：完善其他格式 ⏰ 2小时

#### 4.1 JSON格式增强
```json
{
  "metadata": {
    "title": "...",
    "author": "...",
    "date": "...",
    "url": "...",
    "description": "...",
    "categories": [...],
    "tags": [...]
  },
  "content": {
    "text": "...",
    "html": "...",
    "structured": [
      {"type": "heading", "level": 1, "text": "..."},
      {"type": "paragraph", "text": "..."},
      {"type": "list", "items": [...]}
    ]
  },
  "comments": {...}
}
```

#### 4.2 HTML格式增强
```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <meta name="author" content="{author}">
  <meta name="description" content="{description}">
</head>
<body>
  <article>
    <header>
      <h1>{title}</h1>
      <p class="meta">
        <span class="author">{author}</span>
        <time datetime="{date}">{date}</time>
      </p>
    </header>
    <main>
      {content}
    </main>
  </article>
</body>
</html>
```

#### 4.3 CSV格式完善
```
title,author,date,url,text,description
"标题","作者","2023-01-01","https://...","正文...","描述..."
```

### 第五步：集成到核心流程 ⏰ 1小时

#### 5.1 更新 core.js
```javascript
import * as formats from './formats/index.js';

export function determineReturnString(document, options) {
  const formatters = {
    'xml': formats.XmlTeiFormatter,
    'xmltei': formats.XmlTeiFormatter,
    'markdown': formats.MarkdownFormatter,
    'html': formats.HtmlFormatter,
    'json': formats.JsonFormatter,
    'csv': formats.CsvFormatter,
    'txt': formats.TxtFormatter,
  };
  
  const FormatterClass = formatters[options.format] || formats.TxtFormatter;
  const formatter = new FormatterClass(document, options);
  
  return formatter.format();
}
```

### 第六步：编写测试 ⏰ 2小时

#### 6.1 格式测试
```javascript
// tests/unit/formats/markdown.test.js
describe('Markdown格式化', () => {
  test('应该正确格式化标题', () => {
    // ...
  });
  
  test('应该正确格式化列表', () => {
    // ...
  });
  
  test('应该正确处理链接', () => {
    // ...
  });
});
```

#### 6.2 集成测试
```javascript
// tests/integration/formats.test.js
describe('格式输出集成测试', () => {
  test('应该输出有效的Markdown', async () => {
    const result = await extract(html, {
      output_format: 'markdown'
    });
    expect(result).toMatch(/^# /);
  });
  
  test('应该输出有效的XML-TEI', async () => {
    const result = await extract(html, {
      output_format: 'xml'
    });
    expect(result).toContain('<TEI');
  });
});
```

---

## 🎯 优先级排序

### P0 - 必须实现（本阶段）
1. ⭐⭐⭐ Markdown格式化
2. ⭐⭐⭐ XML-TEI完整实现
3. ⭐⭐ JSON结构化增强

### P1 - 应该实现（本阶段）
4. ⭐⭐ HTML格式增强
5. ⭐ CSV格式完善

### P2 - 可以延后
6. TXT格式优化
7. 自定义模板支持

---

## 📈 预期成果

### 代码规模
| 模块 | 预计行数 |
|------|---------|
| markdown.js | ~300行 |
| xml-tei.js | ~400行 |
| json.js | ~200行 |
| html.js | ~200行 |
| csv.js | ~100行 |
| txt.js | ~150行 |
| base.js | ~100行 |
| **总计** | **~1,450行** |

### 测试覆盖
- 单元测试：50+ 用例
- 集成测试：15+ 用例
- 覆盖率目标：≥80%

---

## ✅ 验收标准

### 功能完整性
- [ ] 所有6种格式都能正常输出
- [ ] Markdown符合CommonMark规范
- [ ] XML-TEI符合TEI P5标准
- [ ] JSON是有效的JSON格式
- [ ] HTML是有效的HTML5
- [ ] CSV符合RFC 4180

### 质量标准
- [ ] 所有测试通过
- [ ] 代码覆盖率≥80%
- [ ] 无ESLint错误
- [ ] 构建成功

### 文档完整性
- [ ] 每种格式都有示例
- [ ] API文档完整
- [ ] 使用指南清晰

---

## 🚀 开始执行

**第一步：创建格式化模块架构**

让我们开始吧！

---

**预计总时间**: 10-12小时  
**目标完成日期**: 1-2天内

