# Trafilatura JavaScript 移植计划

## 项目概述

将 Python 版本的 trafilatura (v2.0.0) 移植到 JavaScript，专门针对浏览器环境，直接操作当前页面的 document 对象进行文本提取。

## 核心功能范围

### 包含的功能（浏览器环境核心）
1. ✅ **文本内容提取** - 主要文本内容识别和提取
2. ✅ **元数据提取** - 标题、作者、日期、描述、标签等
3. ✅ **HTML 处理** - 标签清理、转换、链接密度分析
4. ✅ **格式化输出** - 支持 TXT、Markdown、JSON、HTML 输出
5. ✅ **评论提取** - 识别并提取评论区内容
6. ✅ **表格支持** - 表格内容提取
7. ✅ **图片支持** - 图片元数据提取
8. ✅ **链接保留** - 可选保留链接信息

### 排除的功能（服务器端网络功能）
- ❌ 网络下载 (downloads.py)
- ❌ 爬虫功能 (spider.py)
- ❌ Sitemap 解析 (sitemaps.py)
- ❌ Feed 解析 (feeds.py)
- ❌ 跨文档去重 (deduplication.py)

## 技术架构

### Python → JavaScript 映射

| Python 组件 | JavaScript 替代方案 | 说明 |
|------------|-------------------|------|
| lxml.html | DOM API + DOMParser | 浏览器原生 DOM 操作 |
| lxml.etree.XPath | document.evaluate() + querySelector | XPath + CSS选择器 |
| jusText | 自实现算法 | 基于密度的文本提取 |
| htmldate | 自实现日期提取 | 正则+DOM查询 |
| courlan | URL API | 浏览器原生 URL 处理 |
| charset_normalizer | TextDecoder | 浏览器原生字符集 |
| py3langid | 可选集成 | 语言检测库 |

### 模块结构设计

```
trafilatura-js/
├── src/
│   ├── core/
│   │   ├── extractor.js       # 核心提取逻辑 (core.py)
│   │   ├── main-extractor.js  # 主提取器 (main_extractor.py)
│   │   └── baseline.js        # 基线提取 (baseline.py)
│   ├── processing/
│   │   ├── html-processing.js # HTML处理 (htmlprocessing.py)
│   │   ├── metadata.js        # 元数据提取 (metadata.py)
│   │   ├── json-metadata.js   # JSON-LD 解析
│   │   └── xpath.js           # XPath 表达式定义
│   ├── utils/
│   │   ├── dom-utils.js       # DOM 工具函数
│   │   ├── text-utils.js      # 文本处理 (utils.py)
│   │   └── url-utils.js       # URL 处理
│   ├── output/
│   │   ├── xml-builder.js     # XML 输出构建
│   │   ├── json-builder.js    # JSON 输出
│   │   ├── markdown.js        # Markdown 输出
│   │   └── html-builder.js    # HTML 输出
│   ├── settings/
│   │   ├── config.js          # 配置管理
│   │   └── constants.js       # 常量定义
│   └── index.js               # 主入口
├── tests/
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   └── fixtures/              # 测试数据
├── examples/                  # 示例代码
├── docs/                      # 文档
├── package.json
├── rollup.config.js           # 打包配置
└── README.md
```

## 分阶段实现计划

### 第一阶段：基础架构 (Week 1-2)

**目标**：建立项目结构，实现基础工具函数

#### 任务清单
1. [ ] 项目初始化
   - [ ] 创建 package.json
   - [ ] 配置构建工具 (Rollup/Webpack)
   - [ ] 设置测试框架 (Jest/Vitest)
   - [ ] 配置 ESLint + Prettier

2. [ ] 工具函数层 (utils/)
   - [ ] dom-utils.js: DOM 树遍历、节点操作
   - [ ] text-utils.js: 文本清理、规范化、trim
   - [ ] url-utils.js: URL 解析和处理

3. [ ] 配置系统 (settings/)
   - [ ] config.js: 提取选项配置
   - [ ] constants.js: XPath、正则、标签定义

**测试要求**：
- 单元测试覆盖率 > 80%
- 所有工具函数需有测试用例

### 第二阶段：HTML 处理 (Week 3-4)

**目标**：实现 HTML 清理和转换功能

#### 任务清单
1. [ ] HTML 处理器 (processing/html-processing.js)
   - [ ] 实现 tree_cleaning: 删除不需要的元素
   - [ ] 实现 prune_html: 清理空元素
   - [ ] 实现 convert_tags: 标签标准化转换
   - [ ] 实现 link_density_test: 链接密度计算
   - [ ] 实现 delete_by_link_density: 基于链接密度删除

2. [ ] XPath 表达式 (processing/xpath.js)
   - [ ] 移植所有 XPath 定义
   - [ ] 提供 XPath 执行辅助函数
   - [ ] CSS 选择器替代方案

**测试要求**：
- 使用真实 HTML 片段测试
- 验证清理后的 DOM 结构正确

### 第三阶段：元数据提取 (Week 5-6)

**目标**：提取页面元数据

#### 任务清单
1. [ ] 元数据提取器 (processing/metadata.js)
   - [ ] extract_metadata: 主函数
   - [ ] examine_meta: Meta 标签解析
   - [ ] extract_opengraph: OpenGraph 协议
   - [ ] extract_title: 标题提取
   - [ ] extract_author: 作者识别
   - [ ] extract_url: 规范 URL
   - [ ] extract_catstags: 分类和标签

2. [ ] JSON-LD 解析 (processing/json-metadata.js)
   - [ ] extract_json: JSON-LD 数据提取
   - [ ] normalize_authors: 作者名规范化
   - [ ] normalize_json: JSON 文本清理

