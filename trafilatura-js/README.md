# Trafilatura.js

> JavaScript port of [Trafilatura](https://github.com/adbar/trafilatura) - Web content extraction for browsers

## 🚧 开发中 (Work in Progress)

本项目正在将 Python 版本的 Trafilatura 移植到 JavaScript，专门针对浏览器环境进行优化。

## 项目目标

将 Trafilatura 的核心文本提取功能移植到 JavaScript，使其能够：

- ✅ 在浏览器环境中直接运行
- ✅ 直接操作当前页面的 DOM
- ✅ 提取主要文本内容
- ✅ 提取页面元数据
- ✅ 支持多种输出格式

## 功能特性

### 已实现
- [ ] 基础文本提取
- [ ] 元数据提取（标题、作者、日期等）
- [ ] HTML 清理和标准化
- [ ] 多种输出格式（TXT, Markdown, JSON, HTML）

### 计划中
- [ ] 评论提取
- [ ] 表格提取
- [ ] 图片信息提取
- [ ] 链接保留选项
- [ ] 语言检测

### 不包含（服务器端功能）
- ❌ 网络请求和下载
- ❌ 网络爬虫
- ❌ Sitemap 解析
- ❌ Feed 解析

## 安装

```bash
npm install trafilatura-js
```

或通过 CDN:

```html
<script src="https://unpkg.com/trafilatura-js/dist/trafilatura.umd.js"></script>
```

## 快速开始

### 基本使用

```javascript
import { extract } from 'trafilatura-js';

// 提取当前页面内容
const text = extract(document);
console.log(text);
```

### 提取元数据

```javascript
import { extractWithMetadata } from 'trafilatura-js';

const result = extractWithMetadata(document, {
  includeComments: true,
  includeTables: true,
  outputFormat: 'json'
});

console.log(result.metadata);
console.log(result.text);
```

### 自定义配置

```javascript
import { extract } from 'trafilatura-js';

const text = extract(document, {
  favorPrecision: true,      // 偏向精确性
  favorRecall: false,         // 偏向召回率
  includeFormatting: true,    // 保留格式化
  includeLinks: true,         // 保留链接
  includeImages: true,        // 包含图片
  includeTables: true,        // 包含表格
  outputFormat: 'markdown'    // 输出格式
});
```

## API 文档

### `extract(document, options?)`

提取文本内容并返回字符串。

**参数:**
- `document` (Document): DOM Document 对象
- `options` (Object, 可选): 提取选项
  - `outputFormat` (string): 输出格式 - 'txt', 'markdown', 'json', 'html', 'xml'
  - `favorPrecision` (boolean): 偏向精确性，减少噪音
  - `favorRecall` (boolean): 偏向召回率，提取更多内容
  - `includeComments` (boolean): 提取评论内容
  - `includeTables` (boolean): 包含表格
  - `includeImages` (boolean): 包含图片信息
  - `includeFormatting` (boolean): 保留格式化标记
  - `includeLinks` (boolean): 保留链接

**返回:**
- `string`: 提取的文本内容

### `extractWithMetadata(document, options?)`

提取内容和元数据。

**返回:**
- `Object`: 包含以下字段的对象
  - `text` (string): 提取的文本
  - `metadata` (Object): 元数据对象
    - `title` (string): 页面标题
    - `author` (string): 作者
    - `date` (string): 发布日期
    - `description` (string): 描述
    - `sitename` (string): 站点名称
    - `tags` (Array): 标签
    - `categories` (Array): 分类
    - `url` (string): 页面URL
    - `image` (string): 主图片URL

### `bareExtraction(document, options?)`

底层提取函数，返回内部数据结构。

**返回:**
- `Object`: Document 对象，包含提取的所有信息

## 开发

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
npm test
npm run test:coverage
```

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

## 项目结构

```
trafilatura-js/
├── src/
│   ├── core/              # 核心提取逻辑
│   ├── processing/        # HTML 和元数据处理
│   ├── utils/             # 工具函数
│   ├── output/            # 输出格式转换
│   ├── settings/          # 配置和常量
│   └── index.js           # 主入口
├── tests/                 # 测试文件
├── examples/              # 示例代码
└── docs/                  # 文档
```

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 与 Python 版本的差异

1. **环境差异**: 仅支持浏览器环境，不支持 Node.js 服务器端
2. **网络功能**: 不包含下载、爬虫等网络功能
3. **DOM 解析**: 使用浏览器原生 DOM API 而非 lxml
4. **语言检测**: 可选功能，需额外引入库

## 贡献

欢迎贡献代码！请查看 [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) 了解当前进度。

## 许可证

Apache-2.0 License

## 致谢

本项目是 [Trafilatura](https://github.com/adbar/trafilatura) 的 JavaScript 移植版本。

原始 Python 版本由 Adrien Barbaresi 开发和维护。

## 相关链接

- [Trafilatura (Python)](https://github.com/adbar/trafilatura)
- [Trafilatura 文档](https://trafilatura.readthedocs.io)
- [移植计划](./MIGRATION_PLAN.md)

