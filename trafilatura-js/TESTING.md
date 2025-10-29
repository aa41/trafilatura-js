# 测试指南

## 🎯 快速开始

### 安装依赖
```bash
npm install
```

### 运行测试

#### 方式 1: 使用 npm scripts（推荐）
```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

#### 方式 2: 使用测试脚本（功能更丰富）
```bash
# 赋予执行权限（首次）
chmod +x scripts/test.sh

# 运行所有测试
./scripts/test.sh

# 查看所有选项
./scripts/test.sh help

# 常用命令
./scripts/test.sh coverage    # 覆盖率报告
./scripts/test.sh watch        # 监听模式
./scripts/test.sh unit         # 只运行单元测试
./scripts/test.sh quick        # 快速测试（只测改动的）
```

## 📊 当前测试状态

### 已实现的测试

| 模块 | 文件 | 测试套件 | 用例数 | 状态 |
|------|------|---------|--------|------|
| 文本工具 | `text-utils.test.js` | 12 | 40+ | ✅ |
| DOM 工具 | `dom-utils.test.js` | 14 | 50+ | ✅ |
| URL 工具 | `url-utils.test.js` | 10 | 35+ | ✅ |
| 配置系统 | `config.test.js` | 4 | 15+ | ✅ |
| **总计** | **4 文件** | **40** | **140+** | **✅** |

### 测试覆盖率目标

所有模块均要求：
- ✅ 分支覆盖率 ≥ 80%
- ✅ 函数覆盖率 ≥ 80%
- ✅ 行覆盖率 ≥ 80%
- ✅ 语句覆盖率 ≥ 80%

## 🧪 测试文件说明

### 1. tests/unit/text-utils.test.js
测试文本处理相关的所有函数。

**核心功能测试**:
- 文本修整和规范化
- HTML 转义/反转义
- Unicode 处理
- 文本清理和验证
- 图片文件检测

**示例**:
```javascript
test('should trim whitespace', () => {
  expect(trim('  hello  world  ')).toBe('hello world');
});

test('should detect image files', () => {
  expect(isImageFile('photo.jpg')).toBe(true);
  expect(isImageFile('document.pdf')).toBe(false);
});
```

### 2. tests/unit/dom-utils.test.js
测试 DOM 操作相关的所有函数。

**核心功能测试**:
- 元素创建和删除
- 标签剥离和清理
- 属性操作
- 元素查找和遍历
- XPath 支持

**示例**:
```javascript
test('should create element with attributes', () => {
  const elem = createElement('div', { class: 'test', id: 'myDiv' });
  expect(elem.className).toBe('test');
  expect(elem.id).toBe('myDiv');
});

test('should strip tags but keep content', () => {
  const parent = createElement('div');
  parent.innerHTML = '<p>Hello <span>world</span>!</p>';
  stripTags(parent, 'span');
  expect(parent.innerHTML).toContain('world');
  expect(parent.innerHTML).not.toContain('<span');
});
```

### 3. tests/unit/url-utils.test.js
测试 URL 处理相关的所有函数。

**核心功能测试**:
- URL 验证和规范化
- 域名提取
- 相对路径处理
- URL 参数解析
- 跟踪参数清理

**示例**:
```javascript
test('should validate URLs', () => {
  expect(isValidUrl('https://example.com')).toBe(true);
  expect(isValidUrl('not-a-url')).toBe(false);
});

test('should clean tracking parameters', () => {
  const url = 'https://example.com?utm_source=test&id=123';
  const clean = cleanUrl(url);
  expect(clean).toContain('id=123');
  expect(clean).not.toContain('utm_source');
});
```

### 4. tests/unit/config.test.js
测试配置系统。

**核心功能测试**:
- Document 类的所有方法
- Extractor 类的配置选项
- 配置合并和默认值
- 日期参数设置

**示例**:
```javascript
test('should create document with metadata', () => {
  const doc = new Document();
  doc.fromDict({ title: '测试', author: '作者' });
  expect(doc.title).toBe('测试');
  expect(doc.author).toBe('作者');
});

test('should handle extractor options', () => {
  const ext = new Extractor({ fast: true, format: 'json' });
  expect(ext.fast).toBe(true);
  expect(ext.format).toBe('json');
});
```

## 📦 测试辅助工具

### tests/helpers/test-utils.js
提供丰富的测试辅助函数：

```javascript
import {
  createElementFromHTML,      // 从 HTML 字符串创建元素
  createDocumentFromHTML,      // 创建完整文档
  createSimpleArticle,         // 生成简单测试文章
  createComplexArticle,        // 生成复杂测试文章
  getCleanText,               // 获取清理后的文本
  expectElementToContainTag,  // 断言包含特定标签
  createMockConfig,           // 创建 mock 配置
  textSimilar,                // 文本相似度比较
} from '../helpers/test-utils.js';
```

### tests/fixtures/sample-articles.js
提供 15+ 种测试用的样本文章：

```javascript
import {
  simpleArticle,          // 简单文章
  articleWithMetadata,    // 带元数据
  articleWithLists,       // 包含列表
  articleWithTable,       // 包含表格
  articleWithQuotes,      // 包含引用
  articleWithCode,        // 包含代码
  articleWithComments,    // 包含评论
  noisyArticle,          // 带噪音（广告等）
  realWorldExample,       // 真实博客文章示例
} from '../fixtures/sample-articles.js';
```

每个示例都包含：
- `html` - 原始 HTML
- `expected` - 期望的提取结果

## 🎨 自定义 Jest 匹配器

### tests/setup.js 中定义

```javascript
// 检查是否为有效 HTML
expect('<div>Test</div>').toBeValidHtml();

