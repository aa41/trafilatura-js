# 📚 Trafilatura Browser API文档

**版本**: 1.0.0  
**更新时间**: 2025-10-30

---

## 📋 目录

- [核心API](#核心api)
- [配置类](#配置类)
- [输出格式化](#输出格式化)
- [提取函数](#提取函数)
- [工具函数](#工具函数)
- [常量和配置](#常量和配置)

---

## 核心API

### extract()

从HTML中提取内容并转换为指定格式。

**签名**:
```javascript
extract(htmlContent, options?) → string|null
```

**参数**:
- `htmlContent` (string|Element): HTML字符串或DOM元素
- `options` (Object|Extractor): 提取选项

**返回**: 提取的内容字符串，失败返回null

**示例**:
```javascript
import { extract } from 'trafilatura-browser';

// 基础使用
const text = extract(htmlString);

// 带配置
const result = extract(htmlString, {
  format: 'markdown',
  with_metadata: true,
  include_formatting: true
});

// 使用Extractor对象
const extractor = new Extractor({
  format: 'json',
  with_metadata: true
});
const json = extract(htmlString, extractor);
```

**支持的选项**:

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `format` | string | 'txt' | 输出格式: txt, markdown, json, csv, xml, tei |
| `with_metadata` | boolean | false | 是否包含元数据 |
| `include_formatting` | boolean | false | 是否包含格式化（Markdown） |
| `include_comments` | boolean | true | 是否提取评论 |
| `include_tables` | boolean | true | 是否包含表格 |
| `include_links` | boolean | false | 是否保留链接 |
| `include_images` | boolean | false | 是否包含图片 |
| `favor_precision` | boolean | false | 倾向精确度（更少但更准确的内容） |
| `favor_recall` | boolean | false | 倾向召回率（更多内容） |
| `target_language` | string | null | 目标语言（ISO 639-1） |
| `url` | string | null | 页面URL |
| `deduplicate` | boolean | false | 是否去重 |
| `only_with_metadata` | boolean | false | 仅保留有完整元数据的文档 |
| `author_blacklist` | Set | new Set() | 作者黑名单 |
| `url_blacklist` | Set | new Set() | URL黑名单 |

---

### bareExtraction()

简化版提取函数，只提取纯文本，不包含元数据。

**签名**:
```javascript
bareExtraction(htmlContent, options?) → string|null
```

**参数**:
- `htmlContent` (string|Element): HTML字符串或DOM元素
- `options` (Object): 简化的选项

**返回**: 提取的文本字符串，失败返回null

**示例**:
```javascript
import { bareExtraction } from 'trafilatura-browser';

// 快速提取纯文本
const text = bareExtraction(htmlString);

// 提取Markdown
const markdown = bareExtraction(htmlString, {
  formatting: true
});
```

**支持的选项**:

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `formatting` | boolean | false | 是否包含Markdown格式 |
| `include_tables` | boolean | true | 是否包含表格 |
| `fast` | boolean | false | 快速模式 |

---

## 配置类

### Extractor

提取器配置类，用于管理所有提取选项。

**签名**:
```javascript
new Extractor(options?)
```

**示例**:
```javascript
import { Extractor } from 'trafilatura-browser';

const extractor = new Extractor({
  format: 'markdown',
  with_metadata: true,
  favor_precision: true,
  target_language: 'zh'
});

// 使用配置
const result = extract(html, extractor);
```

**属性**:
- `format` (string): 输出格式
- `fast` (boolean): 快速模式
- `focus` (string): 'balanced', 'precision', 'recall'
- `comments` (boolean): 提取评论
- `formatting` (boolean): 格式化输出
- `links` (boolean): 保留链接
- `images` (boolean): 包含图片
- `tables` (boolean): 包含表格
- `dedup` (boolean): 去重
- `lang` (string): 目标语言
- `with_metadata` (boolean): 包含元数据
- `author_blacklist` (Set): 作者黑名单
- `url_blacklist` (Set): URL黑名单
- ... 其他配置项

---

### Document

文档数据类，存储提取的内容和元数据。

**签名**:
```javascript
new Document(options?)
```

**示例**:
```javascript
import { Document } from 'trafilatura-browser';

const doc = new Document({
  title: '文章标题',
  author: '作者',
  url: 'https://example.com',
  body: bodyElement
});

// 从字典创建
const doc2 = Document.fromDict({
  title: '标题',
  text: '内容'
});

// 转换为字典
const dict = doc.toDict();
```

**属性**:
- `title` (string): 标题
- `author` (string): 作者
- `url` (string): URL
- `hostname` (string): 主机名
- `description` (string): 描述
- `sitename` (string): 网站名
- `date` (string): 日期
- `categories` (Array): 分类
- `tags` (Array): 标签
- `body` (Element): 正文DOM
- `commentsbody` (Element): 评论DOM
- `text` (string): 纯文本
- `language` (string): 语言
- ... 其他字段

---

## 输出格式化

### determineReturnString()

根据配置选择输出格式。

**签名**:
```javascript
determineReturnString(document, options) → string
```

**参数**:
- `document` (Document): Document对象
- `options` (Extractor): 配置选项

**返回**: 格式化的输出字符串

---

### xmlToTxt()

将XML DOM转换为纯文本或Markdown。

**签名**:
```javascript
xmlToTxt(element, formatting) → string
```

**参数**:
- `element` (Element): XML/HTML元素
- `formatting` (boolean): 是否启用Markdown格式

**返回**: 文本字符串

---

### buildJsonOutput()

构建JSON格式输出。

**签名**:
```javascript
buildJsonOutput(document, with_metadata) → string
```

**参数**:
- `document` (Document): Document对象
- `with_metadata` (boolean): 是否包含元数据

**返回**: JSON字符串

---

### xmlToCsv()

构建CSV格式输出。

**签名**:
```javascript
xmlToCsv(document, formatting, delimiter?, null_value?) → string
```

**参数**:
- `document` (Document): Document对象
- `formatting` (boolean): 是否格式化
- `delimiter` (string): 分隔符，默认'\t'
- `null_value` (string): null值表示，默认''

**返回**: CSV字符串

---

### writeTeiTree()

构建TEI-XML输出。

**签名**:
```javascript
writeTeiTree(document) → Element
```

**参数**:
- `document` (Document): Document对象

**返回**: TEI-XML DOM元素

---

## 提取函数

### extractMetadata()

提取HTML元数据。

**签名**:
```javascript
extractMetadata(tree, url?, date_params?, fast?, author_blacklist?) → Document
```

**参数**:
- `tree` (Element): HTML DOM树
- `url` (string): 页面URL
- `date_params` (Object): 日期提取参数
- `fast` (boolean): 快速模式
- `author_blacklist` (Set): 作者黑名单

**返回**: Document对象（包含元数据）

---

### extractContent()

提取主要内容。

**签名**:
```javascript
extractContent(tree, options) → Object
```

**参数**:
- `tree` (Element): 清理后的DOM树
- `options` (Extractor): 提取选项

**返回**: `{ body, text, length }`

---

### baseline()

基础提取（兜底方案）。

**签名**:
```javascript
baseline(tree) → Object
```

**参数**:
- `tree` (Element): HTML DOM树

**返回**: `{ body, text, length }`

---

## 工具函数

### loadHtml()

加载HTML字符串为DOM。

**签名**:
```javascript
loadHtml(htmlString) → Element|null
```

**参数**:
- `htmlString` (string): HTML字符串

**返回**: DOM元素或null

---

### treeCleaning()

清理HTML DOM树。

**签名**:
```javascript
treeCleaning(tree, options?) → Element
```

**参数**:
- `tree` (Element): HTML DOM树
- `options` (Extractor): 清理选项

**返回**: 清理后的DOM树

---

### trim()

修剪字符串空白。

**签名**:
```javascript
trim(text) → string
```

**参数**:
- `text` (string): 输入文本

**返回**: 修剪后的文本

---

### sanitize()

清理文本内容。

**签名**:
```javascript
sanitize(text) → string
```

**参数**:
- `text` (string): 输入文本

**返回**: 清理后的文本

---

## 常量和配置

### SUPPORTED_FORMATS

支持的输出格式集合。

```javascript
Set(['txt', 'markdown', 'json', 'csv', 'xml', 'xmltei', 'tei', 'python'])
```

---

### MIN_EXTRACTED_SIZE

最小提取大小（默认200字符）。

---

### MIN_OUTPUT_SIZE

最小输出大小（默认10字符）。

---

## 使用示例

### 示例1：基础提取

```javascript
import { extract } from 'trafilatura-browser';

const html = '<html><body><article><p>文章内容</p></article></body></html>';
const text = extract(html);
console.log(text); // "文章内容"
```

---

### 示例2：Markdown提取

```javascript
import { extract } from 'trafilatura-browser';

const result = extract(html, {
  format: 'markdown',
  with_metadata: true,
  include_formatting: true
});

console.log(result);
/*
---
title: 文章标题
author: 作者
---

# 主标题

文章内容...
*/
```

---

### 示例3：JSON提取

```javascript
import { extract } from 'trafilatura-browser';

const json = extract(html, {
  format: 'json',
  with_metadata: true
});

const data = JSON.parse(json);
console.log(data.title);
console.log(data.text);
```

---

### 示例4：批量处理

```javascript
import { bareExtraction } from 'trafilatura-browser';

const htmlList = [html1, html2, html3, ...];
const results = htmlList.map(html => bareExtraction(html));
```

---

### 示例5：高级配置

```javascript
import { Extractor, extract } from 'trafilatura-browser';

const extractor = new Extractor({
  format: 'markdown',
  with_metadata: true,
  favor_precision: true,
  target_language: 'zh',
  include_tables: true,
  include_links: true,
  author_blacklist: new Set(['spam', 'bot']),
  url_blacklist: new Set(['http://spam.com'])
});

const result = extract(html, extractor);
```

---

## 错误处理

所有提取函数在失败时返回`null`：

```javascript
const result = extract(html);

if (result === null) {
  console.error('提取失败');
} else {
  console.log('提取成功:', result);
}
```

---

## 类型定义

如果需要TypeScript类型定义，请参考：

```typescript
declare function extract(
  htmlContent: string | Element,
  options?: Partial<ExtractorOptions>
): string | null;

declare function bareExtraction(
  htmlContent: string | Element,
  options?: { formatting?: boolean; include_tables?: boolean; fast?: boolean }
): string | null;

interface ExtractorOptions {
  format: 'txt' | 'markdown' | 'json' | 'csv' | 'xml' | 'tei';
  with_metadata: boolean;
  include_formatting: boolean;
  include_comments: boolean;
  include_tables: boolean;
  include_links: boolean;
  include_images: boolean;
  favor_precision: boolean;
  favor_recall: boolean;
  target_language: string | null;
  // ... 更多选项
}
```

---

## 相关资源

- [README](./README.md) - 项目说明
- [QUICKSTART](./QUICKSTART.md) - 快速开始
- [PHASE7_TODO](./PHASE7_TODO.md) - 待完善功能
- [GitHub](https://github.com/adbar/trafilatura) - Python原版

---

*最后更新: 2025-10-30*