3. [ ] 日期提取
   - [ ] 基础日期模式识别
   - [ ] Meta 标签日期解析
   - [ ] 内容中日期提取

**测试要求**：
- 测试各种元数据格式
- 验证 OpenGraph、Twitter Cards、Schema.org

### 第四阶段：核心提取器 (Week 7-9)

**目标**：实现主要内容提取算法

#### 任务清单
1. [ ] 基线提取器 (core/baseline.js)
   - [ ] baseline: 简单段落提取
   - [ ] html2txt: 基本文本提取
   - [ ] JSON articleBody 提取

2. [ ] 主提取器 (core/main-extractor.js)
   - [ ] extract_content: 核心提取逻辑
   - [ ] handle_paragraphs: 段落处理
   - [ ] handle_titles: 标题处理
   - [ ] handle_lists: 列表处理
   - [ ] handle_quotes: 引用和代码块
   - [ ] handle_tables: 表格处理
   - [ ] handle_formatting: 格式化元素
   - [ ] extract_comments: 评论提取
   - [ ] recover_wild_text: 恢复遗漏文本

3. [ ] 核心协调器 (core/extractor.js)
   - [ ] extract: 主入口函数
   - [ ] bare_extraction: 返回数据对象
   - [ ] extract_with_metadata: 包含元数据
   - [ ] trafilatura_sequence: 提取流程

**测试要求**：
- 使用真实网页测试
- 对比 Python 版本结果
- 准确率测试

### 第五阶段：输出格式 (Week 10)

**目标**：支持多种输出格式

#### 任务清单
1. [ ] 输出构建器 (output/)
   - [ ] json-builder.js: JSON 输出
   - [ ] markdown.js: Markdown 转换
   - [ ] html-builder.js: HTML 输出
   - [ ] xml-builder.js: XML/TEI 输出

2. [ ] 格式化选项
   - [ ] 保留格式化标记
   - [ ] 链接处理
   - [ ] 图片属性

**测试要求**：
- 验证各种格式输出正确
- 特殊字符转义测试

### 第六阶段：集成和优化 (Week 11-12)

**目标**：整合所有模块，性能优化

#### 任务清单
1. [ ] 完整集成测试
   - [ ] 端到端测试用例
   - [ ] 与 Python 版本对比测试
   - [ ] 边界情况测试

2. [ ] 性能优化
   - [ ] DOM 操作优化
   - [ ] 算法性能调优
   - [ ] 内存使用优化

3. [ ] 浏览器兼容性
   - [ ] 现代浏览器测试
   - [ ] Polyfill 集成

4. [ ] 文档完善
   - [ ] API 文档
   - [ ] 使用示例
   - [ ] 迁移指南

## 质量保证

### 测试策略

1. **单元测试**
   - 每个函数独立测试
   - Mock DOM 环境 (JSDOM)
   - 覆盖率 > 80%

2. **集成测试**
   - 完整提取流程测试
   - 真实网页测试
   - 与 Python 版本结果对比

3. **性能测试**
   - 大型页面处理速度
   - 内存占用监控
   - 浏览器性能分析

### 对比验证

创建测试套件，使用相同的 HTML 输入：
- Python 版本输出
- JavaScript 版本输出
- 差异分析和修正

## 技术难点与解决方案

### 1. XPath 支持

**问题**：浏览器 XPath 支持不如 lxml 完整

**方案**：
- 优先使用 `document.evaluate()`
- 复杂 XPath 用 CSS 选择器替代
- 实现自定义 XPath 辅助函数

### 2. 文本提取算法

**问题**：jusText 算法需要完整移植

**方案**：
- 研究 jusText 原理
- 参考现有 JS 实现
- 自实现核心算法

### 3. 日期提取

**问题**：htmldate 功能复杂

**方案**：
- 实现常见日期格式识别
- Meta 标签优先
- 正则模式匹配

### 4. DOM vs lxml

**问题**：API 差异大

**方案**：
- 创建统一的树操作抽象层
- 提供类似 lxml 的 API
- 文档化 API 差异

## 项目配置

### package.json 依赖

```json
{
  "dependencies": {
    // 核心功能无需外部依赖，使用浏览器原生 API
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-terser": "^0.4.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "jsdom": "^22.0.0",
    "prettier": "^3.0.0",
    "rollup": "^4.0.0"
  }
}
```

### 构建目标

- **UMD**: 浏览器 `<script>` 标签使用
- **ESM**: 现代模块系统
- **Types**: TypeScript 类型定义

## 里程碑

| 阶段 | 时间 | 交付物 | 完成标准 |
|-----|------|--------|---------|
| 阶段1 | 2周 | 基础架构 | 项目可运行，工具函数完成 |
| 阶段2 | 2周 | HTML处理 | 清理和转换功能正常 |
| 阶段3 | 2周 | 元数据提取 | 元数据提取准确率>90% |
| 阶段4 | 3周 | 核心提取 | 基本内容提取可用 |
| 阶段5 | 1周 | 输出格式 | 支持主要输出格式 |
| 阶段6 | 2周 | 集成优化 | 性能达标，文档完善 |

## 下一步行动

1. ✅ 创建项目目录结构
2. ✅ 初始化 package.json
3. ✅ 设置构建和测试环境
4. ✅ 实现第一批工具函数
5. ✅ 编写初始测试用例

## 成功指标

- [ ] 核心功能完整实现
- [ ] 测试覆盖率 > 80%
- [ ] 与 Python 版本准确率差异 < 5%
- [ ] 性能：处理普通页面 < 100ms
- [ ] 文档完整，易于使用
- [ ] 支持主流浏览器

## 备注

- 优先保证正确性，其次考虑性能
- 保持与 Python 版本 API 的相似性
- 代码清晰可读，便于维护
- 完善的文档和示例