// 检查元素文本内容
expect(element).toHaveTextContent('Hello');

// 检查是否为 DOM 元素
expect(element).toBeElement();
```

## 🔧 测试配置

### jest.config.js
主要配置：
- 测试环境：jsdom（模拟浏览器）
- 覆盖率阈值：80%
- 测试文件模式：`**/*.test.js`
- 设置文件：`tests/setup.js`

### .babelrc.js
Babel 配置：
- 预设：@babel/preset-env
- 目标：当前 Node.js 版本

## 📝 编写新测试的最佳实践

### 1. 测试文件结构
```javascript
/**
 * 模块描述
 */
import { functionToTest } from '../../src/module/file.js';

describe('module-name', () => {
  describe('functionToTest()', () => {
    test('should do expected behavior', () => {
      // Arrange - 准备
      const input = 'test input';
      
      // Act - 执行
      const result = functionToTest(input);
      
      // Assert - 断言
      expect(result).toBe('expected output');
    });

    test('should handle edge cases', () => {
      expect(functionToTest(null)).toBeNull();
      expect(functionToTest('')).toBe('');
    });
  });
});
```

### 2. 测试命名规范
- **describe**: 模块或类名
- **test**: "should + 动词 + 期望的行为"

✅ 好的命名：
```javascript
test('should extract title from HTML')
test('should handle empty input gracefully')
test('should throw error for invalid URL')
```

❌ 不好的命名：
```javascript
test('test1')
test('it works')
test('checking the function')
```

### 3. 测试范围
每个测试应该测试一个明确的行为：

```javascript
// ✅ 好 - 测试单一行为
test('should trim leading whitespace', () => {
  expect(trim('  hello')).toBe('hello');
});

test('should trim trailing whitespace', () => {
  expect(trim('hello  ')).toBe('hello');
});

// ❌ 不好 - 测试多个行为
test('should trim whitespace and convert to lowercase', () => {
  const result = processText('  HELLO  ');
  expect(result).toBe('hello');
});
```

### 4. 测试边界情况
```javascript
describe('divide()', () => {
  test('should divide positive numbers', () => {
    expect(divide(6, 2)).toBe(3);
  });

  test('should handle zero dividend', () => {
    expect(divide(0, 5)).toBe(0);
  });

  test('should throw on division by zero', () => {
    expect(() => divide(5, 0)).toThrow();
  });

  test('should handle negative numbers', () => {
    expect(divide(-6, 2)).toBe(-3);
  });

  test('should handle decimals', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

### 5. 使用测试数据
```javascript
import { simpleArticle } from '../fixtures/sample-articles.js';
import { createDocumentFromHTML } from '../helpers/test-utils.js';

test('should extract article content', () => {
  const doc = createDocumentFromHTML(simpleArticle.html);
  const result = extract(doc);
  
  expect(result.title).toBe(simpleArticle.expected.title);
  expect(result.text).toContain(simpleArticle.expected.text);
});
```

## 🐛 调试测试

### 1. 运行单个测试
```bash
# 只运行这一个测试
test.only('should do something', () => {
  // ...
});

# 跳过这个测试
test.skip('should do something else', () => {
  // ...
});
```

### 2. 查看详细输出
```bash
npm test -- --verbose
```

### 3. 使用 Node.js 调试器
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

然后在 Chrome 访问 `chrome://inspect`

### 4. 打印调试信息
```javascript
test('debug test', () => {
  const result = someFunction();
  console.log('Result:', result);  // 会在测试输出中显示
  expect(result).toBeTruthy();
});
```

## 📈 提升覆盖率的技巧

### 1. 查看未覆盖的代码
```bash
npm run test:coverage
# 打开 coverage/lcov-report/index.html
```

### 2. 针对性补充测试
找到覆盖率低的文件和行，补充相应的测试用例。

### 3. 测试错误路径
```javascript
function processData(data) {
  if (!data) {
    throw new Error('Data required');  // 要测试这个分支
  }
  return transform(data);
}

// 需要同时测试成功和失败情况
test('should process valid data', () => {
  expect(processData({ value: 1 })).toBeTruthy();
});

test('should throw for missing data', () => {
  expect(() => processData(null)).toThrow('Data required');
});
```

## 🎯 运行特定测试

```bash
# 运行特定文件
npm test -- text-utils.test.js

# 运行匹配模式的测试
npm test -- -t "trim"

# 运行特定套件
npm test -- -t "text-utils"

# 只运行失败的测试
npm test -- --onlyFailures

# 只运行改动文件的测试
npm test -- --onlyChanged
```

## 📚 更多资源

- [Jest 官方文档](https://jestjs.io/)
- [Jest DOM 匹配器](https://github.com/testing-library/jest-dom)
- [JavaScript 测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [tests/README.md](./tests/README.md) - 详细的测试套件文档

## 💡 小贴士

1. **先写测试** - TDD（测试驱动开发）能帮助你更好地设计 API
2. **保持测试简单** - 一个测试只测试一件事
3. **使用有意义的名称** - 测试名称就是文档
4. **不要测试实现细节** - 测试行为，而不是实现
5. **定期运行测试** - 在开发时使用 watch 模式
6. **关注覆盖率** - 但不要为了覆盖率而测试

---

**Happy Testing! 🎉**

如有问题，请查看 [tests/README.md](./tests/README.md) 或提出 Issue。

