# Trafilatura.js 开发指南

## 开发环境设置

### 前置要求

- Node.js 14.0.0 或更高版本
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
```

### 开发模式

开发时启用 watch 模式，自动重新构建：

```bash
npm run dev
```

### 构建

构建生产版本：

```bash
npm run build
```

生成的文件位于 `dist/` 目录：
- `trafilatura.umd.js` - UMD 格式（浏览器 `<script>` 标签）
- `trafilatura.esm.js` - ES Module 格式
- `trafilatura.cjs.js` - CommonJS 格式

## 运行测试

### 运行所有测试

```bash
npm test
```

### 监听模式

开发时持续运行测试：

```bash
npm run test:watch
```

### 测试覆盖率

```bash
npm run test:coverage
```

覆盖率报告位于 `coverage/` 目录。

## 代码质量

### Linting

```bash
npm run lint
```

自动修复：

```bash
npm run lint:fix
```

### 格式化

```bash
npm run format
```

## 项目结构

```
trafilatura-js/
├── src/                    # 源代码
│   ├── core/              # 核心提取逻辑
│   ├── processing/        # HTML 和元数据处理
│   ├── utils/             # 工具函数
│   ├── output/            # 输出格式
│   ├── settings/          # 配置
│   └── index.js           # 主入口
├── tests/                 # 测试文件
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── fixtures/         # 测试数据
├── examples/             # 示例代码
├── docs/                 # 文档
└── dist/                 # 构建输出（生成）
```

## 开发工作流

### 1. 创建新功能

1. 在相应模块目录创建文件（如 `src/utils/new-feature.js`）
2. 编写代码和 JSDoc 注释
3. 在 `tests/unit/` 创建对应测试文件
4. 运行测试确保通过
5. 更新主入口 `src/index.js` 导出新功能

### 2. 修复 Bug

1. 在 `tests/` 添加重现 bug 的测试用例
2. 确认测试失败
3. 修复代码
4. 确认测试通过
5. 提交代码

### 3. 重构代码

1. 确保现有测试完整
2. 进行重构
3. 确保所有测试仍然通过
4. 更新文档（如有必要）

## 编码规范

### JavaScript 风格

- 使用 ES6+ 语法
- 使用单引号
- 使用 2 空格缩进
- 行尾使用分号
- 最大行长度 100 字符

### 命名约定

- 变量和函数：小驼峰 `camelCase`
- 类：大驼峰 `PascalCase`
- 常量：大写下划线 `UPPER_SNAKE_CASE`
- 私有成员：前缀下划线 `_privateMethod`

### 注释

使用 JSDoc 风格注释：

```javascript
/**
 * 提取文本内容
 * 
 * @param {Document} document - DOM 文档对象
 * @param {Object} options - 提取选项
 * @param {boolean} options.fast - 快速模式
 * @returns {string|null} 提取的文本
 */
export function extract(document, options = {}) {
  // 实现...
}
```

### 测试

- 每个公共函数都应有测试
- 测试文件名：`*.test.js`
- 测试结构：`describe` / `test` 或 `it`
- 使用描述性的测试名称

示例：

```javascript
describe('extract()', () => {
  test('should extract text from simple HTML', () => {
    const doc = parseHTML('<p>Hello world</p>');
    const result = extract(doc);
    expect(result).toBe('Hello world');
  });

  test('should handle empty document', () => {
    const doc = parseHTML('');
    const result = extract(doc);
    expect(result).toBeNull();
  });
});
```

## 调试

### 浏览器调试

1. 在 `examples/` 目录创建 HTML 文件
2. 使用本地服务器打开（如 `npx serve`）
3. 在浏览器开发者工具中调试

### Node.js 调试

使用 Node.js inspector：

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

然后在 Chrome 访问 `chrome://inspect`

## 性能优化

### 基准测试

TODO: 添加性能基准测试

### 性能考虑

1. 避免不必要的 DOM 操作
2. 缓存频繁访问的 DOM 元素
3. 使用文档片段批量插入
4. 避免强制同步布局

## 提交代码

### Commit 消息格式

```
类型(范围): 简短描述

详细描述（可选）

相关 Issue: #123
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：

```
feat(extractor): 实现基线文本提取功能

- 添加 baseline() 函数
- 添加 html2txt() 函数
- 完善单元测试

相关 Issue: #1
```

## 发布流程

1. 更新版本号：`npm version [major|minor|patch]`
2. 运行完整测试：`npm test`
3. 构建生产版本：`npm run build`
4. 提交更改
5. 发布：`npm publish`（如果配置了）

## 常见问题

### 测试失败

1. 检查是否安装了所有依赖
2. 清除缓存：`npm run test -- --clearCache`
3. 检查 Node.js 版本

### 构建错误

1. 删除 `node_modules` 和 `package-lock.json`
2. 重新安装：`npm install`
3. 重新构建：`npm run build`

## 资源

- [MDN Web Docs](https://developer.mozilla.org/) - Web API 文档
- [Jest 文档](https://jestjs.io/) - 测试框架
- [Rollup 文档](https://rollupjs.org/) - 构建工具
- [Trafilatura Python](https://github.com/adbar/trafilatura) - 原始项目

## 获取帮助

- 查看 [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- 参考 Python 版本实现
- 提出 Issue 或 Pull Request

